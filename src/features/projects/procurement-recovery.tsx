import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Dialog, ErrorMessage } from '../../ui/dialog.tsx'
import { clearProcurementDraft, readProcurementDraft } from './procurement-draft.ts'
import type { ProcurementDraft } from './procurement-draft.ts'
import { editPlanPath } from '../pipeline/pipeline-paths.ts'

export function ProcurementRecovery({ workspaceId, children, liveId }: { workspaceId: string; liveId?: string; children: (draft: ProcurementDraft | null) => ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [stored] = useState(() => { try { return { draft: readProcurementDraft(workspaceId), error: '' } } catch { return { draft: null, error: 'A local procurement draft could not be read. Recovery is unavailable; saved pipeline plans and Library items are unchanged.' } } })
  const [resumed, setResumed] = useState(() => Boolean(stored.draft && location.state?.resumeProcurementDraft === stored.draft.id))
  const [dismissed, setDismissed] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (location.state?.resumeProcurementDraft && stored.draft?.id === location.state.resumeProcurementDraft) {
      void navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
    }
  }, [location, navigate, stored.draft])
  const draft = dismissed ? null : stored.draft
  if (!draft) return <>{stored.error && <p className="notice" role="status">{stored.error}</p>}{children(null)}</>
  // Finish the one-time route transfer before exposing the form. Otherwise a
  // quick refresh can retain its history marker and skip the recovery choice.
  if (resumed && location.state?.resumeProcurementDraft === draft.id) return <p role="status">Restoring procurement...</p>
  if (resumed) return children(draft)
  const target = `${editPlanPath(`/workspaces/${workspaceId}`, draft.context.saved?.id, liveId)}${draft.original ? `&procurement=${draft.original.id}` : '&add=1'}`
  return <Dialog title="Resume unfinished procurement?" onClose={() => { void navigate('/workspaces') }}>
    <p>A draft for <strong>{draft.values.name || 'an unnamed procurement'}</strong> is available in this browser. Resume to continue editing, or discard it to start again.</p>
    <p>Resuming restores the working pipeline plan used by this draft. It does not save or overwrite a named pipeline plan. Preview again to check dates and current Library rules.</p>
    <ErrorMessage message={error} />
    <div className="actions"><button type="button" className="button danger" onClick={() => { try { clearProcurementDraft(workspaceId, draft.id); setDismissed(true) } catch { setError('The draft could not be discarded. Browser storage may be unavailable. Try again.') } }}>Discard draft</button><button type="button" className="button primary" data-autofocus onClick={() => { setResumed(true); if (`${location.pathname}${location.search}` !== target) void navigate(target, { replace: true, state: { resumeProcurementDraft: draft.id } }) }}>Resume draft</button></div>
  </Dialog>
}
