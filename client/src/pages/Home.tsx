import { Link } from 'react-router-dom';
import { testimonials, verseChips } from '@/data/products';
import { useCatalog } from '@/context/CatalogContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { formatPrice } from '@/lib/format';
import ProductCard from '@/components/ProductCard';
import Reveal from '@/components/Reveal';
import ShowcaseVideo from '@/components/ShowcaseVideo';
import CinematicIntro from '@/components/CinematicIntro';
import LightReveal from '@/components/LightReveal';
import { ArrowRight, StarIcon } from '@/components/icons';
import type { HomeSectionKey } from '@/types';

export default function Home() {
  const { products } = useCatalog();
  const { settings } = useStoreSettings();
  const { hero: heroText, featuredIds, sections, intro, light } = settings.homepage;

  // Opening-title photos: the studio model shots attached to products (light 640px copies).
  const introImages = (() => {
    const fromProducts = products
      .map((p) => p.modelImage)
      .filter((src): src is string => Boolean(src && /^\/assets\/models\/IMG_\d+\.webp$/.test(src)));
    const fallback = ['IMG_2765', 'IMG_2761', 'IMG_2757', 'IMG_2772', 'IMG_2770', 'IMG_2763'].map((n) => `/assets/models/${n}.webp`);
    const list = [...new Set([...fromProducts, ...fallback])].slice(0, 6);
    return list.map((src) => src.replace(/\.webp$/, '-640.webp'));
  })();

  // "Light of the World" photo: the studio shot, or one of the chosen product's images.
  const STUDIO = '/assets/models/IMG_2763.webp';
  const lightProduct = products.find((p) => p.id === light.productId);
  const lightImage = (() => {
    const ref = light.imageRef;
    if (ref === 'model' && lightProduct?.modelImage) return lightProduct.modelImage;
    if (ref.startsWith('color:')) {
      const c = lightProduct?.colorways.find((x) => x.name === ref.slice(6));
      if (c?.image) return c.image;
    }
    if (ref.startsWith('gallery:')) {
      const g = lightProduct?.gallery?.[Number(ref.slice(8))];
      if (g) return g;
    }
    return STUDIO;
  })();

  // "New & Noted": the admin's picks (in their order), else the first four pieces.
  const picked = featuredIds.map((id) => products.find((p) => p.id === id)).filter((p) => p !== undefined);
  const featured = picked.length ? picked : products.slice(0, 4);

  // Hero line 2: the last word is highlighted (e.g. "You *Believe*").
  const accentWords = heroText.accent.trim().split(/\s+/);
  const accentLast = accentWords.pop() ?? '';
  const accentLead = accentWords.join(' ');

  const lookbookItems = [
    {
      id: 'look-1',
      image: '/assets/models/IMG_2756.webp',
      title: 'Good Good God',
      ref: 'Psalm 107:1',
      color: 'Cream Warmth',
      to: '/shop/ggg-collection',
      span: 'md:col-span-1 md:row-span-2',
    },
    {
      id: 'look-2',
      image: '/assets/models/IMG_2765.webp',
      title: 'Lion of Judah',
      ref: 'Hosea 5:14',
      color: 'Crimson Red',
      to: '/shop/lion-of-judah',
      span: 'md:col-span-1',
    },
    {
      id: 'look-3',
      image: '/assets/models/IMG_2763.webp',
      title: 'Light of the World',
      ref: 'Matthew 5:14',
      color: 'Earth Brown',
      to: '/shop/light-of-the-world',
      span: 'md:col-span-1',
    },
    {
      id: 'look-4',
      image: '/assets/models/IMG_2762.webp',
      title: 'God Is With Me',
      ref: 'Isaiah 41:10',
      color: 'Magnolia White',
      to: '/shop/god-is-with-me',
      span: 'md:col-span-1',
    },
    {
      id: 'look-5',
      image: '/assets/models/IMG_2764.webp',
      title: 'El-Roi',
      ref: 'Genesis 16:13',
      color: 'Burgundy Earth',
      to: '/shop/el-roi',
      span: 'md:col-span-1',
    },
    {
      id: 'look-6',
      image: '/assets/models/IMG_2784.webp',
      title: 'I Want It God’s Way',
      ref: 'John 14:6',
      color: 'Earth Brown',
      to: '/shop/i-want-it-gods-way',
      span: 'md:col-span-1 md:row-span-2',
    },
    {
      id: 'look-7',
      image: '/assets/models/IMG_2772.webp',
      title: 'Morphosis',
      ref: 'Romans 12:2',
      color: 'Crimson Maroon',
      to: '/shop/morphosis',
      span: 'md:col-span-1',
    },
    {
      id: 'look-8',
      image: '/assets/models/IMG_2776.webp',
      title: 'Praise God!',
      ref: 'Psalm 150:6',
      color: 'Warm Cream',
      to: '/shop/praise-god',
      span: 'md:col-span-1',
    },
  ];

  // Every homepage section, keyed so the admin can reorder or hide them.
  const SECTIONS: Record<HomeSectionKey, JSX.Element> = {
    light: (
      <LightReveal
        image={lightImage}
        imageSmall={lightImage === STUDIO ? '/assets/models/IMG_2763-640.webp' : undefined}
        verse={light.verse}
        reference={light.reference}
        productName={lightProduct?.name}
        href={lightProduct ? `/shop/${lightProduct.slug}` : undefined}
      />
    ),
    marquee: (
      <>
      {/* ───────────── Verse marquee ───────────── */}
      <section className="border-y border-bone/10 bg-ink-800 py-5">
        <div className="container-site flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-center">
          {verseChips.map((chip) => (
            <p key={chip.snippet} className="text-sm text-bone/55">
              <span className="font-serif italic text-bone/80">“{chip.snippet}”</span>{' '}
              <span className="text-gold/80">— {chip.reference}</span>
            </p>
          ))}
        </div>
      </section>
      </>
    ),
    featured: (
      <>
      {/* ───────────── Featured grid ───────────── */}
      <section className="container-site py-20">
        <Reveal className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3">The Collection</p>
            <h2 className="heading-serif text-3xl text-bone sm:text-4xl">New & Noted</h2>
          </div>
          <Link to="/shop" className="link-underline hidden text-sm font-medium text-bone/70 sm:block">
            View all pieces
          </Link>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {featured.map((p, i) => (
            <Reveal key={p.id} delay={i * 80}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>
      </>
    ),
    lookbook: (
      <>
      {/* ───────────── Worn With Intention — Editorial Lookbook ───────────── */}
      <section className="container-site pb-20">
        <Reveal className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3">Worn With Intention</p>
            <h2 className="heading-serif text-3xl text-bone sm:text-4xl">The Studio Lookbook</h2>
            <p className="mt-2 text-bone/55 text-sm sm:text-base max-w-xl">
              Authentic streetwear crafted with purpose. Explore how our community wears the Word in everyday life.
            </p>
          </div>
          <Link to="/shop" className="btn-outline self-start md:self-auto">
            Shop All Looks
            <ArrowRight width={16} height={16} />
          </Link>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {lookbookItems.map((item, idx) => (
            <Reveal key={item.id} delay={idx * 60} className="group relative">
              <Link
                // A tile whose product isn't in the catalogue (yet) goes to the shop, never a dead page.
                to={products.some((p) => `/shop/${p.slug}` === item.to) ? item.to : '/shop'}
                className="relative block aspect-[3/4] overflow-hidden rounded-2xl border border-bone/10 bg-ink-800 shadow-xl transition-all duration-500 group-hover:border-gold/40 group-hover:shadow-gold/10"
              >
                <img
                  src={item.image}
                  // 640px copies for the 2–4 column layouts; full size only for single-column phones.
                  srcSet={`${item.image.replace(/\.webp$/, '-640.webp')} 640w, ${item.image} 1024w`}
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                  alt={item.title}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/30 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-90" />

                {/* Card tags */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="rounded-full bg-ink-950/80 backdrop-blur border border-bone/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-gold uppercase shadow">
                    {item.color}
                  </span>
                </div>

                {/* Card caption */}
                <div className="absolute inset-x-0 bottom-0 p-5 transition-transform duration-500 group-hover:-translate-y-1">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gold font-mono mb-1">
                    {item.ref}
                  </p>
                  <h3 className="heading-serif text-xl text-bone group-hover:text-gold transition-colors">
                    {item.title}
                  </h3>
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-bone/70 group-hover:text-gold transition-colors">
                    <span>Shop Piece</span>
                    <ArrowRight width={14} height={14} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
      </>
    ),
    collections: (
      <>
      {/* ───────────── Collections split ───────────── */}
      <section className="container-site grid gap-5 pb-20 md:grid-cols-2">
        {[
          {
            name: 'Statement',
            blurb: 'Clean typographic pieces that say it plainly.',
            to: '/shop?collection=Statement',
            img: '/assets/carosel/IMG_2781.webp',
          },
          {
            name: 'Remix',
            blurb: 'Familiar silhouettes, reimagined around the Gospel.',
            to: '/shop?collection=Remix',
            img: '/assets/models/IMG_2765.webp',
          },
        ].map((c) => (
          <Reveal key={c.name}>
            <Link
              to={c.to}
              className="group relative block aspect-[16/10] overflow-hidden rounded-2xl border border-bone/10 shadow-2xl"
            >
              <img
                src={c.img}
                alt={c.name}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 transition-transform duration-700 group-hover:-translate-y-2">
                <span className="eyebrow text-gold mb-1 block">Collection</span>
                <h3 className="heading-serif text-3xl text-bone">{c.name}</h3>
                <p className="mt-1 max-w-xs text-sm text-bone/70">{c.blurb}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-gold transition-transform group-hover:translate-x-1">
                  Explore <ArrowRight width={16} height={16} />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </section>
      </>
    ),
    promise: (
      <>
      {/* ───────────── Promise band ───────────── */}
      <section className="border-y border-bone/10 bg-ink-800">
        <div className="container-site grid gap-8 py-14 sm:grid-cols-3">
          {[
            { t: 'Premium Cotton', d: 'Heavyweight ringspun fabric built to outlast trends.' },
            { t: 'Made With Intention', d: 'Every print is a verse chosen on purpose.' },
            { t: 'Wear the Word', d: 'Clothing that opens conversations about faith.' },
          ].map((f, i) => (
            <Reveal key={f.t} delay={i * 80} className="text-center sm:text-left">
              <h3 className="heading-serif text-xl text-gold">{f.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-bone/55">{f.d}</p>
            </Reveal>
          ))}
        </div>
      </section>
      </>
    ),
    testimonials: (
      <>
      {/* ───────────── Testimonials ───────────── */}
      <section className="container-site py-20">
        <Reveal className="mb-10 text-center">
          <p className="eyebrow mb-3">Worn & Loved</p>
          <h2 className="heading-serif text-3xl text-bone sm:text-4xl">From the community</h2>
        </Reveal>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.author} delay={i * 80} className="card-surface flex flex-col p-7 hover:-translate-y-1 hover:shadow-xl hover:shadow-gold/5">
              <span className="flex text-gold">
                {[...Array(5)].map((_, j) => (
                  <StarIcon key={j} width={15} height={15} />
                ))}
              </span>
              <p className="mt-4 flex-1 font-serif text-lg italic leading-relaxed text-bone/85">
                “{t.quote}”
              </p>
              <p className="mt-5 text-sm font-medium text-bone">
                {t.author} <span className="font-normal text-bone/45">· {t.location}</span>
              </p>
            </Reveal>
          ))}
        </div>
      </section>
      </>
    ),
    cta: (
      <>
      {/* ───────────── CTA ───────────── */}
      <section className="container-site pb-24">
        <Reveal className="relative overflow-hidden rounded-[2rem] border border-bone/10 bg-gradient-to-br from-ink-700 via-ink-800 to-ink px-6 py-12 sm:px-8 sm:py-16 text-center">
          <p className="eyebrow mb-4">Levush Collection</p>
          <h2 className="heading-serif mx-auto max-w-2xl text-3xl text-bone sm:text-5xl">
            Wear the Word with us.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-bone/60">
            Browse our full range of hoodies, sweatshirts, and tees — each carrying a verse worth wearing.
          </p>
          <Link to="/shop" className="btn-primary mt-8">
            Shop the Collection
            <ArrowRight width={18} height={18} />
          </Link>
        </Reveal>
      </section>
      </>
    ),
  };

  return (
    <>
      {intro.enabled && (
        <CinematicIntro
          word={intro.text}
          tagline={intro.reference}
          images={introImages}
          fillImage="/assets/models/IMG_2765.webp"
        />
      )}

      {/* ───────────── Hero: headline + lookbook film ───────────── */}
      <section className="relative overflow-hidden md:min-h-[88vh] lg:min-h-[92vh]">
        <div className="grid md:min-h-[88vh] md:grid-cols-2 lg:min-h-[92vh]">
          {/* Left — Typography & CTA */}
          <div className="relative z-10 flex flex-col justify-center p-8 sm:p-12 lg:p-16">
            {/* Subtle ambient glow */}
            <div className="absolute -left-[20%] top-[10%] h-[60%] w-[60%] animate-pulse-slow rounded-full bg-gold/15 mix-blend-multiply blur-[100px]" />

            <div className="relative z-10 max-w-lg animate-fade-up">
              {heroText.eyebrow && <p className="eyebrow mb-5">{heroText.eyebrow}</p>}
              <h1 className="uppercase leading-[0.9]">
                <span className="block font-display text-5xl font-black text-bone sm:text-6xl lg:text-7xl xl:text-8xl">
                  {heroText.title}
                </span>
                {accentLast && (
                  <span className="mt-1 block font-sans text-3xl font-light tracking-[0.12em] text-bone/80 sm:text-4xl lg:text-5xl">
                    {accentLead && `${accentLead} `}
                    <span className="font-display font-bold italic tracking-normal text-gold">{accentLast}</span>
                  </span>
                )}
              </h1>
              {heroText.subtitle && (
                <p className="mt-6 max-w-md text-lg leading-relaxed text-bone/55">{heroText.subtitle}</p>
              )}
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link to="/shop" className="btn-primary">
                  Shop Now
                  <ArrowRight width={18} height={18} />
                </Link>
                <Link to="/about" className="btn-outline">
                  Our Story
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-bone/45">
                <div className="flex items-center gap-1.5">
                  <span className="flex text-gold">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} width={15} height={15} />
                    ))}
                  </span>
                  <span>Loved across Ghana</span>
                </div>
                <span className="hidden h-4 w-px bg-bone/15 sm:block" />
                <span>{settings.freeShippingThreshold > 0 ? `Free delivery over ${formatPrice(settings.freeShippingThreshold)}` : 'Delivery across Ghana'}</span>
              </div>
            </div>
          </div>

          {/* Right — the lookbook film (portrait cut on phones, landscape on tablets/laptops) */}
          <div className="relative w-full md:h-full">
            <ShowcaseVideo hero className="mx-auto max-h-[85vh] w-full max-w-[480px] md:max-h-none md:max-w-none" />
          </div>
        </div>
      </section>

      {sections
        .filter((sec) => sec.visible)
        .map((sec) => (
          <div key={sec.key}>{SECTIONS[sec.key]}</div>
        ))}
    </>
  );
}
