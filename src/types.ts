export type CategoryType =
  | 'Engine'
  | 'Brakes'
  | 'Electrical'
  | 'Body Parts'
  | 'Filters'
  | 'Fluids'
  | 'Suspension'
  | 'Transmission'
  | 'Accessories'
  | 'Other';

export const CATEGORIES: CategoryType[] = [
  'Engine',
  'Brakes',
  'Electrical',
  'Body Parts',
  'Filters',
  'Fluids',
  'Suspension',
  'Transmission',
  'Accessories',
  'Other',
];

export interface User {
  id: string;
  fullName: string;
  shopName: string;
  email: string;
  createdAt: string;
  phone?: string;
  address?: string;
}

export interface Product {
  id: string;
  userId: string;
  name: string;
  brand?: string;
  category: CategoryType;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  lowStockThreshold: number;
  partNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: string;
  userId: string;
  invoiceNumber: string;
  productId: string;
  productName: string;
  productBrand?: string;
  category: CategoryType;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  totalAmount: number;
  profit: number;
  customerName: string;
  customerPhone?: string;
  date: string; // ISO string
  notes?: string;
}

export interface DashboardStats {
  totalItems: number;
  stockQuantity: number;
  stockValue: number;
  itemsSoldTotal: number;
  todaySalesAmount: number;
  todayTransactionsCount: number;
  monthRevenue: number;
  monthProfit: number;
}

export interface DaySalesPoint {
  date: string; // YYYY-MM-DD
  dayName: string; // e.g., Mon, Tue
  revenue: number;
  profit: number;
  count: number;
}

export interface CategoryStockData {
  category: CategoryType;
  value: number;
  quantity: number;
  itemCount: number;
  percentage: number;
  color: string;
}

export interface TopSellingItem {
  productId: string;
  name: string;
  brand?: string;
  category: CategoryType;
  quantitySold: number;
  revenue: number;
  currentStock: number;
}

export type ViewTab = 'dashboard' | 'inventory' | 'sales' | 'customers' | 'reports' | 'settings';
