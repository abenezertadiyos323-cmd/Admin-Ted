// src/pages/ProductForm.tsx
// Advanced brand-aware product form with multi-variant support (aligned with Micky Mobile)

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { ProductType, Condition, Variant } from '../types';
import { 
  ChevronLeft, 
  Trash2, 
  Plus, 
  X, 
  Smartphone, 
  Watch, 
  Apple, 
  Info,
  CheckCircle2,
  AlertCircle,
  Save,
  PackageCheck
} from 'lucide-react';
import { normalizePhoneType, validatePhoneType } from '../lib/phoneTypeUtils';

// ============================================================
// CONFIG & CONSTANTS
// ============================================================

const CONDITIONS: Condition[] = ['New', 'Like New', 'Excellent', 'Good', 'Fair', 'Poor'];

const STORAGE_OPTIONS = ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB'];
const RAM_OPTIONS = ['4GB', '6GB', '8GB', '12GB', '16GB'];

const IPHONE_MODELS = [
  'iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16',
  'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15',
  'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14',
  'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 13 mini',
  'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', 'iPhone 12 mini',
  'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11'
];

const SAMSUNG_MODELS = [
  'Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24',
  'Galaxy S23 Ultra', 'Galaxy S23+', 'Galaxy S23',
  'Galaxy S22 Ultra', 'Galaxy S22+', 'Galaxy S22',
  'Galaxy Z Fold 6', 'Galaxy Z Flip 6',
  'Galaxy Z Fold 5', 'Galaxy Z Flip 5'
];

type ActiveTab = 'iPhone' | 'Samsung' | 'Accessory';

// ============================================================
// COMPONENT
// ============================================================

export default function ProductForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get('id') as Id<'products'> | null;

  const createMutation = useMutation(api.products.createProduct);
  const updateMutation = useMutation(api.products.updateProduct);
  const existingProduct = useQuery(api.products.getProductById, editId ? { productId: editId } : 'skip');

  // ---- Form State ----
  const [activeTab, setActiveTab] = useState<ActiveTab>('iPhone');
  const [phoneType, setPhoneType] = useState('');
  const [brand, setBrand] = useState('Apple');
  const [condition, setCondition] = useState<Condition>('New');
  const [exchangeEnabled, setExchangeEnabled] = useState(true);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Specs
  const [batteryHealth, setBatteryHealth] = useState('');
  const [modelOrigin, setModelOrigin] = useState('');
  const [network, setNetwork] = useState('Unlocked');
  const [screenSize, setScreenSize] = useState('');
  
  // Variants
  const [variants, setVariants] = useState<Variant[]>([
    { storage: '128GB', price: 0, stock: 1 }
  ]);

  // Loading/Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- Effects ----
  useEffect(() => {
    if (existingProduct) {
      const type = existingProduct.type;
      const isPhone = type === 'phone';
      const isApple = existingProduct.brand === 'Apple' || (existingProduct.phoneType?.toLowerCase().includes('iphone'));
      const isSamsung = existingProduct.brand === 'Samsung' || (existingProduct.phoneType?.toLowerCase().includes('galaxy'));

      if (!isPhone) setActiveTab('Accessory');
      else if (isApple) setActiveTab('iPhone');
      else if (isSamsung) setActiveTab('Samsung');
      else setActiveTab('iPhone'); // Default fallback

      setPhoneType(existingProduct.phoneType || '');
      setBrand(existingProduct.brand || (isApple ? 'Apple' : isSamsung ? 'Samsung' : 'Other'));
      setCondition(existingProduct.condition || 'New');
      setExchangeEnabled(existingProduct.exchangeEnabled);
      setDescription(existingProduct.description || '');
      setImages(existingProduct.images || []);
      setBatteryHealth(existingProduct.batteryHealth || '');
      setModelOrigin(existingProduct.modelOrigin || '');
      setNetwork(existingProduct.network || 'Unlocked');
      setScreenSize(existingProduct.screenSize || '');

      if (existingProduct.variants && existingProduct.variants.length > 0) {
        setVariants(existingProduct.variants);
      } else {
         // Legacy compatibility
         setVariants([{ storage: existingProduct.storage || 'N/A', ram: existingProduct.ram, price: existingProduct.price, stock: existingProduct.stockQuantity }]);
      }
    }
  }, [existingProduct]);

  // Update tab-related brand
  useEffect(() => {
    if (activeTab === 'iPhone') setBrand('Apple');
    else if (activeTab === 'Samsung') setBrand('Samsung');
  }, [activeTab]);

  // ---- Handlers ----
  const handleAddVariant = () => {
    setVariants([...variants, { storage: '128GB', price: 0, stock: 1 }]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length === 1) return;
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, patch: Partial<Variant>) => {
    const next = [...variants];
    next[index] = { ...next[index], ...patch };
    setVariants(next);
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    if (images.length >= 5) return;
    setImages([...images, newImageUrl.trim()]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validatePhoneType(phoneType);
    if (!validation.valid) {
      setError(validation.error || 'Invalid product name');
      return;
    }

    if (variants.some(v => v.price <= 0)) {
      setError('All variants must have a price greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const type: ProductType = activeTab === 'Accessory' ? 'accessory' : 'phone';
      
      // We use the first variant as the "base" for legacy field compatibility in database
      const baseVariant = variants[0];

      const payload = {
        type,
        phoneType: normalizePhoneType(phoneType),
        brand: activeTab === 'Accessory' ? undefined : brand,
        condition,
        exchangeEnabled,
        description,
        images,
        price: baseVariant.price,
        stockQuantity: variants.reduce((acc, v) => acc + v.stock, 0),
        storage: baseVariant.storage,
        ram: baseVariant.ram,
        variants: activeTab === 'Accessory' ? undefined : variants,
        batteryHealth: activeTab === 'Accessory' ? undefined : batteryHealth,
        modelOrigin: activeTab === 'Accessory' ? undefined : modelOrigin,
        network: activeTab === 'Accessory' ? undefined : network,
        screenSize,
        updatedBy: 'Admin', // In real app, get from Auth
        sellerId: 'ted-tech-01', // Static for TedyTech
      };

      if (editId) {
        await updateMutation({ productId: editId, ...payload });
      } else {
        await createMutation({ ...payload, createdBy: 'Admin' });
      }

      window.Telegram?.WebApp.HapticFeedback.notificationOccurred('success');
      navigate('/inventory');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save product');
      window.Telegram?.WebApp.HapticFeedback.notificationOccurred('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- UI Helpers ----
  const TabButton = ({ id, label, icon: Icon }: { id: ActiveTab, label: string, icon: any }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`flex-1 py-3 px-2 flex flex-col items-center gap-1.5 transition-all text-xs font-semibold rounded-xl border ${
        activeTab === id 
          ? 'bg-primary text-primary-fg border-primary shadow-lg shadow-primary/20' 
          : 'bg-surface-2 text-muted border-border hover:text-app-text'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg/80 backdrop-blur-md border-b border-border pt-safe-top">
        <div className="px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-2 border border-border text-app-text active:scale-95 transition-transform"
          >
            <ChevronLeft size={22} />
          </button>
          
          <h1 className="text-lg font-bold text-app-text tracking-tight">
            {editId ? 'Edit Product' : 'Add New Product'}
          </h1>

          <div className="w-10" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-6">
        {/* Category Tabs */}
        {!editId && (
          <div className="flex gap-2 p-1 bg-surface-2 rounded-2xl border border-border">
            <TabButton id="iPhone" label="iPhone" icon={Apple} />
            <TabButton id="Samsung" label="Samsung" icon={Smartphone} />
            <TabButton id="Accessory" label="Accessory" icon={Watch} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Basic Info */}
          <section className="bg-surface rounded-2xl border border-border p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Info size={18} />
              </div>
              <h2 className="font-bold text-app-text">Basic Information</h2>
            </div>

            <div className="space-y-4">
              {/* Type Search/Select */}
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2 ml-1">
                  {activeTab === 'Accessory' ? 'Accessory Name' : 'Phone Model'}
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={phoneType}
                    onChange={(e) => setPhoneType(e.target.value)}
                    placeholder={activeTab === 'Accessory' ? "e.g. AirPods Pro Gen 2" : "e.g. iPhone 16 Pro Max"}
                    className="w-full h-12 bg-surface-2 border border-border rounded-xl px-4 text-app-text placeholder:text-muted/40 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all"
                  />
                  {activeTab !== 'Accessory' && phoneType.length < 3 && (
                     <div className="flex gap-1.5 p-1 px-3 mt-2 scrollbar-hide overflow-x-auto">
                        {(activeTab === 'iPhone' ? IPHONE_MODELS : SAMSUNG_MODELS).slice(0, 5).map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setPhoneType(m)}
                            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-surface-2 border border-border text-[11px] font-medium text-muted hover:border-primary/30 active:bg-primary/5"
                          >
                            {m}
                          </button>
                        ))}
                     </div>
                  )}
                </div>
              </div>

              {/* Condition & Exchange */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2 ml-1">Condition</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as Condition)}
                    className="w-full h-12 bg-surface-2 border border-border rounded-xl px-4 text-app-text focus:border-primary/50 outline-none"
                  >
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2 ml-1">Exchange</label>
                  <button
                    type="button"
                    onClick={() => setExchangeEnabled(!exchangeEnabled)}
                    className={`w-full h-12 rounded-xl border flex items-center justify-center gap-2 font-semibold transition-all ${
                      exchangeEnabled 
                        ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                        : 'bg-muted/5 border-border text-muted'
                    }`}
                  >
                    {exchangeEnabled ? <CheckCircle2 size={18} /> : <X size={18} />}
                    {exchangeEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Variants & Pricing */}
          {activeTab !== 'Accessory' && (
            <section className="bg-surface rounded-2xl border border-border overflow-hidden">
               <div className="p-5 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Save size={18} />
                    </div>
                    <h2 className="font-bold text-app-text">Pricing & Storage</h2>
                  </div>
                  <button 
                    type="button"
                    onClick={handleAddVariant}
                    className="text-xs font-bold text-primary flex items-center gap-1 active:scale-95 transition-transform"
                  >
                    <Plus size={14} /> Add Variant
                  </button>
               </div>

               <div className="divide-y divide-border">
                  {variants.map((v, i) => (
                    <div key={i} className="p-5 space-y-4">
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-bold text-muted uppercase tracking-widest">Variant #{i + 1}</span>
                         {variants.length > 1 && (
                            <button 
                              type="button"
                              onClick={() => handleRemoveVariant(i)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 size={16} />
                            </button>
                         )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-muted/60 mb-2 uppercase">Storage</label>
                          <select
                            value={v.storage}
                            onChange={(e) => updateVariant(i, { storage: e.target.value })}
                            className="w-full h-11 bg-surface-2 border border-border rounded-xl px-3 text-sm focus:border-primary/50 outline-none"
                          >
                            {STORAGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-muted/60 mb-2 uppercase">RAM (Optional)</label>
                          <select
                            value={v.ram || ''}
                            onChange={(e) => updateVariant(i, { ram: e.target.value || undefined })}
                            className="w-full h-11 bg-surface-2 border border-border rounded-xl px-3 text-sm focus:border-primary/50 outline-none"
                          >
                            <option value="">None</option>
                            {RAM_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-muted/60 mb-2 uppercase">Price (ETB)</label>
                          <input
                            type="number"
                            value={v.price || ''}
                            onChange={(e) => updateVariant(i, { price: Number(e.target.value) })}
                            placeholder="75000"
                            className="w-full h-11 bg-surface-2 border border-border rounded-xl px-4 text-sm focus:border-primary/50 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-muted/60 mb-2 uppercase">Stock</label>
                          <div className="flex items-center gap-2">
                            <button 
                              type="button"
                              onClick={() => updateVariant(i, { stock: Math.max(0, v.stock - 1) })}
                              className="w-11 h-11 flex items-center justify-center bg-surface-2 border border-border rounded-xl active:bg-surface-3"
                            >-</button>
                            <input
                              type="number"
                              value={v.stock}
                              onChange={(e) => updateVariant(i, { stock: Number(e.target.value) })}
                              className="flex-1 h-11 bg-transparent text-center font-bold text-app-text outline-none"
                            />
                            <button 
                              type="button"
                              onClick={() => updateVariant(i, { stock: v.stock + 1 })}
                              className="w-11 h-11 flex items-center justify-center bg-surface-2 border border-border rounded-xl active:bg-surface-3"
                            >+</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
               </div>
            </section>
          )}

          {/* Section: Accessory Price/Stock (One row only) */}
          {activeTab === 'Accessory' && (
             <section className="bg-surface rounded-2xl border border-border p-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Save size={18} />
                  </div>
                  <h2 className="font-bold text-app-text">Price & Stock</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-[10px] font-bold text-muted mb-2 uppercase">Price (ETB)</label>
                      <input
                        type="number"
                        value={variants[0].price || ''}
                        onChange={(e) => updateVariant(0, { price: Number(e.target.value) })}
                        className="w-full h-12 bg-surface-2 border border-border rounded-xl px-4 outline-none focus:border-primary/50"
                      />
                   </div>
                   <div>
                      <label className="block text-[10px] font-bold text-muted mb-2 uppercase">Stock</label>
                      <input
                        type="number"
                        value={variants[0].stock}
                        onChange={(e) => updateVariant(0, { stock: Number(e.target.value) })}
                        className="w-full h-12 bg-surface-2 border border-border rounded-xl px-4 outline-none focus:border-primary/50 text-center font-bold"
                      />
                   </div>
                </div>
             </section>
          )}

          {/* Section: Tech Specs (Phone only) */}
          {activeTab !== 'Accessory' && (
            <section className="bg-surface rounded-2xl border border-border p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Smartphone size={18} />
                </div>
                <h2 className="font-bold text-app-text">Technical Specifications</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-[10px] font-bold text-muted mb-2 uppercase tracking-widest leading-none">Battery Health</label>
                    <input
                      type="text"
                      value={batteryHealth}
                      onChange={(e) => setBatteryHealth(e.target.value)}
                      placeholder="e.g. 100% or 95%"
                      className="w-full h-11 bg-surface-2 border border-border rounded-xl px-4 text-sm outline-none focus:border-primary/50"
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-muted mb-2 uppercase tracking-widest leading-none">Model / Origin</label>
                    <input
                      type="text"
                      value={modelOrigin}
                      onChange={(e) => setModelOrigin(e.target.value)}
                      placeholder="e.g. LLA (USA)"
                      className="w-full h-11 bg-surface-2 border border-border rounded-xl px-4 text-sm outline-none focus:border-primary/50"
                    />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-[10px] font-bold text-muted mb-2 uppercase tracking-widest leading-none">Network</label>
                    <select
                      value={network}
                      onChange={(e) => setNetwork(e.target.value)}
                      className="w-full h-11 bg-surface-2 border border-border rounded-xl px-4 text-sm outline-none focus:border-primary/50 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat"
                    >
                      <option value="Unlocked">Unlocked (Full)</option>
                      <option value="Locked">Locked</option>
                      <option value="Turbo SIM">Turbo / Gevey SIM</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-muted mb-2 uppercase tracking-widest leading-none">Screen Size</label>
                    <input
                      type="text"
                      value={screenSize}
                      onChange={(e) => setScreenSize(e.target.value)}
                      placeholder="e.g. 6.7 inch"
                      className="w-full h-11 bg-surface-2 border border-border rounded-xl px-4 text-sm outline-none focus:border-primary/50"
                    />
                 </div>
              </div>
            </section>
          )}

          {/* Section: Photos */}
          <section className="bg-surface rounded-2xl border border-border p-5 space-y-4">
             <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <PackageCheck size={18} />
                </div>
                <h2 className="font-bold text-app-text">Product Photos</h2>
             </div>

             <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((url, i) => (
                   <div key={i} className="relative flex-shrink-0 w-24 h-24 rounded-xl border border-border bg-surface-2 overflow-hidden group">
                      <img src={url} alt={`img-${i}`} className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => handleRemoveImage(i)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center active:scale-90 transition-all opacity-0 group-hover:opacity-100"
                      >
                         <X size={14} />
                      </button>
                      {i === 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-[8px] font-bold text-primary-fg text-center py-0.5">MAIN</div>
                      )}
                   </div>
                ))}
                {images.length < 5 && (
                   <div className="flex-shrink-0 w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted/30">
                      <Smartphone size={32} />
                   </div>
                )}
             </div>

             <div className="flex gap-2">
               <input
                 type="text"
                 value={newImageUrl}
                 onChange={(e) => setNewImageUrl(e.target.value)}
                 placeholder="Paste image URL here..."
                 className="flex-1 h-11 bg-surface-2 border border-border rounded-xl px-4 text-sm focus:border-primary/50 outline-none"
               />
               <button 
                 type="button"
                 onClick={handleAddImage}
                 className="h-11 px-4 bg-primary text-primary-fg font-bold rounded-xl active:scale-95 transition-transform"
               >
                 Add
               </button>
             </div>
             <p className="text-[10px] text-muted text-center pt-2">Max 5 images. Pro Tip: Use direct links from Imgur or PostImages.</p>
          </section>

          {/* Section: Description */}
          <section className="bg-surface rounded-2xl border border-border p-5 space-y-4">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider ml-1">Additional description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about the product like 'Very clean', 'Slight scratch near camera', etc."
              rows={3}
              className="w-full bg-surface-2 border border-border rounded-xl p-4 text-sm focus:border-primary/50 outline-none resize-none"
            />
          </section>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400">
               <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
               <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full h-14 rounded-2xl flex items-center justify-center gap-2 font-bold text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98] ${
              isSubmitting ? 'bg-muted cursor-not-allowed' : 'bg-primary text-primary-fg'
            }`}
          >
            {isSubmitting ? (
              <div className="w-6 h-6 border-2 border-primary-fg/30 border-t-primary-fg rounded-full animate-spin" />
            ) : (
              <>
                {editId ? <Save size={20} /> : <Plus size={20} />}
                {editId ? 'Update Product' : 'Create Product'}
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
