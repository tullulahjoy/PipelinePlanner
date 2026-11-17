import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { projectFormSchema, projectSchema } from '../../data/schemas.ts'
import type { Acknowledgement, LibraryPhase, Project, ProjectForm, ProcurementTemplate } from '../../data/schemas.ts'
import type { WorkingPipeline, WorkspaceContext } from '../../app/workspace-context.ts'
import type { ProcurementDraft } from './procurement-draft.ts'
import { useProcurementDraft } from './use-procurement-draft.ts'
import { useLeaveProtection } from '../../ui/use-leave-protection.ts'
import { focusReview } from '../../ui/focus-review.ts'
import { formatDate, isoDate, parseDate } from '../../domain/calendar.ts'
import { findClashes, moveSelection } from '../../domain/scheduling.ts'
import { scheduleProject } from '../../domain/project.ts'
import { PhaseDialog } from '../library/phase-dialog.tsx'
import { Dialog, ErrorMessage } from '../../ui/dialog.tsx'
import { Findings } from '../../ui/findings.tsx'
import { Timeline } from '../../ui/timeline.tsx'
import { localData } from '../../data/local-data.ts'
import { ScheduleEditor, MilestoneDialog } from './schedule-editor.tsx'
import { useRelationshipReview } from './use-relationship-review.ts'
import { editorItems, scheduleItems } from './schedule-values.ts'
import { ScheduleComparison } from './schedule-comparison.tsx'
import { ScheduleDates } from './schedule-dates.tsx'
import { ProcurementDetailsEditor } from './procurement-details-editor.tsx'
import { ProcurementConfirmation } from './procurement-confirmation.tsx'
import { ProcurementApplyButton } from './procurement-apply-button.tsx'
import './project-editor.css'
import '../library/library.css'

export function ProjectEditor({ workspace, original, recovery, draftContext, savedReference, plans, acknowledgements, onApply, onCancel }: {
  workspace: WorkspaceContext; original?: Project; savedReference?: Project; plans: Project[]; acknowledgements: Acknowledgement[]
  recovery: ProcurementDraft | null; draftContext: WorkingPipeline
  onApply: (project: Project, accepted: Acknowledgement[]) => void; onCancel: () => void
}) {
  const [projectId] = useState(() => recovery?.projectId ?? original?.id ?? crypto.randomUUID())
  const [draftId] = useState(() => recovery?.id ?? crypto.randomUUID())
  const nextId = useRef(recovery?.nextId ?? original?.nextPhaseId ?? 1)
  const phaseCreated = useRef<(() => void) | null>(null)
  const form = useForm<ProjectForm>({ resolver: zodResolver(projectFormSchema), defaultValues: recovery?.values ?? {
    name: original?.name ?? '', anchorDate: original ? isoDate(original.anchor) : '', anchorId: original?.anchorId ?? 0,
    phases: original?.phases.map(phase => ({
      id: phase.id, name: phase.name, kind: phase.kind, weeks: phase.weeks, libraryPhaseId: phase.libraryPhaseId,
      color: phase.color, durationInherited: phase.durationInherited,
      relation: phase.offset < 0 ? 'overlap' : phase.offset > 0 ? 'gap' : 'after', amount: Math.abs(phase.offset),
    })) ?? [],
  } })
  const rows = useFieldArray({ control: form.control, name: 'phases', keyName: 'formKey' })
  const values = useWatch({ control: form.control })
  const relationshipReview = useRelationshipReview(form, recovery?.reviewed)
  const { pending } = relationshipReview
  const [templates, setTemplates] = useState<ProcurementTemplate[]>([])
  const [templateId, setTemplateId] = useState('')
  const [replaceTemplate, setReplaceTemplate] = useState(false)
  const [editingLibraryPhase, setEditingLibraryPhase] = useState<LibraryPhase | undefined>()
  const [details, setDetails] = useState(false)
  const [addingAnchor, setAddingAnchor] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [comparing, setComparing] = useState(false)
  const [group, setGroup] = useState(false)
  const [range, setRange] = useState({ first: 0, last: 0, weeks: 2 })
  const [movement, setMovement] = useState<{ before: ProjectForm; first: number; last: number; weeks: number } | null>(recovery?.movement ?? null)
  const [creatingPhase, setCreatingPhase] = useState(false)
  const [newPhaseName, setNewPhaseName] = useState('')
  const [phaseDirty, setPhaseDirty] = useState(false)
  const [discard, setDiscard] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { let active = true; void localData.listTemplates(workspace.id).then(values => { if (active) setTemplates(values) }).catch(error => { if (active) setError(error.message) }); return () => { active = false } }, [workspace.id])
  const [preview, setPreview] = useState<{ project: Project; plans: Project[]; libraryRevision: number; input: string } | null>(null)
  const [hasPreviewed, setHasPreviewed] = useState(false)
  const reviewHeading = useRef<HTMLHeadingElement>(null)
  const dirty = form.formState.isDirty || phaseDirty || Boolean(recovery)
  const draft = useProcurementDraft(form, { version: 1, id: draftId, workspaceId: workspace.id, projectId, original, context: draftContext, movement, reviewed: [...relationshipReview.reviewed] }, form.formState.isDirty || Boolean(recovery), () => nextId.current)
  function cancel() { draft.clear(); onCancel() }
  useLeaveProtection(dirty, cancel)
  const { setFocus } = form
  useEffect(() => { setFocus('name') }, [setFocus])
  const reviewedInput = preview ? projectFormSchema.safeParse(values) : null
  const currentPreview = preview?.libraryRevision === workspace.library.revision && reviewedInput?.success && JSON.stringify(reviewedInput.data) === preview.input ? preview : null
  useLayoutEffect(() => {
    if (currentPreview) focusReview(reviewHeading.current, reviewHeading.current?.closest<HTMLElement>('.review-card') ?? null)
  }, [currentPreview])
  const findings = currentPreview ? findClashes(currentPreview.plans, workspace.library.rules).filter(finding => finding.firstPlan === projectId || finding.secondPlan === projectId) : []
  const affectedIds = new Set(findings.flatMap(finding => [finding.firstPlan, finding.secondPlan]))
  const affectedPlans = currentPreview ? [currentPreview.project, ...currentPreview.plans.filter(plan => plan.id !== projectId && affectedIds.has(plan.id))] : []
  const hasOtherProcurements = plans.some(plan => plan.id !== projectId)
  const applyReason = !currentPreview
    ? preview && preview.libraryRevision !== workspace.library.revision
      ? 'The Library changed. Preview the schedule again to refresh the checks.'
      : hasPreviewed
        ? 'The schedule changed. Preview again to refresh the dates and checks.'
        : original ? 'Preview your changes before saving this procurement.' : 'Preview the schedule before adding this procurement to the pipeline plan.'
    : ''

  function appendPhase(phase?: LibraryPhase, inherited = true, milestoneName = '') {
    const id = nextId.current++
    rows.append({ id, name: phase?.name ?? milestoneName, kind: phase ? 'phase' : 'milestone', weeks: phase?.weeks ?? 0, libraryPhaseId: phase?.id ?? '', color: phase?.color ?? '#536ea1', durationInherited: Boolean(phase) && inherited, relation: 'after', amount: 0 })
    if (!phase && !form.getValues('anchorId')) form.setValue('anchorId', id, { shouldDirty: true })
    setPreview(null)
    return id
  }

  function move(from: number, to: number) { rows.move(from, to); setPreview(null) }
  function remove(index: number) { rows.remove(index); setPreview(null) }
  const confirmRelationship = relationshipReview.acknowledge

  function calculate(input: ProjectForm) {
    try {
      if (pending.size) throw new Error('Review the highlighted timing relationships after changing the order.')
      if (input.phases.some(phase => phase.kind === 'phase' && !workspace.library.phases.some(source => source.id === phase.libraryPhaseId))) throw new Error('A linked Library phase is no longer available. Edit that schedule item to choose an available Library phase before previewing.')
      const phases = input.phases.map(({ relation, amount, ...phase }, index) => {
        if (relation !== 'after' && amount < 1 && index > 0) throw new Error(`${phase.name}: enter an overlap or gap of at least one week.`)
        return { ...phase, offset: index === 0 || relation === 'after' ? 0 : relation === 'overlap' ? -amount : amount, s: 0, e: 0 }
      })
      const candidate = scheduleProject({ id: projectId, name: input.name, anchor: parseDate(input.anchorDate), planningAnchor: 0, anchorId: input.anchorId, anchorName: phases.find(phase => phase.id === input.anchorId)?.name ?? '', phases, approvedBaseline: null, nextPhaseId: nextId.current })
      const project = projectSchema.parse(candidate)
      const nextPlans = original ? plans.map(plan => plan.id === original.id ? project : plan) : [...plans, project]
      setPreview({ project, plans: nextPlans, libraryRevision: workspace.library.revision, input: JSON.stringify(input) }); setHasPreviewed(true); setError('')
    } catch (failure) { setPreview(null); setError(failure instanceof Error ? failure.message : 'The schedule could not be calculated.') }
  }

  function loadTemplate() {
    const template = templates.find(item => item.id === templateId)
    if (!template) return
    const items = editorItems(template.phases).map(item => ({ ...item, id: nextId.current++ }))
    const anchorIndex = template.phases.findIndex(item => item.id === template.anchorId)
    rows.replace(items); form.setValue('anchorId', items[anchorIndex]?.id ?? 0, { shouldDirty: true }); relationshipReview.reset(items); setPreview(null); setReplaceTemplate(false)
  }
  function applyMovement() {
    try {
      const before = movement?.before ?? structuredClone(form.getValues())
      const phases = scheduleItems(before.phases)
      const candidate = scheduleProject({ id: projectId, name: before.name, anchor: parseDate(before.anchorDate), planningAnchor: 0, anchorId: before.anchorId, anchorName: phases.find(item => item.id === before.anchorId)?.name ?? '', nextPhaseId: nextId.current, approvedBaseline: null, phases })
      const moved = projectSchema.parse(scheduleProject(moveSelection([candidate], { planId: candidate.id, first: range.first, last: range.last }, range.weeks, true)[0]))
      form.setValue('phases', editorItems(moved.phases), { shouldDirty: true }); form.setValue('anchorDate', isoDate(moved.anchor), { shouldDirty: true }); setMovement({ before, ...range }); setPreview(null); setGroup(false); setError('')
    } catch (error) { setError(error instanceof Error ? error.message : 'Review the selected movement.') }
  }
  function removeMovement() {
    if (!movement) return
    try {
      const input = form.getValues(), phases = scheduleItems(input.phases)
      const candidate = scheduleProject({ id: projectId, name: input.name, anchor: parseDate(input.anchorDate), planningAnchor: 0, anchorId: input.anchorId, anchorName: phases.find(item => item.id === input.anchorId)?.name ?? '', nextPhaseId: nextId.current, approvedBaseline: null, phases })
      const restored = projectSchema.parse(scheduleProject(moveSelection([candidate], { planId: projectId, first: movement.first, last: movement.last }, -movement.weeks, true)[0]))
      form.setValue('phases', editorItems(restored.phases), { shouldDirty: true }); form.setValue('anchorDate', isoDate(restored.anchor), { shouldDirty: true }); setMovement(null); setPreview(null); setError('')
    } catch (error) { setError(error instanceof Error ? error.message : 'Review the pending movement before removing it.') }
  }
  return <article className={`project-page ${original ? 'project-edit' : 'project-add'}`}>
    <div className="page-heading"><button className="text-button back-link" onClick={() => dirty ? setDiscard(true) : cancel()}>Back to pipeline plan</button><h1>{original ? 'Edit procurement' : 'Add procurement'}</h1><p>{original ? 'Make your changes, preview their effect on the pipeline plan, then save.' : 'Name your procurement | Build its schedule | Generate its dates | Assess its Impact'}</p></div>
    {draft.error && <p className="notice" role="status">{draft.error}</p>}
    <form id="project-schedule-form" noValidate className="project-form" onChange={() => setPreview(null)} onSubmit={event => void form.handleSubmit(calculate, () => { setPreview(null); setError('Check the highlighted fields. Add schedule items and choose a milestone and anchor date.') })(event)}>
      <section className="planning-card"><div className="editor-card-heading"><span className="section-number">01</span><div><h2>{original ? 'Procurement details' : 'Name your procurement'}</h2>{!original && <p>Build this procurement’s schedule from phases and an anchor date.</p>}</div>{original && <button type="button" className="button" onClick={() => setDetails(true)}>Edit details</button>}</div>{original ? <dl className="procurement-summary"><div><dt>Procurement</dt><dd>{values.name}</dd></div><div><dt>Anchor milestone</dt><dd>{values.phases?.find(item => item.id === values.anchorId)?.name}</dd></div><div><dt>Anchor date</dt><dd>{values.anchorDate && formatDate(parseDate(values.anchorDate))}</dd></div></dl> : <div className="editor-card-body"><label className="field">Procurement name<input {...form.register('name')} aria-invalid={Boolean(form.formState.errors.name)} placeholder="Enter procurement name" /></label><span className="field-error">{form.formState.errors.name?.message}</span></div>}</section>
      <section className="planning-card"><div className="editor-card-heading"><span className="section-number">02</span><div><h2>{original ? 'Phases and milestones' : 'Build the schedule'}</h2><p>{original ? 'Adjust weeks and timing here. Use Edit for a name, Library link or shared clash-checking rules.' : 'Choose a template or add phases individually. Adjust durations and relationships, then set the anchor and preview to calculate dates.'}</p></div>{original && <button type="button" className="button" onClick={() => { setRange(movement ? { first: movement.first, last: movement.last, weeks: movement.weeks } : { first: 0, last: 0, weeks: 2 }); setGroup(true) }}>Move several phases</button>}</div>

        <ScheduleEditor toolbar={!original && <div className="template-tools"><label className="field">Start from a template (optional)<select value={templateId} onChange={event => setTemplateId(event.target.value)}><option value="">Choose a template</option>{templates.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><button type="button" className="button" disabled={!templateId} onClick={() => rows.fields.length ? setReplaceTemplate(true) : loadTemplate()}>Use template</button></div>} form={form} rows={rows} library={workspace.library} checks={relationshipReview.checks} onMove={move} onRemove={remove} onReview={confirmRelationship} onAdd={appendPhase} onCreate={(done, name) => { phaseCreated.current = done; setNewPhaseName(name); setEditingLibraryPhase(undefined); setCreatingPhase(true) }} onEditLibrary={phase => { phaseCreated.current = null; setEditingLibraryPhase(phase); setCreatingPhase(true) }} editing={Boolean(original)} />
      </section>
      {!original && <section className="planning-card"><div className="editor-card-heading"><span className="section-number">03</span><div><h2>Anchor date and preview</h2><p>The anchor is a named milestone with a fixed date that the schedule is planned around, such as service responsibility transferring. Select a milestone from the schedule or add one at the relevant position.</p></div></div><div className="editor-card-body"><div className="anchor-grid"><label className="field">Anchor date<input type="date" {...form.register('anchorDate')} aria-invalid={Boolean(form.formState.errors.anchorDate)} /></label><label className="field">Anchor milestone<select {...form.register('anchorId', { valueAsNumber: true })} value={values.anchorId ?? 0} aria-invalid={Boolean(form.formState.errors.anchorId)}><option value={0}>Choose a milestone</option>{rows.fields.filter(item => item.kind === 'milestone').map(item => <option key={item.id} value={item.id}>{values.phases?.find(phase => phase?.id === item.id)?.name || 'Unnamed milestone'}</option>)}</select></label><div className="field"><span>Need a different milestone?</span><button type="button" className="button" onClick={() => setAddingAnchor(true)}>+ Add anchor milestone</button></div></div><p className="supporting-text">The anchor is a milestone with no duration. It is plotted on Monday of the entered date’s week; the entered date stays recorded. A phase can start on that same Monday.</p></div></section>}

      {movement && <div className="movement-summary"><p>{Math.abs(movement.weeks)} weeks {movement.weeks < 0 ? 'earlier' : 'later'}: items {movement.first + 1} to {movement.last + 1}.</p><button type="button" className="text-button" onClick={() => setGroup(true)}>Edit movement</button><button type="button" className="text-button" onClick={removeMovement}>Remove movement</button></div>}
      <ErrorMessage message={error} />
    </form>
    {preview && !currentPreview && <p className="notice" role="status">{preview.libraryRevision !== workspace.library.revision ? 'The Library changed. Preview the schedule again to refresh the checks.' : 'The schedule changed. Preview again to refresh the dates and checks.'}</p>}
    <section className={`review-stage${currentPreview || original ? ' has-review' : ''}`} aria-label="Procurement review">
    {currentPreview && <section className="planning-card review-card" aria-labelledby="schedule-review-title"><div className="editor-card-heading review-stage-heading"><div><h2 ref={reviewHeading} id="schedule-review-title" tabIndex={-1}>Review the schedule</h2><p>{original ? 'Check the proposed timeline, date changes and findings before saving your changes.' : hasOtherProcurements ? 'Review the timeline, exact dates and clash checks against other procurements before adding this procurement.' : 'Review the timeline and exact dates before adding your first procurement.'}</p></div></div><div className="review-stage-content">
      <div className="review-tools"><h3>Timeline</h3></div>
      {savedReference && comparing ? <ScheduleComparison before={savedReference} after={currentPreview.project} library={workspace.library} /> : <Timeline key={JSON.stringify(currentPreview.project)} plans={[currentPreview.project]} rules={workspace.library.rules} />}
      {original && savedReference && <div className="schedule-comparison-toggle"><button type="button" className="button" aria-expanded={comparing} onClick={() => setComparing(!comparing)}>{comparing ? 'Hide comparison' : 'Compare with saved schedule'}</button></div>}
      <ScheduleDates before={original} after={currentPreview.project} />
      <section className="procurement-impact" aria-label="Clash checks"><div className="clash-check-heading"><h3>Clash checks</h3><p>Checks for problematic overlaps with other procurements.</p></div><div className="clash-check-content">
        {!hasOtherProcurements ? <p>{original ? 'There are no other procurements in this pipeline plan to check for clashes.' : 'This is your first procurement. There are no other procurements to check for clashes.'}</p> : <p>Checks compare this proposed schedule with the other procurements in the pipeline plan. Any findings below involve <strong>{currentPreview.project.name}</strong>.</p>}
        {affectedPlans.length > 1 && <><p><strong>Proposed procurement: {currentPreview.project.name}</strong>. Shown first, alongside the procurements it overlaps with.</p><Timeline plans={affectedPlans} rules={workspace.library.rules} /></>}
        {!workspace.library.rules.length ? <p>No clash-checking rules have been set up. You can add these in <Link to={`/workspaces/${workspace.id}/library`}>Library</Link>.</p> : findings.length > 0 ? <Findings findings={findings} hasRules headingLevel={4} /> : hasOtherProcurements && <p>No warnings or critical clashes found against the shared Library rules.</p>}
        {findings.some(finding => finding.severity === 'critical') && <p>Choose <strong>{original ? 'Save changes' : 'Add procurement to pipeline plan'}</strong> to review these clashes before confirming.</p>}
      </div></section>
      </div>
    </section>}
    {original && !currentPreview && <section className="planning-card review-card"><div className="editor-card-heading"><div><h2>Review the schedule</h2><p>Preview your changes to review the proposed timeline, dates and findings.</p></div></div><div className="review-stage-content"><h3>Saved schedule</h3><p>The saved schedule is shown below.</p><Timeline plans={[original]} rules={workspace.library.rules} /></div></section>}
    <footer className="project-actions">{currentPreview && <p className="review-save-note">{original ? 'Changes update this procurement in your working pipeline plan. Save the pipeline plan afterwards to keep your changes.' : 'Adding places this procurement on your working pipeline plan. Save the pipeline plan afterwards to keep your changes.'}</p>}<div className="actions project-action-buttons"><button className="button" type="button" onClick={() => dirty ? setDiscard(true) : cancel()}>Cancel</button><button className={`button${currentPreview ? '' : ' primary'}`} type="submit" form="project-schedule-form">{currentPreview ? 'Update preview' : original ? 'Preview changes' : 'Preview schedule'}</button><ProcurementApplyButton label={original ? 'Save changes' : 'Add procurement to pipeline plan'} reason={applyReason} onApply={() => setConfirming(true)} /></div></footer>
    </section>
    {creatingPhase && <PhaseDialog workspaceId={workspace.id} library={workspace.library} original={editingLibraryPhase} initialName={newPhaseName} addToProcurement={!editingLibraryPhase} onDirty={setPhaseDirty} onClose={() => { setCreatingPhase(false); setPhaseDirty(false) }} onCreated={async (library, phase) => { workspace.acceptLibrary(library); if (!editingLibraryPhase) { appendPhase(phase); phaseCreated.current?.(); phaseCreated.current = null } setCreatingPhase(false); setPhaseDirty(false) }} />}
    {discard && <Dialog title="Discard procurement changes?" onClose={() => setDiscard(false)}><p>The working pipeline plan will retain its previous contents. Any Library phases you explicitly created remain in the Library.</p><div className="actions"><button className="button" data-autofocus onClick={() => setDiscard(false)}>Keep editing</button><button className="button danger" onClick={cancel}>Discard procurement changes</button></div></Dialog>}
    {addingAnchor && <MilestoneDialog onClose={() => setAddingAnchor(false)} onAdd={name => { const id = appendPhase(undefined, false, name); form.setValue('anchorId', id, { shouldDirty: true, shouldValidate: true }); setAddingAnchor(false) }} />}
    {replaceTemplate && <Dialog title="Replace this schedule?" onClose={() => setReplaceTemplate(false)}><p>The selected template will replace the current phases, milestones, durations, relationships and anchor selection. The procurement name and anchor date will be kept.</p><div className="actions"><button type="button" className="button" data-autofocus onClick={() => setReplaceTemplate(false)}>Keep current schedule</button><button type="button" className="button primary" onClick={loadTemplate}>Replace schedule</button></div></Dialog>}
    {details && <ProcurementDetailsEditor values={form.getValues()} onClose={() => setDetails(false)} onApply={next => { form.setValue('name', next.name, { shouldDirty: true }); form.setValue('anchorDate', next.anchorDate, { shouldDirty: true }); form.setValue('anchorId', next.anchorId, { shouldDirty: true }); setDetails(false); setPreview(null) }} />}
    {group && <Dialog title="Move several phases" onClose={() => setGroup(false)}><p>Choose consecutive phases to move together. Durations and internal relationships are retained. Activity outside the group stays in place, including the anchor milestone.</p><div className="form-columns">{(['first', 'last'] as const).map(key => <label className="field" key={key}>{key === 'first' ? 'First phase' : 'Last phase'}<select value={range[key]} onChange={event => setRange({ ...range, [key]: Number(event.target.value) })}>{values.phases?.map((item, index) => <option key={item.id} value={index}>{item.name}</option>)}</select></label>)}</div><div className="form-columns"><label className="field">Direction<select value={range.weeks < 0 ? 'earlier' : 'later'} onChange={event => setRange({ ...range, weeks: Math.abs(range.weeks || 1) * (event.target.value === 'earlier' ? -1 : 1) })}><option value="earlier">Earlier</option><option value="later">Later</option></select></label><label className="field">Whole weeks<input type="number" min={1} max={104} value={Math.abs(range.weeks)} onChange={event => setRange({ ...range, weeks: Number(event.target.value) * (range.weeks < 0 ? -1 : 1) })} /></label></div><ErrorMessage message={error} /><div className="actions"><button type="button" className="button" onClick={() => setGroup(false)}>Cancel</button><button type="button" className="button primary" onClick={applyMovement}>Apply movement</button></div></Dialog>}
    {confirming && currentPreview && <ProcurementConfirmation project={currentPreview.project} original={original} findings={findings} hasRules={workspace.library.rules.length > 0} onClose={() => setConfirming(false)} onConfirm={() => { onApply(currentPreview.project, acknowledgements); draft.clear() }} />}
  </article>
}
