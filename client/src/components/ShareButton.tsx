import { useState } from 'react';

/** Share a product: the phone's share sheet where available, else WhatsApp / copy link. */
export default function ShareButton({ title, text, url }: { title: string; text: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        /* cancelled or unsupported — fall back to the menu */
      }
    }
    setOpen((v) => !v);
  };

  return (
    <div className="relative">
      <button type="button" onClick={share} className="btn-outline flex items-center gap-2 px-4" aria-haspopup="menu" aria-expanded={open}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v14" />
        </svg>
        Share
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-2 w-52 rounded-xl border border-bone/15 bg-ink p-1.5 shadow-2xl">
          <a
            role="menuitem"
            href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg px-3 py-2 text-sm text-bone hover:bg-bone/5"
            onClick={() => setOpen(false)}
          >
            Share on WhatsApp
          </a>
          <button
            role="menuitem"
            type="button"
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-bone hover:bg-bone/5"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => {
                  setCopied(false);
                  setOpen(false);
                }, 1200);
              } catch {
                /* clipboard blocked */
              }
            }}
          >
            {copied ? 'Link copied ✓' : 'Copy link'}
          </button>
        </div>
      )}
    </div>
  );
}
