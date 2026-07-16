import { Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { CloseIcon, MinusIcon, PlusIcon } from '@/components/icons';
import { formatPrice } from '@/lib/format';

export default function CartDrawer() {
  const { items, isOpen, closeCart, subtotal, setQuantity, removeItem, count } = useCart();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden
      />

      <aside
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-ink-800 shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Shopping cart"
      >
        <header className="flex items-center justify-between border-b border-bone/10 px-6 py-5">
          <h2 className="font-serif text-xl">
            Your Bag <span className="text-bone/40">({count})</span>
          </h2>
          <button onClick={closeCart} className="rounded-full p-2 text-bone/70 hover:bg-bone/5 hover:text-bone" aria-label="Close cart">
            <CloseIcon />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-bone/55">Your bag is empty.</p>
            <Link to="/shop" onClick={closeCart} className="btn-outline">
              Browse the collection
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-bone/10 overflow-y-auto px-6">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 py-5">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-24 w-20 rounded-lg object-cover"
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="font-medium leading-tight">{item.name}</p>
                        <p className="mt-0.5 text-xs uppercase tracking-wide text-bone/45">
                          {item.color} · {item.size}
                        </p>
                      </div>
                      <p className="font-medium text-gold">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-3 rounded-full border border-bone/15 px-2 py-1">
                        <button onClick={() => setQuantity(item.id, item.quantity - 1)} className="text-bone/70 hover:text-bone" aria-label="Decrease quantity">
                          <MinusIcon width={15} height={15} />
                        </button>
                        <span className="w-5 text-center text-sm">{item.quantity}</span>
                        <button onClick={() => setQuantity(item.id, item.quantity + 1)} className="text-bone/70 hover:text-bone" aria-label="Increase quantity">
                          <PlusIcon width={15} height={15} />
                        </button>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-xs text-bone/40 underline-offset-2 hover:text-bone/70 hover:underline">
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="border-t border-bone/10 px-6 py-5">
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-bone/60">Subtotal</span>
                <span className="font-serif text-xl text-bone">{formatPrice(subtotal)}</span>
              </div>
              <Link to="/cart" onClick={closeCart} className="btn-primary w-full">
                Checkout
              </Link>
              <p className="mt-3 text-center text-xs text-bone/40">
                Shipping & taxes calculated at checkout.
              </p>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
