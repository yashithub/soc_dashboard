import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Server } from 'lucide-react'
import { CHART, COLORS } from '../../theme/tokens.js'
import { EmptyState } from '../ui/Badges.jsx'

export function TopIPsChart({ data, title = "Top IPs" }) {
  const hasData = data.some((entry) => entry.count > 0)

  if (!hasData) {
    return (
      <EmptyState
        icon={Server}
        title="No IPs found"
        message="Clear or widen the filters to see top IPs."
      />
    )
  }

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 34, bottom: 0, left: 0 }}
          barCategoryGap="22%"
        >
          <CartesianGrid stroke={CHART.gridStroke} strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            tick={CHART.tick}
            tickLine={false}
            axisLine={{ stroke: CHART.axisStroke }}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="ip"
            tick={{ ...CHART.tick, fill: COLORS.inkMuted, fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={90}
          />
          <Tooltip
            cursor={{ fill: COLORS.surfaceRaised }}
            contentStyle={{ backgroundColor: COLORS.surfaceRaised, borderColor: COLORS.line, color: COLORS.ink, fontSize: '12px' }}
          />
          <Bar
            dataKey="count"
            name="Alerts"
            fill={CHART.seriesPrimary}
            radius={[0, 4, 4, 0]}
            maxBarSize={18}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="count"
              position="right"
              offset={8}
              style={{ fill: COLORS.inkMuted, fontSize: 11, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
