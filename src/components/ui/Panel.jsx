import { Filter } from 'lucide-react'

/**
 * The standard bordered surface every dashboard section sits on.
 * `filtered` marks a panel whose figures reflect the active filter rather than
 * the whole dataset, so a filtered chart is never mistaken for the full picture.
 */
export function Panel({
  title,
  subtitle,
  icon: Icon,
  actions,
  filtered = false,
  className = '',
  bodyClassName = 'p-4',
  children,
}) {
  return (
    <section
      className={`flex flex-col rounded-lg border border-line bg-panel ${className}`}
    >
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-[13px] font-semibold tracking-wide text-ink uppercase">
              {Icon && <Icon size={14} className="shrink-0 text-ink-faint" aria-hidden />}
              <span className="truncate">{title}</span>
              {filtered && (
                <span className="inline-flex items-center gap-1 rounded-sm bg-accent/12 px-1.5 py-0.5 text-[10px] font-medium tracking-normal text-[#8ab8f0] normal-case ring-1 ring-inset ring-accent/30">
                  <Filter size={9} aria-hidden />
                  Filtered
                </span>
              )}
            </h2>
            {subtitle && (
              <p className="mt-1 truncate text-xs text-ink-faint">{subtitle}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </header>
      )}
      <div className={`flex-1 ${bodyClassName}`}>{children}</div>
    </section>
  )
}

/** Small key/value row used by the incident panel and system status list. */
export function DetailRow({ label, children, mono = false }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="w-40 shrink-0 text-xs text-ink-faint">{label}</dt>
      <dd
        className={`min-w-0 flex-1 text-[13px] break-words text-ink ${
          mono ? 'font-mono text-xs' : ''
        }`}
      >
        {children ?? <span className="text-ink-faint">Not available</span>}
      </dd>
    </div>
  )
}
