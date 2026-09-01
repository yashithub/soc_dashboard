import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CHART, COLORS } from '../../theme/tokens.js'
import { peakActivity } from '../../utils/analytics.js'
import { ChartTooltip } from './ChartTooltip.jsx'
import { EmptyState } from '../ui/Badges.jsx'
import { ActivitySquare } from 'lucide-react'

/** Series definitions, shared by the legend and the marks so they cannot drift. */
const SERIES = [
  { key: 'detected', label: 'Threats detected', color: CHART.seriesPrimary },
  { key: 'severe', label: 'Critical & high', color: CHART.seriesCritical },
]

/**
 * Detected threats per hour across the rolling window, with the severe
 * (Critical + High) subset drawn on the same scale as a second line.
 *
 * Both series count alerts, so they share one y-axis — never a second scale.
 */
export function ThreatActivityChart({ data }) {
  const hasData = data.some((point) => point.detected > 0)
  const peak = peakActivity(data)

  if (!hasData) {
    return (
      <EmptyState
        icon={ActivitySquare}
        title="No activity in this window"
        message="No alerts match the current filters, so there is nothing to plot over time."
      />
    )
  }

  // Roughly six labelled ticks regardless of window length.
  const tickInterval = Math.max(1, Math.round(data.length / 6)) - 1

  return (
    <div>
      {/* Rendered as HTML rather than via Recharts' <Legend>, so the two series
          read in the same order as the tooltip and match the surrounding UI. */}
      <ul className="mb-1 flex items-center justify-end gap-4">
        {SERIES.map((series) => (
          <li key={series.key} className="flex items-center gap-1.5">
            <span
              className="h-0.5 w-3 rounded-full"
              style={{ background: series.color }}
              aria-hidden
            />
            <span className="text-[11px] text-ink-muted">{series.label}</span>
          </li>
        ))}
      </ul>

      <div className="h-[228px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id="threatArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART.seriesPrimary} stopOpacity={0.32} />
                <stop offset="100%" stopColor={CHART.seriesPrimary} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke={CHART.gridStroke}
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="label"
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
              content={<ChartTooltip titleKey="fullLabel" />}
              cursor={{ stroke: COLORS.inkFaint, strokeWidth: 1, strokeDasharray: '3 3' }}
            />
            <Area
              type="monotone"
              dataKey={SERIES[0].key}
              name={SERIES[0].label}
              stroke={SERIES[0].color}
              strokeWidth={2}
              fill="url(#threatArea)"
              activeDot={{ r: 4, strokeWidth: 2, stroke: COLORS.surface }}
            />
            <Line
              type="monotone"
              dataKey={SERIES[1].key}
              name={SERIES[1].label}
              stroke={SERIES[1].color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: COLORS.surface }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {peak && peak.detected > 0 && (
        <p className="mt-2 border-t border-line pt-2 text-[11px] text-ink-faint">
          Peak volume{' '}
          <span className="font-medium text-ink-muted">
            {peak.detected} alerts at {peak.fullLabel}
          </span>
          .
        </p>
      )}
    </div>
  )
}
