import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  AlertTriangle,
  DollarSign,
  Copy,
  Receipt,
  Download,
  Search,
  Clipboard,
  ChevronUp,
  ChevronDown,
  FileText,
  AlertCircle,
  XCircle,
  Briefcase,
  Loader,
  Moon,
  Sun,
  Sparkles,
  ChevronRight,
  ChevronDown as ChevronDownIcon,
  Filter,
  Bell,
  User,
  RefreshCw,
  DownloadCloud,
  ArrowUpDown,
  Settings,
  Activity,
  Calendar,
  Maximize2,
  Minimize2,
} from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "../config/axios";
const AccountsPayableDashboard = () => {
  const [globalSearch, setGlobalSearch] = useState("");
  const [expandedFindings, setExpandedFindings] = useState(new Set());
  const [activeTab, setActiveTab] = useState("all");
  const [data1, setData1] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "", visible: false });
  const [showMoreRows, setShowMoreRows] = useState({}); // Track show more per finding

  const ITEMS_PER_PAGE = 5;

  const fetchData = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/run_proactive_agents`,
        {},
        {
          headers: {
            Accept: "application/json",
          },
        }
      );
      setData1(response.data);
      console.log("Fetched data:", response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch insights. Please try again.");
      showToast("Failed to load data", "error");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = useCallback(() => {
    fetchData();
  }, []);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
  }, []);

  const tabConfigs = [
    { id: "all", label: "All Insights", icon: Activity },
    {
      id: "sla-breaches",
      label: "SLA Breaches",
      icon: AlertTriangle,
      tool: "summarize_sla_breaches",
    },
    {
      id: "discount-opportunities",
      label: "Discount Opportunities",
      icon: DollarSign,
      tool: "find_discount_opportunities",
    },
    {
      id: "duplicate-invoices",
      label: "Duplicate Invoices",
      icon: Copy,
      tool: "find_potential_duplicate_invoices",
    },
    {
      id: "partial-payments",
      label: "Partial Payments",
      icon: Receipt,
      tool: "find_recent_partial_payments",
    },
    {
      id: "pending-invoices",
      label: "Pending Invoices",
      icon: FileText,
      tool: "find_invoices_pending_too_long",
    },
  ];

  const severityStyles = useMemo(
    () => ({
      Critical: {
        bg: "bg-red-100 dark:bg-red-900",
        text: "text-red-900 dark:text-white",
        border: "border-red-200 dark:border-red-700",
        badgeBg: "bg-red-200/70 dark:bg-red-800/50",
        badgeText: "text-red-900 dark:text-white",
        cardBg: "bg-gradient-to-br from-red-50/50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/20",
        cardBorder: "border-red-200/50 dark:border-red-800/30",
        cardText: "text-red-900 dark:text-red-100",
        cardIconBg: "bg-red-500/10 dark:bg-red-500/20",
        cardIcon: "text-red-600 dark:text-red-400",
        countBg: "bg-red-500",
        countText: "text-white",
        headerBg: "bg-white/10 dark:bg-white/5",
        insightBg: "bg-purple-50 dark:bg-purple-900/20",
        insightBorder: "border-purple-200 dark:border-purple-700",
        actionBg: "bg-green-50 dark:bg-green-900/20",
        actionBorder: "border-green-200 dark:border-green-700",
        alertIcon: "text-red-500",
        alertBg: "bg-red-50 dark:bg-red-900/20",
        alertBorder: "border-red-200 dark:border-red-700",
        metricBg: "bg-red-100/80 dark:bg-red-800/50",
        metricText: "text-red-900 dark:text-red-100",
        impactBg: "bg-red-50/50 dark:bg-red-900/10",
        impactText: "text-red-800 dark:text-red-200",
        timeText: "text-gray-500 dark:text-gray-400",
        barBg: "bg-red-500",
      },
      High: {
        bg: "bg-orange-100 dark:bg-orange-900",
        text: "text-orange-900 dark:text-white",
        border: "border-orange-200 dark:border-orange-700",
        badgeBg: "bg-orange-200/70 dark:bg-orange-800/50",
        badgeText: "text-orange-900 dark:text-white",
        cardBg: "bg-gradient-to-br from-orange-50/50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/20",
        cardBorder: "border-orange-200/50 dark:border-orange-800/30",
        cardText: "text-orange-900 dark:text-orange-100",
        cardIconBg: "bg-orange-500/10 dark:bg-orange-500/20",
        cardIcon: "text-orange-600 dark:text-orange-400",
        countBg: "bg-orange-500",
        countText: "text-white",
        headerBg: "bg-white/10 dark:bg-white/5",
        insightBg: "bg-purple-50 dark:bg-purple-900/20",
        insightBorder: "border-purple-200 dark:border-purple-700",
        actionBg: "bg-green-50 dark:bg-green-900/20",
        actionBorder: "border-green-200 dark:border-green-700",
        alertIcon: "text-orange-500",
        alertBg: "bg-orange-50 dark:bg-orange-900/20",
        alertBorder: "border-orange-200 dark:border-orange-700",
        metricBg: "bg-orange-100/80 dark:bg-orange-800/50",
        metricText: "text-orange-900 dark:text-orange-100",
        impactBg: "bg-orange-50/50 dark:bg-orange-900/10",
        impactText: "text-orange-800 dark:text-orange-200",
        timeText: "text-gray-500 dark:text-gray-400",
        barBg: "bg-orange-500",
      },
      Medium: {
        bg: "bg-yellow-100 dark:bg-yellow-700",
        text: "text-yellow-900 dark:text-gray-900",
        border: "border-yellow-200 dark:border-yellow-600",
        badgeBg: "bg-yellow-200/70 dark:bg-yellow-600/50",
        badgeText: "text-yellow-900 dark:text-gray-900",
        cardBg: "bg-gradient-to-br from-yellow-50/50 to-yellow-100/50 dark:from-yellow-900/20 dark:to-yellow-800/20",
        cardBorder: "border-yellow-200/50 dark:border-yellow-800/30",
        cardText: "text-yellow-900 dark:text-yellow-100",
        cardIconBg: "bg-yellow-500/10 dark:bg-yellow-500/20",
        cardIcon: "text-yellow-600 dark:text-yellow-400",
        countBg: "bg-yellow-500",
        countText: "text-gray-900",
        headerBg: "bg-white/10 dark:bg-white/5",
        insightBg: "bg-purple-50 dark:bg-purple-900/20",
        insightBorder: "border-purple-200 dark:border-purple-700",
        actionBg: "bg-green-50 dark:bg-green-900/20",
        actionBorder: "border-green-200 dark:border-green-700",
        alertIcon: "text-yellow-500",
        alertBg: "bg-yellow-50 dark:bg-yellow-700/20",
        alertBorder: "border-yellow-200 dark:border-yellow-600",
        metricBg: "bg-yellow-100/80 dark:bg-yellow-600/50",
        metricText: "text-yellow-900 dark:text-yellow-100",
        impactBg: "bg-yellow-50/50 dark:bg-yellow-700/10",
        impactText: "text-yellow-800 dark:text-yellow-200",
        timeText: "text-gray-500 dark:text-gray-400",
        barBg: "bg-yellow-500",
      },
      Low: {
        bg: "bg-green-100 dark:bg-green-700",
        text: "text-green-900 dark:text-white",
        border: "border-green-200 dark:border-green-600",
        badgeBg: "bg-green-200/70 dark:bg-green-600/50",
        badgeText: "text-green-900 dark:text-white",
        cardBg: "bg-gradient-to-br from-green-50/50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20",
        cardBorder: "border-green-200/50 dark:border-green-800/30",
        cardText: "text-green-900 dark:text-green-100",
        cardIconBg: "bg-green-500/10 dark:bg-green-500/20",
        cardIcon: "text-green-600 dark:text-green-400",
        countBg: "bg-green-500",
        countText: "text-white",
        headerBg: "bg-white/10 dark:bg-white/5",
        insightBg: "bg-purple-50 dark:bg-purple-900/20",
        insightBorder: "border-purple-200 dark:border-purple-700",
        actionBg: "bg-green-50 dark:bg-green-900/20",
        actionBorder: "border-green-200 dark:border-green-700",
        alertIcon: "text-green-500",
        alertBg: "bg-green-50 dark:bg-green-700/20",
        alertBorder: "border-green-200 dark:border-green-600",
        metricBg: "bg-green-100/80 dark:bg-green-600/50",
        metricText: "text-green-900 dark:text-green-100",
        impactBg: "bg-green-50/50 dark:bg-green-700/10",
        impactText: "text-green-800 dark:text-green-200",
        timeText: "text-gray-500 dark:text-gray-400",
        barBg: "bg-green-500",
      },
    }),
    []
  );

  const getNumberFromSummary = (sum) => {
    if (!sum) return "—";
    const match = sum.toString().match(/(\d+)/);
    return match ? match[1] : "—";
  };

  const normalizeSeverity = (rawSev) => {
    if (!rawSev) return "Low";
    return rawSev.charAt(0).toUpperCase() + rawSev.slice(1).toLowerCase();
  };

  // Aggregate severity counts across all findings
  const severityCounts = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    data1.agent_findings?.forEach((finding) => {
      const sev = normalizeSeverity(finding.structured_summary?.severity);
      if (counts[sev] !== undefined) {
        counts[sev]++;
      }
    });
    return counts;
  }, [data1.agent_findings]);

  const severityOrder = ["Critical", "Medium", "Low"];

  // Filtered findings based on tab, search, severity
  const filteredFindings = useMemo(() => {
    let findings = data1.agent_findings || [];
    if (activeTab !== "all") {
      const config = tabConfigs.find((t) => t.id === activeTab);
      if (config?.tool) {
        findings = findings.filter((f) => f.tool_name === config.tool);
      }
    }
    if (severityFilter !== "all") {
      findings = findings.filter((finding) => {
        const sev = normalizeSeverity(finding.structured_summary?.severity);
        return sev === severityFilter;
      });
    }
    const q = globalSearch.trim().toLowerCase();
    if (!q) return findings;
    return findings.filter((finding) => {
      const content = finding.raw_data || [];
      const structured = finding.structured_summary || {};
      const searchText = [
        structured.alert_title || "",
        ...Object.values(structured).join(" "),
        ...content.flatMap((row) => Object.values(row).join(" ")),
      ].join(" ").toLowerCase();
      return searchText.includes(q);
    });
  }, [data1.agent_findings, activeTab, globalSearch, severityFilter]);

  // Paginated findings
  const paginatedFindings = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredFindings.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredFindings, currentPage]);

  const totalPages = Math.ceil(filteredFindings.length / ITEMS_PER_PAGE);

  const formatCurrency = (n) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(n));

  const downloadCSV = useCallback((content, filename) => {
    const csv = [
      Object.keys(content[0] || {}).join(","),
      ...content.map((row) => Object.values(row).map((v) => `"${v}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast("Data exported successfully", "success");
  }, [showToast]);

  const renderMarkdownSummary = (text) =>
    text
      .replace(/\n/g, "<br>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>");

  const SkeletonCard = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm overflow-hidden animate-pulse"
    >
      <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/30 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg" />
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2" />
              <div className="flex gap-2">
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded-full w-16" />
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded-full w-12" />
              </div>
            </div>
          </div>
          <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>
      </div>
    </motion.div>
  );

  const FindingCard = ({ finding, index }) => {
    const toolName = finding.tool_name;
    const config = tabConfigs.find((t) => t.tool === toolName);
    const Icon = config?.icon || AlertTriangle;
    const rawSev = finding.structured_summary?.severity || "Low";
    const sev = normalizeSeverity(rawSev);
    const style = severityStyles[sev];
    const isExpanded = expandedFindings.has(index);
    const content = finding.raw_data || [];
    const structured = finding.structured_summary || {};

    const keyFindings = Array.isArray(structured.key_Findings)
      ? structured.key_Findings
      : [];
    
    const recActions = Array.isArray(structured.recommended_actions)
      ? structured.recommended_actions
      : typeof structured.recommended_actions === "string"
      ? structured.recommended_actions
          .split(",")
          .map((a) => a.trim())
          .filter((a) => a)
      : [];

    const summaryText = useMemo(() => {
      if (!structured.alert_title) return "";
      let text = `**${structured.alert_title}**`;
      if (structured.severity) {
        text += ` (${structured.severity})`;
      }
      text += "\n\n";
      if (keyFindings.length) {
        text +=
          "**Key Findings:**\n" +
          keyFindings.map((f) => `• ${f}`).join("\n") +
          "\n\n";
      }
      if (recActions.length) {
        text +=
          "**Recommended Actions:**\n" +
          recActions.map((a) => `• ${a}`).join("\n");
      }
      return text;
    }, [structured, keyFindings, recActions]);

    const filteredContent = useMemo(() => {
      if (!content || content.length === 0) return [];
      const q = globalSearch.trim().toLowerCase();
      if (!q) return content;
      return content.filter((row) =>
        Object.values(row).some((cell) =>
          String(cell).toLowerCase().includes(q)
        )
      );
    }, [content, globalSearch]);

    const toggleExpanded = () => {
      setExpandedFindings((prev) => {
        const newSet = new Set(prev);
        if (isExpanded) {
          newSet.delete(index);
        } else {
          newSet.add(index);
        }
        return newSet;
      });
    };

    const handleSort = useCallback((key) => {
      // Implement sorting logic here if needed
      console.log("Sort by", key);
    }, []);

    const severityBadge = (
      <motion.div
        whileHover={{ scale: 1.05 }}
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold ${style.badgeBg} ${style.badgeText} ring-1 ring-inset ring-white/20 dark:ring-white/10 backdrop-blur-sm`}
      >
        {rawSev}
      </motion.div>
    );

    const handleExport = () => {
      downloadCSV(filteredContent, `${toolName.replace(/_/g, "-")}-data.csv`);
    };

    const toggleShowMore = (findingIndex) => {
      setShowMoreRows(prev => ({ ...prev, [findingIndex]: !prev[findingIndex] }));
    };

    const displayRows = showMoreRows[index] ? filteredContent : filteredContent.slice(0, 10);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`rounded-2xl border transition-all duration-300 shadow-lg overflow-hidden ${style.cardBg} ${style.cardBorder}`}
      >
        {/* Header */}
        <motion.div
          initial={false}
          whileHover={{ y: -1 }}
          className={`p-4 ${style.alertBg} ${style.alertBorder} border-b cursor-pointer`}
          onClick={toggleExpanded}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`p-2.5 rounded-lg ${style.cardIconBg} flex-shrink-0 border border-white/20`}
              >
                <Icon className={`w-8 h-8 ${style.alertIcon}`} />
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className={`text-base font-bold ${style.cardText} truncate`}>
                    {config?.label || toolName.replace(/_/g, " ")}
                  </h3>
                  {severityBadge}
                </div>
                <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${style.metricBg} ${style.metricText} mb-2`}>
                  <span className="font-semibold truncate max-w-[200px]">{structured.alert_title || "No summary available"}</span>
                  <span className="ml-2 opacity-80">({filteredContent.length} items)</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {structured.timestamp && (
                    <span className={style.timeText}>
                      {new Date(structured.timestamp).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex-shrink-0 ml-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200 ${style.cardText}`}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </motion.button>
          </div>
        </motion.div>

        {/* Collapsible Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="pt-4 px-4 pb-4">
                {/* Key Insights */}
                {keyFindings.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`mb-3 p-3 rounded-xl border ${style.insightBg} ${style.insightBorder}`}
                  >
                    <div className="flex items-center gap-1.5 mb-3">
                      <div className="p-1 bg-purple-500/20 rounded-md">
                        <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Key Insights</h4>
                    </div>
                    <div className="space-y-2">
                      {keyFindings.map((insight, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-purple-500 flex-shrink-0">●</span>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{insight}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Recommended Actions */}
                {recActions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`mb-4 p-3 rounded-xl border ${style.actionBg} ${style.actionBorder}`}
                  >
                    <div className="flex items-center gap-1.5 mb-3">
                      <div className="p-1 bg-green-500/20 rounded-md">
                        <Calendar className="w-8 h-8 text-green-600 dark:text-green-400" />
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Recommended Actions</h4>
                    </div>
                    <div className="space-y-2">
                      {recActions.map((action, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-green-500 flex-shrink-0">●</span>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{action}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Data Table with Sorting */}
                {displayRows.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="overflow-x-auto rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm mb-3"
                  >
                    <div className="flex justify-between items-center p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-t-xl">
                      <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Data Details</h5>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={handleExport}
                        className="flex items-center gap-1 text-sm px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20 transition-colors"
                      >
                        <DownloadCloud className="w-2.5 h-2.5" />
                        Export
                      </motion.button>
                    </div>
                    <table className="min-w-full text-sm border-collapse">
                      <thead className="bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 border-b border-gray-200/50 dark:border-gray-700/30">
                        <tr>
                          {Object.keys(filteredContent[0]).map((h, i) => (
                            <th
                              key={i}
                              className="px-4 py-2.5 text-left font-bold text-gray-700 dark:text-gray-200 uppercase text-sm tracking-wide cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors"
                              onClick={() => handleSort(h)}
                            >
                              <div className="flex items-center gap-1">
                                {h.replace(/_/g, " ").replace(/Inr/i, "INR")}
                                <ArrowUpDown className="w-2.5 h-2.5 opacity-50" />
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {displayRows.map((row, r) => (
                          <tr
                            key={r}
                            className={`transition-all duration-200 hover:bg-white/70 dark:hover:bg-gray-700/50 border-b border-gray-100/50 dark:border-gray-700/30 last:border-b-0 ${
                              r % 2 === 0
                                ? "bg-white/30 dark:bg-gray-800/20"
                                : "bg-gray-50/20 dark:bg-gray-700/10"
                            }`}
                          >
                            {Object.keys(row).map((h, c) => {
                              const headerLower = h.toLowerCase();
                              const value = row[h];
                              const isCurrency =
                                headerLower.includes("amount") ||
                                headerLower.includes("saving") ||
                                headerLower.includes("balance") ||
                                headerLower.includes("paid");
                              return (
                                <td
                                  key={c}
                                  className="px-4 py-2.5 text-gray-900 dark:text-gray-100 font-small"
                                >
                                  {isCurrency && !isNaN(Number(value))
                                    ? formatCurrency(value)
                                    : String(value)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                        {filteredContent.length > 10 && !showMoreRows[index] && (
                          <tr>
                            <td colSpan={Object.keys(filteredContent[0]).length} className="px-4 py-2.5 text-center text-sm text-gray-500 dark:text-gray-400">
                              Showing first 10 of {filteredContent.length} rows.{" "}
                              <motion.button 
                                whileHover={{ scale: 1.05 }}
                                onClick={() => toggleShowMore(index)}
                                className="underline hover:no-underline text-indigo-600 dark:text-indigo-400"
                              >
                                Load more
                              </motion.button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(summaryText);
                      showToast("Summary copied to clipboard", "success");
                    }}
                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/10 to-indigo-600/10 dark:from-indigo-500/20 dark:to-indigo-600/20 text-indigo-700 dark:text-indigo-200 hover:from-indigo-500/20 hover:to-indigo-600/20 dark:hover:from-indigo-500/30 dark:hover:to-indigo-600/30 transition-all duration-300 font-semibold border border-indigo-200/50 dark:border-indigo-800/30 backdrop-blur-sm"
                  >
                    <Clipboard className="w-3 h-3" />
                    Copy Summary
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const jsonData = JSON.stringify(filteredContent, null, 2);
                      navigator.clipboard.writeText(jsonData);
                      showToast("Data copied to clipboard", "success");
                    }}
                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl bg-white/50 dark:bg-gray-700/50 hover:bg-white/70 dark:hover:bg-gray-600/50 transition-all duration-300 border border-white/30 dark:border-gray-600/30 backdrop-blur-sm"
                  >
                    <FileText className="w-3 h-3" />
                    Copy Data
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const renderPagination = () => (
    <div className="flex items-center justify-between mt-6 px-4">
      <div className="text-sm text-gray-700 dark:text-gray-300">
        Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredFindings.length)} of {filteredFindings.length} results
      </div>
      <div className="flex items-center gap-1">
        <motion.button
          whileHover={{ scale: 1.05 }}
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
          className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
        >
          Previous
        </motion.button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const page = currentPage > 3 ? totalPages - 4 + i : i + 1;
          if (totalPages > 5 && page < currentPage - 1 && page > 2) return null;
          return (
            <motion.button
              key={page}
              whileHover={{ scale: 1.05 }}
              onClick={() => handlePageChange(page)}
              className={`px-2 py-1.5 rounded-md font-semibold text-sm transition-colors ${
                currentPage === page
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {page}
            </motion.button>
          );
        }).filter(Boolean)}
        {totalPages > 5 && currentPage < totalPages - 2 && <span className="px-2 text-sm text-gray-500">...</span>}
        <motion.button
          whileHover={{ scale: 1.05 }}
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
          className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
        >
          Next
        </motion.button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-gray-900 via-gray-800 to-gray-700 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader className="w-12 h-12 text-indigo-500 dark:text-indigo-400 mx-auto mb-4" />
            </motion.div>
            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-400 animate-pulse" />
          </div>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
            Loading dashboard insights...
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">AI agents are analyzing your data</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={handleRefresh}
            className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${
        darkMode
          ? "dark bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-gray-100"
          : "bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 text-gray-800"
      }`}
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-xl shadow-2xl text-sm ${
              toast.type === "error"
                ? "bg-red-500 text-white"
                : "bg-green-500 text-white"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streamlined Header */}
      <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 dark:from-indigo-800 dark:via-purple-800 dark:to-blue-800 text-white shadow-xl sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-2.5 bg-white/20 dark:bg-white/10 rounded-xl shadow-lg backdrop-blur-md border border-white/20"
            >
              <Briefcase className="w-5 h-5 text-white drop-shadow-md" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Proactive Insights Dashboard
              </h1>
              <p className="text-sm text-indigo-100 opacity-90">
                AI-powered Accounts Payable • Last updated: {new Date().toLocaleString()}
              </p>
            </div>
          </div>

          {/* Right Side - Compact */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 w-4 h-4" />
              <input
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search findings..."
                className="w-full pl-9 pr-3 py-2 bg-white/10 dark:bg-white/5 border border-white/20 rounded-lg text-sm placeholder-white/50 text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all duration-300 shadow-sm backdrop-blur-md"
              />
              {globalSearch && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setGlobalSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors duration-200"
                >
                  <XCircle className="w-4 h-4" />
                </motion.button>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300 shadow-md hover:shadow-lg backdrop-blur-md relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300 shadow-md hover:shadow-lg backdrop-blur-md"
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300 shadow-md hover:shadow-lg backdrop-blur-md flex items-center gap-1 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300 shadow-md hover:shadow-lg backdrop-blur-md"
            >
              <Settings className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Settings Modal - Simplified */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-5 w-full max-w-sm"
            >
              <h3 className="text-lg font-bold mb-3">Settings</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Items per page</span>
                  <select
                    value={ITEMS_PER_PAGE}
                    onChange={(e) => console.log("Change items per page", e.target.value)}
                    className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm"
                  >
                    <option>5</option>
                    <option>10</option>
                    <option>20</option>
                  </select>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Auto-refresh</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => setShowSettings(false)}
                className="mt-5 w-full bg-indigo-500 text-white py-1.5 rounded-lg text-sm"
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Tab Navigation */}
      <nav className="max-w-7xl mx-auto px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm">
        <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1.5 -mx-1.5">
          {tabConfigs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-300 border mx-1.5 ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
                    : "bg-white/20 dark:bg-gray-700/20 text-gray-700 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-gray-600/30 border-gray-200/50 dark:border-gray-600/30"
                }`}
              >
                <Icon className={`w-3 h-3 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
                {tab.label}
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* Severity Count Cards */}
      <section className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {severityOrder.map((sev, i) => {
          const count = severityCounts[sev];
          const style = severityStyles[sev];
          return (
            <motion.div
              key={sev}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -2, scale: 1.02 }}
              className={`group relative overflow-hidden p-4 rounded-xl border transition-all duration-300 shadow-md hover:shadow-lg backdrop-blur-md text-left cursor-pointer ${style.bg} ${style.border}`}
              onClick={() => setSeverityFilter(sev)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0 dark:from-black/10 dark:to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex justify-between items-start">
                <div>
                  <p className={`text-sm font-semibold ${style.text} mb-1 leading-tight`}>
                    {sev} Findings
                  </p>
                  <h3 className={`text-2xl font-bold ${style.text} mb-1 flex items-center gap-2`}>
                    <motion.span
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${style.countBg} ${style.countText} text-sm font-bold`}
                    >
                      {count}
                    </motion.span>
                  </h3>
                </div>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`${style.cardIconBg} p-2 rounded-xl group-hover:scale-110 transition-transform duration-300`}
                >
                  <AlertTriangle className={`w-4 h-4 ${style.cardIcon}`} />
                </motion.div>
              </div>
              <p className={`mt-3 text-sm ${style.text} leading-relaxed`}>
                {sev === "Critical"
                  ? "Immediate action required"
                  : sev === "Medium"
                  ? "Monitor closely"
                  : "Routine check"}
              </p>
              {severityFilter === sev && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
              )}
            </motion.div>
          );
        })}
      </section>

      {/* Error State - Compact */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto px-4 mb-4"
        >
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-800 dark:text-red-200 flex-1">{error}</span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={handleRefresh}
              className="px-2.5 py-1 text-sm bg-red-500 text-white rounded-md"
            >
              Retry
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Focused Findings Section */}
      <main className="max-w-7xl mx-auto px-4 pb-16 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {activeTab === "all" ? "All Insights" : tabConfigs.find(t => t.id === activeTab)?.label || activeTab} ({filteredFindings.length})
          </h2>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              onClick={() => setSeverityFilter(severityFilter === "all" ? "Critical" : "all")}
            >
              <Filter className="w-3 h-3" />
              {severityFilter === "all" ? "All" : severityFilter}
            </motion.button>
            <button
              onClick={() => {
                if (expandedFindings.size === filteredFindings.length) {
                  setExpandedFindings(new Set());
                } else {
                  setExpandedFindings(new Set(filteredFindings.map((_, i) => i)));
                }
              }}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/10 to-indigo-600/10 dark:from-indigo-500/20 dark:to-indigo-600/20 text-indigo-700 dark:text-indigo-200 hover:from-indigo-500/20 hover:to-indigo-600/20 dark:hover:from-indigo-500/30 dark:hover:to-indigo-600/30 transition-all duration-300 font-semibold border border-indigo-200/50 dark:border-indigo-800/30 backdrop-blur-sm"
            >
              {expandedFindings.size === filteredFindings.length ? (
                <>
                  <ChevronDownIcon className="w-3 h-3" /> Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" /> Expand
                </>
              )}
            </button>
          </div>
        </div>

        {filteredFindings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 text-gray-500 dark:text-gray-400"
          >
            <XCircle className="mx-auto w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-base font-medium">No findings available.</p>
            <p className="text-sm mt-1 opacity-75">
              {activeTab !== "all" ? "Try switching tabs or adjusting your search." : "AI agents will populate insights soon."}
            </p>
          </motion.div>
        ) : (
          <>
            <div className="space-y-4">
              <AnimatePresence>
                {paginatedFindings.map((finding, index) => (
                  <FindingCard key={`${finding.tool_name}-${index}`} finding={finding} index={index} />
                ))}
              </AnimatePresence>
            </div>
            {totalPages > 1 && renderPagination()}
          </>
        )}
      </main>
    </div>
  );
};

export default AccountsPayableDashboard;