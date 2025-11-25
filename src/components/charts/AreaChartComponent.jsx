import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
// Mock utils for demo
const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};
const formatNumber = (value, compact = false) => {
  if (value === null || value === undefined) return "";
  return new Intl.NumberFormat('en-US', {
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: 2
  }).format(value);
};
const getResponsiveMargin = (type, width) => {
  if (width < 400) return { top: 10, right: 10, left: 0, bottom: 20 };
  return { top: 20, right: 30, left: 20, bottom: 40 };
};
const chartColors = {
  area: ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"],
};

const AreaChartComponent = ({
  data,
  chartConfig,
  containerSize = { width: 400, height: 300 },
  fontSize = 12,
  labelFontSize = 14,
  showLabels = true,
}) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        No data available
      </div>
    );
  }
  const { width: containerWidth } = containerSize || { width: 400, height: 300 };
  const xKey = chartConfig?.x_axis_col_name || Object.keys(data[0])[0] || "x";
  const yKeys = Array.isArray(chartConfig?.y_axis_col_name)
    ? chartConfig.y_axis_col_name
    : [chartConfig?.y_axis_col_name || Object.keys(data[0]).find((k) => k !== xKey) || "y"];
  if (yKeys.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Missing y-axis data columns
      </div>
    );
  }
  const xLabel = chartConfig?.x_axis_label || xKey;
  const yLabel = chartConfig?.y_axis_label || yKeys.join(", ");
  const margin = getResponsiveMargin("areachart", containerWidth);
  const [visibleKeys, setVisibleKeys] = useState(
    Object.fromEntries(yKeys.map((y) => [y, true]))
  );
  const toggleSeries = (key) =>
    setVisibleKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  const transformedData = data
    .map((item) => {
      const point = { [xKey]: item[xKey] };
      yKeys.forEach((yKey) => {
        const rawValue = (item[yKey] || '').toString().replace(/[^\d.-]/g, '');
        point[yKey] = parseFloat(rawValue) || 0;
      });
      return point;
    })
    .sort((a, b) => {
      const dateA = new Date(a[xKey]);
      const dateB = new Date(b[xKey]);
      return isNaN(dateA.getTime()) ?
        (a[xKey] < b[xKey] ? -1 : 1) :
        dateA - dateB;
    });
  const CustomLegend = () => (
    <div className="flex flex-wrap justify-center gap-3 mt-4">
      {yKeys.map((yKey, i) => {
        const color = chartColors.area[i % chartColors.area.length];
        const active = visibleKeys[yKey];
        return (
          <motion.button
            key={yKey}
            onClick={() => toggleSeries(yKey)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              ${
                active
                  ? "bg-white text-gray-900 border border-gray-200 shadow-md hover:shadow-lg hover:bg-gray-50"
                  : "bg-gray-100 text-gray-500 border border-gray-200 shadow-sm hover:bg-gray-200 hover:text-gray-600 line-through opacity-70"
              }`}
            style={{ borderLeft: `4px solid ${active ? color : `${color}80`}` }}
            aria-label={`Toggle visibility of ${yKey} series ${active ? '(visible)' : '(hidden)'}`}
            title={`Click to ${active ? 'hide' : 'show'} ${yKey} series`}
          >
            <motion.span
              className="w-3 h-3 rounded-full border-2 border-current"
              style={{ backgroundColor: active ? color : 'transparent', borderColor: color }}
              initial={{ scale: 0.8 }}
              animate={{ scale: active ? 1 : 0.6, opacity: active ? 1 : 0.5 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            />
            <span className={`font-semibold text-sm truncate max-w-[120px] transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-60'}`}>
              {yKey}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
  return (
    <motion.div
      className="flex flex-col h-full w-full p-2"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={transformedData} margin={margin}>
            <defs>
              {yKeys.map((yKey, i) => (
                <linearGradient
                  key={yKey}
                  id={`color${i}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={chartColors.area[i % chartColors.area.length]}
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor={chartColors.area[i % chartColors.area.length]}
                    stopOpacity={0.05}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} />
            <XAxis
              dataKey={xKey}
              tick={{ fill: "#64748b", fontSize, fontWeight: 500 }}
              tickFormatter={formatDate}
              axisLine={false}
              tickLine={{ stroke: "#cbd5e1" }}
              label={
                showLabels
                  ? {
                      value: xLabel,
                      position: "insideBottom",
                      offset: -5,
                      fill: "#475569",
                      fontSize: labelFontSize,
                      fontWeight: 600,
                    }
                  : false
              }
            />
            <YAxis
              tickFormatter={(v) => formatNumber(v, false)}
              axisLine={false}
              tickLine={{ stroke: "#cbd5e1" }}
              tick={{ fill: "#64748b", fontSize, fontWeight: 500 }}
              label={
                showLabels
                  ? {
                      value: yLabel,
                      angle: -90,
                      position: "insideLeft",
                      fill: "#475569",
                      fontSize: labelFontSize,
                      fontWeight: 600,
                    }
                  : false
              }
            />
            <Tooltip
              formatter={(value, name) => [formatNumber(value), name]}
              labelFormatter={formatDate}
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
                padding: "8px 12px",
                fontSize: fontSize - 1,
              }}
            />
            {yKeys.map((yKey, i) => {
              if (!visibleKeys[yKey]) return null;
              const color = chartColors.area[i % chartColors.area.length];
              return (
                <Area
                  key={yKey}
                  type="monotone"
                  dataKey={yKey}
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#color${i})`}
                  fillOpacity={1}
                  dot={{ r: 4, fill: color, stroke: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                  animationDuration={800}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <CustomLegend />
    </motion.div>
  );
};

export default AreaChartComponent;