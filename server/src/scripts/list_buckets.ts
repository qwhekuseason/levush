import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const credPath = resolve(process.cwd(), '../levush-firebase-adminsdk-fbsvc-31b54df3c6.json');
if (!existsSync(credPath)) {
  console.error('Credentials file not found at:', credPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(credPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id || 'levush',
});

async function main() {
  const targetBucketName = 'levush.firebasestorage.app';
  try {
    const bucket = admin.storage().bucket(targetBucketName);
    console.log(`Attempting to create bucket "${targetBucketName}"...`);
    const [createdBucket] = await bucket.create({
      location: 'us-central1',
      standard: true,
    });
    console.log('Successfully created bucket:', createdBucket.name);
  } catch (err: any) {
    console.log('Create bucket result:', err.message);
    if (err.errors) console.log('Details:', JSON.stringify(err.errors, null, 2));
  }
}

main();
