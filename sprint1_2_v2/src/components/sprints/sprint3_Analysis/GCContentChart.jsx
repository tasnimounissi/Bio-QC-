import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"

const COLORS = ["#2563EB", "#10B981"]

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-md text-sm">
        <p className="font-semibold text-gray-700">{payload[0].name}</p>
        <p className="text-gray-500">{payload[0].value}%</p>
      </div>
    )
  }
  return null
}

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle"
      dominantBaseline="central" fontSize={14} fontWeight={700}>
      {`${name} ${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function GCContentChart({ data }) {
  
  const chartData = [
    { name: 'GC', value: data?.gc_content        ?? 52 },
    { name: 'AT', value: data ? Math.round(100 - data.gc_content) : 48 },
  ]

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-base font-semibold text-gray-800 mb-1">GC Content Distribution</h3>
      <p className="text-xs text-gray-400 mb-4">Percentage of GC vs AT in sequence</p>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}        
            cx="50%"
            cy="50%"
            outerRadius={100}
            dataKey="value"
            labelLine={false}
            label={CustomLabel}
            strokeWidth={2}
            stroke="#fff"
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={10}
            formatter={(value, entry) => (
              <span className="text-sm text-gray-600 font-medium">
                {value} — {entry.payload.value}%
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}