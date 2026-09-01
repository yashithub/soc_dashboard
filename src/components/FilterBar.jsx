import { Search, X } from 'lucide-react'
import { EMPTY_FILTERS, FILTER_OPTIONS } from '../constants/threatModel.js'
import { isFilterActive } from '../utils/analytics.js'

const SELECT_CLASS =
  'h-8 min-w-0 rounded border border-line-strong bg-panel-sunken px-2 pr-7 text-xs text-ink ' +
  'appearance-none bg-[length:14px] bg-[right_0.4rem_center] bg-no-repeat ' +
  "bg-[url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236f7f94' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")] " +
  'hover:border-accent/50 focus:border-accent'

function FilterSelect({ id, label, value, options, onChange }) {
  return (
    <div className="flex items-center gap-1.5">
      <label htmlFor={id} className="text-[11px] whitespace-nowrap text-ink-faint">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={SELECT_CLASS}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

/**
 * Search + the three dimension filters, in one row above the alert queue.
 *
 * Filters are lifted state: the dashboard applies them once and feeds the
 * result to the KPIs, the charts and the table, so every number on screen
 * describes the same set of alerts.
 */
export function FilterBar({ filters, onChange, resultCount, totalCount }) {
  const active = isFilterActive(filters)
  const update = (patch) => onChange({ ...filters, ...patch })

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-2.5">
      <div className="relative min-w-[200px] flex-1">
        <Search
          size={14}
          className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-faint"
          aria-hidden
        />
        <input
          type="search"
          value={filters.search}
          onChange={(event) => update({ search: event.target.value })}
          placeholder="Search incident ID, IP, threat type or description…"
          aria-label="Search alerts"
          className="h-8 w-full rounded border border-line-strong bg-panel-sunken pr-3 pl-8 text-xs text-ink placeholder:text-ink-faint hover:border-accent/50 focus:border-accent"
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <FilterSelect
          id="filter-severity"
          label="Severity"
          value={filters.severity}
          options={FILTER_OPTIONS.severity}
          onChange={(value) => update({ severity: value })}
        />
        <FilterSelect
          id="filter-threat-type"
          label="Type"
          value={filters.threatType}
          options={FILTER_OPTIONS.threatType}
          onChange={(value) => update({ threatType: value })}
        />
        <FilterSelect
          id="filter-protocol"
          label="Protocol"
          value={filters.protocol}
          options={FILTER_OPTIONS.protocol}
          onChange={(value) => update({ protocol: value })}
        />
        <FilterSelect
          id="filter-status"
          label="Status"
          value={filters.status}
          options={FILTER_OPTIONS.status}
          onChange={(value) => update({ status: value })}
        />

        <span className="tabular text-[11px] whitespace-nowrap text-ink-faint">
          {resultCount === totalCount
            ? `${totalCount} alerts`
            : `${resultCount} of ${totalCount} alerts`}
        </span>

        {active && (
          <button
            type="button"
            onClick={() => onChange({ ...EMPTY_FILTERS })}
            className="inline-flex items-center gap-1 rounded border border-line-strong px-2 py-1 text-[11px] font-medium text-ink-muted transition-colors hover:border-accent/50 hover:text-ink"
          >
            <X size={11} aria-hidden />
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}
