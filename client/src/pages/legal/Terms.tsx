import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="container-site py-16 max-w-3xl">
      <nav className="mb-8 text-sm text-bone/45">
        <Link to="/" className="hover:text-bone">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-bone/70">Terms of Service</span>
      </nav>

      <h1 className="heading-serif text-4xl text-bone mb-10">Terms of Service</h1>
      
      <div className="space-y-6 text-bone/80 leading-relaxed">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="heading-serif text-2xl text-gold mt-8 mb-4">1. Agreement to Terms</h2>
        <p>By accessing or using Levush's website, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access our services.</p>

        <h2 className="heading-serif text-2xl text-gold mt-8 mb-4">2. Intellectual Property</h2>
        <p>The service and its original content, features, and functionality are and will remain the exclusive property of Levush and its licensors. Our brand, logos, and designs are protected by copyright and trademark laws.</p>

        <h2 className="heading-serif text-2xl text-gold mt-8 mb-4">3. Purchases</h2>
        <p>If you wish to purchase any product made available through the store, you may be asked to supply certain information relevant to your purchase including, without limitation, your name, email, phone number, and address.</p>

        <h2 className="heading-serif text-2xl text-gold mt-8 mb-4">4. Changes</h2>
        <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will try to provide at least 30 days' notice prior to any new terms taking effect.</p>
      </div>
    </div>
  );
}
