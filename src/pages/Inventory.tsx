import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { Package, Search, X, Loader2, SlidersHorizontal } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { Product, ProductType, Condition } from '../types';
import { getSearchHistory, addToSearchHistory, clearSearchHistory } from '../utils/searchHistory';

type InventoryTab = 'all' | 'inStock' | 'lowStock' | 'outOfStock' | 'exchangeEnabled' | 'archived';

const PRODUCT_TABS: { key: ProductType; label: string }[] = [
  { key: 'phone', label: 'Phones' },
  { key: 'accessory', label: 'Accessories' },
];
const FILTER_TABS: { key: InventoryTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'inStock', label: 'In Stock' },
  { key: 'lowStock', label: 'Low Stock' },
  { key: 'outOfStock', label: 'Out of Stock' },
  { key: 'exchangeEnabled', label: 'Exchange' },
  { key: 'archived', label: 'Archived' },
];

type AdvancedFilters = {
  condition?: Condition;
  priceMin?: number;
  priceMax?: number;
  storageGb?: number;
  hasImages?: boolean;
};

const CONDITIONS: { value: Condition; label: string }[] = [
  { value: 'Excellent', label: 'Excellent' },
  { value: 'Good', label: 'Good' },
  { value: 'Fair', label: 'Fair' },
  { value: 'Poor', label: 'Poor' },
];

const STORAGE_OPTIONS = [64, 128, 256, 512] as const;

// Module-level cache: keyed by "type-tab-filters" so each combination feels instant on re-visit.
const productCache: Partial<Record<string, Product[]>> = {};
const isProductType = (value: string | null): value is ProductType =>
  value === 'phone' || value === 'accessory';

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
  const inventoryTypeParam = searchParams.get('type');

  const [activeType, setActiveType] = useState<ProductType>(
    () => isProductType(inventoryTypeParam) ? inventoryTypeParam : 'phone',
  );
  // Initialise tab from URL param so Dashboard deep-links still work.
  const [tab, setTab] = useState<InventoryTab>(
    () => searchParams.get('filter') === 'lowstock' ? 'lowStock' : 'all',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>(() => getSearchHistory());
  const [searchFocused, setSearchFocused] = useState(false);
  const [confirmDecrementProduct, setConfirmDecrementProduct] = useState<Product | null>(null);
  const [pendingProductIds, setPendingProductIds] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);
  // committedQ is the value actually sent to the backend (debounced)
  const [committedQ, setCommittedQ] = useState('');
  // isSearching: true while the debounce timer is pending
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Advanced filter drawer
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({});
  const [draftFilters, setDraftFilters] = useState<AdvancedFilters>({});
  const [drawerOpen, setDrawerOpen] = useState(false);

  const updateStockQuantity = useMutation(api.products.updateStockQuantity);

  // Number of active advanced filters — drives the indicator dot on the filter icon
  const activeFilterCount = [
    advancedFilters.condition,
    advancedFilters.priceMin,
    advancedFilters.priceMax,
    advancedFilters.storageGb,
    advancedFilters.hasImages,
  ].filter((v) => v !== undefined).length;

  // Convex real-time query — returns undefined on first subscribe or when args change
  const cacheKey = `${activeType}-${tab}-${JSON.stringify(advancedFilters)}`;
  const convexProducts = useQuery(api.products.listProducts, {
    tab,
    type: activeType,
    q: committedQ || undefined,
    condition: advancedFilters.condition,
    priceMin: advancedFilters.priceMin,
    priceMax: advancedFilters.priceMax,
    storageGb: advancedFilters.storageGb,
    hasImages: advancedFilters.hasImages,
  });
  const cached = productCache[cacheKey];
  // Only show skeleton when BOTH Convex and cache are empty
  const loading = convexProducts === undefined && !cached;
  const products = (convexProducts ?? cached ?? []) as Product[];

  // Keep module-level cache warm so re-visits are instant
  useEffect(() => {
    if (convexProducts !== undefined) {
      productCache[cacheKey] = convexProducts as Product[];
    }
  }, [cacheKey, convexProducts]);

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

  // Advanced filter drawer handlers
  const openDrawer = () => {
    setDraftFilters({ ...advancedFilters });
    setDrawerOpen(true);
  };

  const handleApplyFilters = () => {
    setAdvancedFilters({ ...draftFilters });
    setDrawerOpen(false);
  };

  const handleResetFilters = () => {
    setAdvancedFilters({});
    setDraftFilters({});
    setDrawerOpen(false);
  };

  // Debounce effect: fires on every keystroke, commits search to backend after 300ms
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (!searchQuery) {
      setCommittedQ('');
      setIsSearching(false);
      return;
    }

    const isNumeric = /^[0-9]+$/.test(searchQuery);
    const minLen = isNumeric ? 3 : 2;

    if (searchQuery.length < minLen) {
      // Below minimum — clear any prior search and show default list
      setCommittedQ('');
      setIsSearching(false);
      return;
    }

    // Above minimum — show loader immediately, then commit after 300ms
    setIsSearching(true);
    debounceRef.current = setTimeout(() => {
      setIsSearching(false); // Debounce fired; query loading takes over the indicator
      setCommittedQ(searchQuery);
    }, 300);
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // Enter key: bypass debounce and trigger immediately
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (!searchQuery) {
      setCommittedQ('');
      setIsSearching(false);
      return;
    }
    const isNumeric = /^[0-9]+$/.test(searchQuery);
    const minLen = isNumeric ? 3 : 2;
    if (searchQuery.length >= minLen) {
      setIsSearching(false);
      setCommittedQ(searchQuery);
    }
  };

  // Loader indicator: true while debounce is pending OR while Convex is fetching
  const showLoader = isSearching || (convexProducts === undefined && !!committedQ);

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
          </div>

          {/* Search bar + filter button */}
          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              {showLoader ? (
                <Loader2
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin pointer-events-none"
                />
              ) : (
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              )}
              <input
                ref={searchRef}
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
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
            {/* Advanced filter icon */}
            <button
              type="button"
              onClick={openDrawer}
              className="relative flex-shrink-0 w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 active:scale-95 transition-transform"
            >
              <SlidersHorizontal size={16} />
              {activeFilterCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
              )}
            </button>
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
          {PRODUCT_TABS.map((pt) => (
            <button
              key={pt.key}
              onClick={() => setActiveType(pt.key)}
              className={`flex-1 py-2.5 text-sm font-semibold relative transition-colors ${
                activeType === pt.key ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              {pt.label}
              {activeType === pt.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Status filter chips — All, In Stock, Low Stock, Out of Stock, Exchange, Archived */}
        <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide border-b border-gray-100">
          {FILTER_TABS.map((ft) => (
            <button
              key={ft.key}
              onClick={() => setTab(ft.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                tab === ft.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {ft.label}
            </button>
          ))}
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
        ) : products.length === 0 ? (
          <EmptyState
            icon={<Package size={28} />}
            title="No products found"
            subtitle={
              committedQ
                ? `No results for "${committedQ}"`
                : 'Add your first product using the + button'
            }
          />
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 font-medium mb-2">
              {products.length} product{products.length !== 1 ? 's' : ''}
              {tab !== 'all' ? ` · ${FILTER_TABS.find((ft) => ft.key === tab)?.label ?? ''}` : ''}
            </p>
            {products.map((product) => (
              <div key={product._id} className="space-y-1">
                <ProductCard
                  product={product}
                  onClick={() => navigate(`/inventory/${product._id}?type=${activeType}`)}
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
              {`${confirmDecrementProduct.phoneType}: ${confirmDecrementProduct.stockQuantity} → ${Math.max(0, confirmDecrementProduct.stockQuantity - 1)}`}
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

      {/* Advanced Filter Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Sheet */}
          <div
            className="relative bg-white rounded-t-3xl w-full animate-in slide-in-from-bottom duration-200"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-1" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <h2 className="text-base font-bold text-gray-900">Filters</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 active:scale-90 transition-transform"
              >
                <X size={14} />
              </button>
            </div>

            {/* Filter sections */}
            <div className="px-5 space-y-5 max-h-[60vh] overflow-y-auto pb-2">

              {/* Condition */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Condition</p>
                <div className="flex gap-2 flex-wrap">
                  {CONDITIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() =>
                        setDraftFilters((prev) => ({
                          ...prev,
                          condition: prev.condition === c.value ? undefined : c.value,
                        }))
                      }
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        draftFilters.condition === c.value
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Price Range</p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="Min"
                    value={draftFilters.priceMin ?? ''}
                    onChange={(e) =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        priceMin: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    className="flex-1 bg-gray-100 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                  />
                  <span className="text-gray-400 text-sm font-medium">–</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={draftFilters.priceMax ?? ''}
                    onChange={(e) =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        priceMax: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    className="flex-1 bg-gray-100 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Storage */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Storage</p>
                <select
                  value={draftFilters.storageGb ?? ''}
                  onChange={(e) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      storageGb: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  className="w-full bg-gray-100 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors appearance-none"
                >
                  <option value="">Any</option>
                  {STORAGE_OPTIONS.map((gb) => (
                    <option key={gb} value={gb}>
                      {gb} GB
                    </option>
                  ))}
                </select>
              </div>

              {/* Has Images */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">Has Images</p>
                <button
                  type="button"
                  onClick={() =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      hasImages: prev.hasImages ? undefined : true,
                    }))
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    draftFilters.hasImages ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      draftFilters.hasImages ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

            </div>

            {/* Footer buttons */}
            <div className="flex gap-3 px-5 pt-4">
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm active:scale-95 transition-transform"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleApplyFilters}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm active:scale-95 transition-transform"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
