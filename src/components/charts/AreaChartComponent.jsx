import React, { useState } from "react";
import {
  AreaChart,
  Area,
  Line, // Added import for Line component
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { formatDate, formatNumber } from "../../utils/utils";
import { getResponsiveMargin, chartColors } from "../../utils/chartConfig";

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

  // Debug log: Check transformed data in console
  console.log('Transformed Data:', transformedData);

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
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300
              ${
                active
                  ? "bg-white text-gray-800 border border-gray-300"
                  : "bg-gray-100 text-gray-400 border border-gray-200 opacity-60"
              }`}
            style={{ borderLeft: `6px solid ${color}` }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: color, opacity: active ? 1 : 0.4 }}
            ></span>
            <span className="font-medium">{yKey}</span>
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
      <div className="flex-1 w-full min-h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={transformedData}
            margin={margin}
            isAnimationActive={false} // Disabled to rule out animation issues
          >
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
                    stopOpacity={0.6}
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
            {/* Areas for fills only (no stroke to avoid coverage issues) */}
           {yKeys.map((yKey, i) => {
              if (!visibleKeys[yKey]) return null;
              const color = chartColors.area[i % chartColors.area.length];
              return (
                <Area
                  key={yKey}
                  type="monotone"
                  dataKey={yKey}
                  stroke={color}
                  strokeWidth={2.5}
                  fill={`url(#color${i})`}
                  fillOpacity={1}
                  dot={false}
                  activeDot={{ 
                    r: 5, 
                    strokeWidth: 2, 
                    stroke: "#fff", 
                    fill: color,
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
                  }}
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                  connectNulls={false}
                />
              );
            })}
            {/* Lines for visible strokes on top of all fills */}
            {yKeys.map((yKey, i) => {
              if (!visibleKeys[yKey]) return null;
              // Temporarily use black for first series to test visibility; revert to color once confirmed
              const testColor = i === 0 ? '#000' : chartColors.area[i % chartColors.area.length];
              return (
                <Line
                  key={`line-${yKey}`}
                  type="monotone"
                  dataKey={yKey}
                  stroke={testColor}
                  strokeWidth={4} // Increased for better visibility
                  strokeOpacity={1} // Explicit full opacity
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff", fill: testColor }} // Slightly larger for hover test
                  isAnimationActive={false} // Disabled to rule out animation issues
                  animationDuration={0}
                  connectNulls={false}
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