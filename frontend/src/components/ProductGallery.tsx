import { useState } from 'react';
import type { ProductImage } from '../api/products';

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg bg-secondary-100">
        <svg className="h-24 w-24 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  const selected = images[selectedIndex];

  return (
    <div className="space-y-4">
      <div
        className={`relative aspect-square overflow-hidden rounded-lg bg-secondary-100 ${
          zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
        }`}
        onClick={() => setZoomed(!zoomed)}
      >
        <img
          src={zoomed ? selected.url : selected.thumbnail_url}
          alt={selected.alt_text || productName}
          className={`h-full w-full object-cover transition-transform duration-200 ${
            zoomed ? 'scale-150' : 'scale-100'
          }`}
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => {
                setSelectedIndex(index);
                setZoomed(false);
              }}
              className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                index === selectedIndex ? 'border-primary-500' : 'border-transparent hover:border-secondary-300'
              }`}
              aria-label={`View image ${index + 1}`}
              aria-current={index === selectedIndex ? 'true' : undefined}
            >
              <img
                src={image.thumbnail_url}
                alt={image.alt_text || `${productName} thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
