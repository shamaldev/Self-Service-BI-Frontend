import { ResponsiveFunnel } from "@nivo/funnel";
import { chartColors } from "../../utils/chartConfig";
import { formatNumber } from "../../utils/utils";


 const FunnelChart = ({ data, chartConfig, containerSize = { width: 400, height: 300 }, fontSize = 12 }) => {
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
      label: chartConfig?.stage_label
        ? String(item[chartConfig.stage_label] || "")
        : String(item[stagesKey] || "Unknown"),
    }))
    .filter((item) => item.value > 0);

  if (funnelData.length === 0)
    return (
      <div className="text-gray-400 text-sm">No valid funnel data</div>
    );

  return (
    <div
      style={{ height: "100%", width: "100%" }}
      className="w-full h-full"
    >
      <ResponsiveFunnel
        data={funnelData}
        margin={{
          top: containerWidth < 400 ? 20 : 40,
          right: containerWidth < 400 ? 20 : 40,
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
            ["opacity", 0.8],
          ],
        }}
        beforeSeparatorLength={Math.max(80, containerWidth / 10)}
        beforeSeparatorOffset={Math.max(10, containerWidth / 60)}
        afterSeparatorLength={Math.max(80, containerWidth / 10)}
        afterSeparatorOffset={Math.max(10, containerWidth / 60)}
        currentPartSizeExtension={Math.max(10, containerWidth / 80)}
        currentBorderWidth={Math.max(20, containerWidth / 40)}
        motionConfig="default"
        enableLabel={containerWidth > 400}
        label={(part) =>
          `${part.data.label}: ${formatNumber(part.data.value)}`
        }
        labelPosition="inside"
        interpolation="smooth"
        theme={{
          labels: {
            text: {
              fontSize: `${Math.max(10, fontSize - 1)}px`,
              fontWeight: 600,
            },
          },
        }}
      />
    </div>
  );
};

export default FunnelChart;