import { useEffect, useState } from 'react'
import type { Library, SavedPipeline } from '../../data/schemas.ts'
import { localData } from '../../data/local-data.ts'
import { usePipelineSession } from '../../app/workspace-context.ts'
import { editPlanPath } from '../pipeline/pipeline-paths.ts'
import { durationCandidates } from '../../domain/library-updates.ts'
import { isoDate, parseDate } from '../../domain/calendar.ts'

export function useDurationUpdates({ workspaceId, library, pipelines, loaded = true, phaseId, liveId }: { workspaceId: string; library: Library; pipelines?: SavedPipeline[]; loaded?: boolean; phaseId?: string; liveId?: string }) {
  const { working, resumePath } = usePipelineSession()
  const [records, setRecords] = useState<SavedPipeline[]>([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [today] = useState(() => parseDate(isoDate(Date.now())))
  useEffect(() => {
    if (pipelines) return
    let active = true
    void localData.listPipelines(workspaceId).then(records => { if (active) { setRecords(records); setReady(true); setError('') } }).catch(error => { if (active) setError(error.message) })
    return () => { active = false }
  }, [workspaceId, pipelines, attempt])
  const sources = [
    ...(working?.plans.length ? [{ id: 'working', name: `Current working pipeline plan (${working.saved?.name ?? 'unnamed'})`, plans: working.plans, path: resumePath }] : []),
    ...(pipelines ?? records).filter(record => record.id !== working?.saved?.id).map(record => ({ ...record, path: editPlanPath(`/workspaces/${workspaceId}`, record.id, liveId) })),
  ].map(source => {
    const candidates = durationCandidates(source.plans, library, today, phaseId)
    const eligible = candidates.filter(item => item.eligible)
    return { ...source, candidates, eligible: eligible.length, procurements: new Set(eligible.map(item => item.planId)).size }
  })
  return {
    sources, available: sources.filter(source => source.eligible > 0),
    eligible: sources.reduce((sum, source) => sum + source.eligible, 0),
    procurements: sources.reduce((sum, source) => sum + source.procurements, 0),
    differences: sources.reduce((sum, source) => sum + source.candidates.length, 0),
    references: sources.reduce((sum, source) => sum + source.plans.flatMap(plan => plan.phases).filter(item => item.kind === 'phase' && (!phaseId || item.libraryPhaseId === phaseId)).length, 0),
    isReady: pipelines ? loaded : ready, error, retry: () => setAttempt(value => value + 1),
  }
}

export type DurationUpdates = ReturnType<typeof useDurationUpdates>
