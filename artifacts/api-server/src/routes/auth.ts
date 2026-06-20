import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { db, adminUsersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const MAX_LOGIN_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_LOGIN_ATTEMPTS) return false;
  entry.count++;
  return true;
}

function clearRateLimit(ip: string) {
  loginAttempts.delete(ip);
}

router.post("/auth/login", async (req: Request, res: Response): Promise<void> => {
  const ip = req.ip ?? "unknown";
  if (!checkRateLimit(ip)) {
    res.status(429).json({ error: "Too many login attempts. Please try again in 15 minutes." });
    return;
  }

  const { email, password } = req.body ?? {};
  if (!email || !password || typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  const [user] = await db
    .select()
    .from(adminUsersTable)
    .where(eq(adminUsersTable.email, email.toLowerCase().trim()))
    .limit(1);

  if (!user || !user.isActive) {
    await bcrypt.compare(password, "$2b$12$invalidhashingtimingattackprotection1234567890");
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  clearRateLimit(ip);

  await db
    .update(adminUsersTable)
    .set({ lastLoginAt: new Date() })
    .where(eq(adminUsersTable.id, user.id));

  (req.session as any).adminUserId = user.id;
  (req.session as any).adminRole = user.role;

  req.session.save((err) => {
    if (err) {
      req.log.error({ err }, "Session save error");
      res.status(500).json({ error: "Session error. Please try again." });
      return;
    }
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  });
});

router.post("/auth/logout", (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) req.log.error({ err }, "Session destroy error");
    res.clearCookie("yunora.sid");
    res.json({ ok: true });
  });
});

router.get("/auth/me", async (req: Request, res: Response): Promise<void> => {
  const userId = (req.session as any)?.adminUserId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }

  const [user] = await db
    .select({
      id: adminUsersTable.id,
      name: adminUsersTable.name,
      email: adminUsersTable.email,
      role: adminUsersTable.role,
    })
    .from(adminUsersTable)
    .where(eq(adminUsersTable.id, userId))
    .limit(1);

  if (!user || !user.id) {
    req.session.destroy(() => {});
    res.status(401).json({ error: "Not authenticated." });
    return;
  }

  res.json(user);
});

export default router;
