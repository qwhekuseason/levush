import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { testimonials, verseChips } from '@/data/products';
import { useCatalog } from '@/context/CatalogContext';
import ProductCard from '@/components/ProductCard';
import Reveal from '@/components/Reveal';
import { ArrowRight, StarIcon } from '@/components/icons';
import { productImage } from '@/lib/format';

export default function Home() {
  const { products } = useCatalog();
  const hero = products.find((p) => p.id === 'lion-of-judah') ?? products[0];
  const featured = products.slice(0, 4);

  // Carousel: hero poster + new drops & model shots
  const carouselSlides = [
    {
      image: '/assets/Flyer_1-upd.png',
      name: 'Special Drop',
      tagline: 'Kingdom Apparel & Heavyweight Essentials.',
      ref: 'Levush — Ghana',
    },
    {
      image: '/assets/photo_2026-08-03_20-15-53.jpg',
      name: 'New Statement Piece',
      tagline: 'Every piece, a word worth wearing.',
      ref: 'Statement Collection',
    },
    {
      image: '/assets/photo_2026-08-03_20-15-37.jpg',
      name: 'Scripture Streetwear',
      tagline: 'Wear what you believe.',
      ref: 'Remix Drop',
    },
    {
      image: '/assets/hero-poster.jpg',
      name: 'The Core Collection',
      tagline: 'Faith, Worn.',
      ref: 'Levush Edition',
    },
    {
      image: '/assets/model-created-purpose.png',
      name: 'Created With A Purpose',
      tagline: 'A reminder stitched into every thread.',
      ref: 'Jeremiah 29:11',
    },
    {
      image: '/assets/model-lion-judah.png',
      name: 'Lion of Judah',
      tagline: 'Strength wears a crown.',
      ref: 'Hosea 5:14 NKJV',
    },
    {
      image: '/assets/model-hoodie.png',
      name: 'The Armor Hoodie',
      tagline: 'Put on the full armor.',
      ref: 'Ephesians 6:11',
    },
  ];

  const [activeSlide, setActiveSlide] = useState(0);
  const [animKey, setAnimKey] = useState(0); // triggers re-animation on slide change
  const total = carouselSlides.length;

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
      <section className="relative min-h-[60vh] md:min-h-[85vh] overflow-hidden">
        <div className="grid md:grid-cols-2 min-h-[60vh] md:min-h-[85vh]">
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
                <span>Free delivery over GH₵400</span>
              </div>
            </div>
          </div>

          {/* Right — Animated Crossfade Carousel */}
          <div className="relative overflow-hidden bg-ink-900 min-h-[60vh] md:min-h-0">

            {/* Slides: each crossfades in/out */}
            {carouselSlides.map((slide, i) => (
              <div
                key={i}
                className={[
                  'absolute inset-0 transition-opacity duration-1000 ease-in-out',
                  i === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0',
                ].join(' ')}
              >
                {/* Image with Ken Burns zoom — restarts on each active state via animKey key */}
                <img
                  key={i === activeSlide ? `img-${animKey}` : `img-idle-${i}`}
                  src={slide.image}
                  alt={slide.name}
                  className={[
                    'h-full w-full object-cover object-top',
                    i === activeSlide ? 'animate-ken-burns' : '',
                  ].join(' ')}
                  style={{ minHeight: '60vh' }}
                />

                {/* Caption — slides up fresh on each active state */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-7 pb-16 pt-28">
                  {i === activeSlide && (
                    <>
                      <p
                        key={`ref-${animKey}`}
                        className="text-[10px] tracking-[0.3em] uppercase text-gold mb-2 animate-slide-up-in"
                        style={{ animationDelay: '0.15s' }}
                      >
                        {slide.ref}
                      </p>
                      <p
                        key={`name-${animKey}`}
                        className="text-white font-display font-bold text-2xl leading-tight animate-slide-up-in"
                        style={{ animationDelay: '0.28s' }}
                      >
                        {slide.name}
                      </p>
                      <p
                        key={`tagline-${animKey}`}
                        className="mt-1.5 text-white/60 text-sm animate-slide-up-in"
                        style={{ animationDelay: '0.4s' }}
                      >
                        {slide.tagline}
                      </p>
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* Progress bar — resets every slide */}
            <div className="absolute bottom-0 inset-x-0 z-20 h-[2px] bg-white/10">
              <div
                key={`pb-${animKey}`}
                className="h-full bg-gold animate-progress-bar"
              />
            </div>

            {/* Dot indicators */}
            <div className="absolute bottom-4 inset-x-0 z-20 flex justify-center gap-2">
              {carouselSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={[
                    'rounded-full transition-all duration-500',
                    i === activeSlide ? 'w-7 h-2 bg-gold' : 'w-2 h-2 bg-white/30 hover:bg-white/60',
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

      {/* ───────────── Featured grid ───────────── */}
      <section className="container-site py-20">
        <Reveal className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3">The Collection</p>
            <h2 className="heading-serif text-3xl text-bone sm:text-4xl">New & Noted</h2>
          </div>
          <Link to="/shop" className="link-underline hidden text-sm font-medium text-bone/70 sm:block">
            View all
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

      {/* ───────────── Collections split ───────────── */}
      <section className="container-site grid gap-5 pb-20 md:grid-cols-2">
        {[
          {
            name: 'Statement',
            blurb: 'Clean typographic pieces that say it plainly.',
            to: '/shop?collection=Statement',
            img: productImage(products.find((p) => p.id === 'created-purpose') ?? products[0], 'black'),
          },
          {
            name: 'Remix',
            blurb: 'Familiar silhouettes, reimagined around the Gospel.',
            to: '/shop?collection=Remix',
            img: productImage(products.find((p) => p.id === 'jesus-paid-it-all') ?? products[0], 'black'),
          },
        ].map((c) => (
          <Reveal key={c.name}>
            <Link
              to={c.to}
              className="group relative block aspect-[16/10] overflow-hidden rounded-2xl"
            >
              <img
                src={c.img}
                alt={c.name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 transition-transform duration-700 group-hover:-translate-y-2">
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
