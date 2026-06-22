import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useAddToWishlist, useRemoveFromWishlist } from '../hooks/useAccount';
import { useToastStore } from '../stores/useToastStore';

interface WishlistButtonProps {
  productId: number;
  isWishlisted?: boolean;
  className?: string;
}

export default function WishlistButton({ productId, isWishlisted = false, className = '' }: WishlistButtonProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const addToast = useToastStore((s) => s.addToast);
  const navigate = useNavigate();
  const [active, setActive] = useState(isWishlisted);

  async function handleToggle() {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      if (active) {
        await removeFromWishlist.mutateAsync(productId);
        setActive(false);
        addToast('Removed from wishlist.', 'success');
      } else {
        await addToWishlist.mutateAsync(productId);
        setActive(true);
        addToast('Added to wishlist.', 'success');
      }
    } catch {
      addToast('Failed to update wishlist.', 'error');
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={addToWishlist.isPending || removeFromWishlist.isPending}
      className={`rounded-full p-1.5 transition-colors ${
        active
          ? 'text-danger-500 hover:text-danger-600'
          : 'text-secondary-400 hover:text-danger-500'
      } ${className}`}
      aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <svg
        className="h-5 w-5"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
}
