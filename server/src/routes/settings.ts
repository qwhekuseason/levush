import { Router } from 'express';
import { requireAdmin } from '../lib/auth.js';
import { getSettings, updateSettings } from '../store/settingsStore.js';

const router = Router();

router.get('/', async (_req, res) => {
  // Short CDN cache: admin changes show up for shoppers within a minute.
  res.set('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=300');
  const { updatedAt: _ignored, ...publicSettings } = await getSettings();
  res.json(publicSettings);
});

router.put('/', requireAdmin, async (req, res) => {
  try {
    res.json(await updateSettings(req.body ?? {}));
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Could not save settings.' });
  }
});

export default router;
