import { useState, type FormEvent } from 'react';
import Reveal from '@/components/Reveal';

export default function Contact() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    // Simulate network request
    setTimeout(() => {
      setStatus('success');
    }, 1000);
  };

  return (
    <div className="container-site py-12 md:py-16">
      <header className="mb-12 max-w-2xl">
        <p className="eyebrow mb-3">Get in touch</p>
        <h1 className="heading-serif text-3xl text-bone sm:text-5xl">Contact Us</h1>
        <p className="mt-4 text-bone/55">
          Have a question about an order, a design, or just want to say hi? Reach out to us below.
        </p>
      </header>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Contact Form */}
        <Reveal className="card-surface p-7">
          {status === 'success' ? (
            <div className="text-center py-10">
              <h2 className="heading-serif text-2xl text-bone">Message sent</h2>
              <p className="mt-2 text-bone/55">Thank you for reaching out. We will get back to you shortly.</p>
              <button onClick={() => setStatus('idle')} className="btn-outline mt-6">Send another</button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-bone">Name</label>
                <input required placeholder="Your name" className="field" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-bone">Email</label>
                <input required type="email" placeholder="you@email.com" className="field" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-bone">Message</label>
                <textarea
                  required
                  placeholder="How can we help?"
                  rows={5}
                  className="field resize-none"
                />
              </div>
              <button type="submit" disabled={status === 'submitting'} className="btn-primary w-full">
                {status === 'submitting' ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          )}
        </Reveal>

        {/* Contact Info */}
        <div className="space-y-8 lg:mt-4">
          <Reveal delay={100}>
            <h3 className="font-serif text-xl font-semibold text-bone">Customer Support</h3>
            <p className="mt-2 text-bone/60">
              Email us at <a href="mailto:support@levush.com" className="text-gold hover:underline">support@levush.com</a>
              <br />We typically reply within 24 hours.
            </p>
          </Reveal>
          
          <Reveal delay={150}>
            <h3 className="font-serif text-xl font-semibold text-bone">Call / WhatsApp</h3>
            <p className="mt-2 space-y-1 text-bone/60">
              <a href="https://wa.me/233204874332" className="block text-gold hover:underline">
                020 487 4332
              </a>
              <a href="https://wa.me/233504337014" className="block text-gold hover:underline">
                050 433 7014
              </a>
            </p>
            <p className="mt-1 text-sm text-bone/45">To place an order or pre-order, message us anytime.</p>
          </Reveal>

          <Reveal delay={200}>
            <h3 className="font-serif text-xl font-semibold text-bone">Follow Us</h3>
            <p className="mt-2 text-bone/60">
              <a
                href="https://instagram.com/levushcreations"
                target="_blank"
                rel="noreferrer"
                className="text-gold hover:underline"
              >
                @levushcreations
              </a>{' '}
              on Instagram
            </p>
          </Reveal>

          <Reveal delay={250}>
            <h3 className="font-serif text-xl font-semibold text-bone">Wholesale & Custom</h3>
            <p className="mt-2 text-bone/60">
              Interested in carrying Levush in your store or creating custom pieces for your ministry?
              <br />Reach out to <a href="mailto:partners@levush.com" className="text-gold hover:underline">partners@levush.com</a>.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <h3 className="font-serif text-xl font-semibold text-bone">Studio</h3>
            <p className="mt-2 text-bone/60">
              Accra, Ghana<br />
              (Online operations only)
            </p>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
