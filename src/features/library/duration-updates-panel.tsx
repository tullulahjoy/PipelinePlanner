import { useWorkspace } from '../../app/workspace-context.ts'
import { useId, useState } from 'react'
import { Link } from 'react-router'
import type { Library, SavedPipeline } from '../../data/schemas.ts'
import { ErrorMessage } from '../../ui/dialog.tsx'
import { useDurationUpdates } from './use-duration-updates.ts'
import type { DurationUpdates } from './use-duration-updates.ts'

export function DurationUpdatesPanel({ workspaceId, library, pipelines, loaded = true, phaseId, onNavigate, embedded = false }: { workspaceId: string; library: Library; pipelines?: SavedPipeline[]; loaded?: boolean; phaseId?: string; onNavigate?: () => void; embedded?: boolean }) {
  const workspace = useWorkspace()
  const data = useDurationUpdates({ workspaceId, library, pipelines, loaded, phaseId, liveId: workspace.currentBaselineId })
  return <DurationUpdatesContent data={data} phaseId={phaseId} onNavigate={onNavigate} embedded={embedded} />
}

export function DurationUpdatesContent({ data, phaseId, onNavigate, embedded = false }: { data: DurationUpdates; phaseId?: string; onNavigate?: () => void; embedded?: boolean }) {
  const { sources, available, eligible, differences, isReady, error, retry } = data
  const groupId = useId()
  const [target, setTarget] = useState('')
  const selected = available.find(source => source.id === target)
  const href = selected ? `${selected.path}&updates=1${phaseId ? `&phaseUpdate=${encodeURIComponent(phaseId)}` : ''}` : ''
  return <section className={`library-impact-entry${embedded ? ' embedded' : ''}`} aria-label="Updates to existing schedules">
    {!embedded && <h2>Updates to existing schedules</h2>}
    {!embedded && <p>Clash-checking rule changes apply across all pipeline plans. Library duration changes do not move existing schedules automatically.</p>}
    <ErrorMessage message={error} />
    {error ? <button type="button" className="button" onClick={retry}>Retry loading pipeline plans</button> : !isReady ? <p role="status">Checking existing schedules…</p> : <>
      {!embedded && <p role="status">{!sources.length ? 'No pipeline plans are available to update yet.' : eligible ? `${eligible} future ${eligible === 1 ? 'activity' : 'activities'} across ${available.length} ${available.length === 1 ? 'pipeline plan can' : 'pipeline plans can'} use updated Library durations. Existing schedules remain unchanged until you choose and apply updates.` : differences ? 'Some durations differ from the Library, but those activities have custom durations or have already started. They are protected from updates.' : 'Existing procurement durations match their Library defaults.'}</p>}
      {available.length > 0 && <>{embedded ? <fieldset className="duration-pipeline-options"><legend>Choose a pipeline plan</legend>{available.map(source => <label className="duration-pipeline-choice" key={source.id}><input type="radio" name={groupId} value={source.id} checked={target === source.id} onChange={() => setTarget(source.id)} /><span><strong>{source.name}</strong><small>{source.procurements} eligible {source.procurements === 1 ? 'procurement' : 'procurements'}</small></span></label>)}</fieldset> : <label className="field">Pipeline Plan to review<select value={target} onChange={event => setTarget(event.target.value)}><option value="">Choose a pipeline plan</option>{available.map(source => <option key={source.id} value={source.id}>{source.name} - {source.eligible} eligible {source.eligible === 1 ? 'activity' : 'activities'}</option>)}</select></label>}{selected && <Link className="button" to={href} onClick={onNavigate}>Choose procurements and preview updates</Link>}<p className="supporting-text">{embedded ? 'Preview and confirm updates before applying them. Save the pipeline plan afterwards to keep the changes.' : 'Choose one pipeline plan at a time. Preview the effects, then apply selected updates. Use Save in the editing window to keep the changes.'}</p></>}
    </>}
  </section>
}
