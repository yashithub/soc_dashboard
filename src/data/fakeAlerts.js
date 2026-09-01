/**
 * ============================================================================
 * SYNTHETIC DATASET — VERSION 1 ONLY
 * ============================================================================
 * Everything in this file is fabricated demo data. No real emails, hosts,
 * domains, users or detections are represented. It exists so the dashboard has
 * something realistic to render before the ML/backend pipeline exists.
 *
 * Nothing outside `services/alertService.js` should import this module. When
 * the real API lands, the service swaps its source and this file can be deleted.
 *
 * Design notes:
 *  - Deterministic PRNG, so the dataset is stable for the length of a demo and
 *    reloads do not reshuffle the charts mid-presentation.
 *  - Distributions are correlated, not uniform: threat type drives severity,
 *    severity drives confidence, and severity + age drive workflow status.
 *  - Indicators, descriptions and recommended actions are drawn from
 *    per-threat-type pools so an incident always reads coherently.
 * ============================================================================
 */

import { APP_CONFIG } from '../config/appConfig.js'
import {
  CHANNEL,
  EVIDENCE_STATUS,
  SEVERITY,
  STATUS,
  THREAT_TYPE,
} from '../constants/threatModel.js'
import { HOUR_MS, floorToHour } from '../utils/time.js'

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

const random = createRandom(0x5ec0)

const pick = (list) => list[Math.floor(random() * list.length)]

const randomInt = (min, max) => min + Math.floor(random() * (max - min + 1))

const randomFloat = (min, max) => min + random() * (max - min)

/** Weighted choice from `{ value: weight }`. */
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

/** Sample `count` distinct items, preserving the source ordering. */
function sampleDistinct(list, count) {
  const wanted = Math.min(count, list.length)
  const chosen = new Set()
  let guard = 0
  while (chosen.size < wanted && guard < list.length * 8) {
    chosen.add(Math.floor(random() * list.length))
    guard += 1
  }
  return [...chosen].sort((a, b) => a - b).map((index) => list[index])
}

/* -------------------------------------------------------------------------- */
/* Fictional org vocabulary                                                    */
/* -------------------------------------------------------------------------- */

const INTERNAL_DOMAIN = 'northwind-labs.example'

const STAFF = [
  'j.mercer',
  'p.raghavan',
  'l.okonkwo',
  'd.fischer',
  's.almeida',
  'k.tanaka',
  'r.villanueva',
  'm.oduya',
  'a.kowalski',
  'n.bergstrom',
  'h.castillo',
  't.mahoney',
  'c.deshmukh',
  'e.novak',
  'f.aldrich',
  'payroll',
  'accounts.payable',
  'it.helpdesk',
]

const SPOOFED_SENDERS = [
  'no-reply@microsofc-online.example',
  'security@0ffice-alerts.example',
  'admin@northwind-labs-hr.example',
  'billing@docusign-review.example',
  'support@okta-verify-portal.example',
  'notifications@sharepoint-docs.example',
  'hr@northwind-payroll.example',
  'alerts@dhl-shipment-track.example',
  'ceo.office@northwlnd-labs.example',
  'vendor@invoices-secure.example',
]

const BULK_SENDERS = [
  'deals@promo-blastnet.example',
  'newsletter@marketwire-daily.example',
  'offers@cheap-vpn-now.example',
  'winner@prize-claimcenter.example',
  'sales@bulk-leadgen.example',
  'updates@crypto-signals.example',
]

const HOSTS = [
  'WKS-4471',
  'WKS-1092',
  'WKS-3318',
  'LAP-2205',
  'LAP-7734',
  'SRV-APP-02',
  'SRV-FILE-01',
  'SRV-DB-03',
  'VDI-0148',
  'VDI-0362',
]

const SUBNETS = ['10.42', '10.17', '172.20', '192.168']

const MALICIOUS_DOMAINS = [
  'cdn-update-delivery.example',
  'secure-doc-view.example',
  'account-verify-now.example',
  'files-dropzone.example',
  'login-portal-auth.example',
]

const ATTACHMENTS = [
  'Invoice_4471.xlsm',
  'Statement_Q3.docm',
  'Shipping_Label.pdf.exe',
  'Payroll_Update.zip',
  'Scan_20260901.iso',
  'Contract_Draft.lnk',
]

const emailFor = (localPart) => `${localPart}@${INTERNAL_DOMAIN}`
const randomIp = () => `${pick(SUBNETS)}.${randomInt(1, 254)}.${randomInt(2, 253)}`

/* -------------------------------------------------------------------------- */
/* Per-threat-type profiles                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Each profile controls how a threat type behaves: how often it occurs, how
 * severe it tends to be, where it is observed, and which indicators, wording
 * and remediation steps are plausible for it.
 */
const THREAT_PROFILES = {
  [THREAT_TYPE.PHISHING]: {
    weight: 30,
    severityWeights: { Critical: 20, High: 36, Medium: 32, Low: 12 },
    channelWeights: { Email: 100 },
    indicators: [
      'Spoofed sender address',
      'Suspicious URL',
      'Urgency language',
      'Credential harvesting pattern',
      'Display-name impersonation',
      'Newly registered domain',
      'Reply-to mismatch',
      'Failed DMARC alignment',
    ],
    requiredIndicators: ['Spoofed sender address', 'Suspicious URL'],
    actions: [
      'Quarantine the message across all recipient mailboxes',
      'Block sender address and originating domain at the gateway',
      'Detonate the linked URL in the sandbox before release',
      'Notify targeted recipients and force credential reset if clicked',
    ],
    describe: () =>
      pick([
        'Credential-harvesting email impersonating an internal service. The message pressures the recipient to re-authenticate through an external look-alike portal.',
        'Targeted phishing attempt using display-name impersonation of a senior employee, requesting an urgent out-of-band action.',
        'Phishing message carrying a shortened link that redirects to a cloned single sign-on page hosted on a newly registered domain.',
      ]),
  },

  [THREAT_TYPE.MALWARE]: {
    weight: 15,
    severityWeights: { Critical: 34, High: 40, Medium: 20, Low: 6 },
    channelWeights: { Endpoint: 62, Email: 38 },
    indicators: [
      'Malicious attachment',
      'Suspicious executable',
      'Abnormal process behaviour',
      'Macro-enabled document',
      'Known malicious domain',
      'Outbound beaconing',
      'Persistence key written',
      'Obfuscated script payload',
    ],
    requiredIndicators: ['Malicious attachment', 'Suspicious executable'],
    actions: [
      'Isolate the affected endpoint from the network',
      'Quarantine the attachment and terminate the spawned process',
      'Collect a forensic image of the host before remediation',
      'Sweep the estate for the same file hash',
    ],
    describe: () =>
      pick([
        'Macro-enabled document attempted to drop and execute a second-stage payload from an external host.',
        'Endpoint agent observed an unsigned executable spawning from a temporary directory and writing a persistence key.',
        'Archived payload extracted a shortcut file that invoked a scripting host with obfuscated arguments.',
      ]),
  },

  [THREAT_TYPE.SPAM]: {
    weight: 22,
    severityWeights: { Critical: 0, High: 4, Medium: 30, Low: 66 },
    channelWeights: { Email: 100 },
    indicators: [
      'Bulk sender',
      'Promotional content',
      'Suspicious URL',
      'Unverified mailing list',
      'Low sender reputation',
      'Repeated campaign pattern',
    ],
    requiredIndicators: ['Bulk sender'],
    actions: [
      'Quarantine and release only on user request',
      'Monitor the sender reputation score',
      'Add the campaign fingerprint to the bulk filter',
    ],
    describe: () =>
      pick([
        'High-volume commercial campaign from a low-reputation sender. No malicious payload identified.',
        'Bulk promotional mail matching a known campaign fingerprint, delivered to multiple mailboxes.',
        'Unsolicited mailing-list traffic from an unverified sender with poor authentication posture.',
      ]),
  },

  [THREAT_TYPE.CREDENTIAL_ATTACK]: {
    weight: 13,
    severityWeights: { Critical: 32, High: 43, Medium: 20, Low: 5 },
    channelWeights: { Identity: 70, Email: 30 },
    indicators: [
      'Credential harvesting pattern',
      'Abnormal sender behaviour',
      'Impossible travel',
      'Repeated failed authentication',
      'MFA fatigue prompts',
      'Password spray pattern',
      'Legacy authentication protocol',
    ],
    requiredIndicators: ['Repeated failed authentication'],
    actions: [
      'Force password reset and revoke active sessions',
      'Enforce step-up MFA for the affected identity',
      'Block the originating address range at the identity provider',
      'Review sign-in logs for successful authentications from the same source',
    ],
    describe: () =>
      pick([
        'Password-spray pattern against multiple accounts from a single address range, with a small number of successful authentications.',
        'Repeated MFA prompts issued to a single identity within a short window, consistent with push-fatigue abuse.',
        'Sign-in accepted from a geography inconsistent with the previous session, indicating possible credential compromise.',
      ]),
  },

  [THREAT_TYPE.SUSPICIOUS_LINK]: {
    weight: 13,
    severityWeights: { Critical: 8, High: 28, Medium: 45, Low: 19 },
    channelWeights: { Email: 64, Network: 36 },
    indicators: [
      'Suspicious URL',
      'Newly registered domain',
      'URL shortener chain',
      'Known malicious domain',
      'Redirect to credential page',
      'Domain age under 7 days',
    ],
    requiredIndicators: ['Suspicious URL'],
    actions: [
      'Rewrite or strip the URL and re-scan on click',
      'Submit the domain for reputation review',
      'Block the destination at the web proxy pending analysis',
    ],
    describe: () =>
      pick([
        'Message contained a redirect chain terminating on a domain registered within the last week.',
        'Outbound request to a low-reputation destination that matches a known redirector pattern.',
        'Embedded link routed through multiple shorteners before resolving to an unclassified host.',
      ]),
  },

  [THREAT_TYPE.OTHER]: {
    weight: 7,
    severityWeights: { Critical: 5, High: 20, Medium: 40, Low: 35 },
    channelWeights: { Network: 40, Endpoint: 32, Identity: 28 },
    indicators: [
      'Policy violation',
      'Abnormal sender behaviour',
      'Unusual data transfer volume',
      'Unclassified anomaly',
      'Off-hours activity',
      'Unapproved application',
    ],
    requiredIndicators: [],
    actions: [
      'Triage against the asset owner and confirm business justification',
      'Raise a policy exception or revoke the activity',
      'Continue monitoring for recurrence',
    ],
    describe: () =>
      pick([
        'Anomalous activity that did not match an existing detection signature and was escalated for analyst review.',
        'Data-transfer volume outside the established baseline for this asset during off-hours.',
        'Use of an unapproved application observed on a managed endpoint, flagged as a policy violation.',
      ]),
  },
}

/** Confidence bands, tightest and highest for the most severe detections. */
const CONFIDENCE_BAND = {
  [SEVERITY.CRITICAL]: [92, 99.4],
  [SEVERITY.HIGH]: [83.5, 96.5],
  [SEVERITY.MEDIUM]: [70, 90],
  [SEVERITY.LOW]: [55, 81],
}

/** Detection model labels. Cosmetic only — no model exists in version 1. */
const DETECTORS = {
  [THREAT_TYPE.PHISHING]: 'phish-classifier',
  [THREAT_TYPE.MALWARE]: 'payload-analyzer',
  [THREAT_TYPE.SPAM]: 'bulk-filter',
  [THREAT_TYPE.CREDENTIAL_ATTACK]: 'identity-anomaly',
  [THREAT_TYPE.SUSPICIOUS_LINK]: 'url-reputation',
  [THREAT_TYPE.OTHER]: 'behaviour-baseline',
}

/* -------------------------------------------------------------------------- */
/* Field builders                                                              */
/* -------------------------------------------------------------------------- */

function buildSource(threatType, channel) {
  if (channel === CHANNEL.EMAIL) {
    if (threatType === THREAT_TYPE.SPAM) return pick(BULK_SENDERS)
    if (threatType === THREAT_TYPE.OTHER) return emailFor(pick(STAFF))
    return pick(SPOOFED_SENDERS)
  }
  if (channel === CHANNEL.IDENTITY) return `${pick(STAFF)}@${INTERNAL_DOMAIN} · ${randomIp()}`
  if (channel === CHANNEL.NETWORK) return randomIp()
  return pick(HOSTS)
}

function buildTargetAsset(channel) {
  if (channel === CHANNEL.EMAIL) return emailFor(pick(STAFF))
  if (channel === CHANNEL.IDENTITY) return `identity/${pick(STAFF)}`
  if (channel === CHANNEL.NETWORK) return `egress-gateway/${pick(['edge-01', 'edge-02'])}`
  return pick(HOSTS)
}

/**
 * Indicators are always coherent with the threat type: the profile's required
 * indicators are guaranteed, the rest are drawn from that type's own pool.
 */
function buildIndicators(profile, severity) {
  const extra = severity === SEVERITY.LOW ? randomInt(0, 1) : randomInt(1, 3)
  const optional = profile.indicators.filter(
    (indicator) => !profile.requiredIndicators.includes(indicator),
  )
  const guaranteed =
    profile.requiredIndicators.length > 0
      ? sampleDistinct(profile.requiredIndicators, severity === SEVERITY.LOW ? 1 : 2)
      : sampleDistinct(optional, 1)

  return [...new Set([...guaranteed, ...sampleDistinct(optional, extra)])]
}

/** More severe detections get a longer, more decisive remediation list. */
function buildRecommendedAction(profile, severity) {
  const depth = { Critical: 4, High: 3, Medium: 2, Low: 2 }[severity] ?? 2
  return profile.actions.slice(0, Math.min(depth, profile.actions.length))
}

/**
 * Workflow status is a function of severity *and* age: fresh detections are
 * still being worked, older ones have mostly landed somewhere terminal.
 */
function buildStatus(severity, hoursAgo) {
  const base = {
    [SEVERITY.CRITICAL]: { Investigating: 42, Blocked: 26, Resolved: 20, Pending: 12 },
    [SEVERITY.HIGH]: { Investigating: 32, Blocked: 30, Resolved: 26, Pending: 12 },
    [SEVERITY.MEDIUM]: { Investigating: 18, Blocked: 32, Resolved: 36, Pending: 14 },
    [SEVERITY.LOW]: { Investigating: 6, Blocked: 38, Resolved: 44, Pending: 12 },
  }[severity]

  const weights = { ...base }
  if (hoursAgo < 4) {
    weights.Investigating *= 2.4
    weights.Pending *= 2.2
    weights.Resolved *= 0.25
  } else if (hoursAgo < 12) {
    weights.Investigating *= 1.4
    weights.Resolved *= 0.6
  } else if (hoursAgo > 30) {
    weights.Resolved *= 1.9
    weights.Investigating *= 0.4
    weights.Pending *= 0.5
  }
  return weightedPick(weights)
}

/**
 * Placeholder evidence hash.
 *
 * This is a formatted random hex string, NOT a real digest of anything. It
 * reserves the shape the field will have once forensic evidence is actually
 * hashed and anchored. The UI labels it as a placeholder wherever it appears.
 */
function buildPlaceholderHash() {
  const hex = '0123456789abcdef'
  let out = ''
  for (let i = 0; i < 64; i += 1) out += hex[Math.floor(random() * 16)]
  return out
}

/**
 * Evidence-integrity state.
 *
 * 'Recorded' means the analyst has captured evidence locally in this
 * simulation. It never means a blockchain write occurred — `blockchain` is
 * pinned to 'Not Connected' for every record in version 1.
 */
function buildEvidence(status, severity) {
  const collected =
    status === STATUS.RESOLVED ||
    status === STATUS.BLOCKED ||
    (status === STATUS.INVESTIGATING && severity === SEVERITY.CRITICAL && random() < 0.6)

  return {
    status: collected ? EVIDENCE_STATUS.RECORDED : EVIDENCE_STATUS.PENDING,
    hash: buildPlaceholderHash(),
    hashAlgorithm: 'SHA-256 (placeholder)',
    blockchain: EVIDENCE_STATUS.NOT_CONNECTED,
    verification: 'Pending',
  }
}

/* -------------------------------------------------------------------------- */
/* Timeline shaping                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Relative event volume per hour-of-day, so activity charts show a working-day
 * rhythm instead of flat noise.
 */
const DIURNAL_WEIGHT = [
  0.35, 0.28, 0.24, 0.22, 0.26, 0.38, 0.62, 0.95, 1.35, 1.6, 1.7, 1.55, 1.3,
  1.45, 1.65, 1.6, 1.35, 1.05, 0.85, 0.72, 0.66, 0.6, 0.52, 0.44,
]

/**
 * Builds the per-hour event counts across the window, then adds two burst
 * windows so the timeline has the kind of incident spikes an analyst would
 * actually investigate.
 */
function buildHourlyCounts(windowHours, totalAlerts, windowEnd) {
  const weights = []
  for (let offset = windowHours - 1; offset >= 0; offset -= 1) {
    const bucketTime = windowEnd - offset * HOUR_MS
    const hourOfDay = new Date(bucketTime).getHours()
    weights.push(DIURNAL_WEIGHT[hourOfDay] * randomFloat(0.75, 1.25))
  }

  // Two campaign bursts at fixed positions in the window.
  const bursts = [Math.floor(windowHours * 0.34), Math.floor(windowHours * 0.79)]
  for (const centre of bursts) {
    for (let i = -1; i <= 1; i += 1) {
      const index = centre + i
      if (index >= 0 && index < weights.length) {
        weights[index] *= i === 0 ? 3.1 : 1.8
      }
    }
  }

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  const counts = weights.map((weight) =>
    Math.max(1, Math.round((weight / totalWeight) * totalAlerts)),
  )

  // Reconcile rounding drift against the requested total.
  let drift = totalAlerts - counts.reduce((sum, count) => sum + count, 0)
  let cursor = 0
  while (drift !== 0) {
    const index = cursor % counts.length
    if (drift > 0) {
      counts[index] += 1
      drift -= 1
    } else if (counts[index] > 1) {
      counts[index] -= 1
      drift += 1
    }
    cursor += 1
  }
  return counts
}

/* -------------------------------------------------------------------------- */
/* Generator                                                                   */
/* -------------------------------------------------------------------------- */

const THREAT_TYPE_WEIGHTS = Object.fromEntries(
  Object.entries(THREAT_PROFILES).map(([type, profile]) => [type, profile.weight]),
)

/**
 * Generates the synthetic alert set.
 *
 * @param {object} [options]
 * @param {number} [options.count]        how many alerts to produce
 * @param {number} [options.windowHours]  size of the rolling time window
 * @param {number} [options.now]          window end, in epoch ms
 * @returns {Array<object>} alerts, newest first
 */
export function generateAlerts({
  count = APP_CONFIG.alertCount,
  windowHours = APP_CONFIG.windowHours,
  now = Date.now(),
} = {}) {
  // Snap to the top of the local hour so bucketed charts have clean edges.
  const windowEnd = floorToHour(now)
  const hourlyCounts = buildHourlyCounts(windowHours, count, windowEnd)

  const alerts = []
  let sequence = 10001

  hourlyCounts.forEach((eventsThisHour, bucketIndex) => {
    const hoursAgo = windowHours - 1 - bucketIndex
    const bucketStart = windowEnd - hoursAgo * HOUR_MS

    for (let i = 0; i < eventsThisHour; i += 1) {
      const threatType = weightedPick(THREAT_TYPE_WEIGHTS)
      const profile = THREAT_PROFILES[threatType]
      const severity = weightedPick(profile.severityWeights)
      const channel = weightedPick(profile.channelWeights)

      const timestamp = new Date(bucketStart + randomInt(0, 3_599_000))
      const preciseHoursAgo = (windowEnd - timestamp.getTime()) / HOUR_MS
      const status = buildStatus(severity, preciseHoursAgo)

      const [confidenceMin, confidenceMax] = CONFIDENCE_BAND[severity]
      const confidence = Math.round(randomFloat(confidenceMin, confidenceMax) * 10) / 10

      alerts.push({
        id: `INC-${sequence++}`,
        timestamp: timestamp.toISOString(),
        source: buildSource(threatType, channel),
        threatType,
        severity,
        confidence,
        status,
        description: profile.describe(),
        indicators: buildIndicators(profile, severity),
        recommendedAction: buildRecommendedAction(profile, severity),

        // Context fields — optional for consumers, useful for the detail view.
        channel,
        targetAsset: buildTargetAsset(channel),
        detector: `${DETECTORS[threatType]} (simulated)`,
        observable:
          channel === CHANNEL.EMAIL && threatType === THREAT_TYPE.MALWARE
            ? pick(ATTACHMENTS)
            : channel === CHANNEL.EMAIL || channel === CHANNEL.NETWORK
              ? `https://${pick(MALICIOUS_DOMAINS)}/${pick(['auth', 'view', 'dl', 'r'])}/${randomInt(1000, 9999)}`
              : pick(ATTACHMENTS),
        correlatedEvents:
          severity === SEVERITY.CRITICAL || severity === SEVERITY.HIGH
            ? randomInt(6, 58)
            : randomInt(1, 22),
        evidence: buildEvidence(status, severity),
      })
    }
  })

  // Newest first — the order an analyst expects in a live queue.
  alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  return alerts
}
