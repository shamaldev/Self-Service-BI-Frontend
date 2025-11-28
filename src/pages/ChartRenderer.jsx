import { useRef, useState, useCallback, useEffect } from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { getChartConfig } from "../utils/chartConfig";
import BubbleMapChart from "../components/charts/BubbleMapChart";
import LineAreaChart from "../components/charts/LineAreaChart";
import VerticalBarChart from "../components/charts/VerticalBarChart";
import HorizontalBarChart from "../components/charts/HorizontalBarChart";
import StackedBarChart from "../components/charts/StackedBarChart";
import ClusteredBarChart from "../components/charts/ClusteredBarChart";
import FunnelChart from "../components/charts/FunnelChart";
import PieChartComponent from "../components/charts/PieChartComponent";
import ParetoChart from "../components/charts/ParetoChart";
import LineChartComponent from "../components/charts/LineChartComponent";
import AreaChartComponent from "../components/charts/AreaChartComponent";
// ChartRenderer dynamically renders the appropriate chart component based on KPI type and data
function ChartRenderer({ kpi, data, chartConfig }) {
  // Ref for chart container DOM node
  const containerRef = useRef(null);
  // Ref for debouncing resize events
  const resizeTimeoutRef = useRef(null);
  // Ref to store previous container size
  const prevSizeRef = useRef({ width: 0, height: 0 });
  // State for current container size
  const [containerSize, setContainerSize] = useState({
    width: 800,
    height: 400,
  });
  // Update container size state when the container is resized
  const updateContainerSize = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newSize = {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    };
    if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
    resizeTimeoutRef.current = setTimeout(() => {
      const prev = prevSizeRef.current;
      const deltaWidth = Math.abs(newSize.width - prev.width);
      const deltaHeight = Math.abs(newSize.height - prev.height);
      const TOLERANCE = 4;
      if (deltaWidth >= TOLERANCE || deltaHeight >= TOLERANCE) {
        setContainerSize(newSize);
        prevSizeRef.current = newSize;
      }
    }, 300);
  }, []);
  // Observe container and window resize to update chart size responsively
  useEffect(() => {
    if (!containerRef.current) return;
    updateContainerSize();
    const resizeObserver = new ResizeObserver(() => updateContainerSize());
    resizeObserver.observe(containerRef.current);
    window.addEventListener("resize", updateContainerSize);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateContainerSize);
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
    };
  }, [updateContainerSize]);
  // Show placeholder if no data is available
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm bg-gradient-to-br from-gray-50/80 to-gray-100/80 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm">
        <div className="text-center animate-pulse">
          <SparklesIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          No data available
        </div>
      </div>
    );
  }
  // Show error if KPI or chart type is missing
  if (!kpi || !kpi.chart_type) {
    return (
      <div className="text-gray-400 text-sm bg-gradient-to-br from-gray-50/80 to-gray-100/80 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm p-4">
        Invalid chart configuration
      </div>
    );
  }
  // Normalize chart type and get chart config
  const type = kpi.chart_type.replace(/_/g, "");
  const config = getChartConfig(type.replace(/chart$/, ""), chartConfig, data);
  // Responsive font and label sizes
  const { width: containerWidth, height: containerHeight } = containerSize;
  const fontSize = containerWidth < 400 ? 9 : containerWidth < 600 ? 10 : 11;
  const labelFontSize =
    containerWidth < 400 ? 10 : containerWidth < 600 ? 11 : 12;
  const showLabels = containerWidth > 400;
  const showLegend = false;
  // Render the appropriate chart component based on type
  try {
    switch (type) {
      case "linechart":
        return (
          <div
            ref={containerRef}
            className="flex-1 w-full h-full min-h-0 min-w-0"
          >
            <LineChartComponent
              data={data}
              chartConfig={chartConfig}
              containerSize={containerSize}
              fontSize={fontSize}
              labelFontSize={labelFontSize}
              showLabels={showLabels}
            />
          </div>
        );
      case "areachart":
        return (
          <div
            ref={containerRef}
            className="flex-1 w-full h-full min-h-0 min-w-0"
          >
            <AreaChartComponent
              data={data}
              chartConfig={chartConfig}
              containerSize={containerSize}
              fontSize={fontSize}
              labelFontSize={labelFontSize}
              showLabels={showLabels}
            />
          </div>
        );
      case "barchart":
      case "verticalbarchart":
        return (
          <div
            ref={containerRef}
            className="flex-1 w-full h-full min-h-0 min-w-0"
          >
            <VerticalBarChart
              data={data}
              chartConfig={chartConfig}
              containerSize={containerSize}
              fontSize={fontSize}
              labelFontSize={labelFontSize}
              showLabels={showLabels}
            />
          </div>
        );
      case "horizontalbarchart":
        return (
          <div
            ref={containerRef}
            className="flex-1 w-full h-full min-h-0 min-w-0"
          >
            <HorizontalBarChart
              data={data}
              chartConfig={chartConfig}
              containerSize={containerSize}
              fontSize={fontSize}
            />
          </div>
        );
      case "stackedbarchart":
        return (
          <div
            ref={containerRef}
            className="flex-1 w-full h-full min-h-0 min-w-0"
          >
            <StackedBarChart
              data={data}
              chartConfig={chartConfig}
              containerSize={containerSize}
              fontSize={fontSize}
              labelFontSize={labelFontSize}
              showLabels={showLabels}
            />
          </div>
        );
      case "clusteredbarchart":
        return (
          <div
            ref={containerRef}
            className="flex-1 w-full h-full min-h-0 min-w-0"
          >
            <ClusteredBarChart
              data={data}
              chartConfig={chartConfig}
              containerSize={containerSize}
              fontSize={fontSize}
              labelFontSize={labelFontSize}
              showLabels={showLabels}
            />
          </div>
        );
      case "piechart":
        return (
          <div
            ref={containerRef}
            className="flex-1 w-full h-full min-h-0 min-w-0"
          >
            <PieChartComponent
              data={data}
              chartConfig={chartConfig}
              containerSize={containerSize}
              fontSize={fontSize}
              labelFontSize={labelFontSize}
              showLabels={showLabels}
            />
          </div>
        );
      case "funnelchart":
        return (
          <div
            ref={containerRef}
            className="flex-1 w-full h-full min-h-0 min-w-0"
          >
            <FunnelChart
              data={data}
              chartConfig={chartConfig}
              containerSize={containerSize}
              fontSize={fontSize}
            />
          </div>
        );
      case "paretochart":
        return (
          <div
            ref={containerRef}
            className="flex-1 w-full h-full min-h-0 min-w-0"
          >
            <ParetoChart
              data={data}
              chartConfig={chartConfig}
              containerSize={containerSize}
              fontSize={fontSize}
              labelFontSize={labelFontSize}
              showLabels={showLabels}
            />
          </div>
        );
      case "bubblemapchart":
        return (
          <div
            ref={containerRef}
            className="flex-1 w-full h-full min-h-0 min-w-0"
          >
            <BubbleMapChart
              data={data}
              chartConfig={chartConfig}
              containerSize={containerSize}
              fontSize={fontSize}
            />
          </div>
        );
  // Fallback for unsupported chart types
  default:
        return (
          <div className="text-gray-500 text-sm p-6 bg-gradient-to-br from-gray-50/80 to-gray-100/80 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm">
            <p className="font-medium mb-2 text-gray-700">
              Unsupported Chart Type
            </p>
            <p className="text-gray-600">
              "{kpi.chart_type}" not supported yet.
            </p>
          </div>
        );
    }
  // Catch and display chart rendering errors
  } catch (error) {
    console.error("Chart rendering error:", error);
    return (
      <div className="text-red-500 text-sm p-6 bg-gradient-to-br from-red-50/80 to-red-100/80 backdrop-blur-sm rounded-xl border border-red-200/50 shadow-sm">
        Error rendering chart: {error.message}
      </div>
    );
  }
}
export default ChartRenderer;