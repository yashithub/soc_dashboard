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
import { BarChart3 } from 'lucide-react'
import { CHART, COLORS } from '../../theme/tokens.js'
import { EmptyState } from '../ui/Badges.jsx'
import { ChartTooltip } from './ChartTooltip.jsx'

/**
 * Alert volume per threat type.
 *
 * One measure across categories, so it is a single-hue bar chart: the category
 * names are already on the axis, and colouring each bar differently would
 * encode nothing. Horizontal bars keep the longer labels readable.
 */
export function ThreatTypeChart({ data }) {
  const hasData = data.some((entry) => entry.value > 0)

  if (!hasData) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No threat types to compare"
        message="Clear or widen the filters to see the type breakdown."
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
            dataKey="name"
            tick={{ ...CHART.tick, fill: COLORS.inkMuted }}
            tickLine={false}
            axisLine={false}
            width={112}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: COLORS.surfaceRaised }}
          />
          <Bar
            dataKey="value"
            name="Alerts"
            fill={CHART.seriesPrimary}
            radius={[0, 4, 4, 0]}
            maxBarSize={18}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="value"
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
