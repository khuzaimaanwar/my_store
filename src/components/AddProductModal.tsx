import React, { useState, useEffect } from 'react';
import { Product, CategoryType, CATEGORIES } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Boxes, X, AlertTriangle, Percent, Sparkles, Check } from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: {
    name: string;
    brand?: string;
    category: CategoryType;
    quantity: number;
    purchasePrice: number;
    sellingPrice: number;
    lowStockThreshold: number;
    partNumber?: string;
  }) => void;
  productToEdit?: Product | null;
}

// Popular quick presets for Pakistani auto spare parts shops
const POPULAR_PART_PRESETS: Array<{
  name: string;
  category: CategoryType;
  typicalBrand?: string;
  typicalCost?: number;
  typicalSell?: number;
}> = [
  { name: 'Oil Filter', category: 'Filters', typicalBrand: 'Guard', typicalCost: 850, typicalSell: 1200 },
  { name: 'Air Filter', category: 'Filters', typicalBrand: 'Guard', typicalCost: 1100, typicalSell: 1500 },
  { name: 'Front Brake Pads Set', category: 'Brakes', typicalBrand: 'MK Kashiyama', typicalCost: 3500, typicalSell: 4800 },
  { name: 'Rear Brake Shoes', category: 'Brakes', typicalBrand: 'Asahi', typicalCost: 2800, typicalSell: 3900 },
  { name: 'Spark Plugs (Set of 4)', category: 'Electrical', typicalBrand: 'NGK', typicalCost: 2400, typicalSell: 3400 },
  { name: 'Alternator Fan Belt', category: 'Engine', typicalBrand: 'Bando', typicalCost: 1400, typicalSell: 2100 },
  { name: 'Clutch Disc Plate', category: 'Transmission', typicalBrand: 'AISIN', typicalCost: 8500, typicalSell: 11500 },
  { name: 'Front Shock Absorber', category: 'Suspension', typicalBrand: 'KYB', typicalCost: 9500, typicalSell: 13000 },
  { name: 'Fuel Filter', category: 'Filters', typicalBrand: 'Toyota Genuine', typicalCost: 1800, typicalSell: 2600 },
  { name: 'Headlight Halogen Bulb H4', category: 'Electrical', typicalBrand: 'Osram', typicalCost: 650, typicalSell: 950 },
];

const QUICK_BRANDS = [
  'Toyota Genuine',
  'Honda Genuine',
  'Suzuki Genuine',
  'Bosch',
  'Denso',
  'Guard',
  'NGK',
  'MK Kashiyama',
  'AISIN',
];

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
}) => {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<CategoryType>('Engine');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [partNumber, setPartNumber] = useState('');
  const [formError, setFormError] = useState('');

  // Sync form data when modal opens or editing changes
  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setName(productToEdit.name);
        setBrand(productToEdit.brand || '');
        setCategory(productToEdit.category);
        setQuantity(String(productToEdit.quantity));
        setPurchasePrice(String(productToEdit.purchasePrice));
        setSellingPrice(String(productToEdit.sellingPrice));
        setLowStockThreshold(String(productToEdit.lowStockThreshold));
        setPartNumber(productToEdit.partNumber || '');
      } else {
        setName('');
        setBrand('');
        setCategory('Engine');
        setQuantity('');
        setPurchasePrice('');
        setSellingPrice('');
        setLowStockThreshold('5');
        setPartNumber('');
      }
      setFormError('');
    }
  }, [isOpen, productToEdit]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Apply a quick preset
  const handleApplyPreset = (preset: typeof POPULAR_PART_PRESETS[0]) => {
    setName(preset.name);
    setCategory(preset.category);
    if (preset.typicalBrand && !brand) setBrand(preset.typicalBrand);
    if (preset.typicalCost && !purchasePrice) setPurchasePrice(String(preset.typicalCost));
    if (preset.typicalSell && !sellingPrice) setSellingPrice(String(preset.typicalSell));
    if (!quantity) setQuantity('10');
  };

  const costNum = parseFloat(purchasePrice) || 0;
  const sellNum = parseFloat(sellingPrice) || 0;
  const profitPerPiece = sellNum - costNum;
  const profitMarginPct = sellNum > 0 ? Math.round((profitPerPiece / sellNum) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Please enter the spare part product name.');
      return;
    }

    const qty = parseInt(quantity, 10);
    const purchase = parseFloat(purchasePrice);
    const selling = parseFloat(sellingPrice);
    const threshold = parseInt(lowStockThreshold, 10);

    if (isNaN(qty) || qty < 0) {
      setFormError('Please enter a valid stock quantity (0 or greater).');
      return;
    }

    if (isNaN(purchase) || purchase < 0) {
      setFormError('Please enter a valid purchase cost price in Rs.');
      return;
    }

    if (isNaN(selling) || selling < 0) {
      setFormError('Please enter a valid selling price in Rs.');
      return;
    }

    onSave({
      name: name.trim(),
      brand: brand.trim() || undefined,
      category,
      quantity: qty,
      purchasePrice: purchase,
      sellingPrice: selling,
      lowStockThreshold: isNaN(threshold) ? 5 : threshold,
      partNumber: partNumber.trim() || undefined,
    });
  };

  return (
    <div
      id="add-part-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="add-part-modal-content"
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 transition-all"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {productToEdit ? 'Edit Spare Part Details' : 'Add Auto Spare Part to Stock'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {productToEdit
                  ? 'Update cost, selling price, or inventory count.'
                  : 'Enter part information to track in inventory and sell on invoices.'}
              </p>
            </div>
          </div>
          <button
            id="close-add-part-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets (Only in Add mode) */}
        {!productToEdit && (
          <div className="px-6 pt-4 pb-2 bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Quick Auto-Fill Common Parts:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pb-1">
              {POPULAR_PART_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    name === preset.name
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div
              id="add-part-error-banner"
              className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Part Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Spare Part Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="part-name-input"
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Front Brake Disc Rotor / Oil Filter"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Brand & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Brand / Manufacturer (Optional)
              </label>
              <input
                id="part-brand-input"
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Toyota Genuine, Bosch"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
              {/* Quick brand chips */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {QUICK_BRANDS.slice(0, 5).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBrand(b)}
                    className="text-[10px] text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                id="part-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantity & Low Stock Threshold */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Stock Quantity (Pieces) <span className="text-rose-500">*</span>
              </label>
              <input
                id="part-quantity-input"
                type="number"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 25"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Low Stock Alert (Pieces)
              </label>
              <input
                id="part-threshold-input"
                type="number"
                min="1"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                placeholder="e.g. 5"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
              />
              <span className="text-[10px] text-slate-400">
                Triggers warning when stock drops to or below this.
              </span>
            </div>
          </div>

          {/* Purchase Price & Selling Price (PKR) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Purchase Price (Cost / piece) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rs</span>
                <input
                  id="part-purchase-price-input"
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="3500"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Selling Price (Rate / piece) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rs</span>
                <input
                  id="part-selling-price-input"
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  placeholder="4800"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Live Profit Margin Preview */}
          {sellNum > 0 && (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-emerald-900 font-semibold">
                <Percent className="w-3.5 h-3.5 text-emerald-600" />
                <span>Estimated Profit Per Piece:</span>
              </div>
              <div className="text-right">
                <span className="font-black text-emerald-700">{formatCurrency(profitPerPiece)}</span>
                <span className="text-[11px] text-emerald-800 ml-1.5 font-bold">
                  ({profitMarginPct}% margin)
                </span>
              </div>
            </div>
          )}

          {/* OEM / Part Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Part Number / OEM Code (Optional)
            </label>
            <input
              id="part-oem-input"
              type="text"
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
              placeholder="e.g. 04465-02220 or BRK-401"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              id="cancel-add-part-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-add-part-btn"
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{productToEdit ? 'Save Changes' : 'Add to Inventory'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
