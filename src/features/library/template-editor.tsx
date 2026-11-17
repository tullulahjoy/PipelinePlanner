import { useEffect, useId, useRef, useState } from 'react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import type { ProcurementTemplate, ProjectForm, LibraryPhase } from '../../data/schemas.ts'
import type { WorkspaceContext } from '../../app/workspace-context.ts'
import { localData } from '../../data/local-data.ts'
import { useLeaveProtection } from '../../ui/use-leave-protection.ts'
import { ErrorMessage, Dialog } from '../../ui/dialog.tsx'
import { PhaseDialog } from './phase-dialog.tsx'
import { ScheduleEditor, MilestoneDialog } from '../projects/schedule-editor.tsx'
import { useRelationshipReview } from '../projects/use-relationship-review.ts'
import { editorItems, scheduleItems } from '../projects/schedule-values.ts'

export function TemplateEditor({ workspace, original, onClose, onSaved }: { workspace: WorkspaceContext; original?: ProcurementTemplate; onClose: () => void; onSaved: (record: ProcurementTemplate) => void }) {
  const [id] = useState(() => original?.id ?? crypto.randomUUID())
  const anchorFieldId = useId()
  const [revision, setRevision] = useState(workspace.library.revision)
  const nextId = useRef(Math.max(0, ...original?.phases.map(phase => phase.id) ?? []) + 1)
  const phaseCreated = useRef<(() => void) | null>(null)
  const form = useForm<ProjectForm>({ defaultValues: { name: original?.name ?? '', anchorDate: '2030-01-07', anchorId: original?.anchorId ?? 0, phases: original ? editorItems(original.phases) : [] } })
  const rows = useFieldArray({ control: form.control, name: 'phases', keyName: 'formKey' })
  const items = useWatch({ control: form.control, name: 'phases' })
  const anchorId = useWatch({ control: form.control, name: 'anchorId' })
  const [addingAnchor, setAddingAnchor] = useState(false)
  const [description, setDescription] = useState(original?.description ?? '')
  const relationshipReview = useRelationshipReview(form)
  const { pending } = relationshipReview
  const [phase, setPhase] = useState<{ original?: LibraryPhase; initialName?: string } | null>(null)
  const [phaseDirty, setPhaseDirty] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [discard, setDiscard] = useState(false)
  const dirty = form.formState.isDirty || description !== (original?.description ?? '') || phaseDirty
  useLeaveProtection(dirty, onClose)
  useEffect(() => { form.setFocus('name') }, [form])
  function add(source?: LibraryPhase, inherited = true, milestoneName = '') {
    const itemId = nextId.current++
    rows.append({ id: itemId, name: source?.name ?? milestoneName, kind: source ? 'phase' : 'milestone', weeks: source?.weeks ?? 0, color: source?.color ?? '#536ea1', libraryPhaseId: source?.id ?? '', durationInherited: Boolean(source) && inherited, relation: 'after', amount: 0 })
    if (!source && !form.getValues('anchorId')) selectAnchor(itemId)
    return itemId
  }
  function selectAnchor(itemId: number) {
    form.setValue('anchorId', itemId, { shouldDirty: true })
    form.clearErrors('anchorId')
  }
  function remove(index: number) {
    if (form.getValues(`phases.${index}.id`) === form.getValues('anchorId')) {
      form.setValue('anchorId', 0, { shouldDirty: true })
      form.setError('anchorId', { message: 'The anchor milestone was removed. Choose another milestone or add a new anchor milestone.' })
    }
    rows.remove(index)
  }
  return <section className="template-editor planning-card"><div className="section-heading"><h3>{original ? 'Edit template' : 'Create template'}</h3>{dirty && <span className="stage-label">Unsaved changes</span>}</div>
    <form onSubmit={event => { event.preventDefault(); void form.handleSubmit(async values => {
      if (pending.size) { setError('Review the highlighted timing relationships after changing the order.'); return }
      if (!values.phases.some(item => item.kind === 'milestone' && item.id === values.anchorId)) { form.setError('anchorId', { message: 'Choose a milestone or add an anchor milestone before saving.' }, { shouldFocus: true }); return }
      setBusy(true); setError('')
      try { const saved = await localData.saveTemplate(workspace.id, id, original?.revision ?? 0, revision, { name: values.name, description, anchorId: values.anchorId, phases: scheduleItems(values.phases).map(({ s: _s, e: _e, ...item }) => item) }); onSaved(saved) }
      catch (error) { setError(error instanceof Error ? error.message : 'The template could not be saved.') } finally { setBusy(false) }
    })(event) }}>
      <div className="form-columns"><label className="field">Template name<input {...form.register('name')} maxLength={150} /></label><label className="field">Description (optional)<textarea value={description} maxLength={2000} onChange={event => setDescription(event.target.value)} /></label></div>
      <p>Select phases, arrange their relationships and choose the anchor position. Dates are set for individual procurements.</p>
      <ScheduleEditor form={form} rows={rows} library={workspace.library} checks={relationshipReview.checks} onMove={(from, to) => rows.move(from, to)} onRemove={remove} onReview={relationshipReview.acknowledge} onAdd={add} onCreate={(done, name) => { phaseCreated.current = done; setPhase({ initialName: name }) }} onEditLibrary={original => { phaseCreated.current = null; setPhase({ original }) }} />
      <section className="template-anchor" aria-label="Template anchor"><p id={`${anchorFieldId}-help`}>Choose the milestone whose date will be set when this template is used for a procurement.</p><div className="template-anchor-controls"><div className="field"><label htmlFor={anchorFieldId}>Anchor milestone</label><select id={anchorFieldId} {...form.register('anchorId', { valueAsNumber: true, onChange: () => form.clearErrors('anchorId') })} value={anchorId} aria-invalid={Boolean(form.formState.errors.anchorId)} aria-describedby={`${anchorFieldId}-help${form.formState.errors.anchorId ? ` ${anchorFieldId}-error` : ''}`}><option value={0}>Choose a milestone</option>{items.filter(item => item.kind === 'milestone').map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div><button type="button" className="button" onClick={() => setAddingAnchor(true)}>+ Add anchor milestone</button></div>{form.formState.errors.anchorId && <p id={`${anchorFieldId}-error`} className="field-error" role="alert">{form.formState.errors.anchorId.message}</p>}</section>
      {original && <details className="template-defaults"><summary>Review updated Library defaults</summary><p>Select the defaults you want to copy into this template. Existing procurements are unchanged.</p>{items.map((item, index) => { const source = workspace.library.phases.find(phase => phase.id === item.libraryPhaseId); return source && <div key={item.id}><span>{item.name}: {item.weeks} weeks · current Library: {source.weeks} weeks</span> <button type="button" className="text-button" disabled={!item.durationInherited} title={!item.durationInherited ? 'Custom duration: edit the template directly to change it.' : undefined} onClick={() => { form.setValue(`phases.${index}.name`, source.name, { shouldDirty: true }); form.setValue(`phases.${index}.color`, source.color, { shouldDirty: true }); form.setValue(`phases.${index}.weeks`, source.weeks, { shouldDirty: true }); form.setValue(`phases.${index}.durationInherited`, true, { shouldDirty: true }) }}>Use current default for {item.name}</button></div> })}</details>}
      <ErrorMessage message={error} /><footer className="template-actions"><button type="button" className="button" disabled={busy} onClick={() => dirty ? setDiscard(true) : onClose()}>Cancel</button><button className="button primary" disabled={busy}>{busy ? 'Saving…' : 'Save template'}</button></footer>
    </form>
    {phase && <PhaseDialog workspaceId={workspace.id} library={workspace.library} original={phase.original} initialName={phase.initialName} onDirty={setPhaseDirty} onClose={() => { setPhase(null); setPhaseDirty(false) }} onCreated={async (library, created) => { workspace.acceptLibrary(library); setRevision(library.revision); if (!phase.original) { add(created); phaseCreated.current?.(); phaseCreated.current = null } setPhase(null); setPhaseDirty(false) }} />}
    {addingAnchor && <MilestoneDialog anchor onClose={() => setAddingAnchor(false)} onAdd={name => { selectAnchor(add(undefined, false, name)); setAddingAnchor(false) }} />}
    {discard && <Dialog title="Discard template changes?" onClose={() => setDiscard(false)}><p>The template has not been saved. Library phases you explicitly created remain in the Library.</p><div className="actions"><button type="button" className="button" data-autofocus onClick={() => setDiscard(false)}>Keep editing</button><button type="button" className="button danger" onClick={onClose}>Discard changes</button></div></Dialog>}
  </section>
}
