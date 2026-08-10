import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import admin from 'firebase-admin';
import type { Firestore } from 'firebase-admin/firestore';

/**
 * Initialise Firebase Admin SDK for Cloud Firestore and Firebase Authentication.
 */

function loadServiceAccount(): admin.ServiceAccount | null {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (inline) {
    try {
      const parsed = JSON.parse(inline) as admin.ServiceAccount & { private_key?: string };
      if (parsed.private_key && typeof parsed.private_key === 'string') {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }
      return parsed;
    } catch {
      console.warn('[firebase] FIREBASE_SERVICE_ACCOUNT is not valid JSON.');
    }
  }

  // Check configured path or default project credentials in workspace
  const defaultPath = resolve(process.cwd(), '../levush-firebase-adminsdk-fbsvc-31b54df3c6.json');
  const rootPath = resolve(process.cwd(), 'levush-firebase-adminsdk-fbsvc-31b54df3c6.json');
  const configuredPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  const candidatePaths = [configuredPath, defaultPath, rootPath].filter((p): p is string => Boolean(p));

  for (const path of candidatePaths) {
    if (existsSync(path)) {
      try {
        const raw = readFileSync(path, 'utf8');
        const parsed = JSON.parse(raw) as admin.ServiceAccount & { private_key?: string };
        if (parsed.private_key && typeof parsed.private_key === 'string') {
          parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
        }
        return parsed;
      } catch (err) {
        console.warn(`[firebase] Could not parse credentials at ${path}`);
      }
    }
  }

  return null;
}

const serviceAccount = loadServiceAccount();

if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.projectId ?? 'levush',
    });
    console.log(`[firebase] Firebase Admin connected successfully to project: ${serviceAccount.projectId ?? 'levush'}`);
  } else {
    admin.initializeApp({
      projectId: 'levush',
    });
    console.log('[firebase] Firebase Admin initialized with default project ID: levush');
  }
}

export const db: Firestore = admin.firestore();
export const authAdmin = admin.auth();
export const firebaseReady = Boolean(serviceAccount);

/** Verify a client ID token, returning uid or null if invalid. */
export async function verifyIdToken(token?: string): Promise<string | null> {
  const decoded = await verifyDecoded(token);
  return decoded?.uid ?? null;
}

/** Verify a client ID token, returning uid + email (or null if invalid). */
export async function verifyDecoded(
  token?: string
): Promise<{ uid: string; email: string | null } | null> {
  if (!token) return null;
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email ?? null };
  } catch (err) {
    return null;
  }
}
