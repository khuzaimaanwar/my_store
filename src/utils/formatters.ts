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

export const CATEGORY_COLORS: Record<CategoryType, string> = {
  Engine: '#2563EB', // Blue
  Brakes: '#DC2626', // Red
  Electrical: '#F59E0B', // Amber
  'Body Parts': '#7C3AED', // Purple
  Filters: '#10B981', // Emerald
  Fluids: '#06B6D4', // Cyan
  Suspension: '#D97706', // Warm Amber
  Transmission: '#4F46E5', // Indigo
  Accessories: '#EC4899', // Pink
  Other: '#64748B', // Slate
};

export const getCategoryBadgeStyle = (category: CategoryType): string => {
  switch (category) {
    case 'Engine':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Brakes':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'Electrical':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Body Parts':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Filters':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Fluids':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'Suspension':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'Transmission':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Accessories':
      return 'bg-pink-50 text-pink-700 border-pink-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};
