import { useLayoutEffect, useRef, useState } from 'react'
import type { LibraryDurationChange, WorkspaceContext } from '../../app/workspace-context.ts'
import { Dialog, ErrorMessage } from '../../ui/dialog.tsx'
import { DurationUpdatesContent } from './duration-updates-panel.tsx'
import { useDurationUpdates } from './use-duration-updates.ts'
import './library.css'

export function DurationUpdatePrompt({ change, workspace, unfinished, onClose }: { change: LibraryDurationChange; workspace: WorkspaceContext; unfinished: boolean; onClose: () => void }) {
  const [choosing, setChoosing] = useState(false)
  const data = useDurationUpdates({ workspaceId: workspace.id, library: workspace.library, phaseId: change.phaseId, liveId: workspace.currentBaselineId })
  const step = data.error ? 'error' : !data.isReady ? 'loading' : !data.eligible ? 'confirmation' : choosing ? 'selection' : 'choice'
  const content = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => { content.current?.querySelector<HTMLElement>('input, button, a')?.focus({ preventScroll: true }) }, [step])
  const title = step === 'confirmation' ? 'Library duration updated' : step === 'loading' || step === 'error' ? 'Check existing schedules' : step === 'selection' ? 'Choose existing procurements to update' : 'Where should the new duration be used?'
  return <Dialog title={title} onClose={onClose}>
    <div ref={content}>
    {step === 'confirmation' ? <>
      <p>{change.name}’s default duration is now {change.after} {change.after === 1 ? 'week' : 'weeks'}. It will be used when adding this phase to future schedules.</p>
      {data.sources.length > 0 && <p>{!data.references ? 'This phase is not used in any existing procurement schedules.' : data.differences ? 'Activities with a different duration have custom durations or have already started. They will remain unchanged.' : 'Existing procurements already use this duration. No updates are needed.'}</p>}
      <div className="actions"><button type="button" className="button primary" onClick={onClose}>Done</button></div>
    </> : step === 'selection' ? <>
      <p><strong>{change.name}</strong>: {change.before} {change.before === 1 ? 'week' : 'weeks'} → {change.after} {change.after === 1 ? 'week' : 'weeks'}.</p>
      {unfinished && <p className="notice">You have unfinished procurement or template edits. Finish them before updating existing procurements. If you continue, you’ll be asked whether to keep or discard those edits.</p>}
      <DurationUpdatesContent data={data} phaseId={change.phaseId} onNavigate={onClose} embedded />
      <div className="actions"><button type="button" className="button" onClick={() => setChoosing(false)}>Back</button><button type="button" className="button" onClick={onClose}>Keep existing procurement durations unchanged</button></div>
    </> : <>
      <p>You changed the default duration for <strong>{change.name}</strong> from <strong>{change.before} {change.before === 1 ? 'week' : 'weeks'}</strong> to <strong>{change.after} {change.after === 1 ? 'week' : 'weeks'}</strong>.</p>
      <p>The new Library default is saved. Existing procurement durations have not changed.</p>
      {step === 'loading' ? <p role="status">Checking existing schedules…</p> : step === 'error' ? <><ErrorMessage message={data.error} /><div className="actions"><button type="button" className="button" onClick={data.retry}>Retry checking schedules</button><button type="button" className="button" onClick={onClose}>Keep existing procurement durations unchanged</button></div></> : <div className="duration-update-choices">
        <div><button type="button" className="button primary" onClick={() => setChoosing(true)}>Choose procurements to update ({data.procurements} eligible)</button><p>Preview the effects and select which eligible activities receive the new duration. Nothing changes until confirmed.</p></div>
        <div><button type="button" className="button" onClick={onClose}>Keep existing procurement durations unchanged</button><p>Use the new Library default for future additions only.</p></div>
      </div>}
    </>}
    </div>
  </Dialog>
}
