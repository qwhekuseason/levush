import { Router } from 'express';
import { resolveCaller } from '../lib/auth.js';

const router = Router();

/** Returns the caller's identity + role (or anonymous/customer). */
router.get('/', async (req, res) => {
  const caller = await resolveCaller(req);
  if (!caller) return res.json({ authenticated: false, role: 'customer' });
  res.json({ authenticated: true, uid: caller.uid, email: caller.email, role: caller.role });
});

export default router;
