import { Link } from 'react-router-dom';
import { useCatalog } from '@/context/CatalogContext';
import { useWishlist } from '@/context/WishlistContext';
import ProductCard from '@/components/ProductCard';
import { usePageTitle } from '@/lib/usePageTitle';

export default function Saved() {
  usePageTitle('Saved');
  const { products } = useCatalog();
  const { saved, recent } = useWishlist();
  const savedProducts = saved.map((id) => products.find((p) => p.id === id)).filter((p) => p !== undefined);
  const recentProducts = recent
    .filter((id) => !saved.includes(id))
    .map((id) => products.find((p) => p.id === id))
    .filter((p) => p !== undefined)
    .slice(0, 4);

  return (
    <div className="container-site py-12 md:py-16">
      <p className="eyebrow mb-3">Saved for later</p>
      <h1 className="heading-serif text-3xl text-bone sm:text-5xl">Your saved pieces</h1>
      <p className="mt-4 text-bone/55">Tap the heart on any piece to keep it here. Saved on this device.</p>

      {savedProducts.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-lg font-medium text-bone">Nothing saved yet.</p>
          <Link to="/shop" className="btn-primary mt-6">Browse the collection</Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {savedProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {recentProducts.length > 0 && (
        <section className="mt-20">
          <h2 className="heading-serif mb-6 text-2xl text-bone">Recently viewed</h2>
          <div className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {recentProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
