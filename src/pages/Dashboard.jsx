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
  Network,
  Crosshair,
  Server
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
  trafficVolumeSeries,
  protocolDistribution,
  topSourceIps,
  topDestinationIps,
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
import { RadarChart } from '../components/charts/RadarChart.jsx'
import { TrafficVolumeChart } from '../components/charts/TrafficVolumeChart.jsx'
import { ProtocolChart } from '../components/charts/ProtocolChart.jsx'
import { TopIPsChart } from '../components/charts/TopIPsChart.jsx'

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
        All {APP_CONFIG.alertCount} network events are generated in the browser. No live
        backend, ML model, database or blockchain is connected.
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
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
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

  const visibleAlerts = useMemo(() => filterAlerts(alerts, filters), [alerts, filters])
  const filtered = isFilterActive(filters)

  const kpis = useMemo(() => computeKpis(visibleAlerts), [visibleAlerts])
  const severityData = useMemo(() => severityDistribution(visibleAlerts), [visibleAlerts])
  const threatTypeData = useMemo(() => threatTypeDistribution(visibleAlerts), [visibleAlerts])
  const activityData = useMemo(() => threatActivitySeries(visibleAlerts, { windowHours: APP_CONFIG.windowHours }), [visibleAlerts])
  const volumeData = useMemo(() => trafficVolumeSeries(visibleAlerts, { windowHours: APP_CONFIG.windowHours }), [visibleAlerts])
  const protocolData = useMemo(() => protocolDistribution(visibleAlerts), [visibleAlerts])
  const topSourceData = useMemo(() => topSourceIps(visibleAlerts), [visibleAlerts])
  const topDestData = useMemo(() => topDestinationIps(visibleAlerts), [visibleAlerts])

  const scopeLabel = filtered ? 'Filtered view' : 'All flows'
  const clearFilters = () => setFilters({ ...EMPTY_FILTERS })

  return (
    <div className="min-h-screen bg-page">
      <Header onRefresh={refresh} refreshing={loading} />

      <main className="mx-auto max-w-[1800px] px-4 py-4 sm:px-6">
        {error ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-line bg-panel px-6 py-16 text-center">
            <AlertTriangle size={22} className="text-[#f08c8c]" aria-hidden />
            <div>
              <p className="text-sm font-medium text-ink">Could not load the telemetry feed</p>
              <p className="mt-1 text-xs text-ink-faint">
                {error.message || 'The data service did not return any flows.'}
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

            {/* Top row: 2 charts (col-span-2) and 2 charts (col-span-1) */}
            <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
              <Panel
                title="Threat Activity Over Time"
                subtitle={`Network anomalies · last ${APP_CONFIG.windowHours} hours`}
                icon={Activity}
                filtered={filtered}
                className="xl:col-span-2"
              >
                <ThreatActivityChart data={activityData} />
              </Panel>

              <Panel
                title="Threat Distribution"
                subtitle={`${scopeLabel} · ML classification`}
                icon={PieChart}
                filtered={filtered}
              >
                <ThreatTypeChart data={threatTypeData} />
              </Panel>

              <Panel
                title="Threat Vector Radar"
                subtitle="Relative risk across 6 categories"
                icon={Crosshair}
                filtered={filtered}
              >
                <RadarChart data={threatTypeData} />
              </Panel>
            </div>

            {/* Second row: 4 charts (col-span-1 each) */}
            <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
              <Panel
                title="Network Traffic Volume"
                subtitle={`Ingested GB · last ${APP_CONFIG.windowHours} hours`}
                icon={Activity}
                filtered={filtered}
              >
                <TrafficVolumeChart data={volumeData} />
              </Panel>

              <Panel
                title="Protocol Distribution"
                subtitle={`${scopeLabel} · By volume`}
                icon={Network}
                filtered={filtered}
              >
                <ProtocolChart data={protocolData} />
              </Panel>

              <Panel
                title="Top Source IPs"
                subtitle="By anomaly count"
                icon={Server}
                filtered={filtered}
              >
                <TopIPsChart data={topSourceData} title="Source IPs" />
              </Panel>

              <Panel
                title="Top Destination IPs"
                subtitle="By anomaly count"
                icon={Server}
                filtered={filtered}
              >
                <TopIPsChart data={topDestData} title="Dest IPs" />
              </Panel>
            </div>

            {/* Third row: Alerts Table + Queue/System Status */}
            <div className="grid gap-3 xl:grid-cols-4">
              <Panel
                title="Recent Network Anomalies"
                subtitle={
                  filtered
                    ? `${visibleAlerts.length} of ${alerts.length} flows match current filters`
                    : `${alerts.length} flows in the last ${APP_CONFIG.windowHours} hours · click to investigate`
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
                <Panel
                  title="Severity Breakdown"
                  subtitle={`${scopeLabel}`}
                  icon={PieChart}
                  filtered={filtered}
                >
                  <SeverityChart data={severityData} total={kpis.threatsDetected} />
                </Panel>

                <Panel title="System Status" subtitle="Version 1 pipeline" icon={ServerCog}>
                  <SystemStatus />
                </Panel>
              </div>
            </div>
          </div>
        )}
      </main>

      <IncidentDetails alert={selectedAlert} onClose={() => setSelectedAlert(null)} />

      <footer className="mx-auto max-w-[1800px] px-4 pb-6 sm:px-6">
        <p className="text-[11px] text-ink-faint">
          {APP_CONFIG.name} · {APP_CONFIG.subtitle} · {APP_CONFIG.version}
        </p>
      </footer>
    </div>
  )
}
