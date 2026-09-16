import React, { useState, useMemo } from 'react';
import { Sale, User } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { Users2, Search, ShoppingBag, Phone, Calendar, ArrowRight } from 'lucide-react';

interface CustomersViewProps {
  sales: Sale[];
  user: User;
  onViewInvoice: (sale: Sale) => void;
}

interface CustomerSummary {
  name: string;
  phone?: string;
  ordersCount: number;
  totalSpent: number;
  lastPurchaseDate: string;
  itemsPurchased: string[];
  salesList: Sale[];
}

export const CustomersView: React.FC<CustomersViewProps> = ({ sales, user, onViewInvoice }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);

  // Group sales by customer name
  const customers = useMemo(() => {
    const map = new Map<string, CustomerSummary>();

    for (const sale of sales) {
      const name = (sale.customerName || 'Walk-in Customer').trim();
      const existing = map.get(name) || {
        name,
        phone: sale.customerPhone,
        ordersCount: 0,
        totalSpent: 0,
        lastPurchaseDate: sale.date,
        itemsPurchased: [],
        salesList: [],
      };

      existing.ordersCount += 1;
      existing.totalSpent += sale.totalAmount;
      if (new Date(sale.date) > new Date(existing.lastPurchaseDate)) {
        existing.lastPurchaseDate = sale.date;
      }
      if (!existing.phone && sale.customerPhone) {
        existing.phone = sale.customerPhone;
      }
      if (!existing.itemsPurchased.includes(sale.productName)) {
        existing.itemsPurchased.push(sale.productName);
      }
      existing.salesList.push(sale);

      map.set(name, existing);
    }

    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [sales]);

  const filteredCustomers = customers.filter(
    (c) =>
      !searchTerm ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Customer Directory</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
              {customers.length} Clients
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track buying habits, repeat customers, and lifetime shop spending.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customer by name or phone..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Customers List & Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Customer Cards List (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          {filteredCustomers.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-xs text-slate-400">
              No customer records found. Record sales with customer names to build your customer directory.
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const isSelected = selectedCustomer?.name === cust.name;

              return (
                <div
                  key={cust.name}
                  onClick={() => setSelectedCustomer(cust)}
                  className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-xs ${
                    isSelected
                      ? 'border-emerald-500 ring-2 ring-emerald-200 bg-emerald-50/10'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{cust.name}</span>
                        {cust.ordersCount > 1 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Repeat Buyer ({cust.ordersCount}x)
                          </span>
                        )}
                      </div>
                      {cust.phone && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{cust.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                        <Calendar className="w-3 h-3" />
                        <span>Last purchase: {formatDateTime(cust.lastPurchaseDate)}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">
                        Total Spent
                      </span>
                      <span className="text-base font-black text-slate-900">
                        {formatCurrency(cust.totalSpent)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate max-w-[280px]">
                      Items bought: {cust.itemsPurchased.slice(0, 3).join(', ')}
                      {cust.itemsPurchased.length > 3 ? '...' : ''}
                    </span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-0.5 flex-shrink-0">
                      View Invoices <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Customer Invoices History (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          {selectedCustomer ? (
            <div>
              <div className="pb-3 border-b border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  Customer Profile
                </span>
                <h3 className="text-base font-bold text-slate-900">{selectedCustomer.name}</h3>
                {selectedCustomer.phone && (
                  <p className="text-xs text-slate-500">Phone: {selectedCustomer.phone}</p>
                )}
                <div className="flex gap-4 mt-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Purchases</span>
                    <span className="font-extrabold text-emerald-600">
                      {formatCurrency(selectedCustomer.totalSpent)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Orders</span>
                    <span className="font-bold text-slate-800">
                      {selectedCustomer.ordersCount}
                    </span>
                  </div>
                </div>
              </div>

              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mt-4 mb-2">
                Past Invoices
              </h4>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {selectedCustomer.salesList.map((sale) => (
                  <div
                    key={sale.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs hover:bg-slate-100 transition-colors"
                  >
                    <div>
                      <div className="font-mono font-bold text-slate-800">
                        {sale.invoiceNumber}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {sale.quantity}x {sale.productName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatDateTime(sale.date)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-black text-slate-900">
                        {formatCurrency(sale.totalAmount)}
                      </div>
                      <button
                        onClick={() => onViewInvoice(sale)}
                        className="mt-1 text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                      >
                        Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 text-xs">
              <Users2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-600">No Customer Selected</p>
              <p className="text-slate-400 mt-1">
                Click on any customer from the list on the left to view their past orders and receipts.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
