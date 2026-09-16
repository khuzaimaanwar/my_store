import { CategoryType } from '../types';

export const formatCurrency = (amount: number): string => {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rs 0';
  return `Rs ${Math.round(amount).toLocaleString('en-PK')}`;
};

export const formatNumber = (val: number): string => {
  if (isNaN(val) || val === null || val === undefined) return '0';
  return val.toLocaleString('en-PK');
};

export const formatDate = (isoString: string): string => {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoString;
  }
};

export const formatDateTime = (isoString: string): string => {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
};

export const CATEGORY_COLORS: Record<string, string> = {
  General: '#2563EB', // Blue
  Electronics: '#6366F1', // Indigo
  Grocery: '#10B981', // Emerald
  Clothing: '#EC4899', // Pink
  Accessories: '#F59E0B', // Amber
  Beverages: '#06B6D4', // Cyan
  Pharmacy: '#14B8A6', // Teal
  Stationery: '#8B5CF6', // Purple
  Hardware: '#F97316', // Orange
  Other: '#64748B', // Slate
};

const PALETTE = [
  '#2563EB',
  '#10B981',
  '#F59E0B',
  '#6366F1',
  '#EC4899',
  '#06B6D4',
  '#14B8A6',
  '#8B5CF6',
  '#F97316',
  '#64748B',
];

export const getCategoryColor = (category: CategoryType): string => {
  if (CATEGORY_COLORS[category]) {
    return CATEGORY_COLORS[category];
  }
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
};

export const getCategoryBadgeStyle = (category: CategoryType): string => {
  switch (category) {
    case 'General':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Electronics':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Grocery':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Clothing':
      return 'bg-pink-50 text-pink-700 border-pink-200';
    case 'Accessories':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Beverages':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'Pharmacy':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'Stationery':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Hardware':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};
