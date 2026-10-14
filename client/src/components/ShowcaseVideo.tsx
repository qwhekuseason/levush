import { useEffect, useRef, useState } from 'react';
import { classNames } from '@/lib/format';

const VARIANTS = {
  // Portrait cut for phones; landscape (4:3) cut for tablets and up.
  mobile: { src: '/assets/video/showcase-mobile.mp4', poster: '/assets/video/showcase-mobile-poster.webp', aspect: 'aspect-[9/16]' },
  desktop: { src: '/assets/video/showcase-desktop.mp4', poster: '/assets/video/showcase-desktop-poster.webp', aspect: 'aspect-[4/3]' },
} as const;

const DESKTOP_QUERY = '(min-width: 768px)';

function useIsDesktop(): boolean {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return matches;
}

/** Respect reduced-motion and data-saver: show the poster and let people opt in. */
function shouldAutoplay(): boolean {
  if (typeof window === 'undefined') return false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
  return !reducedMotion && !saveData;
}

/**
 * Lookbook film. Picks the right cut for the screen, only downloads once it's
 * near the viewport, and plays only while visible.
 */
export default function ShowcaseVideo({ className, hero = false }: { className?: string; hero?: boolean }) {
  const isDesktop = useIsDesktop();
  const variant = isDesktop ? VARIANTS.desktop : VARIANTS.mobile;
  // In the hero the video is above the fold, so load it straight away and fit
  // the whole edit (its baked-in text) inside the column instead of cropping.
  const fitWhole = hero && isDesktop;

  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [nearViewport, setNearViewport] = useState(hero);
  const [visible, setVisible] = useState(false);
  const [autoplay] = useState(shouldAutoplay);
  // null = follow autoplay preference; true/false = the visitor chose.
  const [userWantsPlay, setUserWantsPlay] = useState<boolean | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const loadObs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNearViewport(true);
          loadObs.disconnect();
        }
      },
      { rootMargin: '300px 0px' }
    );
    const playObs = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    loadObs.observe(el);
    playObs.observe(el);
    return () => {
      loadObs.disconnect();
      playObs.disconnect();
    };
  }, []);

  const wantsPlay = userWantsPlay ?? autoplay;

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !nearViewport) return;
    if (visible && wantsPlay) {
      v.play().catch(() => setPlaying(false)); // autoplay can still be blocked (e.g. low-power mode)
    } else {
      v.pause();
    }
  }, [visible, wantsPlay, nearViewport, variant.src]);

  return (
    <div
      ref={wrapRef}
      className={classNames('relative overflow-hidden bg-ink-700', fitWhole ? 'h-full w-full' : variant.aspect, !hero && 'rounded-2xl', className)}
    >
      {fitWhole && (
        // Soft backdrop from the poster fills the space around the letterboxed video.
        <img src={variant.poster} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl" />
      )}
      <video
        key={variant.src}
        ref={videoRef}
        className={classNames('absolute inset-0 h-full w-full', fitWhole ? 'object-contain' : 'object-cover')}
        poster={variant.poster}
        src={nearViewport ? variant.src : undefined}
        muted
        loop
        playsInline
        preload={hero ? 'metadata' : 'none'}
        aria-label="Levush collection lookbook film"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      {!playing && !wantsPlay && (
        <button
          type="button"
          onClick={() => setUserWantsPlay(true)}
          className="absolute inset-0 grid place-items-center bg-black/10 transition hover:bg-black/20"
          aria-label="Play lookbook film"
        >
          <span className="grid h-16 w-16 place-items-center rounded-full bg-white/90 text-bone shadow-xl">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}

      {wantsPlay && (
        <button
          type="button"
          onClick={() => setUserWantsPlay(false)}
          className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/65"
          aria-label="Pause lookbook film"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
          </svg>
        </button>
      )}
    </div>
  );
}
