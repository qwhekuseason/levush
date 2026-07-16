import type { NextFunction, Request, Response } from 'express';
import { firebaseReady, verifyDecoded } from './firebaseAdmin.js';

export type Role = 'admin' | 'customer';

export interface Caller {
  uid: string;
  email: string | null;
  role: Role;
}

// Allowlist of admin emails (comma-separated in ADMIN_EMAILS).
const adminEmails = new Set(
  (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

/**
 * Dev tokens (`Bearer dev:<email>`) are ONLY honoured when Firebase isn't
 * configured, so once you add real credentials they stop working automatically.
 * This lets you exercise the admin panel locally without a Firebase project.
 */
const allowDevTokens = !firebaseReady;
const DEV_ADMIN = 'admin@levush.test';

function roleFor(email: string | null | undefined): Role {
  if (!email) return 'customer';
  const e = email.toLowerCase();
  if (adminEmails.has(e)) return 'admin';
  // Built-in dev admin only when no allowlist + no Firebase (local testing).
  if (allowDevTokens && adminEmails.size === 0 && e === DEV_ADMIN) return 'admin';
  return 'customer';
}

function bearer(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) return header.slice(7);
  return undefined;
}

/** Resolve who is calling, or null if no/invalid credentials. */
export async function resolveCaller(req: Request): Promise<Caller | null> {
  const token = bearer(req);
  if (!token) return null;

  if (token.startsWith('dev:')) {
    if (!allowDevTokens) return null;
    const email = token.slice(4).trim().toLowerCase();
    if (!email) return null;
    return { uid: `dev:${email}`, email, role: roleFor(email) };
  }

  const decoded = await verifyDecoded(token);
  if (!decoded) return null;
  return { uid: decoded.uid, email: decoded.email, role: roleFor(decoded.email) };
}

// Express augmentation so handlers can read req.caller.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      caller?: Caller;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const caller = await resolveCaller(req);
  if (!caller) return res.status(401).json({ error: 'Sign in to continue.' });
  req.caller = caller;
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const caller = await resolveCaller(req);
  if (!caller) return res.status(401).json({ error: 'Sign in to continue.' });
  if (caller.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
  req.caller = caller;
  next();
}

export const devAdminEmail = DEV_ADMIN;
export const devTokensEnabled = allowDevTokens;
