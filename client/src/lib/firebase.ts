import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAQDMH437v8bgBC3JpJVgJ22yamTizslpY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'levush.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'levush',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'levush.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1048034794487',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1048034794487:web:ecee9c5a6d208c6f6bacf2',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export const firebaseEnabled = true;

/**
 * Uploads a compressed image blob to Firebase Storage and returns its public CDN URL.
 */
export async function uploadImageToStorage(blob: Blob, path: string): Promise<string> {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, blob, {
    contentType: 'image/webp',
    cacheControl: 'public, max-age=31536000, immutable',
  });
  return getDownloadURL(snapshot.ref);
}
