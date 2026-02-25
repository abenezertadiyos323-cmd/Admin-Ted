import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Camera, Archive, RotateCcw, ChevronDown } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import { getProductById, createProduct, updateProduct, archiveProduct, restoreProduct } from '../lib/api';
import { getTelegramUser } from '../lib/telegram';
import { formatETB, getStockStatus } from '../lib/utils';
import type { Product, Brand, Condition, ProductType } from '../types';

const BRANDS: Brand[] = ['iPhone', 'Samsung', 'Tecno', 'Infinix', 'Xiaomi', 'Oppo', 'Other'];
const CONDITIONS: Condition[] = ['Excellent', 'Good', 'Fair', 'Poor'];
const CONDITION_DESCRIPTIONS: Record<Condition, string> = {
  Excellent: 'Like new, no scratches',
  Good: 'Minor wear, fully functional',
  Fair: 'Visible wear, all features work',
  Poor: 'Heavy wear or minor issues',
};

interface FormData {
  type: ProductType;
  brand: Brand;
  model: string;
  ram: string;
  storage: string;
  condition: Condition | '';
  price: string;
  stockQuantity: string;
  exchangeEnabled: boolean;
  description: string;
}

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);
  const defaultType = (searchParams.get('type') as ProductType) || 'phone';

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<FormData>({
    type: defaultType,
    brand: 'iPhone',
    model: '',
    ram: '',
    storage: '',
    condition: '',
    price: '',
    stockQuantity: '1',
    exchangeEnabled: false,
    description: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const user = getTelegramUser();

  useEffect(() => {
    if (isEdit && id) {
      getProductById(id).then((p) => {
        if (p) {
          setProduct(p);
          setForm({
            type: p.type,
            brand: p.brand,
            model: p.model,
            ram: p.ram ?? '',
            storage: p.storage ?? '',
            condition: p.condition ?? '',
            price: String(p.price),
            stockQuantity: String(p.stockQuantity),
            exchangeEnabled: p.exchangeEnabled,
            description: p.description ?? '',
          });
        }
        setLoading(false);
      });
    }
  }, [id, isEdit]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.model.trim()) newErrors.model = 'Model is required';
    if (!form.price || Number(form.price) <= 0) newErrors.price = 'Valid price required';
    if (!form.stockQuantity || Number(form.stockQuantity) < 0) newErrors.stockQuantity = 'Valid quantity required';
    if (form.type === 'phone' && !form.storage) newErrors.storage = 'Storage required for phones';
    if (form.type === 'phone' && !form.condition) newErrors.condition = 'Condition required for phones';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const data = {
        type: form.type,
        brand: form.brand,
        model: form.model.trim(),
        ram: form.ram || undefined,
        storage: form.storage || undefined,
        condition: (form.condition as Condition) || undefined,
        price: Number(form.price),
        stockQuantity: Number(form.stockQuantity),
        exchangeEnabled: form.exchangeEnabled,
        description: form.description || undefined,
        images: product?.images ?? [],
        createdBy: String(user.id),
        updatedBy: String(user.id),
      };

      if (isEdit && id) {
        await updateProduct(id, data);
      } else {
        await createProduct(data);
      }
      navigate('/inventory');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!id) return;
    setSaving(true);
    await archiveProduct(id);
    navigate('/inventory');
  };

  const handleRestore = async () => {
    if (!id) return;
    setSaving(true);
    await restoreProduct(id);
    navigate('/inventory');
  };

  const update = (key: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const isPhone = form.type === 'phone';
  const stockStatus = getStockStatus(Number(form.stockQuantity) || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title={isEdit ? 'Edit Product' : `Add ${defaultType === 'phone' ? 'Phone' : 'Accessory'}`}
        showBack
        rightAction={
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl active:scale-95 transition-transform disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        }
      />

      <div className="px-4 py-4 space-y-4 pb-8">
        {/* Image Upload Placeholder */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Photos (up to 3)</p>
          <div className="flex gap-3">
            {[1, 2, 3].map((n) => {
              const img = product?.images?.find((i) => i.order === n);
              return (
                <div
                  key={n}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden relative"
                >
                  {img ? (
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={20} className="text-gray-300" />
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Image upload connects to Convex Storage</p>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Basic Info</p>

          {/* Type (only for new) */}
          {!isEdit && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Type</label>
              <div className="flex gap-2">
                {(['phone', 'accessory'] as ProductType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => update('type', t)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${
                      form.type === t
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Brand */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Brand</label>
            <div className="relative">
              <select
                value={form.brand}
                onChange={(e) => update('brand', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 appearance-none outline-none focus:ring-2 focus:ring-blue-500"
              >
                {BRANDS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Model */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Model *</label>
            <input
              type="text"
              value={form.model}
              onChange={(e) => update('model', e.target.value)}
              placeholder={isPhone ? 'e.g. iPhone 14 Pro' : 'e.g. AirPods Pro 2nd Gen'}
              className={`w-full bg-gray-50 border rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.model ? 'border-red-400 bg-red-50' : 'border-gray-200'
              }`}
            />
            {errors.model && <p className="text-xs text-red-500 mt-1">{errors.model}</p>}
          </div>

          {/* Phone-specific fields */}
          {isPhone && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">RAM</label>
                  <input
                    type="text"
                    value={form.ram}
                    onChange={(e) => update('ram', e.target.value)}
                    placeholder="e.g. 8GB"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">Storage *</label>
                  <input
                    type="text"
                    value={form.storage}
                    onChange={(e) => update('storage', e.target.value)}
                    placeholder="e.g. 256GB"
                    className={`w-full bg-gray-50 border rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.storage ? 'border-red-400 bg-red-50' : 'border-gray-200'
                    }`}
                  />
                  {errors.storage && <p className="text-xs text-red-500 mt-1">{errors.storage}</p>}
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">Condition *</label>
                <div className="grid grid-cols-2 gap-2">
                  {CONDITIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => update('condition', c)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        form.condition === c
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <p className={`text-xs font-semibold ${form.condition === c ? 'text-blue-700' : 'text-gray-700'}`}>{c}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{CONDITION_DESCRIPTIONS[c]}</p>
                    </button>
                  ))}
                </div>
                {errors.condition && <p className="text-xs text-red-500 mt-1">{errors.condition}</p>}
              </div>
            </>
          )}
        </div>

        {/* Pricing & Stock */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pricing & Stock</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Price (ETB) *</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => update('price', e.target.value)}
                placeholder="e.g. 85000"
                min="0"
                className={`w-full bg-gray-50 border rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.price ? 'border-red-400 bg-red-50' : 'border-gray-200'
                }`}
              />
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
              {form.price && Number(form.price) > 0 && (
                <p className="text-[11px] text-blue-600 mt-1">{formatETB(Number(form.price))}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Stock Qty *</label>
              <input
                type="number"
                value={form.stockQuantity}
                onChange={(e) => update('stockQuantity', e.target.value)}
                placeholder="e.g. 3"
                min="0"
                className={`w-full bg-gray-50 border rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.stockQuantity ? 'border-red-400 bg-red-50' : 'border-gray-200'
                }`}
              />
              {form.stockQuantity !== '' && (
                <p className={`text-[11px] mt-1 font-medium ${stockStatus.color}`}>
                  {stockStatus.label}
                </p>
              )}
            </div>
          </div>

          {/* Exchange Toggle */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-gray-800">Exchange Available</p>
              <p className="text-xs text-gray-400">Allow customers to trade-in for this phone</p>
            </div>
            <button
              onClick={() => update('exchangeEnabled', !form.exchangeEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                form.exchangeEnabled ? 'bg-green-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  form.exchangeEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Short summary about the product (color, accessories included, etc.)"
            rows={3}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Archive / Restore (Edit only) */}
        {isEdit && product && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Danger Zone</p>
            {product.archivedAt ? (
              <button
                onClick={handleRestore}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-green-500 text-green-600 font-semibold text-sm active:scale-95 transition-transform"
              >
                <RotateCcw size={16} />
                Restore Product
              </button>
            ) : (
              <button
                onClick={handleArchive}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-300 text-red-500 font-semibold text-sm active:scale-95 transition-transform"
              >
                <Archive size={16} />
                Archive Product
              </button>
            )}
            <p className="text-[11px] text-gray-400 mt-2 text-center">
              {product.archivedAt
                ? 'Restore to make product visible again'
                : 'Archived products are hidden from customers. Auto-deleted after 30 days.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
