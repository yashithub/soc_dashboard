import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Network } from 'lucide-react'
import { COLORS } from '../../theme/tokens.js'
import { EmptyState } from '../ui/Badges.jsx'

export function ProtocolChart({ data }) {
  const hasData = data.some((entry) => entry.count > 0)

  if (!hasData) {
    return (
      <EmptyState
        icon={Network}
        title="No protocol data"
        message="Clear or widen the filters to see protocol breakdown."
      />
    )
  }

  // Pre-defined colors for protocols
  const PROTOCOL_COLORS = {
    TCP: '#3987e5',
    UDP: '#f79a4a',
    QUIC: '#9333ea',
    ICMP: '#d64545',
  }

  return (
    <div className="h-[240px] w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Pie
            data={data}
            innerRadius="60%"
            outerRadius="80%"
            paddingAngle={2}
            dataKey="count"
            nameKey="protocol"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PROTOCOL_COLORS[entry.protocol] || COLORS.inkMuted} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: COLORS.surfaceRaised, borderColor: COLORS.line, color: COLORS.ink, fontSize: '12px' }}
            itemStyle={{ color: COLORS.inkMuted }}
            formatter={(value, name) => [value, name]}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
      
      {/* Custom Legend */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <ul className="text-center">
          {data.slice(0, 4).map((entry) => (
            <li key={entry.protocol} className="text-[11px] text-ink-muted mb-0.5">
              <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{backgroundColor: PROTOCOL_COLORS[entry.protocol] || COLORS.inkMuted}}></span>
              {entry.protocol}: {entry.count}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
