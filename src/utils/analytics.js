/**
 * ============================================================================
 * ANALYTICS — every derived number the dashboard shows
 * ============================================================================
 * KPI cards, all three charts and the table header counts read from these
 * functions. No component computes its own totals, so the headline figures and
 * the charts can never disagree.
 * ============================================================================
 */

import {
  ALL,
  CHANNEL,
  SEVERITY,
  SEVERITY_ORDER,
  SEVERITY_RANK,
  STATUS,
  THREAT_TYPE_ORDER,
} from '../constants/threatModel.js'
import { HOUR_MS, floorToHour } from './time.js'

const asArray = (alerts) => (Array.isArray(alerts) ? alerts : [])

const timeOf = (alert) => {
  const parsed = Date.parse(alert?.timestamp ?? '')
  return Number.isNaN(parsed) ? 0 : parsed
}

/* -------------------------------------------------------------------------- */
/* Filtering & sorting                                                         */
/* -------------------------------------------------------------------------- */

/** Fields the free-text search scans. */
const SEARCHABLE_FIELDS = ['id', 'source', 'threatType', 'description', 'targetAsset']

/**
 * Applies the analyst's filter set. Pure and cheap enough to run on every
 * keystroke for the dataset sizes this dashboard handles.
 *
 * @param {Array<object>} alerts
 * @param {{search?: string, severity?: string, threatType?: string, status?: string}} filters
 */
export function filterAlerts(alerts, filters = {}) {
  const { search = '', severity = ALL, threatType = ALL, status = ALL } = filters
  const query = search.trim().toLowerCase()

  return asArray(alerts).filter((alert) => {
    if (severity !== ALL && alert.severity !== severity) return false
    if (threatType !== ALL && alert.threatType !== threatType) return false
    if (status !== ALL && alert.status !== status) return false
    if (!query) return true

    return SEARCHABLE_FIELDS.some((field) =>
      String(alert[field] ?? '').toLowerCase().includes(query),
    )
  })
}

export const SORTABLE_COLUMNS = {
  timestamp: (alert) => timeOf(alert),
  severity: (alert) => SEVERITY_RANK[alert.severity] ?? 0,
  confidence: (alert) => alert.confidence ?? -1,
}

/**
 * Returns a new sorted array; never mutates the input.
 *
 * @param {Array<object>} alerts
 * @param {{key: keyof SORTABLE_COLUMNS, direction: 'asc'|'desc'}} sort
 */
export function sortAlerts(alerts, sort) {
  const accessor = SORTABLE_COLUMNS[sort?.key]
  if (!accessor) return asArray(alerts)
  const factor = sort.direction === 'asc' ? 1 : -1

  return [...asArray(alerts)].sort((a, b) => {
    const delta = accessor(a) - accessor(b)
    // Stable tie-break on time keeps paging deterministic.
    return delta !== 0 ? delta * factor : timeOf(b) - timeOf(a)
  })
}

export const isFilterActive = (filters = {}) =>
  Boolean(filters.search?.trim()) ||
  filters.severity !== ALL ||
  filters.threatType !== ALL ||
  filters.status !== ALL

/* -------------------------------------------------------------------------- */
/* KPI figures                                                                 */
/* -------------------------------------------------------------------------- */

const countBy = (alerts, predicate) =>
  asArray(alerts).reduce((total, alert) => total + (predicate(alert) ? 1 : 0), 0)

/**
 * Headline figures for the KPI row, all derived from the alerts passed in.
 *
 * `totalEvents` is the number of raw security events correlated into these
 * alerts — the same relationship a real SIEM has between telemetry and the
 * alert queue an analyst actually works.
 *
 * @param {Array<object>} alerts
 * @param {number} [now] evaluation time, for the 24h/previous-24h comparison
 */
export function computeKpis(alerts, now = Date.now()) {
  const list = asArray(alerts)

  const totalEvents = list.reduce(
    (sum, alert) => sum + (Number.isFinite(alert.correlatedEvents) ? alert.correlatedEvents : 1),
    0,
  )

  const criticalThreats = countBy(list, (alert) => alert.severity === SEVERITY.CRITICAL)
  const highThreats = countBy(list, (alert) => alert.severity === SEVERITY.HIGH)
  const resolved = countBy(list, (alert) => alert.status === STATUS.RESOLVED)
  const blocked = countBy(list, (alert) => alert.status === STATUS.BLOCKED)
  const investigating = countBy(list, (alert) => alert.status === STATUS.INVESTIGATING)
  const suspiciousEmails = countBy(list, (alert) => alert.channel === CHANNEL.EMAIL)

  const dayMs = 24 * 60 * 60 * 1000
  const lastDay = countBy(list, (alert) => now - timeOf(alert) <= dayMs)
  const priorDay = countBy(list, (alert) => {
    const age = now - timeOf(alert)
    return age > dayMs && age <= 2 * dayMs
  })

  const confidenceValues = list
    .map((alert) => alert.confidence)
    .filter((value) => Number.isFinite(value))

  return {
    totalEvents,
    threatsDetected: list.length,
    criticalThreats,
    highThreats,
    resolved,
    blocked,
    investigating,
    suspiciousEmails,

    resolutionRate: list.length ? (resolved / list.length) * 100 : 0,
    criticalShare: list.length ? (criticalThreats / list.length) * 100 : 0,
    emailShare: list.length ? (suspiciousEmails / list.length) * 100 : 0,
    averageConfidence: confidenceValues.length
      ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length
      : null,

    /** Percentage change in alert volume, last 24h vs the 24h before it. */
    volumeChangePct: priorDay ? ((lastDay - priorDay) / priorDay) * 100 : null,
    lastDayCount: lastDay,
  }
}

/* -------------------------------------------------------------------------- */
/* Distributions                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Counts per severity, always in Critical → Low order so the donut segments and
 * the legend never reorder as the data changes.
 */
export function severityDistribution(alerts) {
  const list = asArray(alerts)
  const counts = Object.fromEntries(SEVERITY_ORDER.map((level) => [level, 0]))
  for (const alert of list) {
    if (counts[alert.severity] !== undefined) counts[alert.severity] += 1
  }
  const total = list.length

  return SEVERITY_ORDER.map((level) => ({
    name: level,
    value: counts[level],
    share: total ? (counts[level] / total) * 100 : 0,
  }))
}

/**
 * Counts per threat type, sorted by volume so the bar chart reads top-down.
 * Types with no events are kept at zero rather than dropped, so the category
 * list stays stable while filters are applied.
 */
export function threatTypeDistribution(alerts) {
  const list = asArray(alerts)
  const counts = Object.fromEntries(THREAT_TYPE_ORDER.map((type) => [type, 0]))
  for (const alert of list) {
    if (counts[alert.threatType] !== undefined) counts[alert.threatType] += 1
  }
  const total = list.length

  return THREAT_TYPE_ORDER.map((type) => ({
    name: type,
    value: counts[type],
    share: total ? (counts[type] / total) * 100 : 0,
  })).sort((a, b) => b.value - a.value)
}

/* -------------------------------------------------------------------------- */
/* Time series                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Buckets alerts into hourly points across the rolling window.
 *
 * Every hour in the window is emitted, including empty ones, so the line has no
 * misleading gaps and the x-axis stays evenly spaced.
 *
 * @param {Array<object>} alerts
 * @param {{windowHours?: number, now?: number}} [options]
 * @returns {Array<{time: number, label: string, detected: number, severe: number}>}
 */
export function threatActivitySeries(alerts, { windowHours = 48, now = Date.now() } = {}) {
  const windowEnd = floorToHour(now)
  const windowStart = windowEnd - (windowHours - 1) * HOUR_MS

  const buckets = new Map()
  for (let bucket = windowStart; bucket <= windowEnd; bucket += HOUR_MS) {
    buckets.set(bucket, { time: bucket, detected: 0, severe: 0 })
  }

  for (const alert of asArray(alerts)) {
    const time = timeOf(alert)
    if (!time) continue
    const entry = buckets.get(floorToHour(time))
    if (!entry) continue
    entry.detected += 1
    if (alert.severity === SEVERITY.CRITICAL || alert.severity === SEVERITY.HIGH) {
      entry.severe += 1
    }
  }

  return [...buckets.values()].map((entry) => {
    const date = new Date(entry.time)
    return {
      ...entry,
      label: date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      fullLabel: `${date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
      })} · ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`,
    }
  })
}

/**
 * The window's busiest hour — surfaced as context under the activity chart so
 * the spike an evaluator sees is named rather than left to interpretation.
 */
export function peakActivity(series) {
  const points = asArray(series)
  if (points.length === 0) return null
  return points.reduce((peak, point) => (point.detected > peak.detected ? point : peak))
}
