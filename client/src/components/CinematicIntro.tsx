import { useCallback, useEffect, useRef, useState } from 'react';
import { LOGO_CLOTH, LOGO_CLOTH_PIVOT, LOGO_FULL_VIEWBOX, LOGO_STILL, LOGO_WORD } from '@/assets/logoPaths';

const SEEN_KEY = 'levush.intro.seenAt';
const SHOW_AGAIN_AFTER_MS = 7 * 86_400_000;
// ~3 cuts a second and no white flashes: inside photosensitivity guidance.
const CUT_MS = 320;
const MAX_CUTS = 4;
const WORD_MS = 1200;
const FLY_MS = 850;
// long enough to hold the finished logo (and its flutter) before the reveal
const LOGO_MS = 2800;
const REVEAL_MS = 750;

type Phase = 'loading' | 'cuts' | 'word' | 'fly' | 'logo' | 'reveal' | 'done';

/**
 * First visit (or ?intro=1). Returning visitors within a week, people who
 * prefer reduced motion and people on data-saver go straight to the page.
 */
function shouldShow(): boolean {
  if (typeof window === 'undefined') return false;
  if (new URLSearchParams(window.location.search).get('intro') === '1') return true;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return false;
  try {
    const seen = Number(localStorage.getItem(SEEN_KEY));
    return !seen || Date.now() - seen > SHOW_AGAIN_AFTER_MS;
  } catch {
    return true;
  }
}

/** Resolve once every image has loaded or failed, or after `ms` — whichever comes first. */
function preload(srcs: string[], ms: number): Promise<string[]> {
  return new Promise((resolve) => {
    const ok: string[] = [];
    let settled = 0;
    const done = () => resolve(srcs.filter((s) => ok.includes(s)));
    const timer = window.setTimeout(done, ms);
    srcs.forEach((src) => {
      const img = new Image();
      img.onload = () => {
        ok.push(src);
        if (++settled === srcs.length) {
          window.clearTimeout(timer);
          done();
        }
      };
      img.onerror = () => {
        if (++settled === srcs.length) {
          window.clearTimeout(timer);
          done();
        }
      };
      img.src = src;
    });
  });
}

/**
 * Opening title, fashion-film style:
 *  1. quick cuts through studio model photos,
 *  2. a giant word whose letters are filled with a slowly panning photo,
 *  3. the word rushes toward the camera,
 *  4. finale: the Levush monogram draws itself, the cloth unfurls and flutters,
 *  5. the black dissolves into the homepage.
 */
export default function CinematicIntro({
  word,
  tagline,
  images,
  fillImage,
}: {
  word: string;
  tagline: string;
  /** photos for the quick cuts */
  images: string[];
  /** photo inside the letters: a bold, colourful shirt reads best */
  fillImage: string;
}) {
  const [visible] = useState(shouldShow);
  const [phase, setPhase] = useState<Phase>(visible ? 'loading' : 'done');
  const [ready, setReady] = useState<string[]>([]);
  const [cut, setCut] = useState(0);
  const skipRef = useRef<HTMLButtonElement>(null);

  // Size the word to the screen: ~82-86% of the width, never more than 38% of the height.
  const [fit, setFit] = useState({ fontPx: 72, landscape: false });
  useEffect(() => {
    if (phase === 'done') return;
    const measure = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const landscape = w > h * 1.05;
      const ctx = document.createElement('canvas').getContext('2d');
      let widthPerPx = 0.8 * word.length; // fallback: Playfair Black capitals ≈ 0.8em each
      if (ctx) {
        ctx.font = '900 100px "Playfair Display", Georgia, serif';
        widthPerPx = ctx.measureText(word.toUpperCase()).width / 100;
      }
      const byWidth = (w * (landscape ? 0.78 : 0.86)) / Math.max(0.5, widthPerPx);
      const byHeight = h * 0.38;
      setFit({ fontPx: Math.round(Math.max(40, Math.min(byWidth, byHeight))), landscape });
    };
    measure();
    // Re-measure once the display font has loaded (fallback fonts are narrower).
    document.fonts?.ready.then(measure).catch(() => {});
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [word, phase === 'done']); // eslint-disable-line react-hooks/exhaustive-deps

  const cuts = ready.filter((s) => s !== fillImage).slice(0, MAX_CUTS);
  const fill = ready.includes(fillImage) ? fillImage : ready[ready.length - 1];

  const finish = useCallback(() => {
    setPhase((p) => (p === 'done' || p === 'reveal' ? p : 'reveal'));
  }, []);

  // 1. Load the photos (never wait more than ~1.2 s; go on with whatever arrived).
  useEffect(() => {
    if (phase !== 'loading') return;
    let alive = true;
    preload([...images, fillImage], 1200).then((loaded) => {
      if (!alive) return;
      setReady(loaded);
      setPhase(loaded.filter((s) => s !== fillImage).length > 0 ? 'cuts' : 'word');
    });
    return () => {
      alive = false;
    };
  }, [phase, images, fillImage]);

  // 2. Step through the cuts.
  useEffect(() => {
    if (phase !== 'cuts') return;
    if (cut >= cuts.length) {
      setPhase('word');
      return;
    }
    const t = window.setTimeout(() => setCut((c) => c + 1), CUT_MS);
    return () => window.clearTimeout(t);
  }, [phase, cut, cuts.length]);

  // 3. Hold the word, then fly through it.
  useEffect(() => {
    if (phase === 'word') {
      const t = window.setTimeout(() => setPhase('fly'), WORD_MS);
      return () => window.clearTimeout(t);
    }
    if (phase === 'fly') {
      const t = window.setTimeout(() => setPhase('logo'), FLY_MS);
      return () => window.clearTimeout(t);
    }
    if (phase === 'logo') {
      const t = window.setTimeout(() => setPhase('reveal'), LOGO_MS);
      return () => window.clearTimeout(t);
    }
    if (phase === 'reveal') {
      try {
        localStorage.setItem(SEEN_KEY, String(Date.now()));
      } catch {
        /* storage unavailable — it just shows again next time */
      }
      const t = window.setTimeout(() => setPhase('done'), REVEAL_MS);
      return () => window.clearTimeout(t);
    }
  }, [phase]);

  // Lock scrolling while it covers the page; any key or tap skips to the fly-through.
  useEffect(() => {
    if (phase === 'done' || phase === 'reveal') {
      document.body.style.overflow = '';
      return;
    }
    document.body.style.overflow = 'hidden';
    skipRef.current?.focus({ preventScroll: true });
    window.addEventListener('keydown', finish);
    return () => {
      window.removeEventListener('keydown', finish);
      document.body.style.overflow = '';
    };
  }, [phase, finish]);

  if (phase === 'done' || !word) return null;
  const flying = phase === 'fly';
  const showWord = phase === 'word' || flying;

  return (
    <div
      className="film-grain fixed inset-0 z-[100] overflow-hidden"
      onClick={finish}
      role="presentation"
      style={{
        // Stays black through the finale; dissolves only for the reveal.
        background: phase === 'reveal' ? 'rgba(10,9,8,0)' : '#0a0908',
        transition: `background ${REVEAL_MS}ms ease-in`,
        pointerEvents: phase === 'reveal' ? 'none' : undefined,
      }}
    >
      {/* Act 1: the cuts */}
      {phase === 'cuts' &&
        cuts.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0"
            aria-hidden="true"
            style={{
              opacity: i === cut ? 1 : 0,
              transform: i === cut ? 'scale(1)' : 'scale(1.08)',
              transition: `opacity 120ms linear, transform ${CUT_MS + 200}ms cubic-bezier(.2,.7,.2,1)`,
            }}
          >
            {fit.landscape ? (
              // Laptops/tablets: the whole portrait photo, framed over a blurred, darkened copy.
              <>
                <img src={src} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover" style={{ filter: 'blur(28px) brightness(.35) saturate(1.1)' }} />
                <img
                  src={src}
                  alt=""
                  className="absolute inset-0 h-full w-full object-contain py-[4vh]"
                  style={{ filter: 'contrast(1.08) saturate(1.05) drop-shadow(0 20px 50px rgba(0,0,0,.6))' }}
                />
              </>
            ) : (
              <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover object-top" style={{ filter: 'contrast(1.08) saturate(1.05)' }} />
            )}
          </div>
        ))}
      {phase === 'cuts' && (
        // thin progress line along the bottom, like a film leader
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/10" aria-hidden="true">
          <div className="h-full bg-gold transition-all duration-300" style={{ width: `${((cut + 1) / Math.max(1, cuts.length)) * 100}%` }} />
        </div>
      )}

      {/* Acts 2 + 3: the word, filled with a photo, then the fly-through */}
      {showWord && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <h2
            aria-label={word}
            className="select-none whitespace-nowrap text-center font-display font-black uppercase leading-none tracking-tight"
            style={{
              fontSize: `${fit.fontPx}px`,
              // Two layers clipped to the letters: a moving sheen over the photo.
              backgroundImage: fill
                ? `linear-gradient(105deg, transparent 42%, rgba(255,255,255,.55) 50%, transparent 58%), url(${fill})`
                : 'linear-gradient(120deg, #ff402c, #f5efe6 55%, #ff402c)',
              // photo zoomed past the word's width so the shirt colour reaches every letter
              backgroundSize: fill ? '300% 100%, 165% auto' : 'cover',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: '-60% 0, 50% 56%',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
              transform: flying ? 'scale(28)' : 'scale(1)',
              opacity: flying ? 0 : 1,
              transition: flying
                ? `transform ${FLY_MS}ms cubic-bezier(.7,0,.84,0), opacity ${FLY_MS * 0.5}ms ease-in ${FLY_MS * 0.5}ms`
                : undefined,
              // rise in, then the photo pans from face to shirt print while the sheen sweeps across
              animation: phase === 'word' && fill
                ? `intro-rise .7s cubic-bezier(.2,.8,.2,1) both, intro-sheen ${WORD_MS}ms ease-in-out both`
                : phase === 'word' ? 'intro-rise .7s cubic-bezier(.2,.8,.2,1) both' : undefined,
              filter: 'drop-shadow(0 0 30px rgba(255,64,44,.15))',
            }}
          >
            {word}
          </h2>
          {tagline && (
            <p
              className="mt-4 font-mono text-xs uppercase tracking-[0.5em] text-[#f5efe6]/80 sm:text-sm"
              style={{ opacity: flying ? 0 : 1, transition: 'opacity .3s', animation: 'intro-fade 1s ease .4s both' }}
            >
              {tagline}
            </p>
          )}
        </div>
      )}

      {/* Act 4: the monogram draws itself, the cloth unfurls, the name rises */}
      {(phase === 'logo' || phase === 'reveal') && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            opacity: phase === 'reveal' ? 0 : 1,
            transform: phase === 'reveal' ? 'scale(.92)' : 'none',
            transition: `opacity ${REVEAL_MS}ms ease, transform ${REVEAL_MS}ms ease`,
          }}
        >
          <svg
            viewBox={LOGO_FULL_VIEWBOX}
            role="img"
            aria-label="Levush"
            className="intro-logo w-auto text-[#f5efe6]"
            style={{ height: 'min(44vh, 62vw)' }}
          >
            <path
              className="intro-logo-still"
              d={LOGO_STILL}
              fillRule="evenodd"
              pathLength={1}
              fill="currentColor"
              stroke="currentColor"
              strokeWidth={11}
            />
            <g className="intro-logo-cloth" style={{ transformOrigin: `${LOGO_CLOTH_PIVOT.x}px ${LOGO_CLOTH_PIVOT.y}px` }}>
              <path d={LOGO_CLOTH} fillRule="evenodd" fill="currentColor" />
            </g>
            <path className="intro-logo-word" d={LOGO_WORD} fillRule="evenodd" fill="currentColor" />
          </svg>
        </div>
      )}

      <button
        ref={skipRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          finish();
        }}
        className="absolute bottom-6 right-6 z-10 rounded-full border border-white/25 bg-black/30 px-4 py-1.5 text-xs uppercase tracking-widest text-white/80 backdrop-blur transition hover:border-white/60 hover:text-white"
        style={{ opacity: phase === 'reveal' ? 0 : 1, transition: 'opacity .3s' }}
      >
        Skip
      </button>
    </div>
  );
}
