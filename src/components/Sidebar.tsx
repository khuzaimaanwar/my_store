import React from 'react';
import { ViewTab } from '../types';
import {
  LayoutDashboard,
  Boxes,
  BadgePercent,
  Users2,
  BarChart3,
  Settings,
  AlertTriangle,
  Receipt,
} from 'lucide-react';

interface SidebarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  lowStockCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  lowStockCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ViewTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'inventory' as ViewTab,
      label: 'Inventory',
      icon: Boxes,
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'sales' as ViewTab,
      label: 'Sales & POS',
      icon: Receipt,
    },
    {
      id: 'customers' as ViewTab,
      label: 'Customers',
      icon: Users2,
    },
    {
      id: 'reports' as ViewTab,
      label: 'Reports',
      icon: BarChart3,
    },
    {
      id: 'settings' as ViewTab,
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 p-4 min-h-[calc(100vh-4rem)] flex-shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Main Menu
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    item.badgeColor || 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Low stock quick notice in sidebar if any */}
      {lowStockCount > 0 && (
        <div className="mt-auto pt-4">
          <div
            onClick={() => onSelectTab('inventory')}
            className="p-3 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer hover:bg-amber-100/70 transition-colors"
          >
            <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Low Stock Warning</span>
            </div>
            <p className="text-[11px] text-amber-700 mt-1">
              {lowStockCount} {lowStockCount === 1 ? 'item is' : 'items are'} running below
              threshold!
            </p>
          </div>
        </div>
      )}
    </aside>
  );
};
