import React, { useState } from 'react';
import { User } from '../types';
import { StorageService } from '../services/storage';
import {
  Wrench,
  Store,
  LogOut,
  User as UserIcon,
  PlusCircle,
  Users,
  ChevronDown,
  Shield,
  Sparkles,
  Cloud,
} from 'lucide-react';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  onOpenNewSale: () => void;
  onOpenAddProduct: () => void;
  onSwitchUser: (userId: string) => void;
  lowStockCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onOpenNewSale,
  onOpenAddProduct,
  onSwitchUser,
  lowStockCount,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  const allUsers = StorageService.getUsers();

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand + Shop Name */}
            <div className="flex items-center gap-3 sm:gap-6 min-w-0">
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm ring-2 ring-slate-100">
                  <Wrench className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="hidden sm:block">
                  <div className="font-extrabold text-slate-900 tracking-tight text-sm leading-tight flex items-center gap-1.5">
                    AutoStock <span className="text-emerald-600 font-black">PRO</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">Spare Parts POS</div>
                </div>
              </div>

              {/* Shop Name Display (REQUIRED IN PROMPT) */}
              <div className="flex items-center gap-2 pl-3 sm:pl-4 border-l border-slate-200 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0 text-emerald-700">
                  <Store className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider flex items-center gap-1.5">
                    <span>Active Shop</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-100/90 text-emerald-800 font-bold text-[9px] tracking-normal normal-case">
                      <Cloud className="w-2.5 h-2.5" />
                      <span>Firestore Cloud</span>
                    </span>
                  </div>
                  <h2
                    id="shop-name-header"
                    className="text-sm sm:text-base font-bold text-slate-900 truncate"
                    title={user.shopName}
                  >
                    {user.shopName}
                  </h2>
                </div>
              </div>
            </div>

            {/* Right: Actions & User Account */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Quick Add Product Button */}
              <button
                id="header-add-product-btn"
                onClick={onOpenAddProduct}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Add Part</span>
                <span className="sm:hidden">Part</span>
              </button>

              {/* Quick Record Sale Button */}
              <button
                id="header-new-sale-btn"
                onClick={onOpenNewSale}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Record Sale</span>
              </button>

              {/* Switch Account Quick Button (For Easy Isolation Testing) */}
              <button
                id="switch-account-quick-btn"
                onClick={() => setShowSwitchModal(true)}
                title="Switch between registered shop accounts"
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Switch Shop ({allUsers.length})</span>
              </button>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden xl:block text-left text-xs">
                    <div className="font-semibold text-slate-800 leading-tight">
                      {user.fullName}
                    </div>
                    <div className="text-[10px] text-slate-400">{user.email}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <div className="text-xs font-bold text-slate-900">{user.fullName}</div>
                      <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                      <div className="mt-1 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded inline-block">
                        {user.shopName}
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowSwitchModal(true);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>Switch Shop Account</span>
                      </button>
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        id="logout-btn"
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Switch User Modal */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900">Multi-User Account Switcher</h3>
              </div>
              <button
                onClick={() => setShowSwitchModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-3 mb-4">
              Select any account to switch instantly and confirm that each shop has 100% private,
              isolated products, sales, and analytics.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {allUsers.map((u) => {
                const isActive = u.id === user.id;
                const shopProducts = StorageService.getProducts(u.id);
                const shopSales = StorageService.getSales(u.id);

                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      onSwitchUser(u.id);
                      setShowSwitchModal(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-200'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <span>{u.shopName}</span>
                        {isActive && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-emerald-600 text-white rounded font-medium">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {u.fullName} • {u.email}
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-slate-400 flex-shrink-0">
                      <div>{shopProducts.length} items</div>
                      <div>{shopSales.length} sales</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowSwitchModal(false);
                  onLogout();
                }}
                className="text-xs text-emerald-700 font-semibold hover:underline"
              >
                + Register Another Shop Account
              </button>
              <button
                onClick={() => setShowSwitchModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
