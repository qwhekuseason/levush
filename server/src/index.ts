import app from './app.js';

const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, () => {
  console.log(`[levush] API listening on http://localhost:${PORT}`);
  console.log(`[levush] Storage: ${process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'Firestore' : 'in-memory (dev)'}`);
});
