import React, { useState, useEffect } from 'react';
import { Product, Sale, User } from '../types';
import { formatCurrency, formatDateTime, formatNumber } from '../utils/formatters';
import { StorageService } from '../services/storage';
import {
  Receipt,
  ShoppingCart,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Printer,
  FileText,
  User as UserIcon,
  Tag,
  Boxes,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface SalesViewProps {
  user: User;
  products: Product[];
  sales: Sale[];
  onRecordSale: (saleData: {
    productId: string;
    quantity: number;
    customerName?: string;
    customerPhone?: string;
    notes?: string;
  }) => { success: boolean; sale?: Sale; error?: string };
  onViewInvoice: (sale: Sale) => void;
  preselectedProductId?: string;
  onClearPreselectedProduct?: () => void;
  onOpenAddProduct?: () => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  user,
  products,
  sales,
  onRecordSale,
  onViewInvoice,
  preselectedProductId,
  onClearPreselectedProduct,
  onOpenAddProduct,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'new-sale' | 'history'>('new-sale');

  // New Sale Form State
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [customerName, setCustomerName] = useState<string>('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Search in product selector
  const [productSearch, setProductSearch] = useState('');

  // Status feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successSale, setSuccessSale] = useState<Sale | null>(null);

  // Sales History search
  const [historySearch, setHistorySearch] = useState('');

  // Handle preselected product from other views (e.g. Dashboard or Inventory)
  useEffect(() => {
    if (preselectedProductId) {
      setSelectedProductId(preselectedProductId);
      setActiveSubTab('new-sale');
      if (onClearPreselectedProduct) onClearPreselectedProduct();
    }
  }, [preselectedProductId, onClearPreselectedProduct]);

  // Set default product if none selected and products exist
  useEffect(() => {
    if (!selectedProductId && products.length > 0) {
      const inStock = products.find((p) => p.quantity > 0);
      if (inStock) {
        setSelectedProductId(inStock.id);
      } else {
        setSelectedProductId(products[0].id);
      }
    }
  }, [products, selectedProductId]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Auto-calculated fields
  const qtyNumber = parseInt(quantity, 10) || 0;
  const unitPrice = selectedProduct?.sellingPrice || 0;
  const unitCost = selectedProduct?.purchasePrice || 0;
  const totalAmount = unitPrice * qtyNumber;
  const estimatedProfit = (unitPrice - unitCost) * qtyNumber;
  const nextInvoiceNumber = StorageService.getNextInvoiceNumber(user.id);

  const handleSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessSale(null);

    if (!selectedProduct) {
      setErrorMsg('Please select a product to sell.');
      return;
    }

    if (qtyNumber <= 0) {
      setErrorMsg('Quantity must be 1 or greater.');
      return;
    }

    if (qtyNumber > selectedProduct.quantity) {
      setErrorMsg(
        `Insufficient stock! Only ${selectedProduct.quantity} units available in shop.`
      );
      return;
    }

    const result = onRecordSale({
      productId: selectedProduct.id,
      quantity: qtyNumber,
      customerName: customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    if (result.success && result.sale) {
      setSuccessSale(result.sale);
      setQuantity('1');
      setCustomerName('Walk-in Customer');
      setCustomerPhone('');
      setNotes('');
    } else {
      setErrorMsg(result.error || 'Failed to record sale.');
    }
  };

  // Filter products for dropdown/search
  const availableProducts = products.filter((p) => {
    if (!productSearch) return true;
    const term = productSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      (p.brand && p.brand.toLowerCase().includes(term)) ||
      (p.partNumber && p.partNumber.toLowerCase().includes(term))
    );
  });

  // Filtered sales history
  const filteredSales = sales.filter((s) => {
    if (!historySearch) return true;
    const term = historySearch.toLowerCase();
    return (
      s.invoiceNumber.toLowerCase().includes(term) ||
      s.customerName.toLowerCase().includes(term) ||
      s.productName.toLowerCase().includes(term) ||
      (s.customerPhone && s.customerPhone.includes(term))
    );
  });

  const totalHistoryRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalHistoryProfit = sales.reduce((acc, s) => acc + s.profit, 0);

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Sales & Invoicing</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Next: {nextInvoiceNumber}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record customer transactions, auto-generate invoices, and decrement stock.
          </p>
        </div>

        {/* View Switcher */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
          <button
            id="tab-new-sale"
            onClick={() => setActiveSubTab('new-sale')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'new-sale'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
            <span>New Sale Entry</span>
          </button>
          <button
            id="tab-sales-history"
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'history'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-blue-600" />
            <span>Invoices History ({sales.length})</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'new-sale' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Sale Entry Form (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-600" />
              <span>Record Auto Spare Part Sale</span>
            </h2>

            {/* Error banner */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success notification with instant print/view modal */}
            {successSale && (
              <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-emerald-900">
                      Sale recorded successfully! ({successSale.invoiceNumber})
                    </div>
                    <div className="text-[11px] text-emerald-700">
                      {successSale.quantity}x {successSale.productName} • Total:{' '}
                      <strong>{formatCurrency(successSale.totalAmount)}</strong>
                    </div>
                  </div>
                </div>

                <button
                  id="view-last-invoice-btn"
                  onClick={() => onViewInvoice(successSale)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
              </div>
            )}

            {products.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <Boxes className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-700">Your Inventory is Empty</h3>
                <p className="text-xs text-slate-500 mt-1">
                  You need to add spare parts to your shop inventory before you can record sales.
                </p>
                {onOpenAddProduct && (
                  <button
                    id="sales-empty-add-part-btn"
                    type="button"
                    onClick={onOpenAddProduct}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add First Spare Part</span>
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleSaleSubmit} className="space-y-4">
                {/* Product Search & Select */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Select Spare Part From Your Inventory <span className="text-rose-500">*</span>
                    </label>
                    {onOpenAddProduct && (
                      <button
                        id="sales-quick-add-part-btn"
                        type="button"
                        onClick={onOpenAddProduct}
                        className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add New Part</span>
                      </button>
                    )}
                  </div>

                  <select
                    id="sale-product-select"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  >
                    {products.map((p) => {
                      const isOutOfStock = p.quantity <= 0;
                      return (
                        <option
                          key={p.id}
                          value={p.id}
                          disabled={isOutOfStock}
                        >
                          {p.name} {p.brand ? `(${p.brand})` : ''} — Stock: {p.quantity} pcs —{' '}
                          {formatCurrency(p.sellingPrice)} {isOutOfStock ? '[OUT OF STOCK]' : ''}
                        </option>
                      );
                    })}
                  </select>

                  {/* Product Details Box */}
                  {selectedProduct && (
                    <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-800">
                          {selectedProduct.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {selectedProduct.brand ? `${selectedProduct.brand} • ` : ''}
                          {selectedProduct.category}
                          {selectedProduct.partNumber && ` • #${selectedProduct.partNumber}`}
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`font-black ${
                            selectedProduct.quantity <= selectedProduct.lowStockThreshold
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {selectedProduct.quantity} in stock
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Cost: {formatCurrency(selectedProduct.purchasePrice)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quantity Sold */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Quantity Sold (Pieces) <span className="text-rose-500">*</span>
                    </label>
                    {selectedProduct && (
                      <span className="text-[11px] text-slate-400">
                        Max available: {selectedProduct.quantity}
                      </span>
                    )}
                  </div>
                  <input
                    id="sale-quantity-input"
                    type="number"
                    min="1"
                    max={selectedProduct?.quantity || 9999}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
                  />
                </div>

                {/* Customer Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="sale-customer-name-input"
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Walk-in Customer or Ahmed Workshop"
                      className="w-full pl-9 pr-24 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setCustomerName('Walk-in Customer')}
                      className="absolute right-2 top-2 px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold rounded cursor-pointer"
                    >
                      Walk-in
                    </button>
                  </div>
                </div>

                {/* Customer Phone (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Phone / WhatsApp (Optional)
                  </label>
                  <input
                    id="sale-customer-phone-input"
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
                  />
                </div>

                {/* Notes (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Invoice Notes (Optional)
                  </label>
                  <input
                    id="sale-notes-input"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. For Honda Civic 2018 front repair"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                {/* Submit Action */}
                <button
                  id="submit-sale-btn"
                  type="submit"
                  disabled={!selectedProduct || selectedProduct.quantity <= 0}
                  className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>
                    Complete Sale — {formatCurrency(totalAmount)}
                  </span>
                </button>
              </form>
            )}
          </div>

          {/* Right: Live Calculation & Invoice Ticket Preview (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Live Calculation Summary
                </span>
                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  {nextInvoiceNumber}
                </span>
              </div>

              {/* Breakdown */}
              <div className="py-4 space-y-3 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Shop</span>
                  <span className="font-bold text-slate-900">{user.shopName}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Item</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                    {selectedProduct?.name || '—'}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Unit Selling Price</span>
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(unitPrice)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Quantity</span>
                  <span className="font-bold text-slate-900 font-mono">
                    × {qtyNumber || 0}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Customer</span>
                  <span className="font-medium text-slate-800">
                    {customerName || 'Walk-in Customer'}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-800">Total Customer Bill</span>
                  <span className="text-2xl font-black text-emerald-600">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-1 text-emerald-800 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Estimated Gross Profit:</span>
                  </div>
                  <span className="font-bold text-emerald-700">
                    +{formatCurrency(estimatedProfit)}
                  </span>
                </div>
              </div>
            </div>

            {/* Inventory impact notice */}
            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500">
              <span className="font-bold text-slate-700">Stock Sync Rule:</span> Confirming
              this sale will automatically decrement{' '}
              <strong className="text-slate-800">{qtyNumber} piece(s)</strong> of{' '}
              {selectedProduct?.name || 'this part'} from your shop stock.
            </div>
          </div>
        </div>
      ) : (
        /* INVOICES HISTORY SUBTAB */
        <div className="space-y-4">
          {/* Summary Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Total Invoices</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{sales.length}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Total Sales Value</span>
              <div className="text-xl font-bold text-blue-700 mt-1">
                {formatCurrency(totalHistoryRevenue)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Total Shop Profit</span>
              <div className="text-xl font-bold text-emerald-600 mt-1">
                {formatCurrency(totalHistoryProfit)}
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search sales by invoice # (e.g. INV-0001), customer, or part name..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Sales Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {sales.length === 0 ? (
              <div className="text-center py-16 px-6">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-700">No sales recorded yet</h3>
                <p className="text-xs text-slate-500 mt-1">
                  No sales recorded yet. Record your first sale to see data here.
                </p>
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400">
                No past sales match your query.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4 font-semibold">Invoice #</th>
                      <th className="py-3 px-4 font-semibold">Date & Time</th>
                      <th className="py-3 px-4 font-semibold">Customer</th>
                      <th className="py-3 px-4 font-semibold">Product Sold</th>
                      <th className="py-3 px-3 font-semibold text-center">Qty</th>
                      <th className="py-3 px-3 font-semibold text-right">Unit Price</th>
                      <th className="py-3 px-4 font-semibold text-right">Total (PKR)</th>
                      <th className="py-3 px-4 font-semibold text-right">Profit</th>
                      <th className="py-3 px-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSales.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {s.invoiceNumber}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {formatDateTime(s.date)}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {s.customerName}
                          {s.customerPhone && (
                            <span className="block text-[10px] text-slate-400 font-normal">
                              {s.customerPhone}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{s.productName}</div>
                          <div className="text-[10px] text-slate-400">
                            {s.productBrand ? `${s.productBrand} • ` : ''}
                            {s.category}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800">
                          {s.quantity}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-600">
                          {formatCurrency(s.sellingPrice)}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-emerald-600 text-sm">
                          {formatCurrency(s.totalAmount)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">
                          +{formatCurrency(s.profit)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => onViewInvoice(s)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Invoice</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
