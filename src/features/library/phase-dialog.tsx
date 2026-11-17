import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { localData } from '../../data/local-data.ts'
import { phaseDefinitionSchema } from '../../data/schemas.ts'
import type { Library as LibraryData, LibraryPhase, PhaseDefinition } from '../../data/schemas.ts'
import { Dialog, ErrorMessage } from '../../ui/dialog.tsx'
import { usePipelineSession } from '../../app/workspace-context.ts'

export function PhaseDialog({ workspaceId, library, original, onClose, onCreated, onDirty, addToProcurement = false, initialName = '' }: { workspaceId: string; library: LibraryData; original?: LibraryPhase; onClose: () => void; onCreated: (library: LibraryData, phase: LibraryPhase) => Promise<void>; onDirty: (dirty: boolean) => void; addToProcurement?: boolean; initialName?: string }) {
  const { reviewDurationChange } = usePipelineSession()
  const [revision] = useState(library.revision)
  const form = useForm<PhaseDefinition>({ resolver: zodResolver(phaseDefinitionSchema), defaultValues: original ? { name: original.name, weeks: original.weeks, color: original.color, checks: library.rules.filter(rule => rule.a === original.id || rule.b === original.id).map(rule => ({ target: rule.a === rule.b ? 'self' : rule.a === original.id ? rule.b : rule.a, severity: rule.severity, reason: rule.reason })) } : { name: initialName, weeks: 1, color: '#315ed4', checks: [] } })
  const nameInput = useRef<HTMLInputElement>(null)
  const nameField = form.register('name')
  useLayoutEffect(() => { if (!original && initialName) { nameInput.current?.focus(); nameInput.current?.select() } }, [initialName, original])
  const checks = useFieldArray({ control: form.control, name: 'checks' })
  const [error, setError] = useState('')
  const [discard, setDiscard] = useState(false)
  const busy = form.formState.isSubmitting
  const formId = useId()
  const selectedColour = useWatch({ control: form.control, name: 'color' })
  const currentChecks = useWatch({ control: form.control, name: 'checks' })
  const otherPhases = library.phases.filter(phase => phase.id !== original?.id)
  const sameColour = otherPhases.filter(phase => phase.color.toLowerCase() === selectedColour.toLowerCase())
  const close = () => form.formState.isDirty ? setDiscard(true) : onClose()
  useEffect(() => onDirty(form.formState.isDirty), [form.formState.isDirty, onDirty])
  return <>
    <Dialog title={original ? 'Edit phase' : 'Create phase'} onClose={close} busy={busy} className="phase-dialog" footer={<><button className="button" type="button" disabled={busy} onClick={close}>Cancel</button><button className="button primary" type="submit" form={formId} disabled={busy}>{busy ? 'Saving…' : original ? 'Save phase' : addToProcurement ? 'Create phase and add to procurement' : 'Create phase'}</button></>}>
      <p>{original ? 'Update this Library phase’s name, default duration, colour and shared clash-checking rules.' : addToProcurement ? 'Create a reusable Library phase and add it to this procurement. All rules below are included when saving.' : 'Define a reusable activity for future templates and procurements.'}</p>
      <form id={formId} noValidate onSubmit={form.handleSubmit(async values => {
        try {
          const library = original ? await localData.editPhase(workspaceId, original.id, revision, values) : await localData.createPhase(workspaceId, values)
          const phase = original ? library.phases.find(phase => phase.id === original.id)! : library.phases[library.phases.length - 1]
          await onCreated(library, phase)
          if (original && original.weeks !== phase.weeks) reviewDurationChange({ phaseId: phase.id, name: phase.name, before: original.weeks, after: phase.weeks })
        }
        catch (failure) { setError(failure instanceof Error ? failure.message : 'The phase could not be saved.') }
      }, () => setError('Check the phase details and clash-checking rules.'))} className="form-stack">
        <label className="field">Phase name<input data-autofocus {...nameField} ref={element => { nameField.ref(element); nameInput.current = element }} aria-describedby={`${formId}-name-scope`} aria-invalid={Boolean(form.formState.errors.name)} /></label>
        <span className="field-error">{form.formState.errors.name?.message}</span>
        <p className="phase-name-scope" id={`${formId}-name-scope`}>This is the Library name. Individual procurements can use a different name.</p>
        <div className="phase-default-fields"><div><label className="field">Default duration (weeks)<input type="number" min={1} max={5200} {...form.register('weeks', { valueAsNumber: true })} aria-invalid={Boolean(form.formState.errors.weeks)} /></label>
        <span className="field-error">{form.formState.errors.weeks?.message}</span>
        </div><div className="phase-colour-settings">
        <label className="field">Colour<input type="color" {...form.register('color')} aria-describedby={otherPhases.length ? `${formId}-colours ${formId}-colour-warning` : undefined} /></label>
        </div></div>
        {otherPhases.length > 0 && <div className="phase-used-colours" id={`${formId}-colours`}><p>Colours already in use</p><ul>{otherPhases.map(phase => <li key={phase.id}><span className="colour-swatch" style={{ backgroundColor: phase.color }} aria-hidden="true" /><span>{phase.name}</span></li>)}</ul></div>}
        <div id={`${formId}-colour-warning`} role="status">{sameColour.length > 0 && <p className="phase-colour-warning">This colour is already used by {sameColour.map(phase => phase.name).join(', ')}. You can keep it or choose a different colour to make phases easier to distinguish.</p>}</div>
        <section className="phase-overlap-settings" aria-labelledby={`${formId}-overlaps`}>
        <h3 id={`${formId}-overlaps`}>Clash-checking rules</h3>
        <p>Choose which phases should trigger an issue when they overlap with this phase in other procurements, including another occurrence of this phase.</p>
        <div className="phase-severity-guide"><p><span className="severity warning">Warning</span> undesirable but manageable overlap.</p><p><span className="severity critical">Critical clash</span> unacceptable overlap.</p></div>
        {checks.fields.map((check, index) => <fieldset className="phase-rule-fields" key={check.id}><legend className="sr-only">Rule {index + 1}</legend>
          <div className="phase-rule-heading"><strong aria-hidden="true">Rule {index + 1}</strong><button className="text-button" type="button" aria-label={`Remove rule ${index + 1}`} onClick={() => checks.remove(index)}>Remove</button></div>
          <div className="phase-rule-controls"><label className="field">If this phase overlaps with<select aria-label={`Rule ${index + 1} overlapping phase`} {...form.register(`checks.${index}.target`)}><option value="self">Another occurrence of this phase</option>{library.phases.filter(phase => phase.id !== original?.id).map(phase => <option key={phase.id} value={phase.id}>{phase.name}</option>)}</select></label>
          <label className="field">Flag it as<select className={`phase-rule-severity ${currentChecks[index]?.severity ?? 'warning'}`} aria-label={`Rule ${index + 1} severity`} {...form.register(`checks.${index}.severity`)}><option value="warning">Warning</option><option value="critical">Critical clash</option></select></label></div>
          <details className="phase-rule-explanation" open={Boolean(check.reason)}><summary>Add an explanation (optional)</summary><label className="field"><span className="sr-only">Explanation (optional)</span><textarea aria-label={`Rule ${index + 1} explanation`} maxLength={1000} rows={2} {...form.register(`checks.${index}.reason`)} /></label></details>
        </fieldset>)}
        <button className="text-button phase-add-rule" type="button" onClick={() => checks.append({ target: 'self', severity: 'warning', reason: '' })}>{checks.fields.length ? '+ Add another clash-checking rule' : '+ Add clash-checking rule'}</button>
        <p className="phase-rule-note">Rules appear under both affected phases. Editing or removing a rule updates it for both phases and refreshes clash checks.</p>
        </section>
        <p className="phase-save-effects">Clash-checking rule changes apply across all pipeline plans. Changing the default duration does not update existing procurement schedules automatically.</p>
        <ErrorMessage message={error} />
      </form>
    </Dialog>
    {discard && <Dialog title="Discard phase details?" onClose={() => setDiscard(false)}><p>The phase has not been created.</p><div className="actions"><button className="button" data-autofocus onClick={() => setDiscard(false)}>Keep editing</button><button className="button danger" onClick={onClose}>Discard phase details</button></div></Dialog>}
  </>
}
