import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container-site flex flex-col items-center py-32 text-center">
      <p className="font-serif text-7xl text-gold/40">404</p>
      <h1 className="heading-serif mt-4 text-4xl text-bone">This page wandered off.</h1>
      <p className="mt-3 text-bone/55">Let’s get you back to the collection.</p>
      <div className="mt-8 flex gap-3">
        <Link to="/" className="btn-primary">Home</Link>
        <Link to="/shop" className="btn-outline">Shop</Link>
      </div>
    </div>
  );
}
