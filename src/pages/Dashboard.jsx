import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useContext,
} from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import * as htmlToImage from "html-to-image";
import { formatDate, formatNumber } from "../utils/utils";
import { getRoleFromToken } from "../utils/utils";
import ChartRenderer from "./ChartRenderer";
import ErrorBoundary from "../components/ErrorBoundary";
import { API_BASE_URL } from "../config/axios";
import React from "react";
import Cookies from "js-cookie";
import {
  BanknotesIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  BoltIcon,
  UserIcon,
  XMarkIcon,
  ChevronDownIcon, // New: For drill-down indicators
  HomeIcon, // New: For breadcrumb home
  MicrophoneIcon, // New: For voice input
} from "@heroicons/react/24/outline";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// Assuming react-toastify is installed and imported for alerts
// Import CSS for react-toastify if needed: import "react-toastify/dist/ReactToastify.css";
const ResponsiveGridLayout = WidthProvider(Responsive);
const DrillDownModal = React.memo(
  ({
    isOpen,
    onClose,
    drillData,
    onDrillFurther,
    breadcrumb,
    onBreadcrumbClick,
    isDrilling,
  }) => {
    if (!isOpen || !drillData) return null;
    const {
      title,
      description,
      data,
      chart_config,
      can_drill_further,
      sql_query,
    } = drillData;
    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-fade-in-scale flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Breadcrumb */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center gap-4 flex-1 overflow-hidden">
              <button
                onClick={() => onBreadcrumbClick(0)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all duration-300 flex-shrink-0"
              >
                <HomeIcon className="h-4 w-4" />
                <span>Dashboard</span>
              </button>
              {breadcrumb.slice(1).map((crumb, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 flex-shrink-0"
                >
                  <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                  <button
                    onClick={() => onBreadcrumbClick(idx + 1)}
                    className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all duration-300 truncate max-w-xs"
                    title={crumb.label}
                  >
                    {crumb.label}
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all duration-300 flex-shrink-0"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          {/* Title */}
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
          {/* Chart Content */}
          <div className="flex-1 p-6 relative overflow-auto bg-white">
            {isDrilling ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
              </div>
            ) : (
              <>
                <ErrorBoundary>
                  <ChartRenderer
                    kpi={{
                      chart_type:
                        chart_config?.chart_type || "vertical_bar_chart",
                    }}
                    data={data}
                    chartConfig={chart_config || {}}
                    onElementClick={
                      can_drill_further
                        ? (col, val) => onDrillFurther(col, val)
                        : undefined
                    }
                  />
                </ErrorBoundary>
                {can_drill_further && (
                  <div className="absolute top-4 right-4 bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg animate-pulse">
                    Click to drill deeper →
                  </div>
                )}
                {!can_drill_further && (
                  <div className="absolute bottom-4 right-4 bg-gray-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                    📊 Detail Level
                  </div>
                )}
              </>
            )}
          </div>
          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>SQL Query:</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sql_query);
                  toast.success("SQL copied!");
                }}
                className="text-indigo-600 hover:text-indigo-700 font-mono text-xs bg-indigo-100 px-2 py-1 rounded-lg transition-colors"
              >
                Copy
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  downloadCSV(data, `${title.replace(/[^a-z0-9]/gi, "_")}.csv`);
                  toast.success("Data downloaded!");
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Download Data
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
const SummaryModal = React.memo(({ isOpen, onClose, summary }) => {
  if (!isOpen || !summary) return null;
  const { title, alert_level, current_state, drivers } = summary;
  const getAlertColor = (level) => {
    switch (level) {
      case "danger": return "from-red-500 to-red-600";
      case "warning": return "from-yellow-500 to-yellow-600";
      case "info": return "from-blue-500 to-blue-600";
      default: return "from-gray-500 to-gray-600";
    }
  };
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl animate-fade-in-scale flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 border-b flex items-center justify-between ${alert_level ? `bg-gradient-to-r ${getAlertColor(alert_level)} text-white` : 'bg-gray-50'}`}>
          <div className="flex items-center gap-3">
            <InformationCircleIcon className="h-6 w-6" />
            <h2 className="text-xl font-bold">{title}</h2>
            {alert_level && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${alert_level === 'info' ? 'bg-blue-200 text-blue-800' : alert_level === 'warning' ? 'bg-yellow-200 text-yellow-800' : 'bg-red-200 text-red-800'}`}>
                {alert_level}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-all duration-300 ${alert_level ? 'text-white/70 hover:text-white hover:bg-white/20' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        {/* Current State */}
        {current_state && (
          <div className="flex-1 p-6 space-y-6 overflow-auto">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current State</h3>
              {current_state.primary_metric && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-2xl border border-indigo-200/50">
                  <p className="text-sm text-gray-600 mb-2">{current_state.primary_metric.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{current_state.primary_metric.value}</p>
                </div>
              )}
              {current_state.secondary_metrics && current_state.secondary_metrics.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {current_state.secondary_metrics.map((metric, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <p className="text-sm text-gray-600">{metric.label}</p>
                      <p className="text-lg font-semibold text-gray-900">{metric.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Drivers */}
            {drivers && drivers.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Drivers</h3>
                <div className="space-y-4">
                  {drivers.map((driver, idx) => (
                    <div key={idx} className="bg-gradient-to-r from-gray-50 to-indigo-50 p-4 rounded-xl border border-gray-200">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{driver.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{driver.title}</h4>
                          <p className="text-sm text-gray-600">{driver.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
const iconMap = {
  dollar: CurrencyDollarIcon,
  chart: ChartBarIcon,
  trend: ArrowTrendingUpIcon,
  cash: BanknotesIcon,
  sparkles: SparklesIcon,
  bolt: BoltIcon,
};
// Sidebar Context for sharing collapsed state
const SidebarContext = React.createContext({ isCollapsed: false });
const isCurrencyKPI = (title) => {
  const currencyWords = [
    "amount",
    "spend",
    "cost",
    "expense",
    "revenue",
    "budget",
    "invoice",
    "payment",
    "cash",
    "dollar",
  ];
  return currencyWords.some((word) => title.toLowerCase().includes(word));
};
const downloadCSV = (data, filename) => {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((key) => {
          let value = row[key];
          if (typeof value === "string") {
            value = value.replace(/"/g, '""');
            if (
              value.includes(",") ||
              value.includes("\n") ||
              value.includes('"')
            ) {
              value = `"${value}"`;
            }
          }
          return value;
        })
        .join(",")
    ),
  ].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
const downloadPNG = (elementId, filename) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  htmlToImage
    .toPng(element, {
      quality: 1,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    })
    .then((dataUrl) => {
      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    })
    .catch((error) => {
      console.error("Error capturing PNG:", error);
      toast.error("Failed to download image. Please try again.");
    });
};
const RegenerateModal = React.memo(
  ({ isOpen, onClose, onRegenerate, isRegenerating, currentChartId }) => {
    const [regenPrompt, setRegenPrompt] = useState("");
    const handlePromptChange = useCallback((e) => {
      setRegenPrompt(e.target.value);
    }, []);
    const handleRegenerate = useCallback(() => {
      if (regenPrompt.trim()) {
        onRegenerate(currentChartId, regenPrompt);
      }
    }, [regenPrompt, currentChartId, onRegenerate]);
    if (!isOpen) return null;
    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-3xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl animate-fade-in-scale"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">
              Regenerate Chart
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <textarea
              value={regenPrompt}
              onChange={handlePromptChange}
              placeholder='Describe changes (e.g., "Change to horizontal bar chart")'
              className="w-full h-24 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={4}
            />
            <button
              onClick={handleRegenerate}
              disabled={!regenPrompt.trim() || isRegenerating}
              className="group relative w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-purple-200 focus:ring-offset-2 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 overflow-hidden disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              {isRegenerating ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Regenerating...
                </div>
              ) : (
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <SparklesIcon className="h-4 w-4" />
                  Regenerate
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }
);
export default function Dashboard() {
  const { isCollapsed } = useContext(SidebarContext);
  const [kpis, setKpis] = useState([]);
  const [charts, setCharts] = useState([]);
  // Default layout with empty arrays for each breakpoint to ensure consistent structure
  const [layouts, setLayouts] = useState({
    lg: [],
    md: [],
    sm: [],
  });
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Click 'Generate Dashboard' to start");
  const [resetKey, setResetKey] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [currentData, setCurrentData] = useState([]);
  const [currentTitle, setCurrentTitle] = useState("");
  const [currentConfig, setCurrentConfig] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [goal, setGoal] = useState("strategic financial insights");
  const [persona, setPersona] = useState("CFO");
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [currentChartId, setCurrentChartId] = useState(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  // New: Drill-down states
  const [showDrillModal, setShowDrillModal] = useState(false);
  const [drillData, setDrillData] = useState(null);
  const [drillBreadcrumb, setDrillBreadcrumb] = useState([]);
  const [isDrilling, setIsDrilling] = useState(false);
  const [freeformMode, setFreeformMode] = useState(true); // Default to true for free rearrangement
  const [hasGenerated, setHasGenerated] = useState(false); // Flag to control initial layout generation
  // New: Voice input states
  const [isListening, setIsListening] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState("");
  // New: Summary modal states
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [currentSummary, setCurrentSummary] = useState(null);
  const kpiMapRef = useRef(new Map());
  const orderedKpiIdsRef = useRef([]);
  const chartMapRef = useRef(new Map());
  const orderedChartIdsRef = useRef([]);
  const recognitionRef = useRef(null);
  const requestBody = {
    persona: persona,
    goal: goal,
    catalog: "finance_fusion_catalog",
    schema: "finance_fusion_catalog",
  };
  const safeFormatDate = (dateInput) => {
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) {
        return String(dateInput || "");
      }
      return date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    } catch (err) {
      console.warn("safeFormatDate error:", err, dateInput);
      return String(dateInput || "");
    }
  };
  const syncStateFromRefs = useCallback(() => {
    setKpis(
      orderedKpiIdsRef.current.map(
        (id) =>
          kpiMapRef.current.get(id) || {
            id,
            title: "Untitled",
            status: "pending",
          }
      )
    );
    setCharts(
      orderedChartIdsRef.current.map(
        (id) =>
          chartMapRef.current.get(id) || {
            kpi: { id, title: "Chart" },
            kpi_id: id,
            data: [],
            chart_config: null,
          }
      )
    );
  }, []);
  const deleteItem = (id, isKpiCard) => {
    if (isKpiCard) {
      kpiMapRef.current.delete(id);
      orderedKpiIdsRef.current = orderedKpiIdsRef.current.filter(
        (i) => i !== id
      );
    } else {
      chartMapRef.current.delete(id);
      orderedChartIdsRef.current = orderedChartIdsRef.current.filter(
        (i) => i !== id
      );
      kpiMapRef.current.delete(id);
      orderedKpiIdsRef.current = orderedKpiIdsRef.current.filter(
        (i) => i !== id
      );
    }
    syncStateFromRefs();
  };
  // Updated regenerateChart in Dashboard - Stores response in localStorage before redirect
  const regenerateChart = async (id, prompt) => {
    if (!prompt.trim()) return;
    setIsRegenerating(true);
    const currentChart = chartMapRef.current.get(id);
    if (!currentChart) return;
    const requestBody = {
      query: prompt,
      chart_data: currentChart,
      catalog: "finance_fusion_catalog",
      schema: "finance_fusion_catalog",
      persona: persona,
      schema_text: null,
      sql_query: currentChart.sql_query,
    };
    try {
      const response = await fetch(
        `${API_BASE_URL}/conversational-bi/query-chart`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${Cookies.get("access_token")}`,
          },
          body: JSON.stringify(requestBody),
        }
      );
      if (!response.ok)
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      const data = await response.json();
      const item = data;
      if (item.intent === "simple_question") {
        // Store the full response in localStorage with a unique key
        const responseKey = `ai_assistant_cached_response_${Date.now()}`;
        localStorage.setItem(responseKey, JSON.stringify(item));
        // Redirect to AIAssistant with prompt and response_key
        window.location.href = `/ai-assistant?query=${encodeURIComponent(
          prompt
        )}&response_key=${responseKey}`;
        return;
      }
      const newId = item.kpi_id || id;
      // Preserve original if not provided in response
      const newChartType = item.new_chart_type || currentChart.kpi?.chart_type;
      const newChartConfig = item.new_chart_config || currentChart.chart_config;
      const newTitle =
        newChartConfig?.title || currentChart.kpi?.title || "Updated Chart";
      const newDescription = item.new_analysis || currentChart.kpi?.description;
      const newSqlQuery =
        item.sql_query !== null ? item.sql_query : currentChart.sql_query;
      const updatedKpi = {
        ...currentChart.kpi,
        chart_type: newChartType,
        title: newTitle,
        description: newDescription,
      };
      const updatedChart = {
        ...currentChart,
        kpi_id: newId,
        kpi: updatedKpi,
        data: item.data || currentChart.data,
        chart_config: newChartConfig,
        sql_query: newSqlQuery,
        error: item.error,
      };
      kpiMapRef.current.set(newId, {
        ...updatedKpi,
        id: newId,
        isKpiCard: false,
      });
      chartMapRef.current.set(newId, updatedChart);
      if (!orderedChartIdsRef.current.includes(newId)) {
        orderedChartIdsRef.current.push(newId);
      }
      syncStateFromRefs();
      setMessage(item.answer || "Chart regenerated successfully!");
    } catch (error) {
      console.error("Regeneration error:", error);
      toast.error("Failed to regenerate chart. Please try again.");
    } finally {
      setIsRegenerating(false);
      setShowRegenModal(false);
      setCurrentChartId(null);
    }
  };
  // Updated: Handle Drill-Down Click with validation
  const handleDrillClick = useCallback(
    async (chartId, selectedColumn, selectedValue) => {
      console.log("🔍 Drill-down initiated:", {
        chartId,
        selectedColumn,
        selectedValue,
      });
      if (!selectedColumn || selectedValue === undefined) {
        toast.error(
          "Invalid selection for drill-down. Please click a data element."
        );
        return;
      }
      setIsDrilling(true);
      const chart = chartMapRef.current.get(chartId);
      if (!chart) {
        console.error("❌ Chart not found:", chartId);
        toast.error("Chart not found.");
        setIsDrilling(false);
        return;
      }
      if (!chart.drill_config?.enabled) {
        console.log("❌ Drill-down not enabled for chart:", chartId);
        toast.error("Drill-down not available for this chart.");
        setIsDrilling(false);
        return;
      }
      console.log("✅ Chart drill config:", chart.drill_config);
      const requestBody = {
        kpi_id: chart.kpi_id || chartId,
        chart_type:
          chart.kpi?.chart_type ||
          chart.chart_config?.chart_type ||
          "line_chart",
        current_level: "summary",
        selected_value: selectedValue,
        selected_column: selectedColumn,
        catalog: "finance_fusion_catalog",
        schema: "finance_fusion_catalog",
        persona: persona,
        kpi_title: chart.kpi?.title || chart.chart_config?.title || "Untitled",
        kpi_description: chart.kpi?.description || "",
        original_sql: chart.sql_query || "",
      };
      console.log("📤 Sending drill-down request:", requestBody);
      try {
        const response = await fetch(`${API_BASE_URL}/drilldown/execute`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${Cookies.get("access_token")}`,
          },
          body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ API Error:", response.status, errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        const drillResponse = await response.json();
        console.log("✅ Drill-down response:", drillResponse);
        setDrillData(drillResponse);
        setDrillBreadcrumb([
          { level: "summary", label: chart.kpi?.title || "Dashboard" },
          ...(drillResponse.breadcrumb || []),
        ]);
        setShowDrillModal(true);
        toast.success("Drilled down successfully!");
      } catch (error) {
        console.error("❌ Drill-down error:", error);
        toast.error(`Failed to drill down: ${error.message}`);
      } finally {
        setIsDrilling(false);
      }
    },
    [persona]
  );
  // New: Handle Further Drill-Down in Modal
  const handleFurtherDrill = useCallback(
    async (selectedColumn, selectedValue) => {
      console.log("🔍 Further drill initiated:", {
        selectedColumn,
        selectedValue,
      });
      if (!drillData || !drillData.can_drill_further) {
        toast.info("Cannot drill further from this level.");
        return;
      }
      setIsDrilling(true);
      const requestBody = {
        kpi_id: drillData.kpi_id || currentChartId,
        chart_type: drillData.chart_config?.chart_type || "vertical_bar_chart",
        current_level: drillData.level,
        selected_value: selectedValue,
        selected_column: selectedColumn,
        catalog: "finance_fusion_catalog",
        schema: "finance_fusion_catalog",
        persona: persona,
        kpi_title: drillData.title,
        kpi_description: drillData.description || "",
        original_sql: drillData.sql_query || "",
      };
      try {
        const response = await fetch(`${API_BASE_URL}/drilldown/execute`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${Cookies.get("access_token")}`,
          },
          body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const newDrillData = await response.json();
        console.log("✅ Further drill response:", newDrillData);
        setDrillData(newDrillData);
        setDrillBreadcrumb([
          ...drillBreadcrumb,
          ...(newDrillData.breadcrumb?.slice(-1) || []),
        ]);
        toast.success("Drilled deeper!");
      } catch (error) {
        console.error("❌ Further drill error:", error);
        toast.error("Failed to drill further.");
      } finally {
        setIsDrilling(false);
      }
    },
    [drillData, drillBreadcrumb, persona, currentChartId]
  );
  // New: Handle Breadcrumb Navigation
  const handleBreadcrumbClick = useCallback((index) => {
    console.log("🏠 Breadcrumb clicked:", index);
    setShowDrillModal(false);
    setDrillData(null);
    setDrillBreadcrumb([]);
    toast.info("Returned to dashboard.");
  }, []);
  // New: Handle Summary Modal
  const handleOpenSummary = useCallback((summary) => {
    setCurrentSummary(summary);
    setShowSummaryModal(true);
  }, []);
  const handleCloseSummary = useCallback(() => {
    setShowSummaryModal(false);
    setCurrentSummary(null);
  }, []);
  // Updated: Updated processKpiCardData to handle the new array-based data format
  const processKpiCardData = (k) => {
    let value = null;
    let formattedValue = "N/A";
    let change = null;
    let formattedComparison = null;
    let changeType = null;
    let period = safeFormatDate(new Date()); // Default to current date if no specific period
    let detailLine1 = null;
    let detailLine2 = null;
    let hasError = false;
    // Check for errors first
    if (k.has_error || k.sql_error || !k.data || k.data.length === 0) {
      hasError = true;
      value = null;
      formattedValue = "Error";
      toast.error("An error occurred while loading KPI data.");
    } else {
      // Extract from the first row of data array
      const row = k.data[0];
      if (row && row.value !== null && row.value !== undefined) {
        // Format value based on title (assume currency for financial KPIs)
        const isCurrency = isCurrencyKPI(k.title);
        formattedValue = formatNumber(row.value, {
          prefix: isCurrency ? "₹" : "",
          suffix: "",
          decimals: 2,
          currency: isCurrency,
        });
        value = row.value; // Raw value for internal use
        // Handle comparison: comparison_value is the ratio (e.g., -0.564 for -56.4%)
        if (row.comparison_value && row.comparison_label) {
          const ratio = parseFloat(row.comparison_value);
          if (!isNaN(ratio)) {
            const pctChange = ratio * 100;
            change = `${pctChange > 0 ? "+" : ""}${Math.round(pctChange)}%`;
            changeType = pctChange > 0 ? "positive" : (pctChange < 0 ? "negative" : null);
          }
          formattedComparison = row.comparison_label || "vs previous period";
        }
        // Detail lines from row
        detailLine1 = row.detail_line_1 || null;
        detailLine2 = row.detail_line_2 || null;
        // Extract period from detail_line_1 if available (e.g., "Period: 2025-12-01")
        if (detailLine1 && detailLine1.includes("Period:")) {
          const periodMatch = detailLine1.match(/Period:\s*(.+?)(?:,|\s*$)/);
          if (periodMatch) {
            period = safeFormatDate(periodMatch[1].trim());
          }
        }
      } else {
        // Handle null/empty row values
        formattedValue = "N/A";
        value = null;
      }
    }
    // Ensure all are strings for rendering
    formattedValue = String(formattedValue || "N/A");
    change = String(change || "");
    formattedComparison = String(formattedComparison || "");
    period = String(period || "");
    detailLine1 = detailLine1 ? String(detailLine1) : null;
    detailLine2 = detailLine2 ? String(detailLine2) : null;
    return {
      value,
      formattedValue,
      change,
      formattedComparison,
      changeType,
      period,
      detailLine1,
      detailLine2,
      hasError,
      metricType: isCurrencyKPI(k.title) ? "currency" : "number", // Infer metric type
      formatConfig: { show_trend: true }, // Default to show trend for comparisons
    };
  };
  const generateDashboard = async () => {
    if (!goal.trim()) {
      setMessage("Please enter a goal.");
      return;
    }
    setIsGenerating(true);
    setProgress(0);
    setMessage("Initializing...");
    setHasGenerated(false); // Reset flag
    kpiMapRef.current = new Map();
    orderedKpiIdsRef.current = [];
    chartMapRef.current = new Map();
    orderedChartIdsRef.current = [];
    syncStateFromRefs();
    try {
      const response = await fetch(
        `${API_BASE_URL}/dashboards/process-kpis-with-summaries`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );
      if (!response.ok)
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let boundary;
        while ((boundary = buffer.indexOf("\n\n")) !== -1) {
          const rawEvent = buffer.slice(0, boundary).trim();
          buffer = buffer.slice(boundary + 2);
          if (!rawEvent) continue;
          const lines = rawEvent.split(/\r?\n/);
          let eventType = "message";
          const dataLines = [];
          lines.forEach((line) => {
            if (line.startsWith("event:")) eventType = line.slice(6).trim();
            else if (line.startsWith("data:"))
              dataLines.push(line.slice(5).trim());
          });
          const dataStr = dataLines.join("\n");
          if (!dataStr) continue;
          try {
            const payload = JSON.parse(dataStr);
            handleSSEEvent(eventType, payload);
          } catch (err) {
            console.error("SSE parse error:", err, dataStr);
          }
        }
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Failed to generate dashboard. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };
  const handleSSEEvent = (eventType, data) => {
    switch (eventType) {
      case "progress":
        setProgress(data.progress || 0);
        if (data.message) setMessage(data.message);
        if (data.kpi_summaries?.length) {
          data.kpi_summaries.forEach((s) => {
            const id = s.id || s.title || JSON.stringify(s);
            if (!orderedKpiIdsRef.current.includes(id))
              orderedKpiIdsRef.current.push(id);
            kpiMapRef.current.set(id, {
              ...s,
              id,
              status: "pending",
              isKpiCard: false,
            });
          });
          syncStateFromRefs();
        }
        break;
      case "card_progress":
        setProgress(data.progress || 0);
        if (data.message) setMessage(data.message);
        if (data.card) {
          const k = data.card;
          const id = k.title.replace(/\s+/g, "*").toLowerCase() || JSON.stringify(k);
          if (!orderedKpiIdsRef.current.includes(id))
            orderedKpiIdsRef.current.push(id);
          // Updated: Process the card data directly (no second param needed)
          const processedData = processKpiCardData(k);
          kpiMapRef.current.set(id, {
            ...k,
            id,
            isKpiCard: true,
            ...processedData, // Spread the processed fields
            sql_error: k.sql_error,
            has_error: data.has_error,
          });
          syncStateFromRefs();
        }
        break;
      case "cards_complete":
        setProgress(data.progress || 0);
        if (data.message) setMessage(data.message);
        // Note the completion of cards, update message if needed
        if (data.successful_cards === 0) {
          toast.warning(`All ${data.total_cards} KPI cards encountered errors.`);
        }
        break;
      case "kpi_complete": {
        const item = data.kpi_data;
        if (!item) break;
        const id =
          item.kpi_id ||
          item.kpi?.id ||
          item.kpi?.title ||
          JSON.stringify(item.kpi || item);
        if (item.kpi) item.kpi.id = id;
        if (!orderedKpiIdsRef.current.includes(id))
          orderedKpiIdsRef.current.push(id);
        kpiMapRef.current.set(id, {
          ...(item.kpi || {}),
          id,
          isKpiCard: false,
        });
        chartMapRef.current.set(id, {
          ...item,
          kpi_id: id,
          kpi: item.kpi || kpiMapRef.current.get(id),
          data: item.data || [],
          chart_config: item.chart_config || {},
          sql_query: item.sql_query || "",
          error: item.error,
        });
        if (!orderedChartIdsRef.current.includes(id))
          orderedChartIdsRef.current.push(id);
        syncStateFromRefs();
        if (data.message) setMessage(data.message);
        if (data.progress) setProgress(data.progress);
        break;
      }
      case "kpi_error": {
        const item = data.kpi_data;
        if (!item) break;
        const id =
          item.kpi_id || item.kpi?.id || JSON.stringify(item.kpi || item);
        if (!orderedKpiIdsRef.current.includes(id))
          orderedKpiIdsRef.current.push(id);
        if (item.kpi)
          kpiMapRef.current.set(id, {
            ...item.kpi,
            id,
            status: "error",
            isKpiCard: false,
          });
        else
          kpiMapRef.current.set(id, {
            id,
            title: item.title || "Error KPI",
            status: "error",
            isKpiCard: false,
          });
        chartMapRef.current.set(id, {
          ...item,
          kpi_id: id,
          kpi: item.kpi || kpiMapRef.current.get(id),
          data: item.data || [],
          error: "An error occurred", // Generic error message
        });
        if (!orderedChartIdsRef.current.includes(id))
          orderedChartIdsRef.current.push(id);
        syncStateFromRefs();
        toast.error("An error occurred while loading a KPI.");
        if (data.message) setMessage(data.message);
        break;
      }
      case "complete":
        setProgress(100);
        const errorCount = Array.from(chartMapRef.current.values()).filter(
          (i) => i.error
        ).length;
        setMessage(
          errorCount > 0
            ? `Complete with ${errorCount} error${errorCount > 1 ? "s" : ""}.`
            : data.message || "Complete!"
        );
        const finalRes = data.result;
        if (finalRes?.kpi_cards?.length) {
          finalRes.kpi_cards.forEach((k) => {
            const id = k.title.replace(/\s+/g, "*").toLowerCase() || JSON.stringify(k);
            if (!orderedKpiIdsRef.current.includes(id))
              orderedKpiIdsRef.current.push(id);
            // Updated: Process each final KPI card
            const processedData = processKpiCardData(k);
            kpiMapRef.current.set(id, {
              ...k,
              id,
              isKpiCard: true,
              ...processedData,
              sql_error: k.sql_error,
              has_error: k.has_error || false, // Use from card, not hardcoded
            });
          });
          syncStateFromRefs();
        }
        setIsGenerating(false);
        setHasGenerated(true); // Set flag after complete generation
        break;
      case "error":
        setMessage(data.message || "Stream error");
        toast.error("An error occurred during dashboard generation.");
        setIsGenerating(false);
        console.error("Stream error:", data);
        break;
      default:
        console.debug("Unhandled SSE:", eventType, data);
    }
  };
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      generateDashboard();
    }
  };
  // Updated: Voice input handler with robustness
  const startVoiceInput = useCallback(() => {
    if (isListening) {
      // Stop if already listening
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      setPartialTranscript("");
      return;
    }
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      toast.error(
        "Speech recognition not supported in this browser. Please use Chrome or Edge."
      );
      return;
    }
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true; // Enable partial results for real-time feedback
    recognition.continuous = false; // Single utterance for goal input
    recognition.maxAlternatives = 1;
    // Visual feedback
    setIsListening(true);
    setPartialTranscript("");
    recognition.onstart = () => {
      console.log("Voice recognition started");
      toast.info("Listening... Speak your goal now.");
    };
    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";
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
      // Set final result
      if (finalTranscript) {
        setGoal(finalTranscript);
        setPartialTranscript("");
        toast.success("Goal set from voice input!");
      }
    };
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      setPartialTranscript("");
      let errorMessage = "Voice input error. ";
      switch (event.error) {
        case "not-allowed":
          errorMessage +=
            "Microphone permission denied. Please allow access and try again.";
          break;
        case "no-speech":
          errorMessage +=
            "No speech detected. Please speak louder or closer to the mic.";
          break;
        case "audio-capture":
          errorMessage += "Microphone issue. Check your audio settings.";
          break;
        case "network":
          errorMessage += "Network error. Check your connection.";
          break;
        default:
          errorMessage += event.error;
      }
      toast.error(errorMessage);
    };
    recognition.onend = () => {
      console.log("Voice recognition ended");
      setIsListening(false);
      setPartialTranscript("");
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
    };
    // Handle stopping
    const handleStop = () => {
      recognition.stop();
    };
    // Cleanup on unmount or stop
    recognitionRef.current = recognition;
    // Start recognition
    try {
      recognition.start();
    } catch (err) {
      console.error("Failed to start recognition:", err);
      setIsListening(false);
      toast.error("Failed to start voice input. Please try again.");
    }
    // Optional: Add global stop listener (e.g., on spacebar or something, but for now, button toggle)
  }, [isListening]);
  // Load role from token on mount
  useEffect(() => {
    const role = getRoleFromToken();
    setPersona(role);
  }, []);
  // Load from cache on mount
  useEffect(() => {
    const cached = localStorage.getItem("dashboardCache");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const {
          kpis: cachedKpis,
          charts: cachedCharts,
          goal: cachedGoal,
          layouts: cachedLayouts,
        } = parsed;
        setGoal(cachedGoal || goal);
        // Populate refs from cached data
        kpiMapRef.current.clear();
        orderedKpiIdsRef.current = [];
        cachedKpis.forEach((k) => {
          // Re-process cached KPIs with new format handler if needed
          const processed = k.isKpiCard ? processKpiCardData(k) : {};
          kpiMapRef.current.set(k.id, { ...k, ...processed });
          orderedKpiIdsRef.current.push(k.id);
        });
        chartMapRef.current.clear();
        orderedChartIdsRef.current = [];
        cachedCharts.forEach((c) => {
          const cid = c.kpi_id || c.id;
          chartMapRef.current.set(cid, {
            ...c,
            data: c.data ? [...c.data] : [],
          });
          orderedChartIdsRef.current.push(cid);
          // Ensure kpi exists in map
          if (!kpiMapRef.current.has(cid)) {
            kpiMapRef.current.set(cid, {
              id: cid,
              title: c.kpi?.title || "Untitled KPI",
              isKpiCard: false,
            });
            orderedKpiIdsRef.current.push(cid);
          }
        });
        // Sync to state
        syncStateFromRefs();
        // Load layouts if available
        if (cachedLayouts) {
          setLayouts(cachedLayouts);
        }
        setHasGenerated(true); // Assume cached is "generated"
      } catch (e) {
        console.error("Failed to load from cache:", e);
        localStorage.removeItem("dashboardCache");
        toast.error("Failed to load cached dashboard. Starting fresh.");
      }
    }
  }, [syncStateFromRefs]);
  // Save to cache after generation completes
  useEffect(() => {
    if (
      !isGenerating &&
      progress === 100 &&
      kpis.length > 0 &&
      charts.length > 0
    ) {
      const cache = {
        kpis: kpis.map((k) => ({ ...k })),
        charts: charts.map((c) => ({ ...c, data: c.data ? [...c.data] : [] })),
        goal,
        layouts, // Save custom layouts
        timestamp: Date.now(),
      };
      localStorage.setItem("dashboardCache", JSON.stringify(cache));
    }
  }, [isGenerating, progress, kpis, charts, goal, layouts]);
  // Generate initial layouts only after generation completes
  useEffect(() => {
    if (kpis.length === 0 && charts.length === 0) return;
    const lg = [];
    const md = [];
    const sm = [];
    const LG_COLS = 12;
    const MD_COLS = 12;
    const SM_COLS = 6;
    const KPI_WIDTH_LG = 3; // Adjusted for 4 per row: 12 / 4 = 3
  const KPI_HEIGHT_LG = 4; // Slightly increased to reduce cramped layout
    const KPI_WIDTH_MD = 3; // Same for md: 4 per row
  const KPI_HEIGHT_MD = 4;
    const KPI_WIDTH_SM = 3; // 6 / 3 = 2 per row on sm
  const KPI_HEIGHT_SM = 4;
    const KPIS_PER_ROW_LG = 4; // Maximum 4 per row
    const KPIS_PER_ROW_MD = 4;
    const KPIS_PER_ROW_SM = 2;
    const CHART_WIDTH_LG = 6;
    const CHART_HEIGHT_LG = 8; // Reduced height for more compact layout while maintaining good aspect ratio for financial charts
    const CHARTS_PER_ROW_LG = 2;
    const CHART_WIDTH_MD = 6;
    const CHART_HEIGHT_MD = 8; // Reduced height for more compact layout
    const CHARTS_PER_ROW_MD = 2;
    const CHART_WIDTH_SM = 6; // Full width
    const CHART_HEIGHT_SM = 10; // Reduced height on mobile for better scrolling without excessive vertical space
    const KPI_MAX_W_LG = 6; //
    const KPI_MAX_H_LG = 6; //
    const CHART_MAX_W_LG = 12; //
    const CHART_MAX_H_LG = 16; //
    const cardIds = orderedKpiIdsRef.current.filter(
      (id) => kpiMapRef.current.get(id)?.isKpiCard
    );
    cardIds.forEach((id, i) => {
      const item = {
        i: `kpi-${id}`,
        x: (i % KPIS_PER_ROW_LG) * KPI_WIDTH_LG,
        y: Math.floor(i / KPIS_PER_ROW_LG) * KPI_HEIGHT_LG,
        w: KPI_WIDTH_LG,
        h: KPI_HEIGHT_LG,
        minW: 2, // Slightly lower min for flexibility
        maxW: KPI_MAX_W_LG,
  minH: 3, // restore sensible minimum height
        maxH: KPI_MAX_H_LG,
      };
      lg.push(item);
    });
    cardIds.forEach((id, i) => {
      const item = {
        i: `kpi-${id}`,
        x: (i % KPIS_PER_ROW_MD) * KPI_WIDTH_MD,
        y: Math.floor(i / KPIS_PER_ROW_MD) * KPI_HEIGHT_MD,
        w: KPI_WIDTH_MD,
        h: KPI_HEIGHT_MD,
        minW: 2,
        maxW: KPI_MAX_W_LG,
  minH: 3,
        maxH: KPI_MAX_H_LG,
      };
      md.push(item);
    });
    // KPIs for sm: 2 per row
    cardIds.forEach((id, i) => {
      sm.push({
        i: `kpi-${id}`,
        x: (i % KPIS_PER_ROW_SM) * KPI_WIDTH_SM,
        y: Math.floor(i / KPIS_PER_ROW_SM) * KPI_HEIGHT_SM,
        w: KPI_WIDTH_SM,
        h: KPI_HEIGHT_SM,
        minW: 2,
        maxW: 4, // Slightly increased
  minH: 3, // Adjusted minH to match slightly increased height
        maxH: 6, // Increased
      });
    });
    // Charts start after KPIs
    const chartsStartY_lg_md =
      Math.ceil(cardIds.length / KPIS_PER_ROW_LG) * KPI_HEIGHT_LG;
    // Charts for lg: strictly 2 per row
    orderedChartIdsRef.current.forEach((id, index) => {
      const w = CHART_WIDTH_LG;
      const h = CHART_HEIGHT_LG;
      const rowIndex = Math.floor(index / CHARTS_PER_ROW_LG);
      const colIndex = index % CHARTS_PER_ROW_LG;
      const currentX_lg = colIndex * w;
      const currentY_lg = chartsStartY_lg_md + rowIndex * h;
      const item = {
        i: `chart-${id}`,
        x: currentX_lg,
        y: currentY_lg,
        w: w,
        h: h,
        minW: 4, // Slightly lower min for slimmer options
        maxW: CHART_MAX_W_LG, // Full grid width
        minH: 6,
        maxH: CHART_MAX_H_LG, // Much taller allowed
      };
      lg.push(item);
    });
    // Charts for md: same logic
    orderedChartIdsRef.current.forEach((id, index) => {
      const w = CHART_WIDTH_MD;
      const h = CHART_HEIGHT_MD;
      const rowIndex = Math.floor(index / CHARTS_PER_ROW_MD);
      const colIndex = index % CHARTS_PER_ROW_MD;
      const currentX_md = colIndex * w;
      const currentY_md = chartsStartY_lg_md + rowIndex * h;
      const item = {
        i: `chart-${id}`,
        x: currentX_md,
        y: currentY_md,
        w: w,
        h: h,
        minW: 4,
        maxW: CHART_MAX_W_LG,
        minH: 6,
        maxH: CHART_MAX_H_LG,
      };
      md.push(item);
    });
    // Charts for sm: vertical stack, full width
    const chartsStartY_sm =
      Math.ceil(cardIds.length / KPIS_PER_ROW_SM) * KPI_HEIGHT_SM;
    let currentY_sm = chartsStartY_sm;
    orderedChartIdsRef.current.forEach((id) => {
      const w = CHART_WIDTH_SM;
      const h = CHART_HEIGHT_SM;
      sm.push({
        i: `chart-${id}`,
        x: 0,
        y: currentY_sm,
        w: w,
        h: h,
        minW: 5,
        maxW: 6,
        minH: 7,
        maxH: 13,
      });
      currentY_sm += h;
    });
    setLayouts({ lg, md, sm });
  }, [kpis.length, charts.length]); // Only regenerate after hasGenerated and lengths stable
  const cfoSuggestions = [
    "Strategic Financial Insights",
    "Spend Trend Analysis",
    "Vendor Concentration Risk",
  ];
  const personaOptions = [
    { value: "CFO", label: "CFO" },
    { value: "Finance_Lead", label: "Finance Lead" },
    { value: "Finance_Analyst", label: "Finance Analyst" },
  ];
  const getPersonaDisplayName = (personaValue) => {
    const option = personaOptions.find((opt) => opt.value === personaValue);
    return option ? option.label : personaValue;
  };
  const handleReset = () => {
    localStorage.removeItem("dashboardCache");
    kpiMapRef.current.clear();
    orderedKpiIdsRef.current = [];
    chartMapRef.current.clear();
    orderedChartIdsRef.current = [];
    syncStateFromRefs();
    setResetKey((k) => k + 1);
    setLayouts({ lg: [], md: [], sm: [] }); // Reset layouts too
    setHasGenerated(false);
  };
  const handleOpenRegenModal = useCallback((id) => {
    setCurrentChartId(id);
    setShowRegenModal(true);
  }, []);
  const handleCloseRegenModal = useCallback(() => {
    setShowRegenModal(false);
    setCurrentChartId(null);
  }, []);
  const handleRegenerate = useCallback((id, prompt) => {
    regenerateChart(id, prompt);
  }, []);
  const handleLayoutChange = useCallback((newLayout, allLayouts) => {
    // Update the current breakpoint's layout (assuming lg for simplicity; extend for others if needed)
    setLayouts(allLayouts);
    // Auto-save to localStorage
    localStorage.setItem("customLayout", JSON.stringify(allLayouts));
  }, []);
  const ChartsList = useMemo(
    () =>
      charts.map((chart) => {
        const id = chart.kpi_id || chart.kpi?.id || "unknown";
        const title =
          chart.chart_config?.title || chart.kpi?.title || "Untitled Chart";
        const subtitle = chart.chart_config?.subtitle || "";
        const description = chart.kpi?.description || "";
        const drillEnabled = true; // Enabled by default for all charts to make them clickable
        return (
          <div key={`chart-${id}`}>
            <div className="group/chart bg-purple-100/90 hover:bg-purple-100/95 transition-colors duration-500 rounded-3xl border border-white/40 shadow-2xl h-full flex flex-col overflow-hidden cursor-move hover:shadow-3xl hover:shadow-purple-200/50 backdrop-blur-xl">
              <div className="px-6 py-5 border-b border-gray-100/50 flex items-center justify-between bg-gradient-to-r from-purple-50/50 via-purple-100/50 to-purple-50/50">
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="flex-1 min-w-0 text-lg font-bold text-gray-800 truncate">
                      {title}
                    </h2>
                    {description && (
                      <div
                        className="relative group/desc flex-shrink-0"
                        role="tooltip"
                        aria-label="Chart description"
                      >
                        <InformationCircleIcon className="h-4 w-4 text-gray-400 flex-shrink-0 transition-all duration-300 group-hover/desc:scale-110 group-hover/desc:text-indigo-500 cursor-help" />
                        <div className="invisible group-hover/desc:visible absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-gradient-to-r from-gray-900/95 to-gray-800/95 text-white text-xs px-4 py-3 rounded-2xl z-[9999] whitespace-pre-wrap max-w-md shadow-2xl backdrop-blur-md border border-white/30 transition-all duration-300 opacity-0 group-hover/desc:opacity-100 group-hover/desc:translate-y-1">
                          {/* Arrow for better UX */}
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-transparent border-b-gray-900/95 rotate-180" />
                          </div>
                          <p className="relative z-10 leading-relaxed">
                            {description}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  {subtitle && (
                    <p className="text-sm text-gray-600 font-medium truncate mt-1">
                      {subtitle}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover/chart:opacity-100 transition-all duration-300">
                  {chart.error && (
                    <span className="text-gray-400 hover:text-red-500 p-1 rounded-xl hover:bg-red-50/80 backdrop-blur-sm border border-red-200/50 hover:shadow-md">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                    </span>
                  )}
                  {chart.data && chart.data.length > 0 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setCurrentData(chart.data);
                          setCurrentTitle(chart.kpi?.title || "");
                          setCurrentConfig(chart.chart_config || {});
                          setCurrentPage(0);
                          setShowDataModal(true);
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        className="group relative text-gray-400 hover:text-indigo-500 p-1.5 rounded-xl hover:bg-indigo-50/80 backdrop-blur-sm border border-indigo-200/50 hover:shadow-md hover:shadow-indigo-100/50 transition-all duration-300 active:scale-95"
                        title="View Data"
                        aria-label="View underlying data"
                      >
                        <MagnifyingGlassIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          downloadCSV(chart.data, `${title}.csv`);
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        className="group relative text-gray-400 hover:text-green-500 p-1.5 rounded-xl hover:bg-green-50/80 backdrop-blur-sm border border-green-200/50 hover:shadow-md hover:shadow-green-100/50 transition-all duration-300 active:scale-95"
                        title="Download CSV"
                        aria-label="Download data as CSV"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          downloadPNG(`chart-content-${id}`, `${title}.png`);
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        className="group relative text-gray-400 hover:text-purple-500 p-1.5 rounded-xl hover:bg-purple-50/80 backdrop-blur-sm border border-purple-200/50 hover:shadow-md hover:shadow-purple-100/50 transition-all duration-300 active:scale-95"
                        title="Download PNG"
                        aria-label="Download chart as PNG"
                      >
                        <PhotoIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          // Demo with example values (fallback if no click)
                          const demoColumn = "bucket";
                          const demoValue = "0-30";
                          handleDrillClick(id, demoColumn, demoValue);
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        className="group relative text-gray-400 hover:text-indigo-600 p-1.5 rounded-xl hover:bg-indigo-50/80 backdrop-blur-sm border border-indigo-200/50 hover:shadow-md hover:shadow-indigo-100/50 transition-all duration-300 active:scale-95"
                        title="Demo Drill-Down (click chart for real data)"
                        aria-label="Demo drill down into data"
                      >
                        <ChevronDownIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleOpenRegenModal(id);
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        className="group relative text-gray-400 hover:text-purple-500 p-1.5 rounded-xl hover:bg-purple-50/80 backdrop-blur-sm border border-purple-200/50 hover:shadow-md hover:shadow-purple-100/50 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Regenerate with AI"
                        aria-label="Regenerate chart using AI"
                        disabled={isRegenerating}
                      >
                        {isRegenerating ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500" />
                        ) : (
                          <SparklesIcon className="h-4 w-4" />
                        )}
                      </button>
                    </>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      deleteItem(id, false);
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    className="group relative text-gray-400 hover:text-red-500 p-1.5 rounded-xl hover:bg-red-50/80 backdrop-blur-sm border border-red-200/50 hover:shadow-md hover:shadow-red-100/50 transition-all duration-300 active:scale-95"
                    title="Delete Chart"
                    aria-label="Delete this chart"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div
                className="flex-1 p-6 relative overflow-hidden bg-white"
                id={`chart-content-${id}`}
              >
                {chart.error ? (
                  <div className="flex items-center justify-center h-full text-sm text-red-600 bg-gradient-to-br from-red-50/80 to-red-100/80 backdrop-blur-sm p-6 rounded-2xl border border-red-200/50 shadow-sm">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                    An error occurred while loading the chart.
                  </div>
                ) : (
                  <ErrorBoundary>
                    <ChartRenderer
                      kpi={
                        chart.kpi || {
                          chart_type:
                            chart.chart_config?.chart_type || "unknown",
                        }
                      }
                      data={chart.data}
                      chartConfig={chart.chart_config || {}}
                      onElementClick={
                        drillEnabled
                          ? (selectedColumn, selectedValue) => {
                              console.log("🎯 Chart element clicked:", {
                                chartId: id,
                                selectedColumn,
                                selectedValue,
                              });
                              handleDrillClick(
                                id,
                                selectedColumn,
                                selectedValue
                              );
                            }
                          : undefined
                      }
                      // Pass enhanced tooltip config to ChartRenderer if it supports it
                      tooltipConfig={{
                        // Example config for improved tooltips in ChartRenderer
                        // Assume ChartRenderer uses a lib like Recharts/Chart.js and can accept custom tooltip
                        customTooltip: true,
                        formatValue: (value, name) => {
                          // Financial-friendly formatting
                          if (
                            typeof value === "number" &&
                            isCurrencyKPI(name)
                          ) {
                            return `$${formatNumber(value, true)}`;
                          }
                          if (typeof value === "number") {
                            return formatNumber(value);
                          }
                          if (value instanceof Date) {
                            return safeFormatDate(value);
                          }
                          return value;
                        },
                        styles: {
                          background:
                            "linear-gradient(to right, rgb(31 41 55 / 0.95), rgb(17 24 39 / 0.95))",
                          color: "white",
                          borderRadius: "12px",
                          padding: "12px",
                          boxShadow:
                            "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)",
                          fontSize: "14px",
                          maxWidth: "400px",
                        },
                        // Add pointer arrow if supported
                        showArrow: true,
                      }}
                    />
                    {/* {drillEnabled && (
                      <div className="absolute top-4 right-4 bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg animate-pulse">
                        Click to drill down →
                      </div>
                    )} */}
                  </ErrorBoundary>
                )}
              </div>
            </div>
          </div>
        );
      }),
    [charts, isRegenerating, handleDrillClick]
  ); // Memoize the entire charts list to prevent re-renders on modal state changes
  const sidebarLeftClass = isCollapsed ? "left-20" : "left-64";
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6 relative overflow-hidden">
      {/* Subtle background animation */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>
      <header className="relative z-10 space-y-8 mb-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-800 bg-clip-text text-transparent drop-shadow-sm">
              {getPersonaDisplayName(persona)} Financial Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-2 font-medium backdrop-blur-sm bg-white/60 px-3 py-1 rounded-full inline-block">
              Click 'Generate Dashboard' to start
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={generateDashboard}
              disabled={isGenerating || !goal.trim()}
              className="group relative flex items-center gap-3 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-indigo-400 focus:ring-offset-2 transition-all duration-500 transform hover:-translate-y-1 active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white z-10" />
                  <span className="z-10">Generating...</span>
                </>
              ) : (
                <>
                  <ArrowTrendingUpIcon className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300 z-10" />
                  <span className="z-10">Generate Dashboard</span>
                </>
              )}
            </button>
            {layouts.lg?.length > 0 && (
              <>
                <button
                  onClick={() => setFreeformMode(!freeformMode)}
                  className={`group relative flex items-center gap-2 px-4 py-3 text-sm font-semibold ${
                    freeformMode
                      ? "bg-green-100 text-green-700 border border-green-300/60"
                      : "bg-white/90 text-gray-700 border border-gray-200/60"
                  } rounded-xl hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-2 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 overflow-hidden`}
                >
                  <span
                    className={
                      freeformMode ? "text-green-500" : "text-gray-400"
                    }
                  >
                    {freeformMode ? "🆓" : "🔒"}
                  </span>
                  <span>{freeformMode ? "Freeform" : "Structured"}</span>
                  <span className="text-xs">(Layout)</span>
                </button>
                <button
                  onClick={handleReset}
                  className="group relative flex items-center gap-2 px-4 py-3 text-sm font-semibold text-gray-700 bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-xl hover:bg-white hover:border-gray-300/80 hover:shadow-xl hover:shadow-indigo-100/50 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-2 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 overflow-hidden"
                >
                  <ArrowPathIcon className="h-4 w-4 group-hover:rotate-180 transition-transform duration-300" />
                  Reset
                </button>
                <button
                  onClick={() => downloadPNG("dashboard-grid", "dashboard.png")}
                  className="group relative flex items-center gap-2 px-4 py-3 text-sm font-semibold text-gray-700 bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-xl hover:bg-white hover:border-gray-300/80 hover:shadow-xl hover:shadow-pink-100/50 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:ring-offset-2 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 overflow-hidden"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Export
                </button>
              </>
            )}
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white/40 shadow-2xl shadow-indigo-100/50">
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div>
              <label
                htmlFor="goal"
                className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"
              >
                <SparklesIcon className="h-4 w-4 text-indigo-500" />
                Strategic Goal
              </label>
              <div className="relative">
                <input
                  id="goal"
                  type="text"
                  value={isListening ? partialTranscript : goal}
                  onKeyDown={handleKeyDown}
                  onChange={(e) => setGoal(e.target.value)}
                  className={`block w-full rounded-2xl border-2 px-5 py-4 pr-20 shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 sm:text-sm transition-all duration-500 ${
                    !goal.trim() && isGenerating
                      ? "border-red-300 focus:ring-red-200 focus:border-red-500 bg-red-50/50"
                      : "border-gray-200/60 focus:border-indigo-500 hover:border-indigo-300/50 hover:shadow-xl hover:shadow-indigo-100/30 bg-white/50"
                  } ${
                    isListening
                      ? "border-indigo-500 bg-indigo-50/20 animate-pulse"
                      : ""
                  }`}
                  placeholder="e.g., Gain insights into vendor distribution and supply chain efficiency"
                />
                <button
                  type="button"
                  onClick={startVoiceInput}
                  className={`absolute inset-y-0 right-12 flex items-center pr-4 transition-all duration-300 ${
                    isListening
                      ? "text-red-500 animate-pulse"
                      : "text-gray-400 hover:text-indigo-500"
                  }`}
                  title={isListening ? "Stop listening" : "Start voice input"}
                  aria-label={
                    isListening ? "Stop voice input" : "Start voice input"
                  }
                >
                  <MicrophoneIcon
                    className={`h-5 w-5 ${isListening ? "animate-bounce" : ""}`}
                  />
                </button>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 transition-colors duration-300 group-hover:text-indigo-500" />
                </div>
              </div>
              {!goal.trim() && (
                <p className="mt-2 text-sm text-red-600 font-medium bg-red-50/80 px-3 py-2 rounded-xl border border-red-200/50">
                  Please enter a goal to generate the dashboard.
                </p>
              )}
              {isListening && (
                <p className="mt-2 text-sm text-indigo-600 font-medium bg-indigo-50/80 px-3 py-2 rounded-xl border border-indigo-200/50 flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                  Listening... Speak clearly.
                </p>
              )}
              <p className="mt-3 text-xs text-gray-500">
                Describe your objective to tailor the KPIs and charts (e.g.,
                "strategic financial insights", "cost optimization analysis").
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {cfoSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setGoal(suggestion)}
                className="group relative px-4 py-2.5 text-xs bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 text-indigo-800 rounded-full hover:from-indigo-200 hover:via-purple-200 hover:to-pink-200 font-semibold transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg hover:shadow-indigo-200/50 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                <span className="relative z-10">{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
        {(isGenerating || progress > 0) && (
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white/40 shadow-2xl shadow-purple-100/50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                {isGenerating && (
                  <div className="inline-flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-ping" />
                    <span>Generating Insights</span>
                  </div>
                )}
              
              </span>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent drop-shadow-sm">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200/50 rounded-full h-3 overflow-hidden shadow-inner backdrop-blur-sm">
              <div
                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 h-3 rounded-full transition-all duration-1000 ease-out shadow-lg relative overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-shimmer" />
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600 font-medium flex justify-between">
              <span>KPIs: {kpis.length}</span>
              <span>Charts: {charts.length}</span>
            </div>
          </div>
        )}
      </header>
      {layouts.lg?.length > 0 && (
        <div id="dashboard-grid" className="mb-8 relative z-10">
          <ResponsiveGridLayout
            key={resetKey}
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 900, sm: 768 }}
            cols={{ lg: 12, md: 12, sm: 6 }}
            rowHeight={44}
            margin={[18, 26]}
            containerPadding={[16, 16]}
            isDraggable
            isResizable
            compactType={freeformMode ? null : "vertical"}
            isBounded={!freeformMode}
            preventCollision={!freeformMode}
            onLayoutChange={handleLayoutChange}
            // ✅ PERF: Re-enabled useCSSTransforms={true} for GPU-accelerated positioning, reducing JS reflows during drag/resize
            // If child pointer events still conflict, combine with higher z-index on children or dragHandleClass
            useCSSTransforms={true}
            // ✅ PERF: Added measureBeforeMount={false} to skip initial measurement if layouts are pre-computed
            measureBeforeMount={false}
          >
            {kpis
              .filter((k) => k.isKpiCard)
              .map((kpi) => {
                const isCurrency = isCurrencyKPI(kpi.title) || kpi.metricType === "currency";
                const hasError = kpi.hasError || kpi.sql_error || kpi.formattedValue === "Error" || kpi.formattedValue === "N/A";
                const bgGradient = hasError
                  ? "from-red-50/80 via-red-100/80 to-red-50/80"
                  : isCurrency
                  ? "from-emerald-50/80 via-emerald-100/80 to-indigo-50/80"
                  : "from-indigo-50/80 via-purple-50/80 to-pink-50/80";
                const textGradient = hasError
                  ? "from-red-600 to-red-700"
                  : isCurrency
                  ? "from-emerald-600 to-emerald-700"
                  : "from-indigo-600 via-purple-600 to-pink-600";
                // Prepare a cleaned comparison label (remove parenthetical dates like '(2025-11-01 00:00:00+00)')
                const rawComparisonLabel = kpi.formattedComparison || kpi.comparison_label || "vs previous";
                const displayComparisonLabel = String(rawComparisonLabel).replace(/\s*\(.*?\)/, "").trim();
                return (
                  <div key={`kpi-${kpi.id}`}>
                    <ErrorBoundary
                      fallback={
                        <div className="p-6 text-red-600 text-center bg-red-50 rounded-2xl">
                          <ExclamationTriangleIcon className="h-5 w-5 mx-auto mb-2" />
                          An error occurred while rendering this KPI.
                        </div>
                      }
                    >
                      <div
                        className={`group relative rounded-3xl border border-white/40 shadow-2xl h-full p-4 cursor-move hover:shadow-3xl hover:shadow-indigo-200/50 transition-all duration-700 flex flex-col justify-between overflow-hidden bg-gradient-to-br ${bgGradient} backdrop-blur-xl hover:-translate-y-2 active:scale-[0.98]`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="flex flex-col h-full relative z-10">
                          {/* Simplified: Only title at top */}
                          <div className="mb-4 flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3
                                className="text-base sm:text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight truncate"
                                title={kpi.title}
                              >
                                {kpi.title}
                              </h3>
                              {kpi.description && (
                                <p
                                  className="text-xs text-gray-600 mt-1 truncate"
                                  title={kpi.description}
                                >
                                  {kpi.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {kpi.summary && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleOpenSummary(kpi.summary);
                                  }}
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                  }}
                                  className="relative opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-500 transition-all duration-300 p-2 rounded-2xl hover:bg-indigo-50/80 backdrop-blur-sm border border-indigo-200/50 hover:shadow-md hover:shadow-indigo-100/50"
                                  title="View Summary"
                                  aria-label="View KPI summary"
                                >
                                  <InformationCircleIcon className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  deleteItem(kpi.id, true);
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                }}
                                className="relative opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all duration-300 p-2 rounded-2xl hover:bg-red-50/80 backdrop-blur-sm border border-red-200/50 hover:shadow-md hover:shadow-red-100/50"
                                title="Delete KPI"
                                aria-label="Delete this KPI"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          {/* Simplified: Only value and change */}
                          <div className="flex-1 flex flex-col items-start justify-end gap-3">
                            <span
                              className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r ${textGradient} bg-clip-text text-transparent leading-tight drop-shadow-lg animate-fade-in-up`}
                            >
                              {hasError ? "Error" : kpi.formattedValue}
                            </span>
                            {/* Change indicator with improved UX: Larger, with icon and subtle animation */}
                            {kpi.change && kpi.formatConfig?.show_trend && (
                              <div
                                className={`relative flex items-center gap-2 p-4 rounded-2xl shadow-lg transition-all duration-500 min-w-0 flex-shrink-0 ${
                                  kpi.changeType === "positive"
                                    ? "bg-gradient-to-br from-emerald-50/90 to-emerald-100/90 border border-emerald-200/60 text-emerald-700 hover:from-emerald-100/90 hover:to-emerald-200/90 hover:shadow-emerald-200/50 animate-pulse-subtle"
                                    : "bg-gradient-to-br from-red-50/90 to-red-100/90 border border-red-200/60 text-red-700 hover:from-red-100/90 hover:to-red-200/90 hover:shadow-red-200/50 animate-pulse-subtle"
                                }`}
                              >
                                <div className={`flex-shrink-0 ${kpi.changeType === "positive" ? "text-emerald-500" : "text-red-500"}`}>
                                  {kpi.changeType === "positive" ? (
                                    <ArrowUpIcon className="h-5 w-5 animate-bounce-subtle" />
                                  ) : (
                                    <ArrowDownIcon className="h-5 w-5 animate-bounce-subtle" />
                                  )}
                                </div>
                                <div className="text-lg font-bold">
                                  {kpi.change}
                                </div>
                                <div className="text-xs text-gray-500 font-medium ml-auto truncate" title={rawComparisonLabel}>
                                  {displayComparisonLabel}
                                </div>
                              </div>
                            )}
                            {/* If no change, show neutral placeholder */}
                            {!kpi.change && !hasError && (
                              <div className="text-sm text-gray-500 font-medium bg-gray-100/60 px-4 py-2 rounded-xl">
                                No change data
                              </div>
                            )}
                          </div>
                          {hasError && (
                            <div className="flex items-center mt-4 text-red-600 text-xs bg-red-50/80 p-3 rounded-2xl border border-red-200/60 backdrop-blur-sm shadow-inner">
                              <ExclamationTriangleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span className="truncate font-semibold">
                                An error occurred.
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </ErrorBoundary>
                  </div>
                );
              })}
            {ChartsList}
          </ResponsiveGridLayout>
        </div>
      )}
      {!isGenerating && (!layouts.lg || layouts.lg.length === 0) && (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white/80 backdrop-blur-xl rounded-3xl border border-white/40 shadow-2xl mx-auto max-w-3xl relative z-10">
          <div className="relative">
            <ChartBarIcon className="h-24 w-24 text-gray-300 mb-6 animate-bounce drop-shadow-lg" />
            <div className="absolute -top-2 -right-2 h-6 w-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-ping opacity-75" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-3 drop-shadow-sm">
            Ready to Illuminate Your Finances?
          </h3>
          <p className="text-sm text-gray-600 font-medium mb-8 max-w-md leading-relaxed">
            Click "Generate Dashboard" to craft a personalized financial
            dashboard brimming with actionable insights.
          </p>
          <button
            onClick={generateDashboard}
            className="group relative px-10 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl font-bold shadow-2xl hover:shadow-3xl hover:shadow-indigo-200/50 focus:outline-none focus:ring-4 focus:ring-indigo-400 focus:ring-offset-2 transition-all duration-500 transform hover:-translate-y-2 active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
            <span className="relative z-10 flex items-center gap-2">
              <BoltIcon className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
              Get Started
            </span>
          </button>
        </div>
      )}
      {showDataModal && (
        <>
          {/* Backdrop: Full screen */}
          <div
            className="fixed inset-0 bg-black/50 z-[9999] backdrop-blur-md transition-opacity duration-300"
            onClick={() => setShowDataModal(false)}
          />
          {/* Modal: Centered popup */}
          <div
            className="fixed inset-0 flex items-center justify-center z-[10000] p-4 animate-fade-in-scale"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden shadow-2xl border border-white/40 backdrop-blur-xl">
              <div className="flex justify-between items-center p-6 border-b border-white/40 bg-gradient-to-r from-indigo-100/80 via-purple-100/80 to-pink-100/80 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <MagnifyingGlassIcon className="h-7 w-7 text-indigo-600 drop-shadow-sm" />
                  {currentTitle} Data Explorer
                </h2>
                <button
                  onClick={() => setShowDataModal(false)}
                  className="group relative px-4 py-2 text-gray-500 hover:text-gray-700 font-semibold rounded-xl hover:bg-white/50 backdrop-blur-sm border border-gray-200/50 transition-all duration-300 hover:shadow-md hover:shadow-gray-100/50 active:scale-95"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              {currentData.length > 0 ? (
                <>
                  <div className="flex-1 overflow-hidden flex">
                    <div className="flex-1 overflow-auto px-6 py-4">
                      <div className="min-w-full divide-y divide-gray-200/30">
                        <table className="min-w-full divide-y divide-gray-200/30">
                          <thead className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 sticky top-0 z-10 backdrop-blur-sm">
                            <tr>
                              {Object.keys(currentData[0] || {}).map((key) => (
                                <th
                                  key={key}
                                  className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"
                                  style={{ minWidth: '120px' }}
                                >
                                  {key
                                    .replace(/_/g, " ")
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white/50 divide-y divide-gray-200/30 backdrop-blur-sm">
                            {currentData
                              .slice(currentPage * 10, (currentPage + 1) * 10)
                              .map((row, idx) => (
                                <tr
                                  key={idx}
                                  className={`group hover:bg-indigo-50/50 transition-all duration-200 ${
                                    idx % 2 === 0 ? "bg-white/30" : "bg-indigo-50/20"
                                  }`}
                                >
                                  {Object.entries(row).map(([key, val]) => {
                                    let formattedVal = val;
                                    if (val == null || val === "") {
                                      formattedVal = "-";
                                    } else if (val instanceof Date) {
                                      formattedVal = safeFormatDate(val);
                                    } else if (typeof val === "number") {
                                      // Enhanced formatting: Use formatNumber for consistency
                                      const isCurrency = key.toLowerCase().includes("dollar") ||
                                        key.toLowerCase().includes("amount") ||
                                        key.toLowerCase().includes("cost") ||
                                        key.toLowerCase().includes("spend") ||
                                        key.toLowerCase().includes("inr") ||
                                        key.toLowerCase().includes("revenue") ||
                                        key.toLowerCase().includes("expense");
                                      formattedVal = formatNumber(val, {
                                        prefix: isCurrency ? "₹" : "",
                                        decimals: key.toLowerCase().includes("lat") ||
                                          key.toLowerCase().includes("lon") ? 6 :
                                          key.toLowerCase().includes("count") ||
                                          key.toLowerCase().includes("id") ? 0 : 2,
                                        currency: isCurrency,
                                      });
                                    } else if (typeof val === "string") {
                                      if (!isNaN(Date.parse(val))) {
                                        formattedVal = safeFormatDate(val);
                                      } else if (
                                        key
                                          .toLowerCase()
                                          .includes("percentage") ||
                                        key.toLowerCase().includes("pct")
                                      ) {
                                        const num = parseFloat(val);
                                        formattedVal = isNaN(num)
                                          ? val
                                          : `${formatNumber(num, { decimals: 2 })}%`;
                                      } else {
                                        formattedVal = val;
                                      }
                                    } else {
                                      formattedVal = String(val);
                                    }
                                    return (
                                      <td
                                        key={key}
                                        className="px-4 py-3 whitespace-pre-wrap text-sm text-gray-900 font-medium group-hover:text-gray-800 transition-colors duration-200 max-w-xs"
                                        title={
                                          typeof val === "string" &&
                                          val.length > 50
                                            ? val
                                            : undefined
                                        }
                                      >
                                        {formattedVal}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-white/40 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 flex flex-col sm:flex-row justify-between items-center gap-4 p-6 backdrop-blur-sm">
                    <span className="text-sm text-gray-700 font-medium">
                      Showing{" "}
                      <span className="font-bold">
                        {Math.min((currentPage + 1) * 10, currentData.length)}
                      </span>{" "}
                      of <span className="font-bold">{currentData.length}</span>{" "}
                      rows
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={currentPage === 0}
                        onClick={() => setCurrentPage((p) => p - 1)}
                        className="group relative flex items-center gap-1 px-4 py-2 bg-white/90 border border-gray-300/60 text-gray-700 rounded-xl disabled:bg-gray-100/80 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-indigo-50/80 backdrop-blur-sm hover:shadow-md hover:shadow-indigo-100/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-300 active:scale-95"
                      >
                        <ChevronLeftIcon className="h-4 w-4" />
                        Previous
                      </button>
                      <span className="px-4 py-2 text-sm font-semibold text-gray-700">
                        Page {currentPage + 1} of{" "}
                        {Math.ceil(currentData.length / 10)}
                      </span>
                      <button
                        disabled={(currentPage + 1) * 10 >= currentData.length}
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className="group relative flex items-center gap-1 px-4 py-2 bg-white/90 border border-gray-300/60 text-gray-700 rounded-xl disabled:bg-gray-100/80 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-indigo-50/80 backdrop-blur-sm hover:shadow-md hover:shadow-indigo-100/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-300 active:scale-95"
                      >
                        Next
                        <ChevronRightIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6 bg-gradient-to-r from-green-50/50 to-emerald-50/50 border-t border-white/40">
                    <button
                      onClick={() =>
                        downloadCSV(currentData, `${currentTitle}.csv`)
                      }
                      className="group relative w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-semibold shadow-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-green-200 focus:ring-offset-2 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                      <span className="relative z-10">Download Full CSV</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-500 font-medium backdrop-blur-sm p-6 bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
                  <p className="text-lg">No data available for this chart.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      {/* New: Drill-Down Modal */}
      <DrillDownModal
        isOpen={showDrillModal}
        onClose={() => {
          setShowDrillModal(false);
          setDrillData(null);
          setDrillBreadcrumb([]);
        }}
        drillData={drillData}
        onDrillFurther={handleFurtherDrill}
        breadcrumb={drillBreadcrumb}
        onBreadcrumbClick={handleBreadcrumbClick}
        isDrilling={isDrilling}
      />
      {/* New: Summary Modal */}
      <SummaryModal
        isOpen={showSummaryModal}
        onClose={handleCloseSummary}
        summary={currentSummary}
      />
      <RegenerateModal
        isOpen={showRegenModal}
        onClose={handleCloseRegenModal}
        onRegenerate={handleRegenerate}
        isRegenerating={isRegenerating}
        currentChartId={currentChartId}
      />
      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse-subtle {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-2px);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        @keyframes fade-in-scale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in-scale {
          animation: fade-in-scale 0.3s ease-out;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s infinite;
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 1s infinite;
        }
      `}</style>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}