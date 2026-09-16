import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  getDocFromServer,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { User, Product, Sale, CategoryType } from '../types';

// Initialize Firebase App & Firestore
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Connection test on boot as required by guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    // Suppress expected permission-denied when unauthenticated
    if (error?.code !== 'permission-denied' && error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Standard error handler per Firestore specifications
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const FirebaseService = {
  // === AUTHENTICATION & USER PROFILE ===

  async registerEmail(
    data: { fullName: string; shopName: string; email: string; password: string }
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const email = data.email.trim().toLowerCase();
      const userCredential = await createUserWithEmailAndPassword(auth, email, data.password);
      const fbUser = userCredential.user;

      await updateProfile(fbUser, {
        displayName: data.fullName.trim(),
      });

      const newUser: User = {
        id: fbUser.uid,
        fullName: data.fullName.trim(),
        shopName: data.shopName.trim(),
        email: fbUser.email || email,
        createdAt: new Date().toISOString(),
        phone: '',
        address: '',
      };

      // Save user profile document in Firestore at /users/{userId}
      const userDocPath = `users/${fbUser.uid}`;
      try {
        await setDoc(doc(db, 'users', fbUser.uid), newUser);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, userDocPath);
      }

      return { success: true, user: newUser };
    } catch (error: any) {
      let message = error.message || 'Failed to create account.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'An account with this email already exists in Firebase.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password is too weak. Please use at least 6 characters.';
      } else if (error.code === 'auth/operation-not-allowed') {
        message =
          'Email/Password sign-in is disabled in your Firebase console. Please enable it under Authentication > Sign-in method, or sign in with Google.';
      }
      return { success: false, error: message };
    }
  },

  async loginEmail(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const fbUser = userCredential.user;

      const profile = await this.getUserProfile(fbUser.uid);
      if (profile) {
        return { success: true, user: profile };
      }

      // If document doesn't exist yet, construct profile
      const fallbackUser: User = {
        id: fbUser.uid,
        fullName: fbUser.displayName || 'Store Owner',
        shopName: fbUser.displayName ? `${fbUser.displayName}'s Store` : 'My Store',
        email: fbUser.email || normalizedEmail,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', fbUser.uid), fallbackUser);
      return { success: true, user: fallbackUser };
    } catch (error: any) {
      let message = error.message || 'Failed to log in.';
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        message = 'Invalid email or password. Please try again.';
      } else if (error.code === 'auth/operation-not-allowed') {
        message =
          'Email/Password sign-in is not yet enabled in Firebase Console (Authentication > Sign-in method > Email/Password). You can also sign in with Google.';
      }
      return { success: false, error: message };
    }
  },

  async loginWithGoogle(): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const res = await signInWithPopup(auth, provider);
      const fbUser = res.user;

      const profile = await this.getUserProfile(fbUser.uid);
      if (profile) {
        return { success: true, user: profile };
      }

      // Create new profile for Google account
      const newUser: User = {
        id: fbUser.uid,
        fullName: fbUser.displayName || 'Store Owner',
        shopName: fbUser.displayName ? `${fbUser.displayName}'s Store` : 'My Store',
        email: fbUser.email || '',
        createdAt: new Date().toISOString(),
        phone: '',
        address: '',
      };

      const userDocPath = `users/${fbUser.uid}`;
      try {
        await setDoc(doc(db, 'users', fbUser.uid), newUser);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, userDocPath);
      }

      return { success: true, user: newUser };
    } catch (error: any) {
      return { success: false, error: error.message || 'Google sign-in was cancelled or failed.' };
    }
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },

  async getUserProfile(userId: string): Promise<User | null> {
    const userDocPath = `users/${userId}`;
    try {
      const docSnap = await getDoc(doc(db, 'users', userId));
      if (docSnap.exists()) {
        return docSnap.data() as User;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, userDocPath);
    }
  },

  async updateUserProfile(
    userId: string,
    data: { shopName: string; fullName: string; phone?: string; address?: string }
  ): Promise<User | null> {
    const userDocPath = `users/${userId}`;
    try {
      const existing = await this.getUserProfile(userId);
      const updatedUser: User = {
        id: userId,
        fullName: data.fullName.trim(),
        shopName: data.shopName.trim(),
        email: existing?.email || auth.currentUser?.email || '',
        phone: data.phone?.trim() || '',
        address: data.address?.trim() || '',
        createdAt: existing?.createdAt || new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', userId), updatedUser, { merge: true });
      return updatedUser;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, userDocPath);
    }
  },

  // === FIRESTORE REAL-TIME SUBSCRIPTIONS & CRUD ===

  subscribeProducts(
    userId: string,
    onData: (products: Product[]) => void,
    onError?: (error: any) => void
  ): Unsubscribe {
    const path = `users/${userId}/products`;
    const colRef = collection(db, 'users', userId, 'products');

    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: Product[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Product);
        });
        // Sort newest first
        list.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        onData(list);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  async addProduct(
    userId: string,
    item: {
      id?: string;
      name: string;
      brand?: string;
      category: CategoryType;
      quantity: number;
      purchasePrice: number;
      sellingPrice: number;
      lowStockThreshold: number;
      partNumber?: string;
    }
  ): Promise<Product> {
    const id = item.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const product: Product = {
      id,
      userId,
      name: item.name.trim(),
      brand: item.brand?.trim() || undefined,
      category: item.category,
      quantity: Math.max(0, Number(item.quantity) || 0),
      purchasePrice: Math.max(0, Number(item.purchasePrice) || 0),
      sellingPrice: Math.max(0, Number(item.sellingPrice) || 0),
      lowStockThreshold: Math.max(0, Number(item.lowStockThreshold) || 5),
      partNumber: item.partNumber?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    const docPath = `users/${userId}/products/${id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'products', id), product);
      return product;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, docPath);
    }
  },

  async updateProduct(
    userId: string,
    productId: string,
    updates: Partial<Omit<Product, 'id' | 'userId' | 'createdAt'>>
  ): Promise<void> {
    const docPath = `users/${userId}/products/${productId}`;
    try {
      const cleanUpdates: any = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(doc(db, 'users', userId, 'products', productId), cleanUpdates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, docPath);
    }
  },

  async deleteProduct(userId: string, productId: string): Promise<void> {
    const docPath = `users/${userId}/products/${productId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'products', productId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  },

  async quickAdjustStock(
    userId: string,
    product: Product,
    delta: number
  ): Promise<void> {
    const newQty = Math.max(0, product.quantity + delta);
    await this.updateProduct(userId, product.id, { quantity: newQty });
  },

  subscribeSales(
    userId: string,
    onData: (sales: Sale[]) => void,
    onError?: (error: any) => void
  ): Unsubscribe {
    const path = `users/${userId}/sales`;
    const colRef = collection(db, 'users', userId, 'sales');

    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: Sale[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Sale);
        });
        // Sort newest sales date first
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        onData(list);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  async recordSale(
    userId: string,
    currentProducts: Product[],
    data: {
      saleId?: string;
      invoiceNumber?: string;
      productId: string;
      quantity: number;
      customerName?: string;
      customerPhone?: string;
      notes?: string;
    }
  ): Promise<{ success: boolean; sale?: Sale; error?: string }> {
    const product = currentProducts.find((p) => p.id === data.productId);
    if (!product) {
      return { success: false, error: 'Product not found in your inventory.' };
    }

    const qtyToSell = Number(data.quantity);
    if (qtyToSell <= 0) {
      return { success: false, error: 'Quantity sold must be at least 1 unit.' };
    }

    if (product.quantity < qtyToSell) {
      return {
        success: false,
        error: `Insufficient stock! Only ${product.quantity} units available in inventory.`,
      };
    }

    const saleId = data.saleId || `sale_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const invoiceNumber = data.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;
    const totalAmount = product.sellingPrice * qtyToSell;
    const profit = (product.sellingPrice - product.purchasePrice) * qtyToSell;

    const newSale: Sale = {
      id: saleId,
      userId,
      invoiceNumber,
      productId: product.id,
      productName: product.name,
      productBrand: product.brand || undefined,
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

    // 1. Decrement product stock in Firestore
    const newQty = product.quantity - qtyToSell;
    await this.updateProduct(userId, product.id, { quantity: newQty });

    // 2. Save Sale document in Firestore
    const salePath = `users/${userId}/sales/${saleId}`;
    try {
      await setDoc(doc(db, 'users', userId, 'sales', saleId), newSale);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, salePath);
    }

    return { success: true, sale: newSale };
  },

  // Migrate any previous local data into the authenticated user's Firestore
  async migrateLocalDataToCloud(
    userId: string,
    localProducts: Product[],
    localSales: Sale[]
  ): Promise<{ productsImported: number; salesImported: number }> {
    let pCount = 0;
    let sCount = 0;

    for (const p of localProducts) {
      try {
        const id = p.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const cleanProduct: Product = {
          ...p,
          id,
          userId,
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: p.updatedAt || new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', userId, 'products', id), cleanProduct);
        pCount++;
      } catch (err) {
        console.warn('Failed to migrate product to Firestore:', err);
      }
    }

    for (const s of localSales) {
      try {
        const id = s.id || `sale_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const cleanSale: Sale = {
          ...s,
          id,
          userId,
          date: s.date || new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', userId, 'sales', id), cleanSale);
        sCount++;
      } catch (err) {
        console.warn('Failed to migrate sale to Firestore:', err);
      }
    }

    return { productsImported: pCount, salesImported: sCount };
  },
};
