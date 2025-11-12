import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { SparklesIcon } from "lucide-react";
import { getChartConfig } from "../../utils/chartConfig";

const BubbleMapChartLocal = ({ mapData, mapConfig, fontSize, containerSize }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const tooltipRef = useRef(null);
  const [internalSize, setInternalSize] = useState({ width: 0, height: 0 });
  const [geoData, setGeoData] = useState(null);
  
  // Always measure internal size for accurate initial render
  const effectiveSize = internalSize;
  const {
    latKey,
    lonKey,
    sizeKey,
    cityKey = "CITY",
    bubbleColor = "orange",
  } = mapConfig || {};

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let resizeTimeout;
    const updateSize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        setInternalSize((prev) =>
          Math.abs(prev.width - width) > 2 || Math.abs(prev.height - height) > 2
            ? { width, height }
            : prev
        );
      }, 150);
    };
    updateSize(); // initial measure
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);
    window.addEventListener("resize", updateSize);
    return () => {
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  const { width: containerWidth, height: containerHeight } = effectiveSize;

  // Load world map JSON once
  useEffect(() => {
    d3.json("https://unpkg.com/world-atlas@2/countries-110m.json")
      .then(setGeoData)
      .catch(console.error);
  }, []);

  // Cleanup tooltip on unmount
  useEffect(() => {
    return () => {
      if (tooltipRef.current) {
        tooltipRef.current.remove();
        tooltipRef.current = null;
      }
    };
  }, []);

  // Draw map
  useEffect(() => {
    if (
      !geoData ||
      !svgRef.current ||
      !mapData?.length ||
      containerWidth <= 0 ||
      containerHeight <= 0
    ) {
      return;
    }
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const width = containerWidth;
    const height = containerHeight;
    // Convert TopoJSON → GeoJSON
    const countries = topojson.feature(geoData, geoData.objects.countries);
    // Projection
    const projection = d3.geoMercator().fitSize([width, height], countries);
    const path = d3.geoPath().projection(projection);
    // Zoom behavior
    const g = svg.append("g");
    const zoom = d3
      .zoom()
      .scaleExtent([1, 8])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);
    // Draw map background
    g.append("g")
      .selectAll("path")
      .data(countries.features)
      .join("path")
      .attr("fill", "#e1f5fe")
      .attr("stroke", "#b0bec5")
      .attr("stroke-width", 0.5)
      .attr("d", path);
    // Bubble size scale
    const maxVal = d3.max(mapData, (d) => parseFloat(d[sizeKey]) || 0) || 1;
    const sizeScale = d3
      .scaleSqrt()
      .domain([0, maxVal])
      .range([Math.max(2, width / 600), Math.max(6, width / 250)]);
    // Prepare data
    const bubbleData = mapData
      .map((d) => {
        const lat = parseFloat(d[latKey]);
        const lon = parseFloat(d[lonKey]);
        if (isNaN(lat) || isNaN(lon)) return null;
        const [x, y] = projection([lon, lat]) || [];
        return {
          x,
          y,
          r: sizeScale(parseFloat(d[sizeKey]) || 0),
          city: d[cityKey] || "Unknown",
          val: parseFloat(d[sizeKey]) || 0,
        };
      })
      .filter((d) => d && isFinite(d.x) && isFinite(d.y));
    // Tooltip setup
    if (!tooltipRef.current) {
      tooltipRef.current = d3
        .select("body")
        .append("div")
        .style("position", "absolute")
        .style("z-index", "9999")
        .style("padding", "6px 10px")
        .style("background", "rgba(0,0,0,0.75)")
        .style("color", "#fff")
        .style("border-radius", "4px")
        .style("font-size", `${Math.max(11, fontSize - 2)}px`)
        .style("pointer-events", "none")
        .style("opacity", 0);
    }
    const tooltip = tooltipRef.current;
    // Draw bubbles
    g.append("g")
      .selectAll("circle")
      .data(bubbleData)
      .join("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", (d) => d.r)
      .attr("fill", bubbleColor)
      .attr("fill-opacity", 0.7)
      .attr("stroke", d3.color(bubbleColor).darker(0.5))
      .attr("stroke-width", 1.2)
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>${sizeKey}:</strong> ${d.val}<br/><strong>City:</strong> ${d.city}`
          );
        d3.select(event.currentTarget)
          .attr("stroke", "#000")
          .attr("stroke-width", 2);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", (event) => {
        tooltip.style("opacity", 0);
        d3.select(event.currentTarget)
          .attr("stroke", d3.color(bubbleColor).darker(0.5))
          .attr("stroke-width", 1.2);
      });
    // Cleanup
    return () => {
      svg.selectAll("*").remove();
      if (tooltipRef.current) tooltipRef.current.style("opacity", 0);
    };
  }, [
    geoData,
    mapData,
    latKey,
    lonKey,
    sizeKey,
    cityKey,
    bubbleColor,
    containerWidth,
    containerHeight,
    fontSize,
  ]);

  // Improved loading condition
  const isLoading =
    !geoData ||
    !Array.isArray(mapData) ||
    mapData.length === 0 ||
    containerWidth < 50 ||
    containerHeight < 50;

  return (
    <div
      ref={containerRef}
      className="h-full w-full relative bg-gradient-to-br from-gray-50/80 to-gray-100/80 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm overflow-hidden"
    >
      {isLoading ? (
        <div className="h-full flex items-center justify-center text-gray-400 text-sm">
          <div className="text-center animate-pulse">
            <SparklesIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            Loading map...
          </div>
        </div>
      ) : (
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${containerWidth} ${containerHeight}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ cursor: "grab", background: "#f8fafc" }}
        />
      )}
    </div>
  );
};

const BubbleMapChart = ({ data, chartConfig, fontSize = 12, containerSize }) => {
  const config = getChartConfig("bubblemapchart", chartConfig, data);
  const latKey = config.lat_col_name || "lat";
  const lonKey = config.lon_col_name || "lon";
  const sizeKey = config.size_col_name || "size";
  const cityKey = config.city_col_name || "city";

  if (!latKey || !lonKey || !sizeKey) {
    return (
      <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm bg-gradient-to-br from-gray-50/80 to-gray-100/80 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm">
        Missing lat, lon, or size column for bubble map
      </div>
    );
  }

  const filteredData = data
    .filter((item) => {
      const lat = parseFloat(item[latKey]);
      const lon = parseFloat(item[lonKey]);
      const size = parseFloat(item[sizeKey]);
      return !isNaN(lat) && !isNaN(lon) && !isNaN(size) && size > 0;
    })
    .map((item) => ({
      ...item,
      [latKey]: parseFloat(item[latKey]),
      [lonKey]: parseFloat(item[lonKey]),
      [sizeKey]: parseFloat(item[sizeKey]),
    }));

  if (filteredData.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm bg-gradient-to-br from-gray-50/80 to-gray-100/80 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm">
        No valid geographic data available
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <BubbleMapChartLocal
        mapData={filteredData}
        mapConfig={{
          latKey,
          lonKey,
          sizeKey,
          cityKey,
          bubbleColor: "orange",
        }}
        fontSize={fontSize}
        containerSize={containerSize} // Passed but not used for sizing
      />
    </div>
  );
};

export default BubbleMapChart;