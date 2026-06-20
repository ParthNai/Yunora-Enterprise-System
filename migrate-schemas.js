import fs from "fs";
import path from "path";

const dir = "c:/Users/pkrus/.gemini/antigravity-ide/scratch/firebase-project/Yunora-Enterprise-System/lib/db/src/schema";
const files = fs.readdirSync(dir).filter(f => f.endsWith(".ts") && f !== "index.ts");

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, "utf-8");

  // Replace import
  content = content.replace(/import \{([^}]+)\} from "drizzle-orm\/pg-core";/, (match, p1) => {
    let imports = p1.split(",").map(s => s.trim());
    imports = imports.filter(i => !i.includes("pgEnum"));
    imports = imports.map(i => i === "pgTable" ? "sqliteTable" : i);
    imports = imports.map(i => i === "serial" ? "" : i);
    imports = imports.map(i => i === "boolean" ? "" : i);
    imports = imports.map(i => i === "jsonb" ? "" : i);
    imports = imports.map(i => i === "numeric" ? "real" : i);

    if (!imports.includes("integer")) imports.push("integer");
    if (!imports.includes("sqliteTable")) imports.push("sqliteTable");
    if (!imports.includes("text")) imports.push("text");

    return `import { ${imports.filter(Boolean).join(", ")} } from "drizzle-orm/sqlite-core";`;
  });

  content = content.replace(/pgTable/g, "sqliteTable");
  content = content.replace(/serial\("([^"]+)"\)\.primaryKey\(\)/g, 'integer("$1", { mode: "number" }).primaryKey({ autoIncrement: true })');
  content = content.replace(/timestamp\("([^"]+)"(?:,\s*\{[^}]+\})?\)/g, 'integer("$1", { mode: "timestamp" })');
  content = content.replace(/\.defaultNow\(\)/g, '.$defaultFn(() => new Date())');
  content = content.replace(/boolean\("([^"]+)"\)/g, 'integer("$1", { mode: "boolean" })');
  content = content.replace(/jsonb\("([^"]+)"\)/g, 'text("$1", { mode: "json" })');
  content = content.replace(/numeric\("([^"]+)",\s*\{[^}]+\}\)/g, 'real("$1")');

  const enums = [...content.matchAll(/export const (\w+) = pgEnum\("([^"]+)",\s*(\[[^\]]+\])\);/g)];
  for (const enumMatch of enums) {
    const enumVarName = enumMatch[1];
    const enumArr = enumMatch[3];
    content = content.replace(enumMatch[0], `// enum ${enumVarName} was removed`);
    const regex = new RegExp(`${enumVarName}\\("([^"]+)"\\)`, "g");
    content = content.replace(regex, `text("$1", { enum: ${enumArr} })`);
  }

  fs.writeFileSync(filePath, content);
}
console.log("Migration complete.");
