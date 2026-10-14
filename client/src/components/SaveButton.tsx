import { useWishlist } from '@/context/WishlistContext';
import { classNames } from '@/lib/format';

/** Heart toggle for saving a product to the wishlist. */
export default function SaveButton({
  productId,
  productName,
  className,
  size = 18,
}: {
  productId: string;
  productName: string;
  className?: string;
  size?: number;
}) {
  const { isSaved, toggleSaved } = useWishlist();
  const saved = isSaved(productId);
  return (
    <button
      type="button"
      onClick={(e) => {
        // Cards are links; saving shouldn't open the product.
        e.preventDefault();
        e.stopPropagation();
        toggleSaved(productId);
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${productName} from saved` : `Save ${productName}`}
      title={saved ? 'Saved' : 'Save for later'}
      className={classNames(
        'grid place-items-center rounded-full transition',
        saved ? 'text-gold' : 'text-bone/60 hover:text-gold',
        className
      )}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path strokeLinejoin="round" d="M12 20.5s-7.5-4.4-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8-1.8 4.8-9.3 9.2-9.3 9.2z" />
      </svg>
    </button>
  );
}
