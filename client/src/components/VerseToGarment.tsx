import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from '@/components/icons';

interface Props {
  verse: string;
  reference: string;
  productName: string;
  href: string;
  /** flat shirt photo (the "design" chapter) */
  shirtImage: string;
  /** studio model photo (the "wearer" chapter) */
  modelImage: string;
  /** fabric/print close-up; until macro photos exist, a zoomed crop of the model photo */
  fabricImage: string;
  /** where to zoom in a stand-in fabric photo (CSS background-position) */
  fabricFocus?: string;
  fabricNotes?: string[];
}

const CHAPTERS = ['The Word', 'The Design', 'The Making', 'The Wearer'];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
/** 0→1 as p moves from a to b */
const span = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * "From Verse to Garment": a scroll-driven story. The section is four screens
 * tall; its stage stays pinned while scrolling plays four chapters.
 */
export default function VerseToGarment({
  verse,
  reference,
  productName,
  href,
  shirtImage,
  modelImage,
  fabricImage,
  fabricFocus = '50% 62%',
  fabricNotes = [],
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const [p, setP] = useState(0);
  const [reduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Scroll progress through the section (0 at its top, 1 when its end reaches the bottom).
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      setP(clamp(-r.top / Math.max(1, total)));
      // While the stage is pinned, the site header slides away (see .site-header in index.css).
      const pinned = r.top <= 1 && r.bottom >= window.innerHeight - 1;
      if (pinned) document.documentElement.dataset.immersive = '';
      else delete document.documentElement.dataset.immersive;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      delete document.documentElement.dataset.immersive;
    };
  }, [reduced]);

  // Phones: frame the print lower in the close-up (a tall screen shows more of the photo).
  const narrow = typeof window !== 'undefined' && window.innerWidth < 768;
  const words = verse.split(/\s+/);
  const chapter = Math.min(3, Math.floor(p * 4 + 0.0001));

  // Chapter 1 → 2: the verse appears word by word, then shrinks onto the shirt.
  const wordsShown = span(p, 0.02, 0.2) * words.length;
  const toPrint = ease(span(p, 0.27, 0.45));
  const verseOpacity = 1 - span(p, 0.44, 0.5);
  // Chapter 2: the shirt rises in behind the verse.
  const shirtIn = ease(span(p, 0.25, 0.36));
  // Chapter 3: push in to the fabric.
  const fabricIn = ease(span(p, 0.5, 0.58));
  const fabricZoom = lerp(1.25, 1, span(p, 0.5, 0.75));
  // Chapter 4: the wearer, revealed through an opening circle.
  const reveal = ease(span(p, 0.74, 0.88));
  const ctaIn = span(p, 0.86, 0.94);

  if (reduced) {
    // Calm version: the four chapters as a simple sequence of frames.
    return (
      <section className="container-site grid gap-6 py-20 md:grid-cols-2" aria-label={`From verse to garment: ${productName}`}>
        <div className="flex flex-col justify-center gap-4">
          <p className="font-display text-4xl font-black uppercase text-bone">{verse}</p>
          <p className="font-mono text-sm uppercase tracking-[0.3em] text-gold">{reference}</p>
        </div>
        <img src={shirtImage} alt={productName} loading="lazy" className="rounded-2xl" />
        <div className="h-72 rounded-2xl" style={{ backgroundImage: `url(${fabricImage})`, backgroundSize: '300%', backgroundPosition: fabricFocus }} />
        <div className="flex flex-col gap-4">
          <img src={modelImage} alt={`${productName} worn by a model`} loading="lazy" className="rounded-2xl" />
          <Link to={href} className="btn-primary self-start">Shop {productName} <ArrowRight width={16} height={16} /></Link>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="relative bg-[#0a0908]" style={{ height: '420vh' }} aria-label={`From verse to garment: ${productName}`}>
      <div className="film-grain sticky top-0 h-screen overflow-hidden text-[#f5efe6] supports-[height:100svh]:h-[100svh]">
        {/* Chapter rail */}
        <ol className="absolute left-5 top-1/2 z-20 hidden -translate-y-1/2 space-y-4 md:block" aria-hidden="true">
          {CHAPTERS.map((c, i) => (
            <li key={c} className="flex items-center gap-3 text-xs uppercase tracking-[0.25em] transition-opacity duration-500" style={{ opacity: i === chapter ? 1 : 0.3 }}>
              <span className="font-mono text-gold">0{i + 1}</span>
              <span className={i === chapter ? 'text-[#f5efe6]' : 'text-[#f5efe6]/60'}>{c}</span>
            </li>
          ))}
        </ol>
        <p className="absolute left-1/2 top-6 z-20 -translate-x-1/2 font-mono text-[11px] uppercase tracking-[0.35em] text-gold md:hidden">
          0{chapter + 1} · {CHAPTERS[chapter]}
        </p>

        {/* Chapter 2: the shirt */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ opacity: shirtIn * (1 - fabricIn), transform: `translateY(${lerp(8, 0, shirtIn)}vh)` }}
        >
          <img src={shirtImage} alt="" loading="lazy" decoding="async" className="h-[56vh] w-[86vw] rounded-3xl object-cover sm:h-[70vh] sm:w-auto sm:object-contain" style={{ boxShadow: '0 40px 120px rgba(0,0,0,.6)' }} />
        </div>

        {/* Chapter 3: fabric close-up */}
        <div className="absolute inset-0" style={{ opacity: fabricIn * (1 - reveal) }}>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${fabricImage})`,
              backgroundSize: '320% auto',
              backgroundPosition: narrow ? '50% 76%' : fabricFocus,
              transform: `scale(${fabricZoom})`,
              filter: 'contrast(1.05) saturate(1.05)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40 md:from-black/80 md:via-black/20" />
          <ul className="absolute bottom-[9vh] left-6 right-6 md:bottom-[12vh] space-y-3 md:left-auto md:right-16 md:w-[26rem]">
            {fabricNotes.map((n, i) => (
              <li
                key={n}
                className="flex items-center gap-3 border-b border-white/15 pb-3 text-base sm:text-xl"
                style={{ opacity: span(p, 0.55 + i * 0.04, 0.6 + i * 0.04), transform: `translateY(${lerp(16, 0, span(p, 0.55 + i * 0.04, 0.6 + i * 0.04))}px)` }}
              >
                <span className="font-mono text-xs text-gold">0{i + 1}</span>
                {n}
              </li>
            ))}
          </ul>
        </div>

        {/* Chapter 4: the wearer */}
        <div className="absolute inset-0" style={{ clipPath: `circle(${lerp(0, 120, reveal)}% at 50% 45%)` }}>
          <img src={modelImage} alt={`${productName} worn by a model`} loading="lazy" decoding="async" className="h-full w-full bg-[#d7cfc6] object-cover object-top md:object-contain" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-[8vh] flex flex-col items-center gap-4 px-6 text-center" style={{ opacity: ctaIn, transform: `translateY(${lerp(20, 0, ctaIn)}px)` }}>
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-gold">{reference}</p>
            <h3 className="font-display text-3xl font-black uppercase leading-none [text-shadow:0_2px_24px_rgba(0,0,0,.5)] sm:text-5xl">{productName}</h3>
            <Link to={href} className="btn-primary">
              Shop this piece <ArrowRight width={16} height={16} />
            </Link>
          </div>
        </div>

        {/* Chapter 1 → 2: the verse, word by word, then shrinking onto the shirt */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center px-6"
          style={{ opacity: verseOpacity, transform: `translateY(${lerp(0, -9, toPrint)}vh) scale(${lerp(1, 0.32, toPrint)})` }}
        >
          <div className="max-w-5xl text-center">
            <p className="font-display text-[clamp(2.4rem,9vw,6rem)] font-black uppercase leading-[0.95] [text-wrap:balance]">
              {words.map((w, i) => {
                const t = clamp(wordsShown - i);
                return (
                  <span key={i} className="inline-block" style={{ opacity: t, transform: `translateY(${lerp(30, 0, t)}px)`, filter: `blur(${lerp(8, 0, t)}px)` }}>
                    {w}&nbsp;
                  </span>
                );
              })}
            </p>
            <p className="mt-6 font-mono text-sm uppercase tracking-[0.35em] text-gold" style={{ opacity: span(p, 0.18, 0.24) * (1 - toPrint) }}>
              {reference}
            </p>
          </div>
        </div>

        {/* Scroll hint at the very start */}
        <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.3em] text-white/50 transition-opacity duration-500" style={{ opacity: p < 0.03 ? 1 : 0 }}>
          Scroll ↓
        </p>
      </div>
    </section>
  );
}
