
// src/pages/ChartRenderer.jsx
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { HeatMapGrid } from "react-heatmap-grid";
import React from "react";

const chartColors = {
  line: ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"],
  bar: ["#2563eb", "#7c3aed", "#db2777", "#dc2626", "#059669", "#0891b2"],
  pie: ["#6366f1", "#a855f7", "#ec4899", "#f97316", "#14b8a6", "#0ea5e9"],
  funnel: ["#818cf8", "#c084fc", "#f472b6", "#fb923c"],
  heat: ["#f87171", "#fb923c", "#facc15", "#4ade80", "#60a5fa"],
};

// Truncate labels
const truncateLabel = (label, maxLength = 15) => {
  if (!label) return "";
  const str = String(label);
  return str.length > maxLength ? str.substring(0, maxLength) + "..." : str;
};

// Normalize data
const normalizeData = (data) =>
  data.map((row) => {
    const normalized = {};
    for (const key in row) {
      const val = row[key];
      normalized[key] =
        typeof val === "string" && !isNaN(val) ? parseFloat(val) : val;
    }
    return normalized;
  });

export default function ChartRenderer({ kpi, data, chartConfig, chartType }) {
  if (!kpi || !chartConfig)
    return <div className="text-gray-400 text-sm">Configuration missing</div>;
  if (!Array.isArray(data) || data.length === 0)
    return <div className="text-gray-400 text-sm">No data</div>;

  let normalizedData;
  try {
    normalizedData = normalizeData(data);
  } catch (err) {
    return <div className="text-red-500 text-sm">Error processing data</div>;
  }

  console.log("Rendering chart:", chartType, {
    title: kpi.title,
    x: chartConfig.x_axis_col_name,
    y: chartConfig.y_axis_col_name,
    sample: normalizedData[0],
  });

  switch (chartType) {
    case "line_chart":
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={normalizedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={chartConfig.x_axis_col_name}
              label={{
                value: chartConfig.x_axis_label || chartConfig.x_axis_col_name,
                position: "insideBottom",
                offset: -40,
              }}
              angle={-45}
              textAnchor="end"
              height={60}
              tickFormatter={(v) => truncateLabel(v, 10)}
            />
            <YAxis
              label={{
                value:
                  chartConfig.y_axis_label ||
                  chartConfig.y_axis_col_name?.join(", "),
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip />
            <Legend />
            {chartConfig.y_axis_col_name.map((yKey, idx) => (
              <Line
                key={idx}
                type="monotone"
                dataKey={yKey}
                stroke={chartColors.line[idx % chartColors.line.length]}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );

    case "bar_chart":
    case "horizontal_bar_chart":
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            layout={chartType === "horizontal_bar_chart" ? "vertical" : "horizontal"}
            data={normalizedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type={chartType === "horizontal_bar_chart" ? "number" : "category"}
              dataKey={
                chartType === "horizontal_bar_chart"
                  ? null
                  : chartConfig.x_axis_col_name
              }
            />
            <YAxis
              type={chartType === "horizontal_bar_chart" ? "category" : "number"}
              dataKey={
                chartType === "horizontal_bar_chart"
                  ? chartConfig.x_axis_col_name
                  : null
              }
            />
            <Tooltip />
            <Legend />
            {chartConfig.y_axis_col_name.map((yKey, idx) => (
              <Bar
                key={idx}
                dataKey={yKey}
                fill={chartColors.bar[idx % chartColors.bar.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );

    case "pie_chart":
      const pieKey = Array.isArray(chartConfig.y_axis_col_name)
        ? chartConfig.y_axis_col_name[0]
        : chartConfig.y_axis_col_name;
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={normalizedData}
              dataKey={pieKey}
              nameKey={chartConfig.x_axis_col_name}
              outerRadius={90}
              label={(entry) =>
                truncateLabel(entry[chartConfig.x_axis_col_name], 10)
              }
            >
              {normalizedData.map((_, idx) => (
                <Cell
                  key={idx}
                  fill={chartColors.pie[idx % chartColors.pie.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );

    case "funnel_chart":
      // Simulated funnel using vertical BarChart
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            layout="vertical"
            data={normalizedData.sort(
              (a, b) => b[chartConfig.y_axis_col_name[0]] - a[chartConfig.y_axis_col_name[0]]
            )}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <XAxis type="number" />
            <YAxis
              type="category"
              dataKey={chartConfig.x_axis_col_name}
              tickFormatter={(v) => truncateLabel(v, 10)}
            />
            <Tooltip />
            <Bar
              dataKey={chartConfig.y_axis_col_name[0]}
              fill={chartColors.funnel[0]}
            />
          </BarChart>
        </ResponsiveContainer>
      );

    case "heat_map":
      const xLabels = normalizedData.map(
        (d) => d[chartConfig.x_axis_col_name]
      );
      const yLabels = chartConfig.y_axis_col_name;
      const values = yLabels.map((y) =>
        normalizedData.map((d) => d[y] || 0)
      );

      return (
        <div className="overflow-x-auto">
          <HeatMapGrid
            data={values}
            xLabels={xLabels}
            yLabels={yLabels}
            cellHeight="2rem"
            cellWidth="2rem"
            square
            xLabelsPos="bottom"
            yLabelsPos="left"
          />
        </div>
      );

    default:
      return (
        <div className="text-gray-500 text-sm">
          Unsupported chart type: {chartType}
        </div>
      );
  }
}
