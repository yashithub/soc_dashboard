/**
 * The normalized alert vocabulary.
 *
 * This is the contract the dashboard is written against. When the real backend
 * arrives it should emit these same string values (or be mapped onto them in
 * `services/alertService.js`), and no component needs to change.
 *
 * Normalized alert shape:
 * {
 *   id, timestamp, source, threatType, severity, confidence, status,
 *   description, indicators[], recommendedAction[],
 *   channel, targetAsset, detector, correlatedEvents, evidence{}
 * }
 */

export const SEVERITY = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
}

/** Ordered strongest → weakest. Drives sorting and chart segment order. */
export const SEVERITY_ORDER = [
  SEVERITY.CRITICAL,
  SEVERITY.HIGH,
  SEVERITY.MEDIUM,
  SEVERITY.LOW,
]

export const SEVERITY_RANK = Object.fromEntries(
  SEVERITY_ORDER.map((level, index) => [level, SEVERITY_ORDER.length - index]),
)

export const THREAT_TYPE = {
  PHISHING: 'Phishing',
  MALWARE: 'Malware',
  SPAM: 'Spam',
  CREDENTIAL_ATTACK: 'Credential Attack',
  SUSPICIOUS_LINK: 'Suspicious Link',
  OTHER: 'Other',
}

export const THREAT_TYPE_ORDER = [
  THREAT_TYPE.PHISHING,
  THREAT_TYPE.MALWARE,
  THREAT_TYPE.SPAM,
  THREAT_TYPE.CREDENTIAL_ATTACK,
  THREAT_TYPE.SUSPICIOUS_LINK,
  THREAT_TYPE.OTHER,
]

export const STATUS = {
  INVESTIGATING: 'Investigating',
  BLOCKED: 'Blocked',
  RESOLVED: 'Resolved',
  PENDING: 'Pending',
}

export const STATUS_ORDER = [
  STATUS.INVESTIGATING,
  STATUS.BLOCKED,
  STATUS.RESOLVED,
  STATUS.PENDING,
]

/** Detection channel — where the event was observed. */
export const CHANNEL = {
  EMAIL: 'Email',
  ENDPOINT: 'Endpoint',
  IDENTITY: 'Identity',
  NETWORK: 'Network',
}

/** Evidence-integrity workflow states. Version 1 never reaches 'Anchored'. */
export const EVIDENCE_STATUS = {
  PENDING: 'Pending',
  RECORDED: 'Recorded',
  NOT_CONNECTED: 'Not Connected',
}

export const ALL = 'All'

/** Filter option lists, reused by the filter bar so nothing drifts. */
export const FILTER_OPTIONS = {
  severity: [ALL, ...SEVERITY_ORDER],
  threatType: [ALL, ...THREAT_TYPE_ORDER],
  status: [ALL, ...STATUS_ORDER],
}

export const EMPTY_FILTERS = {
  search: '',
  severity: ALL,
  threatType: ALL,
  status: ALL,
}
