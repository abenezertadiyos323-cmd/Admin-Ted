import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import {
  ArrowLeft,
  Camera,
  Loader2,
  Trash2,
  Plus,
  AlertCircle,
  Smartphone,
  Check,
  ChevronRight,
  ChevronLeft,
  Settings,
  History,
  Archive,
  RotateCcw
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { getTelegramUser } from '../lib/telegram';
import type { ProductType, Condition } from '../types';

const PRODUCT_TYPES: { key: ProductType; label: string; icon: string }[] = [
  { key: 'phone', label: 'Phone', icon: '📱' },
  { key: 'accessory', label: 'Accessory', icon: '🎧' },
];

const STORAGE_OPTIONS = ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB'] as const;
const CONDITION_OPTIONS: Condition[] = ['New', 'Like New', 'Excellent', 'Good', 'Fair', 'Poor'];

const RAM_OPTIONS = ['4GB', '6GB', '8GB', '12GB', '16GB', '24GB'];

// Predefined model suggestions for the "Quick Selection" tab
const IPHONE_MODELS = [
  "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
  "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14",
  "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13", "iPhone 13 mini",
  "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12", "iPhone 11",
];

const SAMSUNG_MODELS = [
  "Galaxy S24 Ultra", "Galaxy S24+", "Galaxy S24",
  "Galaxy S23 Ultra", "Galaxy S23+", "Galaxy S23",
  "Galaxy Z Fold 5", "Galaxy Z Flip 5",
  "Galaxy S22 Ultra", "Galaxy S21 Ultra",
];

const MODEL_PRESETS = [
  { label: 'iPhone', models: IPHONE_MODELS },
  { label: 'Samsung', models: SAMSUNG_MODELS }
];

interface Variant {
  storage: string;
  ram?: string;
  price: number;
  stock: number;
}

export default function ProductForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = getTelegramUser();
  const isEditing = !!id;

  const product = useQuery(api.products.getProductById, {
    productId: id as Id<'products'>,
  });

  const createProduct = useMutation(api.products.createProduct);
  const updateProduct = useMutation(api.products.updateProduct);
  const archiveProduct = useMutation(api.products.archiveProduct);
  const restoreProduct = useMutation(api.products.restoreProduct);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const [activeTab, setActiveTab] = useState<'info' | 'variants' | 'specs' | 'history'>('info');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [type, setType] = useState<ProductType>((searchParams.get('type') as ProductType) || 'phone');
  const [phoneType, setPhoneType] = useState('');
  const [brand, setBrand] = useState('Apple'); // Legacy safety
  const [condition, setCondition] = useState<Condition>('Excellent');
  const [description, setDescription] = useState('');
  const [exchangeEnabled, setExchangeEnabled] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  
  // Single Pricing (Legacy/Simple)
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('1');
  const [storage, setStorage] = useState('128GB');
  const [ram, setRam] = useState('8GB');

  // Variant Pricing (V2)
  const [useVariants, setUseVariants] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);

  // Specs
  const [batteryHealth, setBatteryHealth] = useState('');
  const [screenSize, setScreenSize] = useState('');
  const [color, setColor] = useState('');
  const [simType, setSimType] = useState('Physical + eSIM');

  // Quick Select
  const [showQuickSelect, setShowQuickSelect] = useState(false);
  const [quickSelectBrand, setQuickSelectBrand] = useState(0);

  useEffect(() => {
    if (product) {
      setType(product.type);
      setPhoneType(product.phoneType || '');
      setCondition(product.condition || 'Excellent');
      setDescription(product.description || '');
      setExchangeEnabled(product.exchangeEnabled);
      setImages(product.images || []);
      setPrice(product.price.toString());
      setStockQuantity(product.stockQuantity.toString());
      setStorage(product.storage || '128GB');
      setRam(product.ram || '8GB');
      
      if (product.variants && product.variants.length > 0) {
        setUseVariants(true);
        setVariants(product.variants);
      }

      setBatteryHealth(product.batteryHealth || '');
      setScreenSize(product.screenSize || '');
      setColor(product.color || '');
      setSimType(product.simType || 'Physical + eSIM');
    }
  }, [product]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const newImages = [...images];
      for (let i = 0; i < files.length; i++) {
        if (newImages.length >= 3) break;
        
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": files[i].type },
          body: files[i],
        });
        const { storageId } = await result.json();
        
        // In this architecture, we use direct URLs from the storage helper
        // but for simplicity in this bite-sized form, we'll store storageId 
        // and the backend normalizer will resolve it. 
        // Actually, let's keep it consistent with Micky Mobile which often 
        // just pushes the storageId or resolved URL.
        newImages.push(storageId);
      }
      setImages(newImages);
    } catch (err) {
      console.error(err);
      setError("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const addVariant = () => {
    setVariants([...variants, { storage: '128GB', ram: '8GB', price: 0, stock: 1 }]);
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneType) {
      setError("Product name/model is required");
      return;
    }

    setLoading(true);
    setError(null);

    const commonData = {
      type,
      phoneType,
      condition,
      description,
      exchangeEnabled,
      images,
      updatedBy: user.first_name,
      batteryHealth,
      screenSize,
      color,
      simType,
    };

    try {
      if (isEditing) {
        await updateProduct({
          productId: id as Id<'products'>,
          ...commonData,
          price: parseFloat(price) || 0,
          stockQuantity: parseInt(stockQuantity) || 0,
          storage,
          ram,
          variants: useVariants ? variants : undefined,
        });
      } else {
        await createProduct({
          ...commonData,
          price: parseFloat(price) || 0,
          stockQuantity: parseInt(stockQuantity) || 0,
          storage,
          ram,
          variants: useVariants ? variants : undefined,
          createdBy: user.first_name,
          sellerId: 'tedytech', // Hardcoded for this admin instance
        });
      }
      navigate('/inventory');
    } catch (err) {
      console.error(err);
      setError("Failed to save product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!id) return;
    if (!confirm("Are you sure you want to archive this product?")) return;
    try {
      await archiveProduct({ productId: id as Id<'products'> });
      navigate('/inventory');
    } catch (err) {
      setError("Failed to archive product");
    }
  };

  const handleRestore = async () => {
    if (!id) return;
    try {
      await restoreProduct({ productId: id as Id<'products'> });
      navigate('/inventory?filter=all');
    } catch (err) {
      setError("Failed to restore product");
    }
  };

  const selectPresetModel = (model: string) => {
    setPhoneType(model);
    setShowQuickSelect(false);
  };

  if (isEditing && product === undefined) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-24">
      <PageHeader 
        title={isEditing ? 'Edit Product' : 'Add Product'} 
        backTo="/inventory"
        action={
          isEditing && !product?.isArchived ? (
            <button onClick={handleArchive} className="text-red-500 p-2">
              <Archive size={20} />
            </button>
          ) : isEditing && product?.isArchived ? (
            <button onClick={handleRestore} className="text-green-500 p-2">
              <RotateCcw size={20} />
            </button>
          ) : null
        }
      />

      {/* Tabs */}
      <div className="flex bg-surface sticky top-0 z-10 border-b border-border">
        <button 
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${activeTab === 'info' ? 'text-primary border-b-2 border-primary' : 'text-muted'}`}
        >
          < स्मार्टफोन size={16} /> Info
        </button>
        <button 
          onClick={() => setActiveTab('variants')}
          className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${activeTab === 'variants' ? 'text-primary border-b-2 border-primary' : 'text-muted'}`}
        >
          <Plus size={16} /> Variants
        </button>
        <button 
          onClick={() => setActiveTab('specs')}
          className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${activeTab === 'specs' ? 'text-primary border-b-2 border-primary' : 'text-muted'}`}
        >
          <Settings size={16} /> Specs
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-2 text-red-500 text-sm">
            <AlertCircle size={18} className="flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Section: Basic Info */}
        {activeTab === 'info' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Type Toggle */}
            <div className="flex bg-surface-2 p-1 rounded-xl border border-border">
              {PRODUCT_TYPES.map((pt) => (
                <button
                  key={pt.key}
                  type="button"
                  onClick={() => setType(pt.key)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === pt.key ? 'bg-primary text-primary-fg shadow-sm' : 'text-muted'}`}
                >
                  {pt.icon} {pt.label}
                </button>
              ))}
            </div>

            {/* Images */}
            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Photos (Max 3)</label>
              <div className="flex gap-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-border bg-surface-2">
                    <img src={img.startsWith('http') ? img : `https://fastidious-schnauzer-265.convex.cloud/api/storage/${img}`} className="w-full h-full object-cover" alt="" />
                    <button 
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {images.length < 3 && (
                  <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted active:scale-95 transition-transform cursor-pointer">
                    {uploading ? <Loader2 className="animate-spin" size={20} /> : <Camera size={24} />}
                    <span className="text-[10px] mt-1 font-bold">Add Photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} multiple />
                  </label>
                )}
              </div>
            </div>

            {/* Model Name */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Model Name</label>
                {type === 'phone' && (
                  <button 
                    type="button"
                    onClick={() => setShowQuickSelect(true)}
                    className="text-xs font-bold text-primary active:opacity-60"
                  >
                    Quick Select
                  </button>
                )}
              </div>
              <input 
                type="text"
                value={phoneType}
                onChange={(e) => setPhoneType(e.target.value)}
                placeholder={type === 'phone' ? "e.g. iPhone 15 Pro" : "e.g. AirPods Pro"}
                className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
              />
            </div>

            {/* Pricing Mode Toggle */}
            {type === 'phone' && (
              <div 
                className={`p-4 rounded-xl border transition-colors ${useVariants ? 'border-primary bg-primary/5' : 'border-border bg-surface-2'}`}
                onClick={() => setUseVariants(!useVariants)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold">Use Multi-Variant Pricing</h3>
                    <p className="text-[11px] text-muted">Set different prices for storage sizes (e.g. 128GB vs 256GB)</p>
                  </div>
                  <div className={`w-10 h-6 rounded-full relative transition-colors ${useVariants ? 'bg-primary' : 'bg-muted/20'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${useVariants ? 'right-1' : 'left-1'}`} />
                  </div>
                </div>
              </div>
            )}

            {!useVariants ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Price (ETB)</label>
                  <input 
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Stock</label>
                  <input 
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    placeholder="0"
                    className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 bg-surface-2 border border-border rounded-xl flex items-center justify-between">
                <span className="text-sm font-semibold">{variants.length} variant(s) configured</span>
                <button type="button" onClick={() => setActiveTab('variants')} className="text-xs font-bold text-primary">Edit Variants</button>
              </div>
            )}

            {/* Simple storage/ram if no variants */}
            {!useVariants && type === 'phone' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Storage</label>
                  <select 
                    value={storage}
                    onChange={(e) => setStorage(e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm outline-none"
                  >
                    {STORAGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">RAM</label>
                  <select 
                    value={ram}
                    onChange={(e) => setRam(e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm outline-none"
                  >
                    {RAM_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Condition */}
            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Condition</label>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {CONDITION_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setCondition(opt)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all ${condition === opt ? 'bg-primary border-primary text-primary-fg' : 'bg-surface-2 border-border text-muted'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Exchange Toggle */}
            {type === 'phone' && (
              <button
                type="button"
                onClick={() => setExchangeEnabled(!exchangeEnabled)}
                className={`w-full p-4 rounded-xl border flex items-center justify-between transition-colors ${exchangeEnabled ? 'border-primary/30 bg-primary/5' : 'border-border bg-surface-2'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${exchangeEnabled ? 'bg-primary text-primary-fg' : 'bg-surface-2 text-muted'}`}>
                    <RotateCcw size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">Accept Exchanges</p>
                    <p className="text-[11px] text-muted">Customers can trade-in for this model</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${exchangeEnabled ? 'border-primary bg-primary' : 'border-border'}`}>
                  {exchangeEnabled && <Check size={12} className="text-primary-fg" />}
                </div>
              </button>
            )}
          </div>
        )}

        {/* Section: Variants Management */}
        {activeTab === 'variants' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-muted uppercase">Configuration</h3>
              <button 
                type="button" 
                onClick={addVariant}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-fg rounded-lg text-xs font-bold active:scale-95"
              >
                <Plus size={14} /> Add Variant
              </button>
            </div>

            {variants.length === 0 ? (
              <div className="py-12 text-center bg-surface-2 rounded-2xl border border-dashed border-border">
                <p className="text-sm text-muted">No variants added yet</p>
                <button type="button" onClick={addVariant} className="text-xs font-bold text-primary mt-2">Create first variant</button>
              </div>
            ) : (
              <div className="space-y-3">
                {variants.map((v, i) => (
                  <div key={i} className="p-4 bg-surface p-4 rounded-2xl border border-border relative">
                    <button 
                      type="button" 
                      onClick={() => removeVariant(i)}
                      className="absolute top-4 right-4 text-muted hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-muted uppercase mb-1">Storage</label>
                        <select 
                          value={v.storage}
                          onChange={(e) => updateVariant(i, 'storage', e.target.value)}
                          className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs outline-none"
                        >
                          {STORAGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-muted uppercase mb-1">RAM</label>
                        <select 
                          value={v.ram}
                          onChange={(e) => updateVariant(i, 'ram', e.target.value)}
                          className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs outline-none"
                        >
                          {RAM_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-muted uppercase mb-1">Price (ETB)</label>
                        <input 
                          type="number"
                          value={v.price || ''}
                          onChange={(e) => updateVariant(i, 'price', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-muted uppercase mb-1">Stock</label>
                        <input 
                          type="number"
                          value={v.stock || ''}
                          onChange={(e) => updateVariant(i, 'stock', parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
              <p className="text-[11px] text-blue-400 leading-relaxed">
                <span className="font-bold">Tip:</span> Variants allow customers to choose their preferred storage size directly in the app. The "General Stock" and "General Price" will be automatically derived from these variants.
              </p>
            </div>
          </div>
        )}

        {/* Section: Extra Specs */}
        {activeTab === 'specs' && (
          <div className="space-y-4 animate-in fade-in duration-300">
             <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Description / Notes</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details about scratches, repairs, or included accessories..."
                rows={4}
                className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Battery Health</label>
                <input 
                  type="text"
                  value={batteryHealth}
                  onChange={(e) => setBatteryHealth(e.target.value)}
                  placeholder="e.g. 92% or 100%"
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Screen Size</label>
                <input 
                  type="text"
                  value={screenSize}
                  onChange={(e) => setScreenSize(e.target.value)}
                  placeholder='e.g. 6.7"'
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Color</label>
                <input 
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g. Natural Titanium"
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">SIM Type</label>
                <select 
                  value={simType}
                  onChange={(e) => setSimType(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm outline-none"
                >
                  <option value="Physical SIM">Physical SIM</option>
                  <option value="eSIM Only">eSIM Only</option>
                  <option value="Physical + eSIM">Physical + eSIM</option>
                  <option value="Dual Physical SIM">Dual Physical SIM</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Footer sticky button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-bg border-t border-border flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/inventory')}
            className="flex-1 py-3.5 px-4 rounded-xl border border-border text-muted font-bold active:scale-95 transition-transform"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !phoneType}
            className="flex-[2] py-3.5 px-4 rounded-xl bg-primary text-primary-fg font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
            {isEditing ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </form>

      {/* Quick Select Modal */}
      {showQuickSelect && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-0">
          <div className="w-full max-w-lg bg-surface rounded-t-3xl p-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Quick Select Model</h2>
              <button onClick={() => setShowQuickSelect(false)} className="p-2 text-muted">
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              {MODEL_PRESETS.map((preset, idx) => (
                <button
                  key={preset.label}
                  onClick={() => setQuickSelectBrand(idx)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${quickSelectBrand === idx ? 'bg-primary border-primary text-primary-fg' : 'bg-surface-2 border-border text-muted'}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto pr-2">
              {MODEL_PRESETS[quickSelectBrand].models.map(model => (
                <button
                  key={model}
                  type="button"
                  onClick={() => selectPresetModel(model)}
                  className="px-4 py-3 rounded-xl border border-border text-xs font-semibold text-left active:bg-primary active:text-primary-fg transition-colors"
                >
                  {model}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowQuickSelect(false)}
              className="w-full mt-6 py-4 rounded-xl font-bold bg-surface-2 text-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
