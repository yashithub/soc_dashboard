import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Clock,
  Info,
  Search,
  ShieldBan,
} from 'lucide-react'
import { SEVERITY, STATUS } from '../../constants/threatModel.js'
import { SEVERITY_STYLE, STATUS_STYLE } from '../../theme/tokens.js'
import { formatPercent } from '../../utils/format.js'

/**
 * Severity is never communicated by colour alone: each badge pairs a distinct
 * icon with the written level, so it survives greyscale, colour-vision
 * differences and a washed-out projector.
 */
const SEVERITY_ICON = {
  [SEVERITY.CRITICAL]: AlertOctagon,
  [SEVERITY.HIGH]: AlertTriangle,
  [SEVERITY.MEDIUM]: CircleDot,
  [SEVERITY.LOW]: Info,
}

export function SeverityBadge({ severity, size = 'md' }) {
  const style = SEVERITY_STYLE[severity]
  const Icon = SEVERITY_ICON[severity] ?? Info
  if (!style) {
    return <span className="text-xs text-ink-faint">Unknown</span>
  }
  const sizing = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded font-semibold whitespace-nowrap ${sizing} ${style.badge}`}
    >
      <Icon size={size === 'sm' ? 10 : 12} aria-hidden />
      {severity}
    </span>
  )
}

const STATUS_ICON = {
  [STATUS.INVESTIGATING]: Search,
  [STATUS.BLOCKED]: ShieldBan,
  [STATUS.RESOLVED]: CheckCircle2,
  [STATUS.PENDING]: Clock,
}

export function StatusBadge({ status }) {
  const style = STATUS_STYLE[status]
  const Icon = STATUS_ICON[status] ?? Clock
  if (!style) return <span className="text-xs text-ink-faint">Unknown</span>

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${style}`}
    >
      <Icon size={11} aria-hidden />
      {status}
    </span>
  )
}

/**
 * ML confidence as a number plus a proportional bar. The bar is a second
 * reading of the same value — useful for scanning a column of 12 rows quickly.
 */
export function ConfidenceMeter({ value, showBar = true }) {
  if (!Number.isFinite(value)) {
    return <span className="text-xs text-ink-faint">—</span>
  }
  // Confidence is only meaningful in its upper range; anchor the bar at 50%.
  const fill = Math.max(0, Math.min(100, ((value - 50) / 50) * 100))

  return (
    <div className="flex items-center gap-2">
      <span className="tabular w-12 shrink-0 text-right text-[13px] font-medium text-ink">
        {formatPercent(value)}
      </span>
      {showBar && (
        <span
          className="hidden h-1 w-14 shrink-0 overflow-hidden rounded-sm bg-line lg:block"
          aria-hidden
        >
          <span
            className="block h-full rounded-sm bg-accent"
            style={{ width: `${fill}%` }}
          />
        </span>
      )}
    </div>
  )
}

/**
 * Marks a surface that is a placeholder rather than a running service.
 * Used anywhere the demo could otherwise be mistaken for a live integration.
 */
export function SimulatedTag({ label = 'Simulated', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm border border-line-strong bg-panel-raised px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-ink-faint uppercase ${className}`}
    >
      {label}
    </span>
  )
}

/** Shared empty state for the table, charts and detail panel. */
export function EmptyState({ icon: Icon = Search, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <Icon size={22} className="text-ink-faint" aria-hidden />
      <p className="text-sm font-medium text-ink">{title}</p>
      {message && <p className="max-w-sm text-xs text-ink-faint">{message}</p>}
      {action}
    </div>
  )
}
