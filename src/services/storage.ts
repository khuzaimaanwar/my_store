import { User, Product, Sale, CategoryType } from '../types';

const USERS_KEY = 'autostock_users';
const CURRENT_USER_KEY = 'autostock_current_user_id';

export interface StoredUserAccount extends User {
  passwordHash: string;
}

// Initialize default storage with a 100% clean, empty slate — NO demo data, NO sample products
function initStorage() {
  if (typeof window === 'undefined') return;

  try {
    // Purge any legacy sample/demo keys or hardcoded mock accounts from earlier versions
    const allKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) allKeys.push(k);
    }

    for (const key of allKeys) {
      if (
        key.includes('al_madina') ||
        key.includes('pak_nippon')
      ) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // ignore
  }

  // Load registered users, filtering out legacy hardcoded sample shops
  const usersRaw = localStorage.getItem(USERS_KEY);
  let users: StoredUserAccount[] = [];
  if (usersRaw) {
    try {
      users = JSON.parse(usersRaw);
    } catch {
      users = [];
    }
  }

  users = users.filter(
    (u) =>
      u &&
      u.id !== 'user_al_madina' &&
      u.id !== 'user_pak_nippon'
  );

  // If no user exists, create a clean default shop account with completely empty data
  if (users.length === 0) {
    const defaultUser: StoredUserAccount = {
      id: 'user_shop_owner',
      fullName: 'Store Owner',
      shopName: 'My Store',
      email: 'owner@stockpro.com',
      passwordHash: 'password123',
      createdAt: new Date().toISOString(),
      phone: '',
      address: '',
    };
    users = [defaultUser];
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    if (!localStorage.getItem(`autostock_products_${defaultUser.id}`)) {
      localStorage.setItem(`autostock_products_${defaultUser.id}`, JSON.stringify([]));
    }
    if (!localStorage.getItem(`autostock_sales_${defaultUser.id}`)) {
      localStorage.setItem(`autostock_sales_${defaultUser.id}`, JSON.stringify([]));
    }
    if (!localStorage.getItem(`autostock_invoice_counter_${defaultUser.id}`)) {
      localStorage.setItem(`autostock_invoice_counter_${defaultUser.id}`, '1');
    }
    localStorage.setItem(CURRENT_USER_KEY, defaultUser.id);
  } else {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    const currentId = localStorage.getItem(CURRENT_USER_KEY);
    if (!currentId || !users.some((u) => u.id === currentId)) {
      localStorage.setItem(CURRENT_USER_KEY, users[0].id);
    }
  }
}

// Call on import
initStorage();

export const StorageService = {
  // === USER AUTHENTICATION & MANAGEMENT ===
  getUsers(): StoredUserAccount[] {
    try {
      const data = localStorage.getItem(USERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  getCurrentUser(): User | null {
    try {
      const currentId = localStorage.getItem(CURRENT_USER_KEY);
      if (!currentId) return null;
      const users = this.getUsers();
      const user = users.find((u) => u.id === currentId);
      if (!user) return null;
      // Exclude password hash from returned object
      const { passwordHash: _, ...safeUser } = user;
      return safeUser;
    } catch {
      return null;
    }
  },

  register(data: { fullName: string; shopName: string; email: string; password: string }): {
    success: boolean;
    user?: User;
    error?: string;
  } {
    const users = this.getUsers();
    const normalizedEmail = data.email.trim().toLowerCase();

    if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const newUserId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newAccount: StoredUserAccount = {
      id: newUserId,
      fullName: data.fullName.trim(),
      shopName: data.shopName.trim(),
      email: normalizedEmail,
      passwordHash: data.password, // Client storage representation
      createdAt: new Date().toISOString(),
    };

    users.push(newAccount);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // Initialize clean, completely empty data keys for this brand new user
    localStorage.setItem(`autostock_products_${newUserId}`, JSON.stringify([]));
    localStorage.setItem(`autostock_sales_${newUserId}`, JSON.stringify([]));
    localStorage.setItem(`autostock_invoice_counter_${newUserId}`, '1');

    // Auto login
    localStorage.setItem(CURRENT_USER_KEY, newUserId);

    const { passwordHash: _, ...safeUser } = newAccount;
    return { success: true, user: safeUser };
  },

  login(email: string, password: string): { success: boolean; user?: User; error?: string } {
    const users = this.getUsers();
    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      return { success: false, error: 'No account found with this email.' };
    }

    if (user.passwordHash !== password) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    localStorage.setItem(CURRENT_USER_KEY, user.id);
    const { passwordHash: _, ...safeUser } = user;
    return { success: true, user: safeUser };
  },

  logout(): void {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  switchUser(userId: string): User | null {
    const users = this.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return null;
    localStorage.setItem(CURRENT_USER_KEY, user.id);
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  },

  updateShopProfile(userId: string, data: { shopName: string; fullName: string; phone?: string; address?: string }): User | null {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return null;

    users[idx] = {
      ...users[idx],
      shopName: data.shopName.trim(),
      fullName: data.fullName.trim(),
      phone: data.phone?.trim(),
      address: data.address?.trim(),
    };

    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    const { passwordHash: _, ...safeUser } = users[idx];
    return safeUser;
  },

  saveUserAccount(user: User): void {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      users[idx] = {
        ...users[idx],
        ...user,
      };
    } else {
      users.push({
        id: user.id,
        fullName: user.fullName,
        shopName: user.shopName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        createdAt: user.createdAt,
        passwordHash: '',
      });
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(CURRENT_USER_KEY, user.id);
  },

  // === PRODUCT INVENTORY MANAGEMENT (STRICTLY PER-USER) ===
  getProducts(userId: string): Product[] {
    if (!userId) return [];
    try {
      const data = localStorage.getItem(`autostock_products_${userId}`);
      if (!data) return [];
      const parsed: Product[] = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      // Clean out any legacy demo products that might have been seeded previously
      const cleaned = parsed.filter(
        (p) =>
          p &&
          typeof p === 'object' &&
          !p.id?.startsWith('prod_am_') &&
          !p.id?.startsWith('prod_pn_') &&
          !p.id?.startsWith('prod_demo_') &&
          !p.id?.startsWith('demo_')
      );
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(`autostock_products_${userId}`, JSON.stringify(cleaned));
      }
      return cleaned;
    } catch {
      return [];
    }
  },

  saveProducts(userId: string, products: Product[]): void {
    if (!userId) return;
    try {
      localStorage.setItem(`autostock_products_${userId}`, JSON.stringify(products));
    } catch (e) {
      console.warn('Failed to cache products', e);
    }
  },

  saveSales(userId: string, sales: Sale[]): void {
    if (!userId) return;
    try {
      localStorage.setItem(`autostock_sales_${userId}`, JSON.stringify(sales));
    } catch (e) {
      console.warn('Failed to cache sales', e);
    }
  },

  addProduct(
    userId: string,
    item: {
      name: string;
      brand?: string;
      category: CategoryType;
      quantity: number;
      purchasePrice: number;
      sellingPrice: number;
      lowStockThreshold: number;
      partNumber?: string;
    }
  ): Product {
    const products = this.getProducts(userId);
    const now = new Date().toISOString();
    const newProduct: Product = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      name: item.name.trim(),
      brand: item.brand?.trim() || undefined,
      category: item.category,
      quantity: Number(item.quantity) || 0,
      purchasePrice: Number(item.purchasePrice) || 0,
      sellingPrice: Number(item.sellingPrice) || 0,
      lowStockThreshold: Number(item.lowStockThreshold) || 5,
      partNumber: item.partNumber?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    products.unshift(newProduct);
    localStorage.setItem(`autostock_products_${userId}`, JSON.stringify(products));
    return newProduct;
  },

  updateProduct(
    userId: string,
    productId: string,
    updates: Partial<Omit<Product, 'id' | 'userId' | 'createdAt'>>
  ): Product | null {
    const products = this.getProducts(userId);
    const index = products.findIndex((p) => p.id === productId);
    if (index === -1) return null;

    products[index] = {
      ...products[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(`autostock_products_${userId}`, JSON.stringify(products));
    return products[index];
  },

  deleteProduct(userId: string, productId: string): boolean {
    const products = this.getProducts(userId);
    const filtered = products.filter((p) => p.id !== productId);
    if (filtered.length === products.length) return false;

    localStorage.setItem(`autostock_products_${userId}`, JSON.stringify(filtered));
    return true;
  },

  quickAdjustStock(userId: string, productId: string, delta: number): Product | null {
    const products = this.getProducts(userId);
    const index = products.findIndex((p) => p.id === productId);
    if (index === -1) return null;

    const newQty = Math.max(0, products[index].quantity + delta);
    products[index].quantity = newQty;
    products[index].updatedAt = new Date().toISOString();

    localStorage.setItem(`autostock_products_${userId}`, JSON.stringify(products));
    return products[index];
  },

  // === SALES MANAGEMENT (STRICTLY PER-USER) ===
  getSales(userId: string): Sale[] {
    if (!userId) return [];
    try {
      const data = localStorage.getItem(`autostock_sales_${userId}`);
      if (!data) return [];
      const parsed: Sale[] = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      const cleaned = parsed.filter(
        (s) =>
          s &&
          typeof s === 'object' &&
          !s.id?.startsWith('sale_am_') &&
          !s.id?.startsWith('sale_pn_') &&
          !s.id?.startsWith('sale_demo_') &&
          !s.id?.startsWith('demo_')
      );
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(`autostock_sales_${userId}`, JSON.stringify(cleaned));
      }
      return cleaned;
    } catch {
      return [];
    }
  },

  getNextInvoiceNumber(userId: string): string {
    const rawCount = localStorage.getItem(`autostock_invoice_counter_${userId}`);
    const count = rawCount ? parseInt(rawCount, 10) : 1;
    return `INV-${String(count).padStart(4, '0')}`;
  },

  recordSale(
    userId: string,
    data: {
      productId: string;
      quantity: number;
      customerName?: string;
      customerPhone?: string;
      notes?: string;
    }
  ): { success: boolean; sale?: Sale; error?: string } {
    const products = this.getProducts(userId);
    const productIndex = products.findIndex((p) => p.id === data.productId);

    if (productIndex === -1) {
      return { success: false, error: 'Selected product was not found in your inventory.' };
    }

    const product = products[productIndex];
    const qtyToSell = Number(data.quantity);

    if (qtyToSell <= 0) {
      return { success: false, error: 'Quantity sold must be at least 1 piece.' };
    }

    if (product.quantity < qtyToSell) {
      return {
        success: false,
        error: `Insufficient stock! You only have ${product.quantity} units of ${product.name} available.`,
      };
    }

    // Generate invoice number
    const counterKey = `autostock_invoice_counter_${userId}`;
    const rawCounter = localStorage.getItem(counterKey);
    const currentCounter = rawCounter ? parseInt(rawCounter, 10) : 1;
    const invoiceNumber = `INV-${String(currentCounter).padStart(4, '0')}`;

    // Update counter
    localStorage.setItem(counterKey, String(currentCounter + 1));

    // Reduce stock
    product.quantity -= qtyToSell;
    product.updatedAt = new Date().toISOString();
    localStorage.setItem(`autostock_products_${userId}`, JSON.stringify(products));

    // Calculate financials
    const totalAmount = product.sellingPrice * qtyToSell;
    const costTotal = product.purchasePrice * qtyToSell;
    const profit = totalAmount - costTotal;

    const newSale: Sale = {
      id: `sale_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      invoiceNumber,
      productId: product.id,
      productName: product.name,
      productBrand: product.brand,
      category: product.category,
      quantity: qtyToSell,
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      totalAmount,
      profit,
      customerName: (data.customerName || '').trim() || 'Walk-in Customer',
      customerPhone: data.customerPhone?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
      date: new Date().toISOString(),
    };

    const sales = this.getSales(userId);
    sales.unshift(newSale);
    localStorage.setItem(`autostock_sales_${userId}`, JSON.stringify(sales));

    return { success: true, sale: newSale };
  },

  // === DATA RESET / EXPORT ===
  clearShopData(userId: string): void {
    localStorage.setItem(`autostock_products_${userId}`, JSON.stringify([]));
    localStorage.setItem(`autostock_sales_${userId}`, JSON.stringify([]));
    localStorage.setItem(`autostock_invoice_counter_${userId}`, '1');
  },

  exportShopData(userId: string): string {
    const products = this.getProducts(userId);
    const sales = this.getSales(userId);
    return JSON.stringify({ products, sales, exportedAt: new Date().toISOString() }, null, 2);
  },

  importShopData(userId: string, jsonData: string): { success: boolean; error?: string } {
    try {
      const parsed = JSON.parse(jsonData);
      if (Array.isArray(parsed.products) && Array.isArray(parsed.sales)) {
        // Tag to this user
        const fixedProducts = parsed.products.map((p: Product) => ({ ...p, userId }));
        const fixedSales = parsed.sales.map((s: Sale) => ({ ...s, userId }));
        localStorage.setItem(`autostock_products_${userId}`, JSON.stringify(fixedProducts));
        localStorage.setItem(`autostock_sales_${userId}`, JSON.stringify(fixedSales));
        return { success: true };
      }
      return { success: false, error: 'Invalid file format. Must contain products and sales arrays.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to parse JSON file' };
    }
  },
};
