import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { testimonials, verseChips } from '@/data/products';
import { useCatalog } from '@/context/CatalogContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { formatPrice } from '@/lib/format';
import ProductCard from '@/components/ProductCard';
import Reveal from '@/components/Reveal';
import ShowcaseVideo from '@/components/ShowcaseVideo';
import { ArrowRight, StarIcon } from '@/components/icons';

export default function Home() {
  const { products } = useCatalog();
  const { settings } = useStoreSettings();
  const hero = products.find((p) => p.id === 'lion-of-judah') ?? products[0];
  const featured = products.slice(0, 4);

  // Carousel: all 12 photoshoot studio images from assets/carosel
  const carouselSlides = [
    {
      image: '/assets/carosel/IMG_2758.webp',
      name: 'Who He Says I Am: Excellent',
      tagline: 'Walk in the spirit of excellence.',
      ref: 'Daniel 6:3',
      to: '/shop/excellent',
    },
    {
      image: '/assets/carosel/IMG_2759.webp',
      name: 'Praise God!',
      tagline: 'Let everything with breath praise the Lord.',
      ref: 'Psalm 150:6',
      to: '/shop/praise-god',
    },
    {
      image: '/assets/carosel/IMG_2760.webp',
      name: 'I Am Confident',
      tagline: 'Unshakable courage and faith in Christ.',
      ref: 'Philippians 1:6',
      to: '/shop/i-am-confident',
    },
    {
      image: '/assets/carosel/IMG_2768.webp',
      name: 'Made For More',
      tagline: 'Created in Christ Jesus for higher purpose.',
      ref: 'Ephesians 2:10',
      to: '/shop/made-for-more',
    },
    {
      image: '/assets/carosel/IMG_2769.webp',
      name: 'The Duo Drop',
      tagline: 'Excellent & Yahweh’s Delight — Together in grace.',
      ref: 'Zephaniah 3:17',
      to: '/shop',
    },
    {
      image: '/assets/carosel/IMG_2771.webp',
      name: 'Morphosis',
      tagline: 'Transformed by the renewing of your mind.',
      ref: 'Romans 12:2',
      to: '/shop/morphosis',
    },
    {
      image: '/assets/carosel/IMG_2773.webp',
      name: 'Good Good God',
      tagline: 'God is Good, Great & Glorious.',
      ref: 'Psalm 107:1',
      to: '/shop/ggg-collection',
    },
    {
      image: '/assets/carosel/IMG_2779.webp',
      name: 'The Signature Essential',
      tagline: 'Intentional scripture streetwear, crafted to last.',
      ref: 'Levush Edition',
      to: '/shop',
    },
    {
      image: '/assets/carosel/IMG_2781.webp',
      name: 'I Want It God’s Way',
      tagline: 'His way is truth, light, and life.',
      ref: 'John 14:6',
      to: '/shop/i-want-it-gods-way',
    },
    {
      image: '/assets/carosel/IMG_2782.webp',
      name: 'Who He Says I Am: Favoured',
      tagline: 'Walking under open heavens and divine favor.',
      ref: 'Psalm 5:12',
      to: '/shop/favoured',
    },
    {
      image: '/assets/carosel/IMG_2783.webp',
      name: 'Morphosis & No Peace',
      tagline: 'Peace that surpasses all understanding.',
      ref: 'John 14:27',
      to: '/shop',
    },
    {
      image: '/assets/carosel/IMG_2785.webp',
      name: 'God’s Way & Light of the World',
      tagline: 'Shining His light in every street and city.',
      ref: 'Matthew 5:14',
      to: '/shop',
    },
  ];

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

  const [activeSlide, setActiveSlide] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const total = carouselSlides.length;

  // Only fetch the slide on screen and the one after it. Stacked slides all
  // count as "in view", so native lazy-loading would fetch all 12 (~1.4 MB) up front.
  const [loadedSlides, setLoadedSlides] = useState<Set<number>>(() => new Set([0, 1]));
  useEffect(() => {
    setLoadedSlides((prev) => {
      const next = (activeSlide + 1) % total;
      if (prev.has(activeSlide) && prev.has(next)) return prev;
      return new Set(prev).add(activeSlide).add(next);
    });
  }, [activeSlide, total]);

  useEffect(() => {
    if (!total) return;
    const timer = setInterval(() => {
      setActiveSlide((s) => (s + 1) % total);
      setAnimKey((k) => k + 1);
    }, 5500);
    return () => clearInterval(timer);
  }, [total]);

  const goTo = (i: number) => {
    setActiveSlide((i + total) % total);
    setAnimKey((k) => k + 1);
  };

  if (!hero) return null;

  return (
    <>
      {/* ───────────── Hero ───────────── */}
      <section className="relative min-h-[70vh] md:min-h-[88vh] lg:min-h-[92vh] overflow-hidden">
        <div className="grid md:grid-cols-2 min-h-[70vh] md:min-h-[88vh] lg:min-h-[92vh]">
          {/* Left — Typography & CTA */}
          <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16 relative z-10">
            {/* Subtle ambient glow */}
            <div className="absolute -left-[20%] top-[10%] h-[60%] w-[60%] animate-pulse-slow rounded-full bg-gold/15 mix-blend-multiply blur-[100px]" />

            <div className="relative z-10 max-w-lg animate-fade-up">
              <p className="eyebrow mb-5">Faith, worn.</p>
              <h1 className="uppercase leading-[0.9]">
                <span className="block font-display font-black text-5xl sm:text-6xl lg:text-7xl xl:text-8xl text-bone">
                  Wear What
                </span>
                <span className="mt-1 block font-sans text-3xl sm:text-4xl lg:text-5xl font-light tracking-[0.12em] text-bone/80">
                  You <span className="font-display font-bold italic tracking-normal text-gold">Believe</span>
                </span>
              </h1>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-bone/55">
                Premium scripture streetwear, designed with intention. Every piece
                carries a word worth wearing.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link to="/shop" className="btn-primary">
                  Shop Now
                  <ArrowRight width={18} height={18} />
                </Link>
                <Link to="/about" className="btn-outline">
                  Our Story
                </Link>
              </div>

              <div className="mt-10 flex items-center gap-6 text-sm text-bone/45">
                <div className="flex items-center gap-1.5">
                  <span className="flex text-gold">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} width={15} height={15} />
                    ))}
                  </span>
                  <span>Loved across Ghana</span>
                </div>
                <span className="h-4 w-px bg-bone/15" />
                <span>{settings.freeShippingThreshold > 0 ? `Free delivery over ${formatPrice(settings.freeShippingThreshold)}` : 'Delivery across Ghana'}</span>
              </div>
            </div>
          </div>

          {/* Right — Full Edge-to-Edge Studio Carousel */}
          <div className="relative overflow-hidden min-h-[65vh] md:min-h-0 w-full h-full flex items-center justify-center">

            {/* Slides: each crossfades in/out */}
            {carouselSlides.map((slide, i) => (
              <div
                key={slide.image}
                className={[
                  'absolute inset-0 transition-opacity duration-1000 ease-in-out flex items-center justify-center',
                  i === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none',
                ].join(' ')}
              >
                {/* Main image — fills the full carousel space edge-to-edge */}
                <Link to={slide.to} className="absolute inset-0 z-10 block">
                  <img
                    src={loadedSlides.has(i) ? slide.image : undefined}
                    alt={slide.name}
                    decoding="async"
                    {...{ fetchpriority: i === activeSlide ? 'high' : 'low' }}
                    className={[
                      'h-full w-full object-cover object-top transition-transform duration-[6000ms] ease-out',
                      i === activeSlide ? 'scale-100' : 'scale-105',
                    ].join(' ')}
                  />
                </Link>

                {/* Minimal, elegant bottom gradient overlay */}
                <div className="pointer-events-none absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent px-6 sm:px-8 pb-8 pt-16 z-20">
                  {i === activeSlide && (
                    <div className="animate-slide-up-in">
                      <span className="inline-block text-[11px] font-mono tracking-[0.25em] uppercase text-gold font-semibold mb-1">
                        {slide.ref}
                      </span>
                      <Link to={slide.to} className="pointer-events-auto group/title inline-block">
                        <h2 className="text-white font-display font-bold text-xl sm:text-2xl lg:text-3xl leading-tight group-hover/title:text-gold transition-colors flex items-center gap-2">
                          {slide.name}
                          <ArrowRight width={18} height={18} className="text-gold opacity-0 -translate-x-2 group-hover/title:opacity-100 group-hover/title:translate-x-0 transition-all" />
                        </h2>
                      </Link>
                      <p className="mt-1 text-white/75 text-xs sm:text-sm max-w-md font-sans">
                        {slide.tagline}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Progress bar — resets every slide */}
            <div className="absolute bottom-0 inset-x-0 z-30 h-[2.5px] bg-white/15">
              <div
                key={`pb-${animKey}`}
                className="h-full bg-gold animate-progress-bar"
              />
            </div>

            {/* Dot indicators */}
            <div className="absolute bottom-3 inset-x-0 z-30 flex justify-center gap-1.5 px-4 overflow-x-auto">
              {carouselSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={[
                    'rounded-full transition-all duration-500 shrink-0',
                    i === activeSlide ? 'w-6 sm:w-7 h-1.5 bg-gold' : 'w-1.5 h-1.5 bg-white/35 hover:bg-white/70',
                  ].join(' ')}
                />
              ))}
            </div>

          </div>
        </div>
      </section>

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

      {/* ───────────── Lookbook film ───────────── */}
      <section className="container-site pt-20">
        <div className="grid items-center gap-8 md:grid-cols-[1fr_1.5fr] md:gap-12">
          <Reveal>
            <p className="eyebrow mb-3">In Motion</p>
            <h2 className="heading-serif text-3xl text-bone sm:text-4xl">See the collection come alive.</h2>
            <p className="mt-4 max-w-md text-bone/60">
              Real people, real faith, every verse worn with intention. Prefer another colour for a design you
              love? We’ve got you.
            </p>
            <div className="mt-7 hidden gap-3 md:flex">
              <Link to="/shop" className="btn-primary">
                Shop the Collection <ArrowRight width={16} height={16} />
              </Link>
              <Link to="/contact" className="btn-outline">Request a Colour</Link>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <ShowcaseVideo className="mx-auto w-full max-w-[420px] md:max-w-none" />
          </Reveal>

          <div className="flex gap-3 md:hidden">
            <Link to="/shop" className="btn-primary flex-1 justify-center whitespace-nowrap px-4">Shop Now</Link>
            <Link to="/contact" className="btn-outline flex-1 justify-center whitespace-nowrap px-4">Request Colour</Link>
          </div>
        </div>
      </section>

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
                to={item.to}
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
  );
}
