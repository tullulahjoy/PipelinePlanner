import type { ProjectForm, Project, ProcurementTemplate } from '../../data/schemas.ts'

export const editorItems = (phases: Project['phases'] | ProcurementTemplate['phases']): ProjectForm['phases'] => phases.map(phase => ({ id: phase.id, name: phase.name, kind: phase.kind, weeks: phase.weeks, libraryPhaseId: phase.libraryPhaseId, color: phase.color, durationInherited: phase.durationInherited, relation: phase.offset < 0 ? 'overlap' : phase.offset > 0 ? 'gap' : 'after', amount: Math.abs(phase.offset) }))
export const scheduleItems = (phases: ProjectForm['phases']) => phases.map(({ relation, amount, ...phase }, index) => ({ ...phase, offset: index === 0 || relation === 'after' ? 0 : relation === 'overlap' ? -amount : amount, s: 0, e: 0 }))
