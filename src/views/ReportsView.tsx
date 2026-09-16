import React from 'react';
import { Product, Sale, User, CATEGORIES, CategoryType } from '../types';
import { formatCurrency, formatNumber, getCategoryBadgeStyle } from '../utils/formatters';
import {
  BarChart3,
  TrendingUp,
  Printer,
  Download,
  Calendar,
  Layers,
  Banknote,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';

interface ReportsViewProps {
  user: User;
  products: Product[];
  sales: Sale[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ user, products, sales }) => {
  // Aggregate sales figures
  const totalRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalCost = sales.reduce((acc, s) => acc + s.purchasePrice * s.quantity, 0);
  const totalGrossProfit = totalRevenue - totalCost;
  const overallMargin =
    totalRevenue > 0 ? Math.round((totalGrossProfit / totalRevenue) * 100) : 0;

  // Inventory valuation
  const totalStockQty = products.reduce((acc, p) => acc + p.quantity, 0);
  const totalStockCost = products.reduce((acc, p) => acc + p.quantity * p.purchasePrice, 0);
  const totalStockRetailValue = products.reduce(
    (acc, p) => acc + p.quantity * p.sellingPrice,
    0
  );
  const unrealizedProfit = totalStockRetailValue - totalStockCost;

  // Category breakdown
  const categoryReports = CATEGORIES.map((cat) => {
    const catSales = sales.filter((s) => s.category === cat);
    const catProducts = products.filter((p) => p.category === cat);

    const rev = catSales.reduce((acc, s) => acc + s.totalAmount, 0);
    const profit = catSales.reduce((acc, s) => acc + s.profit, 0);
    const qtySold = catSales.reduce((acc, s) => acc + s.quantity, 0);
    const currentStock = catProducts.reduce((acc, p) => acc + p.quantity, 0);
    const stockVal = catProducts.reduce((acc, p) => acc + p.quantity * p.purchasePrice, 0);

    return {
      category: cat,
      revenue: rev,
      profit,
      qtySold,
      currentStock,
      stockValue: stockVal,
      margin: rev > 0 ? Math.round((profit / rev) * 100) : 0,
    };
  }).filter((c) => c.revenue > 0 || c.currentStock > 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Financial & Stock Reports</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Profit and loss analysis, margins, inventory valuation, and category profitability.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>Print Financial Report</span>
        </button>
      </div>

      {/* Printable Report Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="border-b border-slate-200 pb-4 mb-6 flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
              StockPro Financial Report
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-1">{user.shopName}</h2>
            <p className="text-xs text-slate-500">Shop Owner: {user.fullName} • Currency: PKR (Rs)</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p className="font-semibold text-slate-700">Statement Date</p>
            <p>{new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        {/* 4 Overview Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Gross Revenue
            </span>
            <span className="text-xl font-black text-slate-900 mt-1 block">
              {formatCurrency(totalRevenue)}
            </span>
            <span className="text-[10px] text-slate-400">Total customer receipts</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Cost of Goods (COGS)
            </span>
            <span className="text-xl font-black text-slate-700 mt-1 block">
              {formatCurrency(totalCost)}
            </span>
            <span className="text-[10px] text-slate-400">Inventory cost of sold products</span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              Gross Profit
            </span>
            <span className="text-xl font-black text-emerald-700 mt-1 block">
              {formatCurrency(totalGrossProfit)}
            </span>
            <span className="text-[10px] text-emerald-600">Net shop earnings</span>
          </div>

          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
              Overall Margin
            </span>
            <span className="text-xl font-black text-blue-700 mt-1 block">
              {overallMargin}%
            </span>
            <span className="text-[10px] text-blue-600">Profit ratio on sales</span>
          </div>
        </div>

        {/* Inventory Assets Valuation Box */}
        <div className="bg-slate-900 text-white rounded-xl p-5 mb-6">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
            Current Warehouse & Shelf Asset Valuation
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Total Stock In Hand</span>
              <span className="text-lg font-bold">{formatNumber(totalStockQty)} Units</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Purchase Cost Value</span>
              <span className="text-lg font-bold text-amber-300">
                {formatCurrency(totalStockCost)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Retail Realization Value</span>
              <span className="text-lg font-bold text-emerald-300">
                {formatCurrency(totalStockRetailValue)}
              </span>
              <span className="text-[10px] text-slate-400 block">
                Potential +{formatCurrency(unrealizedProfit)} profit
              </span>
            </div>
          </div>
        </div>

        {/* Category Breakdown Table */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3">Category Financial Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3 font-semibold">Category</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Units Sold</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Revenue</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Profit</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Margin %</th>
                  <th className="py-2.5 px-3 font-semibold text-center">In Stock</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Stock Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categoryReports.map((c) => (
                  <tr key={c.category} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryBadgeStyle(
                          c.category
                        )}`}
                      >
                        {c.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                      {c.qtySold}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-800">
                      {formatCurrency(c.revenue)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                      +{formatCurrency(c.profit)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-700">
                      {c.margin}%
                    </td>
                    <td className="py-2.5 px-3 text-center font-medium text-slate-700">
                      {c.currentStock}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                      {formatCurrency(c.stockValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
