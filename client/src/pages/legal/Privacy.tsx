import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="container-site py-16 max-w-3xl">
      <nav className="mb-8 text-sm text-bone/45">
        <Link to="/" className="hover:text-bone">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-bone/70">Privacy Policy</span>
      </nav>

      <h1 className="heading-serif text-4xl text-bone mb-10">Privacy Policy</h1>
      
      <div className="space-y-6 text-bone/80 leading-relaxed">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <p>At Levush, we are committed to protecting your privacy and ensuring that your personal information is handled safely and responsibly.</p>

        <h2 className="heading-serif text-2xl text-gold mt-8 mb-4">1. Information We Collect</h2>
        <p>We collect information that you provide directly to us when you create an account, make a purchase, or sign up for our newsletter. This includes your name, email address, shipping address, phone number, and payment information.</p>

        <h2 className="heading-serif text-2xl text-gold mt-8 mb-4">2. How We Use Your Information</h2>
        <p>We use the information we collect to process your transactions, communicate with you about your orders, send you marketing communications (if you've opted in), and improve our site and services.</p>

        <h2 className="heading-serif text-2xl text-gold mt-8 mb-4">3. Sharing of Information</h2>
        <p>We do not sell or rent your personal information to third parties. We only share information with trusted third-party service providers (such as payment processors and shipping companies) necessary to fulfill your orders.</p>

        <h2 className="heading-serif text-2xl text-gold mt-8 mb-4">4. Your Rights</h2>
        <p>You have the right to access, update, or delete your personal information at any time. If you wish to do so, please log into your account or contact our support team at <a href="mailto:support@levush.com" className="text-gold hover:underline">support@levush.com</a>.</p>
      </div>
    </div>
  );
}
