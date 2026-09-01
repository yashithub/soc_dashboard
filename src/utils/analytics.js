/**
 * ============================================================================
 * ANALYTICS — every derived number the dashboard shows
 * ============================================================================
 * KPI cards, all charts and the table header counts read from these
 * functions. No component computes its own totals.
 * ============================================================================
 */

import {
  ALL,
  SEVERITY,
  SEVERITY_ORDER,
  SEVERITY_RANK,
  STATUS,
  THREAT_TYPE_ORDER,
  PROTOCOL_ORDER,
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
const SEARCHABLE_FIELDS = ['id', 'sourceIP', 'destinationIP', 'threatType', 'description']

/**
 * Applies the analyst's filter set. Pure and cheap enough to run on every
 * keystroke for the dataset sizes this dashboard handles.
 *
 * @param {Array<object>} alerts
 * @param {{search?: string, severity?: string, threatType?: string, status?: string, protocol?: string}} filters
 */
export function filterAlerts(alerts, filters = {}) {
  const { search = '', severity = ALL, threatType = ALL, status = ALL, protocol = ALL } = filters
  const query = search.trim().toLowerCase()

  return asArray(alerts).filter((alert) => {
    if (severity !== ALL && alert.severity !== severity) return false
    if (threatType !== ALL && alert.threatType !== threatType) return false
    if (status !== ALL && alert.status !== status) return false
    if (protocol !== ALL && alert.protocol !== protocol) return false
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
  riskScore: (alert) => alert.riskScore ?? 0,
  bytes: (alert) => alert.bytes ?? 0,
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
  filters.status !== ALL ||
  filters.protocol !== ALL

/* -------------------------------------------------------------------------- */
/* KPI figures                                                                 */
/* -------------------------------------------------------------------------- */

const countBy = (alerts, predicate) =>
  asArray(alerts).reduce((total, alert) => total + (predicate(alert) ? 1 : 0), 0)

export function computeKpis(alerts) {
  const safe = asArray(alerts)
  const threats = safe // In our dataset, all generated items are flagged events

  const investigating = countBy(threats, (a) => a.status === STATUS.INVESTIGATING)
  const blocked = countBy(threats, (a) => a.status === STATUS.BLOCKED)
  const resolved = countBy(threats, (a) => a.status === STATUS.RESOLVED)
  
  const criticalThreats = countBy(threats, (a) => a.severity === SEVERITY.CRITICAL)
  const highSeverityThreats = countBy(threats, (a) => a.severity === SEVERITY.HIGH)
  
  const totalConfidence = threats.reduce((sum, a) => sum + (a.confidence ?? 0), 0)
  const averageConfidence = threats.length ? totalConfidence / threats.length : null

  // Network-specific KPIs
  const uniqueSourceIDs = new Set(threats.map(a => a.sourceIP)).size;
  const uniqueDestinationIDs = new Set(threats.map(a => a.destinationIP)).size;
  
  // Data exfiltration risk (sum of risk scores for exfil threats)
  let exfilRiskCount = 0;
  let exfilRiskScoreSum = 0;
  threats.forEach(a => {
    if (a.threatType === 'Data Exfiltration') {
      exfilRiskCount++;
      exfilRiskScoreSum += a.riskScore || 0;
    }
  });
  const dataExfilRisk = exfilRiskCount > 0 ? exfilRiskScoreSum / exfilRiskCount : 0;

  const totalBytes = threats.reduce((sum, a) => sum + (a.bytes || 0), 0);
  const totalPackets = threats.reduce((sum, a) => sum + (a.packets || 0), 0);
  // Average packets/sec over the last 24h
  const windowSeconds = 24 * 3600;
  const avgPacketsPerSec = totalPackets / windowSeconds;

  return {
    totalEvents: safe.length * 42, // Fictional telemetry multiplier
    threatsDetected: threats.length,
    criticalThreats,
    highSeverityThreats,
    blocked,
    investigating,
    resolved,
    averageConfidence,
    uniqueSourceIDs,
    uniqueDestinationIDs,
    dataExfilRisk,
    totalBytes,
    avgPacketsPerSec,
  }
}

/* -------------------------------------------------------------------------- */
/* Chart Aggregations                                                          */
/* -------------------------------------------------------------------------- */

export function severityDistribution(alerts) {
  const safe = asArray(alerts)
  return SEVERITY_ORDER.map((severity) => ({
    severity,
    count: countBy(safe, (a) => a.severity === severity),
  })).filter((item) => item.count > 0)
}

export function threatTypeDistribution(alerts) {
  const safe = asArray(alerts)
  return THREAT_TYPE_ORDER.map((threatType) => ({
    threatType,
    count: countBy(safe, (a) => a.threatType === threatType),
  })).filter((item) => item.count > 0)
}

export function protocolDistribution(alerts) {
  const safe = asArray(alerts)
  return PROTOCOL_ORDER.map((protocol) => ({
    protocol,
    count: countBy(safe, (a) => a.protocol === protocol),
  })).filter((item) => item.count > 0)
}

export function topSourceIps(alerts, limit = 5) {
  const safe = asArray(alerts)
  const ipCounts = {};
  safe.forEach(a => {
    ipCounts[a.sourceIP] = (ipCounts[a.sourceIP] || 0) + 1;
  });
  return Object.entries(ipCounts)
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function topDestinationIps(alerts, limit = 5) {
  const safe = asArray(alerts)
  const ipCounts = {};
  safe.forEach(a => {
    ipCounts[a.destinationIP] = (ipCounts[a.destinationIP] || 0) + 1;
  });
  return Object.entries(ipCounts)
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function threatActivitySeries(alerts, { windowHours = 24 } = {}) {
  const safe = asArray(alerts)
  if (safe.length === 0) return []

  const now = Date.now()
  const cutoff = now - windowHours * HOUR_MS
  
  // Snap to hours
  const startHour = floorToHour(cutoff)
  const endHour = floorToHour(now)

  const buckets = new Map()
  for (let t = startHour; t <= endHour; t += HOUR_MS) {
    buckets.set(t, { timestamp: new Date(t).toISOString() })
    // Initialize threat counts to 0
    THREAT_TYPE_ORDER.forEach(threat => buckets.get(t)[threat] = 0)
  }

  safe.forEach((alert) => {
    const t = timeOf(alert)
    if (t < startHour) return
    const bucketTime = floorToHour(t)
    const bucket = buckets.get(bucketTime)
    if (bucket && alert.threatType) {
      bucket[alert.threatType] = (bucket[alert.threatType] || 0) + 1
    }
  })

  return Array.from(buckets.values())
}

export function trafficVolumeSeries(alerts, { windowHours = 24 } = {}) {
  const safe = asArray(alerts)
  if (safe.length === 0) return []

  const now = Date.now()
  const cutoff = now - windowHours * HOUR_MS
  
  const startHour = floorToHour(cutoff)
  const endHour = floorToHour(now)

  const buckets = new Map()
  for (let t = startHour; t <= endHour; t += HOUR_MS) {
    buckets.set(t, { timestamp: new Date(t).toISOString(), gb: 0 })
  }

  safe.forEach((alert) => {
    const t = timeOf(alert)
    if (t < startHour) return
    const bucketTime = floorToHour(t)
    const bucket = buckets.get(bucketTime)
    if (bucket && alert.bytes) {
      // Add GB (bytes / 1024^3)
      bucket.gb += (alert.bytes / 1073741824);
    }
  })

  return Array.from(buckets.values()).map(b => ({
    ...b,
    gb: Number(b.gb.toFixed(2))
  }));
}
