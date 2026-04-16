import type { Product } from '../types';
import { Package, Smartphone, CheckCircle, Clock } from 'lucide-react';

export default function ProductCard({ 
  product, 
  onClick 
}: { 
  product: Product; 
  onClick?: () => void 
}) {
  // Derive status badge
  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 2;

  // Use the storage URL from the backend normalizer
  const mainImage = product.images?.[0] || '';
  const imageUrl = mainImage.startsWith('http') 
    ? mainImage 
    : mainImage 
      ? `https://fastidious-schnauzer-265.convex.cloud/api/storage/${mainImage}`
      : '';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-surface border border-border rounded-2xl p-3 flex gap-4 active:scale-[0.98] transition-all relative overflow-hidden ${product.isArchived ? 'opacity-60 grayscale-[0.4]' : ''}`}
    >
      {/* Status Overlay for Archive */}
      {product.isArchived && (
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/50 backdrop-blur-md rounded-lg z-10">
          <span className="text-[9px] font-black text-white/80 uppercase">Archived</span>
        </div>
      )}

      {/* Image / Icon container */}
      <div className="w-16 h-16 rounded-xl bg-surface-2 border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          product.type === 'phone' ? <Smartphone size={24} className="text-muted" /> : <Package size={24} className="text-muted" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h3 className="text-sm font-bold text-text truncate mb-0.5">
          {product.phoneType || 'Unnamed Product'}
        </h3>
        
        <div className="flex items-center gap-1.5 mb-1.5">
           <p className="text-[10px] font-black text-muted uppercase tracking-wider">
             {product.type === 'phone' ? `${product.storage || ''} · ${product.condition || ''}` : 'Accessory'}
           </p>
           {product.exchangeEnabled && (
             <span className="w-1 h-1 rounded-full bg-primary" />
           )}
           {product.exchangeEnabled && (
             <span className="text-[9px] font-bold text-primary uppercase">Trade-in</span>
           )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm font-black text-text">
            {product.price.toLocaleString()} <span className="text-[9px] font-bold opacity-60">ETB</span>
          </p>
          
          <div className="flex items-center gap-1">
            {isOutOfStock ? (
              <span className="text-[10px] font-bold text-red-500 uppercase">Out of Stock</span>
            ) : isLowStock ? (
              <span className="text-[10px] font-bold text-primary uppercase">{product.stockQuantity} Low Stock</span>
            ) : (
              <span className="text-[10px] font-bold text-muted uppercase">{product.stockQuantity} in stock</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
