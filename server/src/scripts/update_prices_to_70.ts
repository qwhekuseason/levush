import admin from 'firebase-admin';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// 1. Update JSON files
const jsonFiles = [
  resolve(process.cwd(), '../formatted_products.json'),
  resolve(process.cwd(), '../full_catalog.json'),
  resolve(process.cwd(), '../parsed_new_products.json'),
];

for (const f of jsonFiles) {
  if (existsSync(f)) {
    try {
      const data = JSON.parse(readFileSync(f, 'utf8'));
      if (Array.isArray(data)) {
        const updated = data.map((item: any) => {
          const newItem = { ...item, price: 70 };
          delete newItem.originalPrice;
          return newItem;
        });
        writeFileSync(f, JSON.stringify(updated, null, 2), 'utf8');
        console.log(`Updated ${f}`);
      }
    } catch (e) {
      console.error(`Failed to update JSON ${f}:`, e);
    }
  }
}

// 2. Update TypeScript files (regex replacement for price: \d+ and originalPrice: \d+)
const tsFiles = [
  resolve(process.cwd(), '../client/src/data/products.ts'),
  resolve(process.cwd(), 'src/store/productStore.ts'),
];

for (const f of tsFiles) {
  if (existsSync(f)) {
    let content = readFileSync(f, 'utf8');
    // replace `price: \d+` with `price: 70`
    content = content.replace(/price:\s*\d+/g, 'price: 70');
    // remove `originalPrice: \d+,?\n`
    content = content.replace(/\s*originalPrice:\s*\d+,?\n?/g, '\n');
    writeFileSync(f, content, 'utf8');
    console.log(`Updated ${f}`);
  }
}

// 3. Update Firestore database
const credPath = resolve(process.cwd(), '../levush-firebase-adminsdk-fbsvc-31b54df3c6.json');
if (existsSync(credPath)) {
  const serviceAccount = JSON.parse(readFileSync(credPath, 'utf8'));
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id || 'levush',
    });
  }

  const db = admin.firestore();
  const COLLECTION = 'products';

  async function updateFirestore() {
    console.log('Fetching all products from Firestore...');
    const snapshot = await db.collection(COLLECTION).get();
    console.log(`Found ${snapshot.size} products in Firestore collection.`);

    if (snapshot.empty) {
      console.log('No documents found in Firestore.');
      return;
    }

    const batchSize = 100;
    let totalUpdated = 0;
    const docs = snapshot.docs;

    for (let i = 0; i < docs.length; i += batchSize) {
      const chunk = docs.slice(i, i + batchSize);
      const batch = db.batch();

      for (const doc of chunk) {
        batch.update(doc.ref, {
          price: 70,
          originalPrice: admin.firestore.FieldValue.delete(),
        });
        totalUpdated++;
      }

      await batch.commit();
      console.log(`Updated batch ${Math.min(i + batchSize, docs.length)}/${docs.length}`);
    }

    console.log(`Successfully updated ${totalUpdated} products in Firestore to price: 70.`);
  }

  updateFirestore()
    .then(() => {
      console.log('All updates complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error updating Firestore:', err);
      process.exit(1);
    });
} else {
  console.log('No service account creds found for Firestore, finished file updates.');
}
