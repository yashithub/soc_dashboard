/**
 * Single place to change product identity and version-1 behaviour.
 * Nothing in the UI hardcodes the product name.
 */
export const APP_CONFIG = {
  name: 'CyberShield SOC',
  subtitle: 'AI-Based Network Threat Detection',
  shortName: 'CyberShield',
  version: 'V1 • Synthetic Dataset',

  /**
   * Currently the dashboard is fed by a synthetic dataset. When the backend
   * lands, flip this to 'live' — the UI reads it to label every simulated
   * surface honestly instead of pretending a service is running.
   */
  dataMode: 'synthetic', // 'synthetic' | 'live'

  /** Placeholder analyst identity. Replaced by real auth in a later version. */
  analyst: {
    name: 'A. Sharma',
    role: 'Tier 2 Analyst',
    shift: 'Shift B',
  },

  /** Rolling window the synthetic dataset spans, in hours. */
  windowHours: 24,

  /** Number of correlated alerts to generate. Spec floor is 200. */
  alertCount: 500,

  /** Rows per page in the alerts table. */
  pageSize: 12,
}

/**
 * VERSION 1 subsystem states.
 *
 * These are UI placeholders, not health checks. `state` is intentionally one of
 * 'simulated' | 'mock' | 'local' | 'not-connected' — never 'operational' —
 * because no service is actually running behind any of them.
 */
export const SUBSYSTEMS = [
  {
    id: 'network-telemetry',
    label: 'Network Telemetry',
    value: 'Simulated',
    state: 'simulated',
    note: 'Network flows are synthetic.',
  },
  {
    id: 'ml-engine',
    label: 'ML Detection Engine',
    value: 'Simulated',
    state: 'simulated',
    note: 'Classifications and confidence scores are pre-generated, not inferred.',
  },
  {
    id: 'api',
    label: 'API',
    value: 'Mock',
    state: 'mock',
    note: 'Served by the in-app alert service. No network calls are made.',
  },
  {
    id: 'database',
    label: 'Database',
    value: 'Local Dataset',
    state: 'local',
    note: 'In-memory synthetic dataset generated at page load.',
  },
  {
    id: 'evidence',
    label: 'Evidence Storage',
    value: 'Simulated',
    state: 'simulated',
    note: 'Evidence hashes are placeholder strings; nothing is persisted.',
  },
  {
    id: 'blockchain',
    label: 'Blockchain',
    value: 'Not Connected',
    state: 'not-connected',
    note: 'Reserved for future evidence-integrity anchoring. No chain, no transactions.',
  },
]
