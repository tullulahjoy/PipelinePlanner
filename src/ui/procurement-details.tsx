import { useLayoutEffect } from 'react'
import type { ReactNode } from 'react'
import type { Plan } from '../domain/scheduling.ts'
import { finishDate, planGaps } from '../domain/scheduling.ts'
import { formatDate, WEEK } from '../domain/calendar.ts'
import { Dialog } from './dialog.tsx'
import { closeTimelineDetails } from './timeline-details.ts'

export function ProcurementLink({ id, name, href, viewing = false, action = false, onSelect, children }: {
  id: string; name: string; href: string; viewing?: boolean; action?: boolean; onSelect: (id: string) => void; children?: ReactNode
}) {
  return <a className={action ? 'button' : undefined} href={href} aria-label={`${viewing ? 'View details for' : 'Edit'} ${name}`} onClick={event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
    event.preventDefault(); closeTimelineDetails(); onSelect(id)
  }}>{children ?? name}</a>
}

export function ProcurementDetails({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  useLayoutEffect(closeTimelineDetails, [])
  return <Dialog title={plan.name} onClose={onClose} wide>
    <div className="recorded-anchor"><strong>Anchor: {formatDate(plan.anchor)}</strong><p>{plan.anchorName}. Plotted on Monday {formatDate(plan.planningAnchor)} for weekly planning.</p></div>
    <div className="table-scroll" tabIndex={0} role="region" aria-label="Procurement schedule table"><table>
      <caption className="sr-only">{plan.name} schedule</caption><thead><tr><th scope="col">Phase or milestone</th><th scope="col">Start</th><th scope="col">Finish</th><th scope="col">Duration</th></tr></thead>
      <tbody>{plan.phases.map(phase => <tr key={phase.id}><th scope="row">{phase.name}{phase.id === plan.anchorId && <small>Anchor milestone</small>}</th><td>{formatDate(phase.id === plan.anchorId ? plan.anchor : phase.s)}</td><td>{formatDate(phase.id === plan.anchorId ? plan.anchor : finishDate(phase))}</td><td>{phase.kind === 'milestone' ? 'Milestone' : `${phase.weeks} active ${phase.weeks === 1 ? 'week' : 'weeks'}`}</td></tr>)}
        {planGaps(plan).map(gap => <tr key={gap.id} className="gap-change"><th scope="row">{gap.label}</th><td>{formatDate(gap.s)}</td><td>{formatDate(gap.e)}</td><td>{(gap.e - gap.s) / WEEK} calendar weeks</td></tr>)}
      </tbody>
    </table></div>
    <button className="button" data-autofocus onClick={onClose}>Close details</button>
  </Dialog>
}
