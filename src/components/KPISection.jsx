import {
  Activity,
  AlertOctagon,
  CheckCircle2,
  Mail,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { APP_CONFIG } from '../config/appConfig.js'
import { formatCompact, formatNumber, formatPercent } from '../utils/format.js'

/**
 * One KPI tile. `accent` tints only the icon and the value — the label and
 * context stay in text ink, so a row of five cards reads as one system rather
 * than five competing colours.
 */
export function KPICard({ label, value, context, icon: Icon, accent = 'neutral', trend }) {
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
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${
              trend.direction === 'up' ? 'text-[#f08c8c]' : 'text-[#7ed08a]'
            }`}
          >
            {trend.direction === 'up' ? (
              <TrendingUp size={11} aria-hidden />
            ) : (
              <TrendingDown size={11} aria-hidden />
            )}
            {trend.label}
          </span>
        )}
        {context && <p className="truncate text-[11px] text-ink-faint">{context}</p>}
      </div>
    </div>
  )
}

/**
 * The five headline figures. Every value comes from `computeKpis`, which reads
 * the same alert list the charts and the table use.
 */
export function KPISection({ kpis, scopeLabel }) {
  const trend =
    Number.isFinite(kpis.volumeChangePct) && Math.abs(kpis.volumeChangePct) >= 1
      ? {
          direction: kpis.volumeChangePct > 0 ? 'up' : 'down',
          label: `${Math.abs(kpis.volumeChangePct).toFixed(0)}% vs prev 24h`,
        }
      : null

  const cards = [
    {
      label: 'Total Security Events',
      value: formatCompact(kpis.totalEvents),
      context: `correlated into ${formatNumber(kpis.threatsDetected)} alerts`,
      icon: Activity,
      accent: 'accent',
    },
    {
      label: 'Threats Detected',
      value: formatNumber(kpis.threatsDetected),
      context: `${scopeLabel} · ${APP_CONFIG.windowHours}h window`,
      icon: ShieldAlert,
      accent: 'accent',
      trend,
    },
    {
      label: 'Critical Threats',
      value: formatNumber(kpis.criticalThreats),
      context: `${formatPercent(kpis.criticalShare, 0)} of alerts · ${formatNumber(
        kpis.highThreats,
      )} high`,
      icon: AlertOctagon,
      accent: 'critical',
    },
    {
      label: 'Threats Resolved',
      value: formatNumber(kpis.resolved),
      context: `${formatPercent(kpis.resolutionRate, 0)} closed · ${formatNumber(
        kpis.investigating,
      )} in progress`,
      icon: CheckCircle2,
      accent: 'ok',
    },
    {
      label: 'Suspicious Emails',
      value: formatNumber(kpis.suspiciousEmails),
      context: `${formatPercent(kpis.emailShare, 0)} of alerts are email-borne`,
      icon: Mail,
      accent: 'warn',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => (
        <KPICard key={card.label} {...card} />
      ))}
    </div>
  )
}
