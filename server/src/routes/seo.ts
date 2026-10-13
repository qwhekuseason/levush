import { Router, type Request } from 'express';
import { getProductBySlug, listProducts } from '../store/productStore.js';

const router = Router();

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Public origin of the site (SITE_URL wins; otherwise the host Vercel forwarded). */
function origin(req: Request): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  const host = req.headers['x-forwarded-host'] ?? req.headers.host ?? 'levush.vercel.app';
  const proto = req.headers['x-forwarded-proto'] ?? 'https';
  return `${proto}://${host}`;
}

/**
 * Link-preview page for a product. vercel.json sends only link-preview bots
 * (WhatsApp, Facebook, X, Telegram…) here; people get the normal app.
 */
// Vercel rewrites keep the original URL, so bots arrive as /shop/:slug.
router.get(['/share/:slug', '/shop/:slug'], async (req, res) => {
  const site = origin(req);
  const product = await getProductBySlug(req.params.slug).catch(() => undefined);
  const url = `${site}/shop/${encodeURIComponent(req.params.slug)}`;
  if (!product || product.isHidden) {
    return res.redirect(302, `${site}/shop`);
  }
  const colour = product.colorways.find((c) => c.name === product.defaultColor) ?? product.colorways[0];
  // Previews need a real image URL; inline (data:) images fall back to the brand card.
  const image = colour?.image && /^https?:\/\//.test(colour.image)
    ? colour.image
    : colour?.image?.startsWith('/') ? `${site}${colour.image}` : `${site}/og-image.jpg`;
  const title = `${product.name} — Levush`;
  const desc = [product.verse?.reference, product.tagline, `GH₵${product.price}`].filter(Boolean).join(' · ');

  res.set('Cache-Control', 'public, max-age=300, s-maxage=3600');
  res.type('html').send(`<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="Levush">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(image)}">
<meta property="product:price:amount" content="${esc(product.price)}">
<meta property="product:price:currency" content="GHS">
<meta name="twitter:card" content="summary_large_image">
</head><body><a href="${esc(url)}">${esc(title)}</a></body></html>`);
});

/** sitemap.xml (served at /sitemap.xml via vercel.json). */
router.get(['/sitemap', '/sitemap.xml'], async (req, res) => {
  const site = origin(req);
  const pages = ['/', '/shop', '/about', '/contact', '/track', '/policies/shipping-returns', '/policies/terms', '/policies/privacy'];
  const products = (await listProducts().catch(() => [])).filter((p) => !p.isHidden);
  const urls = [...pages.map((p) => `${site}${p}`), ...products.map((p) => `${site}/shop/${encodeURIComponent(p.slug)}`)];
  res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((u) => `  <url><loc>${esc(u)}</loc></url>`)
      .join('\n')}\n</urlset>\n`
  );
});

export default router;
