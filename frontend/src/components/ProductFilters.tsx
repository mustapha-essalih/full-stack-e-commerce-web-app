import { useSearchParams } from 'react-router-dom';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ProductFiltersProps {}

export default function ProductFilters(_props: ProductFiltersProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentSort = searchParams.get('sort') || 'created_at';
  const currentDirection = searchParams.get('direction') || 'desc';
  const inStockOnly = searchParams.get('in_stock') === 'true';
  const currentMinPrice = searchParams.get('min_price') || '';
  const currentMaxPrice = searchParams.get('max_price') || '';

  function updateParam(key: string, value: string | null) {
    const newParams = new URLSearchParams(searchParams);
    if (value === null || value === '') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    newParams.set('page', '1');
    setSearchParams(newParams, { replace: true });
  }

  return (
    <div className="space-y-6 rounded-lg border border-secondary-200 bg-white p-4">
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-secondary-500">Sort By</h3>
        <select
          value={`${currentSort}-${currentDirection}`}
          onChange={(e) => {
            const [sort, direction] = e.target.value.split('-');
            updateParam('sort', sort);
            updateParam('direction', direction);
          }}
          className="w-full rounded-md border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          aria-label="Sort products"
        >
          <option value="created_at-desc">Newest First</option>
          <option value="created_at-asc">Oldest First</option>
          <option value="price_cents-asc">Price: Low to High</option>
          <option value="price_cents-desc">Price: High to Low</option>
          <option value="name-asc">Name: A to Z</option>
          <option value="name-desc">Name: Z to A</option>
        </select>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-secondary-500">Price Range</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={currentMinPrice}
            onChange={(e) => updateParam('min_price', e.target.value ? String(Number(e.target.value) * 100) : null)}
            className="w-full rounded-md border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            aria-label="Minimum price"
            min={0}
          />
          <span className="text-secondary-400">-</span>
          <input
            type="number"
            placeholder="Max"
            value={currentMaxPrice}
            onChange={(e) => updateParam('max_price', e.target.value ? String(Number(e.target.value) * 100) : null)}
            className="w-full rounded-md border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            aria-label="Maximum price"
            min={0}
          />
        </div>
        <p className="mt-1 text-xs text-secondary-400">Prices in dollars</p>
      </div>

      <div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => updateParam('in_stock', e.target.checked ? 'true' : null)}
            className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-secondary-700">In Stock Only</span>
        </label>
      </div>

      <button
        onClick={() => setSearchParams({}, { replace: true })}
        className="w-full rounded-md border border-secondary-300 px-4 py-2 text-sm text-secondary-600 hover:bg-secondary-50"
      >
        Clear All Filters
      </button>
    </div>
  );
}
