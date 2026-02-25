import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { Search } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { api } from '../../convex/_generated/api';
import type { Product, Brand, ProductType } from '../types';
import { Package } from 'lucide-react';

const BRANDS: Brand[] = ['iPhone', 'Samsung', 'Tecno', 'Infinix', 'Xiaomi', 'Oppo', 'Other'];
const PRODUCT_TABS: { key: ProductType; label: string }[] = [
  { key: 'phone', label: 'Phones' },
  { key: 'accessory', label: 'Accessories' },
];

export default function Inventory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isLowStock = searchParams.get('filter') === 'lowstock';

  const [activeType, setActiveType] = useState<ProductType>('phone');
  const [activeBrand, setActiveBrand] = useState<Brand | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // ---- Convex real-time query (replaces mock useEffect/setState) ----
  const convexProducts = useQuery(api.products.listProducts, { type: activeType });
  const loading = convexProducts === undefined;
  const products = (convexProducts ?? []) as Product[];

  const filteredProducts = products.filter((p) => {
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
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
            {isLowStock && (
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                Low Stock Filter
              </span>
            )}
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Type Tabs */}
          <div className="flex border-b border-gray-100 -mx-4 px-4">
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
        </div>

        {/* Brand Filter (Phones only) */}
        {activeType === 'phone' && (
          <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveBrand('All')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeBrand === 'All'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              All
            </button>
            {BRANDS.map((brand) => (
              <button
                key={brand}
                onClick={() => setActiveBrand(brand)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeBrand === brand
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product List */}
      <div className="px-4 py-3">
        {loading ? (
          <LoadingSpinner className="py-16" />
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon={<Package size={28} />}
            title="No products found"
            subtitle={searchQuery ? `No results for "${searchQuery}"` : 'Add your first product using the + button'}
          />
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 font-medium mb-2">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
              {isLowStock ? ' · Low stock' : ''}
            </p>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onClick={() => navigate(`/inventory/${product._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
