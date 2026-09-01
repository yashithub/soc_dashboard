import { CircleSlash, FlaskConical, Database, Server, Link2Off } from 'lucide-react'
import { SUBSYSTEMS } from '../config/appConfig.js'

/**
 * Pipeline status.
 *
 * Deliberately honest: none of these are health checks and none of them are
 * running. Every row is rendered in a neutral "placeholder" treatment rather
 * than the green used for operational state elsewhere in the UI, so a simulated
 * subsystem can never be mistaken for a live one.
 */
const STATE_PRESENTATION = {
  simulated: { icon: FlaskConical, dot: 'bg-sim', text: 'text-ink-muted' },
  mock: { icon: Server, dot: 'bg-sim', text: 'text-ink-muted' },
  local: { icon: Database, dot: 'bg-sim', text: 'text-ink-muted' },
  'not-connected': { icon: Link2Off, dot: 'bg-line-strong', text: 'text-ink-faint' },
}

export function SystemStatus() {
  return (
    <div className="space-y-1">
      <ul className="divide-y divide-line/60">
        {SUBSYSTEMS.map((subsystem) => {
          const presentation = STATE_PRESENTATION[subsystem.state] ?? {
            icon: CircleSlash,
            dot: 'bg-line-strong',
            text: 'text-ink-faint',
          }
          const Icon = presentation.icon

          return (
            <li key={subsystem.id} className="py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <Icon size={13} className="shrink-0 text-ink-faint" aria-hidden />
                  <span className="truncate text-[13px] text-ink">{subsystem.label}</span>
                </span>
                <span
                  className={`flex shrink-0 items-center gap-1.5 text-[12px] font-medium ${presentation.text}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${presentation.dot}`}
                    aria-hidden
                  />
                  {subsystem.value}
                </span>
              </div>
              <p className="mt-0.5 pl-[21px] text-[11px] leading-snug text-ink-faint">
                {subsystem.note}
              </p>
            </li>
          )
        })}
      </ul>

      <p className="mt-2 rounded border border-line bg-panel-sunken px-2.5 py-2 text-[11px] leading-relaxed text-ink-faint">
        <strong className="font-medium text-ink-muted">Version 1 scope.</strong> The
        dashboard runs entirely in the browser against a synthetic dataset. No
        backend, database, model or chain is deployed — these rows mark where each
        will connect.
      </p>
    </div>
  )
}
