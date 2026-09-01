import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, SearchX } from 'lucide-react'
import { APP_CONFIG } from '../config/appConfig.js'
import { sortAlerts } from '../utils/analytics.js'
import { formatDayShort, formatTime, isToday } from '../utils/format.js'
import { ConfidenceMeter, EmptyState, SeverityBadge, StatusBadge } from './ui/Badges.jsx'
import { SEVERITY_STYLE } from '../theme/tokens.js'

/**
 * Column definitions drive both the header and the sort controls, so a column
 * cannot become sortable in one place and inert in the other.
 *
 * `hideBelow` drops lower-priority columns on narrow screens rather than
 * squeezing seven columns into a phone width.
 */
const COLUMNS = [
  { key: 'id', label: 'Incident ID', width: 'w-[110px]' },
  { key: 'timestamp', label: 'Timestamp', sortable: true, width: 'w-[92px]' },
  { key: 'source', label: 'Source', hideBelow: 'hidden md:table-cell' },
  { key: 'threatType', label: 'Threat Type', width: 'w-[150px]' },
  { key: 'severity', label: 'Severity', sortable: true, width: 'w-[120px]' },
  {
    key: 'confidence',
    label: 'ML Confidence',
    sortable: true,
    width: 'w-[150px]',
    hideBelow: 'hidden sm:table-cell',
  },
  { key: 'status', label: 'Status', width: 'w-[140px]' },
]

function SortIcon({ active, direction }) {
  if (!active) {
    return <ChevronDown size={11} className="opacity-30" aria-hidden />
  }
  return direction === 'asc' ? (
    <ChevronUp size={11} aria-hidden />
  ) : (
    <ChevronDown size={11} aria-hidden />
  )
}

/**
 * The alert queue.
 *
 * Sorting and pagination happen here because they are presentation state;
 * filtering happens one level up so the KPIs and charts see the same subset.
 */
export function AlertsTable({ alerts, selectedId, onSelect, onClearFilters }) {
  const [sort, setSort] = useState({ key: 'timestamp', direction: 'desc' })
  const [page, setPage] = useState(1)

  const sorted = useMemo(() => sortAlerts(alerts, sort), [alerts, sort])

  const pageSize = APP_CONFIG.pageSize
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))

  // Filtering can shrink the result set below the current page.
  useEffect(() => {
    setPage((current) => Math.min(current, pageCount))
  }, [pageCount])

  const start = (page - 1) * pageSize
  const rows = sorted.slice(start, start + pageSize)

  const toggleSort = (key) =>
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === 'desc' ? 'asc' : 'desc' }
        : { key, direction: 'desc' },
    )

  if (alerts.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="No alerts match the current view"
        message="Your search or filter combination returned no results. Adjust the criteria or clear the filters to see the full queue."
        action={
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-2 rounded border border-line-strong px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:border-accent/50 hover:text-ink"
          >
            Clear filters
          </button>
        }
      />
    )
  }

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line">
              {COLUMNS.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={
                    sort.key === column.key
                      ? sort.direction === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                  className={`px-3 py-2 text-[10px] font-semibold tracking-wider text-ink-faint uppercase ${
                    column.width ?? ''
                  } ${column.hideBelow ?? ''}`}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className="inline-flex items-center gap-1 tracking-wider uppercase transition-colors hover:text-ink"
                    >
                      {column.label}
                      <SortIcon
                        active={sort.key === column.key}
                        direction={sort.direction}
                      />
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((alert) => {
              const selected = alert.id === selectedId
              return (
                <tr
                  key={alert.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open incident ${alert.id}`}
                  aria-current={selected ? 'true' : undefined}
                  onClick={() => onSelect(alert)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onSelect(alert)
                    }
                  }}
                  className={`cursor-pointer border-b border-line/60 transition-colors focus-visible:outline-offset-[-2px] ${
                    selected ? 'bg-accent/10' : 'hover:bg-panel-raised'
                  }`}
                >
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-2">
                      {/* Severity rail: a second, always-visible severity cue. */}
                      <span
                        className={`h-4 w-[3px] shrink-0 rounded-full ${
                          SEVERITY_STYLE[alert.severity]?.bar ?? 'bg-line-strong'
                        }`}
                        aria-hidden
                      />
                      <span className="font-mono text-xs font-medium text-ink">
                        {alert.id}
                      </span>
                    </span>
                  </td>

                  <td className="px-3 py-2.5">
                    <span className="tabular block text-[13px] text-ink">
                      {formatTime(alert.timestamp)}
                    </span>
                    {!isToday(alert.timestamp) && (
                      <span className="block text-[10px] text-ink-faint">
                        {formatDayShort(alert.timestamp)}
                      </span>
                    )}
                  </td>

                  <td className="hidden max-w-[260px] px-3 py-2.5 md:table-cell">
                    <span className="block truncate text-[13px] text-ink-muted">
                      {alert.source}
                    </span>
                  </td>

                  <td className="px-3 py-2.5 text-[13px] text-ink">{alert.threatType}</td>

                  <td className="px-3 py-2.5">
                    <SeverityBadge severity={alert.severity} />
                  </td>

                  <td className="hidden px-3 py-2.5 sm:table-cell">
                    <ConfidenceMeter value={alert.confidence} />
                  </td>

                  <td className="px-3 py-2.5">
                    <StatusBadge status={alert.status} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
        <p className="tabular text-[11px] text-ink-faint">
          Showing {start + 1}–{Math.min(start + pageSize, sorted.length)} of {sorted.length}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1}
            className="inline-flex h-7 items-center gap-1 rounded border border-line-strong px-2 text-[11px] text-ink-muted transition-colors hover:border-accent/50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={12} aria-hidden />
            Prev
          </button>
          <span className="tabular text-[11px] text-ink-faint">
            Page {page} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            disabled={page === pageCount}
            className="inline-flex h-7 items-center gap-1 rounded border border-line-strong px-2 text-[11px] text-ink-muted transition-colors hover:border-accent/50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight size={12} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}
