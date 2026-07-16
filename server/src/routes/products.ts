import { Router } from 'express';
import { requireAdmin } from '../lib/auth.js';
import {
  createProduct,
  deleteProduct,
  getProductBySlug,
  listProducts,
  updateProduct,
} from '../store/productStore.js';

const router = Router();

// ── Public ──
router.get('/', async (_req, res) => {
  res.json(await listProducts());
});

router.get('/:slug', async (req, res) => {
  const product = await getProductBySlug(req.params.slug);
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json(product);
});

// ── Admin ──
router.post('/', requireAdmin, async (req, res) => {
  if (!req.body?.name) return res.status(400).json({ error: 'Name is required.' });
  const product = await createProduct(req.body);
  res.status(201).json(product);
});

router.put('/:id', requireAdmin, async (req, res) => {
  const updated = await updateProduct(req.params.id, req.body ?? {});
  if (!updated) return res.status(404).json({ error: 'Product not found.' });
  res.json(updated);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const ok = await deleteProduct(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Product not found.' });
  res.json({ deleted: true });
});

export default router;
