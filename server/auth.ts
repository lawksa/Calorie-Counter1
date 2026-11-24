import type { Express, RequestHandler } from "express";
import { timingSafeEqual } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, type User } from "@shared/models/auth";

/**
 * The app runs in single-user mode: there is no sign-in, every request acts as
 * one owner account. Set APP_PASSWORD to put the whole site behind a password
 * prompt (HTTP Basic auth) when it is hosted on the public internet.
 */
export const OWNER_ID = "owner";

async function ensureOwner(): Promise<User> {
  const [existing] = await db.select().from(users).where(eq(users.id, OWNER_ID));
  if (existing) return existing;
  const [created] = await db
    .insert(users)
    .values({ id: OWNER_ID, firstName: process.env.OWNER_NAME || "أنا", username: "owner" })
    .onConflictDoNothing()
    .returning();
  return created ?? (await db.select().from(users).where(eq(users.id, OWNER_ID)))[0];
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Optional site-wide password. Must be registered before any other route. */
export function passwordGate(app: Express) {
  app.get("/healthz", (_req, res) => res.send("ok"));

  const password = process.env.APP_PASSWORD;
  if (!password) return;
  // Files browsers fetch without the password (install-to-home-screen, icons, health check)
  const PUBLIC = new Set(["/healthz", "/manifest.webmanifest", "/sw.js", "/favicon.png", "/apple-touch-icon.png", "/icon-192.png", "/icon-512.png"]);
  app.use((req, res, next) => {
    if (PUBLIC.has(req.path)) return next();
    const header = req.headers.authorization ?? "";
    if (header.startsWith("Basic ")) {
      const decoded = Buffer.from(header.slice(6), "base64").toString();
      const given = decoded.slice(decoded.indexOf(":") + 1);
      if (safeEqual(given, password)) return next();
    }
    res.setHeader("WWW-Authenticate", 'Basic realm="app", charset="UTF-8"');
    res.status(401).send("Password required");
  });
}

/** Attaches the owner account to every request (keeps the req.user.claims.sub shape the routes use). */
export const isAuthenticated: RequestHandler = (req, _res, next) => {
  (req as any).user = { claims: { sub: OWNER_ID } };
  next();
};

export async function setupAuth(app: Express) {
  await ensureOwner();
  app.get("/api/auth/user", async (_req, res) => {
    res.json(await ensureOwner());
  });
}

declare global {
  namespace Express {
    interface Request {
      user?: { claims: { sub: string } };
    }
  }
}
