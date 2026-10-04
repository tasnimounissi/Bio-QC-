import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Legend,
} from "recharts"

const generateQualityData = () => {
  const points = [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500]
  const scores = [35, 33, 30, 28, 32, 27, 31, 30, 29, 36, 30]
  return points.map((bp, i) => ({ position: bp, quality: scores[i] }))
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const q = payload[0].value
    const status = q >= 30 ? "High Quality" : q >= 20 ? "Acceptable" : "Low Quality"
    const statusColor = q >= 30 ? "text-emerald-600" : q >= 20 ? "text-amber-500" : "text-red-500"
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-md text-sm">
        <p className="text-gray-500 mb-1">Position: <span className="font-semibold text-gray-800">{label} bp</span></p>
        <p className="text-gray-500">Q Score: <span className="font-semibold text-blue-600">{q}</span></p>
        <p className={`font-medium mt-1 ${statusColor}`}>{status}</p>
      </div>
    )
  }
  return null
}

export default function SequenceVisualizer({ data }) {
  // data vient du backend (quality_data) ou fallback mock
  const chartData = Array.isArray(data) && data.length > 0
    ? data
    : generateQualityData()

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-base font-semibold text-gray-800 mb-1">Quality Score per Position</h3>
      <p className="text-xs text-gray-400 mb-4">Phred Quality Score (Q) across sequence length</p>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="qualityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#2563EB" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="position" tickLine={false} axisLine={false}
            tick={{ fontSize: 11, fill: "#94A3B8" }}
            label={{ value: "Position (bp)", position: "insideBottom", offset: -2, fontSize: 11, fill: "#94A3B8" }} />
          <YAxis domain={[0, 40]} ticks={[0, 9, 18, 27, 36]}
            tickLine={false} axisLine={false}
            tick={{ fontSize: 11, fill: "#94A3B8" }}
            label={{ value: "Quality Score (Q)", angle: -90, position: "insideLeft", offset: 10, fontSize: 11, fill: "#94A3B8" }} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={20} stroke="#EF4444" strokeDasharray="6 3" strokeWidth={1.5}
            label={{ value: "Q20 Threshold", position: "right", fontSize: 10, fill: "#EF4444" }} />
          <Area type="monotone" dataKey="quality" stroke="#2563EB" strokeWidth={2}
            fill="url(#qualityGradient)"
            dot={{ r: 4, fill: "#2563EB", strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 6, fill: "#2563EB" }} name="Quality Score" />
          <Legend verticalAlign="bottom" height={30}
            formatter={() => <span className="text-xs text-gray-500">Quality Score</span>} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}