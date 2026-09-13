import React from 'react';
import { ViewTab } from '../types';
import {
  LayoutDashboard,
  Boxes,
  Receipt,
  Users2,
  BarChart3,
  Settings,
} from 'lucide-react';

interface MobileNavProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  lowStockCount: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onSelectTab,
  lowStockCount,
}) => {
  const tabs = [
    { id: 'dashboard' as ViewTab, label: 'Dash', icon: LayoutDashboard },
    {
      id: 'inventory' as ViewTab,
      label: 'Stock',
      icon: Boxes,
      hasAlert: lowStockCount > 0,
    },
    { id: 'sales' as ViewTab, label: 'Sales', icon: Receipt },
    { id: 'customers' as ViewTab, label: 'Clients', icon: Users2 },
    { id: 'reports' as ViewTab, label: 'Reports', icon: BarChart3 },
    { id: 'settings' as ViewTab, label: 'Config', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1 flex items-center justify-around shadow-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        return (
          <button
            key={tab.id}
            id={`mobile-nav-${tab.id}`}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center py-1 px-2 rounded-lg relative transition-colors ${
              isActive ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {tab.hasAlert && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </div>
            <span className="text-[10px] mt-0.5">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
