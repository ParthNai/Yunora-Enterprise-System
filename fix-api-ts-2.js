import fs from "fs";
import path from "path";

const apiDir = "c:/Users/pkrus/.gemini/antigravity-ide/scratch/firebase-project/Yunora-Enterprise-System/artifacts/api-server/src";

// Fix 3: dashboard.ts
const dashboardPath = path.join(apiDir, "routes/dashboard.ts");
let dashboard = fs.readFileSync(dashboardPath, "utf-8");
dashboard = dashboard.replace(/recentSales\.rows/g, "recentSales");
dashboard = dashboard.replace(/salesData\.rows/g, "salesData");
fs.writeFileSync(dashboardPath, dashboard);

// Fix 4: inventory.ts
const inventoryPath = path.join(apiDir, "routes/inventory.ts");
let inventory = fs.readFileSync(inventoryPath, "utf-8");
inventory = inventory.replace(/lowStockItems\.rows/g, "lowStockItems");
fs.writeFileSync(inventoryPath, inventory);

// Fix 7: support.ts
const supportPath = path.join(apiDir, "routes/support.ts");
let support = fs.readFileSync(supportPath, "utf-8");
support = support.replace(/InsertSiteSettings/g, "SiteSettingsInput");
fs.writeFileSync(supportPath, support);

console.log("Fixes 2 applied.");
