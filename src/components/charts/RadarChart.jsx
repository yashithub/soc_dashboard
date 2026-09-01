import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts'
import { Crosshair } from 'lucide-react'
import { CHART, COLORS } from '../../theme/tokens.js'
import { EmptyState } from '../ui/Badges.jsx'
import { ChartTooltip } from './ChartTooltip.jsx'
import { THREAT_TYPE_ORDER } from '../../constants/threatModel.js'

/**
 * Radar Chart for showing relative activity/risk across the 6 threat categories.
 */
export function RadarChart({ data }) {
  const hasData = data.some((entry) => entry.count > 0)

  if (!hasData) {
    return (
      <EmptyState
        icon={Crosshair}
        title="No threat data"
        message="Clear or widen the filters to see the threat distribution."
      />
    )
  }

  // Shorten labels for the radar chart
  const shortLabels = {
    'Volumetric / Protocol DDoS': 'DDoS',
    'Botnet C2 Beaconing': 'C2 Beaconing',
    'DGA Domains / DNS Tunnelling': 'DGA / DNS Tunnel',
    'Malware inside Encrypted TLS/QUIC Sessions': 'TLS/QUIC Malware',
    'Reconnaissance / Port Scanning': 'Recon / Port Scan',
    'Data Exfiltration': 'Data Exfil',
  }

  const radarData = THREAT_TYPE_ORDER.map(type => {
    const entry = data.find(d => d.threatType === type)
    return {
      threatType: shortLabels[type] || type,
      originalType: type,
      count: entry ? entry.count : 0
    }
  })

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
          <PolarGrid stroke={CHART.gridStroke} />
          <PolarAngleAxis 
            dataKey="threatType" 
            tick={{ fill: COLORS.inkMuted, fontSize: 10 }}
          />
          <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
          <Tooltip
            content={<ChartTooltip titleKey="originalType" />}
            cursor={{ fill: COLORS.surfaceRaised }}
          />
          <Radar
            name="Alerts"
            dataKey="count"
            stroke={CHART.seriesPrimary}
            fill={CHART.seriesPrimary}
            fillOpacity={0.4}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  )
}
