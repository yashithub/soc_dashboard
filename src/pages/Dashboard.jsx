import { useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  FlaskConical,
  Layers,
  ListFilter,
  PieChart,
  ServerCog,
} from 'lucide-react'
import { APP_CONFIG } from '../config/appConfig.js'
import { EMPTY_FILTERS } from '../constants/threatModel.js'
import { useAlerts } from '../hooks/useAlerts.js'
import {
  computeKpis,
  filterAlerts,
  isFilterActive,
  severityDistribution,
  threatActivitySeries,
  threatTypeDistribution,
} from '../utils/analytics.js'
import { Header } from '../components/Header.jsx'
import { KPISection } from '../components/KPISection.jsx'
import { FilterBar } from '../components/FilterBar.jsx'
import { AlertsTable } from '../components/AlertsTable.jsx'
import { IncidentDetails } from '../components/IncidentDetails.jsx'
import { SystemStatus } from '../components/SystemStatus.jsx'
import { Panel } from '../components/ui/Panel.jsx'
import { ThreatActivityChart } from '../components/charts/ThreatActivityChart.jsx'
import { SeverityChart } from '../components/charts/SeverityChart.jsx'
import { ThreatTypeChart } from '../components/charts/ThreatTypeChart.jsx'

/** One-line reminder of exactly what is real in this build. */
function DataModeNotice() {
  if (APP_CONFIG.dataMode !== 'synthetic') return null
  return (
    <div className="flex items-start gap-2 rounded-lg border border-line bg-panel px-3 py-2">
      <FlaskConical size={14} className="mt-0.5 shrink-0 text-ink-faint" aria-hidden />
      <p className="text-[12px] leading-relaxed text-ink-faint">
        <span className="font-medium text-ink-muted">
          Version 1 prototype — synthetic dataset.
        </span>{' '}
        All {APP_CONFIG.alertCount} alerts are generated in the browser. No live
        backend, ML model, database or blockchain is connected; the dashboard
        consumes the same normalized alert model those services will provide.
      </p>
    </div>
  )
}

function LoadingBlock({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-lg border border-line bg-panel ${className}`}
      aria-hidden
    />
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-label="Loading security alerts">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <LoadingBlock key={index} className="h-[104px]" />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
        <LoadingBlock className="h-[320px] xl:col-span-2" />
        <LoadingBlock className="h-[320px]" />
        <LoadingBlock className="h-[320px]" />
      </div>
      <LoadingBlock className="h-[460px]" />
    </div>
  )
}

export default function Dashboard() {
  const { alerts, loading, error, refresh } = useAlerts()
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [selectedAlert, setSelectedAlert] = useState(null)

  /**
   * Filters are applied once, here. The KPI row, all three charts and the alert
   * table then read the same `visibleAlerts` array, so a filtered dashboard is
   * internally consistent — and every panel that is showing a subset is marked
   * with a "Filtered" chip.
   */
  const visibleAlerts = useMemo(() => filterAlerts(alerts, filters), [alerts, filters])
  const filtered = isFilterActive(filters)

  const kpis = useMemo(() => computeKpis(visibleAlerts), [visibleAlerts])
  const severityData = useMemo(() => severityDistribution(visibleAlerts), [visibleAlerts])
  const threatTypeData = useMemo(
    () => threatTypeDistribution(visibleAlerts),
    [visibleAlerts],
  )
  const activityData = useMemo(
    () => threatActivitySeries(visibleAlerts, { windowHours: APP_CONFIG.windowHours }),
    [visibleAlerts],
  )

  const scopeLabel = filtered ? 'Filtered view' : 'All alerts'
  const clearFilters = () => setFilters({ ...EMPTY_FILTERS })

  return (
    <div className="min-h-screen bg-page">
      <Header onRefresh={refresh} refreshing={loading} />

      <main className="mx-auto max-w-[1800px] px-4 py-4 sm:px-6">
        {error ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-line bg-panel px-6 py-16 text-center">
            <AlertTriangle size={22} className="text-[#f08c8c]" aria-hidden />
            <div>
              <p className="text-sm font-medium text-ink">Could not load the alert feed</p>
              <p className="mt-1 text-xs text-ink-faint">
                {error.message || 'The alert service did not return any data.'}
              </p>
            </div>
            <button
              type="button"
              onClick={refresh}
              className="rounded border border-line-strong px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:border-accent/50 hover:text-ink"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <DashboardSkeleton />
        ) : (
          <div className="space-y-3">
            <DataModeNotice />

            <KPISection kpis={kpis} scopeLabel={scopeLabel} />

            <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
              <Panel
                title="Threat Activity Over Time"
                subtitle={`Alerts per hour · last ${APP_CONFIG.windowHours} hours`}
                icon={Activity}
                filtered={filtered}
                className="lg:col-span-2"
              >
                <ThreatActivityChart data={activityData} />
              </Panel>

              <Panel
                title="Threat Severity Distribution"
                subtitle={`${scopeLabel} · ${kpis.threatsDetected} alerts`}
                icon={PieChart}
                filtered={filtered}
              >
                <SeverityChart data={severityData} total={kpis.threatsDetected} />
              </Panel>

              <Panel
                title="Threat Type Distribution"
                subtitle="Alert volume by detection category"
                icon={BarChart3}
                filtered={filtered}
              >
                <ThreatTypeChart data={threatTypeData} />
              </Panel>
            </div>

            <div className="grid gap-3 xl:grid-cols-4">
              <Panel
                title="Recent Security Alerts"
                subtitle={
                  filtered
                    ? `${visibleAlerts.length} of ${alerts.length} alerts match the current filters`
                    : `${alerts.length} alerts in the last ${APP_CONFIG.windowHours} hours · select a row to investigate`
                }
                icon={ListFilter}
                className="xl:col-span-3"
                bodyClassName=""
              >
                <FilterBar
                  filters={filters}
                  onChange={setFilters}
                  resultCount={visibleAlerts.length}
                  totalCount={alerts.length}
                />
                <AlertsTable
                  alerts={visibleAlerts}
                  selectedId={selectedAlert?.id}
                  onSelect={setSelectedAlert}
                  onClearFilters={clearFilters}
                />
              </Panel>

              <div className="space-y-3">
                <Panel title="System Status" subtitle="Version 1 pipeline" icon={ServerCog}>
                  <SystemStatus />
                </Panel>

                <Panel title="Queue Summary" icon={Layers} filtered={filtered}>
                  <dl className="space-y-2">
                    {[
                      ['Investigating', kpis.investigating],
                      ['Blocked', kpis.blocked],
                      ['Resolved', kpis.resolved],
                      [
                        'Avg. ML confidence',
                        kpis.averageConfidence !== null
                          ? `${kpis.averageConfidence.toFixed(1)}%`
                          : '—',
                      ],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-baseline justify-between gap-3">
                        <dt className="text-[12px] text-ink-faint">{label}</dt>
                        <dd className="tabular text-[13px] font-semibold text-ink">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Panel>
              </div>
            </div>
          </div>
        )}
      </main>

      <IncidentDetails alert={selectedAlert} onClose={() => setSelectedAlert(null)} />

      <footer className="mx-auto max-w-[1800px] px-4 pb-6 sm:px-6">
        <p className="text-[11px] text-ink-faint">
          {APP_CONFIG.name} · {APP_CONFIG.subtitle} · {APP_CONFIG.version} — synthetic
          demonstration data only.
        </p>
      </footer>
    </div>
  )
}
