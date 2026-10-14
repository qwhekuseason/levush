import { classNames } from '@/lib/format';

/** Read-only stars (supports halves via clipping), e.g. 4.5 → ★★★★½. */
export function Stars({ value, size = 16, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={classNames('inline-flex text-gold', className)} role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }} aria-hidden="true">
            <svg width={size} height={size} viewBox="0 0 24 24" className="absolute inset-0 text-bone/20" fill="currentColor"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** Clickable 1–5 star picker (radio group for keyboard and screen readers). */
export function StarPicker({ value, onChange, name }: { value: number; onChange: (v: number) => void; name: string }) {
  return (
    <div role="radiogroup" aria-label="Your rating" className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <label key={i} className="cursor-pointer">
          <input type="radio" name={name} value={i} checked={value === i} onChange={() => onChange(i)} className="sr-only" />
          <span className="sr-only">{i} star{i > 1 ? 's' : ''}</span>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={i <= value ? 'text-gold' : 'text-bone/20 hover:text-gold/50'}>
            <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" />
          </svg>
        </label>
      ))}
    </div>
  );
}
