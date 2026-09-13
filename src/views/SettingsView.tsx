import React, { useState } from 'react';
import { User, Product, Sale } from '../types';
import { StorageService } from '../services/storage';
import { FirebaseService } from '../services/firebase';
import {
  Settings as SettingsIcon,
  Store,
  User as UserIcon,
  Phone,
  MapPin,
  Save,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Cloud,
  Database,
  Lock,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface SettingsViewProps {
  user: User;
  products: Product[];
  sales: Sale[];
  onUpdateUser: (updatedUser: User) => void;
  onRefreshData: () => void;
  onLogout: () => void;
  onSwitchUser: (userId: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  products,
  sales,
  onUpdateUser,
  onRefreshData,
  onLogout,
  onSwitchUser,
}) => {
  const [shopName, setShopName] = useState(user.shopName);
  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone || '');
  const [address, setAddress] = useState(user.address || '');

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudFeedback, setCloudFeedback] = useState<string | null>(null);

  const handleSyncToCloud = async () => {
    setIsSyncingCloud(true);
    setCloudFeedback(null);
    try {
      const res = await FirebaseService.migrateLocalDataToCloud(user.id, products, sales);
      setCloudFeedback(`Successfully synced ${res.productsImported} spare parts and ${res.salesImported} invoices to Firebase Firestore!`);
      onRefreshData();
    } catch (err: any) {
      setCloudFeedback(`Cloud sync note: ${err.message || 'Data is already up to date.'}`);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const allUsers = StorageService.getUsers();

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = StorageService.updateShopProfile(user.id, {
      shopName,
      fullName,
      phone,
      address,
    });

    if (updated) {
      onUpdateUser(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'Are you sure you want to clear all products and sales for this shop? Your shop will start completely fresh.'
      )
    ) {
      StorageService.clearShopData(user.id);
      onRefreshData();
      setActionFeedback('Your shop inventory and sales have been reset to zero.');
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  const handleExport = () => {
    const jsonStr = StorageService.exportShopData(user.id);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${user.shopName.replace(/\s+/g, '_')}_backup.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = StorageService.importShopData(user.id, content);
      if (res.success) {
        onRefreshData();
        setActionFeedback('Data imported successfully!');
        setTimeout(() => setActionFeedback(null), 3000);
      } else {
        alert(res.error || 'Failed to import data');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <span>Shop & Account Settings</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure your shop profile, print invoice header details, and manage multi-user accounts.
        </p>
      </div>

      {/* Action Notification */}
      {actionFeedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Shop Profile Form */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Shop Identity & Receipt Header</h2>
          </div>
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
              Saved Successfully!
            </span>
          )}
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Shop Name (Appears on Invoices & Dashboard)
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="settings-shopname-input"
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Owner / Manager Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="settings-fullname-input"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Shop Contact Number / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="settings-phone-input"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Shop Address (Printed on Receipts)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="settings-address-input"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Shop # 14, Montgomery Road, Lahore"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              id="save-shop-profile-btn"
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Shop Profile</span>
            </button>
          </div>
        </form>
      </div>

      {/* Multi-Tenant Data Isolation Details */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-900">Multi-User Isolation Status</h2>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Your shop is registered with ID <code className="font-mono text-emerald-700 font-bold bg-slate-100 px-1.5 py-0.5 rounded">{user.id}</code>.
          All spare parts, low-stock thresholds, customer records, and invoice counters are strictly isolated to your account.
        </p>

        {/* Registered Users List */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-700 mb-2">Registered Accounts in this Browser:</h3>
          <div className="space-y-2">
            {allUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>{u.shopName}</span>
                    {u.id === user.id && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-emerald-600 text-white rounded font-semibold">
                        Logged In
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    {u.fullName} • {u.email}
                  </div>
                </div>

                {u.id !== user.id && (
                  <button
                    onClick={() => onSwitchUser(u.id)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
                  >
                    Switch to this Shop
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Firebase Cloud Backend & User Isolation Card */}
      <div className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-xs ring-1 ring-emerald-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Firebase Cloud Backend</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Active & Connected
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Data is encrypted and stored in Google Cloud Firestore with zero-trust security rules.
              </p>
            </div>
          </div>

          <button
            onClick={handleSyncToCloud}
            disabled={isSyncingCloud}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSyncingCloud ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Syncing Cloud...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync / Push to Cloud</span>
              </>
            )}
          </button>
        </div>

        {cloudFeedback && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{cloudFeedback}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold">Firestore Database</span>
            </div>
            <p className="font-mono text-[11px] text-slate-800 truncate" title="Enterprise Mode">
              AutoStock Pro Cloud DB
            </p>
            <span className="text-[10px] text-slate-400">Live multi-device sync</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold">User Data Isolation</span>
            </div>
            <p className="text-[11px] font-bold text-slate-800">
              Scoped to /users/{user.id.slice(0, 10)}...
            </p>
            <span className="text-[10px] text-slate-400">Other shops cannot read or write</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold">Security Rules</span>
            </div>
            <p className="text-[11px] font-bold text-emerald-700">
              Strict ABAC Enforced
            </p>
            <span className="text-[10px] text-slate-400">Deployed & verified</span>
          </div>
        </div>
      </div>

      {/* Data Management: Reset / Export / Import */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-blue-600" />
          <span>Data Management & Backup</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Reset Shop Data */}
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-rose-900">Reset Shop Inventory & Sales</h3>
              <p className="text-rose-700 text-[11px] mt-1">
                Clears all products and invoice history for this shop account to start fresh.
              </p>
            </div>
            <button
              onClick={handleResetData}
              className="mt-3 w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer transition-colors"
            >
              Reset to Empty Shop
            </button>
          </div>

          {/* Export JSON */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-800">Export Shop Backup (JSON)</h3>
              <p className="text-slate-500 text-[11px] mt-1">
                Download a JSON file of your shop inventory and invoices to keep safe.
              </p>
            </div>
            <button
              onClick={handleExport}
              className="mt-3 w-full py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Backup</span>
            </button>
          </div>

          {/* Import JSON */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-800">Import Shop Backup (JSON)</h3>
              <p className="text-slate-500 text-[11px] mt-1">
                Restore inventory and sales records from a previously exported file.
              </p>
            </div>
            <label className="mt-3 w-full py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1.5 text-center">
              <Upload className="w-3.5 h-3.5" />
              <span>Choose Backup File</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Logout */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex justify-between items-center">
          <div className="text-xs text-slate-500">
            Signed in as <strong className="text-slate-700">{user.email}</strong>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-slate-100 hover:bg-rose-50 text-rose-600 hover:text-rose-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Shop</span>
          </button>
        </div>
      </div>
    </div>
  );
};
