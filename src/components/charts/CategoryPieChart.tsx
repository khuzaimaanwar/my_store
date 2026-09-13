import React, { useState } from 'react';
import { CategoryStockData } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { PieChart } from 'lucide-react';

interface CategoryPieChartProps {
  data: CategoryStockData[];
}

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data }) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const totalValue = data.reduce((acc, d) => acc + d.value, 0);

  if (data.length === 0 || totalValue === 0) {
    return (
      <div className="h-48 w-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
          <PieChart className="w-5 h-5" />
        </div>
        <p className="text-sm font-bold text-slate-700">No data to display</p>
        <p className="text-xs text-slate-400 mt-0.5">
          Add products across categories to view stock distribution.
        </p>
      </div>
    );
  }

  // Generate SVG arcs for a Donut Chart
  let cumulativeAngle = 0;
  const size = 180;
  const center = size / 2;
  const radius = 70;
  const innerRadius = 45;

  const slices = data.map((item) => {
    const fraction = item.value / totalValue;
    const angle = fraction * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle += angle;

    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const ix1 = center + innerRadius * Math.cos(startRad);
    const iy1 = center + innerRadius * Math.sin(startRad);
    const ix2 = center + innerRadius * Math.cos(endRad);
    const iy2 = center + innerRadius * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    // SVG path for donut slice
    const pathData = `
      M ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
      L ${ix2} ${iy2}
      A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix1} ${iy1}
      Z
    `;

    return {
      ...item,
      pathData,
      startAngle,
      endAngle,
      fraction,
    };
  });

  const activeItem = hoveredCategory
    ? data.find((d) => d.category === hoveredCategory)
    : null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
      {/* SVG Donut */}
      <div className="relative flex-shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {slices.map((slice) => {
            const isHovered = hoveredCategory === slice.category;
            return (
              <path
                key={slice.category}
                d={slice.pathData}
                fill={slice.color}
                opacity={hoveredCategory ? (isHovered ? 1 : 0.45) : 0.9}
                className="transition-all duration-200 cursor-pointer stroke-white stroke-2"
                onMouseEnter={() => setHoveredCategory(slice.category)}
                onMouseLeave={() => setHoveredCategory(null)}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            {activeItem ? activeItem.category : 'Total Value'}
          </span>
          <span className="text-xs font-bold text-slate-800 leading-tight">
            {activeItem ? formatCurrency(activeItem.value) : formatCurrency(totalValue)}
          </span>
          {activeItem && (
            <span className="text-[10px] text-slate-500">
              {activeItem.percentage}% ({activeItem.quantity} pcs)
            </span>
          )}
        </div>
      </div>

      {/* Legend & Breakdown */}
      <div className="flex-1 w-full space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {data.map((item) => (
          <div
            key={item.category}
            onMouseEnter={() => setHoveredCategory(item.category)}
            onMouseLeave={() => setHoveredCategory(null)}
            className={`flex items-center justify-between text-xs py-1 px-2 rounded cursor-pointer transition-colors ${
              hoveredCategory === item.category ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-700 truncate">{item.category}</span>
            </div>
            <div className="flex items-center gap-3 font-medium flex-shrink-0">
              <span className="text-slate-900">{formatCurrency(item.value)}</span>
              <span className="text-slate-400 text-[11px] w-10 text-right">
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
