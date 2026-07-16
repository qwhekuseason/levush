import { Link } from 'react-router-dom';

export default function ShippingReturns() {
  return (
    <div className="container-site py-16 max-w-3xl">
      <nav className="mb-8 text-sm text-bone/45">
        <Link to="/" className="hover:text-bone">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-bone/70">Shipping & Returns</span>
      </nav>

      <h1 className="heading-serif text-4xl text-bone mb-10">Shipping & Returns</h1>
      
      <div className="space-y-10 text-bone/80 leading-relaxed">
        <section>
          <h2 className="heading-serif text-2xl text-gold mb-4">Shipping Policy</h2>
          <p className="mb-4">
            All orders are processed within 1 to 3 business days (excluding weekends and holidays) after receiving your order confirmation email. You will receive another notification when your order has shipped.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-bone/70">
            <li><strong>Standard Delivery (Ghana):</strong> 2-4 business days. Cost: GH₵ 30.00</li>
            <li><strong>Free Shipping:</strong> On all domestic orders over GH₵ 400.00</li>
            <li><strong>International Shipping:</strong> We currently do not offer international shipping but are working to bring Levush to the world soon.</li>
          </ul>
        </section>

        <section>
          <h2 className="heading-serif text-2xl text-gold mb-4">Returns & Exchanges</h2>
          <p className="mb-4">
            We want you to be completely satisfied with your Levush purchase. If you are not completely satisfied, you may return the item within 14 days of receiving it for a full refund or exchange.
          </p>
          <h3 className="font-bold text-bone mb-2">Conditions for Return:</h3>
          <ul className="list-disc pl-5 space-y-2 text-bone/70 mb-4">
            <li>Items must be unworn, unwashed, and have original tags attached.</li>
            <li>Items must be returned in their original packaging.</li>
            <li>Receipt or proof of purchase is required.</li>
          </ul>
          <p>
            To initiate a return, please contact us at <a href="mailto:support@levush.com" className="text-gold hover:underline">support@levush.com</a> with your order number.
          </p>
        </section>

        <section>
          <h2 className="heading-serif text-2xl text-gold mb-4">Refunds</h2>
          <p>
            Once your return is received and inspected, we will notify you of the approval or rejection of your refund. If approved, your refund will be processed, and a credit will automatically be applied to your original method of payment within 5-7 business days.
          </p>
        </section>
      </div>
    </div>
  );
}
