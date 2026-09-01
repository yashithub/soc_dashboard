import {
  Area,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CHART, COLORS } from '../../theme/tokens.js'
import { ChartTooltip } from './ChartTooltip.jsx'
import { EmptyState } from '../ui/Badges.jsx'
import { ActivitySquare } from 'lucide-react'

export function TrafficVolumeChart({ data }) {
  const hasData = data.some((point) => point.gb > 0)

  if (!hasData) {
    return (
      <EmptyState
        icon={ActivitySquare}
        title="No traffic volume"
        message="No data points to plot for the current window."
      />
    )
  }

  const tickInterval = Math.max(1, Math.round(data.length / 6)) - 1

  return (
    <div className="h-[228px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="volumeArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={'#f79a4a'} stopOpacity={0.32} />
              <stop offset="100%" stopColor={'#f79a4a'} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke={CHART.gridStroke} strokeDasharray="3 3" vertical={false} />
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
            allowDecimals={true}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: COLORS.inkFaint, strokeWidth: 1, strokeDasharray: '3 3' }}
          />
          <Area
            type="monotone"
            dataKey="gb"
            name="Volume (GB)"
            stroke="#f79a4a"
            strokeWidth={2}
            fill="url(#volumeArea)"
            activeDot={{ r: 4, strokeWidth: 2, stroke: COLORS.surface }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
