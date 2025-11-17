import { Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { formatNumber } from "../../utils/utils";
 
const PieChartComponent = ({
  data,
  chartConfig,
  containerSize = { width: 400, height: 300 },
  fontSize = 12,
  labelFontSize = 14,
  showLabels = true
}) => {
  const { width: containerWidth, height: containerHeight } = containerSize;
  const categoryKey = chartConfig?.category_col_name || "category";
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
 
  if (pieData.length === 0) return <div>No valid pie data</div>;
 
  // Professional, distinct color palette
  const professionalColors = [
    '#4A90E2', // Professional Blue
    '#E85D75', // Coral Red
    '#50C878', // Emerald Green
    '#9B59B6', // Rich Purple
    '#F39C12', // Golden Orange
    '#1ABC9C', // Turquoise
    '#E74C3C', // Vibrant Red
    '#3498DB', // Sky Blue
    '#2ECC71', // Fresh Green
    '#F1C40F', // Bright Yellow
    '#E67E22', // Orange
    '#95A5A6', // Cool Gray
  ];
 
  // Calculate total for percentages
  const total = pieData.reduce((sum, item) => sum + item.value, 0);
 
  // Custom label - clean callout style like the example
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    outerRadius,
    percent,
    index,
  }) => {
    const RADIAN = Math.PI / 180;
    // Calculate positions for clean callout lines
    const lineLength = 45;
    const extraLength = 35;
    // Start point at edge of pie
    const startRadius = outerRadius + 5;
    const startX = cx + startRadius * Math.cos(-midAngle * RADIAN);
    const startY = cy + startRadius * Math.sin(-midAngle * RADIAN);
    // End point of diagonal line
    const endRadius = outerRadius + lineLength;
    const endX = cx + endRadius * Math.cos(-midAngle * RADIAN);
    const endY = cy + endRadius * Math.sin(-midAngle * RADIAN);
    // Horizontal line extension
    const isRightSide = endX > cx;
    const horizontalEndX = isRightSide ? endX + extraLength : endX - extraLength;
 
    const item = pieData[index];
    const percentage = (percent * 100).toFixed(1);
    const textAnchor = isRightSide ? 'start' : 'end';
    const textX = isRightSide ? horizontalEndX + 8 : horizontalEndX - 8;
 
    const color = professionalColors[index % professionalColors.length];
 
    return (
<g>
        {/* Callout line - from pie edge to label */}
<polyline
          points={`${startX},${startY} ${endX},${endY} ${horizontalEndX},${endY}`}
          stroke="#333"
          strokeWidth={1.5}
          fill="none"
        />
        {/* Label text - category name */}
<text
          x={textX}
          y={endY - 8}
          fill="#333"
          textAnchor={textAnchor}
          dominantBaseline="middle"
          style={{ 
            fontSize: `${labelFontSize}px`, 
            fontWeight: '600',
            pointerEvents: 'none',
            fontFamily: 'Arial, sans-serif'
          }}
>
          {item.label}
</text>
        {/* Percentage and value */}
<text
          x={textX}
          y={endY + 8}
          fill="#666"
          textAnchor={textAnchor}
          dominantBaseline="middle"
          style={{ 
            fontSize: `${fontSize}px`,
            fontWeight: '400',
            pointerEvents: 'none',
            fontFamily: 'Arial, sans-serif'
          }}
>
          {formatNumber(item.value)}, {percentage}%
</text>
</g>
    );
  };
 
  const radius = Math.min(containerWidth, containerHeight) / 3.2;
  const showCustomLabels = showLabels && containerWidth > 550;
 
  return (
<ResponsiveContainer width="100%" height="100%">
<PieChart>
<Pie
          data={pieData}
          dataKey="value"
          nameKey="category"
          cx="50%"
          cy="50%"
          outerRadius={radius}
          label={showCustomLabels ? renderCustomLabel : false}
          labelLine={false}
          stroke="#fff"
          strokeWidth={2}
>
          {pieData.map((_, idx) => (
<Cell
              key={`cell-${idx}`}
              fill={professionalColors[idx % professionalColors.length]}
            />
          ))}
</Pie>
<Tooltip
          formatter={(value, name) => {
            const item = pieData.find(d => d.category === name);
            const percentage = ((value / total) * 100).toFixed(1);
            return [`${formatNumber(value)} (${percentage}%)`, item?.label || name];
          }}
          contentStyle={{ 
            fontSize: fontSize,
            borderRadius: '4px',
            border: '1px solid #ddd',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            padding: '8px 12px',
            fontFamily: 'Arial, sans-serif'
          }}
        />
        {/* Simple legend for smaller screens */}
        {!showCustomLabels && (
<g transform={`translate(20, ${containerHeight - pieData.length * 20 - 20})`}>
            {pieData.map((item, idx) => {
              const color = professionalColors[idx % professionalColors.length];
              const percentage = ((item.value / total) * 100).toFixed(1);
              const yPos = idx * 20;
              return (
<g key={`legend-${idx}`}>
<rect x={0} y={yPos} width={12} height={12} fill={color} />
<text
                    x={18}
                    y={yPos + 9}
                    style={{ 
                      fontSize: `${fontSize}px`, 
                      fontWeight: '500', 
                      fill: '#333',
                      fontFamily: 'Arial, sans-serif'
                    }}
>
                    {item.label} - {percentage}%
</text>
</g>
              );
            })}
</g>
        )}
</PieChart>
</ResponsiveContainer>
  );
};
 
export default PieChartComponent;