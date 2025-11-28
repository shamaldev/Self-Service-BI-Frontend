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
} from "@heroicons/react/24/outline";
import { useState, useRef, useEffect, useCallback } from "react";
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
  const seriesKey =
    cfg.series || cfg.cluster_by || cfg.stack_by || cfg.color_by || null;
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

// ----------------- Chart Renderer -----------------
function renderChart(chart, height = 420) {
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
    data = pivotLongToWide(data, xKey, seriesKey, probableValueKey);
    const generatedSeries = [...new Set(chart.data.map((d) => d[seriesKey]))];
    const generatedYKeys = generatedSeries.map(
      (s) => `${probableValueKey}_${s}`
    );
    return renderChart(
      {
        ...chart,
        data,
        chart_config: {
          ...chart.chart_config,
          _inferred_y_keys: generatedYKeys,
        },
      },
      height
    );
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

// ----------------- Data Quality Alert -----------------
function DataQualityAlert({ alert }) {
  if (!alert) return null;
  return (
    <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 border-l-4 border-amber-500 rounded-xl p-5 shadow-lg animate-in fade-in-50 duration-300">
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
    </div>
  );
}

// ----------------- Executive Summary -----------------
function ExecutiveSummary({ summary }) {
  if (!summary) return null;
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 rounded-2xl shadow-2xl border border-indigo-500/20 animate-in slide-in-from-bottom-2 duration-500">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-300/10 to-purple-300/10absolute inset-0 bg-gradient-to-br from-white to-indigo-50" />
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
    </div>
  );
}

// ----------------- Simple Answer -----------------
function SimpleAnswer({ answer }) {
  if (!answer) return null;
  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5 animate-in fade-in-50 duration-300">
      <div className="flex items-start gap-3">
        <LightBulbIcon className="h-6 w-6 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-slate-800 text-base mb-2">Analysis Result</h4>
          {renderAnswer(answer)}
        </div>
      </div>
    </div>
  );
}

// ----------------- Key Insights -----------------
function KeyInsights({ insights }) {
  if (!insights?.length) return null;
  return (
    <div className="space-y-4 animate-in fade-in-100 duration-300">
      <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
        <ChartBarIcon className="h-6 w-6 text-indigo-600" />
        Key Insights
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 group"
          >
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 group-hover:from-indigo-600 group-hover:to-purple-600 transition-colors">
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
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${insight.confidence_score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------------- Charts Grid -----------------
function ChartsGrid({ charts }) {
  if (!charts?.length) return null;
  return (
    <div className="space-y-4 animate-in fade-in-100 duration-300">
      <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
        <ChartBarIcon className="h-6 w-6 text-indigo-600" />
        Data Visualizations
      </h4>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {charts.map((c, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 group"
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
              <div className="w-full h-[380px]">{renderChart(c, 380)}</div>
            </div>
            {c.row_count && (
              <div className="px-4 pb-3 text-xs text-slate-500">
                Based on {c.row_count.toLocaleString()} data points
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------------- Strategic Recommendations -----------------
function StrategicRecommendations({ recommendations }) {
  if (!recommendations?.length) return null;
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl shadow-md border border-emerald-200 p-5 animate-in slide-in-from-bottom-2 duration-500">
      <h4 className="font-bold text-emerald-800 text-base mb-4 flex items-center gap-2">
        <CheckCircleIcon className="h-6 w-6" />
        Strategic Recommendations
      </h4>
      <div className="space-y-3">
        {recommendations.map((rec, i) => (
          <div
            key={i}
            className="bg-white rounded-lg p-4 border border-emerald-200 shadow-sm hover:shadow-md transition-all duration-200"
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
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------------- Root Cause Analysis -----------------
function RootCauseAnalysis({ analysis }) {
  if (!analysis) return null;
  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-md border border-purple-200 p-5 animate-in fade-in-100 duration-300">
      <h4 className="font-bold text-purple-800 text-base mb-3">
        Root Cause Analysis
      </h4>
      <div className="space-y-3">
        <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500">
          <h5 className="text-sm font-semibold text-slate-800 mb-1">
            Primary Driver
          </h5>
          <p className="text-slate-700">
            {analysis.primary_driver}
          </p>
        </div>
        {analysis.secondary_factors?.length > 0 && (
          <div className="bg-white rounded-lg p-4">
            <h5 className="text-sm font-semibold text-slate-800 mb-2">
              Contributing Factors
            </h5>
            <ul className="space-y-1 text-sm text-slate-700">
              {analysis.secondary_factors.map((factor, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------- Next Steps -----------------
function NextSteps({ actions = [], onFollowUpClick }) {
  const allActions = [...actions];
  if (!allActions.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5 animate-in slide-in-from-bottom-2 duration-300">
      <h4 className="font-semibold text-slate-800 text-base mb-3 flex items-center gap-2">
        <LightBulbIcon className="h-5 w-5 text-indigo-600" />
        Next Steps
      </h4>
      <div className="space-y-2">
        {allActions.map((action, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-indigo-50 transition-all duration-200 cursor-pointer border border-transparent hover:border-indigo-200 hover:scale-[1.02]"
            onClick={() => onFollowUpClick(action?.action || action)}
          >
            <div className="flex-shrink-0 w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
              {i + 1}
            </div>
            <p className="text-sm text-slate-700 flex-1">{action?.action || action}</p>
          </div>
        ))}
      </div>
    </div>
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

// ----------------- Typing Indicator -----------------
function TypingIndicator({ progress }) {
  if (!progress) return null;
  return (
    <div className="flex items-center gap-2 mb-2 animate-pulse">
      <div className="flex space-x-1">
        <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-xs font-medium text-gray-600">
        {progress.message}
      </span>
      <div className="flex-1 bg-gray-200 rounded-full h-1 ml-4 overflow-hidden">
        <div
          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1 rounded-full transition-all duration-300"
          style={{ width: `${progress.progress || 0}%` }}
        />
      </div>
    </div>
  );
}

// ----------------- Message (Improved) -----------------
function Message({ from, text, timestamp, isTyping = false, progress = null, result = null, onFollowUpClick }) {
  const isAI = from === "ai";
  return (
    <div
      className={`flex items-start gap-4 mb-8 last:mb-0 animate-in slide-in-from-left duration-300 ${
        isAI ? "justify-start" : "justify-end"
      }`}
    >
      {isAI && (
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/20">
            <SparklesIcon className="h-5 w-5 text-white" />
          </div>
        </div>
      )}
      <div className="flex flex-col max-w-[80%]">
        <div
          className={`px-6 py-4 rounded-2xl shadow-lg transition-all duration-300 backdrop-blur-sm ${
            isAI
              ? "bg-white/90 border border-slate-200/50"
              : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xl"
          }`}
        >
          {isTyping ? (
            <TypingIndicator progress={progress} />
          ) : result ? (
            <ResultDisplay result={result} onFollowUpClick={onFollowUpClick} />
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {text}
            </p>
          )}
        </div>
        {timestamp && (
          <span className={`text-xs mt-2 flex justify-${isAI ? 'start' : 'end'}`}>
            <span className={`${isAI ? 'text-slate-400' : 'text-white/70'}`}>
              {timestamp}
            </span>
          </span>
        )}
      </div>
      {!isAI && (
        <UserCircleIcon className="h-10 w-10 text-indigo-500 flex-shrink-0 ring-2 ring-white/20 rounded-full" />
      )}
    </div>
  );
}

// ----------------- Header -----------------
function Header() {
  return (
    <div className="flex items-center justify-center gap-4 mb-8 animate-in fade-in duration-500">
      <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white/20">
        <SparklesIcon className="h-6 w-6 text-white" />
      </div>
      <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600">
        AI Business Intelligence
      </h1>
    </div>
  );
}

// ----------------- Loading Screen -----------------
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center">
      <div className="text-center animate-pulse">
        <ArrowPathIcon className="h-8 w-8 mx-auto mb-4 text-indigo-600 animate-spin" />
        <p className="text-slate-600">Loading conversation history...</p>
      </div>
    </div>
  );
}

// ----------------- Input Bar -----------------
function InputBar({ inputValue, onChange, onSend, isLoading, placeholder }) {
  return (
    <div className="sticky bottom-0 mt-8 bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-2xl p-4 shadow-2xl">
      <div className="flex gap-3 max-w-4xl mx-auto">
        <input
          type="text"
          value={inputValue}
          onChange={onChange}
          onKeyDown={(e) => e.key === "Enter" && !isLoading && onSend()}
          placeholder={placeholder}
          disabled={isLoading}
          className="flex-1 px-5 py-3 rounded-xl border border-slate-300/60 focus:ring-2 focus:ring-indigo-400/50 focus:border-transparent bg-white/90 text-sm placeholder-slate-500 transition-all duration-200 outline-none"
        />
        <button
          onClick={onSend}
          disabled={!inputValue.trim() || isLoading}
          className={`px-6 py-3 rounded-xl font-semibold text-white flex items-center gap-2 text-sm transition-all duration-200 transform ${
            isLoading
              ? "bg-slate-400 cursor-not-allowed scale-95"
              : "bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 hover:from-indigo-600 hover:via-purple-600 hover:to-blue-600 hover:scale-105 shadow-lg hover:shadow-xl"
          }`}
        >
          {isLoading ? (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              Analyzing
            </>
          ) : (
            <>
              <PaperAirplaneIcon className="h-4 w-4" />
              Send
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ----------------- Main AIAssistant (Refactored) -----------------
export default function AIAssistant() {
  const { convId } = useParams();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(null);
  const [hasProcessedUrlQuery, setHasProcessedUrlQuery] = useState(false);
  const [conversationId, setConversationId] = useState(convId || null);
  const token = Cookies.get("access_token");
  const [messages, setMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const chatEndRef = useRef(null);
  const [apiConfig] = useState({
    catalog: "finance_fusion_catalog",
    schema: "finance_fusion_catalog",
    persona: "CFO",
  });

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
              delete result.detailed_findings;  // Clean up to avoid confusion
            }
            
            // Merge recommended_actions into suggested_followups (flatten actions)
            if (result.recommended_actions && result.recommended_actions.length > 0) {
              const actions = result.recommended_actions.map((actionObj) => actionObj.action).filter(Boolean);
              result.suggested_followups = [...(result.suggested_followups || []), ...actions];
              delete result.recommended_actions;  // Clean up
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

  useEffect(() => {
    if (convId) return;
    if (messages.length === 0 && !loadingHistory) {
      setMessages([{
        from: "ai",
        text: "👋 Hello! I'm your AI BI Assistant. What business insight can I help you uncover today?",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }]);
    }
  }, [convId, loadingHistory, messages.length]);

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
        <div className="flex-1 bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-xl overflow-y-auto space-y-6">
          {messages.map((msg, idx) => (
            <Message key={idx} {...msg} onFollowUpClick={handleFollowUpClick} />
          ))}
          {isLoading && currentProgress && (
            <Message from="ai" isTyping progress={currentProgress} />
          )}
          <div ref={chatEndRef} />
        </div>
        <InputBar
          inputValue={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onSend={handleSendMessage}
          isLoading={isLoading}
          placeholder="Ask about your business data... (e.g., 'What drove Q2 tax increases?')"
        />
      </div>
    </div>
  );
}