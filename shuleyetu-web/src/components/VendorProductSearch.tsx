'use client';

import { useMemo, useState } from 'react';

interface Product {
  id: string;
  name: string;
  category: string;
  price_tzs: number;
  stock_quantity: number;
}

interface VendorProductSearchProps {
  products: Product[];
  onProductSelect?: (product: Product) => void;
  renderProduct?: (product: Product) => React.ReactNode;
}

export default function VendorProductSearch({
  products,
  onProductSelect,
  renderProduct,
}: VendorProductSearchProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [inStockOnly, setInStockOnly] = useState(false);

  // Get unique categories
  const categories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category))).sort();
  }, [products]);

  // Get price range
  const maxPrice = useMemo(() => {
    return Math.max(...products.map(p => p.price_tzs), 0);
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !categoryFilter || product.category === categoryFilter;
      const matchesPrice = product.price_tzs >= priceRange[0] && product.price_tzs <= priceRange[1];
      const matchesStock = !inStockOnly || product.stock_quantity > 0;

      return matchesSearch && matchesCategory && matchesPrice && matchesStock;
    });
  }, [products, search, categoryFilter, priceRange, inStockOnly]);

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setPriceRange([0, maxPrice]);
    setInStockOnly(false);
  };

  const hasActiveFilters = search || categoryFilter || inStockOnly || priceRange[0] > 0 || priceRange[1] < maxPrice;

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        {/* Search Input */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">
            Search products
          </label>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-slate-50 placeholder-slate-500 outline-none transition-colors focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Category Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none transition-colors focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20"
            >
              <option value="">All categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Max Price: {priceRange[1].toLocaleString('en-TZ')} TZS
            </label>
            <input
              type="range"
              min="0"
              max={maxPrice}
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
              className="w-full"
            />
          </div>

          {/* Stock Filter */}
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-sky-500"
              />
              <span className="text-sm text-slate-300">In stock only</span>
            </label>
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors"
          >
            Clear all filters
          </button>
        )}

        {/* Results Count */}
        <div className="border-t border-slate-800 pt-3">
          <p className="text-xs text-slate-400">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        </div>
      </section>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/20 p-12 text-center">
          <div className="rounded-full bg-slate-800 p-4 text-slate-400">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-slate-300">No products found</p>
            <p className="mt-1 text-sm text-slate-400">
              Try adjusting your search or filters
            </p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="rounded-lg bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-400 transition-colors hover:bg-sky-500/20"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              onClick={() => onProductSelect?.(product)}
              className="group cursor-pointer rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition-all hover:border-slate-700 hover:bg-slate-900/60"
            >
              {renderProduct ? (
                renderProduct(product)
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-100 group-hover:text-sky-400 transition-colors">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                        {product.category}
                      </p>
                    </div>
                    {product.stock_quantity > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                        In Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400"></span>
                        Out of Stock
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-end justify-between border-t border-slate-800 pt-3">
                    <div>
                      <p className="text-lg font-bold text-sky-400">
                        {product.price_tzs.toLocaleString('en-TZ')}
                        <span className="ml-1 text-xs font-normal text-slate-400">TZS</span>
                      </p>
                    </div>
                    <p className="text-xs text-slate-400">
                      {product.stock_quantity} units
                    </p>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
