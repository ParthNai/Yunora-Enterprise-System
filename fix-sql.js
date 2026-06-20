import fs from "fs";
import path from "path";

const apiDir = "c:/Users/pkrus/.gemini/antigravity-ide/scratch/firebase-project/Yunora-Enterprise-System/artifacts/api-server/src";

// Fix dashboard.ts
const dashboardPath = path.join(apiDir, "routes/dashboard.ts");
let dashboard = fs.readFileSync(dashboardPath, "utf-8");

dashboard = dashboard.replace(/created_at >= date_trunc\('month', now\(\)\)/g, "created_at >= strftime('%s', 'now', 'start of month') * 1000");
dashboard = dashboard.replace(/created_at >= date_trunc\('day', now\(\)\)/g, "created_at >= strftime('%s', 'now', 'start of day') * 1000");

dashboard = dashboard.replace(/SELECT TO_CHAR[^`]+/m, `SELECT strftime('%m', created_at / 1000, 'unixepoch') as month,
           SUM(total) as revenue,
           COUNT(*) as orders
    FROM orders
    WHERE created_at >= strftime('%s', 'now', '-12 months') * 1000
    GROUP BY strftime('%m', created_at / 1000, 'unixepoch')
    ORDER BY strftime('%m', created_at / 1000, 'unixepoch')
  `);

dashboard = dashboard.replace(/COUNT\(\*\)::int/g, "COUNT(*)");
dashboard = dashboard.replace(/\(rows\.rows as any\[\]\)/g, "(rows as any[])");

// The query for revenue-chart now returns month as "01", "02".
// Let's modify the map to convert month numbers to short names if needed, or just let it be.
dashboard = dashboard.replace(/month: r\.month,/g, 'month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][parseInt(r.month) - 1] || r.month,');

fs.writeFileSync(dashboardPath, dashboard);

// Fix inventory.ts
const inventoryPath = path.join(apiDir, "routes/inventory.ts");
let inventory = fs.readFileSync(inventoryPath, "utf-8");
inventory = inventory.replace(/\(rows\.rows as any\[\]\)/g, "(rows as any[])");
fs.writeFileSync(inventoryPath, inventory);

console.log("SQL Fixes applied.");
