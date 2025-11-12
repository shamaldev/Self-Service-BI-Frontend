
import {
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  ComposedChart,
  
} from "recharts";

import { formatDate, formatNumber } from "../../utils/utils";
// import { getChartConfig, getResponsiveMargin, getParetoData }  from ;

import { getChartConfig,getResponsiveMargin,getParetoData,chartColors } from "../../utils/chartConfig";
const ParetoChart = ({ data, chartConfig, containerSize = { width: 400, height: 300 }, fontSize = 12, labelFontSize = 14, showLabels = true }) => {
  const { width: containerWidth } = containerSize;
  const categoryKey = chartConfig?.x_axis_col_name || "category";
  let valueKey = chartConfig?.y_axis_col_name || "value";
  if (Array.isArray(valueKey)) valueKey = valueKey[0];
  const xLabel = chartConfig?.x_axis_label || categoryKey;
  const yLabel = chartConfig?.y_axis_label || valueKey;
  const margin = getResponsiveMargin("paretochart", containerWidth);

  if (
    data.some(
      (item) =>
        !item.hasOwnProperty(categoryKey) ||
        !item.hasOwnProperty(valueKey)
    )
  ) {
    return (
      <div className="text-gray-400 text-sm">
        Data missing required keys
      </div>
    );
  }
  const paretoData = getParetoData(data, valueKey, categoryKey);
  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={paretoData}
            margin={{ ...margin, right: containerWidth < 500 ? 30 : 60 }}
          >
            <defs>
              <linearGradient id="paretoBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                <stop
                  offset="100%"
                  stopColor="#4f46e5"
                  stopOpacity={0.9}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey={categoryKey}
              interval={containerWidth < 500 ? 0 : "preserveStartEnd"}
              tick={{ fill: "#64748b", fontSize, fontWeight: 500 }}
              axisLine={false}
              tickLine={{ stroke: "#e2e8f0", strokeWidth: 1 }}
              tickFormatter={(val) => formatDate(val)}
              label={
                showLabels
                  ? {
                      value: xLabel,
                      position: "insideBottom",
                      offset: -5,
                      fill: "#64748b",
                      fontSize: labelFontSize,
                      fontWeight: 600,
                    }
                  : false
              }
            />
            <YAxis
              yAxisId="left"
              tickFormatter={(v) => formatNumber(v, false)}
              axisLine={false}
              tickLine={{ stroke: "#e2e8f0", strokeWidth: 1 }}
              tick={{ fill: "#64748b", fontSize, fontWeight: 500 }}
              label={
                showLabels
                  ? {
                      value: yLabel,
                      angle: -90,
                      position: "insideLeft",
                      offset: 0,
                      fill: "#64748b",
                      fontSize: labelFontSize,
                      fontWeight: 600,
                    }
                  : false
              }
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(v) => `${v.toFixed(0)}%`}
              domain={[0, 100]}
              axisLine={false}
              tickLine={{ stroke: "#e2e8f0", strokeWidth: 1 }}
              tick={{ fill: "#64748b", fontSize, fontWeight: 500 }}
            />
            <Tooltip
              formatter={(value, name) => [formatNumber(value), name]}
              contentStyle={{
                background: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
                fontSize: Math.max(11, fontSize - 1),
                fontWeight: 500,
                backdropFilter: "blur(10px)",
              }}
            />
            <Bar
              yAxisId="left"
              dataKey={valueKey}
              name="Value"
              fill="url(#paretoBar)"
              radius={[6, 6, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulative"
              name="Cumulative %"
              stroke={chartColors.pareto.line}
              strokeWidth={Math.max(2, containerWidth / 200)}
              dot={{
                r: Math.max(3, containerWidth / 200),
                fill: "#fff",
                strokeWidth: 2,
                stroke: chartColors.pareto.line,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ParetoChart;
