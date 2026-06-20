import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "../../");
const apiServerDir = path.resolve(rootDir, "artifacts/api-server");
const pkgPath = path.resolve(apiServerDir, "package.json");
const pkgBakPath = path.resolve(apiServerDir, "package.json.bak");

async function main() {
  console.log("🚀 Preparing Firebase Functions deployment...");

  // 1. Back up package.json
  fs.copyFileSync(pkgPath, pkgBakPath);

  try {
    // 2. Read package.json and strip workspace dependencies
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    if (pkg.dependencies) {
      delete pkg.dependencies["@workspace/db"];
      delete pkg.dependencies["@workspace/api-zod"];
    }
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    console.log("✓ Temporary package.json created (workspace dependencies removed).");

    // 3. Build the api-server to ensure the latest dist/index.mjs is compiled
    console.log("⚙ Building api-server...");
    execSync("node ./build.mjs", { cwd: apiServerDir, stdio: "inherit" });

    // 4. Run firebase deploy
    console.log("📤 Deploying to Firebase Functions...");
    execSync("npx firebase deploy --only functions", { cwd: rootDir, stdio: "inherit" });
    
    console.log("🎉 Deployment complete!");
  } catch (err) {
    console.error("❌ Deployment failed:", err);
  } finally {
    // 5. Restore backup
    if (fs.existsSync(pkgBakPath)) {
      fs.copyFileSync(pkgBakPath, pkgPath);
      fs.unlinkSync(pkgBakPath);
      console.log("✓ Original package.json restored.");
    }
  }
}

main();
