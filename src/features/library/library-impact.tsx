import { useLayoutEffect, useRef, useState } from 'react'
import type { Acknowledgement, Library, Project } from '../../data/schemas.ts'
import { durationCandidates, previewDurationUpdates } from '../../domain/library-updates.ts'
import { parseDate, isoDate, formatDate } from '../../domain/calendar.ts'
import { compareSchedules, comparisonMovementSummary, christmasExplanation } from '../../domain/comparison.ts'
import { findClashes } from '../../domain/scheduling.ts'
import { Dialog, ErrorMessage } from '../../ui/dialog.tsx'
import { Findings } from '../../ui/findings.tsx'
import { focusReview } from '../../ui/focus-review.ts'

export function LibraryImpact({ plans, library, acknowledgements, phaseId, pipelineName, onClose, onApply }: { plans: Project[]; library: Library; acknowledgements: Acknowledgement[]; phaseId?: string; pipelineName: string; onClose: () => void; onApply: (plans: Project[], acknowledgements: Acknowledgement[], saveAfter: boolean) => void }) {
  const [today] = useState(() => parseDate(isoDate(Date.now())))
  const candidates = durationCandidates(plans, library, today, phaseId)
  const [selected, setSelected] = useState<string[]>([])
  const [preview, setPreview] = useState<{ plans: Project[]; revision: number } | null>(null)
  const [error, setError] = useState('')
  const reviewHeading = useRef<HTMLHeadingElement>(null)
  const current = preview?.revision === library.revision ? preview.plans : null
  useLayoutEffect(() => { if (current) focusReview(reviewHeading.current) }, [current])
  const changes = current ? compareSchedules({ name: 'Before', plans }, { name: 'Proposed', plans: current }) : []
  const findings = current ? findClashes(current, library.rules) : []
  function apply(saveAfter: boolean) {
    if (!current) return
    try { onApply(previewDurationUpdates(plans, library, selected, today), acknowledgements, saveAfter) }
    catch (error) { setError(error instanceof Error ? error.message : 'Review the selected updates.') }
  }
  return <Dialog title="Review Library timing updates" onClose={onClose} wide className="flow-dialog">
    <p><strong>Pipeline Plan: {pipelineName}</strong></p>
    <p>Select future activities that still use Library durations. Past or started activities and custom durations are protected. Nothing is saved automatically.</p>
    {candidates.length ? <fieldset><legend>Activities with different Library durations</legend>{candidates.map(item => {
      const key = `${item.planId}:${item.phaseId}`
      return <label className="impact-choice" key={key}><input type="checkbox" disabled={!item.eligible} checked={selected.includes(key)} onChange={event => { setSelected(event.target.checked ? [...selected, key] : selected.filter(value => value !== key)); setPreview(null) }} /><span>{item.planName} — {item.phaseName}: {item.before} → {item.after} weeks{item.reason && <small>{item.reason}</small>}</span></label>
    })}</fieldset> : <p>No Library duration updates are available for this pipeline plan.</p>}
    <ErrorMessage message={error} />
    {preview && !current && <p role="status">The Library changed. Preview the selected updates again.</p>}
    {current && <><h3 ref={reviewHeading} tabIndex={-1}>Proposed schedule changes</h3>{plans.map(before => {
      const after = current.find(item => item.id === before.id)!
      const rows = changes.filter(item => item.planId === before.id)
      return rows.length > 0 && <details key={before.id}><summary>{before.name} — {rows.length} schedule changes</summary><div className="table-scroll" tabIndex={0} role="region" aria-label={`${before.name} timing changes`}><table><thead><tr><th>Activity</th><th>Before</th><th>Proposed</th><th>What changed</th></tr></thead><tbody>{rows.map(row => {
        const phaseId = Number(row.id.split(':').at(-1))
        const phase = after.phases.find(item => item.id === phaseId), old = before.phases.find(item => item.id === phaseId)
        const note = phase ? christmasExplanation(old, phase) : null
        return <tr key={row.id}><th>{row.label}</th><td>{row.before?.start !== undefined ? formatDate(row.before.start) : '—'}{row.before?.end !== undefined && ` to ${formatDate(row.before.end)}`}{row.before?.weeks !== undefined && <small>{row.before.weeks} active weeks</small>}</td><td>{row.after?.start !== undefined ? formatDate(row.after.start) : '—'}{row.after?.end !== undefined && ` to ${formatDate(row.after.end)}`}{row.after?.weeks !== undefined && <small>{row.after.weeks} active weeks</small>}</td><td>{comparisonMovementSummary(row, 'Before', 'Proposed', true).join('; ')}{row.details.includes('Duration changed') && <small>Phase duration updated from Library</small>}{note && <small>{note}</small>}</td></tr>
      })}</tbody></table></div></details>
    })}<Findings findings={findings} hasRules={library.rules.length > 0} /><p>Apply updates to keep working, or choose Apply and save to open the Save dialog. Notes are optional.</p></>}
    <div className="actions"><button type="button" className="button" data-autofocus onClick={onClose}>Cancel</button><button type="button" className="button" disabled={!selected.length} onClick={() => { try { setPreview({ plans: previewDurationUpdates(plans, library, selected, today), revision: library.revision }); setError('') } catch (error) { setPreview(null); setError(error instanceof Error ? error.message : 'Review the selected updates.') } }}>Preview selected updates</button><button type="button" className="button" disabled={!current} onClick={() => apply(false)}>Apply updates</button><button type="button" className="button primary" disabled={!current} onClick={() => apply(true)}>Apply and save...</button></div>
  </Dialog>
}
