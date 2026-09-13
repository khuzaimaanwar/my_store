import {
  Product,
  Sale,
  DashboardStats,
  DaySalesPoint,
  CategoryStockData,
  TopSellingItem,
  CategoryType,
} from '../types';
import { CATEGORY_COLORS } from './formatters';

export function calculateDashboardStats(products: Product[], sales: Sale[]): DashboardStats {
  const totalItems = products.length;
  const stockQuantity = products.reduce((acc, p) => acc + (p.quantity || 0), 0);
  const stockValue = products.reduce(
    (acc, p) => acc + (p.quantity || 0) * (p.purchasePrice || 0),
    0
  );

  const itemsSoldTotal = sales.reduce((acc, s) => acc + (s.quantity || 0), 0);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayEnd = todayStart + 86400000;

  const thisMonthYear = now.getFullYear();
  const thisMonthIdx = now.getMonth();

  let todaySalesAmount = 0;
  let todayTransactionsCount = 0;
  let monthRevenue = 0;
  let monthProfit = 0;

  for (const sale of sales) {
    const saleTime = new Date(sale.date).getTime();
    const saleDateObj = new Date(sale.date);

    // Today check
    if (saleTime >= todayStart && saleTime < todayEnd) {
      todaySalesAmount += sale.totalAmount || 0;
      todayTransactionsCount += 1;
    }

    // Month check
    if (
      saleDateObj.getFullYear() === thisMonthYear &&
      saleDateObj.getMonth() === thisMonthIdx
    ) {
      monthRevenue += sale.totalAmount || 0;
      monthProfit += sale.profit || 0;
    }
  }

  return {
    totalItems,
    stockQuantity,
    stockValue,
    itemsSoldTotal,
    todaySalesAmount,
    todayTransactionsCount,
    monthRevenue,
    monthProfit,
  };
}

export function getLowStockProducts(products: Product[]): Product[] {
  return products
    .filter((p) => (p.quantity ?? 0) <= (p.lowStockThreshold ?? 5))
    .sort((a, b) => a.quantity - b.quantity);
}

export function calculateLast7DaysSales(sales: Sale[]): DaySalesPoint[] {
  const days: DaySalesPoint[] = [];
  const now = new Date();

  // 7 days ending today
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });

    const dayStart = d.getTime();
    const dayEnd = dayStart + 86400000;

    const daySales = sales.filter((s) => {
      const t = new Date(s.date).getTime();
      return t >= dayStart && t < dayEnd;
    });

    const revenue = daySales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    const profit = daySales.reduce((acc, s) => acc + (s.profit || 0), 0);

    days.push({
      date: dateStr,
      dayName: dayLabel,
      revenue,
      profit,
      count: daySales.length,
    });
  }

  return days;
}

export function calculateStockByCategory(products: Product[]): CategoryStockData[] {
  const categoryMap = new Map<CategoryType, { value: number; quantity: number; count: number }>();

  let totalValue = 0;

  for (const p of products) {
    const pValue = (p.quantity || 0) * (p.purchasePrice || 0);
    totalValue += pValue;

    const current = categoryMap.get(p.category) || { value: 0, quantity: 0, count: 0 };
    current.value += pValue;
    current.quantity += p.quantity || 0;
    current.count += 1;
    categoryMap.set(p.category, current);
  }

  const result: CategoryStockData[] = [];
  categoryMap.forEach((data, category) => {
    const percentage = totalValue > 0 ? (data.value / totalValue) * 100 : 0;
    result.push({
      category,
      value: data.value,
      quantity: data.quantity,
      itemCount: data.count,
      percentage: Math.round(percentage * 10) / 10,
      color: CATEGORY_COLORS[category] || '#64748B',
    });
  });

  return result.sort((a, b) => b.value - a.value);
}

export function calculateTopSellingParts(products: Product[], sales: Sale[]): TopSellingItem[] {
  const partMap = new Map<
    string,
    {
      productId: string;
      name: string;
      brand?: string;
      category: CategoryType;
      quantitySold: number;
      revenue: number;
    }
  >();

  for (const s of sales) {
    const current = partMap.get(s.productId) || {
      productId: s.productId,
      name: s.productName,
      brand: s.productBrand,
      category: s.category,
      quantitySold: 0,
      revenue: 0,
    };
    current.quantitySold += s.quantity;
    current.revenue += s.totalAmount;
    partMap.set(s.productId, current);
  }

  const productStockMap = new Map(products.map((p) => [p.id, p.quantity]));

  const topItems: TopSellingItem[] = [];
  partMap.forEach((item) => {
    topItems.push({
      ...item,
      currentStock: productStockMap.get(item.productId) ?? 0,
    });
  });

  return topItems.sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 5);
}
