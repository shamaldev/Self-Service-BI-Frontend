
import {  formatNumber } from "../../utils/utils";
import { chartColors } from "../../utils/chartConfig";

const HorizontalBarChart = ({ data, chartConfig, containerSize = { width: 400, height: 300 }, fontSize = 12 }) => {
  let categoryKey = chartConfig?.y_axis_col_name || "category";
  let valueKey = chartConfig?.x_axis_col_name || "value";
  if (Array.isArray(categoryKey)) categoryKey = categoryKey[0];
  if (Array.isArray(valueKey)) valueKey = valueKey[0];
  const categoryLabel = chartConfig?.y_axis_label || categoryKey;
  const valueLabel = chartConfig?.x_axis_label || valueKey;

  if (
    data.some(
      (item) =>
        !item.hasOwnProperty(categoryKey) ||
        !item.hasOwnProperty(valueKey)
    )
  ) {
    return (
      <div className="text-gray-400 text-sm">
        Data missing required keys
      </div>
    );
  }

  const maxValue = Math.max(
    ...data.map((d) => d[valueKey] || 0)
  );
  return (
    <div
      className="space-y-4 overflow-auto h-full pr-4 w-full"
    >
      {data.map((item, index) => (
        <div key={index} className="group">
          <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
            <span className="truncate max-w-[60%]">
              {item[categoryKey]}
            </span>
            <span>{formatNumber(item[valueKey], false)}</span>
          </div>
          <div className="w-full bg-gray-200/50 backdrop-blur-sm rounded-full h-3 overflow-hidden relative">
            <div
              className="h-3 rounded-full transition-all duration-300 ease-out group-hover:brightness-105 shadow-md"
              style={{
                width:
                  maxValue > 0
                    ? `${(item[valueKey] / maxValue) * 100}%`
                    : 0,
                background: `linear-gradient(to right, ${
                  chartColors.ratios[index % chartColors.ratios.length]
                }, ${
                  chartColors.ratios[
                    (index + 1) % chartColors.ratios.length
                  ]
                })`,
              }}
            />
          </div>
          {item.description && (
            <p className="text-xs text-gray-500 mt-1 truncate">
              {item.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default HorizontalBarChart;