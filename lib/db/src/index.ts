import admin from "firebase-admin";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import * as schema from "./schema/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
let firebaseApp: admin.app.App = null as any;
const credentialsPaths = [
  path.resolve(__dirname, "../../../firebase-adminsdk.json"),
  path.resolve(__dirname, "../../api-server/firebase-adminsdk.json"),
  path.resolve(process.cwd(), "firebase-adminsdk.json"),
  process.env.GOOGLE_APPLICATION_CREDENTIALS || ""
];

let initialized = false;

if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  try {
    const cert = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(cert),
      storageBucket: "educationapp-6ca39.firebasestorage.app"
    }, "db-firebase-app");
    initialized = true;
  } catch (e) {
    // ignore
  }
}

if (!initialized) {
  for (const p of credentialsPaths) {
    if (p && fs.existsSync(p)) {
      try {
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(fs.readFileSync(p, "utf-8"))),
          storageBucket: "educationapp-6ca39.firebasestorage.app"
        }, "db-firebase-app");
        initialized = true;
        break;
      } catch (e) {
        // already initialized
      }
    }
  }
}

if (!initialized) {
  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: "educationapp-6ca39.firebasestorage.app"
    }, "db-firebase-app");
  } catch (e) {
    try {
      firebaseApp = admin.app("db-firebase-app");
    } catch (err) {
      // Create a mock app if we absolutely cannot connect
      firebaseApp = admin.initializeApp({}, "db-firebase-app");
    }
  }
}

export const firestore = firebaseApp.firestore();

// Helper to get collection/table name from Drizzle table object
function getTableName(table: any): string {
  if (table && table.dbName) return table.dbName;
  if (table && table._ && table._.name) return table._.name;
  if (typeof table === "string") return table;
  return "unknown";
}

// Parse Drizzle condition AST
function parseDrizzleCondition(condition: any): { field: string; value: any; operator: string }[] {
  if (!condition || !condition.queryChunks) return [];
  
  const results: { field: string; value: any; operator: string }[] = [];
  const flatChunks: any[] = [];
  
  function flatten(chunks: any[]) {
    for (const chunk of chunks) {
      if (chunk && chunk.queryChunks) {
        flatten(chunk.queryChunks);
      } else {
        flatChunks.push(chunk);
      }
    }
  }
  flatten(condition.queryChunks);
  
  for (let i = 0; i < flatChunks.length; i++) {
    const chunk = flatChunks[i];
    if (chunk && (chunk.name || (chunk.config && chunk.config.name))) {
      const fieldName = chunk.name || chunk.config.name;
      const operatorChunk = flatChunks[i + 1];
      const paramChunk = flatChunks[i + 2];
      
      if (operatorChunk && operatorChunk.constructor?.name === "StringChunk") {
        const sqlOp = String(operatorChunk.value?.[0] || "").trim();
        
        let op = "eq";
        if (sqlOp === "=") op = "eq";
        else if (sqlOp.toLowerCase() === "like") op = "like";
        else if (sqlOp.toLowerCase() === "ilike") op = "ilike";
        else if (sqlOp === "<") op = "lt";
        else if (sqlOp === "<=") op = "lte";
        else if (sqlOp === ">") op = "gt";
        else if (sqlOp === ">=") op = "gte";
        else if (sqlOp === "!=" || sqlOp === "<>") op = "ne";

        if (paramChunk !== undefined) {
          const val = (paramChunk && typeof paramChunk === 'object' && 'value' in paramChunk) ? paramChunk.value : paramChunk;
          results.push({ field: fieldName, value: val, operator: op });
          i += 2;
        }
      }
    }
  }
  return results;
}

// Evaluate conditions in-memory
function evaluateConditions(docData: any, conditions: { field: string; value: any; operator: string }[]): boolean {
  for (const cond of conditions) {
    let docVal = docData[cond.field];
    let queryVal = cond.value;

    // Handle timestamp conversion
    if (docVal instanceof admin.firestore.Timestamp) {
      docVal = docVal.toDate();
    }

    if (cond.field === "id") {
      docVal = Number(docVal);
      queryVal = Number(queryVal);
    }

    if (cond.operator === "eq") {
      if (docVal !== queryVal) return false;
    } else if (cond.operator === "ne") {
      if (docVal === queryVal) return false;
    } else if (cond.operator === "like" || cond.operator === "ilike") {
      const docStr = String(docVal || "").toLowerCase();
      const pattern = String(queryVal || "").replace(/%/g, "").toLowerCase();
      if (!docStr.includes(pattern)) return false;
    } else if (cond.operator === "lt") {
      if (!(docVal < queryVal)) return false;
    } else if (cond.operator === "lte") {
      if (!(docVal <= queryVal)) return false;
    } else if (cond.operator === "gt") {
      if (!(docVal > queryVal)) return false;
    } else if (cond.operator === "gte") {
      if (!(docVal >= queryVal)) return false;
    }
  }
  return true;
}

// Memory Database Client for raw SQL evaluations and operations
class FirestoreDbClient {
  // select builder
  select(fields?: any) {
    let tableName = "";
    let whereCondition: any = null;
    let limitVal: number | null = null;
    let offsetVal: number | null = null;
    let orderByVal: any = null;

    const builder = {
      from(table: any) {
        tableName = getTableName(table);
        return this;
      },
      
      where(condition: any) {
        whereCondition = condition;
        return this;
      },
      
      limit(val: number) {
        limitVal = val;
        return this;
      },
      
      offset(val: number) {
        offsetVal = val;
        return this;
      },
      
      orderBy(val: any) {
        orderByVal = val;
        return this;
      },

      then: async (onfulfilled?: (value: any[]) => any, onrejected?: (reason: any) => any) => {
        try {
          const collRef = firestore.collection(tableName);
          const snapshot = await collRef.get();
          
          let items: any[] = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            // Convert timestamp fields back to Date objects
            for (const key of Object.keys(data)) {
              if (data[key] && typeof data[key] === "object" && data[key].seconds !== undefined) {
                data[key] = new Date(data[key].seconds * 1000);
              }
            }
            items.push({ id: Number(doc.id), ...data });
          });

          // Apply filters in memory
          if (whereCondition) {
            const conditions = parseDrizzleCondition(whereCondition);
            items = items.filter(item => evaluateConditions(item, conditions));
          }

          // Apply sort order
          if (orderByVal) {
            items.sort((a, b) => {
              const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return timeB - timeA; 
            });
          }

          // Apply pagination
          if (offsetVal !== null) {
            items = items.slice(offsetVal);
          }
          if (limitVal !== null) {
            items = items.slice(0, limitVal);
          }

          if (onfulfilled) return onfulfilled(items);
          return items;
        } catch (err) {
          if (onrejected) return onrejected(err);
          throw err;
        }
      }
    };
    return builder;
  }

  // insert builder
  insert(table: any) {
    let tableName = getTableName(table);
    let insertValues: any = null;

    const builder = {
      values(val: any) {
        insertValues = val;
        return this;
      },
      
      onConflictDoUpdate(config: any) {
        return this;
      },

      returning() {
        return this;
      },

      then: async (onfulfilled?: (value: any[]) => any, onrejected?: (reason: any) => any) => {
        try {
          const itemsToInsert = Array.isArray(insertValues) ? insertValues : [insertValues];
          const insertedItems: any[] = [];
          
          for (const item of itemsToInsert) {
            const id = Date.now() + Math.floor(Math.random() * 1000);
            const docData = {
              ...item,
              id: id,
              createdAt: item.createdAt || new Date(),
              updatedAt: item.updatedAt || new Date()
            };

            await firestore.collection(tableName).doc(String(id)).set(docData);
            insertedItems.push(docData);
          }

          if (onfulfilled) return onfulfilled(insertedItems);
          return insertedItems;
        } catch (err) {
          if (onrejected) return onrejected(err);
          throw err;
        }
      }
    };
    return builder;
  }

  // update builder
  update(table: any) {
    let tableName = getTableName(table);
    let updateValues: any = null;
    let whereCondition: any = null;

    const builder = {
      set(val: any) {
        updateValues = val;
        return this;
      },

      where(condition: any) {
        whereCondition = condition;
        return this;
      },

      returning() {
        return this;
      },

      then: async (onfulfilled?: (value: any[]) => any, onrejected?: (reason: any) => any) => {
        try {
          const conditions = parseDrizzleCondition(whereCondition);
          const idCondition = conditions.find(c => c.field === "id");
          
          if (!idCondition) {
            throw new Error("Updates without ID filtering are not supported in compatibility layer");
          }

          const idStr = String(idCondition.value);
          const docRef = firestore.collection(tableName).doc(idStr);
          
          const updateData = {
            ...updateValues,
            updatedAt: new Date()
          };

          await docRef.update(updateData);
          
          const updatedSnapshot = await docRef.get();
          const docData = updatedSnapshot.data() || {};
          
          // Convert Timestamp to Date
          for (const key of Object.keys(docData)) {
            if (docData[key] && typeof docData[key] === "object" && docData[key].seconds !== undefined) {
              docData[key] = new Date(docData[key].seconds * 1000);
            }
          }

          const result = [{ id: Number(idStr), ...docData }];
          if (onfulfilled) return onfulfilled(result);
          return result;
        } catch (err) {
          if (onrejected) return onrejected(err);
          throw err;
        }
      }
    };
    return builder;
  }

  // delete builder
  delete(table: any) {
    let tableName = getTableName(table);
    let whereCondition: any = null;

    const builder = {
      where(condition: any) {
        whereCondition = condition;
        return this;
      },

      then: async (onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) => {
        try {
          const conditions = parseDrizzleCondition(whereCondition);
          const idCondition = conditions.find(c => c.field === "id");
          
          if (idCondition) {
            const idStr = String(idCondition.value);
            await firestore.collection(tableName).doc(idStr).delete();
          }

          if (onfulfilled) return onfulfilled(null);
          return null;
        } catch (err) {
          if (onrejected) return onrejected(err);
          throw err;
        }
      }
    };
    return builder;
  }

  // execute raw SQL queries
  async all(sqlObj: any) {
    const rawSql = String(sqlObj.sql || sqlObj).trim().toLowerCase();
    
    // 1. Dashboard: Order status breakdown
    if (rawSql.includes("select status, count(*)")) {
      const snapshot = await firestore.collection("orders").get();
      const counts: Record<string, number> = {};
      snapshot.forEach(doc => {
        const status = doc.data().status || "pending";
        counts[status] = (counts[status] || 0) + 1;
      });
      return Object.entries(counts).map(([status, count]) => ({ status, count }));
    }

    // 2. Dashboard: Revenue chart (sales per month for the last 12 months)
    if (rawSql.includes("group by strftime('%m', created_at")) {
      const snapshot = await firestore.collection("orders").get();
      const sales: Record<string, { revenue: number; orders: number }> = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        let date = new Date();
        if (data.createdAt && data.createdAt.seconds) {
          date = new Date(data.createdAt.seconds * 1000);
        } else if (data.createdAt) {
          date = new Date(data.createdAt);
        }
        
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const total = parseFloat(data.total) || 0;
        
        if (!sales[month]) {
          sales[month] = { revenue: 0, orders: 0 };
        }
        sales[month].revenue += total;
        sales[month].orders += 1;
      });

      return Object.entries(sales).map(([month, stats]) => ({
        month,
        revenue: stats.revenue,
        orders: stats.orders
      })).sort((a, b) => a.month.localeCompare(b.month));
    }

    // 3. Inventory items joined with warehouse names
    if (rawSql.includes("from inventory_items")) {
      const [itemsSnap, warehouseSnap] = await Promise.all([
        firestore.collection("inventory_items").get(),
        firestore.collection("warehouses").get()
      ]);

      const warehouses: Record<string, string> = {};
      warehouseSnap.forEach(doc => {
        warehouses[doc.id] = doc.data().name || "";
      });

      const results: any[] = [];
      itemsSnap.forEach(doc => {
        const data = doc.data();
        const warehouseId = String(data.warehouseId || "");
        results.push({
          id: Number(doc.id),
          ...data,
          warehouseName: warehouses[warehouseId] || "Unknown"
        });
      });
      return results;
    }

    return [];
  }

  // mock execute
  async execute(sqlObj: any) {
    return this.all(sqlObj);
  }
}

// Export custom Firestore compatibility client
export const sqlite = null;
export const db = new FirestoreDbClient() as any;

export * from "./schema/index.js";
