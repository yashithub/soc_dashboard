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
import { formatFullTimestamp, formatNumber, formatRelative, truncateHash } from '../utils/format.js'

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
function EvidenceIntegrity({ evidence }) {
  const recorded = evidence.status === EVIDENCE_STATUS.RECORDED

  return (
    <div className="rounded-md border border-line bg-panel-sunken p-3">
      <SectionHeading icon={Fingerprint} tag={<SimulatedTag label="Placeholder" />}>
        Evidence Integrity
      </SectionHeading>

      <dl className="divide-y divide-line/60">
        <DetailRow label="Evidence Status">
          <span
            className={`inline-flex items-center gap-1.5 text-[13px] ${
              recorded ? 'text-[#7ed08a]' : 'text-[#d3ae3a]'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${recorded ? 'bg-ok' : 'bg-[#a88300]'}`}
              aria-hidden
            />
            {evidence.status}
          </span>
        </DetailRow>

        <DetailRow label="Evidence Hash">
          <HashField hash={evidence.hash} />
        </DetailRow>

        <DetailRow label="Hash Algorithm">{evidence.hashAlgorithm}</DetailRow>

        <DetailRow label="Blockchain Status">
          <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-sim" aria-hidden />
            {evidence.blockchain}
          </span>
        </DetailRow>

        <DetailRow label="Verification">
          <span className="text-[13px] text-ink-muted">{evidence.verification}</span>
        </DetailRow>
      </dl>

      <p className="mt-3 border-t border-line pt-2 text-[11px] leading-relaxed text-ink-faint">
        <strong className="font-medium text-ink-muted">Future integration.</strong>{' '}
        Forensic evidence will be hashed and the digest anchored on-chain to give
        tamper-evident chain of custody. No blockchain is connected in this
        version and the hash above is a generated placeholder, not a digest of
        real evidence.
      </p>
    </div>
  )
}

/**
 * Incident detail drawer.
 *
 * A right-hand drawer (full-height sheet on small screens) rather than a modal:
 * the analyst keeps the alert queue visible while reading an incident, which is
 * how triage actually works.
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

  const indicators = alert.indicators ?? []
  const actions = alert.recommendedAction ?? []

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
            <SectionHeading icon={Radar}>Detection</SectionHeading>
            <dl className="divide-y divide-line/60">
              <DetailRow label="Detected at">
                {formatFullTimestamp(alert.timestamp)}
                <span className="ml-2 text-ink-faint">
                  ({formatRelative(alert.timestamp)})
                </span>
              </DetailRow>
              <DetailRow label="Source" mono>
                {alert.source}
              </DetailRow>
              <DetailRow label="Target asset" mono>
                {alert.targetAsset}
              </DetailRow>
              <DetailRow label="Threat type">{alert.threatType}</DetailRow>
              <DetailRow label="Detection channel">{alert.channel}</DetailRow>
              <DetailRow label="ML confidence">
                <ConfidenceMeter value={alert.confidence} />
              </DetailRow>
              <DetailRow label="Detection model">
                <span className="text-ink-muted">{alert.detector}</span>
              </DetailRow>
              <DetailRow label="Correlated events">
                {formatNumber(alert.correlatedEvents)} raw events
              </DetailRow>
            </dl>
          </section>

          <section>
            <SectionHeading icon={AlertTriangle}>Threat description</SectionHeading>
            <p className="text-[13px] leading-relaxed text-ink-muted">
              {alert.description || 'No description was provided for this detection.'}
            </p>
            {alert.observable && (
              <p className="mt-2 flex items-start gap-2 rounded border border-line bg-panel-sunken px-2.5 py-2">
                <Link2 size={12} className="mt-0.5 shrink-0 text-ink-faint" aria-hidden />
                <code className="font-mono text-[11px] break-all text-ink-muted">
                  {alert.observable}
                </code>
              </p>
            )}
          </section>

          <section>
            <SectionHeading icon={ShieldQuestion}>Indicators of compromise</SectionHeading>
            {indicators.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5">
                {indicators.map((indicator) => (
                  <li
                    key={indicator}
                    className="rounded border border-line-strong bg-panel-sunken px-2 py-1 text-[11px] text-ink-muted"
                  >
                    {indicator}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12px] text-ink-faint">
                No indicators were recorded for this detection.
              </p>
            )}
          </section>

          <section>
            <SectionHeading icon={ListChecks}>Recommended action</SectionHeading>
            {actions.length > 0 ? (
              <ol className="space-y-1.5">
                {actions.map((action, index) => (
                  <li key={action} className="flex gap-2 text-[13px] text-ink-muted">
                    <span className="tabular mt-px shrink-0 font-mono text-[11px] text-ink-faint">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {action}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-[12px] text-ink-faint">
                No recommended action is available for this detection.
              </p>
            )}
          </section>

          <EvidenceIntegrity evidence={alert.evidence} />
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
