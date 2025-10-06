import React from "react";
import { ResponsiveHeatMap } from "@nivo/heatmap";

const dummyHeatMapData = [
  { id: "Product A", data: { Jan: 30, Feb: 50, Mar: 20, Apr: 40 } },
  { id: "Product B", data: { Jan: 40, Feb: 35, Mar: 25, Apr: 50 } },
  { id: "Product C", data: { Jan: 20, Feb: 45, Mar: 30, Apr: 35 } },
  { id: "Product D", data: { Jan: 25, Feb: 30, Mar: 40, Apr: 45 } },
];

export default function DummyHeatMap() {
  return (
    <div style={{ height: "300px", width: "100%" }}>
      <ResponsiveHeatMap
        data={dummyHeatMapData}
        keys={["Jan", "Feb", "Mar", "Apr"]}
        indexBy="id"
        margin={{ top: 40, right: 40, bottom: 40, left: 60 }}
        colors={{ scheme: "blues" }}
        axisTop={{ orient: "top" }}
        axisLeft={{ orient: "left" }}
        cellOpacity={1}
        cellBorderColor={{ from: "color", modifiers: [["darker", 0.4]] }}
        enableLabels={true}
        labelTextColor={{ from: "color", modifiers: [["darker", 1.8]] }}
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
}
