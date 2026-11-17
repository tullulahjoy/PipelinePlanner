import { useId, useLayoutEffect, useState } from 'react'
import type { Acknowledgement, Project, SavedPipeline } from '../../data/schemas.ts'
import type { WorkspaceContext } from '../../app/workspace-context.ts'
import { localData } from '../../data/local-data.ts'
import { findClashes } from '../../domain/scheduling.ts'
import { Dialog, ErrorMessage } from '../../ui/dialog.tsx'
import { Findings, FindingsSummary } from '../../ui/findings.tsx'
import { closeTimelineDetails } from '../../ui/timeline-details.ts'

export function SaveDialog({ workspace, saved, mode, plans, acknowledgements, onClose, onSaved, onSaveAs, submitLabel }: {
  workspace: WorkspaceContext; saved: SavedPipeline | null; mode: 'save' | 'saveAs'; plans: Project[]; acknowledgements: Acknowledgement[]
  onClose: () => void; onSaved: (record: SavedPipeline) => void; onSaveAs: () => void
  submitLabel?: string
}) {
  const overwrite = mode === 'save' && Boolean(saved)
  useLayoutEffect(closeTimelineDetails, [])
  const reasonId = useId()
  const formId = useId()
  const [copyId] = useState(() => crypto.randomUUID())
  const id = overwrite ? saved!.id : copyId
  const [name, setName] = useState(saved?.name ?? '')
  const [note, setNote] = useState(saved?.note ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const findings = findClashes(plans, workspace.library.rules)
  return <Dialog title={overwrite ? `Save changes to “${saved!.name}”?` : 'Save pipeline plan'} busy={busy} onClose={onClose} className="flow-dialog save-pipeline-dialog" footer={<><button className="button" type="button" disabled={busy} onClick={onClose}>Cancel</button>{overwrite && <button className="button" type="button" disabled={busy} onClick={onSaveAs}>Save as…</button>}<button className="button primary" type="submit" form={formId} disabled={busy}>{busy ? 'Saving…' : submitLabel ?? (overwrite ? 'Overwrite and save' : 'Save')}</button></>}>
    <p>{overwrite ? 'This will overwrite the previously saved pipeline plan. To keep it and create a new copy, choose Save as and enter a different name.' : saved ? 'Enter a different name to keep the existing pipeline plan and create a new copy.' : `Name this pipeline plan so you can return to its ${plans.length} ${plans.length === 1 ? 'procurement' : 'procurements'} later.`}</p>
    {!workspace.currentBaselineId && <p>This will be your workspace's live plan. It will open by default when you enter the workspace.</p>}
    {saved && <p>{plans.length} {plans.length === 1 ? 'procurement' : 'procurements'}.</p>}
    <form id={formId} className="form-stack" onSubmit={async event => {
      event.preventDefault(); if (busy) return
      setBusy(true); setError('')
      try {
        const record = await localData.savePipeline({ id, workspaceId: workspace.id, expectedRevision: overwrite ? saved!.revision : 0, expectedLibraryRevision: workspace.library.revision, name, note, plans, acknowledgements })
        onSaved(record)
      } catch (failure) { setError(failure instanceof Error ? failure.message : 'The pipeline plan could not be saved.') }
      finally { setBusy(false) }
    }}>
      {!overwrite && <label className="field">Name (required)<input data-autofocus value={name} onChange={event => setName(event.target.value)} required maxLength={120} /></label>}
      <div className="save-reason"><label className="field" htmlFor={reasonId}>Notes (optional)</label>
      <p className="field-hint" id={`${reasonId}-help`}>Add any notes you want to keep with this pipeline plan.</p>
      <textarea id={reasonId} aria-describedby={`${reasonId}-help`} data-autofocus={overwrite ? true : undefined} value={note} onChange={event => setNote(event.target.value)} maxLength={2000} rows={4} /></div>
      {findings.length ? <Findings findings={findings} hasRules={workspace.library.rules.length > 0} /> : <FindingsSummary findings={findings} hasRules={workspace.library.rules.length > 0} />}
      <ErrorMessage message={error} />
      {error && <button className="button" type="button" disabled={busy} onClick={async () => { try { workspace.acceptLibrary(await localData.getLibrary(workspace.id)); setError('Clash checks refreshed. Review any critical clashes before trying Save again.') } catch (failure) { setError(failure instanceof Error ? failure.message : 'The checks could not be refreshed. Your working changes are still here.') } }}>Refresh clash checks</button>}
    </form>
  </Dialog>
}
