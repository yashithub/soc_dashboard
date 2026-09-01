import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { PieChart as PieIcon } from 'lucide-react'
import { SEVERITY } from '../../constants/threatModel.js'
import { COLORS, SEVERITY_COLOR } from '../../theme/tokens.js'
import { formatNumber, formatPercent } from '../../utils/format.js'
import { EmptyState, SeverityBadge } from '../ui/Badges.jsx'
import { ChartTooltip } from './ChartTooltip.jsx'

const ESCALATED = [SEVERITY.CRITICAL, SEVERITY.HIGH]

/**
 * Severity mix as a donut, with every segment also written out in the list
 * beside it. The list is the accessible reading of the same numbers — the donut
 * shows proportion, the list carries the identity and the exact counts, and the
 * badges add an icon so severity never depends on colour alone.
 */
export function SeverityChart({ data, total }) {
  if (!total) {
    return (
      <EmptyState
        icon={PieIcon}
        title="No alerts to break down"
        message="Clear or widen the filters to see the severity mix."
      />
    )
  }

  const segments = data.filter((entry) => entry.value > 0)

  // The figure that actually drives triage priority, stated in words.
  const escalated = data
    .filter((entry) => ESCALATED.includes(entry.name))
    .reduce((sum, entry) => sum + entry.value, 0)

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col items-center gap-4 sm:flex-row sm:gap-2">
        <div className="relative h-[180px] w-[180px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={segments}
                dataKey="value"
                nameKey="name"
                innerRadius={56}
                outerRadius={84}
                // 2px of surface between segments keeps adjacent fills legible.
                paddingAngle={2}
                startAngle={90}
                endAngle={-270}
                stroke={COLORS.surface}
                strokeWidth={2}
                isAnimationActive={false}
              >
                {segments.map((entry) => (
                  <Cell key={entry.name} fill={SEVERITY_COLOR[entry.name]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl leading-none font-semibold text-ink">
              {formatNumber(total)}
            </span>
            <span className="mt-1 text-[10px] tracking-wide text-ink-faint uppercase">
              Alerts
            </span>
          </div>
        </div>

        <ul className="w-full min-w-0 flex-1 space-y-1.5">
          {data.map((entry) => (
            <li
              key={entry.name}
              className="flex items-center gap-2 rounded px-1.5 py-1 hover:bg-panel-raised"
            >
              <SeverityBadge severity={entry.name} size="sm" />
              <span className="tabular ml-auto text-[13px] font-semibold text-ink">
                {formatNumber(entry.value)}
              </span>
              <span className="tabular w-12 text-right text-[11px] text-ink-faint">
                {formatPercent(entry.share, 0)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 border-t border-line pt-2 text-[11px] text-ink-faint">
        <span className="font-medium text-ink-muted">
          {formatNumber(escalated)} alerts ({formatPercent((escalated / total) * 100, 0)})
        </span>{' '}
        are Critical or High and sit at the top of the triage queue.
      </p>
    </div>
  )
}
