import { useId, useState } from 'react'
import type { Clash } from '../domain/scheduling.ts'
import { clashDates } from '../domain/scheduling.ts'
import { DAY, formatDate } from '../domain/calendar.ts'
import { ProcurementLink } from './procurement-details.tsx'

type FindingActions = { onSelect?: (id: string) => void; getHref?: (id: string) => string; viewing?: boolean }
function compactOverlapDates(finding: Clash) {
  return finding.spans.map(span => {
    const finish = new Date(span.e).getUTCDay() === 1 && span.e - 3 * DAY >= span.s ? span.e - 3 * DAY : span.e
    const first = new Date(span.s), last = new Date(finish)
    const sameYear = first.getUTCFullYear() === last.getUTCFullYear(), sameMonth = sameYear && first.getUTCMonth() === last.getUTCMonth()
    return `${new Intl.DateTimeFormat('en-GB', { day: 'numeric', ...(!sameMonth ? { month: 'short' } : {}), ...(!sameYear ? { year: 'numeric' } : {}), timeZone: 'UTC' }).format(first)} to ${formatDate(finish)}`
  }).join('; ')
}
export function FindingCounts({ findings }: { findings: Clash[] }) {
  const critical = findings.filter(finding => finding.severity === 'critical').length
  const warning = findings.length - critical
  return <div className="finding-counts"><span className="severity critical">{critical} critical {critical === 1 ? 'clash' : 'clashes'}</span><span className="severity warning">{warning} {warning === 1 ? 'warning' : 'warnings'}</span></div>
}

export function FindingsSummary({ findings, hasRules }: { findings: Clash[]; hasRules: boolean }) {
  return !hasRules ? <p>No clash-checking rules are configured.</p> : findings.length ? <FindingCounts findings={findings} /> : <p>No warnings or critical clashes found.</p>
}

export function FindingCard({ finding, onSelect, getHref, viewing, status }: { finding: Clash; status?: 'New' | 'Remaining' | 'Resolved' } & FindingActions) {
  const same = finding.phase === finding.secondPhaseName
  return <li className={`planning-finding ${finding.severity}${status === 'Resolved' ? ' resolved' : ''}`}>
    <span className={`severity ${finding.severity}`}>{finding.severity === 'critical' ? 'Critical clash' : 'Warning'}</span>
    {status && <span className="finding-status">{status}</span>}
    <h3>{same ? 'Phase: ' : 'Phases: '}{finding.phase}{!same && ` / ${finding.secondPhaseName}`}</h3>
    <p className="finding-field-label">Procurements:</p>
    <ul className="finding-participants">{[[finding.firstPlan, finding.firstPlanName, finding.phase], [finding.secondPlan, finding.secondPlanName, finding.secondPhaseName]].map(([id, name, phase]) => <li key={id}>
      {onSelect && getHref ? <ProcurementLink id={id} name={name} href={getHref(id)} onSelect={onSelect} viewing={viewing} /> : <strong>{name}</strong>}
      {!same && <small>Phase: {phase}</small>}
    </li>)}</ul>
    <div className="finding-overlap"><p><strong>Overlap:</strong> {onSelect ? compactOverlapDates(finding) : clashDates(finding)}</p><p className="finding-duration">{finding.weeks} active {finding.weeks === 1 ? 'week' : 'weeks'}</p></div>
    {!onSelect && finding.reason && <p>{finding.reason}</p>}
  </li>
}

export function Findings({ findings, hasRules, filters = false, onSelect, getHref, viewing, headingLevel = 2, sectionId }: { findings: Clash[]; hasRules: boolean; filters?: boolean; headingLevel?: 2 | 4; sectionId?: string } & FindingActions) {
  const id = useId()
  const Heading = headingLevel === 4 ? 'h4' : 'h2'
  const [filter, setFilter] = useState('all')
  const choices = [{ value: 'all', label: 'All' }, { value: 'critical', label: 'Critical clashes' }, { value: 'warning', label: 'Warnings' }]
  const ordered = findings.toSorted((a, b) => Number(b.severity === 'critical') - Number(a.severity === 'critical'))
  const visible = ordered.filter(finding => filter === 'all' || finding.severity === filter)
  return <section className="planning-findings" id={sectionId ?? (filters ? 'pipeline-findings' : undefined)} tabIndex={filters ? -1 : undefined} aria-labelledby={id}>
    <div className="findings-heading"><div><Heading id={id}>Warnings and critical clashes</Heading></div>
      {filters ? <div className="findings-filters" role="group" aria-label="Filter findings by severity">{choices.map(choice => <button type="button" key={choice.value} aria-pressed={filter === choice.value} aria-controls={`${id}-results`} onClick={() => setFilter(choice.value)}>{choice.label} ({choice.value === 'all' ? findings.length : findings.filter(finding => finding.severity === choice.value).length})</button>)}</div> : <FindingCounts findings={findings} />}
    </div>
    {filters && <p className="sr-only" role="status" aria-live="polite">Showing {visible.length} of {findings.length} findings. Filter: {choices.find(choice => choice.value === filter)!.label}.</p>}
    <div className="findings-content" id={`${id}-results`}>
      {!hasRules ? <p className="findings-empty">No clash-checking rules have been set up. Names alone do not create rules.</p>
        : !visible.length ? <p className="findings-empty">{!findings.length ? 'No warnings or critical clashes found against the shared Library rules.' : filter === 'critical' ? 'No critical clashes found. Select All to see the other findings.' : 'No warnings found. Select All to see the other findings.'}</p> : null}
      {visible.length > 0 && <ul className="planning-findings-grid" aria-label="Pipeline Plan findings">{visible.map(finding => <FindingCard finding={finding} onSelect={onSelect} getHref={getHref} viewing={viewing} key={finding.key} />)}</ul>}
    </div>
  </section>
}
