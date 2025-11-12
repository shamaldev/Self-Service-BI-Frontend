
import {
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
 
} from "recharts";
import {  formatNumber } from "../../utils/utils";
import { chartColors } from "../../utils/chartConfig";


const PieChartComponent = ({ data, chartConfig, containerSize = { width: 400, height: 300 }, fontSize = 12, labelFontSize = 14, showLabels = true }) => {
  const { width: containerWidth } = containerSize;
  const categoryKey =
    chartConfig?.category_col_name || "category";
  const valueKey = chartConfig?.value_col_name || "value";
  const labelKey = chartConfig?.label_col_name;

  const pieData = data
    .filter(
      (item) =>
        item.hasOwnProperty(categoryKey) && item.hasOwnProperty(valueKey)
    )
    .map((item) => ({
      category: String(item[categoryKey] || "Unknown"),
      value: parseFloat(item[valueKey]) || 0,
      label: labelKey
        ? String(item[labelKey] || "")
        : String(item[categoryKey] || "Unknown"),
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  if (pieData.length === 0)
    return <div className="text-gray-400 text-sm">No valid pie data</div>;

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="category"
              outerRadius={containerWidth < 400 ? "70%" : "80%"}
              innerRadius={containerWidth < 400 ? "30%" : "40%"}
              paddingAngle={3}
              label={showLabels && containerWidth > 300 ? false : false} // Disable labels on small screens
              cornerRadius={8}
            >
              {pieData.map((_, idx) => (
                <Cell
                  key={`cell-${idx}`}
                  fill={chartColors.pie[idx % chartColors.pie.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={formatNumber}
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
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};


export default PieChartComponent;