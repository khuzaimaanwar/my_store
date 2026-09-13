/**
 * AutoStock Pro - Inventory and Sales Management System for Auto Spare Parts Shops
 * Multi-user with isolated private data per shop account.
 * Cloud-backed with Google Cloud Firestore & Firebase Auth.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Product, Sale, ViewTab, CategoryType } from './types';
import { StorageService } from './services/storage';
import { FirebaseService, auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getLowStockProducts } from './utils/analytics';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { InvoiceModal } from './components/InvoiceModal';
import { AddProductModal } from './components/AddProductModal';
import { Check, Cloud } from 'lucide-react';
import { AuthView } from './views/AuthView';
import { DashboardView } from './views/DashboardView';
import { InventoryView } from './views/InventoryView';
import { SalesView } from './views/SalesView';
import { CustomersView } from './views/CustomersView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';

export default function App() {
  // Current logged in user
  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    StorageService.getCurrentUser()
  );

  // Active view tab
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');

  // Shop data state (strictly isolated to currentUser.id)
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  // Modals & UI helpers
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [activeInvoiceSale, setActiveInvoiceSale] = useState<Sale | null>(null);
  const [preselectedSaleProductId, setPreselectedSaleProductId] = useState<string | undefined>();
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Track if initial sync has executed for current user
  const hasSyncedRef = useRef<string | null>(null);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const profile = await FirebaseService.getUserProfile(fbUser.uid);
          if (profile) {
            setCurrentUser(profile);
            StorageService.saveUserAccount(profile);
          } else {
            const fallbackUser: User = {
              id: fbUser.uid,
              fullName: fbUser.displayName || 'Shop Owner',
              shopName: 'Auto Parts Store',
              email: fbUser.email || '',
              createdAt: new Date().toISOString(),
            };
            setCurrentUser(fallbackUser);
          }
        } catch (e) {
          console.warn('Firebase profile fetch error:', e);
        }
      }
    });

    return () => unsubAuth();
  }, []);

  // Synchronize Firestore Real-Time collections when currentUser changes
  useEffect(() => {
    if (!currentUser?.id) {
      setProducts([]);
      setSales([]);
      return;
    }

    const userId = currentUser.id;

    // 1. Immediate local render to eliminate any UI waiting/flicker
    const initialLocalProducts = StorageService.getProducts(userId);
    const initialLocalSales = StorageService.getSales(userId);
    setProducts(initialLocalProducts);
    setSales(initialLocalSales);

    // 2. Real-time subscription to user's products in Firestore
    const unsubProducts = FirebaseService.subscribeProducts(
      userId,
      (cloudProducts) => {
        if (cloudProducts.length > 0) {
          setProducts(cloudProducts);
          StorageService.saveProducts(userId, cloudProducts);
        } else if (
          hasSyncedRef.current !== userId &&
          initialLocalProducts.length > 0
        ) {
          // If Firestore collection is empty but local has items, migrate them to cloud!
          hasSyncedRef.current = userId;
          FirebaseService.migrateLocalDataToCloud(
            userId,
            initialLocalProducts,
            initialLocalSales
          );
        }
      },
      (err) => {
        console.warn('Products live sync notice:', err);
      }
    );

    // 3. Real-time subscription to user's sales in Firestore
    const unsubSales = FirebaseService.subscribeSales(
      userId,
      (cloudSales) => {
        if (cloudSales.length > 0) {
          setSales(cloudSales);
          StorageService.saveSales(userId, cloudSales);
        }
      },
      (err) => {
        console.warn('Sales live sync notice:', err);
      }
    );

    return () => {
      unsubProducts();
      unsubSales();
    };
  }, [currentUser?.id]);

  // Fallback reload helper
  const reloadUserData = useCallback(() => {
    if (currentUser?.id) {
      const userProducts = StorageService.getProducts(currentUser.id);
      const userSales = StorageService.getSales(currentUser.id);
      setProducts(userProducts);
      setSales(userSales);
    }
  }, [currentUser]);

  // Handle Authentication events
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentTab('dashboard');
  };

  const handleLogout = async () => {
    try {
      await FirebaseService.logout();
    } catch (e) {
      console.warn('Logout notice:', e);
    }
    StorageService.logout();
    setCurrentUser(null);
    setProducts([]);
    setSales([]);
  };

  const handleSwitchUser = (userId: string) => {
    const switchedUser = StorageService.switchUser(userId);
    if (switchedUser) {
      setCurrentUser(switchedUser);
      setCurrentTab('dashboard');
    }
  };

  // Product CRUD operations with Firestore Persistence
  const handleAddProduct = async (item: {
    name: string;
    brand?: string;
    category: CategoryType;
    quantity: number;
    purchasePrice: number;
    sellingPrice: number;
    lowStockThreshold: number;
    partNumber?: string;
  }) => {
    if (!currentUser) return;

    // 1. Immediate local save for instantaneous UI update
    const localProduct = StorageService.addProduct(currentUser.id, item);
    setProducts((prev) => [localProduct, ...prev]);
    setIsAddProductOpen(false);
    setSuccessToast(`Spare part "${localProduct.name}" saved to cloud inventory!`);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);

    // 2. Persist to Firestore
    try {
      await FirebaseService.addProduct(currentUser.id, {
        ...item,
        id: localProduct.id,
      });
    } catch (e) {
      console.warn('Firestore add product notice:', e);
    }
  };

  const handleUpdateProduct = async (
    productId: string,
    updates: Partial<Omit<Product, 'id' | 'userId' | 'createdAt'>>
  ) => {
    if (!currentUser) return;

    // 1. Update local cache
    const updated = StorageService.updateProduct(currentUser.id, productId, updates);
    if (updated) {
      setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
    }

    // 2. Persist update to Firestore
    try {
      await FirebaseService.updateProduct(currentUser.id, productId, updates);
    } catch (e) {
      console.warn('Firestore update product notice:', e);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!currentUser) return;

    // 1. Local update
    const ok = StorageService.deleteProduct(currentUser.id, productId);
    if (ok) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    }

    // 2. Persist delete to Firestore
    try {
      await FirebaseService.deleteProduct(currentUser.id, productId);
    } catch (e) {
      console.warn('Firestore delete product notice:', e);
    }
  };

  const handleQuickAdjust = async (productId: string, delta: number) => {
    if (!currentUser) return;

    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    // 1. Local adjustment
    const updated = StorageService.quickAdjustStock(currentUser.id, productId, delta);
    if (updated) {
      setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
    }

    // 2. Firestore adjustment
    try {
      await FirebaseService.quickAdjustStock(currentUser.id, prod, delta);
    } catch (e) {
      console.warn('Firestore adjust stock notice:', e);
    }
  };

  // Sales recording with real-time Firestore persistence
  const handleRecordSale = (saleData: {
    productId: string;
    quantity: number;
    customerName?: string;
    customerPhone?: string;
    notes?: string;
  }) => {
    if (!currentUser) return { success: false, error: 'User session expired' };

    // 1. Record locally immediately so checkout is instant
    const result = StorageService.recordSale(currentUser.id, saleData);
    if (result.success && result.sale) {
      // Decrement product stock in local state
      setProducts((prev) =>
        prev.map((p) =>
          p.id === saleData.productId
            ? { ...p, quantity: Math.max(0, p.quantity - saleData.quantity) }
            : p
        )
      );
      setSales((prev) => [result.sale!, ...prev]);

      // 2. Asynchronously sync sale to Firestore
      FirebaseService.recordSale(currentUser.id, products, {
        ...saleData,
        saleId: result.sale.id,
        invoiceNumber: result.sale.invoiceNumber,
      }).catch((err) => {
        console.warn('Firestore sale sync notice:', err);
      });

      return result;
    }
    return result;
  };

  // Navigation shortcuts
  const handleOpenNewSale = (preselectedProductId?: string) => {
    setPreselectedSaleProductId(preselectedProductId);
    setCurrentTab('sales');
  };

  const handleQuickSellFromInventory = (productId: string) => {
    setPreselectedSaleProductId(productId);
    setCurrentTab('sales');
  };

  const handleRestockProduct = (product: Product) => {
    // Quick restock +5 pieces
    handleQuickAdjust(product.id, 5);
  };

  // If no user is logged in, render the AuthView (Sign Up & Login)
  if (!currentUser) {
    return <AuthView onLoginSuccess={handleLoginSuccess} />;
  }

  const lowStockItems = getLowStockProducts(products);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation Bar with Shop Name prominently shown */}
      <Navbar
        user={currentUser}
        onLogout={handleLogout}
        onOpenNewSale={() => handleOpenNewSale()}
        onOpenAddProduct={() => setIsAddProductOpen(true)}
        onSwitchUser={handleSwitchUser}
        lowStockCount={lowStockItems.length}
      />

      {/* Main App Layout: Sidebar + Viewport */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        {/* Left Navigation Sidebar (Desktop) */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          lowStockCount={lowStockItems.length}
        />

        {/* Dynamic View Panel */}
        <main className="flex-1 min-w-0 pb-20 sm:pb-6">
          {currentTab === 'dashboard' && (
            <DashboardView
              user={currentUser}
              products={products}
              sales={sales}
              onNavigate={setCurrentTab}
              onOpenNewSale={handleOpenNewSale}
              onOpenAddProduct={() => setIsAddProductOpen(true)}
              onViewInvoice={(sale) => setActiveInvoiceSale(sale)}
              onRestockProduct={handleRestockProduct}
            />
          )}

          {currentTab === 'inventory' && (
            <InventoryView
              products={products}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onQuickAdjust={handleQuickAdjust}
              onQuickSell={handleQuickSellFromInventory}
              onOpenAddProduct={() => setIsAddProductOpen(true)}
              isAddModalOpen={isAddProductOpen}
              onCloseAddModal={() => setIsAddProductOpen(false)}
            />
          )}

          {currentTab === 'sales' && (
            <SalesView
              user={currentUser}
              products={products}
              sales={sales}
              onRecordSale={handleRecordSale}
              onViewInvoice={(sale) => setActiveInvoiceSale(sale)}
              preselectedProductId={preselectedSaleProductId}
              onClearPreselectedProduct={() => setPreselectedSaleProductId(undefined)}
              onOpenAddProduct={() => setIsAddProductOpen(true)}
            />
          )}

          {currentTab === 'customers' && (
            <CustomersView
              user={currentUser}
              sales={sales}
              onViewInvoice={(sale) => setActiveInvoiceSale(sale)}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsView
              user={currentUser}
              products={products}
              sales={sales}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              user={currentUser}
              products={products}
              sales={sales}
              onUpdateUser={setCurrentUser}
              onRefreshData={reloadUserData}
              onLogout={handleLogout}
              onSwitchUser={handleSwitchUser}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        lowStockCount={lowStockItems.length}
      />

      {/* Global Add Product Modal - available from any screen / navbar / dashboard */}
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onSave={handleAddProduct}
      />

      {/* Printable Invoice Modal */}
      {activeInvoiceSale && (
        <InvoiceModal
          sale={activeInvoiceSale}
          shopUser={currentUser}
          onClose={() => setActiveInvoiceSale(null)}
        />
      )}

      {/* Global Success Notification Toast */}
      {successToast && (
        <div
          id="global-success-toast"
          className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-800 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-slate-100">{successToast}</span>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-slate-400 hover:text-white ml-2 text-xs cursor-pointer p-1"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
