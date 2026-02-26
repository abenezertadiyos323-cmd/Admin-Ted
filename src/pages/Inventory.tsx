import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { Package, Search, X, ChevronDown } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { Product, Brand, ProductType } from '../types';
import { getSearchHistory, addToSearchHistory, clearSearchHistory } from '../utils/searchHistory';

const BRANDS: Brand[] = ['iPhone', 'Samsung', 'Tecno', 'Infinix', 'Xiaomi', 'Oppo', 'Other'];
const PRODUCT_TABS: { key: ProductType; label: string }[] = [
  { key: 'phone', label: 'Phones' },
  { key: 'accessory', label: 'Accessories' },
];
type SortKey = 'newest' | 'price_asc' | 'price_desc';

// Module-level cache so navigating back to Inventory feels instant
const productCache: Partial<Record<ProductType, Product[]>> = {};

function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-3 flex gap-3 border border-gray-100 shadow-sm">
      <div className="w-16 h-16 rounded-xl bg-gray-100 animate-pulse flex-shrink-0" />
      <div className="flex-1 py-1 space-y-2">
        <div className="h-2.5 bg-gray-100 rounded-full animate-pulse w-1/3" />
        <div className="h-3.5 bg-gray-100 rounded-full animate-pulse w-2/3" />
        <div className="h-2.5 bg-gray-100 rounded-full animate-pulse w-1/4" />
      </div>
      <div className="w-14 h-5 bg-gray-100 rounded-full animate-pulse self-center" />
    </div>
  );
}

export default function Inventory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isLowStock = searchParams.get('filter') === 'lowstock';

  const [activeType, setActiveType] = useState<ProductType>('phone');
  const [activeBrand, setActiveBrand] = useState<Brand | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>(() => getSearchHistory());
  const [searchFocused, setSearchFocused] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [confirmDecrementProduct, setConfirmDecrementProduct] = useState<Product | null>(null);
  const [pendingProductIds, setPendingProductIds] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);

  const updateStockQuantity = useMutation(api.products.updateStockQuantity);

  // Convex real-time query — returns undefined on first subscribe
  const convexProducts = useQuery(api.products.listProducts, { type: activeType });
  const cached = productCache[activeType];
  // Only show skeleton when BOTH Convex and cache are empty
  const loading = convexProducts === undefined && !cached;
  const products = (convexProducts ?? cached ?? []) as Product[];

  // Keep module-level cache warm so re-visits are instant
  useEffect(() => {
    if (convexProducts !== undefined) {
      productCache[activeType] = convexProducts as Product[];
    }
  }, [activeType, convexProducts]);

  // Save to history on blur if the query is meaningful
  const handleSearchBlur = () => {
    setTimeout(() => setSearchFocused(false), 200);
    if (searchQuery.trim().length > 1) {
      addToSearchHistory(searchQuery.trim());
      setSearchHistory(getSearchHistory());
    }
  };

  const applyHistoryChip = (q: string) => {
    setSearchQuery(q);
    addToSearchHistory(q);
    setSearchHistory(getSearchHistory());
    setSearchFocused(false);
    searchRef.current?.blur();
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setSearchHistory([]);
  };

  // Filtering + sorting
  const filteredAndSorted = [...products]
    .filter((p) => {
      const matchesBrand =
        activeBrand === 'All' ||
        (activeBrand === 'Other'
          ? !['iPhone', 'Samsung', 'Tecno', 'Infinix', 'Xiaomi', 'Oppo'].includes(p.brand)
          : p.brand === activeBrand);

      const matchesSearch =
        !searchQuery ||
        p.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesLowStock = !isLowStock || p.stockQuantity <= 2;

      return matchesBrand && matchesSearch && matchesLowStock;
    })
    .sort((a, b) => {
      if (sortKey === 'price_asc') return a.price - b.price;
      if (sortKey === 'price_desc') return b.price - a.price;
      return b.createdAt - a.createdAt; // newest first
    });

  // Stock management helpers
  const setProductPending = (productId: string, pending: boolean) => {
    setPendingProductIds((prev) => {
      const next = new Set(prev);
      if (pending) next.add(productId);
      else next.delete(productId);
      return next;
    });
  };

  const updateProductStock = async (productId: string, delta: 1 | -1) => {
    setProductPending(productId, true);
    try {
      await updateStockQuantity({ productId: productId as Id<'products'>, delta });
    } catch (err) {
      console.error(err);
    } finally {
      setProductPending(productId, false);
    }
  };

  const handleIncrement = (product: Product) => void updateProductStock(product._id, 1);
  const handleDecrementRequest = (product: Product) => {
    if (product.stockQuantity === 0) return;
    setConfirmDecrementProduct(product);
  };
  const handleConfirmDecrement = () => {
    if (!confirmDecrementProduct) return;
    const productId = confirmDecrementProduct._id;
    setConfirmDecrementProduct(null);
    void updateProductStock(productId, -1);
  };

  const showHistoryChips = searchFocused && !searchQuery && searchHistory.length > 0;
  const activeFilterCount = sortKey !== 'newest' ? 1 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header — env(safe-area-inset-top) prevents Telegram chrome overlap */}
      <div
        className="bg-white border-b border-gray-100 sticky top-0 z-10"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="px-4 pt-3 pb-0">
          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
            {isLowStock && (
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                Low Stock
              </span>
            )}
          </div>

          {/* Search bar */}
          <div className="relative mb-2">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={handleSearchBlur}
              className="w-full bg-gray-100 rounded-xl pl-9 pr-9 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  setSearchQuery('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 active:scale-90 transition-transform"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Recent search chips */}
          {showHistoryChips && (
            <div className="pb-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-gray-400 font-medium">Recent searches</span>
                <button
                  onMouseDown={handleClearHistory}
                  className="text-[11px] text-blue-500 font-medium active:opacity-70"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {searchHistory.map((h) => (
                  <button
                    key={h}
                    onMouseDown={() => applyHistoryChip(h)}
                    className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs text-gray-700 font-medium active:scale-95 transition-transform"
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Type tabs */}
        <div className="flex border-b border-gray-100 px-4">
          {PRODUCT_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveType(tab.key);
                setActiveBrand('All');
              }}
              className={`flex-1 py-2.5 text-sm font-semibold relative transition-colors ${
                activeType === tab.key ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              {tab.label}
              {activeType === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Brand filter (phones only) */}
        {activeType === 'phone' && (
          <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveBrand('All')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeBrand === 'All' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              All
            </button>
            {BRANDS.map((brand) => (
              <button
                key={brand}
                onClick={() => setActiveBrand(brand)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeBrand === brand ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        )}

        {/* Sort row */}
        <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
          {/* Sort dropdown */}
          <div className="relative flex-shrink-0">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className={`pl-2.5 pr-6 py-1.5 rounded-xl text-xs font-semibold appearance-none outline-none transition-all cursor-pointer ${
                sortKey !== 'newest'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
            </select>
            <ChevronDown
              size={11}
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                sortKey !== 'newest' ? 'text-white' : 'text-gray-400'
              }`}
            />
          </div>

          {/* Reset all filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setSortKey('newest');
              }}
              className="flex-shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-gray-200 text-gray-600 transition-all active:scale-95"
            >
              Reset ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      {/* Product list */}
      <div className="px-4 py-3">
        {loading ? (
          // Skeleton — shown only on first ever load (no cache yet)
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <ProductSkeleton key={n} />
            ))}
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <EmptyState
            icon={<Package size={28} />}
            title="No products found"
            subtitle={
              searchQuery
                ? `No results for "${searchQuery}"`
                : 'Add your first product using the + button'
            }
          />
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 font-medium mb-2">
              {filteredAndSorted.length} product{filteredAndSorted.length !== 1 ? 's' : ''}
              {isLowStock ? ' · Low stock' : ''}
            </p>
            {filteredAndSorted.map((product) => (
              <div key={product._id} className="space-y-1">
                <ProductCard
                  product={product}
                  onClick={() => navigate(`/inventory/${product._id}`)}
                />
                <div className="flex items-center justify-end gap-2 px-2">
                  <button
                    type="button"
                    onClick={() => handleDecrementRequest(product)}
                    disabled={product.stockQuantity === 0 || pendingProductIds.has(product._id)}
                    className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-700 text-base font-bold leading-none active:scale-95 transition-transform disabled:opacity-40 disabled:active:scale-100"
                  >
                    -
                  </button>
                  <span className="w-7 text-center text-sm font-semibold text-gray-700">
                    {product.stockQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleIncrement(product)}
                    disabled={pendingProductIds.has(product._id)}
                    className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-700 text-base font-bold leading-none active:scale-95 transition-transform disabled:opacity-40 disabled:active:scale-100"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Decrement confirmation bottom sheet */}
      {confirmDecrementProduct && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40">
          <div
            className="bg-white rounded-t-3xl w-full p-5 animate-in slide-in-from-bottom duration-200"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <h2 className="text-base font-bold text-gray-900 mb-1">Confirm stock decrease</h2>
            <p className="text-xs text-gray-500 mb-4">
              {`${confirmDecrementProduct.brand} ${confirmDecrementProduct.model}: ${confirmDecrementProduct.stockQuantity} → ${Math.max(0, confirmDecrementProduct.stockQuantity - 1)}`}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDecrementProduct(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm active:scale-95 transition-transform"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDecrement}
                disabled={pendingProductIds.has(confirmDecrementProduct._id)}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm active:scale-95 transition-transform disabled:opacity-50"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
