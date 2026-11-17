import { useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { UseFormReturn, UseFieldArrayReturn } from 'react-hook-form'
import { useWatch } from 'react-hook-form'
import type { Library, LibraryPhase, ProjectForm } from '../../data/schemas.ts'
import { relationshipDescription } from '../../domain/relationships.ts'
import { Dialog } from '../../ui/dialog.tsx'
import { PhaseBrowser, RuleSummary, CompactRuleSummary } from '../library/phase-browser.tsx'
import { useScheduleReorder } from './use-schedule-reorder.ts'
import './schedule-editor.css'

type Props = {
  form: UseFormReturn<ProjectForm>; rows: UseFieldArrayReturn<ProjectForm, 'phases', 'formKey'>; library: Library
  checks: Map<number, { error: string; oldName: string; newName: string }>
  onMove: (from: number, to: number) => void; onRemove: (index: number) => void; onReview: (id: number) => void
  onAdd: (phase?: LibraryPhase, inherited?: boolean, milestoneName?: string) => void; onCreate: (onCreated: () => void, initialName: string) => void; onEditLibrary: (phase: LibraryPhase) => void
  editing?: boolean; toolbar?: ReactNode
}

export function ScheduleEditor({ form, rows, library, checks, onMove, onRemove, onReview, onAdd, onCreate, onEditLibrary, toolbar }: Props) {
  const hintId = useId()
  const [browser, setBrowser] = useState(false)
  const [milestone, setMilestone] = useState(false)
  const [settings, setSettings] = useState<number | null>(null)
  const [snapshot, setSnapshot] = useState<ProjectForm['phases'][number] | null>(null)
  const values = useWatch({ control: form.control, name: 'phases' })
  const items = rows.fields.map(field => values.find(item => item.id === field.id) ?? field)
  const { scroll, status } = useScheduleReorder(items, onMove)
  const relationshipCells = useRef(new Map<number, HTMLTableCellElement>())
  const controls = <><button type="button" className="button primary" onClick={() => setBrowser(true)}>+ Add phase</button><button type="button" className="button" onClick={() => setMilestone(true)}>+ Add milestone</button></>
  const selected = settings === null ? undefined : values[settings]
  function cancelSettings() { if (settings !== null && snapshot) form.setValue(`phases.${settings}`, snapshot, { shouldDirty: true }); setSettings(null) }
  function firstCheck() {
    const cell = relationshipCells.current.get(checks.keys().next().value!)
    cell?.scrollIntoView({ block: 'center', behavior: 'smooth' }); cell?.querySelector('select')?.focus({ preventScroll: true })
  }
  return <>
    <div className="schedule-toolbar">{toolbar}<div className="schedule-add-controls" role="group" aria-label="Add to procurement schedule">{controls}</div></div>
    {!rows.fields.length && <div className="schedule-empty"><strong>Your schedule starts here</strong><p>Choose Add phase to browse the Library or create a phase, or use a template. Dates are calculated when you preview.</p></div>}
    {rows.fields.length > 0 && <>
      <p className="schedule-edit-scope">Durations, order and timing between items are specific to this procurement. Library phases and templates are unchanged by those edits.</p>
      {checks.size > 0 && <div className="relationship-summary" role="status"><strong>{checks.size} {checks.size === 1 ? 'relationship needs' : 'relationships need'} review. </strong><button className="text-button" type="button" onClick={firstCheck}>Review first check</button></div>}
      <div ref={scroll} className="table-scroll" tabIndex={0} role="region" aria-label="Procurement schedule"><table className="schedule-editor-table"><thead><tr><th scope="col">#</th><th scope="col">Phase / milestone</th><th scope="col">Duration (weeks)</th><th scope="col">Within this procurement<small>Timing relative to previous item</small></th><th scope="col">Actions</th></tr></thead><tbody>{items.map((item, index) => {
        const field = rows.fields[index], source = library.phases.find(phase => phase.id === item.libraryPhaseId), check = checks.get(item.id)
        return <tr key={field.formKey} data-item-id={item.id}>
          <td>{index + 1}</td>
          <td><div className="schedule-phase-name">{item.kind === 'phase' && <span className="colour-swatch" style={{ backgroundColor: item.color }} aria-hidden="true" />}<strong className="phase-label">{item.name}</strong></div><small>{item.kind === 'milestone' ? 'Milestone' : source ? <>Library: <button type="button" className="text-button library-phase-link" onClick={() => onEditLibrary(source)} aria-label={`View Library phase: ${source.name}`}>{source.name}</button><LibraryPhaseInfo /></> : 'Library: Unknown phase'}</small>{item.kind === 'phase' && <CompactRuleSummary library={library} phaseId={item.libraryPhaseId} />}<span className="field-error">{form.formState.errors.phases?.[index]?.name?.message}</span></td>
          <td>{item.kind === 'milestone' ? '—' : <><label className="field"><span className="sr-only">Item {index + 1} duration in weeks</span><input type="number" min={1} max={5200} {...form.register(`phases.${index}.weeks`, { valueAsNumber: true, onChange: () => form.setValue(`phases.${index}.durationInherited`, false, { shouldDirty: true }) })} /></label><div className="duration-provenance">{item.durationInherited ? 'Library default' : <>Custom{source && <> · <button type="button" className="text-button" onClick={() => { form.setValue(`phases.${index}.weeks`, source.weeks, { shouldDirty: true }); form.setValue(`phases.${index}.durationInherited`, true, { shouldDirty: true }) }}>Reset to {source.weeks} {source.weeks === 1 ? 'week' : 'weeks'}</button></>}</>}</div><span className="field-error">{form.formState.errors.phases?.[index]?.weeks?.message}</span></>}</td>
          <td ref={cell => { if (cell) relationshipCells.current.set(item.id, cell); else relationshipCells.current.delete(item.id) }} className={check ? 'needs-review' : ''}>
            {(index > 0 || item.relation !== 'after') && <div className="schedule-relationship"><label className="field"><span className="sr-only">Item {index + 1} relationship</span><select {...form.register(`phases.${index}.relation`)} onChange={event => { const relation = event.target.value as ProjectForm['phases'][number]['relation']; form.setValue(`phases.${index}.relation`, relation, { shouldDirty: true, shouldValidate: true }); form.setValue(`phases.${index}.amount`, relation === 'after' ? 0 : Math.max(1, item.amount), { shouldDirty: true, shouldValidate: true }); onReview(item.id) }}><option value="after">{index === 0 ? 'First item' : 'After previous item'}</option><option value="overlap">Overlap previous item</option><option value="gap">Gap before</option></select></label>{item.relation !== 'after' && <label className="relationship-amount"><span className="sr-only">{item.relation === 'overlap' ? 'Overlap weeks' : 'Gap weeks'}</span><input type="number" min={1} max={104} aria-invalid={Boolean(check?.error || form.formState.errors.phases?.[index]?.amount)} {...form.register(`phases.${index}.amount`, { valueAsNumber: true, onChange: () => onReview(item.id) })} /><span aria-hidden="true">weeks</span></label>}</div>}
            <p className={`relationship-description${index === 0 && item.relation === 'after' ? ' schedule-start' : ''}`}>{index === 0 && item.relation === 'after' ? 'Schedule starts here' : relationshipDescription(items, index)}</p>
            {check && <div className={`relationship-note${check.error ? ' relationship-error' : ''}`}><h4>{check.error ? 'Check timing' : 'Check timing after reordering'}</h4>{check.error ? <p>{check.error}</p> : item.relation === 'overlap' ? <><p><strong>Previously:</strong> {item.amount}-week overlap with {check.oldName}</p><p><strong>Now:</strong> {item.amount}-week overlap with {check.newName}</p></> : <p>{`Previously after ${check.oldName}. Now after ${check.newName}. ${item.amount} active weeks pipeline plan adjustment gap.`}</p>}{!check.error && <button type="button" className="button" onClick={() => onReview(item.id)}>{item.relation === 'overlap' ? `Keep overlap with ${check.newName}` : 'Keep this relationship'}</button>}</div>}
          </td>
          <td><div className="row-actions"><button type="button" className="button" aria-label={`Edit phase: ${item.name}`} onClick={() => { setSnapshot(structuredClone(form.getValues(`phases.${index}`))); setSettings(index) }}>Edit</button><span className="schedule-action-hint"><button type="button" className="row-remove" aria-label={`Remove ${item.kind}: ${item.name}`} aria-describedby={`${hintId}-remove-${item.id}`} onClick={() => onRemove(index)}>×</button><span role="tooltip" id={`${hintId}-remove-${item.id}`}>{`Remove ${item.kind}`}</span></span><span className="schedule-action-hint"><button type="button" className="drag-handle" data-drag-item={item.id} aria-describedby={`${hintId}-move-${item.id}`} aria-label={`Move ${item.name}. Hold to drag, or press Space then arrow keys.`} aria-pressed={false}>⠿</button><span role="tooltip" id={`${hintId}-move-${item.id}`}>Drag to reorder. Keyboard: Space, arrow keys, Space to drop.</span></span></div></td>
        </tr>
      })}</tbody></table></div>
      <div className="schedule-bottom-tools"><div className="schedule-bottom-add" role="group" aria-label="Add another step to the procurement schedule">{controls}</div><div className="schedule-reorder-help"><p className="supporting-text">Overlap and gap amounts exclude Christmas pauses. Use the grip to reorder rows. Keyboard: Space, arrow keys, Space to drop.</p><p className="reorder-status" role="status">{status}</p></div></div>
    </>}
    {browser && <PhaseBrowser library={library} onClose={() => setBrowser(false)} onCreate={name => onCreate(() => setBrowser(false), name)} onAdd={(phase, inherited) => { onAdd(phase, inherited); setBrowser(false) }} />}
    {milestone && <MilestoneDialog onClose={() => setMilestone(false)} onAdd={name => { onAdd(undefined, false, name); setMilestone(false) }} />}
    {selected && settings !== null && <Dialog title={selected.kind === 'phase' ? 'Edit phase' : 'Edit milestone'} className="schedule-item-dialog" onClose={cancelSettings} footer={<><button type="button" className="button" onClick={cancelSettings}>Cancel</button><button type="button" className="button primary" onClick={() => setSettings(null)}>Done</button></>}>
      <p className="schedule-item-scope">{selected.kind === 'phase' ? 'Changes to the name or Library link here apply only to this schedule.' : 'Changes to the name here apply only to this schedule.'}</p>
      <div className="schedule-item-fields"><label className="field">Name<input data-autofocus {...form.register(`phases.${settings}.name`)} /></label>
        {selected.kind === 'phase' && <div><label className="field">Library phase<select aria-describedby={`${hintId}-library-link`} value={selected.libraryPhaseId} onChange={event => { const phase = library.phases.find(item => item.id === event.target.value); if (phase) {
          form.setValue(`phases.${settings}.libraryPhaseId`, phase.id, { shouldDirty: true });
          form.setValue(`phases.${settings}.durationInherited`, false, { shouldDirty: true })
        } }}><option value="">Choose a phase</option>{library.phases.map(phase => <option value={phase.id} key={phase.id}>{phase.name}</option>)}</select></label><p className="schedule-item-link-note" id={`${hintId}-library-link`}>The linked Library phase supplies this item's shared clash-checking rules.</p></div>}
      </div>
      {selected.kind === 'phase' && <section className="schedule-item-rules" aria-label="Clash-checking rules"><h3>Clash-checking rules</h3><div className="schedule-item-rules-content"><RuleSummary library={library} phaseId={selected.libraryPhaseId} /><p>Changes to shared clash-checking rules apply across pipeline plans.</p><button type="button" className="button" onClick={() => { const phase = library.phases.find(item => item.id === selected.libraryPhaseId); if (phase) onEditLibrary(phase) }}>Edit Library phase and rules</button></div></section>}
    </Dialog>}
  </>
}

function LibraryPhaseInfo() {
  const id = useId()
  const button = useRef<HTMLButtonElement>(null)
  const tooltip = useRef<HTMLSpanElement>(null)
  function show() {
    const element = tooltip.current, trigger = button.current
    if (!element || !trigger) return
    element.showPopover()
    const bounds = trigger.getBoundingClientRect()
    element.style.left = `${Math.max(8, Math.min(bounds.left, innerWidth - element.offsetWidth - 8))}px`
    element.style.top = `${bounds.bottom + 8 + element.offsetHeight > innerHeight ? Math.max(8, bounds.top - element.offsetHeight - 8) : bounds.bottom + 8}px`
  }
  function hide() { tooltip.current?.hidePopover() }
  return <span className="library-phase-info" onMouseEnter={show} onMouseLeave={() => { if (document.activeElement !== button.current) hide() }}><button ref={button} type="button" className="library-info-button" aria-label="About linked Library phases" aria-describedby={id} onFocus={show} onBlur={hide} onClick={show}><svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6.5" stroke="currentColor" /><path d="M8 7v4" stroke="currentColor" strokeWidth="1.5" /><circle cx="8" cy="4.5" r=".8" fill="currentColor" /></svg></button><span ref={tooltip} id={id} role="tooltip" popover="auto" className="library-info-tooltip">You can customise this phase’s name for this procurement. While linked to the Library phase, it keeps its shared clash-checking rules. Its duration can use the Library default or be customised for this procurement.</span></span>
}

export function MilestoneDialog({ onClose, onAdd, anchor = false }: { onClose: () => void; onAdd: (name: string) => void; anchor?: boolean }) {
  const [name, setName] = useState('')
  const title = anchor ? 'Add anchor milestone' : 'Add milestone'
  return <Dialog title={title} onClose={onClose}><label className="field">Milestone name<input data-autofocus value={name} maxLength={150} onChange={event => setName(event.target.value)} /></label><p>{anchor ? 'This milestone will be selected as the anchor. You can move it to the relevant position in the schedule.' : 'Milestones have no duration. Choose one as the anchor after adding it to the schedule.'}</p><div className="actions"><button type="button" className="button" onClick={onClose}>Cancel</button><button type="button" className="button primary" disabled={!name.trim()} onClick={() => onAdd(name.trim())}>{title}</button></div></Dialog>
}
