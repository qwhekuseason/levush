import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { classNames } from '@/lib/format';
import {
  LOGO_CLOTH,
  LOGO_CLOTH_PIVOT,
  LOGO_FULL_VIEWBOX,
  LOGO_MARK_VIEWBOX,
  LOGO_STILL,
  LOGO_WORD,
} from '@/assets/logoPaths';

interface LogoSvgProps {
  /** "full" = monogram + Levush wordmark stacked; "mark" = monogram only */
  variant?: 'full' | 'mark';
  /** 'once' replays when `flutterKey` changes; 'loop' keeps the cloth moving (loaders) */
  motion?: 'none' | 'once' | 'loop';
  flutterKey?: number;
  className?: string;
  title?: string;
}

/**
 * The Levush monogram as vector art. The cloth flowing out of the E is its own
 * layer, so it can flutter like fabric in a breeze ("Levush" means garment).
 */
export function LogoSvg({ variant = 'full', motion = 'none', flutterKey = 0, className, title = 'Levush' }: LogoSvgProps) {
  const pivot = `${LOGO_CLOTH_PIVOT.x}px ${LOGO_CLOTH_PIVOT.y}px`;
  return (
    <svg
      viewBox={variant === 'full' ? LOGO_FULL_VIEWBOX : LOGO_MARK_VIEWBOX}
      className={className}
      role="img"
      aria-label={title}
      fill="currentColor"
    >
      <path fillRule="evenodd" d={LOGO_STILL} />
      <g
        key={flutterKey}
        className={classNames('logo-cloth', motion === 'once' && 'is-fluttering', motion === 'loop' && 'is-looping')}
        style={{ transformOrigin: pivot }}
      >
        <path fillRule="evenodd" d={LOGO_CLOTH} />
      </g>
      {variant === 'full' && <path fillRule="evenodd" d={LOGO_WORD} />}
    </svg>
  );
}

interface LogoProps {
  className?: string;
}

/** Header/footer logo: links home; the cloth flutters on load and on hover/tap. */
export default function Logo({ className }: LogoProps) {
  const [flutter, setFlutter] = useState(0);

  // A first flutter shortly after the page appears.
  useEffect(() => {
    const t = window.setTimeout(() => setFlutter((n) => n + 1), 600);
    return () => window.clearTimeout(t);
  }, []);

  const replay = () => setFlutter((n) => n + 1);

  return (
    <Link
      to="/"
      className={classNames('group inline-flex items-center text-bone', className)}
      aria-label="Levush home"
      onMouseEnter={replay}
      onFocus={replay}
      onTouchStart={replay}
    >
      <LogoSvg variant="full" motion={flutter ? 'once' : 'none'} flutterKey={flutter} className="h-12 w-auto md:h-14" title="Levush" />
    </Link>
  );
}
