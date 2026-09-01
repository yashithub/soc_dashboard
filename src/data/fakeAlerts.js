/**
 * ============================================================================
 * SYNTHETIC DATASET — VERSION 1 ONLY
 * ============================================================================
 * Everything in this file is fabricated demo data. No real network flows, hosts,
 * or detections are represented. It exists so the dashboard has
 * something realistic to render before the ML/backend pipeline exists.
 *
 * Nothing outside `services/alertService.js` should import this module. When
 * the real API lands, the service swaps its source and this file can be deleted.
 * ============================================================================
 */

import { APP_CONFIG } from '../config/appConfig.js'
import {
  CHANNEL,
  EVIDENCE_STATUS,
  PROTOCOL,
  SEVERITY,
  STATUS,
  THREAT_TYPE,
} from '../constants/threatModel.js'
import { HOUR_MS, floorToHour } from '../utils/time.js'
import { calculateRiskScore } from '../utils/riskScore.js'

/* -------------------------------------------------------------------------- */
/* Deterministic randomness                                                    */
/* -------------------------------------------------------------------------- */

function createRandom(seed) {
  let state = seed >>> 0
  return function next() {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const random = createRandom(0x7a3f)

const pick = (list) => list[Math.floor(random() * list.length)]

const randomInt = (min, max) => min + Math.floor(random() * (max - min + 1))

const randomFloat = (min, max) => min + random() * (max - min)

function weightedPick(weights) {
  const entries = Object.entries(weights)
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = random() * total
  for (const [value, weight] of entries) {
    roll -= weight
    if (roll <= 0) return value
  }
  return entries[entries.length - 1][0]
}

/* -------------------------------------------------------------------------- */
/* Fictional IP addresses                                                      */
/* -------------------------------------------------------------------------- */

const generateInternalIP = () => {
  const subnet = pick(['10.23.', '172.16.8.', '192.168.100.'])
  return `${subnet}${randomInt(2, 254)}`
}

const generateExternalIP = () => {
  return `${randomInt(8, 200)}.${randomInt(1, 254)}.${randomInt(1, 254)}.${randomInt(1, 254)}`
}

/* -------------------------------------------------------------------------- */
/* Data Generation Logic                                                       */
/* -------------------------------------------------------------------------- */

const THREAT_WEIGHTS = {
  [THREAT_TYPE.DDOS]: 15,
  [THREAT_TYPE.C2_BEACONING]: 25,
  [THREAT_TYPE.DGA_DNS_TUNNELLING]: 20,
  [THREAT_TYPE.TLS_QUIC_MALWARE]: 15,
  [THREAT_TYPE.RECON_PORT_SCAN]: 20,
  [THREAT_TYPE.DATA_EXFILTRATION]: 5,
}

function generateThreatSpecificData(threatType) {
  switch (threatType) {
    case THREAT_TYPE.DDOS:
      return {
        protocol: weightedPick({ [PROTOCOL.UDP]: 60, [PROTOCOL.TCP]: 30, [PROTOCOL.ICMP]: 10 }),
        sourcePort: randomInt(1024, 65535),
        destinationPort: pick([80, 443, 53, 123]),
        bytes: randomInt(5000000, 50000000), // Very high volume
        packets: randomInt(10000, 100000),
        duration: randomFloat(5, 60),
        direction: 'Inbound',
        description: 'Abnormally high volume of inbound traffic directed at a single destination port, consistent with a volumetric DDoS attack.',
        supportingEvidence: ['Traffic volume exceeds 99th percentile', 'High packets-per-second rate', 'Multiple distributed source IPs'],
        recommendedAction: 'Apply rate limiting on the edge firewall and analyze traffic composition to deploy protocol-specific filters.'
      }
    case THREAT_TYPE.C2_BEACONING:
      return {
        protocol: PROTOCOL.TCP,
        sourcePort: randomInt(49152, 65535),
        destinationPort: pick([80, 443, 8080]),
        bytes: randomInt(1000, 15000), // Low volume
        packets: randomInt(10, 150),
        duration: randomFloat(1, 30),
        direction: 'Outbound',
        description: 'Periodic outbound connections to the same external destination at regular intervals, strongly indicating Command-and-Control beaconing.',
        supportingEvidence: ['Periodic connection interval (jitter < 5%)', 'Repeated destination IP over 24h', 'Low-volume outbound traffic payload'],
        recommendedAction: 'Isolate the internal host, block the destination IP at the perimeter, and initiate endpoint forensic investigation.'
      }
    case THREAT_TYPE.DGA_DNS_TUNNELLING:
      return {
        protocol: PROTOCOL.UDP,
        sourcePort: randomInt(49152, 65535),
        destinationPort: 53, // DNS
        bytes: randomInt(5000, 50000), // Elevated for DNS
        packets: randomInt(50, 500),
        duration: randomFloat(10, 120),
        direction: 'Outbound',
        description: 'High volume of DNS queries with abnormal payloads or high-entropy domains, indicating possible DNS tunnelling or DGA activity.',
        supportingEvidence: ['High domain name entropy', 'Unusually large DNS query length', 'Abnormal query frequency to specific resolver'],
        recommendedAction: 'Block the queried domains and investigate the originating internal host for malware infection.'
      }
    case THREAT_TYPE.TLS_QUIC_MALWARE:
      return {
        protocol: weightedPick({ [PROTOCOL.TCP]: 70, [PROTOCOL.QUIC]: 30 }),
        sourcePort: randomInt(49152, 65535),
        destinationPort: 443,
        bytes: randomInt(20000, 200000),
        packets: randomInt(100, 1000),
        duration: randomFloat(30, 300),
        direction: 'Outbound',
        description: 'Encrypted traffic exhibiting metadata patterns (e.g., JA3/JA4 fingerprints, byte distributions) associated with known malware families.',
        supportingEvidence: ['Suspicious TLS handshake metadata (JA3 hash match)', 'Unusual byte distribution for standard HTTPS', 'Self-signed or anomalous certificate characteristics'],
        recommendedAction: 'Block the destination IP and perform endpoint analysis. Consider deploying SSL/TLS decryption for the specific host if policy permits.'
      }
    case THREAT_TYPE.RECON_PORT_SCAN:
      return {
        protocol: PROTOCOL.TCP,
        sourcePort: randomInt(1024, 65535),
        destinationPort: randomInt(1, 1024), // Sequential or random
        bytes: randomInt(500, 5000),
        packets: randomInt(10, 50),
        duration: randomFloat(0.1, 5),
        direction: 'Inbound',
        description: 'Rapid sequential or distributed probing of multiple destination ports on a single host or multiple hosts.',
        supportingEvidence: ['High rate of connection attempts to closed ports', 'Multiple destination ports probed within short time window', 'Short-lived connections (mostly SYN packets)'],
        recommendedAction: 'Block the source IP at the external firewall and monitor for subsequent targeted attacks.'
      }
    case THREAT_TYPE.DATA_EXFILTRATION:
      return {
        protocol: PROTOCOL.TCP,
        sourcePort: randomInt(49152, 65535),
        destinationPort: pick([443, 22, 21]),
        bytes: randomInt(500000000, 5000000000), // Huge volume
        packets: randomInt(500000, 5000000),
        duration: randomFloat(600, 3600),
        direction: 'Outbound',
        description: 'Unusually massive outbound data transfer to an external destination, indicating potential data theft or exfiltration.',
        supportingEvidence: ['Sustained outbound transfer far exceeding baseline', 'Abnormal destination IP for this internal host', 'High outbound-to-inbound byte ratio'],
        recommendedAction: 'Immediately terminate the network flow, isolate the source host, and initiate an incident response protocol for data breach.'
      }
    default:
      return {
        protocol: PROTOCOL.TCP,
        sourcePort: 443,
        destinationPort: 443,
        bytes: 100,
        packets: 1,
        duration: 0.1,
        direction: 'Outbound',
        description: 'Unknown anomaly detected.',
        supportingEvidence: [],
        recommendedAction: 'Investigate.'
      }
  }
}

function generateAlert(index) {
  const threatType = weightedPick(THREAT_WEIGHTS)
  const isOutbound = ['Botnet C2 Beaconing', 'DGA Domains / DNS Tunnelling', 'Malware inside Encrypted TLS/QUIC Sessions', 'Data Exfiltration'].includes(threatType)
  
  const sourceIP = isOutbound ? generateInternalIP() : generateExternalIP()
  const destinationIP = isOutbound ? generateExternalIP() : generateInternalIP()
  
  const threatData = generateThreatSpecificData(threatType)

  // Severity and Confidence
  let severity, confidence
  if (threatType === THREAT_TYPE.DATA_EXFILTRATION || threatType === THREAT_TYPE.DDOS) {
    severity = weightedPick({ [SEVERITY.CRITICAL]: 60, [SEVERITY.HIGH]: 40 })
    confidence = randomFloat(90, 99.9)
  } else if (threatType === THREAT_TYPE.C2_BEACONING) {
    severity = weightedPick({ [SEVERITY.HIGH]: 70, [SEVERITY.MEDIUM]: 30 })
    confidence = randomFloat(85, 98)
  } else if (threatType === THREAT_TYPE.TLS_QUIC_MALWARE) {
    severity = weightedPick({ [SEVERITY.HIGH]: 50, [SEVERITY.MEDIUM]: 50 })
    confidence = randomFloat(80, 95)
  } else if (threatType === THREAT_TYPE.DGA_DNS_TUNNELLING) {
    severity = weightedPick({ [SEVERITY.MEDIUM]: 80, [SEVERITY.HIGH]: 20 })
    confidence = randomFloat(75, 92)
  } else {
    // Port Scan
    severity = weightedPick({ [SEVERITY.LOW]: 60, [SEVERITY.MEDIUM]: 40 })
    confidence = randomFloat(70, 85)
  }

  // Age (distribute over the window, heavy towards recent)
  const windowMs = APP_CONFIG.windowHours * HOUR_MS
  const ageFactor = Math.pow(random(), 1.5) // Skew towards 0 (recent)
  const ageMs = ageFactor * windowMs
  const timestamp = new Date(Date.now() - ageMs).toISOString()

  // Status mapping based on severity and age
  let status = STATUS.INVESTIGATING
  if (ageMs > 12 * HOUR_MS) {
    if (severity === SEVERITY.LOW || severity === SEVERITY.MEDIUM) status = STATUS.RESOLVED
    else status = pick([STATUS.BLOCKED, STATUS.RESOLVED])
  } else if (ageMs > 4 * HOUR_MS) {
    status = weightedPick({ [STATUS.INVESTIGATING]: 40, [STATUS.BLOCKED]: 40, [STATUS.RESOLVED]: 20 })
  } else {
    if (severity === SEVERITY.CRITICAL) status = weightedPick({ [STATUS.INVESTIGATING]: 60, [STATUS.BLOCKED]: 40 })
    else status = weightedPick({ [STATUS.INVESTIGATING]: 80, [STATUS.PENDING]: 20 })
  }

  const riskScore = calculateRiskScore(severity, confidence, threatType, threatData.bytes)

  return {
    id: `FLOW-${10000 + index}`,
    timestamp,
    sourceIP,
    destinationIP,
    sourcePort: threatData.sourcePort,
    destinationPort: threatData.destinationPort,
    protocol: threatData.protocol,
    bytes: threatData.bytes,
    packets: threatData.packets,
    duration: threatData.duration.toFixed(2),
    direction: threatData.direction,
    threatType,
    severity,
    confidence: Number(confidence.toFixed(1)),
    riskScore: riskScore,
    status,
    description: threatData.description,
    supportingEvidence: threatData.supportingEvidence,
    recommendedAction: threatData.recommendedAction,
    channel: CHANNEL.NETWORK,
    evidenceStatus: EVIDENCE_STATUS.NOT_CONNECTED,
    evidenceHash: `0x${Array.from({length: 32}, () => Math.floor(random()*16).toString(16)).join('')}`
  }
}

export function generateDataset(count) {
  const dataset = []
  for (let i = 0; i < count; i++) {
    dataset.push(generateAlert(i))
  }
  return dataset.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// Generate the static dataset immediately.
export const RAW_ALERTS = generateDataset(APP_CONFIG.alertCount)
