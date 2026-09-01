import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Check,
  Copy,
  Fingerprint,
  Link2,
  ListChecks,
  Radar,
  ShieldQuestion,
  X,
} from 'lucide-react'
import { EVIDENCE_STATUS } from '../constants/threatModel.js'
import { DetailRow } from './ui/Panel.jsx'
import { ConfidenceMeter, SeverityBadge, SimulatedTag, StatusBadge } from './ui/Badges.jsx'
import { formatFullTimestamp, formatNumber, formatRelative, truncateHash, formatCompact } from '../utils/format.js'

function SectionHeading({ icon: Icon, children, tag }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <Icon size={13} className="text-ink-faint" aria-hidden />
      <h3 className="text-[11px] font-semibold tracking-wider text-ink-muted uppercase">
        {children}
      </h3>
      {tag}
    </div>
  )
}

function HashField({ hash }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(hash)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard is unavailable in some browsers/contexts; the hash is still
      // visible on screen, so there is nothing to recover from.
    }
  }

  if (!hash) return <span className="text-ink-faint">Not available</span>

  return (
    <span className="flex items-center gap-2">
      <code className="font-mono text-xs text-ink" title={hash}>
        {truncateHash(hash)}
      </code>
      <button
        type="button"
        onClick={copy}
        className="rounded p-1 text-ink-faint transition-colors hover:text-ink"
        aria-label="Copy evidence hash"
      >
        {copied ? <Check size={12} aria-hidden /> : <Copy size={12} aria-hidden />}
      </button>
    </span>
  )
}

/**
 * Evidence integrity — the reserved slot in the investigation workflow.
 *
 * Version 1 is explicit about what is real: the hash is a placeholder string,
 * nothing is anchored anywhere, and no transaction exists. The panel documents
 * the intended chain of custody rather than simulating one.
 */
function EvidenceIntegrity({ evidenceStatus, evidenceHash }) {
  const recorded = evidenceStatus === EVIDENCE_STATUS.RECORDED

  return (
    <div className="rounded-md border border-line bg-panel-sunken p-3">
      <SectionHeading icon={Fingerprint} tag={<SimulatedTag label="Placeholder" />}>
        Evidence Integrity
      </SectionHeading>

      <dl className="divide-y divide-line/60">
        <DetailRow label="Evidence Hash">
          <HashField hash={evidenceHash} />
        </DetailRow>

        <DetailRow label="Hash Status">
          <span className="text-[13px] text-ink-muted">Generated / Pending Recording</span>
        </DetailRow>

        <DetailRow label="Blockchain">
          <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-line-strong" aria-hidden />
            Not Connected
          </span>
        </DetailRow>

        <DetailRow label="Verification">
          <span className="text-[13px] text-ink-muted">Not Available</span>
        </DetailRow>
      </dl>

      <p className="mt-3 border-t border-line pt-2 text-[11px] leading-relaxed text-ink-faint">
        <strong className="font-medium text-ink-muted">Future integration.</strong>{' '}
        Reserved for future tamper-evident evidence anchoring.
      </p>
    </div>
  )
}

/**
 * Incident detail drawer.
 */
export function IncidentDetails({ alert, onClose }) {
  const closeRef = useRef(null)

  useEffect(() => {
    if (!alert) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    closeRef.current?.focus()
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [alert, onClose])

  if (!alert) return null

  const evidence = alert.supportingEvidence ?? []
  const actions = alert.recommendedAction ? [alert.recommendedAction] : []

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/55 xl:hidden"
        onClick={onClose}
        aria-hidden
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Incident ${alert.id} details`}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col border-l border-line bg-panel shadow-2xl shadow-black/50"
      >
        <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <p className="text-[10px] tracking-wider text-ink-faint uppercase">
              Incident detail
            </p>
            <h2 className="mt-0.5 font-mono text-[15px] font-semibold text-ink">
              {alert.id}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <SeverityBadge severity={alert.severity} />
              <StatusBadge status={alert.status} />
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded border border-line-strong p-1.5 text-ink-muted transition-colors hover:border-accent/50 hover:text-ink"
            aria-label="Close incident details"
          >
            <X size={14} aria-hidden />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
          <section>
            <SectionHeading icon={Radar}>Network Flow Detection</SectionHeading>
            <dl className="divide-y divide-line/60">
              <DetailRow label="Detected at">
                {formatFullTimestamp(alert.timestamp)}
                <span className="ml-2 text-ink-faint">
                  ({formatRelative(alert.timestamp)})
                </span>
              </DetailRow>
              <DetailRow label="Source IP" mono>{alert.sourceIP}</DetailRow>
              <DetailRow label="Source Port" mono>{alert.sourcePort}</DetailRow>
              <DetailRow label="Dest IP" mono>{alert.destinationIP}</DetailRow>
              <DetailRow label="Dest Port" mono>{alert.destinationPort}</DetailRow>
              <DetailRow label="Protocol" mono>{alert.protocol}</DetailRow>
              <DetailRow label="Direction">{alert.direction}</DetailRow>
              <DetailRow label="Bytes">{formatNumber(alert.bytes)}</DetailRow>
              <DetailRow label="Packets">{formatNumber(alert.packets)}</DetailRow>
              <DetailRow label="Duration">{alert.duration}s</DetailRow>
              
              <div className="pt-2 mt-2 border-t border-line border-dashed"></div>

              <DetailRow label="Threat type">{alert.threatType}</DetailRow>
              <DetailRow label="Risk Score">
                <span className="font-semibold text-ink">{alert.riskScore}</span> / 100
              </DetailRow>
              <DetailRow label="ML confidence">
                <ConfidenceMeter value={alert.confidence} />
              </DetailRow>
            </dl>
          </section>

          <section>
            <SectionHeading icon={AlertTriangle}>Threat Analysis</SectionHeading>
            <p className="text-[13px] leading-relaxed text-ink-muted">
              {alert.description || 'No description was provided for this detection.'}
            </p>
            <p className="text-[12px] leading-relaxed text-ink-faint mt-2">
              Note: The ML model flagged this event based on flow characteristics with {alert.confidence}% confidence. Severity ({alert.severity}) represents the potential business impact.
            </p>
          </section>

          <section>
            <SectionHeading icon={ShieldQuestion}>Supporting Evidence</SectionHeading>
            {evidence.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {evidence.map((item) => (
                  <li
                    key={item}
                    className="rounded border border-line-strong bg-panel-sunken px-2 py-1.5 text-[12px] text-ink-muted flex items-start gap-2"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12px] text-ink-faint">
                No supporting evidence was recorded.
              </p>
            )}
          </section>

          <section>
            <SectionHeading icon={ListChecks}>Recommended action</SectionHeading>
            {actions.length > 0 ? (
              <ol className="space-y-1.5">
                {actions.map((action, index) => (
                  <li key={index} className="flex gap-2 text-[13px] text-ink-muted bg-accent/5 p-2 rounded border border-accent/20">
                    {action}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-[12px] text-ink-faint">
                No recommended action is available.
              </p>
            )}
          </section>

          <EvidenceIntegrity evidenceStatus={alert.evidenceStatus} evidenceHash={alert.evidenceHash} />
        </div>

        <footer className="border-t border-line px-4 py-2.5">
          <p className="text-[11px] text-ink-faint">
            Analyst actions (assign, escalate, close) are not wired in this
            version — the incident record is read-only.
          </p>
        </footer>
      </aside>
    </>
  )
}
