import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { PieChart as PieChartIcon } from 'lucide-react'
import { COLORS, THREAT_COLORS } from '../../theme/tokens.js'
import { EmptyState } from '../ui/Badges.jsx'

export function ThreatTypeChart({ data }) {
  const hasData = data.some((entry) => entry.count > 0)
  const total = data.reduce((sum, entry) => sum + entry.count, 0)

  if (!hasData) {
    return (
      <EmptyState
        icon={PieChartIcon}
        title="No threat types to compare"
        message="Clear or widen the filters to see the type breakdown."
      />
    )
  }

  return (
    <div className="h-[240px] w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Pie
            data={data}
            innerRadius="60%"
            outerRadius="80%"
            paddingAngle={2}
            dataKey="count"
            nameKey="threatType"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={THREAT_COLORS[entry.threatType] || COLORS.inkMuted} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: COLORS.surfaceRaised, borderColor: COLORS.line, color: COLORS.ink, fontSize: '12px' }}
            itemStyle={{ color: COLORS.inkMuted }}
            formatter={(value, name) => [value, name]}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center total */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[26px] font-semibold text-ink leading-none">{total}</span>
        <span className="text-[11px] text-ink-faint uppercase tracking-wide mt-1">Total Threats</span>
      </div>
    </div>
  )
}
