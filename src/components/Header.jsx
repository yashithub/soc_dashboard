import { useEffect, useState } from 'react'
import { RefreshCw, ShieldCheck, UserRound } from 'lucide-react'
import { APP_CONFIG } from '../config/appConfig.js'

/** Ticking wall clock, matching the always-on display in a real SOC. */
function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  return now
}

export function Header({ onRefresh, refreshing = false }) {
  const now = useClock()

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-page/95 backdrop-blur supports-[backdrop-filter]:bg-page/80">
      <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-accent/35 bg-accent/12">
            <ShieldCheck size={18} className="text-accent" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-[15px] leading-tight font-semibold tracking-tight text-ink">
              {APP_CONFIG.name}
            </h1>
            <p className="truncate text-[11px] tracking-wide text-ink-faint uppercase">
              {APP_CONFIG.subtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {/* Describes the dashboard process itself — not the (absent) backend. */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full rounded-full bg-ok/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-ok" />
            </span>
            <span className="text-xs font-medium text-ink">System Operational</span>
            <span className="hidden text-[11px] text-ink-faint sm:inline">
              · {APP_CONFIG.version}
            </span>
          </div>

          <div className="hidden text-right md:block">
            <p className="tabular text-[13px] leading-tight font-medium text-ink">
              {now.toLocaleTimeString('en-GB', { hour12: false })}
            </p>
            <p className="text-[11px] text-ink-faint">
              {now.toLocaleDateString('en-GB', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>

          <div className="flex items-center gap-2 border-l border-line pl-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line-strong bg-panel-raised">
              <UserRound size={14} className="text-ink-muted" aria-hidden />
            </span>
            <div className="hidden leading-tight sm:block">
              <p className="text-[13px] font-medium text-ink">{APP_CONFIG.analyst.name}</p>
              <p className="text-[11px] text-ink-faint">
                {APP_CONFIG.analyst.role} · {APP_CONFIG.analyst.shift}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded border border-line-strong bg-panel px-2.5 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:border-accent/50 hover:text-ink disabled:opacity-50"
            title="Reload the alert feed"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} aria-hidden />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>
    </header>
  )
}
