import {
  ChatBubbleLeftEllipsisIcon,
  UserCircleIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  ChartBarIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  StopCircleIcon,
} from "@heroicons/react/24/outline";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  Label,
} from "recharts";
import { API_BASE_URL } from "../config/axios";
import Cookies from "js-cookie";
import { useParams } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const COLORS = [
  "#A5B4FC", "#C4B5FD", "#FBB6CE", "#6EE7B7", "#FDE68A",
  "#FCA5A5", "#67E8F9", "#86EFAC", "#FDBA74", "#C4B5FD",
];

// ----------------- Utilities -----------------
function prettyLabel(k = "") {
  if (!k) return "";
  return String(k)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
function formatTooltipValue(v) {
  if (v === null || v === undefined) return "-";
  if (typeof v === "number") {
    if (Math.abs(v) >= 1_000_000) return v.toLocaleString();
    return Number(v.toFixed(2)).toLocaleString();
  }
  return String(v);
}
function renderAnswer(text) {
  if (!text) return null;
  const lines = text.split('\n').filter(l => l.trim());
  const hasBullets = lines.some(l => l.trim().startsWith('- ') || l.trim().startsWith('* '));
  if (hasBullets || lines.length > 1) {
    return (
      <ul className="space-y-2 ml-4 list-disc list-inside">
        {lines.map((line, i) => (
          <li key={i} className="text-slate-700 leading-relaxed">
            {line.replace(/^- |\*- /, '').trim()}
          </li>
        ))}
      </ul>
    );
  }
  return <p className="text-slate-700 leading-relaxed">{text}</p>;
}
function inferConfig(chart) {
  const data = chart.data || [];
  const cfg = chart.chart_config || {};
  const chartType = chart.chart_type || (cfg.series ? "line_chart" : "vertical_bar_chart");
  const first = data[0] || {};
  const keys = Object.keys(first);
  const stringKeys = keys.filter(
    (k) =>
      typeof first[k] === "string" &&
      new Set(data.map((d) => d[k])).size < Math.max(3, data.length / 2)
  );
  const numericKeys = keys.filter((k) => typeof first[k] === "number");
  const isHorizontal = chartType === "horizontal_bar_chart";
  let xKey, yKeys;
  if (isHorizontal) {
    xKey = Array.isArray(cfg.y_axis_col_name) ? cfg.y_axis_col_name[0] : cfg.y_axis_col_name;
    yKeys = cfg.x_axis_col_name ? [cfg.x_axis_col_name] : null;
  } else {
    xKey = Array.isArray(cfg.x_axis_col_name) ? cfg.x_axis_col_name[0] : cfg.x_axis_col_name;
    yKeys = Array.isArray(cfg.y_axis_col_name) ? cfg.y_axis_col_name : cfg.y_axis_col_name ? [cfg.y_axis_col_name] : null;
  }
  if (!xKey) {
    const pref = keys.find((k) =>
      ["name", "category", "state", "month", "date", "label"].some((p) =>
        k.toLowerCase().includes(p)
      )
    );
    xKey = pref || stringKeys[0] || keys[0];
  }
  if (!yKeys) {
    const candidates = numericKeys.filter((k) => k !== xKey);
    if (candidates.length === 0 && keys.includes("value"))
      candidates.push("value");
    yKeys = candidates.length > 0 ? candidates : ["value"];
  }
  const xAxisLabel = cfg.x_axis_label || prettyLabel(xKey);
  const yAxisLabel =
    cfg.y_axis_label ||
    (yKeys && yKeys.length === 1
      ? prettyLabel(yKeys[0])
      : prettyLabel(yKeys?.join(", ")));
  // Updated: Skip series inference if already pivoted
  const seriesKey =
    cfg._inferred_y_keys ? null :
    (cfg.series || cfg.cluster_by || cfg.stack_by || cfg.color_by || null);
  return { xKey, yKeys, xAxisLabel, yAxisLabel, seriesKey, config: cfg };
}
function pivotLongToWide(data, xKey, seriesKey, valueKey) {
  const uniqueX = [...new Set(data.map((d) => d[xKey]))];
  const uniqueSeries = [...new Set(data.map((d) => d[seriesKey]))];
  return uniqueX.map((xVal) => {
    const row = { [xKey]: xVal };
    uniqueSeries.forEach((s) => {
      const matches = data.filter(
        (d) => d[xKey] === xVal && d[seriesKey] === s
      );
      const sum = matches.reduce(
        (acc, m) => acc + (parseFloat(m[valueKey]) || 0),
        0
      );
      row[`${valueKey}_${s}`] = sum;
    });
    return row;
  });
}
// ----------------- Chart Renderer (Enhanced with better animations) -----------------
function renderChart(chart, height = 420, depth = 0) {
  if (depth > 5) {
    console.warn('Max recursion depth reached in renderChart; skipping pivot.');
    return <div className="text-red-400 italic p-4">Chart rendering error: Complex data structure.</div>;
  }
  let data = Array.isArray(chart.data) ? chart.data.slice() : [];
  let chartType =
    chart.chart_type ||
    (chart.chart_config?.series ? "line_chart" : "vertical_bar_chart");
  const cfg = chart.chart_config || {};
  if (!chartType && cfg.cumulative_line === "derived") {
    chartType = "pareto_chart";
  }
  const { xKey, yKeys, xAxisLabel, yAxisLabel, seriesKey, config } =
    inferConfig(chart);
  const probableValueKey =
    (config.y_axis_col_name &&
      (Array.isArray(config.y_axis_col_name)
        ? config.y_axis_col_name[0]
        : config.y_axis_col_name)) ||
    Object.keys(data[0] || {}).find(
      (k) => typeof (data[0] || {})[k] === "number"
    );
  if (seriesKey && probableValueKey && data[0] && seriesKey in data[0]) {
    // Guard: Skip if seriesKey === xKey (invalid config; prevents loop)
    if (seriesKey === xKey) {
      console.warn(`Skipping pivot: seriesKey (${seriesKey}) matches xKey (${xKey}). Check chart_config.`);
      // Fall through to normal rendering with original yKeys
    } else {
      data = pivotLongToWide(data, xKey, seriesKey, probableValueKey);
      const generatedSeries = [...new Set(chart.data.map((d) => d[seriesKey]))];
      const generatedYKeys = generatedSeries.map(
        (s) => `${probableValueKey}_${s}`
      );
      // Recursive call with depth +1
      return renderChart(
        {
          ...chart,
          data,
          chart_config: {
            ...chart.chart_config,
            _inferred_y_keys: generatedYKeys,
          },
        },
        height,
        depth + 1
      );
    }
  }
  const finalYKeysRaw =
    (chart.chart_config && chart.chart_config._inferred_y_keys) || yKeys;
  const finalYKeys = (
    Array.isArray(finalYKeysRaw) ? finalYKeysRaw : [finalYKeysRaw]
  ).filter(Boolean);
  const numericCandidates = Object.keys(data[0] || {}).filter(
    (k) => typeof data[0][k] === "number" && k !== xKey
  );
  const safeYKeys =
    finalYKeys.length > 0 &&
    finalYKeys.some((k) => numericCandidates.includes(k))
      ? finalYKeys.filter((k) => numericCandidates.includes(k))
      : numericCandidates.slice(0, 4);
  let processedData = data;
  if (chartType === "pareto_chart") {
    const primaryKey = safeYKeys[0];
    if (primaryKey && processedData.length > 0) {
      processedData = [...processedData].sort((a, b) => (b[primaryKey] || 0) - (a[primaryKey] || 0));
      let runningSum = 0;
      const totalSum = processedData.reduce((sum, d) => sum + (d[primaryKey] || 0), 0);
      processedData = processedData.map(d => {
        runningSum += (d[primaryKey] || 0);
        return {
          ...d,
          cumulative: totalSum > 0 ? Math.round((runningSum / totalSum) * 100 * 100) / 100 : 0
        };
      });
    }
  }
  const XLabel = ({ label }) => (
    <Label
      value={label}
      offset={-6}
      position="bottom"
      style={{ fill: "#374151", fontSize: 12 }}
    />
  );
  const YLabel = ({ label }) => (
    <Label
      value={label}
      angle={-90}
      position="insideLeft"
      style={{ textAnchor: "middle", fill: "#374151", fontSize: 12 }}
    />
  );
  const RightYLabel = ({ label }) => (
    <Label
      value={label}
      angle={90}
      position="insideRight"
      style={{ textAnchor: "middle", fill: "#374151", fontSize: 12 }}
    />
  );
  if (chartType === "pie_chart") {
    const categoryKey = config.category_col_name || xKey || "name";
    const valueKey = config.value_col_name || safeYKeys[0] || "value";
    const pieData = (chart.data || [])
      .map((d) => ({
        name: d[categoryKey] ?? "Unknown",
        value: Number(d[valueKey]) || 0,
      }))
      .filter((d) => d.value > 0);
    if (pieData.length === 0) {
      return (
        <div className="text-gray-400 italic p-4">
          No meaningful values for pie chart
        </div>
      );
    }
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="45%"
            outerRadius={110}
            label
          >
            {pieData.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={formatTooltipValue} />
          <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    );
  }
  if (
    [
      "vertical_bar_chart",
      "horizontal_bar_chart",
      "stacked_bar_chart",
      "clustered_bar_chart",
    ].includes(chartType)
  ) {
    const horizontal = chartType === "horizontal_bar_chart";
    const stacked = chartType === "stacked_bar_chart";
    const clustered = chartType === "clustered_bar_chart";
    const margin = { top: 18, right: 24, left: 18, bottom: 64 };
    const colorMap = {};
    safeYKeys.forEach((k, i) => {
      colorMap[k] = COLORS[i % COLORS.length];
    });
    if (safeYKeys.length === 0) {
      return (
        <div className="text-gray-400 italic p-4">
          No numeric series found to render the bar chart
        </div>
      );
    }
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={margin}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E6E9EE" />
          {horizontal ? (
            <>
              <XAxis type="number" tick={{ fontSize: 12, fill: "#374151" }}>
                {xAxisLabel && <YLabel label={xAxisLabel} />}
              </XAxis>
              <YAxis
                type="category"
                dataKey={xKey}
                tick={{ fontSize: 12, fill: "#374151" }}
              >
                {yAxisLabel && <XLabel label={yAxisLabel} />}
              </YAxis>
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: "#374151" }}>
                {xAxisLabel && <XLabel label={xAxisLabel} />}
              </XAxis>
              <YAxis tick={{ fontSize: 12, fill: "#374151" }}>
                {yAxisLabel && <YLabel label={yAxisLabel} />}
              </YAxis>
            </>
          )}
          <Tooltip
            formatter={(v, name) => [formatTooltipValue(v), prettyLabel(name)]}
            contentStyle={{ borderRadius: 8 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {safeYKeys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              name={prettyLabel(key)}
              fill={colorMap[key]}
              stackId={stacked ? "stackGroup" : undefined}
              barSize={clustered ? 20 : 28}
              radius={[6, 6, 0, 0]}
              animationBegin={120 + i * 80}
              animationDuration={700}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }
  if (chartType === "line_chart" || chartType === "line_area_chart") {
    const isArea = chartType === "line_area_chart";
    const margin = { top: 18, right: 24, left: 18, bottom: 64 };
    if (safeYKeys.length === 0) {
      return (
        <div className="text-gray-400 italic p-4">
          No numeric series found to render the line chart
        </div>
      );
    }
    return (
      <ResponsiveContainer width="100%" height={height}>
        {isArea ? (
          <AreaChart data={data} margin={margin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E6E9EE" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: "#374151" }}>
              {xAxisLabel && <XLabel label={xAxisLabel} />}
            </XAxis>
            <YAxis tick={{ fontSize: 12, fill: "#374151" }}>
              {yAxisLabel && <YLabel label={yAxisLabel} />}
            </YAxis>
            <Tooltip formatter={formatTooltipValue} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {safeYKeys.map((k, i) => (
              <Area
                key={k}
                type="monotone"
                dataKey={k}
                name={prettyLabel(k)}
                stroke={COLORS[i % COLORS.length]}
                fill={COLORS[i % COLORS.length]}
                fillOpacity={0.18}
                animationDuration={900}
              />
            ))}
          </AreaChart>
        ) : (
          <LineChart data={data} margin={margin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E6E9EE" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: "#374151" }}>
              {xAxisLabel && <XLabel label={xAxisLabel} />}
            </XAxis>
            <YAxis tick={{ fontSize: 12, fill: "#374151" }}>
              {yAxisLabel && <YLabel label={yAxisLabel} />}
            </YAxis>
            <Tooltip formatter={formatTooltipValue} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {safeYKeys.map((k, i) => (
              <Line
                key={k}
                type="monotone"
                dataKey={k}
                name={prettyLabel(k)}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={false}
                animationDuration={900}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    );
  }
  if (chartType === "pareto_chart") {
    const primary = safeYKeys[0];
    if (!primary)
      return (
        <div className="text-gray-400 italic p-4">
          No primary numeric series found for pareto
        </div>
      );
    const margin = { top: 18, right: 28, left: 18, bottom: 64 };
    return (
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={processedData} margin={margin}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E6E9EE" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: "#374151" }}>
            {xAxisLabel && <XLabel label={xAxisLabel} />}
          </XAxis>
          <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "#374151" }}>
            {yAxisLabel && <YLabel label={yAxisLabel} />}
          </YAxis>
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12, fill: "#374151" }}
            domain={[0, 100]}
          >
            <RightYLabel label="Cumulative %" />
          </YAxis>
          <Tooltip formatter={formatTooltipValue} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar
            yAxisId="left"
            dataKey={primary}
            name={prettyLabel(primary)}
            fill={COLORS[0]}
            barSize={32}
            animationDuration={700}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cumulative"
            name="Cumulative %"
            stroke={COLORS[3]}
            strokeWidth={2.4}
            animationDuration={900}
          />
        </ComposedChart>
      </ResponsiveContainer>
    );
  }
  return (
    <div className="text-gray-400 italic p-4">
      Unsupported chart type: {chartType}
    </div>
  );
}
// ----------------- Data Quality Alert (Enhanced with better motion) -----------------
function DataQualityAlert({ alert }) {
  if (!alert) return null;
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 border-l-4 border-amber-500 rounded-xl p-5 shadow-lg"
    >
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-bold text-amber-900 text-base mb-1">
            {alert.headline}
          </h4>
          <p className="text-sm text-amber-800 mb-2">
            {alert.details}
          </p>
          {alert.recommendation && (
            <div className="bg-white/60 rounded-lg p-3 mt-2">
              <p className="text-xs font-medium text-amber-900">
                <strong>Recommendation:</strong> {alert.recommendation}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
// ----------------- Executive Summary (Enhanced gradient) -----------------
function ExecutiveSummary({ summary }) {
  if (!summary) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 rounded-2xl shadow-2xl border border-indigo-500/20"
      whileHover={{ scale: 1.02 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-300/10 to-purple-300/10" />
      <div className="relative p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
            <SparklesIcon className="h-6 w-6 text-white" />
          </div>
          <h4 className="text-xl font-bold text-white">Executive Summary</h4>
        </div>
        <div className="text-indigo-100 leading-relaxed text-base">
          {renderAnswer(summary)}
        </div>
      </div>
    </motion.div>
  );
}
// ----------------- Simple Answer (Added subtle hover) -----------------
function SimpleAnswer({ answer }) {
  if (!answer) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="bg-white rounded-xl shadow-md border border-slate-200 p-5"
    >
      <div className="flex items-start gap-3">
        <LightBulbIcon className="h-6 w-6 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-slate-800 text-base mb-2">Analysis Result</h4>
          {renderAnswer(answer)}
        </div>
      </div>
    </motion.div>
  );
}
// ----------------- Key Insights (Grid with stagger animation) -----------------
function KeyInsights({ insights }) {
  if (!insights?.length) return null;
  return (
    <div className="space-y-4">
      <motion.h4 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-lg font-bold text-slate-800 flex items-center gap-2"
      >
        <ChartBarIcon className="h-6 w-6 text-indigo-600" />
        Key Insights
      </motion.h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {insights.map((insight, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden group"
            >
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 group-hover:from-indigo-600 group-hover:to-purple-600 transition-colors duration-300">
                <h5 className="font-bold text-white text-base">
                  {insight.headline}
                </h5>
                {insight.quantitative_summary && (
                  <div className="mt-2 flex items-center gap-4 text-white/90 text-sm">
                    <span className="font-semibold">
                      {insight.quantitative_summary.primary_metric}
                    </span>
                    <span className="text-white/70">
                      {insight.quantitative_summary.time_period}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-slate-700 mb-3 leading-relaxed">
                  {insight.business_impact}
                </p>
                {insight.supporting_evidence?.length > 0 && (
                  <div className="space-y-2">
                    {insight.supporting_evidence.map((evidence, eidx) => (
                      <div
                        key={eidx}
                        className="bg-slate-50 rounded-lg p-3 border border-slate-200"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                            {evidence.metric}
                          </span>
                          {evidence.confidence && (
                            <span className="text-xs text-slate-500">
                              Confidence: {evidence.confidence}%
                            </span>
                          )}
                        </div>
                        <div className="text-2xl font-bold text-indigo-600 mb-1">
                          {evidence.value}
                        </div>
                        <div className="text-xs text-slate-600">
                          {evidence.context}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {insight.confidence_score && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Confidence Score</span>
                      <span className="font-bold text-indigo-600">
                        {insight.confidence_score}%
                      </span>
                    </div>
                    <div className="mt-1 w-full bg-slate-200 rounded-full h-2">
                      <motion.div
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        initial={{ width: 0 }}
                        animate={{ width: `${insight.confidence_score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
// ----------------- Charts Grid (Staggered entrance) -----------------
function ChartsGrid({ charts }) {
  if (!charts?.length) return null;
  return (
    <div className="space-y-4">
      <motion.h4 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-lg font-bold text-slate-800 flex items-center gap-2"
      >
        <ChartBarIcon className="h-6 w-6 text-indigo-600" />
        Data Visualizations
      </motion.h4>
      <div className="grid grid-cols-1 gap-5">
        <AnimatePresence>
          {charts.map((c, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ delay: idx * 0.15 }}
              whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
              className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden group"
            >
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 border-b border-slate-200">
                <h5 className="text-sm font-semibold text-slate-800">
                  {c.title || c.chart_config?.title || `Analysis ${idx + 1}`}
                </h5>
                {c.purpose && (
                  <span className="text-xs text-slate-500 capitalize">
                    {c.purpose} Analysis
                  </span>
                )}
              </div>
              <div className="p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-full h-[380px]"
                >
                  {renderChart(c, 380)}
                </motion.div>
              </div>
              {c.row_count && (
                <div className="px-4 pb-3 text-xs text-slate-500">
                  Based on {c.row_count.toLocaleString()} data points
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
// ----------------- Strategic Recommendations (Enhanced interactions) -----------------
function StrategicRecommendations({ recommendations }) {
  if (!recommendations?.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl shadow-md border border-emerald-200 p-5"
    >
      <h4 className="font-bold text-emerald-800 text-base mb-4 flex items-center gap-2">
        <CheckCircleIcon className="h-6 w-6" />
        Strategic Recommendations
      </h4>
      <div className="space-y-3">
        {recommendations.map((rec, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            className="bg-white rounded-lg p-4 border border-emerald-200 shadow-sm group"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                {i + 1}
              </div>
              <div className="flex-1">
                <h5 className="font-semibold text-slate-800 mb-1">
                  {rec.action}
                </h5>
                <p className="text-sm text-slate-600 mb-2">
                  {rec.rationale}
                </p>
                <div className="flex items-center gap-4 text-xs">
                  {rec.urgency && (
                    <span className={`px-2 py-1 rounded-full font-medium ${
                      rec.urgency === 'immediate' ? 'bg-red-100 text-red-700' :
                      rec.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {rec.urgency.toUpperCase()}
                    </span>
                  )}
                  {rec.expected_impact && (
                    <span className="text-slate-500">
                      Impact: {rec.expected_impact}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
// ----------------- Root Cause Analysis (Subtle animation) -----------------
function RootCauseAnalysis({ analysis }) {
  if (!analysis) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-md border border-purple-200 p-5"
    >
      <h4 className="font-bold text-purple-800 text-base mb-3">
        Root Cause Analysis
      </h4>
      <div className="space-y-3">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-lg p-4 border-l-4 border-purple-500"
        >
          <h5 className="text-sm font-semibold text-slate-800 mb-1">
            Primary Driver
          </h5>
          <p className="text-slate-700">
            {analysis.primary_driver}
          </p>
        </motion.div>
        {analysis.secondary_factors?.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg p-4"
          >
            <h5 className="text-sm font-semibold text-slate-800 mb-2">
              Contributing Factors
            </h5>
            <ul className="space-y-1 text-sm text-slate-700">
              {analysis.secondary_factors.map((factor, i) => (
                <motion.li 
                  key={i} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-2"
                >
                  <span className="text-purple-500 mt-1">•</span>
                  <span>{factor}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
// ----------------- Next Steps (Enhanced clickable states) -----------------
function NextSteps({ actions = [], onFollowUpClick }) {
  const allActions = [...actions];
  if (!allActions.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md border border-slate-200 p-5"
    >
      <h4 className="font-semibold text-slate-800 text-base mb-3 flex items-center gap-2">
        <LightBulbIcon className="h-5 w-5 text-indigo-600" />
        Next Steps
      </h4>
      <div className="space-y-2">
        {allActions.map((action, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02, backgroundColor: "#f8fafc" }}
            whileTap={{ scale: 0.98 }}
            className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer border border-transparent hover:border-indigo-200 transition-all duration-200"
            onClick={() => onFollowUpClick(action?.action || action)}
          >
            <div className="flex-shrink-0 w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
              {i + 1}
            </div>
            <p className="text-sm text-slate-700 flex-1">{action?.action || action}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
// ----------------- ResultDisplay (Refactored) -----------------
function ResultDisplay({ result, onFollowUpClick }) {
  if (!result) return null;
  const { data_quality_alert, executive_summary, answer, key_insights, charts, strategic_recommendations, root_cause_analysis, recommended_actions = [], suggested_followups = [] } = result;
  return (
    <div className="space-y-5">
      <DataQualityAlert alert={data_quality_alert} />
      <ExecutiveSummary summary={executive_summary} />
      <SimpleAnswer answer={answer} />
      <KeyInsights insights={key_insights} />
      <ChartsGrid charts={charts} />
      <StrategicRecommendations recommendations={strategic_recommendations} />
      <RootCauseAnalysis analysis={root_cause_analysis} />
      <NextSteps actions={[...recommended_actions, ...suggested_followups]} onFollowUpClick={onFollowUpClick} />
    </div>
  );
}
// ----------------- MiniGame: Word Scramble (Modernized with motion) -----------------
function BusinessWordScramble({ onAnswer }) {
  const terms = [
    { scrambled: "OR I", original: "ROI", hint: "Return on Investment" },
    { scrambled: "ABDTIE", original: "DEBT", hint: "A financial obligation" },
    { scrambled: "SWOT", original: "SWOT", hint: "Analysis framework" },
    { scrambled: "KPI", original: "KPI", hint: "Key Performance Indicator" },
    { scrambled: "CEO", original: "CEO", hint: "Chief Executive Officer" },
    { scrambled: "CF O", original: "CFO", hint: "Chief Financial Officer" },
    { scrambled: "IPO", original: "IPO", hint: "Initial Public Offering" },
    { scrambled: "GREMER", original: "MERGER", hint: "Business combination" }
  ];
  const [currentTerm, setCurrentTerm] = useState(() => terms[Math.floor(Math.random() * terms.length)]);
  const [userGuess, setUserGuess] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [feedback, setFeedback] = useState("");
  const handleGuess = () => {
    if (revealed || !userGuess.trim()) return;
    const normalizedGuess = userGuess.trim().toUpperCase().replace(/\s/g, '');
    const normalizedOriginal = currentTerm.original.toUpperCase().replace(/\s/g, '');
    if (normalizedGuess === normalizedOriginal) {
      setFeedback(`✅ Correct! It's ${currentTerm.original}. ${currentTerm.hint}`);
      onAnswer(true);
    } else {
      setFeedback(`❌ Nope! It's ${currentTerm.original}. ${currentTerm.hint}`);
      onAnswer(false);
    }
    setRevealed(true);
    // Auto-next after 3 seconds
    setTimeout(() => {
      setCurrentTerm(terms[Math.floor(Math.random() * terms.length)]);
      setUserGuess("");
      setRevealed(false);
      setFeedback("");
    }, 3000);
  };
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-indigo-200 shadow-md max-w-md"
    >
      <h5 className="font-semibold text-indigo-700 mb-3 text-center">🔤 Business Word Scramble!</h5>
      <motion.div 
        animate={{ scale: revealed ? [1, 1.05, 1] : 1 }}
        transition={{ duration: 0.3 }}
        className="text-3xl font-bold text-center mb-4 text-indigo-600"
      >
        {currentTerm.scrambled}
      </motion.div>
      <p className="text-sm text-slate-600 text-center mb-3 italic">Unscramble to form a business term:</p>
      <input
        type="text"
        value={userGuess}
        onChange={(e) => setUserGuess(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleGuess()}
        placeholder="Your guess..."
        disabled={revealed}
        className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 mb-2 text-center uppercase"
      />
      <motion.button
        onClick={handleGuess}
        disabled={revealed || !userGuess.trim()}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        animate={{ scale: revealed ? 1 : 1 }}
        className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
          revealed || !userGuess.trim()
            ? 'bg-slate-300 cursor-not-allowed'
            : 'bg-indigo-500 hover:bg-indigo-600 text-white'
        }`}
      >
        {revealed ? "Next!" : "Unscramble!"}
      </motion.button>
      {feedback && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg text-center"
        >
          {feedback}
        </motion.div>
      )}
    </motion.div>
  );
}
// ----------------- Typing Indicator with MiniGame (Smooth progress) -----------------
function TypingIndicator({ progress }) {
  if (!progress) return null;
  const [score, setScore] = useState(0);
  const handleScrambleAnswer = (isCorrect) => {
    if (isCorrect) setScore(prev => prev + 1);
  };
  return (
    <div className="flex flex-col items-center gap-4 mb-4 animate-pulse">
      <div className="flex space-x-1">
        <motion.div 
          className="w-3 h-3 bg-indigo-500 rounded-full" 
          animate={{ y: [-5, 5, -5] }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{ animationDelay: '0ms' }}
        />
        <motion.div 
          className="w-3 h-3 bg-indigo-500 rounded-full" 
          animate={{ y: [-5, 5, -5] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.15 }}
          style={{ animationDelay: '150ms' }}
        />
        <motion.div 
          className="w-3 h-3 bg-indigo-500 rounded-full" 
          animate={{ y: [-5, 5, -5] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
          style={{ animationDelay: '300ms' }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600 text-center">
        {progress.message} (Scramble Score: {score})
      </span>
      <div className="flex-1 bg-gray-200 rounded-full h-1 w-32 overflow-hidden">
        <motion.div
          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress.progress || 0}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <BusinessWordScramble onAnswer={handleScrambleAnswer} />
    </div>
  );
}
// ----------------- getResponseText -----------------
function getResponseText(result) {
  if (!result) return '';
  let text = '';
  if (result.executive_summary) {
    text += result.executive_summary.replace(/\[.*?\]\(.*?\)/g, '').replace(/[*_~`]/g, '') + '. ';
  }
  if (result.answer) {
    text += result.answer.replace(/\[.*?\]\(.*?\)/g, '').replace(/[*_~`]/g, '') + '. ';
  }
  if (result.key_insights && result.key_insights.length > 0) {
    result.key_insights.forEach(insight => {
      text += insight.headline ? insight.headline + '. ' : '';
      text += insight.business_impact ? insight.business_impact + '. ' : '';
    });
  }
  if (result.strategic_recommendations && result.strategic_recommendations.length > 0) {
    result.strategic_recommendations.forEach(rec => {
      text += rec.action ? rec.action + '. ' : '';
      text += rec.rationale ? rec.rationale + '. ' : '';
    });
  }
  if (result.root_cause_analysis) {
    text += result.root_cause_analysis.primary_driver ? result.root_cause_analysis.primary_driver + '. ' : '';
    if (result.root_cause_analysis.secondary_factors) {
      result.root_cause_analysis.secondary_factors.forEach(factor => {
        text += factor + '. ';
      });
    }
  }
  return text.trim();
}
// ----------------- Message (Enhanced with AnimatePresence for smooth entry) -----------------
function Message({ from, text, timestamp, isTyping = false, progress = null, result = null, onFollowUpClick, onReadAloud, isSpeaking }) {
  const isAI = from === "ai";
  const responseText = isAI && result ? getResponseText(result) : '';
  const hasTextToRead = responseText.length > 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: isAI ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex items-start gap-4 mb-8 last:mb-0 ${isAI ? "justify-start" : "justify-end"}`}
    >
      {isAI && (
        <motion.div 
          className="flex-shrink-0"
          whileHover={{ scale: 1.05 }}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/20">
            <SparklesIcon className="h-5 w-5 text-white" />
          </div>
        </motion.div>
      )}
      <div className="flex flex-col max-w-[80%]">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className={`px-6 py-4 rounded-2xl shadow-lg transition-all duration-300 backdrop-blur-sm ${
            isAI
              ? "bg-white/90 border border-slate-200/50"
              : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xl"
          }`}
          whileHover={{ scale: 1.01 }}
        >
          {isTyping ? (
            <TypingIndicator progress={progress} />
          ) : result ? (
            <>
              <ResultDisplay result={result} onFollowUpClick={onFollowUpClick} />
              {hasTextToRead && (
                <div className="mt-4 flex justify-center">
                  <motion.button
                    onClick={() => onReadAloud(responseText)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                      isSpeaking
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                        : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                    }`}
                  >
                    {isSpeaking ? (
                      <>
                        <StopCircleIcon className="h-4 w-4" />
                        Stop Reading
                      </>
                    ) : (
                      <>
                        <SpeakerWaveIcon className="h-4 w-4" />
                        Read Aloud
                      </>
                    )}
                  </motion.button>
                </div>
              )}
            </>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {text}
            </p>
          )}
        </motion.div>
        {timestamp && (
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`text-xs mt-2 flex justify-${isAI ? 'start' : 'end'}`}
          >
            <span className={`${isAI ? 'text-slate-400' : 'text-white/70'}`}>
              {timestamp}
            </span>
          </motion.span>
        )}
      </div>
      {!isAI && (
        <motion.div 
          className="h-10 w-10 text-indigo-500 flex-shrink-0 ring-2 ring-white/20 rounded-full" 
          whileHover={{ scale: 1.1 }}
        >
          <UserCircleIcon className="h-10 w-10" />
        </motion.div>
      )}
    </motion.div>
  );
}
// ----------------- Header (Animated gradient) -----------------
function Header() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center gap-4 mb-8"
    >
      <motion.div 
        className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white/20"
        whileHover={{ rotate: 360, transition: { duration: 0.5 } }}
      >
        <SparklesIcon className="h-6 w-6 text-white" />
      </motion.div>
      <motion.h1 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600"
      >
        AI Business Intelligence
      </motion.h1>
    </motion.div>
  );
}
// ----------------- Loading Screen (More engaging) -----------------
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-8 w-8 mx-auto mb-4 text-indigo-600"
        >
          <ArrowPathIcon className="h-8 w-8" />
        </motion.div>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-slate-600"
        >
          Loading conversation history...
        </motion.p>
      </motion.div>
    </div>
  );
}
// ----------------- Input Bar (Enhanced with focus states and voice animation) -----------------
function InputBar({ inputValue, onChange, onSend, isLoading, placeholder, onVoiceInput, isListening }) {
  return (
    <div className="sticky bottom-0 mt-8 bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-2xl p-4 shadow-2xl">
      <div className="flex gap-3 max-w-4xl mx-auto">
        <motion.button
          type="button"
          onClick={onVoiceInput}
          disabled={isLoading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{ scale: isListening ? [1, 1.1, 1] : 1, rotate: isListening ? 5 : 0 }}
          transition={{ duration: 0.3 }}
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 ${
            isLoading ? 'bg-slate-400 cursor-not-allowed' :
            isListening ? 'bg-red-500 hover:bg-red-600 text-white' :
            'bg-gray-200 hover:bg-gray-300'
          }`}
          aria-label={isListening ? "Stop voice input" : "Start voice input"}
        >
          {isListening ? (
            <StopCircleIcon className="h-5 w-5" />
          ) : (
            <MicrophoneIcon className={`h-5 w-5 ${isLoading ? 'text-gray-400' : 'text-gray-600'}`} />
          )}
        </motion.button>
        <motion.input
          type="text"
          value={inputValue}
          onChange={onChange}
          onKeyDown={(e) => e.key === "Enter" && !isLoading && onSend()}
          placeholder={placeholder}
          disabled={isLoading}
          whileFocus={{ scale: 1.02, borderColor: "#4f46e5" }}
          className="flex-1 px-5 py-3 rounded-xl border border-slate-300/60 focus:ring-2 focus:ring-indigo-400/50 focus:border-transparent bg-white/90 text-sm placeholder-slate-500 transition-all duration-200 outline-none"
        />
        <motion.button
          onClick={onSend}
          disabled={!inputValue.trim() || isLoading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-6 py-3 rounded-xl font-semibold text-white flex items-center gap-2 text-sm transition-all duration-200 ${
            isLoading
              ? "bg-slate-400 cursor-not-allowed scale-95"
              : "bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 hover:from-indigo-600 hover:via-purple-600 hover:to-blue-600 shadow-lg hover:shadow-xl"
          }`}
        >
          {isLoading ? (
            <>
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-4 w-4"
              >
                <ArrowPathIcon className="h-4 w-4" />
              </motion.div>
              Analyzing
            </>
          ) : (
            <>
              <PaperAirplaneIcon className="h-4 w-4" />
              Send
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
// ----------------- Main AIAssistant (Refactored with AnimatePresence for messages) -----------------
export default function AIAssistant() {
  const { convId } = useParams();
  const [inputValue, setInputValue] = useState("");
  const [partialTranscript, setPartialTranscript] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(null);
  const [hasProcessedUrlQuery, setHasProcessedUrlQuery] = useState(false);
  const [conversationId, setConversationId] = useState(convId || null);
  const token = Cookies.get("access_token");
  const decoded = token ? jwtDecode(token) : null;
  const name = decoded ? decoded.user_id || "User" : "User";
  const [messages, setMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const [apiConfig] = useState({
    catalog: "finance_fusion_catalog",
    schema: "finance_fusion_catalog",
    persona: "CFO",
  });
  const initialMessage = useMemo(() => {
    const now = new Date();
    const hours = now.getHours();
    const day = now.toLocaleString("en-US", { weekday: "long" });
    const timeGreetings = {
      morning: ["Good morning", "Rise and shine", "Morning vibes incoming"],
      afternoon: ["Good afternoon", "Keep the momentum", "Midday focus!"],
      evening: ["Good evening", "Evening reflections", "Twilight thoughts"],
    };
    const weekdayMessages = {
      Monday: ["Fresh start. Let’s uncover key insights."],
      Tuesday: ["Tuesday’s all about execution and insight."],
      Wednesday: ["Midweek clarity — optimize and conquer with data."],
      Thursday: ["Almost there — stay sharp, stay insightful."],
      Friday: ["Finish strong, you’re almost at the weekend with fresh insights!"],
      Saturday: ["Weekend mode: balance and brilliant discoveries."],
      Sunday: ["Recharge, reflect, and reimagine with insights."],
    };
    const timePeriod = hours < 12 ? "morning" : hours < 18 ? "afternoon" : "evening";
    const greeting = timeGreetings[timePeriod][Math.floor(Math.random() * 3)];
    const todayMsgs = weekdayMessages[day] || ["Discover your next big insight."];
    const randomMsg = todayMsgs[Math.floor(Math.random() * todayMsgs.length)];
    const combined = [
      `${greeting}, ${name}! ${randomMsg}`,
      `${greeting}, ${name}! Ready to generate powerful insights?`,
    ];
    return combined[Math.floor(Math.random() * combined.length)];
  }, [name]);
  const showWelcome = !convId && messages.length === 0 && !loadingHistory;
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentProgress]);
  useEffect(() => {
    setConversationId(convId || null);
    if (!convId) {
      setMessages([]);
      setLoadingHistory(false);
    }
  }, [convId]);
  useEffect(() => {
    if (!convId) return;
    setLoadingHistory(true);
    const fetchConversation = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/bi-history/conversations/${convId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "ngrok-skip-browser-warning": "true",
            },
          }
        );
        const { queries } = response.data;
        const historicalMessages = [];
        queries.forEach((query) => {
          historicalMessages.push({
            from: "user",
            text: query.query_text,
            timestamp: new Date(query.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          });
          let result = null;
          if (query.simple_result) {
            result = {
              answer: query.simple_result.answer,
              suggested_followups: query.simple_result.suggested_followups,
            };
            if (query.simple_result.chart_config && query.simple_result.data) {
              const inferredType =
                query.simple_result.chart_type ||
                (query.simple_result.chart_config.series
                  ? "line_chart"
                  : Array.isArray(query.simple_result.chart_config.y_axis_col_name) &&
                    query.simple_result.chart_config.y_axis_col_name.length > 1
                  ? "stacked_bar_chart"
                  : "vertical_bar_chart");
              result.charts = [{
                title: query.simple_result.chart_config.title || "Analysis Chart",
                chart_type: inferredType,
                data: query.simple_result.data,
                chart_config: query.simple_result.chart_config,
              }];
            }
          } else if (query.complex_result) {
            result = { ...query.complex_result };
      
            // Map detailed_findings to key_insights
            if (result.detailed_findings) {
              result.key_insights = result.detailed_findings;
              delete result.detailed_findings; // Clean up to avoid confusion
            }
      
            // Merge recommended_actions into suggested_followups (flatten actions)
            if (result.recommended_actions && result.recommended_actions.length > 0) {
              const actions = result.recommended_actions.map((actionObj) => actionObj.action).filter(Boolean);
              result.suggested_followups = [...(result.suggested_followups || []), ...actions];
              delete result.recommended_actions; // Clean up
            }
      
            // Add charts
            if (query.charts && query.charts.length > 0) {
              result.charts = query.charts;
            }
          }
          historicalMessages.push({
            from: "ai",
            result,
            timestamp: new Date(query.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          });
        });
        setMessages(historicalMessages);
      } catch (error) {
        console.error("Error fetching conversation:", error);
        setMessages([{
          from: "ai",
          text: "Unable to load conversation history. Please try again.",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }]);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchConversation();
  }, [convId, token]);
  const sendQuery = useCallback(
    async (text) => {
      if (!conversationId) {
        console.warn("No conversation ID; backend should create one");
      }
      setIsLoading(true);
      setCurrentProgress({
        message: "Starting analysis...",
        progress: 0,
        stage: "initializing",
      });
      try {
        const response = await fetch(
          `${API_BASE_URL}/conversational-bi/query-stream`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              query: text,
              persona: apiConfig.persona,
              catalog: apiConfig.catalog,
              schema: apiConfig.schema,
              conversation_id: conversationId || null,
            }),
          }
        );
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "",
          eventType = null;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (line.startsWith("event:"))
              eventType = line.split(":")[1].trim();
            else if (line.startsWith("data:")) {
              try {
                let jsonStr = line
                  .slice(6)
                  .replace(/NaN|Infinity|-Infinity/g, "null");
                const data = JSON.parse(jsonStr);
                switch (eventType) {
                  case "progress":
                    setCurrentProgress({
                      message: data.message,
                      progress: data.progress,
                      stage: data.stage,
                    });
                    break;
                  case "chart":
                    if (data.chart) {
                      setMessages((prev) => {
                        const newMessages = [...prev];
                        const lastIdx = newMessages.length - 1;
                        if (
                          newMessages[lastIdx].from === "ai" &&
                          newMessages[lastIdx].result?.charts
                        ) {
                          newMessages[lastIdx].result.charts = [
                            ...newMessages[lastIdx].result.charts,
                            data.chart,
                          ];
                        } else {
                          newMessages.push({
                            from: "ai",
                            result: { charts: [data.chart] },
                            timestamp: new Date().toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            }),
                          });
                        }
                        return newMessages;
                      });
                    }
                    setCurrentProgress({
                      message: data.message,
                      progress: data.progress,
                      stage: data.stage,
                    });
                    break;
                  case "complete":
                    let finalResult = { ...data.result };
                    if (
                      finalResult &&
                      finalResult.answer &&
                      finalResult.chart_config &&
                      finalResult.data &&
                      !finalResult.executive_summary
                    ) {
                      const originalConfig = finalResult.chart_config || {};
                      const inferredType =
                        finalResult.chart_type ||
                        (originalConfig.series
                          ? "line_chart"
                          : Array.isArray(originalConfig.y_axis_col_name) &&
                            originalConfig.y_axis_col_name.length > 1
                          ? "stacked_bar_chart"
                          : "vertical_bar_chart");
                      const chartObj = {
                        title:
                          originalConfig.title ||
                          finalResult.title ||
                          "Quick Insight",
                        chart_type: inferredType,
                        data: finalResult.data,
                        chart_config: originalConfig,
                      };
                      finalResult.charts = [chartObj];
                      delete finalResult.chart_config;
                      delete finalResult.data;
                      delete finalResult.sql_query;
                    }
                    setMessages((prev) => {
                      const newMessages = [...prev];
                      const lastIdx = newMessages.length - 1;
                      if (
                        newMessages[lastIdx].from === "ai" &&
                        newMessages[lastIdx].result
                      ) {
                        newMessages[lastIdx].result = {
                          ...newMessages[lastIdx].result,
                          ...finalResult,
                        };
                        newMessages[lastIdx].timestamp =
                          new Date().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          });
                      } else {
                        newMessages.push({
                          from: "ai",
                          result: finalResult,
                          timestamp: new Date().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          }),
                        });
                      }
                      return newMessages;
                    });
                    setCurrentProgress(null);
                    setIsLoading(false);
                    break;
                }
              } catch (err) {
                console.error("SSE parse error:", err);
              }
              eventType = null;
            }
          }
        }
      } catch (err) {
        console.error("Query failed:", err);
        setCurrentProgress(null);
        setMessages((prev) => [
          ...prev,
          {
            from: "ai",
            text: `❌ Sorry, something went wrong: ${err.message}. Please try again.`,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
        setIsLoading(false);
      }
    },
    [token, apiConfig, conversationId]
  );
  const handleFollowUpClick = useCallback((text) => {
    if (!text.trim() || isLoading) return;
    const userMessage = {
      from: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, userMessage]);
    sendQuery(text);
  }, [isLoading, sendQuery]);
  const handleSendMessage = () => {
    const text = inputValue;
    if (!text.trim() || isLoading) return;
    const userMessage = {
      from: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    sendQuery(text);
  };
  const startVoiceRecognition = useCallback(() => {
    if (isLoading) return;
    if (isListening) {
      // Stop listening
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      setPartialTranscript("");
      return;
    }
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      alert('Voice recognition is not supported in this browser. Please use Chrome or Edge for the best experience.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true; // Enable partial results for real-time feedback
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      console.log('Voice recognition started');
      setIsListening(true);
      setPartialTranscript("");
      // Optional: Request mic permission if needed
      navigator.mediaDevices.getUserMedia({ audio: true }).catch(err => {
        console.warn('Microphone access denied:', err);
      });
    };
    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      // Update partial for real-time preview
      setPartialTranscript(interimTranscript);
      // If final, set and send
      if (finalTranscript) {
        const fullText = (inputValue + finalTranscript).trim();
        setInputValue(fullText);
        setPartialTranscript("");
        // Auto-send if desired, or wait for user
        // For now, just set the value; user can press send
      }
    };
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setPartialTranscript("");
      let errorMessage = 'Voice input error. ';
      switch (event.error) {
        case 'not-allowed':
          errorMessage += 'Microphone permission denied. Please allow access in your browser settings and try again.';
          break;
        case 'permission-denied':
          errorMessage += 'Microphone permission denied. Please allow access and refresh the page.';
          break;
        case 'no-speech':
          errorMessage += 'No speech detected. Please speak louder or closer to the mic. Try again?';
          break;
        case 'audio-capture':
          errorMessage += 'Microphone issue detected. Check your audio settings or try a different device.';
          break;
        case 'network':
          errorMessage += 'Network error. Please check your internet connection and try again.';
          break;
        case 'service-not-allowed':
          errorMessage += 'Speech service not allowed. Please enable it in your browser settings.';
          break;
        default:
          errorMessage += `${event.error}. Please try again.`;
      }
      alert(errorMessage);
    };
    recognition.onend = () => {
      console.log('Voice recognition ended');
      setIsListening(false);
      setPartialTranscript("");
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
      // If final transcript is empty after end, prompt retry
      if (!inputValue.trim() && partialTranscript.trim()) {
        setInputValue(partialTranscript.trim());
      }
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
      setIsListening(false);
      alert('Failed to start voice input. Please check your microphone and try again.');
    }
  }, [isListening, inputValue, partialTranscript]);
  const splitTextIntoChunks = (text, maxChunkLength = 300) => {
    const chunks = [];
    let currentChunk = '';
    for (const word of text.split(' ')) {
      if ((currentChunk + word).length > maxChunkLength) {
        chunks.push(currentChunk.trim());
        currentChunk = word + ' ';
      } else {
        currentChunk += word + ' ';
      }
    }
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    return chunks;
  };
  const readAloud = (text) => {
    if (isSpeaking) {
      stopReading();
      return;
    }
    const chunks = splitTextIntoChunks(text);
    let currentChunkIndex = 0;
    const speakChunk = () => {
      if (currentChunkIndex >= chunks.length) {
        setIsSpeaking(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(chunks[currentChunkIndex]);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        currentChunkIndex++;
        speakChunk();
      };
      utterance.onerror = (event) => {
        if (event.error !== 'interrupted') {
          console.error('Speech synthesis error:', event);
          alert('An error occurred while reading aloud.');
        }
        setIsSpeaking(false);
      };
      if (speechSynthesis.speaking || speechSynthesis.pending) {
        speechSynthesis.cancel();
      }
      try {
        speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('Failed to start speech synthesis:', error);
        alert('Unable to start speech synthesis.');
        setIsSpeaking(false);
      }
    };
    speakChunk();
  };
  const stopReading = () => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };
  useEffect(() => {
    if (hasProcessedUrlQuery) return;
    const params = new URLSearchParams(window.location.search);
    const query = params.get("query");
    const responseKey = params.get("response_key");
    if (!query) return;
    setHasProcessedUrlQuery(true);
    const userMessage = {
      from: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, userMessage]);
    if (responseKey) {
      try {
        const cachedData = localStorage.getItem(responseKey);
        if (cachedData) {
          const item = JSON.parse(cachedData);
          let finalResult = { ...item };
          if (
            finalResult.intent === "simple_question" &&
            finalResult.answer &&
            finalResult.chart_config &&
            finalResult.data &&
            !finalResult.executive_summary
          ) {
            const originalConfig = finalResult.chart_config || {};
            const inferredType =
              finalResult.chart_type ||
              (originalConfig.series
                ? "line_chart"
                : Array.isArray(originalConfig.y_axis_col_name) &&
                  originalConfig.y_axis_col_name.length > 1
                ? "stacked_bar_chart"
                : "vertical_bar_chart");
            const chartObj = {
              title:
                originalConfig.title || finalResult.title || "Quick Insight",
              chart_type: inferredType,
              data: finalResult.data,
              chart_config: originalConfig,
            };
            finalResult.charts = [chartObj];
            delete finalResult.chart_config;
            delete finalResult.data;
            delete finalResult.sql_query;
          }
          if (finalResult.suggested_actions) {
            finalResult.suggested_followups = finalResult.suggested_actions;
            delete finalResult.suggested_actions;
          }
          setMessages((prev) => [
            ...prev,
            {
              from: "ai",
              result: finalResult,
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ]);
          localStorage.removeItem(responseKey);
          return;
        }
      } catch (err) {
        console.error("Failed to load cached response:", err);
      }
    }
    sendQuery(query);
  }, [hasProcessedUrlQuery, sendQuery]);
  if (loadingHistory) {
    return <LoadingScreen />;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex flex-col">
      <div className="max-w-4xl w-full mx-auto p-6 flex flex-col flex-grow">
        <Header />
        <div className={`bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl shadow-xl overflow-y-auto flex flex-col ${showWelcome ? 'items-center justify-center p-8 space-y-8' : 'p-6 space-y-6'}`}>
          {showWelcome ? (
            <>
              <motion.h1
                className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-800 via-indigo-700 to-purple-700 text-5xl md:text-6xl leading-tight text-center tracking-tight"
                style={{
                  backgroundSize: "200% auto",
                  animation: "gradientMove 8s ease infinite",
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                {initialMessage}
              </motion.h1>
              <motion.p
                className="text-lg md:text-2xl text-gray-600 font-light leading-relaxed text-center max-w-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                I read your AP data so you don’t have to — from cash flow signals to compliance risks. What shall we decode today?
              </motion.p>
            </>
          ) : (
            <>
              <AnimatePresence>
                {messages.map((msg, idx) => (
                  <Message
                    key={`${msg.from}-${idx}-${msg.timestamp || Date.now()}`}
                    {...msg}
                    onFollowUpClick={handleFollowUpClick}
                    onReadAloud={readAloud}
                    isSpeaking={isSpeaking}
                  />
                ))}
              </AnimatePresence>
              {isLoading && currentProgress && (
                <Message from="ai" isTyping progress={currentProgress} />
              )}
              <div ref={chatEndRef} />
            </>
          )}
        </div>
        <InputBar
          inputValue={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onSend={handleSendMessage}
          isLoading={isLoading}
          placeholder="Ask about your business data... (e.g., 'What drove Q2 tax increases?')"
          onVoiceInput={startVoiceRecognition}
          isListening={isListening}
        />
      </div>
      <style>{`
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
      `}</style>
    </div>
  );
}