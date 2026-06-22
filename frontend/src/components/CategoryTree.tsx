import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Category } from '../api/products';

interface CategoryTreeProps {
  categories: Category[];
  selectedSlug?: string;
}

function CategoryNode({ category, selectedSlug, depth = 0 }: { category: Category; selectedSlug?: string; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = category.children && category.children.length > 0;
  const isSelected = category.slug === selectedSlug;

  return (
    <div>
      <div
        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
          isSelected
            ? 'bg-primary-50 font-medium text-primary-700'
            : 'text-secondary-700 hover:bg-secondary-100'
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-secondary-400 hover:text-secondary-600"
            aria-label={expanded ? 'Collapse category' : 'Expand category'}
          >
            <svg
              className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        {!hasChildren && <div className="w-3.5" />}
        <Link
          to={`/category/${category.slug}`}
          className="flex-1 truncate"
        >
          {category.name}
        </Link>
        {category.products_count !== undefined && (
          <span className="text-xs text-secondary-400">({category.products_count})</span>
        )}
      </div>
      {hasChildren && expanded && (
        <div>
          {category.children!.map((child) => (
            <CategoryNode
              key={child.uuid}
              category={child}
              selectedSlug={selectedSlug}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoryTree({ categories, selectedSlug }: CategoryTreeProps) {
  return (
    <nav className="rounded-lg border border-secondary-200 bg-white p-4" aria-label="Category navigation">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-secondary-500">Categories</h3>
      <div className="space-y-0.5">
        <Link
          to="/catalog"
          className={`block rounded-md px-3 py-2 text-sm transition-colors ${
            !selectedSlug ? 'bg-primary-50 font-medium text-primary-700' : 'text-secondary-700 hover:bg-secondary-100'
          }`}
        >
          All Products
        </Link>
        {categories.map((category) => (
          <CategoryNode
            key={category.uuid}
            category={category}
            selectedSlug={selectedSlug}
          />
        ))}
      </div>
    </nav>
  );
}
