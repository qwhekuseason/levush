import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { firebaseReady } from './lib/firebaseAdmin.js';
import { devAdminEmail, devTokensEnabled } from './lib/auth.js';
import { initProducts } from './store/productStore.js';
import meRouter from './routes/me.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import rewardsRouter from './routes/rewards.js';
import couponsRouter from './routes/coupons.js';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }));
// Larger limit so admins can upload product images as data URLs in dev mode.
app.use(express.json({ limit: '6mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', firestore: firebaseReady ? 'connected' : 'memory-mode' });
});

app.use('/api/me', meRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/rewards', rewardsRouter);
app.use('/api/coupons', couponsRouter);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

initProducts().catch((e) => console.warn('[products] seed skipped:', e?.message));

app.listen(PORT, () => {
  console.log(`[levush] API listening on http://localhost:${PORT}`);
  console.log(`[levush] Storage: ${firebaseReady ? 'Firestore' : 'in-memory (dev)'}`);
  if (devTokensEnabled) {
    console.log(`[levush] Dev admin login enabled — sign in as ${devAdminEmail} to access /admin.`);
  }
});
