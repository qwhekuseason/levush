import { randomUUID } from 'node:crypto';
import { db } from '../lib/firebaseAdmin.js';

export type ColorwayName = string;
export type ProductTier = 'core' | 'limited';

export interface Colorway {
  name: ColorwayName;
  label: string;
  swatch: string;
  image: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  verse: { text: string; reference: string };
  description: string;
  price: number;
  tier: ProductTier;
  collection: string;
  category?: 't-shirt' | 'hoodie' | 'sweatshirt';
  colorways: Colorway[];
  defaultColor: ColorwayName;
  sizes: string[];
  isNew?: boolean;
  isBestSeller?: boolean;
}

const COLLECTION = 'products';

// Seed catalogue (also the source of truth for prices when validating orders).
const seed: Product[] = [
  {
    id: 'created-purpose',
    slug: 'created-with-a-purpose',
    name: 'Created With A Purpose',
    tagline: 'A reminder stitched into every thread.',
    verse: { text: '“For I know the plans I have for you,” declares the Lord…', reference: 'Jeremiah 29:11' },
    description:
      'Clean script over a bold, boxed statement. A wardrobe staple that speaks intention the moment you put it on.',
    price: 250,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'white',
    colorways: [
      { name: 'white', label: 'Magnolia', swatch: '#f5f5f5', image: '/assets/created-purpose-white.jpg' },
      { name: 'black', label: 'Raisin Black', swatch: '#242124', image: '/assets/created-purpose-black.jpg' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isBestSeller: true,
  },
  {
    id: 'lion-of-judah',
    slug: 'lion-of-judah',
    name: 'Lion of Judah',
    tagline: 'Strength wears a crown.',
    verse: { text: "'For I will be like a lion to Ephraim, and like a young lion to the house of Judah.'", reference: 'Hosea 5:14 NKJV' },
    description: 'A reverent nod to sport-brand energy, reimagined around the Lion of Judah. Heavyweight cotton.',
    price: 320,
    tier: 'limited',
    collection: 'Remix',
    defaultColor: 'black',
    colorways: [{ name: 'black', label: 'Raisin Black', swatch: '#242124', image: '/assets/lion-of-judah-black.jpg' }],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
    isBestSeller: true,
  },
  {
    id: 'anointed',
    slug: 'anointed',
    name: 'Anointed',
    tagline: 'Who He says I am.',
    verse: { text: 'But you are a chosen people, a royal priesthood, a holy nation…', reference: '1 Peter 2:9' },
    description: 'Minimal, confident, unmistakable. A spaced caption above a deep-red block — identity worn quietly but firmly.',
    price: 250,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'white',
    colorways: [{ name: 'white', label: 'Magnolia', swatch: '#f5f5f5', image: '/assets/anointed-white.jpg' }],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'jesus-paid-it-all',
    slug: 'jesus-paid-it-all',
    name: 'Jesus Paid It All',
    tagline: 'The debt is settled.',
    verse: { text: 'Having canceled the charge of our legal indebtedness… nailing it to the cross.', reference: 'Colossians 2:14' },
    description: 'Our boldest remix — a swoosh of grace and a cross where the tick should be. Premium ringspun cotton.',
    price: 320,
    tier: 'limited',
    collection: 'Remix',
    defaultColor: 'black',
    colorways: [
      { name: 'black', label: 'Raisin Black', swatch: '#242124', image: '/assets/jesus-paid-black.jpg' },
      { name: 'white', label: 'Magnolia', swatch: '#f5f5f5', image: '/assets/jesus-paid-white.jpg' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isBestSeller: true,
  },
  {
    id: 'gods-way',
    slug: 'i-want-it-gods-way',
    name: "I Want It God's Way",
    tagline: 'His way is life.',
    verse: { text: 'Jesus answered, “I am the way and the truth and the life…”', reference: 'John 14:6' },
    description: 'A road stretching to the horizon, framed in a clean editorial lockup. For everyone choosing the narrow road.',
    price: 250,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'white',
    colorways: [
      { name: 'white', label: 'Magnolia', swatch: '#f5f5f5', image: '/assets/gods-way-white.jpg' },
      { name: 'black', label: 'Raisin Black', swatch: '#242124', image: '/assets/gods-way-black.jpg' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'armor-hoodie',
    slug: 'the-armor-hoodie',
    name: 'The Armor Hoodie',
    tagline: 'Put on the full armor.',
    verse: { text: 'Put on the full armor of God, so that you can take your stand against the devil’s schemes.', reference: 'Ephesians 6:11' },
    description: 'A heavyweight, oversized hoodie designed for the colder days. Premium cotton blend, soft fleece interior, and a bold statement of faith.',
    price: 450,
    tier: 'core',
    category: 'hoodie',
    collection: 'Statement',
    defaultColor: 'black',
    colorways: [
      { name: 'black', label: 'Raisin Black', swatch: '#242124', image: '/assets/armor-hoodie-black.png' },
      { name: 'white', label: 'Magnolia', swatch: '#f5f5f5', image: '/assets/armor-hoodie-white.png' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'faith-sweatshirt',
    slug: 'faith-crewneck-sweatshirt',
    name: 'Faith Crewneck',
    tagline: 'Walk by faith.',
    verse: { text: 'For we live by faith, not by sight.', reference: '2 Corinthians 5:7' },
    description: 'The essential crewneck sweatshirt. Clean embroidered typography on a plush, durable fabric. Perfect for layering.',
    price: 380,
    tier: 'core',
    category: 'sweatshirt',
    collection: 'Statement',
    defaultColor: 'white',
    colorways: [
      { name: 'white', label: 'Magnolia', swatch: '#f5f5f5', image: '/assets/faith-sweatshirt-white.png' },
      { name: 'black', label: 'Raisin Black', swatch: '#242124', image: '/assets/faith-sweatshirt-black.png' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
  },
];

let memory: Product[] = seed.map((p) => ({ ...p }));

/** Seed Firestore once if the products collection is empty. */
export async function initProducts(): Promise<void> {
  if (!db) return;
  const snap = await db.collection(COLLECTION).limit(1).get();
  if (snap.empty) {
    const batch = db.batch();
    for (const p of seed) batch.set(db.collection(COLLECTION).doc(p.id), p);
    await batch.commit();
    console.log('[products] Seeded Firestore with starter catalogue.');
  }
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function listProducts(): Promise<Product[]> {
  if (!db) return [...memory];
  const snap = await db.collection(COLLECTION).get();
  return snap.docs.map((d) => d.data() as Product);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return (await listProducts()).find((p) => p.slug === slug);
}

export async function createProduct(input: Partial<Product>): Promise<Product> {
  const id = input.id?.trim() || slugify(input.name ?? '') || randomUUID().slice(0, 8);
  const product: Product = {
    id,
    slug: input.slug?.trim() || slugify(input.name ?? id),
    name: input.name ?? 'Untitled',
    tagline: input.tagline ?? '',
    verse: input.verse ?? { text: '', reference: '' },
    description: input.description ?? '',
    price: Number(input.price) || 0,
    tier: input.tier === 'limited' ? 'limited' : 'core',
    collection: input.collection ?? 'Statement',
    colorways: input.colorways?.length
      ? input.colorways
      : [{ name: 'black', label: 'Raisin Black', swatch: '#242124', image: '/assets/created-purpose-black.jpg' }],
    defaultColor: input.defaultColor ?? input.colorways?.[0]?.name ?? 'black',
    sizes: input.sizes?.length ? input.sizes : ['S', 'M', 'L', 'XL', '2XL'],
    isNew: input.isNew ?? false,
    isBestSeller: input.isBestSeller ?? false,
  };
  if (!db) {
    memory.unshift(product);
  } else {
    await db.collection(COLLECTION).doc(product.id).set(product);
  }
  return product;
}

export async function updateProduct(id: string, patch: Partial<Product>): Promise<Product | null> {
  if (!db) {
    const idx = memory.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    memory[idx] = { ...memory[idx], ...patch, id };
    return memory[idx];
  }
  const ref = db.collection(COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const next = { ...(snap.data() as Product), ...patch, id };
  await ref.set(next);
  return next;
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (!db) {
    const before = memory.length;
    memory = memory.filter((p) => p.id !== id);
    return memory.length < before;
  }
  const ref = db.collection(COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.delete();
  return true;
}

/** Price lookup used by order validation. */
export async function priceOf(productId: string): Promise<number | undefined> {
  const p = (await listProducts()).find((x) => x.id === productId);
  return p?.price;
}
