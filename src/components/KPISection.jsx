import {
  Activity,
  AlertOctagon,
  Network,
  ShieldAlert,
  BrainCircuit,
  ShieldBan,
  Database,
  Users
} from 'lucide-react'
import { APP_CONFIG } from '../config/appConfig.js'
import { formatCompact, formatNumber, formatPercent } from '../utils/format.js'

/**
 * One KPI tile. `accent` tints only the icon and the value — the label and
 * context stay in text ink, so a row of multiple cards reads as one system rather
 * than competing colours.
 */
export function KPICard({ label, value, context, icon: Icon, accent = 'neutral' }) {
  const accents = {
    neutral: 'text-ink-muted',
    accent: 'text-[#8ab8f0]',
    critical: 'text-[#f08c8c]',
    ok: 'text-[#7ed08a]',
    warn: 'text-[#d3ae3a]',
  }
  const tone = accents[accent] ?? accents.neutral

  return (
    <div className="group rounded-lg border border-line bg-panel p-4 transition-colors hover:border-line-strong">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium tracking-wide text-ink-faint uppercase">
          {label}
        </p>
        <Icon size={15} className={`shrink-0 ${tone}`} aria-hidden />
      </div>

      <p className="mt-2 text-[26px] leading-none font-semibold tracking-tight text-ink">
        {value}
      </p>

      <div className="mt-2 flex items-center gap-2">
        {context && <p className="truncate text-[11px] text-ink-faint">{context}</p>}
      </div>
    </div>
  )
}

/**
 * The headline figures. Every value comes from `computeKpis`, which reads
 * the same alert list the charts and the table use.
 */
export function KPISection({ kpis, scopeLabel }) {
  const cards = [
    {
      label: 'Total Network Flows',
      value: formatCompact(kpis.totalEvents),
      context: `${formatCompact(kpis.totalBytes)} bytes ingested · ${APP_CONFIG.windowHours}h`,
      icon: Activity,
      accent: 'accent',
    },
    {
      label: 'Threats Detected',
      value: formatNumber(kpis.threatsDetected),
      context: `${scopeLabel} · ML flagged`,
      icon: ShieldAlert,
      accent: 'accent',
    },
    {
      label: 'Critical Threats',
      value: formatNumber(kpis.criticalThreats),
      context: `${formatNumber(kpis.highSeverityThreats)} high severity`,
      icon: AlertOctagon,
      accent: 'critical',
    },
    {
      label: 'Blocked / Mitigated',
      value: formatNumber(kpis.blocked),
      context: `${formatNumber(kpis.investigating)} investigating`,
      icon: ShieldBan,
      accent: 'ok',
    },
    {
      label: 'Avg ML Confidence',
      value: kpis.averageConfidence !== null ? `${kpis.averageConfidence.toFixed(1)}%` : '—',
      context: 'Across detected anomalies',
      icon: BrainCircuit,
      accent: 'warn',
    },
    {
      label: 'Unique Source IPs',
      value: formatNumber(kpis.uniqueSourceIDs),
      context: `${formatNumber(kpis.uniqueDestinationIDs)} destination IPs targeted`,
      icon: Users,
      accent: 'neutral',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <KPICard key={card.label} {...card} />
      ))}
    </div>
  )
}
