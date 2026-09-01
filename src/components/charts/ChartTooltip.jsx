/**
 * One tooltip surface for all three charts, so hovering anywhere on the
 * dashboard produces the same card. Recharts passes `payload` entries; this
 * renders a colour swatch, the series name and the value per entry.
 */
export function ChartTooltip({ active, payload, label, valueSuffix = '', titleKey }) {
  if (!active || !payload?.length) return null

  const heading = titleKey ? (payload[0]?.payload?.[titleKey] ?? label) : label

  return (
    <div className="pointer-events-none rounded-md border border-line-strong bg-panel-raised px-3 py-2 shadow-lg shadow-black/40">
      {heading && (
        <p className="mb-1.5 text-[11px] font-medium tracking-wide text-ink-muted">
          {heading}
        </p>
      )}
      <ul className="space-y-1">
        {payload.map((entry) => (
          <li key={entry.dataKey ?? entry.name} className="flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{ background: entry.color ?? entry.payload?.fill }}
              aria-hidden
            />
            <span className="text-xs text-ink-muted">{entry.name}</span>
            <span className="tabular ml-auto pl-3 text-xs font-semibold text-ink">
              {entry.value}
              {valueSuffix}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
