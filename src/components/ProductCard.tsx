import { Lock } from 'lucide-react';
import type { Product } from '../types';
import { formatETB, getStockStatus } from '../lib/utils';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const stock = getStockStatus(product.stockQuantity);
  const imageUrl = product.images[0]?.url;

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl p-3 flex items-center gap-3 shadow-sm border border-gray-100 w-full text-left active:scale-[0.98] transition-transform"
    >
      {/* Image */}
      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${product.brand} ${product.model}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
            No img
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {product.brand}
          </span>
          {product.exchangeEnabled ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Exchange
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700">
              <Lock size={10} />
              Locked
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-gray-900 truncate">{product.model}</p>
        {product.storage && (
          <p className="text-xs text-gray-500">{product.storage}</p>
        )}
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm font-bold text-blue-600">{formatETB(product.price)}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${stock.bg} ${stock.color}`}>
            {product.stockQuantity === 0 ? 'Out' : `${product.stockQuantity} left`}
          </span>
        </div>
      </div>
    </button>
  );
}
