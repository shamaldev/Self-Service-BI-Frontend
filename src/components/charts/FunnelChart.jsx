import { ResponsiveFunnel } from "@nivo/funnel";
import { chartColors } from "../../utils/chartConfig";
import { formatNumber } from "../../utils/utils";

const FunnelChart = ({
  data,
  chartConfig,
  containerSize = { width: 400, height: 300 },
  fontSize = 12,
}) => {
  const { width: containerWidth } = containerSize;
  const stagesKey = chartConfig?.stages_col_name || "stage";
  const valueKey = chartConfig?.value_col_name || "value";

  if (!stagesKey || !valueKey)
    return (
      <div className="text-gray-400 text-sm">
        Invalid funnel configuration
      </div>
    );

  const funnelData = data
    .filter(
      (item) =>
        item.hasOwnProperty(stagesKey) && item.hasOwnProperty(valueKey)
    )
    .map((item) => ({
      id: String(item[stagesKey] || "Unknown"),
      value: parseFloat(item[valueKey]) || 0,
      label: `${String(item[stagesKey])}: ${formatNumber(item[valueKey])}`,
    }))
    .filter((item) => item.value > 0);

  if (funnelData.length === 0)
    return (
      <div className="text-gray-400 text-sm">No valid funnel data</div>
    );

  return (
    <div style={{ height: "100%", width: "100%" }} className="w-full h-full">
      <ResponsiveFunnel
        data={funnelData}
        margin={{
          top: containerWidth < 400 ? 20 : 40,
          right: containerWidth < 400 ? 100 : 120, // extra space for legend
          bottom: containerWidth < 400 ? 20 : 40,
          left: containerWidth < 400 ? 20 : 40,
        }}
        valueFormat={(value) => formatNumber(value)}
        colors={chartColors.funnel}
        borderWidth={Math.max(10, containerWidth / 40)}
        borderColor={{ from: "color", modifiers: [["darker", 2]] }}
        labelColor={{
          from: "color",
          modifiers: [
            ["brighter", 1.4],
            ["opacity", 0.9],
          ],
        }}
        beforeSeparatorLength={Math.max(80, containerWidth / 10)}
        beforeSeparatorOffset={Math.max(10, containerWidth / 60)}
        afterSeparatorLength={Math.max(80, containerWidth / 10)}
        afterSeparatorOffset={Math.max(10, containerWidth / 60)}
        currentPartSizeExtension={Math.max(10, containerWidth / 80)}
        currentBorderWidth={Math.max(20, containerWidth / 40)}
        motionConfig="gentle"
        enableLabel={true}
        label={(part) => part.data.label}
        labelPosition="inside"
        labelOrientation="horizontal"
        labelPadding={8}
        theme={{
          labels: {
            text: {
              fontSize: `${Math.max(10, fontSize)}px`,
              fontWeight: 600,
              fill: "#fff",
              textShadow: "0 1px 3px rgba(0,0,0,0.6)",
            },
          },
          legends: {
            text: {
              fontSize: 12,
              fill: "#555",
            },
          },
        }}
        legends={[
          {
            anchor: "right", // position of legend
            direction: "column",
            translateX: 80, // move away from chart
            itemWidth: 100,
            itemHeight: 20,
            itemDirection: "left-to-right",
            itemsSpacing: 6,
            symbolSize: 14,
            symbolShape: "circle",
            effects: [
              {
                on: "hover",
                style: {
                  itemTextColor: "#000",
                  symbolSize: 16,
                },
              },
            ],
          },
        ]}
      />
    </div>
  );
};

export default FunnelChart;
