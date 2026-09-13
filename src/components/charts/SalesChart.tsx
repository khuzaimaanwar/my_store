import React, { useState } from 'react';
import { DaySalesPoint } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { TrendingUp } from 'lucide-react';

interface SalesChartProps {
  data: DaySalesPoint[];
}

export const SalesChart: React.FC<SalesChartProps> = ({ data }) => {
  const [metric, setMetric] = useState<'revenue' | 'profit' | 'both'>('both');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalSales = data.reduce((acc, d) => acc + d.revenue + d.profit, 0);

  if (data.length === 0 || totalSales === 0) {
    return (
      <div className="h-48 w-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
          <TrendingUp className="w-5 h-5" />
        </div>
        <p className="text-sm font-bold text-slate-700">No data to display</p>
        <p className="text-xs text-slate-400 mt-0.5">
          Charts will activate as soon as you record your first sales.
        </p>
      </div>
    );
  }

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.revenue, d.profit)),
    1000 // minimum ceiling to prevent divide-by-zero
  );

  const chartHeight = 180;
  const paddingBottom = 30;

  return (
    <div className="w-full">
      {/* Metric Selector Toggle */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" />
            <span>Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
            <span>Profit</span>
          </div>
        </div>

        <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
          <button
            id="toggle-chart-both"
            onClick={() => setMetric('both')}
            className={`px-3 py-1 rounded-md transition-all ${
              metric === 'both'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Both
          </button>
          <button
            id="toggle-chart-revenue"
            onClick={() => setMetric('revenue')}
            className={`px-3 py-1 rounded-md transition-all ${
              metric === 'revenue'
                ? 'bg-white text-blue-700 shadow-sm font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Revenue Only
          </button>
          <button
            id="toggle-chart-profit"
            onClick={() => setMetric('profit')}
            className={`px-3 py-1 rounded-md transition-all ${
              metric === 'profit'
                ? 'bg-white text-emerald-700 shadow-sm font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Profit Only
          </button>
        </div>
      </div>

      {/* SVG Responsive Chart */}
      <div className="relative pt-2 pb-1">
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div
            className="absolute -top-12 z-20 transform -translate-x-1/2 bg-slate-900 text-white text-xs rounded-lg py-1.5 px-3 shadow-xl pointer-events-none whitespace-nowrap transition-all duration-75 border border-slate-700"
            style={{
              left: `${((hoveredIndex + 0.5) / data.length) * 100}%`,
            }}
          >
            <div className="font-semibold text-slate-200 mb-0.5">
              {data[hoveredIndex].dayName} ({data[hoveredIndex].count} sales)
            </div>
            <div className="flex gap-3">
              <span className="text-blue-300">
                Rev: {formatCurrency(data[hoveredIndex].revenue)}
              </span>
              <span className="text-emerald-300 font-medium">
                Pft: {formatCurrency(data[hoveredIndex].profit)}
              </span>
            </div>
          </div>
        )}

        <div className="h-48 w-full flex items-end justify-between gap-2 sm:gap-4 px-2 border-b border-slate-200">
          {data.map((day, idx) => {
            const revHeight = (day.revenue / maxVal) * chartHeight;
            const pftHeight = (day.profit / maxVal) * chartHeight;
            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer group"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Bars container */}
                <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 max-w-[48px] h-[180px]">
                  {(metric === 'both' || metric === 'revenue') && (
                    <div
                      className={`w-1/2 rounded-t transition-all duration-300 ${
                        isHovered ? 'bg-blue-700' : 'bg-blue-600'
                      }`}
                      style={{
                        height: `${Math.max(revHeight, 4)}px`,
                      }}
                    />
                  )}

                  {(metric === 'both' || metric === 'profit') && (
                    <div
                      className={`w-1/2 rounded-t transition-all duration-300 ${
                        isHovered ? 'bg-emerald-600' : 'bg-emerald-500'
                      }`}
                      style={{
                        height: `${Math.max(pftHeight, 4)}px`,
                      }}
                    />
                  )}
                </div>

                {/* Day Label */}
                <div
                  className={`mt-2 text-[11px] truncate text-center w-full transition-colors ${
                    isHovered ? 'text-slate-900 font-bold' : 'text-slate-500'
                  }`}
                >
                  {day.dayName.split(',')[0]}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
