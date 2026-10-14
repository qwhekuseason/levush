import { createHash } from 'node:crypto';
import { db } from '../lib/firebaseAdmin.js';
import { toWhatsAppDigits } from './settingsStore.js';

/** A customer waiting for a sold-out colour/size to come back. */
export interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  color: string;
  colorLabel: string;
  size: string;
  /** WhatsApp digits, e.g. 233241234567 */
  phone: string;
  name: string;
  notified: boolean;
  createdAt: number;
  notifiedAt?: number;
}

const COLLECTION = 'stockAlerts';

/**
 * One alert per person per variant: the id is derived from them, so asking
 * twice just refreshes the existing request instead of duplicating it.
 */
export async function upsertAlert(input: Omit<StockAlert, 'id' | 'notified' | 'createdAt' | 'phone'> & { phone: string }) {
  const phone = toWhatsAppDigits(input.phone);
  const id = createHash('sha256').update(`${input.productId}|${input.color}|${input.size}|${phone}`).digest('hex').slice(0, 24);
  const alert: StockAlert = { ...input, phone, id, notified: false, createdAt: Date.now() };
  await db.collection(COLLECTION).doc(id).set(alert);
  return alert;
}

export async function listAlerts(): Promise<StockAlert[]> {
  const snap = await db.collection(COLLECTION).orderBy('createdAt', 'desc').limit(1000).get();
  return snap.docs.map((d) => d.data() as StockAlert);
}

export async function markAlertNotified(id: string, notified: boolean): Promise<StockAlert | null> {
  const ref = db.collection(COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const patch = notified ? { notified, notifiedAt: Date.now() } : { notified };
  await ref.update(patch);
  return { ...(snap.data() as StockAlert), ...patch };
}

export async function deleteAlert(id: string): Promise<boolean> {
  const ref = db.collection(COLLECTION).doc(id);
  if (!(await ref.get()).exists) return false;
  await ref.delete();
  return true;
}
