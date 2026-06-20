import fs from "fs";
import path from "path";

const adminDir = "c:/Users/pkrus/.gemini/antigravity-ide/scratch/firebase-project/Yunora-Enterprise-System/artifacts/yunora-admin/src/pages";

// Fix customers.tsx
const customersPath = path.join(adminDir, "customers.tsx");
let customers = fs.readFileSync(customersPath, "utf-8");
customers = customers.replace(/limit: 10/g, "/* limit */");
fs.writeFileSync(customersPath, customers);

// Fix dealers.tsx
const dealersPath = path.join(adminDir, "dealers.tsx");
let dealers = fs.readFileSync(dealersPath, "utf-8");
dealers = dealers.replace(/limit: 10/g, "/* limit */");
fs.writeFileSync(dealersPath, dealers);

// Fix leads.tsx
const leadsPath = path.join(adminDir, "leads.tsx");
let leads = fs.readFileSync(leadsPath, "utf-8");
leads = leads.replace(/limit: 10/g, "/* limit */");
fs.writeFileSync(leadsPath, leads);

// Fix orders.tsx
const ordersPath = path.join(adminDir, "orders.tsx");
let orders = fs.readFileSync(ordersPath, "utf-8");
orders = orders.replace(/statusColors\[order\.status\]/g, "statusColors[order.status as keyof typeof statusColors]");
fs.writeFileSync(ordersPath, orders);

// Fix product-detail.tsx
const productDetailPath = path.join(adminDir, "product-detail.tsx");
let productDetail = fs.readFileSync(productDetailPath, "utf-8");
productDetail = productDetail.replace(/comparePrice: undefined,/g, "/* comparePrice */");
fs.writeFileSync(productDetailPath, productDetail);

console.log("Admin fixes applied.");
