import {
  Area,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CHART, COLORS, THREAT_COLORS } from '../../theme/tokens.js'
import { ChartTooltip } from './ChartTooltip.jsx'
import { EmptyState } from '../ui/Badges.jsx'
import { ActivitySquare } from 'lucide-react'
import { THREAT_TYPE_ORDER } from '../../constants/threatModel.js'

export function ThreatActivityChart({ data }) {
  // data comes from threatActivitySeries which has timestamps and keys for each THREAT_TYPE_ORDER
  const hasData = data.some((point) => THREAT_TYPE_ORDER.some(t => point[t] > 0))

  if (!hasData) {
    return (
      <EmptyState
        icon={ActivitySquare}
        title="No activity in this window"
        message="No alerts match the current filters, so there is nothing to plot over time."
      />
    )
  }

  const tickInterval = Math.max(1, Math.round(data.length / 6)) - 1

  return (
    <div>
      <ul className="mb-1 flex flex-wrap items-center justify-end gap-3 px-2">
        {THREAT_TYPE_ORDER.map((type) => (
          <li key={type} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: THREAT_COLORS[type] }}
              aria-hidden
            />
            <span className="text-[10px] text-ink-muted whitespace-nowrap">{type}</span>
          </li>
        ))}
      </ul>

      <div className="h-[228px] w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid
              stroke={CHART.gridStroke}
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(timeStr) => {
                const date = new Date(timeStr)
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }}
              interval={tickInterval}
              tick={CHART.tick}
              tickLine={false}
              axisLine={{ stroke: CHART.axisStroke }}
              minTickGap={16}
            />
            <YAxis
              tick={CHART.tick}
              tickLine={false}
              axisLine={false}
              width={44}
              allowDecimals={false}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: COLORS.inkFaint, strokeWidth: 1, strokeDasharray: '3 3' }}
            />
            {THREAT_TYPE_ORDER.map((type) => (
              <Area
                key={type}
                type="monotone"
                dataKey={type}
                name={type}
                stackId="1"
                stroke={THREAT_COLORS[type]}
                fill={THREAT_COLORS[type]}
                strokeWidth={1}
                fillOpacity={0.6}
                isAnimationActive={false}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
