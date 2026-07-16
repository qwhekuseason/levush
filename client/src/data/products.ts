import type { LookbookItem, Product, Testimonial, VerseChip } from '@/types';

export const products: Product[] = [
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

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export const collections = ['All', 'Statement', 'Remix'] as const;

export const verseChips: VerseChip[] = [
  { snippet: 'Wear the Word.', reference: 'Levush' },
  { snippet: 'Be transformed by the renewing of your mind.', reference: 'Romans 12:2' },
  { snippet: 'Clothe yourselves with compassion, kindness, humility.', reference: 'Colossians 3:12' },
  { snippet: 'She is clothed with strength and dignity.', reference: 'Proverbs 31:25' },
];

export const testimonials: Testimonial[] = [
  {
    quote:
      'I get stopped at least once a day asking about the Lion of Judah tee. It’s become my favourite conversation starter about faith.',
    author: 'Kwabena O.',
    location: 'Kumasi',
  },
  {
    quote:
      'The fabric is genuinely premium — heavier than I expected and the print hasn’t cracked after months of wear.',
    author: 'Ama D.',
    location: 'Accra',
  },
  {
    quote:
      'More than clothing. Every piece feels intentional, like a quiet sermon you can wear. Beautiful work.',
    author: 'Selorm K.',
    location: 'Tema',
  },
];

export const lookbook: LookbookItem[] = [
  { productId: 'lion-of-judah', collection: 'Remix', caption: 'Strength wears a crown', ref: 'Hosea 5:14' },
  { productId: 'created-purpose', collection: 'Statement', caption: 'Made on purpose', ref: 'Jeremiah 29:11' },
  { productId: 'jesus-paid-it-all', collection: 'Remix', caption: 'The debt is settled', ref: 'Colossians 2:14' },
  { productId: 'gods-way', collection: 'Statement', caption: 'The narrow road', ref: 'John 14:6' },
  { productId: 'anointed', collection: 'Statement', caption: 'Who He says I am', ref: '1 Peter 2:9' },
  { productId: 'created-purpose', collection: 'Statement', caption: 'Everyday intention', ref: 'Jeremiah 29:11' },
];

