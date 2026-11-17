import type { Library, Project } from '../data/schemas.ts'
import { scheduleProject } from './project.ts'

export function durationCandidates(plans: Project[], library: Library, today: number, libraryPhaseId?: string) {
  return plans.flatMap(plan => plan.phases.flatMap(phase => {
    if (libraryPhaseId && phase.libraryPhaseId !== libraryPhaseId) return []
    const source = library.phases.find(item => item.id === phase.libraryPhaseId)
    return phase.kind === 'phase' && source && phase.weeks !== source.weeks ? [{ planId: plan.id, phaseId: phase.id, planName: plan.name, phaseName: phase.name, before: phase.weeks, after: source.weeks, eligible: phase.durationInherited && phase.s > today, reason: !phase.durationInherited ? 'Custom duration — unchanged' : phase.s <= today ? 'Already started or in the past — protected' : '' }] : []
  }))
}

export function previewDurationUpdates(plans: Project[], library: Library, selected: string[], today: number): Project[] {
  const allowed = new Set(durationCandidates(plans, library, today).filter(item => item.eligible).map(item => `${item.planId}:${item.phaseId}`))
  if (selected.some(key => !allowed.has(key))) throw new Error('Only future activities using Library durations can be updated. Review the selection again.')
  return plans.map(plan => {
    if (!plan.phases.some(phase => selected.includes(`${plan.id}:${phase.id}`))) return structuredClone(plan)
    const next = scheduleProject({ ...plan, phases: plan.phases.map(phase => selected.includes(`${plan.id}:${phase.id}`) ? { ...phase, weeks: library.phases.find(item => item.id === phase.libraryPhaseId)!.weeks } : { ...phase }) })
    for (const old of plan.phases) {
      const phase = next.phases.find(item => item.id === old.id)!
      if (old.s <= today && (old.s !== phase.s || old.e !== phase.e)) throw new Error(`${plan.name}: this update would move ${old.name}, which has already started or is in the past. Choose a different selection.`)
      if (old.s > today && phase.s <= today) throw new Error(`${plan.name}: this update would move ${old.name} into the past or today. Choose a different selection.`)
    }
    return next
  })
}
