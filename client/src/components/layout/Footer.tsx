import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import { ArrowRight } from '@/components/icons';

const cols = [
  {
    title: 'Shop',
    links: [
      { to: '/shop', label: 'All Pieces' },
      { to: '/shop?collection=Remix', label: 'Remix Collection' },
      { to: '/shop?collection=Statement', label: 'Statement Collection' },
    ],
  },
  {
    title: 'Levush',
    links: [
      { to: '/about', label: 'About' },
      { to: '/contact', label: 'Contact Us' },
      { to: '/account', label: 'Account' },
    ],
  },
  {
    title: 'Help & Policies',
    links: [
      { to: '/policies/shipping-returns', label: 'Shipping & Returns' },
      { to: '/policies/terms', label: 'Terms of Service' },
      { to: '/policies/privacy', label: 'Privacy Policy' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-bone/10 bg-ink-800">
      <div className="container-site grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-bone/55">
            Faith, worn. Premium scripture streetwear, made with intention.
            <span className="mt-1 block font-serif italic text-bone/70">
              לְבוּשׁ — “garment.”
            </span>
          </p>
        </div>

        {cols.map((col) => (
          <div key={col.title}>
            <h4 className="eyebrow mb-4">{col.title}</h4>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-sm text-bone/60 transition hover:text-gold"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4 className="eyebrow mb-4">The Newsletter</h4>
          <p className="mb-4 text-sm text-bone/55">
            Drops, verses, and early access. No noise.
          </p>
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              required
              placeholder="you@email.com"
              className="field"
              aria-label="Email address"
            />
            <button className="btn-primary shrink-0 !px-4" aria-label="Subscribe">
              <ArrowRight width={18} height={18} />
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-bone/10">
        <div className="container-site flex flex-col items-center justify-between gap-3 py-6 text-xs text-bone/40 sm:flex-row">
          <p>© {new Date().getFullYear()} Levush. All rights reserved.</p>
          <p className="font-serif italic">Wear the Word.</p>
        </div>
      </div>
    </footer>
  );
}
