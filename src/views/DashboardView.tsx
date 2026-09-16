import React from 'react';
import { Product, Sale, User, ViewTab } from '../types';
import {
  calculateDashboardStats,
  getLowStockProducts,
  calculateLast7DaysSales,
  calculateStockByCategory,
  calculateTopSellingParts,
} from '../utils/analytics';
import { formatCurrency, formatNumber, formatDateTime, getCategoryBadgeStyle } from '../utils/formatters';
import { SalesChart } from '../components/charts/SalesChart';
import { CategoryPieChart } from '../components/charts/CategoryPieChart';
import {
  Boxes,
  Layers,
  Banknote,
  ShoppingCart,
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  PlusCircle,
  FileText,
  Clock,
  Sparkles,
  Award,
} from 'lucide-react';

interface DashboardViewProps {
  user: User;
  products: Product[];
  sales: Sale[];
  onNavigate: (tab: ViewTab) => void;
  onOpenNewSale: (preselectedProductId?: string) => void;
  onOpenAddProduct: () => void;
  onViewInvoice: (sale: Sale) => void;
  onRestockProduct: (product: Product) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  products,
  sales,
  onNavigate,
  onOpenNewSale,
  onOpenAddProduct,
  onViewInvoice,
  onRestockProduct,
}) => {
  const stats = calculateDashboardStats(products, sales);
  const lowStockItems = getLowStockProducts(products);
  const last7DaysData = calculateLast7DaysSales(sales);
  const categoryData = calculateStockByCategory(products);
  const topSellingParts = calculateTopSellingParts(products, sales);
  const recentSales = sales.slice(0, 6);

  // Profit margin percentage for this month
  const monthProfitMargin =
    stats.monthRevenue > 0
      ? Math.round((stats.monthProfit / stats.monthRevenue) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Friendly Empty State Banner when user has no products yet */}
      {products.length === 0 && (
        <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Welcome! Add your first product to get started.
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Your shop starts completely fresh. Add products to begin tracking inventory, stock values, and invoices.
              </p>
            </div>
          </div>
          <button
            id="dash-empty-add-first-product-btn"
            onClick={onOpenAddProduct}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Your First Product</span>
          </button>
        </div>
      )}

      {/* Top Shop Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              Live Shop Dashboard
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">
              {new Date().toLocaleDateString('en-PK', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            {user.shopName}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Welcome back, <span className="font-semibold text-slate-700">{user.fullName}</span>.
            Here is your live inventory performance.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="dash-add-part-btn"
            onClick={onOpenAddProduct}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-slate-600" />
            <span>Add Product</span>
          </button>
          <button
            id="dash-new-sale-btn"
            onClick={() => onOpenNewSale()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Record Sale</span>
          </button>
        </div>
      </div>

      {/* 4 Core Primary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Total Items */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Items
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {formatNumber(stats.totalItems)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Unique part catalog</div>
          </div>
        </div>

        {/* Card 2: Stock Quantity */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Stock Quantity
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {formatNumber(stats.stockQuantity)} pcs
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Total units on shelf</div>
          </div>
        </div>

        {/* Card 3: Stock Value */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Stock Value
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate" title={formatCurrency(stats.stockValue)}>
              {formatCurrency(stats.stockValue)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">At purchase cost</div>
          </div>
        </div>

        {/* Card 4: Items Sold Total */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Items Sold
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
              {formatNumber(stats.itemsSoldTotal)} pcs
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Total units sold</div>
          </div>
        </div>
      </div>

      {/* 3 Performance & Revenue Metrics (Today's Sales, Month Revenue, Month Profit) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Today's Sales
              </span>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {stats.todayTransactionsCount} {stats.todayTransactionsCount === 1 ? 'order' : 'orders'}
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {formatCurrency(stats.todaySalesAmount)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Collected today in cash/sales
            </div>
          </div>
        </div>

        {/* Month Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Month Revenue
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-400">This Month</span>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-blue-700 tracking-tight">
              {formatCurrency(stats.monthRevenue)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Gross sales revenue this month
            </div>
          </div>
        </div>

        {/* Month Profit */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                Month Profit
              </span>
            </div>
            {monthProfitMargin > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {monthProfitMargin}% Margin
              </span>
            )}
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
              {formatCurrency(stats.monthProfit)}
            </div>
            <div className="text-xs text-emerald-800/80 mt-1 font-medium">
              Net gross margin (Selling − Cost)
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: Low Stock Alerts */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                lowStockItems.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {lowStockItems.length > 0 ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900">Low Stock Alerts</h2>
          </div>

          {lowStockItems.length > 0 && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800">
              {lowStockItems.length} {lowStockItems.length === 1 ? 'Item Needs Restock' : 'Items Need Restock'}
            </span>
          )}
        </div>

        {/* IF NO PRODUCTS: show "No products in inventory yet." */}
        {products.length === 0 ? (
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">
                No products in inventory yet.
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Once you add products to your inventory, items falling below their low-stock threshold will alert you here.
              </p>
            </div>
          </div>
        ) : lowStockItems.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900">
                All items sufficiently stocked. Great job!
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Every product in your shop has quantity above its configured low-stock threshold.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 flex items-center justify-between gap-3 hover:bg-rose-50 transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-900 truncate">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    {item.brand ? `${item.brand} • ` : ''}
                    {item.category}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                      Only {item.quantity} left
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Alert at &lt;{item.lowStockThreshold}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button
                    onClick={() => onRestockProduct(item)}
                    className="px-2.5 py-1 text-[11px] font-bold bg-white text-rose-700 border border-rose-300 rounded-lg hover:bg-rose-100 shadow-2xs cursor-pointer"
                  >
                    + Restock
                  </button>
                  <button
                    onClick={() => onOpenNewSale(item.id)}
                    className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer"
                  >
                    Sell
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Charts Grid: Last 7 Days Sales & Stock Value by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales — Last 7 Days (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Sales — Last 7 Days</h3>
              <p className="text-xs text-slate-500">
                Daily comparison of customer revenue and shop gross profit
              </p>
            </div>
          </div>

          <SalesChart data={last7DaysData} />
        </div>

        {/* Stock Value by Category (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Stock Value by Category</h3>
            <p className="text-xs text-slate-500 mb-3">
              Total capital invested across product categories
            </p>
          </div>

          <CategoryPieChart data={categoryData} />
        </div>
      </div>

      {/* Bottom Section: Top Selling Products & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Selling Products (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Top Selling Products</h3>
            </div>
            <span className="text-xs text-slate-400">Best 5</span>
          </div>

          {topSellingParts.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No sales recorded yet
            </div>
          ) : (
            <div className="space-y-3">
              {topSellingParts.map((item, idx) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-100"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                        idx === 0
                          ? 'bg-amber-400 text-amber-950 shadow-xs'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-800'
                          : idx === 2
                          ? 'bg-amber-700/20 text-amber-900'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 truncate">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {item.brand ? `${item.brand} • ` : ''}
                        {item.category}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-bold text-emerald-600">
                      {formatCurrency(item.revenue)}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {item.quantitySold} pcs sold
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sales (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Recent Sales</h3>
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentSales.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No sales recorded yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-semibold">
                    <th className="text-left pb-2 font-semibold">Invoice #</th>
                    <th className="text-left pb-2 font-semibold">Customer</th>
                    <th className="text-left pb-2 font-semibold">Item & Qty</th>
                    <th className="text-right pb-2 font-semibold">Total (PKR)</th>
                    <th className="text-right pb-2 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 font-mono font-bold text-slate-800">
                        {sale.invoiceNumber}
                      </td>
                      <td className="py-2.5 text-slate-700 font-medium">
                        {sale.customerName}
                      </td>
                      <td className="py-2.5 text-slate-600">
                        <span className="font-semibold text-slate-800">{sale.productName}</span>
                        <span className="text-slate-400 ml-1">× {sale.quantity}</span>
                      </td>
                      <td className="py-2.5 text-right font-black text-emerald-600">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => onViewInvoice(sale)}
                          className="px-2 py-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer transition-colors"
                        >
                          Invoice
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
    </div>
  );
};
