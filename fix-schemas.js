import fs from "fs";
import path from "path";

const dir = "c:/Users/pkrus/.gemini/antigravity-ide/scratch/firebase-project/Yunora-Enterprise-System/lib/db/src/schema";
const files = fs.readdirSync(dir).filter(f => f.endsWith(".ts") && f !== "index.ts");

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, "utf-8");

  // Remove timestamp and varchar from imports
  content = content.replace(/,\s*timestamp/g, "");
  content = content.replace(/timestamp\s*,\s*/g, "");
  content = content.replace(/,\s*varchar/g, "");
  content = content.replace(/varchar\s*,\s*/g, "");

  // Fix un-replaced serial
  content = content.replace(/serial\("([^"]+)"\)\.primaryKey\(\)/g, 'integer("$1", { mode: "number" }).primaryKey({ autoIncrement: true })');

  // Fix real().default("0") to real().default(0)
  content = content.replace(/\.default\("0"\)/g, ".default(0)");

  // Replace varchar("...") with text("...")
  content = content.replace(/varchar\("([^"]+)",\s*\{[^}]+\}\)/g, 'text("$1")');

  fs.writeFileSync(filePath, content);
}
console.log("Cleanup complete.");
