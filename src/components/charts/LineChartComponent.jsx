import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { formatDate, formatNumber } from "../../utils/utils";
import { getResponsiveMargin, chartColors } from "../../utils/chartConfig";

const LineChartComponent = ({
  data,
  chartConfig,
  containerSize = { width: 400, height: 300 },
  fontSize = 12,
  labelFontSize = 14,
  showLabels = true,
}) => {
  const { width: containerWidth, height: containerHeight } = containerSize || { width: 400, height: 300 };
  const xKey = chartConfig?.x_axis_col_name || Object.keys(data[0])[0] || "x";
  const yKeys = Array.isArray(chartConfig?.y_axis_col_name)
    ? chartConfig.y_axis_col_name
    : [chartConfig?.y_axis_col_name || Object.keys(data[0]).find((k) => k !== xKey) || "y"];
  const xLabel = chartConfig?.x_axis_label || xKey;
  const yLabel = chartConfig?.y_axis_label || yKeys.join(", ");
  const margin = getResponsiveMargin("linechart", containerWidth);
  const [visibleKeys, setVisibleKeys] = useState(
    Object.fromEntries(yKeys.map((y) => [y, true]))
  );
  const toggleSeries = (key) =>
    setVisibleKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  const transformedData = data
    .map((item) => {
      const point = { [xKey]: item[xKey] };
      yKeys.forEach((yKey) => (point[yKey] = parseFloat(item[yKey]) || 0));
      return point;
    })
    .sort((a, b) => new Date(a[xKey]) - new Date(b[xKey]));

  const CustomLegend = () => (
    <div className="flex flex-wrap justify-center gap-3 mt-4">
      {yKeys.map((yKey, i) => {
        const color = chartColors.line[i % chartColors.line.length];
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
          <LineChart data={transformedData} margin={margin}>
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
              const color = chartColors.line[i % chartColors.line.length];
              return (
                <Line
                  key={yKey}
                  type="monotone"
                  dataKey={yKey}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 4, fill: color, stroke: "#fff", strokeWidth: 2 }}
                  strokeDasharray={i > 0 ? "4 4" : ""}
                  activeDot={{ r: 6 }}
                  animationDuration={800}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <CustomLegend />
    </motion.div>
  );
};

export default LineChartComponent;