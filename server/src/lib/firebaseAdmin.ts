import { readFileSync } from 'node:fs';
import admin from 'firebase-admin';
import type { Firestore } from 'firebase-admin/firestore';

/**
 * Initialise Firebase Admin from one of:
 *   1. FIREBASE_SERVICE_ACCOUNT  — the service-account JSON as a string
 *   2. GOOGLE_APPLICATION_CREDENTIALS — path to the service-account JSON file
 *
 * If neither is present we run in "memory mode": no Firestore, and the stores
 * fall back to in-memory data so the API still works for local development.
 */

let firestore: Firestore | undefined;
let initialised = false;

function loadServiceAccount(): admin.ServiceAccount | undefined {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (inline) {
    try {
      return JSON.parse(inline) as admin.ServiceAccount;
    } catch {
      console.warn('[firebase] FIREBASE_SERVICE_ACCOUNT is not valid JSON — ignoring.');
    }
  }
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (path) {
    try {
      return JSON.parse(readFileSync(path, 'utf8')) as admin.ServiceAccount;
    } catch {
      console.warn(`[firebase] Could not read credentials at ${path} — ignoring.`);
    }
  }
  return undefined;
}

const serviceAccount = loadServiceAccount();

if (serviceAccount) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  firestore = admin.firestore();
  initialised = true;
  console.log('[firebase] Admin initialised — Firestore connected.');
} else {
  console.log('[firebase] No credentials found — running in memory mode (no Firestore).');
}

export const db = firestore;
export const firebaseReady = initialised;

/** Verify a client ID token; returns the uid or null if invalid/disabled. */
export async function verifyIdToken(token?: string): Promise<string | null> {
  const decoded = await verifyDecoded(token);
  return decoded?.uid ?? null;
}

/** Verify a client ID token, returning uid + email (or null if invalid). */
export async function verifyDecoded(
  token?: string
): Promise<{ uid: string; email: string | null } | null> {
  if (!token) return null;
  if (!initialised) {
    // In dev/memory mode (no Firestore credentials), we decode the JWT without signature verification
    // so that the frontend can use real Firebase Auth while the backend runs in memory mode.
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payloadStr = Buffer.from(parts[1], 'base64').toString('utf8');
        const payload = JSON.parse(payloadStr);
        if (payload.iss?.startsWith('https://securetoken.google.com/')) {
          return { uid: payload.sub, email: payload.email ?? null };
        }
      }
    } catch (e) {
      console.warn('[firebase] Failed to decode dev token:', e);
    }
    return null;
  }
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email ?? null };
  } catch {
    return null;
  }
}

