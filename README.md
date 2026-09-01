# CyberShield SOC — Security Operations Center

Version 1 prototype of the SOC dashboard. It renders a realistic security
operations view from a **synthetic dataset generated in the browser**.

There is no backend, no database, no ML model, no authentication, no WebSocket
and no blockchain in this version. The frontend is built against the normalized
alert model those services will eventually provide, so connecting them is a
change to one file rather than a rewrite.

```
Version 1 (now)      Synthetic dataset → alertService → Dashboard UI
Version 2 (later)    REST API / WebSocket → alertService → Dashboard UI
```

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
npm run preview  # serve the production build
```

## Project structure

```
src/
  config/appConfig.js        Product name, analyst, window size, subsystem states
  constants/threatModel.js   The alert vocabulary: severities, types, statuses, filters
  theme/tokens.js            Colour tokens for charts + severity/status styles
  data/fakeAlerts.js         Synthetic dataset generator (VERSION 1 ONLY)
  services/alertService.js   The only boundary between the UI and its data source
  utils/analytics.js         Every derived number: KPIs, distributions, time series
  utils/format.js            Null-safe date / number / hash formatting
  utils/time.js              Local-hour bucketing shared by the generator and charts
  hooks/useAlerts.js         Loads the feed; handles loading / error / subscription
  components/
    Header.jsx               Product identity, clock, analyst, refresh
    KPISection.jsx           The five headline cards (KPICard lives here too)
    FilterBar.jsx            Search + severity / type / status filters
    AlertsTable.jsx          Sortable, paginated alert queue
    IncidentDetails.jsx      Detail drawer, including Evidence Integrity
    SystemStatus.jsx         Which subsystems are simulated vs connected
    charts/                  ThreatActivityChart, SeverityChart, ThreatTypeChart,
                             ChartTooltip (one tooltip surface for all charts)
    ui/                      Panel, DetailRow, badges, meters, empty states
  pages/Dashboard.jsx        Composes the page and owns filter + selection state
```

## The synthetic dataset

`src/data/fakeAlerts.js` generates 260 alerts across a rolling 48-hour window
using a seeded PRNG, so the data is stable for the length of a demo.

Distributions are **correlated, not uniform**:

- threat type drives severity (spam is never Critical; malware skews high),
- severity drives the ML confidence band,
- severity *and* alert age drive workflow status (fresh alerts are still being
  investigated, older ones have mostly closed),
- indicators, descriptions and recommended actions are drawn from per-type pools,
  so phishing always shows a spoofed sender or suspicious URL and malware always
  shows an attachment or executable indicator,
- hourly volume follows a working-day rhythm with two campaign bursts.

Nothing outside `alertService.js` imports this file.

## How the numbers are calculated

All derived figures come from `src/utils/analytics.js`. No component computes
its own totals, so the KPI row, the three charts and the table can never
disagree.

| Figure | Derivation |
|---|---|
| Total Security Events | sum of `correlatedEvents` across the alerts in view |
| Threats Detected | number of alerts in view |
| Critical Threats | alerts with `severity === 'Critical'` |
| Threats Resolved | alerts with `status === 'Resolved'` |
| Suspicious Emails | alerts with `channel === 'Email'` |
| Severity donut | `severityDistribution()` — fixed Critical→Low order |
| Threat type bars | `threatTypeDistribution()` — sorted by volume |
| Activity over time | `threatActivitySeries()` — one point per hour in the window |

`Total Security Events` is larger than `Threats Detected` for the same reason it
is in a real SIEM: many raw events correlate into one alert an analyst works.

## Filtering and search

`Dashboard.jsx` owns the filter state and applies it **once**, then feeds the
result to the KPIs, the charts and the table. Filtering therefore narrows the
whole dashboard, and every panel showing a subset carries a "Filtered" chip so a
filtered view is never mistaken for the full picture.

- Search matches incident ID, source, threat type, description and target asset.
- Severity / Threat Type / Status filters each default to `All` and combine.
- Sorting (timestamp, severity, confidence) and pagination live in the table,
  since they are presentation state only.

## Incident details

Clicking or pressing Enter on a row opens a right-hand drawer (`Escape` closes
it) showing the detection metadata, threat description, indicators of
compromise, recommended actions, and the Evidence Integrity block.

## Where blockchain fits

The **Evidence Integrity** section of the incident drawer reserves the place in
the investigation workflow where evidence anchoring will go:

```
Evidence Status     Pending / Recorded
Evidence Hash       8f92…a71c   (placeholder)
Blockchain Status   Not Connected
Verification        Pending
```

The hash is a generated placeholder string, not a digest of anything. No
transaction IDs are fabricated, no contract exists, and `blockchain` is pinned
to `Not Connected` for every record. The **System Status** panel says the same
thing at the pipeline level.

## Replacing the synthetic data with a real API

Edit `src/services/alertService.js` only:

```js
export async function getAlerts() {
  const response = await fetch(`${API_BASE}/alerts`)
  if (!response.ok) throw new Error(`Alert feed returned ${response.status}`)
  return (await response.json()).map(normalizeAlert)
}

export function subscribeToAlerts(onAlert) {
  const socket = new WebSocket(`${WS_BASE}/alerts`)
  socket.onmessage = (event) => onAlert(normalizeAlert(JSON.parse(event.data)))
  return () => socket.close()
}
```

`normalizeAlert()` already coerces a raw record into the shape the dashboard
renders and falls back safely on unknown or missing values, so a backend whose
field names differ only needs its mapping added there. `useAlerts` already
handles loading, error and subscription lifecycles, and `Dashboard.jsx` already
renders loading, error and empty states. No component changes.

## Colour system

Dark surfaces with a restrained palette; tokens are declared once in
`src/index.css` (`@theme`) and mirrored in `src/theme/tokens.js` for Recharts.

Severity uses an ordered ramp — `#d64545` Critical, `#f79a4a` High, `#a88300`
Medium, `#4b93e0` Low — validated against the panel surface `#111826`: adjacent
pairs separate by ΔE 10.9 under simulated colour-vision deficiency and ΔE 15.8
under normal vision, and all four steps clear 3:1 contrast. The ramp varies in
lightness on purpose, because severity is an ordered scale.

Severity is never signalled by colour alone: every badge pairs a distinct icon
with the written level, the alert table carries a severity rail per row, and the
donut is accompanied by a written list of counts and percentages.

The threat-type chart is one measure across categories, so it uses a single hue
— colouring each bar differently would encode nothing the axis labels do not
already say.
