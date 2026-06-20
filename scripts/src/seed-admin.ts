import bcrypt from "bcryptjs";
import { db, adminUsersTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const EMAIL = "admin@yunora.in";
const PASSWORD = "Yunora@2026!";
const NAME = "Admin User";
const ROLE = "super_admin" as const;

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 12);
  await db
    .insert(adminUsersTable)
    .values({
      name: NAME,
      email: EMAIL,
      passwordHash: hash,
      role: ROLE,
      isActive: true,
    })
    .onConflictDoUpdate({
      target: adminUsersTable.email,
      set: {
        passwordHash: hash,
        name: NAME,
        role: ROLE,
        isActive: true,
      },
    });
  console.log(`✓ Admin user seeded: ${EMAIL} / ${PASSWORD}`);
  process.exit(0);
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
