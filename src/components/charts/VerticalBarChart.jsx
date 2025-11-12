
import {
 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
 
  CartesianGrid,
  ResponsiveContainer,
  
} from "recharts";
import { formatDate, formatNumber } from "../../utils/utils";
import {  getResponsiveMargin} from "../../utils/chartConfig";

const VerticalBarChart = ({ data, chartConfig, containerSize = { width: 400, height: 300 }, fontSize = 12, labelFontSize = 14, showLabels = true }) => {
  const { width: containerWidth } = containerSize;
  let categoryKey = chartConfig?.x_axis_col_name || "category"; // Assuming default from config
  let valueKey = chartConfig?.y_axis_col_name || "value";
  if (Array.isArray(categoryKey)) categoryKey = categoryKey[0];
  if (Array.isArray(valueKey)) valueKey = valueKey[0];
  const categoryLabel = chartConfig?.x_axis_label || categoryKey;
  const valueLabel = chartConfig?.y_axis_label || valueKey;
  const margin = getResponsiveMargin("barchart", containerWidth);
  console.log(data);
  
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

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={margin}>
            <defs>
              <linearGradient
                id="barGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                <stop
                  offset="100%"
                  stopColor="#7c3aed"
                  stopOpacity={0.9}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              type="category"
              dataKey={categoryKey}
              interval={containerWidth < 500 ? 0 : "preserveStartEnd"}
              tick={{ fill: "#64748b", fontSize, fontWeight: 500 }}
              axisLine={false}
              tickLine={{ stroke: "#e2e8f0", strokeWidth: 1 }}
              tickFormatter={formatDate}
              label={
                showLabels
                  ? {
                      value: categoryLabel,
                      position: "insideBottom",
                      offset: -5,
                      fill: "#64748b",
                      fontSize: labelFontSize,
                      fontWeight: 600,
                    }
                  : false
              }
            />
            <YAxis
              type="number"
              tickFormatter={(v) => formatNumber(v, false)}
              axisLine={false}
              tickLine={{ stroke: "#e2e8f0", strokeWidth: 1 }}
              tick={{ fill: "#64748b", fontSize, fontWeight: 500 }}
              label={
                showLabels
                  ? {
                      value: valueLabel,
                      angle: -90,
                      position: "insideLeft",
                      offset: 0,
                      fill: "#64748b",
                      fontSize: labelFontSize,
                      fontWeight: 600,
                    }
                  : false
              }
            />
            <Tooltip
              formatter={formatNumber}
              labelFormatter={formatDate}
              contentStyle={{
                background: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
                fontSize: Math.max(11, fontSize - 1),
                fontWeight: 500,
                backdropFilter: "blur(10px)",
              }}
            />
            <Bar
              dataKey={valueKey}
              fill="url(#barGradient)"
              radius={[6, 6, 0, 0]}
              name={valueKey}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default VerticalBarChart;