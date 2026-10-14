import { useCallback, useEffect, useRef, useState } from 'react';

const SEEN_KEY = 'levush.intro.seenAt';
const SHOW_AGAIN_AFTER_MS = 7 * 86_400_000;
// ~3 cuts a second and no white flashes: inside photosensitivity guidance.
const CUT_MS = 320;
const WORD_MS = 1500;
const FLY_MS = 1100;

type Phase = 'loading' | 'cuts' | 'word' | 'fly' | 'done';

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
 *  3. the word rushes toward the camera while the black dissolves into the homepage.
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

  const cuts = ready.filter((s) => s !== fillImage);
  const fill = ready.includes(fillImage) ? fillImage : ready[ready.length - 1];

  const finish = useCallback(() => {
    setPhase((p) => (p === 'done' || p === 'fly' ? p : 'fly'));
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
      try {
        localStorage.setItem(SEEN_KEY, String(Date.now()));
      } catch {
        /* storage unavailable — it just shows again next time */
      }
      const t = window.setTimeout(() => setPhase('done'), FLY_MS);
      return () => window.clearTimeout(t);
    }
  }, [phase]);

  // Lock scrolling while it covers the page; any key or tap skips to the fly-through.
  useEffect(() => {
    if (phase === 'done' || phase === 'fly') {
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
        background: flying ? 'rgba(10,9,8,0)' : '#0a0908',
        transition: `background ${FLY_MS * 0.7}ms ease-in ${FLY_MS * 0.15}ms`,
      }}
    >
      {/* Act 1: the cuts */}
      {phase === 'cuts' &&
        cuts.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-top"
            style={{
              opacity: i === cut ? 1 : 0,
              transform: i === cut ? 'scale(1)' : 'scale(1.12)',
              transition: `opacity 120ms linear, transform ${CUT_MS + 200}ms cubic-bezier(.2,.7,.2,1)`,
              filter: 'contrast(1.08) saturate(1.05)',
            }}
          />
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
            className="select-none whitespace-nowrap px-2 text-center font-display font-black uppercase leading-none tracking-tight"
            style={{
              fontSize: `clamp(4rem, ${Math.min(26, 150 / Math.max(3, word.length))}vw, 22rem)`,
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

      <button
        ref={skipRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          finish();
        }}
        className="absolute bottom-6 right-6 z-10 rounded-full border border-white/25 bg-black/30 px-4 py-1.5 text-xs uppercase tracking-widest text-white/80 backdrop-blur transition hover:border-white/60 hover:text-white"
        style={{ opacity: flying ? 0 : 1, transition: 'opacity .3s' }}
      >
        Skip
      </button>
    </div>
  );
}
