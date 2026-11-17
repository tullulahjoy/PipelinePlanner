import { useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useBeforeUnload, useBlocker, useLocation, useNavigate, useRevalidator } from 'react-router'
import { PipelineSessionContext } from '../../app/workspace-context.ts'
import type { LibraryDurationChange, WorkingPipeline, WorkspaceContext } from '../../app/workspace-context.ts'
import { DurationUpdatePrompt } from '../library/duration-update-prompt.tsx'
import type { SavedPipeline } from '../../data/schemas.ts'
import { Dialog, LeaveDialog } from '../../ui/dialog.tsx'
import { NavigationGuardContext } from '../../ui/use-leave-protection.ts'
import type { UnsavedForm } from '../../ui/use-leave-protection.ts'
import { SaveDialog } from './save-dialog.tsx'
import { closeTimelineDetails } from '../../ui/timeline-details.ts'
import { editingPlanId, editPlanPath } from './pipeline-paths.ts'
import { MakeLiveDialog } from './make-live-dialog.tsx'

export function PipelineSessionProvider({ workspace, children }: { workspace: WorkspaceContext; children: ReactNode }) {
  const [working, setWorking] = useState<WorkingPipeline | null>(null)
  const [form, setForm] = useState<UnsavedForm | null>(null)
  const [saveMode, save] = useState<'save' | 'saveAs' | null>(null)
  const [closingForm, setClosingForm] = useState(false)
  const [durationChange, reviewDurationChange] = useState<LibraryDurationChange | null>(null)
  const [liveCandidate, requestMakeLive] = useState<SavedPipeline | null>(null)
  const [resolution, setResolution] = useState<{ kind: 'exit' } | null>(null)
  const allowNavigation = useRef(false)
  const navigate = useNavigate()
  const location = useLocation()
  const revalidator = useRevalidator()
  const base = `/workspaces/${workspace.id}`
  const dirty = Boolean(working && JSON.stringify({ plans: working.plans, acknowledgements: working.acknowledgements }) !== JSON.stringify({ plans: working.saved?.plans ?? [], acknowledgements: working.saved?.acknowledgements ?? [] }))
  const resumePath = working ? editPlanPath(base, working.saved?.id, workspace.currentBaselineId) : `${base}/pipeline`
  const inSavedModal = location.pathname.startsWith(`${base}/saved-pipelines/`)

  function navigateFreely(path: string, replace = false) {
    allowNavigation.current = true
    void Promise.resolve(navigate(path, { replace })).finally(() => { allowNavigation.current = false })
  }
  function finishExit() {
    const target = inSavedModal ? `${base}/saved-pipelines` : `${base}/pipeline`
    closeTimelineDetails(); setWorking(null); setResolution(null); setClosingForm(false)
    navigateFreely(target)
  }
  function exitEditing() {
    closeTimelineDetails()
    if (form) setClosingForm(true)
    else if (dirty) setResolution({ kind: 'exit' })
    else finishExit()
  }
  function replacesWorking(next: { pathname: string; search: string }) {
    if (!next.pathname.startsWith(`${base}/`) && next.pathname !== base) return true
    const target = editingPlanId(next, base, workspace.currentBaselineId)
    if (target === undefined && editingPlanId(location, base, workspace.currentBaselineId) !== undefined) return true
    return target !== undefined && target !== (working?.saved?.id ?? null)
  }

  useBeforeUnload(event => { if (dirty || form) { event.preventDefault(); event.returnValue = '' } })
  const blocker = useBlocker(({ currentLocation, nextLocation }) => !allowNavigation.current && (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search) && Boolean(form || dirty && replacesWorking(nextLocation)))
  useLayoutEffect(() => { if (blocker.state === 'blocked') closeTimelineDetails() }, [blocker.state])
  function keepBlockedForm() { setClosingForm(false); if (blocker.state === 'blocked') blocker.reset() }

  function savedPipeline(record: SavedPipeline) {
    setWorking({ saved: record, plans: record.plans, acknowledgements: record.acknowledgements })
    save(null)
    if (resolution?.kind === 'exit') { finishExit(); return }
    if (blocker.state === 'blocked') blocker.proceed()
    else if (editingPlanId(location, base, workspace.currentBaselineId) !== undefined) {
      const path = editPlanPath(base, record.id, workspace.currentBaselineId ?? record.id)
      if (`${location.pathname}${location.search}` !== path) navigateFreely(path, true)
    }
    void revalidator.revalidate()
  }

  return <PipelineSessionContext value={{ working, setWorking, resumePath, dirty, save, reviewDurationChange, exitEditing, requestMakeLive }}><NavigationGuardContext value={setForm}>
    {children}
    {durationChange && <DurationUpdatePrompt change={durationChange} workspace={workspace} unfinished={Boolean(form)} onClose={() => reviewDurationChange(null)} />}
    {closingForm && form && blocker.state !== 'blocked' && <Dialog title="Unsaved changes" onClose={() => setClosingForm(false)} className="flow-dialog" footer={<><button className="button" data-autofocus onClick={() => setClosingForm(false)}>Keep editing</button><button className="button danger" onClick={() => {
      form.discard(); setForm(null); setClosingForm(false)
      if (dirty) setResolution({ kind: 'exit' }); else finishExit()
    }}>Discard changes</button></>}><p>Your current procurement or adjustment edits have not been applied. Keep editing or discard these edits before closing the pipeline plan.</p></Dialog>}
    {blocker.state === 'blocked' && form ? <Dialog title="Unsaved changes" onClose={keepBlockedForm}>
      <p>Your current edits have not been applied and saved. Keep editing to review them, or discard the unsaved changes and leave.</p>
      <div className="actions"><button className="button" data-autofocus onClick={keepBlockedForm}>Keep editing</button><button className="button danger" onClick={() => {
        form.discard(); setForm(null); setClosingForm(false)
        if (!dirty || !replacesWorking(blocker.location)) blocker.proceed()
      }}>Discard changes</button></div>
    </Dialog> : <LeaveDialog blocker={blocker} hidden={Boolean(saveMode)} onDiscard={() => setWorking(null)} onSave={() => save('save')} />}
    {resolution && !saveMode && <Dialog title="Exit edit mode?" onClose={() => setResolution(null)} className="flow-dialog" footer={<>
      <button className="button" data-autofocus onClick={() => setResolution(null)}>Keep editing</button>
      <button className="button danger" onClick={finishExit}>Discard changes and exit</button>
      <button className="button primary" onClick={() => save('save')}>Save and exit</button>
    </>}><p>Save your changes or discard them before closing and returning to {inSavedModal ? 'Saved Pipeline Plans' : 'Live Pipeline'}.</p></Dialog>}
    {saveMode && working && <SaveDialog workspace={workspace} saved={working.saved} mode={saveMode} plans={working.plans} acknowledgements={working.acknowledgements} submitLabel={resolution ? 'Save and exit' : undefined} onSaveAs={() => save('saveAs')} onClose={() => { save(null); setResolution(null); if (blocker.state === 'blocked') blocker.reset() }} onSaved={savedPipeline} />}
    {liveCandidate && <MakeLiveDialog record={liveCandidate} workspace={workspace} onClose={() => { requestMakeLive(null); void revalidator.revalidate() }} onMadeLive={() => { requestMakeLive(null); setWorking(null); navigateFreely(`${base}/pipeline`); void revalidator.revalidate() }} />}
  </NavigationGuardContext></PipelineSessionContext>
}
