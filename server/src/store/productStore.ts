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
  originalPrice?: number;
  tier: ProductTier;
  collection: string;
  category?: 't-shirt' | 'hoodie' | 'sweatshirt';
  colorways: Colorway[];
  defaultColor: ColorwayName;
  sizes: string[];
  isNew?: boolean;
  isBestSeller?: boolean;
  isHidden?: boolean;
}

const COLLECTION = 'products';

// Seed catalogue (also the source of truth for prices when validating orders).
const seed: Product[] = [
  {
    id: 'created-purpose',
    slug: 'created-with-a-purpose',
    name: 'Created With A Purpose',
    tagline: 'A reminder stitched into every thread.',
    verse: {
      text: 'For I know the plans I have for you, declares the Lord...',
      reference: 'Jeremiah 29:11',
    },
    description:
      'Clean script over a bold, boxed statement. A wardrobe staple that speaks intention the moment you put it on.',
    price: 250,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'white',
    colorways: [
      { name: 'white', label: 'Magnolia', swatch: '#f5f5f5', image: '/assets/created-purpose-white.webp' },
      { name: 'black', label: 'Raisin Black', swatch: '#242124', image: '/assets/created-purpose-black.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isBestSeller: true,
  },
  {
    id: 'lion-of-judah',
    slug: 'lion-of-judah',
    name: 'Lion of Judah',
    tagline: 'Strength wears a crown.',
    verse: {
      text: 'For I will be like a lion to Ephraim, and like a young lion to the house of Judah.',
      reference: 'Hosea 5:14 NKJV',
    },
    description:
      'A reverent nod to sport-brand energy, reimagined around the Lion of Judah. Heavyweight cotton.',
    price: 320,
    originalPrice: 380,
    tier: 'limited',
    collection: 'Remix',
    defaultColor: 'black',
    colorways: [
      { name: 'black', label: 'Raisin Black', swatch: '#242124', image: '/assets/lion-of-judah-black.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
    isBestSeller: true,
  },
  {
    id: 'jesus-paid-it-all',
    slug: 'jesus-paid-it-all',
    name: 'Jesus Paid It All',
    tagline: 'The debt is settled.',
    verse: {
      text: 'Having canceled the charge of our legal indebtedness... nailing it to the cross.',
      reference: 'Colossians 2:14',
    },
    description:
      'Our boldest remix – a swoosh of grace and a cross where the tick should be. Premium ringspun cotton.',
    price: 320,
    tier: 'limited',
    collection: 'Remix',
    defaultColor: 'black',
    colorways: [
      { name: 'black', label: 'Raisin Black', swatch: '#242124', image: '/assets/jesus-paid-black.webp' },
      { name: 'white', label: 'Magnolia', swatch: '#f5f5f5', image: '/assets/jesus-paid-white.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isBestSeller: true,
  },
  {
    id: 'gods-way',
    slug: 'i-want-it-gods-way',
    name: 'I Want It Gods Way',
    tagline: 'His way is life.',
    verse: {
      text: 'Jesus answered, I am the way and the truth and the life...',
      reference: 'John 14:6',
    },
    description:
      'A road stretching to the horizon, framed in a clean editorial lockup. For everyone choosing the narrow road.',
    price: 250,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'white',
    colorways: [
      { name: 'white', label: 'Magnolia', swatch: '#f5f5f5', image: '/assets/gods-way-white.webp' },
      { name: 'black', label: 'Raisin Black', swatch: '#242124', image: '/assets/gods-way-black.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'armor-hoodie',
    slug: 'the-armor-hoodie',
    name: 'The Armor Hoodie',
    tagline: 'Put on the full armor.',
    verse: {
      text: "Put on the full armor of God, so that you can take your stand against the devil's schemes.",
      reference: 'Ephesians 6:11',
    },
    description:
      'A heavyweight, oversized hoodie designed for the colder days. Premium cotton blend, soft fleece interior, and a bold statement of faith.',
    price: 450,
    tier: 'core',
    category: 'hoodie',
    collection: 'Statement',
    defaultColor: 'black',
    colorways: [
      { name: 'black', label: 'Raisin Black', swatch: '#242124', image: '/assets/armor-hoodie-black.webp' },
      { name: 'white', label: 'Magnolia', swatch: '#f5f5f5', image: '/assets/armor-hoodie-white.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'faith-sweatshirt',
    slug: 'faith-crewneck-sweatshirt',
    name: 'Faith Crewneck',
    tagline: 'Walk by faith.',
    verse: {
      text: 'For we live by faith, not by sight.',
      reference: '2 Corinthians 5:7',
    },
    description:
      'The essential crewneck sweatshirt. Clean embroidered typography on a plush, durable fabric. Perfect for layering.',
    price: 380,
    tier: 'core',
    category: 'sweatshirt',
    collection: 'Statement',
    defaultColor: 'white',
    colorways: [
      { name: 'white', label: 'Magnolia', swatch: '#f5f5f5', image: '/assets/faith-sweatshirt-white.webp' },
      { name: 'black', label: 'Raisin Black', swatch: '#242124', image: '/assets/faith-sweatshirt-black.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
  },
  {
    id: 'anointed',
    slug: 'anointed',
    name: 'Anointed',
    tagline: 'Who He says I am.',
    verse: {
      text: 'But you are a chosen people, a royal priesthood, a holy nation...',
      reference: '1 Peter 2:9',
    },
    description:
      'Minimal, confident, unmistakable. A spaced caption above a deep-red block – identity worn quietly but firmly.',
    price: 250,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'white',
    colorways: [
      { name: 'white', label: 'Magnolia', swatch: '#f5f5f5', image: '/assets/Anointed.webp' },
      { name: 'brown', label: 'Earth Brown', swatch: '#78350f', image: '/assets/Anointed-brown-shape.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'believe',
    slug: 'believe',
    name: 'Believe',
    tagline: 'Faith moves mountains.',
    verse: {
      text: 'Everything is possible for one who believes.',
      reference: 'Mark 9:23',
    },
    description:
      'Essential faith streetwear designed with minimalist, impactful lettering. Available in two colourways.',
    price: 250,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'black',
    colorways: [
      { name: 'black', label: 'Raisin Black', swatch: '#242124', image: '/assets/Believe---Copy.webp' },
      { name: 'black-v2', label: 'Midnight', swatch: '#1a1a2e', image: '/assets/Believe.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'blessed',
    slug: 'blessed',
    name: 'Blessed',
    tagline: 'Favored in every season.',
    verse: {
      text: 'Blessed is the man who trusts in the Lord, whose confidence is in Him.',
      reference: 'Jeremiah 17:7',
    },
    description:
      'A bold signature piece featuring clean typography celebrating divine favor. Four colourways – pick your declaration.',
    price: 260,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'red',
    colorways: [
      { name: 'red', label: 'Crimson Red', swatch: '#991b1b', image: '/assets/Blessed-red-1.webp' },
      { name: 'red-v2', label: 'Crimson Red II', swatch: '#7f1d1d', image: '/assets/Blessed-red-2.webp' },
      { name: 'white', label: 'Magnolia White', swatch: '#f5f5f5', image: '/assets/Blessed-white-1.webp' },
      { name: 'white-v2', label: 'Magnolia White II', swatch: '#fffbf0', image: '/assets/Blessed-white-2.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'baba-why',
    slug: 'baba-why',
    name: 'Baba Why Tee',
    tagline: 'Seeking His heart in every question.',
    verse: {
      text: 'Trust in the Lord with all your heart and lean not on your own understanding.',
      reference: 'Proverbs 3:5',
    },
    description: 'Thoughtful contemporary graphic tee.',
    price: 260,
    tier: 'core',
    collection: 'Remix',
    defaultColor: 'black',
    colorways: [
      { name: 'black', label: 'Raisin Black', swatch: '#242124', image: '/assets/Baba_why.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'd1-black-on-white',
    slug: 'd1-black-on-white',
    name: 'D1 – Black on White',
    tagline: 'Classic contrast, bold statement.',
    verse: {
      text: 'Clothe yourselves with compassion, kindness, humility.',
      reference: 'Colossians 3:12',
    },
    description: 'Crisp black-on-white graphic tee from the D-Series drop.',
    price: 260,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'white',
    colorways: [
      { name: 'white', label: 'Magnolia White', swatch: '#f5f5f5', image: '/assets/D1-Black-on-white.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'd2-script',
    slug: 'd2-script',
    name: 'D2 – Script Series',
    tagline: 'Gold, ash, or nothing at all.',
    verse: {
      text: 'Clothe yourselves with compassion, kindness, humility.',
      reference: 'Colossians 3:12',
    },
    description:
      'D2 drops in two distinct colourways – bold black-and-gold on white, and understated white on ash.',
    price: 270,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'gold',
    colorways: [
      { name: 'gold', label: 'Royal Gold', swatch: '#d97706', image: '/assets/D2-Black-and-gold-on-white.webp' },
      { name: 'gold-v2', label: 'Royal Gold II', swatch: '#b45309', image: '/assets/D2-Black-and-gold-on-white-2.webp' },
      { name: 'ash', label: 'Ash Grey', swatch: '#9ca3af', image: '/assets/D2-White-on-ash.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'd3-black-and-red',
    slug: 'd3-black-and-red',
    name: 'D3 – Black & Red',
    tagline: 'Striking contrast. Unwavering faith.',
    verse: {
      text: 'Clothe yourselves with compassion, kindness, humility.',
      reference: 'Colossians 3:12',
    },
    description: 'D3 comes in a sharp black-and-red-on-white graphic, from our D-Series statement collection.',
    price: 260,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'red',
    colorways: [
      { name: 'red', label: 'Crimson Red', swatch: '#991b1b', image: '/assets/D3-Black-and-red-on-white.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'excellent',
    slug: 'excellent',
    name: 'Excellent',
    tagline: 'A spirit of excellence.',
    verse: {
      text: 'Now Daniel was preferred above the presidents and princes, because an excellent spirit was in him.',
      reference: 'Daniel 6:3',
    },
    description:
      'Refined editorial styling on a plush heavyweight silhouette. The "Who He Says I Am – EXCELLENT" inscription in cream, or a rich earth brown.',
    price: 280,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'cream',
    colorways: [
      { name: 'cream', label: 'Cream White', swatch: '#fef3c7', image: '/assets/WHSIA-Excellent-Cream.webp' },
      { name: 'brown', label: 'Earth Brown', swatch: '#78350f', image: '/assets/Excellent-brown-shape.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'faith',
    slug: 'faith',
    name: 'Faith',
    tagline: 'Walk by faith, not by sight.',
    verse: {
      text: 'Now faith is confidence in what we hope for and assurance about what we do not see.',
      reference: 'Hebrews 11:1',
    },
    description:
      'A timeless staple embroidered with an unwavering message of trust. Two subtle colourway variations.',
    price: 260,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'black',
    colorways: [
      { name: 'black', label: 'Raisin Black', swatch: '#242124', image: '/assets/Faith---Copy.webp' },
      { name: 'black-v2', label: 'Deep Black', swatch: '#111111', image: '/assets/Faith.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'favoured',
    slug: 'favoured',
    name: 'Favoured',
    tagline: 'Walking under open heavens.',
    verse: {
      text: 'For You, Lord, will bless the righteous; with favor You will surround him as with a shield.',
      reference: 'Psalm 5:12',
    },
    description:
      'Refined graphic print on a plush heavyweight silhouette. Available in classic red/brown and a striking white colourway.',
    price: 270,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'red',
    colorways: [
      { name: 'red', label: 'Crimson Red', swatch: '#991b1b', image: '/assets/Favoured-brown-shape.webp' },
      { name: 'white', label: 'Magnolia', swatch: '#f5f5f5', image: '/assets/Favoured.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'ggg-collection',
    slug: 'ggg-collection',
    name: 'GGG Signature Tee',
    tagline: 'God is Good, Great & Glorious.',
    verse: {
      text: 'Give thanks to the Lord, for He is good; His love endures forever.',
      reference: 'Psalm 107:1',
    },
    description:
      'Eight distinct colourways spanning four design variations. A streetwear motif celebrating divine goodness – pick your iteration.',
    price: 290,
    tier: 'core',
    collection: 'Remix',
    defaultColor: 'black',
    colorways: [
      { name: 'black', label: 'GGG-1 Black', swatch: '#242124', image: '/assets/GGG-11.webp' },
      { name: 'black-alt', label: 'GGG-1 Alt', swatch: '#1a1a1a', image: '/assets/GGG-1.webp' },
      { name: 'navy', label: 'GGG-2 Navy', swatch: '#1e3a5f', image: '/assets/GGG-2.webp' },
      { name: 'navy-alt', label: 'GGG-2 Alt', swatch: '#152a47', image: '/assets/GGG-21.webp' },
      { name: 'white', label: 'GGG-3 White', swatch: '#f5f5f5', image: '/assets/GGG-3.webp' },
      { name: 'white-alt', label: 'GGG-3 Alt', swatch: '#fafafa', image: '/assets/GGG-31.webp' },
      { name: 'grey', label: 'GGG-4 Grey', swatch: '#9ca3af', image: '/assets/GGG-4.webp' },
      { name: 'grey-alt', label: 'GGG-4 Alt', swatch: '#6b7280', image: '/assets/GGG-41.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
    isBestSeller: true,
  },
  {
    id: 'god-bless-me',
    slug: 'god-bless-me',
    name: 'God Bless Me',
    tagline: 'A prayer of petition & gratitude.',
    verse: {
      text: 'Oh, that you would bless me and enlarge my territory!',
      reference: '1 Chronicles 4:10',
    },
    description:
      'Clean typographic lockup with vivid contrast on durable ring-spun fabric. Red or white – both carry the prayer.',
    price: 260,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'red',
    colorways: [
      { name: 'red', label: 'Crimson Red', swatch: '#991b1b', image: '/assets/God-Bless-Me-red.webp' },
      { name: 'white', label: 'Magnolia White', swatch: '#f5f5f5', image: '/assets/God-Bless-Me-white.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'god-is-with-me',
    slug: 'god-is-with-me',
    name: 'God Is With Me',
    tagline: 'Never alone.',
    verse: {
      text: 'Fear not, for I am with you; do not be dismayed, for I am your God.',
      reference: 'Isaiah 41:10',
    },
    description: 'Comforting & powerful graphic lockup on high-density cotton.',
    price: 250,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'black',
    colorways: [
      { name: 'black', label: 'Raisin Black', swatch: '#242124', image: '/assets/God_is_with_me.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'i-am-confident',
    slug: 'i-am-confident',
    name: 'I Am Confident',
    tagline: 'Unshakable courage.',
    verse: {
      text: 'Being confident of this, that He who began a good work in you will carry it on to completion.',
      reference: 'Philippians 1:6',
    },
    description:
      'Striking graphic print crafted for everyday boldness. Two red colourway variations to match your mood.',
    price: 270,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'red',
    colorways: [
      { name: 'red', label: 'Crimson Red', swatch: '#991b1b', image: '/assets/I-am-Confident-red-1.webp' },
      { name: 'red-v2', label: 'Crimson Red II', swatch: '#7f1d1d', image: '/assets/I-am-Confident-red-2.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'jesus-saves',
    slug: 'jesus-saves',
    name: 'Jesus Saves',
    tagline: 'The ultimate truth.',
    verse: {
      text: 'For the Son of Man came to seek and to save the lost.',
      reference: 'Luke 19:10',
    },
    description:
      'Iconic evangelical statement tee with vintage contrast styling. Available in Raisin Black and Ash Grey.',
    price: 250,
    tier: 'core',
    collection: 'Remix',
    defaultColor: 'black',
    colorways: [
      { name: 'black', label: 'Raisin Black', swatch: '#242124', image: '/assets/Jesus_saves.webp' },
      { name: 'ash', label: 'Ash Grey', swatch: '#9ca3af', image: '/assets/Jesus_Saves_Gray.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'jesus-sets-free',
    slug: 'jesus-sets-free',
    name: 'Jesus Sets Free',
    tagline: 'True liberty.',
    verse: {
      text: 'So if the Son sets you free, you will be free indeed.',
      reference: 'John 8:36',
    },
    description:
      'Bold center graphic celebrating redemption and spiritual freedom. The "One Thing Is Sure – Jesus Sets Free" inscription on crisp white.',
    price: 260,
    tier: 'core',
    collection: 'Remix',
    defaultColor: 'white',
    colorways: [
      { name: 'white', label: 'Magnolia White', swatch: '#f5f5f5', image: '/assets/Jesus_Sets_Free.webp' },
      { name: 'white-k2', label: 'Magnolia White II', swatch: '#fffbf0', image: '/assets/K2.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'light-of-the-world',
    slug: 'light-of-the-world',
    name: 'Light of the World',
    tagline: 'Shine in the darkness.',
    verse: {
      text: 'You are the light of the world. A town built on a hill cannot be hidden.',
      reference: 'Matthew 5:14',
    },
    description:
      'Six colourways across multiple design iterations. The LOTW inscription in black, brown, pink, and beyond – find your light.',
    price: 280,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'black',
    colorways: [
      { name: 'black', label: 'Raisin Black', swatch: '#242124', image: '/assets/LOTW-1-alt.webp' },
      { name: 'black-ii', label: 'LOTW II Black', swatch: '#1a1a1a', image: '/assets/LOTW-2-alt.webp' },
      { name: 'roman-i', label: 'LOTW I', swatch: '#374151', image: '/assets/LOTW-I.webp' },
      { name: 'roman-ii', label: 'LOTW II', swatch: '#4b5563', image: '/assets/LOTW-II.webp' },
      { name: 'brown', label: 'Earth Brown', swatch: '#78350f', image: '/assets/LOTW-brown-1.webp' },
      { name: 'pink', label: 'Dusty Pink', swatch: '#f472b6', image: '/assets/LOTW-pink-1.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
    isBestSeller: true,
  },
  {
    id: 'made-for-more',
    slug: 'made-for-more',
    name: 'Made For More',
    tagline: 'Surpassing ordinary boundaries.',
    verse: {
      text: 'Now to Him who is able to do immeasurably more than all we ask or imagine...',
      reference: 'Ephesians 3:20',
    },
    description: 'Modern streetwear design inspiring higher purpose.',
    price: 270,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'black',
    colorways: [
      { name: 'black', label: 'Raisin Black', swatch: '#242124', image: '/assets/Made_For_More.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'psalms-3-6',
    slug: 'psalms-3-6',
    name: 'Psalms 3:6 Tee',
    tagline: 'I will not fear tens of thousands.',
    verse: {
      text: 'I will not fear though tens of thousands assail me on every side.',
      reference: 'Psalm 3:6',
    },
    description: 'Bold scripture design reminding you of divine protection.',
    price: 270,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'black',
    colorways: [
      { name: 'black', label: 'Raisin Black', swatch: '#242124', image: '/assets/Psalms-3v6.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'redemption',
    slug: 'redemption',
    name: 'Redemption',
    tagline: 'Purchased by grace.',
    verse: {
      text: 'In Him we have redemption through His blood, the forgiveness of sins.',
      reference: 'Ephesians 1:7',
    },
    description:
      'Deeply resonant scripture print on ultra-soft premium cotton. Red colourway with bold graphic.',
    price: 270,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'red',
    colorways: [
      { name: 'red', label: 'Crimson Red', swatch: '#991b1b', image: '/assets/Redemption.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'redemption-through-the-blood',
    slug: 'redemption-through-the-blood',
    name: 'Redemption Through The Blood',
    tagline: 'This He did once and for all.',
    verse: {
      text: 'And by that will, we have been made holy through the sacrifice of the body of Jesus Christ once for all.',
      reference: 'Hebrews 10:10',
    },
    description:
      'Dramatic chain-breaking graphic with bold brushstroke lettering. A powerful declaration of what the cross accomplished.',
    price: 280,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'white',
    colorways: [
      {
        name: 'white',
        label: 'Magnolia White',
        swatch: '#f5f5f5',
        image: '/assets/Redemption_through_the_blood.webp',
      },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'submit-to-god',
    slug: 'submit-to-god',
    name: 'Submit To God',
    tagline: 'Surrender brings strength.',
    verse: {
      text: 'Submit yourselves, then, to God. Resist the devil, and he will flee from you.',
      reference: 'James 4:7',
    },
    description: 'Impactful text piece highlighting spiritual authority through humility.',
    price: 260,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'black',
    colorways: [
      { name: 'black', label: 'Raisin Black', swatch: '#242124', image: '/assets/Submit_to_God.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'the-script-of-life',
    slug: 'the-script-of-life',
    name: "God's Word – The Script of Life",
    tagline: 'Written by the Master Author.',
    verse: {
      text: 'Your eyes saw my unformed body; all the days ordained for me were written in your book.',
      reference: 'Psalm 139:16',
    },
    description:
      "Six colourways spanning the full TSOL range – from the signature white 'God's Word' tee to bold typographic and red-accent variants. The same inscription, six expressions.",
    price: 280,
    tier: 'core',
    collection: 'Remix',
    defaultColor: 'white',
    colorways: [
      { name: 'white', label: "God's Word – White", swatch: '#f5f5f5', image: '/assets/The-Script-of-Life.webp' },
      { name: 'tsol-2', label: 'TSOL 2 – White', swatch: '#f0f0f0', image: '/assets/TSOL-2.webp' },
      { name: 'tsol-3', label: 'TSOL 3 – Script', swatch: '#e8e8e8', image: '/assets/TSOL-3.webp' },
      { name: 'tsol-4', label: 'TSOL 4 – Bold', swatch: '#dddddd', image: '/assets/TSOL-4.webp' },
      { name: 'tsol-5', label: 'TSOL 5 – Premium', swatch: '#d0d0d0', image: '/assets/TSOL-5.webp' },
      { name: 'red', label: 'TSOL Red', swatch: '#991b1b', image: '/assets/TSOL-red-4.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
    isBestSeller: true,
  },
  {
    id: 'vain-is-the-help-of-man',
    slug: 'vain-is-the-help-of-man',
    name: 'Vain Is The Help Of Man',
    tagline: 'Only God sustains.',
    verse: {
      text: 'Give us aid against the enemy, for human help is worthless.',
      reference: 'Psalm 108:12',
    },
    description:
      'A sobering declaration printed boldly on heavyweight cotton. Place your trust where it belongs.',
    price: 260,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'black',
    colorways: [
      { name: 'black', label: 'Raisin Black', swatch: '#242124', image: '/assets/Vain_Is_The_Help_Of_Man.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'with-god',
    slug: 'with-god-all-things-are-possible',
    name: 'With God',
    tagline: 'All things are possible.',
    verse: {
      text: 'With man this is impossible, but with God all things are possible.',
      reference: 'Matthew 19:26',
    },
    description:
      'Oversized graphic drop in a rich burnt-sienna / rust tone. The "With GOD – All Things Are Possible" inscription in a bold editorial lockup.',
    price: 270,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'rust',
    colorways: [
      { name: 'rust', label: 'Burnt Sienna', swatch: '#92400e', image: '/assets/With_God.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'white-on-ash',
    slug: 'white-on-ash',
    name: 'White on Ash',
    tagline: 'Quiet conviction.',
    verse: {
      text: 'Clothe yourselves with compassion, kindness, humility.',
      reference: 'Colossians 3:12',
    },
    description:
      'Two ash-grey tees with white lettering – a subtle, understated colourway for everyday faith wear.',
    price: 250,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'ash',
    colorways: [
      { name: 'ash', label: 'Ash Grey', swatch: '#9ca3af', image: '/assets/White-on-Ash.webp' },
      { name: 'ash-v2', label: 'Ash Grey II', swatch: '#d1d5db', image: '/assets/white-on-ash1.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'white-on-red',
    slug: 'white-on-red',
    name: 'White on Red',
    tagline: 'The blood-red backdrop. The white inscription.',
    verse: {
      text: 'Though your sins are like scarlet, they shall be as white as snow.',
      reference: 'Isaiah 1:18',
    },
    description: 'High-contrast white lettering on a deep crimson-red tee – faith front and center.',
    price: 260,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'red',
    colorways: [
      { name: 'red', label: 'Crimson Red', swatch: '#991b1b', image: '/assets/white-on-red.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'black-on-white',
    slug: 'black-on-white',
    name: 'Black on White',
    tagline: 'Clean. Classic. Convicting.',
    verse: {
      text: 'Clothe yourselves with compassion, kindness, humility.',
      reference: 'Colossians 3:12',
    },
    description:
      'Two clean black-on-white graphic tees – one with a stroke accent. Minimalist faith wear at its finest.',
    price: 250,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'white',
    colorways: [
      { name: 'white', label: 'Magnolia White', swatch: '#f5f5f5', image: '/assets/Black-on-white.webp' },
      { name: 'white-v2', label: 'Magnolia White II', swatch: '#fffbf0', image: '/assets/Black-on-white-1.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'black-text-on-ash',
    slug: 'black-text-on-ash',
    name: 'Black Text on Ash',
    tagline: 'Subdued palette, loud message.',
    verse: {
      text: 'Clothe yourselves with compassion, kindness, humility.',
      reference: 'Colossians 3:12',
    },
    description: 'Classic ash grey tee with bold black lettering – understated everyday streetwear.',
    price: 250,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'ash',
    colorways: [
      { name: 'ash', label: 'Ash Grey', swatch: '#9ca3af', image: '/assets/Black-text-on-ash.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'stroke-series',
    slug: 'stroke-series',
    name: 'Stroke Series',
    tagline: 'Three colours, one conviction.',
    verse: {
      text: 'Clothe yourselves with compassion, kindness, humility.',
      reference: 'Colossians 3:12',
    },
    description:
      'Same clean graphic, three vivid stroke-accent colourways: cyan, red, and gold. A bold pop of colour on white.',
    price: 260,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'cyan',
    colorways: [
      {
        name: 'cyan',
        label: 'Cyan Stroke',
        swatch: '#06b6d4',
        image: '/assets/Black-with-cyan-stroke-on-white-1.webp',
      },
      {
        name: 'red',
        label: 'Red Stroke',
        swatch: '#991b1b',
        image: '/assets/Black-with-red-stroke-on-white.webp',
      },
      {
        name: 'gold',
        label: 'Gold Stroke',
        swatch: '#d97706',
        image: '/assets/Black-with-yellow-stroke-on-white.webp',
      },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'gold-on-white',
    slug: 'gold-on-white',
    name: 'Gold on White',
    tagline: 'Royal in every thread.',
    verse: {
      text: 'The King is enthralled by your beauty; honor Him, for He is your Lord.',
      reference: 'Psalm 45:11',
    },
    description: 'Rich gold lettering on white – a regal, premium statement piece.',
    price: 270,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'gold',
    colorways: [
      { name: 'gold', label: 'Royal Gold', swatch: '#d97706', image: '/assets/Gold-on-white.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'ash-on-black-maze',
    slug: 'ash-on-black-maze',
    name: 'Ash on Black – Maze',
    tagline: 'Navigate by faith.',
    verse: {
      text: 'Clothe yourselves with compassion, kindness, humility.',
      reference: 'Colossians 3:12',
    },
    description:
      'An intricate maze graphic on ash, layered over a deep black tee. Complex by design, clear in conviction.',
    price: 260,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'ash',
    colorways: [
      { name: 'ash', label: 'Ash Grey', swatch: '#9ca3af', image: '/assets/Ash-on-Black---maze.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'created-with-purpose',
    slug: 'created-with-purpose',
    name: 'Created With Purpose',
    tagline: 'Every stitch intentional.',
    verse: {
      text: "For we are God's handiwork, created in Christ Jesus to do good works.",
      reference: 'Ephesians 2:10',
    },
    description: 'High quality graphic garment carrying an empowering message of purposeful living.',
    price: 260,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'black',
    colorways: [
      { name: 'black', label: 'Raisin Black', swatch: '#242124', image: '/assets/Created_with_purpose.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'brown-tee',
    slug: 'brown-tee',
    name: 'Brown Tee',
    tagline: 'Earth tones. Heavenly message.',
    verse: {
      text: 'Clothe yourselves with compassion, kindness, humility.',
      reference: 'Colossians 3:12',
    },
    description: 'A rich earth-brown garment with a bold faith graphic. Grounded in purpose.',
    price: 260,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'brown',
    colorways: [
      { name: 'brown', label: 'Earth Brown', swatch: '#78350f', image: '/assets/Brown-2.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'levush-collegiate',
    slug: 'levush-collegiate',
    name: 'Levush Collegiate',
    tagline: 'Wear the Word. Bear the name.',
    verse: {
      text: 'Whatever you do, do it all for the glory of God.',
      reference: '1 Corinthians 10:31',
    },
    description:
      'The Levush name in the CollegiateFLF typeface – a heritage-inspired graphic for the faith community.',
    price: 250,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'black',
    colorways: [
      { name: 'black', label: 'Raisin Black', swatch: '#242124', image: '/assets/Levush_Text_CollegiateFLF.webp' },
      { name: 'black-bold', label: 'GoBold Black', swatch: '#111111', image: '/assets/Levush_Text_Gobold_Bold.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'white-shirt',
    slug: 'white-shirt',
    name: 'The White Tee',
    tagline: 'Clean slate. Pure intention.',
    verse: {
      text: 'Though your sins are like scarlet, they shall be as white as snow.',
      reference: 'Isaiah 1:18',
    },
    description: 'Crisp white premium tee – the wardrobe essential for every faith-forward wardrobe.',
    price: 240,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'white',
    colorways: [
      { name: 'white', label: 'Magnolia White', swatch: '#f5f5f5', image: '/assets/White_Shirt.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
  {
    id: 'ash-shirt',
    slug: 'ash-shirt',
    name: 'The Ash Tee',
    tagline: 'Muted palette, unmuted faith.',
    verse: {
      text: 'Clothe yourselves with compassion, kindness, humility.',
      reference: 'Colossians 3:12',
    },
    description:
      'Two ash-grey colourway variations for a clean, everyday faith tee. Subtle, premium, intentional.',
    price: 250,
    tier: 'core',
    collection: 'Statement',
    defaultColor: 'ash',
    colorways: [
      { name: 'ash', label: 'Ash Grey', swatch: '#9ca3af', image: '/assets/Ash_Shirt.webp' },
      { name: 'ash-v2', label: 'Ash Grey II', swatch: '#d1d5db', image: '/assets/Ash_Shirt---Copy.webp' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    isNew: true,
  },
];

/** Seed Firestore once if the products collection is empty. */
export async function initProducts(): Promise<void> {
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
  const snap = await db.collection(COLLECTION).get();
  return snap.docs.map((d) => d.data() as Product);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const snap = await db.collection(COLLECTION).where('slug', '==', slug).limit(1).get();
  if (!snap.empty) {
    return snap.docs[0].data() as Product;
  }
  return undefined;
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
    originalPrice: input.originalPrice ? Number(input.originalPrice) : undefined,
    tier: input.tier === 'limited' ? 'limited' : 'core',
    collection: input.collection ?? 'Statement',
    colorways: input.colorways?.length
      ? input.colorways
      : [{ name: 'black', label: 'Raisin Black', swatch: '#242124', image: '/assets/created-purpose-black.webp' }],
    defaultColor: input.defaultColor ?? input.colorways?.[0]?.name ?? 'black',
    sizes: input.sizes?.length ? input.sizes : ['S', 'M', 'L', 'XL', '2XL'],
    isNew: input.isNew ?? false,
    isBestSeller: input.isBestSeller ?? false,
    isHidden: input.isHidden ?? false,
  };
  await db.collection(COLLECTION).doc(product.id).set(product);
  return product;
}

export async function updateProduct(id: string, patch: Partial<Product>): Promise<Product | null> {
  const ref = db.collection(COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const next = { ...(snap.data() as Product), ...patch, id };
  await ref.set(next);
  return next;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const ref = db.collection(COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.delete();
  return true;
}

/** Price lookup directly from Firestore for order validation. */
export async function priceOf(productId: string): Promise<number | undefined> {
  const doc = await db.collection(COLLECTION).doc(productId).get();
  if (doc.exists) {
    return (doc.data() as Product).price;
  }
  return undefined;
}

