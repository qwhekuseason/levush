import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { firebaseReady } from './lib/firebaseAdmin.js';
import { initProducts } from './store/productStore.js';
import meRouter from './routes/me.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import couponsRouter from './routes/coupons.js';
import settingsRouter from './routes/settings.js';
import messagesRouter from './routes/messages.js';
import seoRouter from './routes/seo.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json({ limit: '6mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', firestore: firebaseReady ? 'connected' : 'memory-mode' });
});

app.use('/api/me', meRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/coupons', couponsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api', seoRouter);
// Link-preview bots and /sitemap.xml are rewritten here by vercel.json with their original paths.
app.use(seoRouter);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

initProducts().catch((e) => console.warn('[products] seed skipped:', e?.message));

export default app;
