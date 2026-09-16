import React from 'react';
import { Sale, User } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { Printer, X, CheckCircle, ShieldCheck } from 'lucide-react';

interface InvoiceModalProps {
  sale: Sale | null;
  shopUser: User | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ sale, shopUser, onClose }) => {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white">
      <div
        id="invoice-modal-container"
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 print:border-none print:shadow-none print:max-w-full"
      >
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-bold text-slate-800">Sales Invoice Preview</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="print-invoice-btn"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 shadow-sm cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              Print Receipt
            </button>
            <button
              id="close-invoice-btn"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div className="p-6 sm:p-8 space-y-6 print:p-8">
          {/* Shop Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-5">
            <div>
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                Official Receipt
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {shopUser?.shopName || 'Your Store'}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {shopUser?.address || 'Retail & Wholesale Store'}
              </p>
              {shopUser?.phone && (
                <p className="text-xs text-slate-500">Contact: {shopUser.phone}</p>
              )}
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 text-xs font-bold font-mono rounded bg-slate-100 text-slate-800 border border-slate-200">
                {sale.invoiceNumber}
              </span>
              <p className="text-xs text-slate-500 mt-2">
                {formatDateTime(sale.date)}
              </p>
              <div className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold mt-1">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                PAID CASH
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 flex justify-between items-center text-xs">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                Billed To
              </span>
              <span className="font-semibold text-slate-800 text-sm">
                {sale.customerName || 'Walk-in Customer'}
              </span>
            </div>
            {sale.customerPhone && (
              <div className="text-right">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                  Customer Phone
                </span>
                <span className="font-medium text-slate-700">{sale.customerPhone}</span>
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="text-left py-2 font-semibold">Item & Brand</th>
                  <th className="text-center py-2 font-semibold w-16">Qty</th>
                  <th className="text-right py-2 font-semibold w-24">Unit Price</th>
                  <th className="text-right py-2 font-semibold w-24">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 pr-2">
                    <div className="font-bold text-slate-800">{sale.productName}</div>
                    <div className="text-slate-500 text-[11px]">
                      {sale.productBrand ? `${sale.productBrand} • ` : ''}
                      {sale.category}
                    </div>
                  </td>
                  <td className="py-3 text-center font-semibold text-slate-800">
                    {sale.quantity}
                  </td>
                  <td className="py-3 text-right font-medium text-slate-700">
                    {formatCurrency(sale.sellingPrice)}
                  </td>
                  <td className="py-3 text-right font-bold text-slate-900">
                    {formatCurrency(sale.totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total Section */}
          <div className="border-t border-slate-200 pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-medium">{formatCurrency(sale.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Discount</span>
              <span className="font-medium">Rs 0</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-sm font-extrabold text-slate-900">
              <span className="text-base">Grand Total (PKR)</span>
              <span className="text-lg text-emerald-600 font-black">
                {formatCurrency(sale.totalAmount)}
              </span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-700">
              Thank you for your business!
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Goods once sold cannot be returned without original cash receipt.
            </p>
            <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-slate-400">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Generated securely via StockPro</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action (Hidden in print) */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-right print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 transition-colors cursor-pointer"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
