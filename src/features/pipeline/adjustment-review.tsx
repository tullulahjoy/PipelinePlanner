import { useMemo } from 'react'
import type { RefObject } from 'react'
import type { Clash, Plan, OverlapRule } from '../../domain/scheduling.ts'
import { dateChanges, dateMovementSummary, findClashes } from '../../domain/scheduling.ts'
import { DAY, WEEK, activeDays, formatDate } from '../../domain/calendar.ts'
import { christmasExplanation } from '../../domain/comparison.ts'
import { FindingCard, FindingCounts } from '../../ui/findings.tsx'

export function AdjustmentDates({ before, after, headingRef }: { before: Plan[]; after: Plan[]; headingRef: RefObject<HTMLHeadingElement | null> }) {
  const changes = dateChanges(before, after)
  return <section className="adjustment-date-review" id="adjustment-dates"><h3 tabIndex={-1} ref={headingRef}>Date and duration changes</h3><p className="help">{changes.length} changed {changes.length === 1 ? 'entry' : 'entries'}, including phase durations, anchor dates and pipeline plan adjustment gaps. Movement shows the calendar weeks and days between the dates.</p>
    <div className="table-scroll" role="region" tabIndex={0} aria-label="Date and duration changes table"><table><thead><tr><th scope="col">Procurement / activity</th><th scope="col">Before</th><th scope="col">Proposed</th><th scope="col">Movement</th></tr></thead><tbody>{changes.map((change, index) => {
      const previous = before.find(plan => plan.id === change.planId)!.phases.find(phase => phase.id === change.phaseId)
      const next = after.find(plan => plan.id === change.planId)!.phases.find(phase => phase.id === previous?.id)
      const note = change.kind === 'phase' ? christmasExplanation(previous, next) : null
      function cell(proposed: boolean) {
        const start = proposed ? change.afterStart : change.beforeStart, end = proposed ? change.afterEnd : change.beforeEnd
        const weeks = change.kind === 'gap' ? start !== null && end !== null ? (end - start) / WEEK : undefined : proposed ? change.afterWeeks : change.beforeWeeks
        const phase = proposed ? next : previous
        const christmas = phase && phase.kind === 'phase' && activeDays(phase.s, phase.e) * DAY < phase.e - phase.s
        return <td>{start === null ? proposed ? 'Gap removed' : 'No gap' : `${formatDate(start)}${end !== null && end !== start ? ` to ${formatDate(end)}` : ''}`}
          {weeks !== undefined && <small className={proposed && change.beforeWeeks !== change.afterWeeks ? 'duration-changed' : ''}>{weeks} {change.kind === 'gap' ? 'calendar ' : christmas ? 'active ' : ''}{weeks === 1 ? 'week' : 'weeks'}{proposed && change.kind === 'phase' && change.beforeWeeks !== change.afterWeeks ? ' (changed)' : ''}</small>}
          {christmas && <small>Christmas and New Year break excluded.</small>}
        </td>
      }
      return <tr key={index}><td><small>{change.planName}</small><strong>{change.label}</strong>{note && <small>{note}</small>}</td>{cell(false)}{cell(true)}<td>{dateMovementSummary(change).map(line => <span key={line}>{line}</span>)}</td></tr>
    })}</tbody></table></div>
  </section>
}

export function AdjustmentFindings({ before, after, rules }: { before: Plan[]; after: Plan[]; rules: OverlapRule[] }) {
  const current = useMemo(() => findClashes(after, rules), [after, rules])
  const previous = useMemo(() => findClashes(before, rules), [before, rules])
  const keys = new Set(current.map(finding => finding.key)), previousKeys = new Set(previous.map(finding => finding.key))
  const resolved = previous.filter(finding => !keys.has(finding.key))
  const entries: { finding: Clash; status: 'New' | 'Remaining' | 'Resolved' }[] = [
    ...current.map(finding => ({ finding, status: previousKeys.has(finding.key) ? 'Remaining' as const : 'New' as const })),
    ...resolved.map(finding => ({ finding, status: 'Resolved' as const })),
  ]
  return <section className="adjustment-findings" aria-label="Clash checks"><h3>Clash checks</h3><FindingCounts findings={current} /><p className="help">Across the full pipeline plan, including dates outside the viewing window.{resolved.length > 0 && ` ${resolved.length} resolved.`}</p>
    {!rules.length ? <p className="help">No clash-checking rules have been set up. Names alone do not create rules.</p> : !entries.length ? <p className="help">No warnings or critical clashes found against the shared Library rules.</p> : <ul className="planning-findings-grid">{entries.map(({ finding, status }) => <FindingCard key={finding.key} finding={finding} status={status} />)}</ul>}
    {current.length > 0 && <p className="help">Findings are advisory. You can apply these adjustments without recording a justification.</p>}
  </section>
}
