import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { resolve, basename } from 'path';

const credPath = resolve(process.cwd(), '../levush-firebase-adminsdk-fbsvc-31b54df3c6.json');
if (!existsSync(credPath)) {
  console.error('Credentials file not found at:', credPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(credPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id || 'levush',
  });
}

const db = admin.firestore();
const COLLECTION = 'products';
const assetsDir = resolve(process.cwd(), '../client/public/assets');

function imageToBase64(imagePath: string): string {
  if (!imagePath) return '';
  if (imagePath.startsWith('data:') || imagePath.startsWith('http')) return imagePath;

  const fname = basename(imagePath);
  const webpFname = fname.replace(/\.(png|jpg|jpeg)$/i, '.webp');

  let fullPath = resolve(assetsDir, webpFname);
  let mime = 'image/webp';

  if (!existsSync(fullPath)) {
    fullPath = resolve(assetsDir, fname);
    if (fname.endsWith('.png')) mime = 'image/png';
    else if (fname.endsWith('.jpg') || fname.endsWith('.jpeg')) mime = 'image/jpeg';
  }

  if (existsSync(fullPath)) {
    const buffer = readFileSync(fullPath);
    return `data:${mime};base64,${buffer.toString('base64')}`;
  }

  console.warn(`[warning] Image not found on disk: ${imagePath}`);
  return imagePath;
}

async function main() {
  console.log('Reading seed products and converting images to Firestore Base64...');
  
  const { seed } = await import('../store/productStore.js');
  console.log(`Found ${seed.length} products to populate into Firestore.`);

  let totalUploaded = 0;
  const batchSize = 20;

  for (let i = 0; i < seed.length; i += batchSize) {
    const chunk = seed.slice(i, i + batchSize);
    const batch = db.batch();

    for (const p of chunk) {
      const updatedProduct = {
        ...p,
        colorways: (p.colorways || []).map((c: any) => ({
          ...c,
          image: imageToBase64(c.image),
        })),
      };

      const docRef = db.collection(COLLECTION).doc(p.id);
      batch.set(docRef, updatedProduct);
      totalUploaded++;
    }

    await batch.commit();
    console.log(`Uploaded batch ${Math.min(i + batchSize, seed.length)}/${seed.length} products to Firestore.`);
  }

  console.log(`\nSuccessfully stored all ${totalUploaded} products with images directly in Cloud Firestore!`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error during Firestore migration:', err);
  process.exit(1);
});
