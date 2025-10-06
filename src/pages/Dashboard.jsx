import { useState, useEffect } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
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
  ComposedChart,
} from "recharts";
import { ResponsiveHeatMap } from "@nivo/heatmap";
import { ResponsiveFunnel } from "@nivo/funnel";
import {
  BanknotesIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

const iconMap = {
  dollar: CurrencyDollarIcon,
  chart: ChartBarIcon,
  trend: ArrowTrendingUpIcon,
  cash: BanknotesIcon,
};

const chartColors = {
  line: ["#2563eb", "#16a34a", "#dc2626", "#f59e0b"],
  bar: ["#9333ea", "#06b6d4", "#f43f5e", "#facc15"],
  pie: ["#1d4ed8", "#16a34a", "#dc2626", "#f59e0b", "#9333ea"],
};

// Convert string numbers to float
const normalizeData = (data) =>
  data.map((row) => {
    const obj = {};
    for (const key in row) {
      obj[key] =
        typeof row[key] === "string" && !isNaN(row[key])
          ? parseFloat(row[key])
          : row[key];
    }
    return obj;
  });

const formatNumber = (val) =>
  typeof val === "number"
    ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(val)
    : val;

const formatDate = (val) => {
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
};

// Heatmap data normalization
const getHeatmapData = (data, chartConfig) => {
  if (!Array.isArray(data) || data.length === 0) return [];
 
  const firstItem = data[0];
  const keys = Object.keys(firstItem);
 
  // Determine keys dynamically
  const yKey = Array.isArray(chartConfig?.y_axis_col_name) 
    ? chartConfig.y_axis_col_name[0] 
    : chartConfig?.y_axis_col_name;
  const xKey = chartConfig?.x_axis_col_name;
  const valueKey = chartConfig?.color_by;
 
  // Check if data is in "long format" (row-per-value with x, y, value columns)
  const hasAllKeys = yKey && xKey && valueKey && 
                     firstItem.hasOwnProperty(yKey) && 
                     firstItem.hasOwnProperty(xKey) && 
                     firstItem.hasOwnProperty(valueKey);
 
  if (hasAllKeys) {
    // Transform long format to Nivo format
    const grouped = data.reduce((acc, item) => {
      const rowId = item[yKey];
      const colId = item[xKey];
      const value = parseFloat(item[valueKey]) || 0;
 
      if (!rowId || colId === undefined || colId === null) return acc;
 
      if (!acc[rowId]) {
        acc[rowId] = { id: rowId, data: {} };
      }
 
      acc[rowId].data[colId] = value;
 
      return acc;
    }, {});
 
    return Object.values(grouped).map(item => ({
      id: item.id,
      data: Object.entries(item.data).map(([key, value]) => ({
        x: key,
        y: value
      }))
    }));
  }
 
  // Handle "wide format" (one row per series, columns are data points)
  // Assume first column is ID, rest are data
  const idColumn = keys.find(k => k.toLowerCase().includes('id') || k.toLowerCase().includes('name')) || keys[0];
  
  return data.map((item, idx) => {
    const dataPoints = [];
    Object.keys(item).forEach((key) => {
      if (key !== idColumn) {
        const value = parseFloat(item[key]);
        if (!isNaN(value)) {
          dataPoints.push({
            x: key,
            y: value
          });
        }
      }
    });
    return {
      id: item[idColumn] || `row-${idx}`,
      data: dataPoints
    };
  });
};

// Pareto data normalization
const getParetoData = (data, valueKey = "value", categoryKey = "category") => {
  const sorted = [...data].sort((a, b) => b[valueKey] - a[valueKey]);
  let cumulative = 0;
  return sorted.map((item) => {
    cumulative += item[valueKey];
    return { ...item, cumulative };
  });
};

// Chart Renderer
function ChartRenderer({ kpi, data, chartConfig }) {
  if (!data || !Array.isArray(data) || data.length === 0)
    return <div className="text-gray-400 text-sm">No data available</div>;

  const normalizedData = normalizeData(data);
  const xKey = chartConfig?.x_axis_col_name;
  const yKeys = Array.isArray(chartConfig?.y_axis_col_name)
    ? chartConfig.y_axis_col_name
    : chartConfig?.y_axis_col_name
    ? [chartConfig.y_axis_col_name]
    : [];

  switch (kpi.chart_type) {
    case "line_chart":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={normalizedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey={xKey} tickFormatter={formatDate} />
            <YAxis tickFormatter={formatNumber} />
            <Tooltip formatter={formatNumber} labelFormatter={formatDate} />
            <Legend />
            {yKeys.map((yKey, i) => (
              <Line
                key={yKey}
                type="monotone"
                dataKey={yKey}
                stroke={chartColors.line[i % chartColors.line.length]}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );

    case "vertical_bar_chart":
    case "stacked_bar_chart":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={normalizedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey={xKey} type="category" />
            <YAxis tickFormatter={formatNumber} />
            <Tooltip formatter={formatNumber} />
            <Legend />
            {yKeys.map((yKey, i) => (
              <Bar
                key={yKey}
                dataKey={yKey}
                stackId={
                  kpi.chart_type === "stacked_bar_chart" ? "a" : undefined
                }
                fill={chartColors.bar[i % chartColors.bar.length]}
                radius={[6, 6, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );

    case "horizontal_bar_chart":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={normalizedData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis type="number" tickFormatter={formatNumber} />
            <YAxis dataKey={xKey} type="category" />
            <Tooltip formatter={formatNumber} />
            <Legend />
            {yKeys.map((yKey, i) => (
              <Bar
                key={yKey}
                dataKey={yKey}
                fill={chartColors.bar[i % chartColors.bar.length]}
                radius={[6, 6, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );

    case "pie_chart":
      const pieKey = yKeys[0];
      if (!pieKey) return <div>No data for pie chart</div>;
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip formatter={formatNumber} />
            <Legend />
            <Pie
              data={normalizedData}
              dataKey={pieKey}
              nameKey={xKey}
              outerRadius={70}
            >
              {normalizedData.map((_, idx) => (
                <Cell
                  key={idx}
                  fill={chartColors.pie[idx % chartColors.pie.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      );

    case "funnel_chart":
      const funnelKey = yKeys[0];
      if (!funnelKey) return <div>No funnel data</div>;
      const funnelData = normalizedData.map((d) => ({
        id: d.stage || d[xKey],
        value: parseFloat(d[funnelKey]),
      }));
      return (
        <ResponsiveFunnel
          data={funnelData}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          colors={{ scheme: "category10" }}
          valueFormat={formatNumber}
          labelColor={{ from: "color", modifiers: [["darker", 2]] }}
          borderWidth={1}
          borderColor={{ from: "color", modifiers: [["darker", 0.5]] }}
        />
      );

    case "heatmap":
    case "heat_map":
      const heatmapData = getHeatmapData(data, chartConfig);
      if (heatmapData.length === 0) return <div>No heatmap data</div>;

      return (
        <div style={{ height: "100%", width: "100%" }}>
          <ResponsiveHeatMap
            data={heatmapData}
            margin={{ top: 60, right: 90, bottom: 60, left: 150 }}
           colors={{ type: "sequential", scheme: "reds" }}
            axisTop={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: -45,
              legend: chartConfig?.x_axis_label || "",
              legendOffset: 46,
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: chartConfig?.y_axis_label || "",
              legendPosition: "middle",
              legendOffset: -120,
            }}
            enableLabels={false}
            labelTextColor={{ from: "color", modifiers: [["darker", 1.6]] }}
            tooltip={({ cell }) => (
              <div
                style={{
                  background: "white",
                  padding: "9px 12px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                <strong>{cell.serieId}</strong>
                <br />
                {cell.data.x}: {formatNumber(cell.data.y)}
              </div>
            )}
          />
        </div>
      );

    case "pareto_chart":
      const paretoData = getParetoData(normalizedData, yKeys[0], xKey);
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={paretoData}>
            <CartesianGrid stroke="#f5f5f5" />
            <XAxis dataKey={xKey} />
            <YAxis yAxisId="left" orientation="left" />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(v) => v + "%"}
            />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey={yKeys[0]} fill="#8884d8" />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulative"
              stroke="#ff7300"
            />
          </ComposedChart>
        </ResponsiveContainer>
      );

    default:
      return (
        <div className="text-gray-500 text-sm">Unsupported chart type</div>
      );
  }
}

// Dashboard
export default function Dashboard() {
  const [kpis, setKpis] = useState([]);
  const [charts, setCharts] = useState([]);
  const [layouts, setLayouts] = useState({});
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await axios.post(
          "https://91c22476bcdd.ngrok-free.app/generate-dashboard",
          {
            persona: "Executive / CFO (Strategic Focus)",
            goal: "Get a big-picture view of financial health and growth trends",
            catalog: "finance_catalog",
            schema: "oracle_master_data",
          },
          { timeout: 600000 }
        );

        const kpiData = Array.isArray(response.data.kpis)
          ? response.data.kpis
          : [];
        const chartData = Array.isArray(response.data.dashboard_config)
          ? response.data.dashboard_config
          : [];
        setKpis(kpiData);
        setCharts(chartData);

        const defaultLayouts = {};
        defaultLayouts.lg = [];

        // KPIs layout: 4 per row
        kpiData.forEach((_, i) => {
          defaultLayouts.lg.push({
            i: `kpi-${i}`,
            x: (i % 4) * 3,
            y: Math.floor(i / 4) * 4,
            w: 3,
            h: 4,
          });
        });

        // Charts layout: 2 per row
        chartData.forEach((_, i) => {
          defaultLayouts.lg.push({
            i: `chart-${i}`,
            x: (i % 2) * 6,
            y: Math.floor(i / 2) * 6 + Math.ceil(kpiData.length / 4) * 4,
            w: 6,
            h: 6,
          });
        });

        setLayouts(defaultLayouts);
      } catch (err) {
        console.error(err);
      }
    }
    fetchDashboardData();
  }, []);

  const handleLayoutChange = (_, allLayouts) => setLayouts(allLayouts);
  const resetLayout = () => setResetKey((prev) => prev + 1);

  if (!layouts.lg)
    return <div className="text-gray-500 p-4">Loading dashboard...</div>;

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            CFO Financial Dashboard
          </h1>
        </div>
        <button
          onClick={resetLayout}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-blue-600"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Reset Layout
        </button>
      </header>

      <ResponsiveGridLayout
        key={resetKey}
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
        cols={{ lg: 12, md: 12, sm: 6 }}
        rowHeight={28}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        isDraggable
        isResizable
        onLayoutChange={handleLayoutChange}
      >
        {kpis.map((kpi, idx) => {
          const Icon = iconMap[kpi.icon] || CurrencyDollarIcon;
          return (
            <div key={`kpi-${idx}`}>
              <div className="bg-white rounded-lg border shadow-sm h-full flex items-center gap-3 p-4 cursor-move">
                <div className="p-2 rounded-lg bg-blue-50 flex-shrink-0">
                  <Icon className="h-7 w-7 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                    {kpi.title}
                  </p>
                  <p className="text-base sm:text-lg font-semibold text-gray-900">
                    {formatNumber(kpi.value)}
                  </p>
                  <p
                    className={`text-xs font-medium ${
                      kpi.changeType === "positive"
                        ? "text-green-600"
                        : kpi.changeType === "negative"
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {kpi.change}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {charts.map((chart, idx) => (
          <div key={`chart-${idx}`}>
            <div className="bg-white rounded-lg border shadow-sm h-full flex flex-col overflow-hidden cursor-move">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm sm:text-base font-semibold text-gray-800 truncate">
                  {chart.chart_config?.title || chart.kpi?.title || "Chart"}
                </h2>
              </div>
              <div className="flex-1 p-3">
                <ChartRenderer
                  kpi={chart.kpi || chart.chart_config}
                  data={chart.data}
                  chartConfig={chart.chart_config}
                />
              </div>
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}

