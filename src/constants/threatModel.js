/**
 * The normalized alert vocabulary.
 *
 * This is the contract the dashboard is written against. When the real backend
 * arrives it should emit these same string values (or be mapped onto them in
 * `services/alertService.js`), and no component needs to change.
 *
 * Normalized alert shape:
 * {
 *   id, timestamp, sourceIP, destinationIP, sourcePort, destinationPort,
 *   protocol, bytes, packets, duration, direction, threatType, severity,
 *   confidence, riskScore, status, description, supportingEvidence[], recommendedAction[]
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
  DDOS: 'Volumetric / Protocol DDoS',
  C2_BEACONING: 'Botnet C2 Beaconing',
  DGA_DNS_TUNNELLING: 'DGA Domains / DNS Tunnelling',
  TLS_QUIC_MALWARE: 'Malware inside Encrypted TLS/QUIC Sessions',
  RECON_PORT_SCAN: 'Reconnaissance / Port Scanning',
  DATA_EXFILTRATION: 'Data Exfiltration',
}

export const THREAT_TYPE_ORDER = [
  THREAT_TYPE.DDOS,
  THREAT_TYPE.C2_BEACONING,
  THREAT_TYPE.DGA_DNS_TUNNELLING,
  THREAT_TYPE.TLS_QUIC_MALWARE,
  THREAT_TYPE.RECON_PORT_SCAN,
  THREAT_TYPE.DATA_EXFILTRATION,
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
  NETWORK: 'Network',
}

export const PROTOCOL = {
  TCP: 'TCP',
  UDP: 'UDP',
  QUIC: 'QUIC',
  ICMP: 'ICMP',
}

export const PROTOCOL_ORDER = [
  PROTOCOL.TCP,
  PROTOCOL.UDP,
  PROTOCOL.QUIC,
  PROTOCOL.ICMP,
]

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
  protocol: [ALL, ...PROTOCOL_ORDER],
}

export const EMPTY_FILTERS = {
  search: '',
  severity: ALL,
  threatType: ALL,
  status: ALL,
  protocol: ALL,
}
