import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { PipelineSource, PipelineSaveMode, PipelineOpenResolution } from './pipeline-connected-types'
import type { PipelineVersion } from './pipeline-versions'
import './pipeline-save-version.css'

export function SaveVersionDialog({ source, onClose, onSaved, onDirty, mode = 'save', target, onResolved, allowDiscard = true }: {
  source: PipelineSource
  onClose: () => void
  onSaved: (version: PipelineVersion) => void
  onDirty?: (dirty: boolean) => void
  mode?: PipelineSaveMode | 'switch' | 'editBaseline' | 'resolve' | 'viewLive'
  target?: PipelineVersion
  onResolved?: () => void
  allowDiscard?: boolean
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const nameInput = useRef<HTMLInputElement>(null), noteInput = useRef<HTMLTextAreaElement>(null)
  const failure = useRef<HTMLParagraphElement>(null)
  const canOverwrite = !!source.record && source.record.status === 'saved' && !source.record.confirmation
  const resolving = mode === 'resolve'
  const openingLive = mode === 'viewLive'
  const originalName = source.record?.name ?? source.context.originBaseline?.name
  const editingBaseline = mode === 'editBaseline'
  const [stage, setStage] = useState<'baseline' | 'switch' | 'overwrite' | 'name'>(() => editingBaseline ? 'baseline' : mode === 'switch' || resolving || openingLive ? 'switch' : mode === 'save' && canOverwrite ? 'overwrite' : 'name')
  const [name, setName] = useState(originalName ?? ''), [note, setNote] = useState('')
  const [errors, setErrors] = useState({ name: '', note: '' })
  const [saveError, setSaveError] = useState('')
  const [formDirty, setFormDirty] = useState(false)
  const busy = useRef(false)
  const successful = useRef(false)
  const heading = useRef<HTMLHeadingElement>(null)
  useLayoutEffect(() => {
    const element = dialog.current!
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    element.showModal()
    return () => { element.close(); document.body.style.overflow = previousOverflow }
  }, [])
  useLayoutEffect(() => { (stage === 'name' ? nameInput.current : heading.current)?.focus() }, [stage])
  useEffect(() => {
    if (!formDirty) return
    const preventLoss = (event: BeforeUnloadEvent) => { if (!successful.current) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', preventLoss)
    return () => window.removeEventListener('beforeunload', preventLoss)
  }, [formDirty])
  function changeStage(next: 'switch' | 'overwrite' | 'name') { setErrors({ name: '', note: '' }); setSaveError(''); setStage(next) }
  function fail(error: unknown) {
    setSaveError(error instanceof Error ? error.message : 'The pipeline could not be saved.')
    requestAnimationFrame(() => failure.current?.focus())
  }
  function finish(version: PipelineVersion) { successful.current = true; onSaved(version) }
  function openTarget(resolution?: PipelineOpenResolution) {
    if (openingLive) return window.LTPPDemo.viewLivePipeline(source, resolution).record!
    if (!target) throw new Error('Choose a pipeline to open.')
    return editingBaseline ? window.LTPPDemo.editBaseline(target, source, resolution) : window.LTPPDemo.openPipeline(target, source, resolution)
  }
  function confirmBaselineEditing() {
    if (source.dirty) { changeStage('switch'); return }
    if (busy.current) return
    busy.current = true
    try { finish(openTarget()) }
    catch (error) { fail(error) }
    finally { busy.current = false }
  }
  function discardAndOpen() {
    if ((!target && !resolving) || busy.current) return
    busy.current = true
    try {
      if (resolving) { window.LTPPDemo.discardPipelineChanges(source); successful.current = true; onResolved?.() }
      else finish(openTarget({ action: 'discard' }))
    }
    catch (error) { fail(error) }
    finally { busy.current = false }
  }
  const title = stage === 'baseline' ? 'Edit this pipeline?' : stage === 'switch' ? openingLive ? 'Return to the live pipeline?' : resolving ? 'Save before confirming a baseline' : editingBaseline ? 'Save changes before editing this pipeline?' : 'Save changes before opening another pipeline?' : stage === 'overwrite' ? `Save changes to “${source.record!.name}”?` : 'Save pipeline'
  const description = stage === 'baseline' ? 'Any changes will be saved under a new name. This baseline will stay unchanged. Your saved dates and phase lengths will stay the same. Colours and checks for overlapping work will use the latest Library settings, so you may see different warnings or clashes.'
    : stage === 'switch' ? resolving ? allowDiscard ? 'Save or discard your changes before reviewing the saved pipeline as a new baseline.' : 'Save this pipeline under a new name before reviewing it as a new baseline.' : `Your changes to “${originalName ?? 'Unnamed pipeline'}” have not been saved. You are ${editingBaseline ? 'editing' : 'opening'} “${target?.name}”.`
    : stage === 'overwrite' ? 'This will overwrite the previously saved pipeline. To keep it and create a new copy, choose Save as and enter a different name.'
    : originalName ? 'Enter a different name to keep the existing pipeline and create a new copy.' : 'Choose a name for this pipeline.'
  const submitLabel = openingLive ? stage === 'overwrite' ? 'Overwrite and view live' : 'Save and view live' : resolving ? stage === 'overwrite' ? 'Overwrite and continue' : 'Save and continue' : target ? stage === 'overwrite' ? `Overwrite and ${editingBaseline ? 'edit' : 'open'}` : `Save and ${editingBaseline ? 'edit' : 'open'}` : stage === 'overwrite' ? 'Overwrite and save' : 'Save'
  return <dialog ref={dialog} className="save-version-dialog" aria-labelledby="save-version-title" aria-describedby="save-version-description" onCancel={event => { event.preventDefault(); onClose() }}>
    <header><div><h2 id="save-version-title" ref={heading} tabIndex={-1}>{title}</h2><p id="save-version-description">{description}</p></div><button type="button" className="save-version-close" aria-label="Close save pipeline" onClick={onClose}>×</button></header>
    <form noValidate onChange={() => setFormDirty(true)} onSubmit={event => {
      event.preventDefault()
      if (stage === 'switch' || stage === 'baseline' || busy.current) return
      const nextErrors = { name: stage === 'name' && !name.trim() ? 'Enter a name.' : stage === 'name' && originalName && name.trim().toLocaleLowerCase() === originalName.toLocaleLowerCase() ? 'Enter a different name to create a new copy.' : '', note: note.trim() ? '' : 'Enter a reason for saving.' }
      setErrors(nextErrors)
      if (nextErrors.name || nextErrors.note) { (nextErrors.name ? nameInput : noteInput).current?.focus(); return }
      busy.current = true
      const input = { name: stage === 'overwrite' ? source.record!.name : name, note }
      const saveMode = stage === 'overwrite' ? 'save' : 'saveAs'
      try { finish(target ? openTarget({ action: 'save', input, mode: saveMode }) : window.LTPPDemo.savePipeline(input, source, saveMode)) }
      catch (error) { fail(error) }
      finally { busy.current = false }
    }}>
      <div className="save-version-fields" hidden={(stage === 'baseline' || stage === 'switch') && !saveError}>
        {stage !== 'switch' && stage !== 'baseline' ? <><p className="save-version-scope">{source.plans.length} {source.plans.length === 1 ? 'procurement' : 'procurements'}. The current baseline stays unchanged.{target ? ` After saving, “${target.name}” will open${editingBaseline ? ' for editing' : ''}.` : ''}</p>
        {stage === 'name' ? <><label htmlFor="version-name">Name <span>(required)</span></label>
        <input ref={nameInput} id="version-name" name="name" value={name} required maxLength={120} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'version-name-error' : undefined} onChange={event => { setName(event.target.value); onDirty?.(!!(event.target.value || note)); if (errors.name) setErrors(previous => ({ ...previous, name: '' })) }} />
        {errors.name ? <p className="save-version-error" id="version-name-error">{errors.name}</p> : null}
        </> : null}
        <label htmlFor="version-note">Reason for saving <span>(required)</span></label>
        <p className="save-version-hint" id="version-note-hint">Explain what changed and why you are saving it.</p>
        <textarea ref={noteInput} id="version-note" name="note" value={note} required maxLength={2000} rows={4} aria-invalid={!!errors.note} aria-describedby={`version-note-hint${errors.note ? ' version-note-error' : ''}`} onChange={event => { setNote(event.target.value); onDirty?.(!!(name || event.target.value)); if (errors.note && event.target.value.trim()) setErrors(previous => ({ ...previous, note: '' })) }} />
        {errors.note ? <p className="save-version-error" id="version-note-error">{errors.note}</p> : null}
        <dl className="save-version-author"><dt>Saved by</dt><dd>{source.editor.name} <span>(fictional editor)</span></dd><dt>Date and time</dt><dd>Recorded automatically when saved.</dd></dl></> : null}
        {saveError ? <p ref={failure} className="save-version-error save-version-failure" role="alert" tabIndex={-1}>{saveError}</p> : null}
      </div>
      <footer><button type="button" className="save-version-button" onClick={onClose}>Cancel</button>
        {stage === 'baseline' ? <button type="button" className="save-version-button primary" onClick={confirmBaselineEditing}>Edit pipeline</button> : stage === 'switch' ? <>{allowDiscard ? <button type="button" className="save-version-button" onClick={discardAndOpen}>Discard changes and {openingLive ? 'view live' : resolving ? 'continue' : editingBaseline ? 'edit' : 'open'}</button> : null}{canOverwrite ? <button type="button" className="save-version-button" onClick={() => changeStage('name')}>Save as…</button> : null}<button type="button" className="save-version-button primary" onClick={() => changeStage(canOverwrite ? 'overwrite' : 'name')}>Save and {openingLive ? 'view live' : resolving ? 'continue' : editingBaseline ? 'edit' : 'open'}</button></>
          : <>{stage === 'overwrite' ? <button type="button" className="save-version-button" onClick={() => changeStage('name')}>Save as…</button> : null}<button type="submit" className="save-version-button primary">{submitLabel}</button></>}
      </footer>
    </form>
  </dialog>
}
