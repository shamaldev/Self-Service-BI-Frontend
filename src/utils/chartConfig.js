export const getChartConfig = (type, config, data) => {
  const defaultConfig = {
    pie: {
      categoryKey:
        config?.category_col_name ||
        Object.keys(data[0] || {})[0] ||
        "category",
      valueKey:
        config?.value_col_name || Object.keys(data[0] || {})[1] || "value",
      innerRadius: "0%",
      outerRadius: "80%",
    },
    gauge: {
      valueKey:
        config?.value_col_name || Object.keys(data[0] || {})[0] || "value",
      minValue: config?.min_value || 0,
      maxValue: config?.max_value || 100,
      thresholds: { low: 30, medium: 70 },
      innerRadius: 60,
      outerRadius: 80,
    },
    vertical_bar: {
      categoryKey:
        config?.x_axis_col_name || Object.keys(data[0] || {})[0] || "category",
      valueKey:
        config?.y_axis_col_name || Object.keys(data[0] || {})[1] || "value",
    },
    horizontal_bar: {
      valueKey:
        config?.x_axis_col_name || Object.keys(data[0] || {})[0] || "value",
      categoryKey:
        config?.y_axis_col_name || Object.keys(data[0] || {})[1] || "category",
    },
    stacked_bar: {
      categoryKey:
        config?.x_axis_col_name || Object.keys(data[0] || {})[0] || "category",
      valueKey:
        config?.y_axis_col_name || Object.keys(data[0] || {})[1] || "value",
      stackBy: config?.stack_by,
    },
    clustered_bar: {
      categoryKey:
        config?.x_axis_col_name || Object.keys(data[0] || {})[0] || "category",
      valueKey:
        config?.y_axis_col_name || Object.keys(data[0] || {})[1] || "value",
      clusterBy: config?.cluster_by,
    },
    funnel: {
      stagesKey:
        config?.stages_col_name || Object.keys(data[0] || {})[0] || "stage",
      valueKey:
        config?.value_col_name || Object.keys(data[0] || {})[1] || "value",
    },
    pareto: {
      categoryKey:
        config?.x_axis_col_name || Object.keys(data[0] || {})[0] || "category",
      valueKey:
        config?.y_axis_col_name || Object.keys(data[0] || {})[1] || "value",
    },
    bubble_map: {
      latKey:
        config?.lat_col_name ||
        Object.keys(data[0] || {}).find((k) =>
          k.toLowerCase().includes("lat")
        ) ||
        "lat",
      lonKey:
        config?.lon_col_name ||
        Object.keys(data[0] || {}).find((k) =>
          k.toLowerCase().includes("lon")
        ) ||
        "lon",
      sizeKey:
        config?.size_col_name ||
        Object.keys(data[0] || {}).find(
          (k) =>
            k.toLowerCase().includes("spend") ||
            k.toLowerCase().includes("amount") ||
            k.toLowerCase().includes("total") ||
            k.toLowerCase().includes("value") ||
            k.toLowerCase().includes("size")
        ) ||
        null,
    },
  };

  return { ...defaultConfig[type], ...config };
};


export const getResponsiveMargin = (type, containerWidth) => {
  const baseMargin = { top: 20, right: 20, left: 60, bottom: 20 };
  if (containerWidth < 400) {
    return {
      top: 10,
      right: 10,
      left: 30,
      bottom: 10,
    };
  }
  if (containerWidth < 600) {
    return {
      top: 15,
      right: 15,
      left: 40,
      bottom: 15,
    };
  }
  // For larger, keep base
  if (type.includes('bar') || type.includes('line') || type.includes('area')) {
    return { ...baseMargin, left: 50, bottom: 30 };
  }
  return baseMargin;
};


export const getParetoData = (data, valueKey = "value", categoryKey = "category") => {
  const sorted = [...data].sort(
    (a, b) => (b[valueKey] || 0) - (a[valueKey] || 0)
  );
  let cumulative = 0;
  const total = sorted.reduce((sum, item) => sum + (item[valueKey] || 0), 0);
  return sorted.map((item) => {
    cumulative += item[valueKey] || 0;
    return { ...item, cumulative: total > 0 ? (cumulative / total) * 100 : 0 };
  });
};

export const chartColors = {
  line: ["#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#3b82f6", "#06b6d4"],
  bar: ["#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#3b82f6", "#06b6d4"],
  pie: ["#ec4899", "#8b5cf6", "#10b981", "#f59e0b", "#3b82f6", "#06b6d4"],
  area: ["#f3e8ff", "#fce7f3", "#f0fdf4", "#fef3c7", "#dbeafe", "#cffafe"],
  heatmap: {
    cold: "#f3e8ff",
    mild: "#8b5cf6",
    hot: "#7c3aed",
  },
  funnel: ["#8b5cf6", "#10b981", "#ec4899", "#3b82f6", "#f59e0b"],
  pareto: {
    bars: "#6366f1",
    line: "#ec4899",
  },
  gauge: {
    danger: "#ec4899",
    warning: "#f59e0b",
    success: "#10b981",
    track: "#f8fafc",
  },
  ratios: ["#10b981", "#8b5cf6", "#ec4899", "#f59e0b"],
  budget: {
    Budget: "#6b7280",
    Actual: "#8b5cf6",
  },
  cashflow: {
    Operating: "#10b981",
    Investing: "#ec4899",
    Financing: "#8b5cf6",
  },
};
