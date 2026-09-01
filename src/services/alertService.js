/**
 * ============================================================================
 * ALERT SERVICE — the single boundary between the UI and its data source
 * ============================================================================
 *
 * Every component reads alerts through this module. Nothing else in `src/`
 * imports `data/fakeAlerts.js`.
 *
 * VERSION 1 (now):        UI → alertService → synthetic dataset
 * VERSION 2 (later):      UI → alertService → REST API / WebSocket
 *
 * To switch to a real backend, replace the body of `getAlerts()` with a fetch
 * and implement `subscribeToAlerts()` with a WebSocket. The exported function
 * signatures — and therefore every component — stay exactly as they are.
 *
 *   export async function getAlerts() {
 *     const response = await fetch(`${API_BASE}/alerts`)
 *     if (!response.ok) throw new Error(`Alert feed returned ${response.status}`)
 *     return (await response.json()).map(normalizeAlert)
 *   }
 *
 * `normalizeAlert()` below already coerces a raw record into the shape the
 * dashboard renders, so a backend whose field names differ only needs its
 * mapping added there.
 * ============================================================================
 */

import { APP_CONFIG, SUBSYSTEMS } from '../config/appConfig.js'
import { generateAlerts } from '../data/fakeAlerts.js'
import {
  EVIDENCE_STATUS,
  SEVERITY,
  SEVERITY_ORDER,
  STATUS,
  STATUS_ORDER,
  THREAT_TYPE,
  THREAT_TYPE_ORDER,
} from '../constants/threatModel.js'

/** Simulated fetch latency, so loading states are exercised during the demo. */
const SIMULATED_LATENCY_MS = 260

const isOneOf = (value, allowed, fallback) =>
  allowed.includes(value) ? value : fallback

/**
 * Coerces one raw record into the normalized alert model.
 *
 * Defensive by design: a real feed will eventually deliver partial or unknown
 * values, and the dashboard must render rather than crash. This is the only
 * place that needs editing when the backend's field names differ.
 */
export function normalizeAlert(raw, index = 0) {
  const record = raw ?? {}
  const timestamp =
    typeof record.timestamp === 'string' && !Number.isNaN(Date.parse(record.timestamp))
      ? record.timestamp
      : null

  const confidence = Number(record.confidence)

  return {
    id: record.id ?? `INC-UNKNOWN-${index}`,
    timestamp,
    source: record.source || 'Unknown source',
    threatType: isOneOf(record.threatType, THREAT_TYPE_ORDER, THREAT_TYPE.OTHER),
    severity: isOneOf(record.severity, SEVERITY_ORDER, SEVERITY.LOW),
    confidence: Number.isFinite(confidence)
      ? Math.min(100, Math.max(0, confidence))
      : null,
    status: isOneOf(record.status, STATUS_ORDER, STATUS.PENDING),
    description: record.description || '',
    indicators: Array.isArray(record.indicators) ? record.indicators.filter(Boolean) : [],
    recommendedAction: Array.isArray(record.recommendedAction)
      ? record.recommendedAction.filter(Boolean)
      : [],

    channel: record.channel ?? null,
    targetAsset: record.targetAsset ?? null,
    detector: record.detector ?? null,
    observable: record.observable ?? null,
    correlatedEvents: Number.isFinite(Number(record.correlatedEvents))
      ? Number(record.correlatedEvents)
      : 1,

    evidence: {
      status: isOneOf(
        record.evidence?.status,
        Object.values(EVIDENCE_STATUS),
        EVIDENCE_STATUS.PENDING,
      ),
      hash: record.evidence?.hash ?? null,
      hashAlgorithm: record.evidence?.hashAlgorithm ?? 'SHA-256 (placeholder)',
      // Pinned in version 1: there is no chain integration to report on.
      blockchain: EVIDENCE_STATUS.NOT_CONNECTED,
      verification: record.evidence?.verification ?? 'Pending',
    },
  }
}

/**
 * The version-1 dataset is generated once per page load and cached, so repeated
 * reads are stable and the charts do not change under the presenter.
 */
let cachedAlerts = null

function loadSyntheticAlerts() {
  if (!cachedAlerts) {
    cachedAlerts = generateAlerts().map(normalizeAlert)
  }
  return cachedAlerts
}

/**
 * Fetches the alert feed.
 *
 * @returns {Promise<Array<object>>} normalized alerts, newest first
 */
export async function getAlerts() {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS))
  return loadSyntheticAlerts()
}

/**
 * Fetches a single alert by incident ID.
 *
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getAlertById(id) {
  const alerts = await getAlerts()
  return alerts.find((alert) => alert.id === id) ?? null
}

/**
 * Reports which parts of the pipeline are real and which are placeholders.
 * In version 1 every entry is a placeholder — see `config/appConfig.js`.
 *
 * @returns {Promise<{mode: string, subsystems: Array<object>}>}
 */
export async function getSystemStatus() {
  return { mode: APP_CONFIG.dataMode, subsystems: SUBSYSTEMS }
}

/**
 * Real-time subscription seam.
 *
 * Version 1 deliberately does not open a WebSocket and does not fake pushed
 * events. The function exists so the component contract is already correct:
 * `useAlerts` calls it and unsubscribes on unmount, so wiring a real socket
 * later is a change to this function only.
 *
 * @param {(alert: object) => void} _onAlert
 * @returns {() => void} unsubscribe
 */
// eslint-disable-next-line no-unused-vars
export function subscribeToAlerts(_onAlert) {
  // VERSION 2:
  //   const socket = new WebSocket(`${WS_BASE}/alerts`)
  //   socket.onmessage = (event) => _onAlert(normalizeAlert(JSON.parse(event.data)))
  //   return () => socket.close()
  return () => {}
}
