import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from '@/components/icons';

interface Props {
  image: string;
  /** optional smaller copy for phones/tablets */
  imageSmall?: string;
  verse: string;
  reference: string;
  productName?: string;
  href?: string;
}

/**
 * "Light of the World": a dark scene where the visitor's cursor (or finger) is
 * a soft light that reveals the photo and verse underneath. When nobody is
 * steering, the light drifts on its own. Only animates while on screen.
 */
export default function LightReveal({ image, imageSmall, verse, reference, productName, href }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const [reducedMotion] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let raf = 0;
    let visible = false;
    let lastPointer = -Infinity;
    // Current light position and where it's heading (px within the section).
    const pos = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    let started = false;

    const setVars = () => {
      const r = Math.max(110, Math.min(el.clientWidth, el.clientHeight) * (reducedMotion ? 0.42 : 0.3));
      el.style.setProperty('--lx', `${pos.x}px`);
      el.style.setProperty('--ly', `${pos.y}px`);
      el.style.setProperty('--lr', `${r}px`);
    };

    const frame = (t: number) => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!started) {
        pos.x = target.x = w * 0.62;
        pos.y = target.y = h * 0.42;
        started = true;
      }
      // Idle: wander slowly over the scene (a gentle figure-of-eight).
      if (!reducedMotion && t - lastPointer > 2500) {
        target.x = w * (0.55 + 0.3 * Math.sin(t * 0.00042));
        target.y = h * (0.45 + 0.25 * Math.sin(t * 0.00068 + 1));
      }
      // Ease toward the target so movement feels like a light, not a cursor.
      pos.x += (target.x - pos.x) * 0.12;
      pos.y += (target.y - pos.y) * 0.12;
      setVars();
      if (visible && !reducedMotion) raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      target.x = e.clientX - b.left;
      target.y = e.clientY - b.top;
      lastPointer = performance.now();
      if (e.pointerType !== 'mouse') setTouched(true);
      if (reducedMotion) {
        pos.x = target.x;
        pos.y = target.y;
        setVars();
      }
    };

    // Run only while the section is on screen (saves battery and CPU).
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(frame);
    });
    io.observe(el);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerdown', onMove);
    requestAnimationFrame(frame);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerdown', onMove);
    };
  }, [reducedMotion]);

  const mask = 'radial-gradient(circle var(--lr) at var(--lx) var(--ly), #000 0%, #000 35%, rgba(0,0,0,.55) 60%, transparent 100%)';

  /** The scene is drawn twice: dim underneath, fully lit inside the light. */
  const scene = (lit: boolean) => (
    <div className="absolute inset-0" aria-hidden={lit ? undefined : true}>
      <div className="absolute inset-y-0 right-0 w-full md:w-[58%]">
        <img
          src={image}
          srcSet={imageSmall ? `${imageSmall} 640w, ${image} 1024w` : undefined}
          sizes="(min-width: 768px) 58vw, 100vw"
          alt={lit ? `${productName ?? 'Levush piece'} worn by a model` : ''}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover object-top"
          style={lit ? undefined : { filter: 'brightness(.16) saturate(.4)' }}
        />
        {/* fade the photo into the dark on the text side */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0908] via-transparent to-transparent md:bg-gradient-to-r md:from-[#0a0908] md:via-[#0a0908]/30" />
        {/* phones: a deeper fade under the verse so it never sits on the shirt's own print */}
        <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-[#0a0908] via-[#0a0908]/85 to-transparent md:hidden" />
      </div>
      <div className="absolute inset-x-0 bottom-28 px-6 sm:px-10 md:inset-y-0 md:bottom-auto md:flex md:w-[52%] md:flex-col md:justify-center md:px-16">
        <p className={lit ? 'font-mono text-xs uppercase tracking-[0.35em] text-gold' : 'font-mono text-xs uppercase tracking-[0.35em] text-white/10'}>
          {reference}
        </p>
        <h2
          className="mt-4 font-display text-4xl font-black uppercase leading-[0.95] sm:text-5xl lg:text-7xl"
          style={{ color: lit ? '#f8f3ea' : 'rgba(255,255,255,.07)' }}
        >
          {verse}
        </h2>
      </div>
    </div>
  );

  return (
    <section
      ref={sectionRef}
      className="film-grain relative h-[78vh] min-h-[520px] max-h-[860px] overflow-hidden bg-[#0a0908] text-white"
      style={{ touchAction: 'pan-y', ['--lx' as string]: '62%', ['--ly' as string]: '42%', ['--lr' as string]: '220px' }}
      aria-label={`${verse} — ${reference}`}
    >
      {scene(false)}
      <div className="absolute inset-0" style={{ WebkitMaskImage: mask, maskImage: mask }}>
        {scene(true)}
      </div>
      {/* warm glow where the light falls */}
      <div
        className="pointer-events-none absolute inset-0 mix-blend-screen"
        style={{ background: 'radial-gradient(circle calc(var(--lr) * 1.4) at var(--lx) var(--ly), rgba(255,190,120,.16), transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="absolute inset-x-0 bottom-8 flex flex-wrap items-center justify-between gap-4 px-6 sm:px-10 md:px-16">
        {href && (
          <Link to={href} className="btn-primary">
            Shop {productName ?? 'this piece'} <ArrowRight width={16} height={16} />
          </Link>
        )}
        <p className="text-xs uppercase tracking-[0.25em] text-white/45" aria-hidden="true">
          {reducedMotion ? 'Move to shine the light' : touched ? 'Drag to move the light' : 'Move or tap to shine the light'}
        </p>
      </div>
    </section>
  );
}
