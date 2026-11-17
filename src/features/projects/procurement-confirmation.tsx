import { useId } from 'react'
import type { Project } from '../../data/schemas.ts'
import type { Clash } from '../../domain/scheduling.ts'
import { formatDate } from '../../domain/calendar.ts'
import { compareSchedules, comparisonMovementSummary } from '../../domain/comparison.ts'
import { Dialog } from '../../ui/dialog.tsx'
import { Findings, FindingsSummary } from '../../ui/findings.tsx'

export function ProcurementConfirmation({ project, original, findings, hasRules, onClose, onConfirm }: { project: Project; original?: Project; findings: Clash[]; hasRules: boolean; onClose: () => void; onConfirm: () => void }) {
  const formId = useId()
  const phases = project.phases.filter(item => item.kind === 'phase').length
  const milestones = project.phases.length - phases
  return <Dialog title={original ? 'Save procurement changes?' : 'Add procurement to pipeline plan?'} onClose={onClose} focusTitle={findings.length > 0} wide={findings.length > 0} className="flow-dialog procurement-confirm-dialog" footer={<><button className="button" type="button" data-autofocus={findings.length ? undefined : true} onClick={onClose}>{original ? 'Cancel' : 'Back to editing'}</button><button className="button primary" type="submit" form={formId}>{original ? 'Confirm and save' : 'Add to pipeline plan'}</button></>}>
    <form id={formId} onSubmit={event => {
      event.preventDefault()
      onConfirm()
    }}>
    <p>{original ? 'These changes will update this procurement in the working pipeline plan.' : 'This procurement will be added to the pipeline plan.'}</p>
    <dl className="procurement-confirm-summary">
      <div><dt>Procurement</dt><dd><strong>{project.name}</strong></dd></div>
      <div><dt>Schedule</dt><dd>{phases} {phases === 1 ? 'phase' : 'phases'}, {milestones} {milestones === 1 ? 'milestone' : 'milestones'}</dd></div>
      <div><dt>Anchor</dt><dd>{project.anchorName}: {formatDate(project.anchor)}</dd></div>
    </dl>
    {findings.length ? <Findings findings={findings} hasRules={hasRules} /> : <FindingsSummary findings={findings} hasRules={hasRules} />}
    {original && <ul>{compareSchedules({ name: 'Saved', plans: [original] }, { name: 'Proposed', plans: [project] }).map(change => <li key={change.id}>{change.label}: {change.details.join(', ')}{change.before?.start !== undefined && change.after?.start !== undefined && ` — ${comparisonMovementSummary(change, 'Saved', 'Proposed', true).join('; ')}`}</li>)}</ul>}
    <p>{original ? 'After updating this procurement, save the pipeline plan to keep your work.' : 'After adding this procurement, save the pipeline plan to keep your work.'}</p>
    </form>
  </Dialog>
}
