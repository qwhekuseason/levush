import { Link } from 'react-router-dom';
import { useCatalog } from '@/context/CatalogContext';
import Reveal from '@/components/Reveal';
import { ArrowRight } from '@/components/icons';
import { productImage } from '@/lib/format';

const values = [
  {
    title: 'Intention',
    body: 'Nothing on a Levush piece is arbitrary. Every verse is chosen, every layout considered. We design slowly so the message lands.',
  },
  {
    title: 'Quality',
    body: 'Heavyweight cotton, soft-hand prints, and finishing that survives the wash. Clothing meant to be worn, not just admired.',
  },
  {
    title: 'Witness',
    body: 'A Levush tee is a quiet invitation. It starts conversations, sparks questions, and lets you carry your faith into the everyday.',
  },
];

export default function About() {
  const { products } = useCatalog();
  const feature = products.find((p) => p.id === 'created-purpose') ?? products[0];
  return (
    <div>
      {/* Hero */}
      <section className="container-site grid items-center gap-10 py-14 md:grid-cols-2 md:py-20">
        <Reveal>
          <p className="eyebrow mb-4">Our Story</p>
          <h1 className="heading-serif text-4xl text-bone sm:text-5xl lg:text-6xl">
            The name means <span className="text-gold">“garment.”</span>
          </h1>
          <p className="mt-6 leading-relaxed text-bone/65">
            <span className="font-serif text-lg italic text-bone/85">Levush</span> (לְבוּשׁ) is the
            Hebrew word for clothing — but in scripture it carries more weight than fabric. We are
            told to clothe ourselves with compassion, with strength and dignity, with Christ
            himself. That idea became a brand.
          </p>
          <p className="mt-4 leading-relaxed text-bone/65">
            Levush started with a simple conviction: what you wear can speak. So we make pieces that
            speak well — premium streetwear that carries the Word with style and without
            compromise.
          </p>
        </Reveal>
        <Reveal delay={120} className="relative">
          <div className="aspect-[4/5] overflow-hidden rounded-[2rem] border border-bone/10">
            <img
              src={feature ? productImage(feature, 'black') : ''}
              alt="Levush"
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
        </Reveal>
      </section>

      {/* Values */}
      <section className="border-y border-bone/10 bg-ink-800">
        <div className="container-site py-16">
          <Reveal className="mb-10 text-center">
            <h2 className="heading-serif text-3xl text-bone sm:text-4xl">What we stand on</h2>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-3">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 90} className="card-surface p-8">
                <span className="font-serif text-4xl text-gold/40">0{i + 1}</span>
                <h3 className="heading-serif mt-3 text-2xl text-bone">{v.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-bone/60">{v.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Verse band */}
      <section className="container-site py-20 text-center">
        <Reveal>
          <p className="mx-auto max-w-3xl font-serif text-2xl italic leading-relaxed text-bone/85 sm:text-3xl">
            “Clothe yourselves with compassion, kindness, humility, gentleness and patience.”
          </p>
          <p className="mt-4 text-gold">— Colossians 3:12</p>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="container-site pb-24">
        <Reveal className="rounded-[2rem] border border-bone/10 bg-gradient-to-br from-ink-700 via-ink-800 to-ink px-8 py-14 text-center">
          <h2 className="heading-serif text-3xl text-bone sm:text-4xl">Wear the Word with us.</h2>
          <Link to="/shop" className="btn-primary mt-7">
            Shop the Collection <ArrowRight width={18} height={18} />
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
