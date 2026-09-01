/** Presentation-only formatting helpers. All are null-safe. */

const NUMBER = new Intl.NumberFormat('en-US')

export const formatNumber = (value) =>
  Number.isFinite(value) ? NUMBER.format(value) : '—'

/** Compact form for large KPI values, e.g. 8431 → "8.4K". */
export const formatCompact = (value) => {
  if (!Number.isFinite(value)) return '—'
  if (value < 10_000) return NUMBER.format(value)
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export const formatPercent = (value, digits = 1) =>
  Number.isFinite(value) ? `${value.toFixed(digits)}%` : '—'

const toDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** "21:43" — the compact form used in the alerts table. */
export const formatTime = (value) => {
  const date = toDate(value)
  return date
    ? date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : '—'
}

/** "01 Sep" — shown under the time when an alert is not from today. */
export const formatDayShort = (value) => {
  const date = toDate(value)
  return date ? date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ''
}

/** "01 Sep 2026, 21:43:07" — the detail-panel form. */
export const formatFullTimestamp = (value) => {
  const date = toDate(value)
  if (!date) return 'Unknown'
  return `${date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })}, ${date.toLocaleTimeString('en-GB', { hour12: false })}`
}

/** "3h 12m ago" */
export const formatRelative = (value, now = Date.now()) => {
  const date = toDate(value)
  if (!date) return ''
  const minutes = Math.max(0, Math.round((now - date.getTime()) / 60_000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  if (hours < 24) return remainder ? `${hours}h ${remainder}m ago` : `${hours}h ago`
  return `${Math.floor(hours / 24)}d ${hours % 24}h ago`
}

export const isToday = (value) => {
  const date = toDate(value)
  if (!date) return false
  const now = new Date()
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  )
}

/** "8f92…a71c" — long hashes shortened for display, never altered in place. */
export const truncateHash = (hash, lead = 8, tail = 6) => {
  if (!hash || typeof hash !== 'string') return '—'
  if (hash.length <= lead + tail + 1) return hash
  return `${hash.slice(0, lead)}…${hash.slice(-tail)}`
}
