import type { NextFunction, Request, Response } from 'express';

/**
 * The caller's IP. Vercel sets x-real-ip (and overwrites x-forwarded-for) itself,
 * so these can't be spoofed there; elsewhere fall back to the socket address.
 */
export function clientIp(req: Request): string {
  const real = req.headers['x-real-ip'];
  if (typeof real === 'string' && real) return real;
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd) return fwd.split(',')[0].trim();
  return req.socket.remoteAddress ?? 'unknown';
}

/**
 * Simple per-IP limiter. State lives per server instance, so on serverless it's
 * a speed bump rather than a wall — enough to stop casual guessing and spam.
 */
export function rateLimit(opts: { max: number; windowMs: number; message: string }) {
  const hits = new Map<string, { n: number; reset: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const ip = clientIp(req);
    const entry = hits.get(ip);
    if (entry && entry.reset > now) {
      if (entry.n >= opts.max) return res.status(429).json({ error: opts.message });
      entry.n += 1;
    } else {
      hits.set(ip, { n: 1, reset: now + opts.windowMs });
      if (hits.size > 5000) for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
    }
    next();
  };
}
