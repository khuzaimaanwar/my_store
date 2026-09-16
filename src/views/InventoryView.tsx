import React, { useState, useMemo } from 'react';
import { Product, CategoryType, CATEGORIES } from '../types';
import { formatCurrency, formatNumber, getCategoryBadgeStyle } from '../utils/formatters';
import { AddProductModal } from '../components/AddProductModal';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle,
  ShoppingCart,
  PlusCircle,
  MinusCircle,
  X,
  PackageCheck,
  Percent,
} from 'lucide-react';

interface InventoryViewProps {
  products: Product[];
  onAddProduct: (productData: {
    name: string;
    brand?: string;
    category: CategoryType;
    quantity: number;
    purchasePrice: number;
    sellingPrice: number;
    lowStockThreshold: number;
    partNumber?: string;
  }) => void;
  onUpdateProduct: (
    productId: string,
    updates: Partial<Omit<Product, 'id' | 'userId' | 'createdAt'>>
  ) => void;
  onDeleteProduct: (productId: string) => void;
  onQuickAdjust: (productId: string, delta: number) => void;
  onQuickSell: (productId: string) => void;
  onOpenAddProduct?: () => void;
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onQuickAdjust,
  onQuickSell,
  onOpenAddProduct,
  isAddModalOpen = false,
  onCloseAddModal,
}) => {
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock-asc' | 'stock-desc' | 'price-desc'>('name');

  // Modal State
  const [isInternalAddOpen, setIsInternalAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const handleOpenAdd = () => {
    if (onOpenAddProduct) {
      onOpenAddProduct();
    } else {
      setIsInternalAddOpen(true);
    }
  };

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search term
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          !term ||
          p.name.toLowerCase().includes(term) ||
          (p.brand && p.brand.toLowerCase().includes(term)) ||
          (p.partNumber && p.partNumber.toLowerCase().includes(term));

        // Category filter
        const matchesCategory =
          selectedCategory === 'All' || p.category === selectedCategory;

        // Stock filter
        let matchesStock = true;
        if (stockFilter === 'low') {
          matchesStock = p.quantity <= p.lowStockThreshold && p.quantity > 0;
        } else if (stockFilter === 'out') {
          matchesStock = p.quantity === 0;
        }

        return matchesSearch && matchesCategory && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'stock-asc') return a.quantity - b.quantity;
        if (sortBy === 'stock-desc') return b.quantity - a.quantity;
        if (sortBy === 'price-desc') return b.sellingPrice - a.sellingPrice;
        return 0;
      });
  }, [products, searchTerm, selectedCategory, stockFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Top Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Product Inventory</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
              {products.length} Products
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage product stock, cost prices, selling rates, and low stock warnings.
          </p>
        </div>

        <button
          id="open-add-product-modal-btn"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              id="inventory-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by product name, brand/supplier, or SKU code..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Stock Condition */}
          <div className="sm:col-span-3">
            <select
              id="inventory-stock-filter"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Stock Statuses</option>
              <option value="low">⚠️ Low Stock Alerts Only</option>
              <option value="out">🛑 Out of Stock Only</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="sm:col-span-3">
            <select
              id="inventory-sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="name">Sort by Name (A-Z)</option>
              <option value="stock-asc">Lowest Stock First</option>
              <option value="stock-desc">Highest Stock First</option>
              <option value="price-desc">Highest Selling Price</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories ({products.length})
          </button>
          {Array.from(new Set([...CATEGORIES, ...products.map((p) => p.category)])).map((cat) => {
            const count = products.filter((p) => p.category === cat).length;
            if (count === 0 && selectedCategory !== cat) return null;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Inventory Products Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {products.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-4">
              <Boxes className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Your inventory is empty</h3>
            <p className="text-sm text-slate-600 mt-1.5 max-w-md mx-auto">
              Your inventory is empty. Click &lsquo;Add Product&rsquo; to add your first item.
            </p>
            <div className="mt-6">
              <button
                id="empty-inventory-add-product-btn"
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                <span>Add Product</span>
              </button>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-14 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No products found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No products match your current search or filter criteria.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
                setStockFilter('all');
              }}
              className="mt-4 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-semibold">Product & Brand</th>
                  <th className="py-3 px-3 font-semibold">Category</th>
                  <th className="py-3 px-3 font-semibold text-center">Stock In Hand</th>
                  <th className="py-3 px-3 font-semibold text-right">Cost Price</th>
                  <th className="py-3 px-3 font-semibold text-right">Selling Price</th>
                  <th className="py-3 px-3 font-semibold text-right">Est. Margin</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const isLow = p.quantity <= p.lowStockThreshold && p.quantity > 0;
                  const isOut = p.quantity === 0;
                  const marginAmt = p.sellingPrice - p.purchasePrice;
                  const marginPct =
                    p.sellingPrice > 0 ? Math.round((marginAmt / p.sellingPrice) * 100) : 0;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isOut
                          ? 'bg-rose-50/30'
                          : isLow
                          ? 'bg-amber-50/30'
                          : ''
                      }`}
                    >
                      {/* Product Name & Brand */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          {p.brand && (
                            <span className="font-medium text-slate-700">{p.brand}</span>
                          )}
                          {p.partNumber && (
                            <span className="font-mono text-slate-400">
                              #{p.partNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getCategoryBadgeStyle(
                            p.category
                          )}`}
                        >
                          {p.category}
                        </span>
                      </td>

                      {/* Stock with quick adjust buttons */}
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onQuickAdjust(p.id, -1)}
                            disabled={p.quantity <= 0}
                            title="Decrease stock by 1"
                            className="text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                          >
                            <MinusCircle className="w-4 h-4" />
                          </button>

                          <div className="text-center min-w-[50px]">
                            <span
                              className={`font-black text-sm block ${
                                isOut
                                  ? 'text-rose-600'
                                  : isLow
                                  ? 'text-amber-700'
                                  : 'text-slate-900'
                              }`}
                            >
                              {p.quantity}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              (Min: {p.lowStockThreshold})
                            </span>
                          </div>

                          <button
                            onClick={() => onQuickAdjust(p.id, 1)}
                            title="Increase stock by 1"
                            className="text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>
                        </div>
                        {isLow && (
                          <div className="text-center text-[10px] text-amber-700 font-bold mt-0.5">
                            Low Stock Alert
                          </div>
                        )}
                        {isOut && (
                          <div className="text-center text-[10px] text-rose-700 font-bold mt-0.5">
                            Out of Stock
                          </div>
                        )}
                      </td>

                      {/* Cost Price */}
                      <td className="py-3 px-3 text-right text-slate-600 font-medium">
                        {formatCurrency(p.purchasePrice)}
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-3 text-right font-black text-slate-900 text-sm">
                        {formatCurrency(p.sellingPrice)}
                      </td>

                      {/* Margin */}
                      <td className="py-3 px-3 text-right">
                        <div
                          className={`font-bold text-xs ${
                            marginAmt >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {marginAmt >= 0 ? `+${formatCurrency(marginAmt)}` : formatCurrency(marginAmt)}
                        </div>
                        <div className="text-[10px] text-slate-400">{marginPct}% profit</div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Sell */}
                          <button
                            id={`quick-sell-btn-${p.id}`}
                            onClick={() => onQuickSell(p.id)}
                            disabled={p.quantity <= 0}
                            title="Quick Sell This Part"
                            className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 disabled:pointer-events-none rounded-lg font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            <span>Sell</span>
                          </button>

                          {/* Edit */}
                          <button
                            id={`edit-product-btn-${p.id}`}
                            onClick={() => setEditingProduct(p)}
                            title="Edit Product"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            id={`delete-product-btn-${p.id}`}
                            onClick={() => setDeletingProduct(p)}
                            title="Delete Product"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT PRODUCT MODAL */}
      <AddProductModal
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        productToEdit={editingProduct}
        onSave={(data) => {
          if (editingProduct) {
            onUpdateProduct(editingProduct.id, data);
            setEditingProduct(null);
          }
        }}
      />

      {/* FALLBACK INTERNAL ADD MODAL */}
      <AddProductModal
        isOpen={isInternalAddOpen}
        onClose={() => setIsInternalAddOpen(false)}
        onSave={(data) => {
          onAddProduct(data);
          setIsInternalAddOpen(false);
        }}
      />

      {/* DELETE CONFIRMATION MODAL */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Product?</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to remove{' '}
              <strong className="text-slate-800">{deletingProduct.name}</strong> from your
              shop inventory? This action cannot be undone.
            </p>

            <div className="flex gap-2 justify-center mt-6">
              <button
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-product-btn"
                onClick={() => {
                  onDeleteProduct(deletingProduct.id);
                  setDeletingProduct(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm cursor-pointer"
              >
                Yes, Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
