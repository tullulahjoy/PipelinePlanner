import { useEffect, useRef, useState } from 'react'
import type { SavedPipeline } from '../../data/schemas.ts'
import type { WorkspaceContext } from '../../app/workspace-context.ts'
import { localData } from '../../data/local-data.ts'
import { Dialog, ErrorMessage } from '../../ui/dialog.tsx'
import { FindingCounts } from '../../ui/findings.tsx'
import { findClashes } from '../../domain/scheduling.ts'

export function MakeLiveDialog({ record, workspace, onClose, onMadeLive }: {
  record: SavedPipeline; workspace: WorkspaceContext; onClose: () => void; onMadeLive: () => void
}) {
  const [expectedLiveId] = useState(workspace.currentBaselineId ?? null)
  const [outgoing, setOutgoing] = useState<SavedPipeline | null | undefined>(expectedLiveId ? undefined : null)
  const [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const saving = useRef(false)
  useEffect(() => {
    if (!expectedLiveId) return
    let active = true
    void localData.getPipeline(workspace.id, expectedLiveId).then(plan => {
      if (!active) return
      if (!plan) setError('The current live plan could not be read. Close this confirmation and try again.')
      else setOutgoing(plan)
    }).catch(failure => { if (active) setError(failure instanceof Error ? failure.message : 'The current live plan could not be read.') })
    return () => { active = false }
  }, [expectedLiveId, workspace.id])
  const findings = findClashes(record.plans, workspace.library.rules)
  return <Dialog title={`Make "${record.name}" live?`} onClose={onClose} busy={busy} className="flow-dialog" focusTitle footer={<>
    <button className="button" onClick={onClose} disabled={busy}>Cancel</button>
    <button className="button primary" disabled={busy || outgoing === undefined} onClick={async () => {
      if (saving.current) return
      saving.current = true; setBusy(true); setError('')
      try { await localData.makeLive(workspace.id, record.id, record.revision, expectedLiveId); onMadeLive() }
      catch (failure) { setError(failure instanceof Error ? failure.message : 'The live plan could not be changed. Try again.') }
      finally { saving.current = false; setBusy(false) }
    }}>{busy ? 'Making live...' : 'Make live'}</button>
  </>}>
    {outgoing === undefined && !error ? <p role="status">Checking the current live plan...</p> : outgoing ? <p><strong>{record.name}</strong> will replace <strong>{outgoing.name}</strong> as your workspace's live plan. <strong>{outgoing.name}</strong> will remain in Saved Pipeline Plans.</p> : !error && <p><strong>{record.name}</strong> will become your workspace's live plan.</p>}
    <p>The live plan opens by default when you enter the workspace. Your saved plans and their dates will be retained.</p>
    {findings.length > 0 && <><FindingCounts findings={findings} /><p>Clash findings are advisory and do not prevent making this plan live.</p></>}
    <ErrorMessage message={error} />
  </Dialog>
}
