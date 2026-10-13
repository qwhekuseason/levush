import { randomUUID } from 'node:crypto';
import { db } from '../lib/firebaseAdmin.js';

/** A message sent from the Contact page. */
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  read: boolean;
  createdAt: number;
}

const COLLECTION = 'messages';

export async function createMessage(input: Pick<ContactMessage, 'name' | 'email' | 'phone' | 'message'>): Promise<ContactMessage> {
  const msg: ContactMessage = { ...input, id: randomUUID(), read: false, createdAt: Date.now() };
  await db.collection(COLLECTION).doc(msg.id).set(msg);
  return msg;
}

export async function listMessages(): Promise<ContactMessage[]> {
  const snap = await db.collection(COLLECTION).orderBy('createdAt', 'desc').limit(300).get();
  return snap.docs.map((d) => d.data() as ContactMessage);
}

export async function setMessageRead(id: string, read: boolean): Promise<ContactMessage | null> {
  const ref = db.collection(COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  await ref.update({ read });
  return { ...(snap.data() as ContactMessage), read };
}

export async function deleteMessage(id: string): Promise<boolean> {
  const ref = db.collection(COLLECTION).doc(id);
  if (!(await ref.get()).exists) return false;
  await ref.delete();
  return true;
}
