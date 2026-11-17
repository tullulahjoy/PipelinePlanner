import { z } from 'zod'
import { scheduleProject } from '../domain/project.ts'
import { DAY, activeDays, distance, monday } from '../domain/calendar.ts'

export const workspaceNameSchema = z.string().trim().min(1, 'Enter a workspace name.').max(80, 'Use 80 characters or fewer.')

export const workspaceSchema = z.strictObject({
  schemaVersion: z.literal(1),
  id: z.uuid(),
  name: workspaceNameSchema,
  createdAt: z.iso.datetime(),
  createdBy: z.literal('local-user'),
  currentBaselineId: z.uuid().optional(),
  setupPipelineId: z.uuid().optional(),
  displayOrder: z.number().int().nonnegative().optional(),
})

export type Workspace = z.infer<typeof workspaceSchema>

export function readWorkspace(value: unknown): Workspace {
  return workspaceSchema.parse(value)
}

const name = z.string().trim().min(1, 'Enter a name.').max(150)
const weeks = z.number().int().min(1).max(5200)
const date = z.number().int().refine(value => value % DAY === 0, 'Use a date without a time.')
const color = z.string().regex(/^#[0-9a-f]{6}$/i, 'Choose a colour.')

export const phaseInputSchema = z.object({ name, weeks, color })
export const phaseDefinitionSchema = phaseInputSchema.extend({ checks: z.array(z.object({ target: z.union([z.literal('self'), z.uuid()]), severity: z.enum(['warning', 'critical']), reason: z.string().trim().max(1000) })) })
export type PhaseDefinition = z.infer<typeof phaseDefinitionSchema>
export const libraryPhaseSchema = phaseInputSchema.extend({ id: z.uuid() }).strict()
export const ruleInputSchema = z.object({ a: z.uuid(), b: z.uuid(), severity: z.enum(['warning', 'critical']), reason: z.string().trim().max(1000) })
export const librarySchema = z.strictObject({
  schemaVersion: z.literal(1), workspaceId: z.uuid(), revision: z.number().int().nonnegative(),
  phases: z.array(libraryPhaseSchema), rules: z.array(ruleInputSchema.extend({ id: z.uuid() }).strict()),
}).superRefine((library, context) => {
  const ids = new Set(library.phases.map(phase => phase.id))
  const pairs = library.rules.map(rule => [rule.a, rule.b].sort().join(':'))
  if (ids.size !== library.phases.length || new Set(library.rules.map(rule => rule.id)).size !== library.rules.length) context.addIssue({ code: 'custom', message: 'Library item identities must be distinct.' })
  if (library.rules.some(rule => !ids.has(rule.a) || !ids.has(rule.b)) || new Set(pairs).size !== pairs.length) context.addIssue({ code: 'custom', message: 'Clash rules must refer to workspace phases and have distinct phase pairs.' })
})

export const scheduleItemInputSchema = z.object({
  id: z.number().int().positive(), name, kind: z.enum(['phase', 'milestone']),
  weeks: z.number().int().min(0).max(5200), offset: z.number().int().min(-104).max(104),
  libraryPhaseId: z.string(), color, durationInherited: z.boolean(),
})
export const editorItemSchema = scheduleItemInputSchema.omit({ offset: true }).extend({ relation: z.enum(['after', 'overlap', 'gap']), amount: z.number().int().min(0).max(104) }).refine(item => item.relation === 'after' || item.amount >= 1, { path: ['amount'], message: 'Enter 1 to 104 whole weeks.' })
export const projectFormSchema = z.object({ name, anchorDate: z.iso.date(), anchorId: z.number().int().positive(), phases: z.array(editorItemSchema).min(1, 'Add a phase or milestone.') })
export const projectSchema = z.strictObject({
  id: z.uuid(), name, anchor: date, planningAnchor: date, anchorId: z.number().int().positive(), anchorName: name,
  nextPhaseId: z.number().int().positive(), approvedBaseline: z.null(),
  phases: z.array(scheduleItemInputSchema.extend({ s: date, e: date }).strict()).min(1),
}).superRefine((project, context) => {
  try {
    const calculated = scheduleProject(project)
    if (project.nextPhaseId <= Math.max(...project.phases.map(phase => phase.id))) throw new Error('New schedule identities must not reuse removed items.')
    if (project.phases.some(phase => phase.kind === 'phase' && !z.uuid().safeParse(phase.libraryPhaseId).success || phase.kind === 'milestone' && phase.libraryPhaseId !== '')) throw new Error('Link phases to a Library phase; milestones have no Library link.')
    const anchor = project.phases.find(phase => phase.id === project.anchorId)!
    // Active-week offsets cannot distinguish the two ends of a Christmas
    // pause. Validate the recorded dates themselves, rather than insisting on
    // the single calendar boundary chosen by an anchor-based recalculation.
    const invalidDates = project.phases.some((phase, i) =>
      phase.s !== monday(phase.s) || phase.e !== monday(phase.e) || phase.e < phase.s ||
      (phase.kind === 'milestone' ? phase.s !== phase.e : activeDays(phase.s, phase.e) !== phase.weeks * 7) ||
      i > 0 && distance(project.phases[i - 1].e, phase.s) !== phase.offset * 7)
    if (project.planningAnchor !== calculated.planningAnchor || anchor.s !== project.planningAnchor || anchor.e !== project.planningAnchor || project.anchorName !== anchor.name || invalidDates) throw new Error('The saved dates do not match the schedule. Preview the procurement again.')
  } catch (error) { context.addIssue({ code: 'custom', message: error instanceof Error ? error.message : 'Invalid schedule.' }) }
})

export const acknowledgementSchema = z.object({ signature: z.string().min(1), explanation: z.string().trim().min(1).max(2000) }).strict()
export const templateInputSchema = z.strictObject({
  name, description: z.string().trim().max(2000), anchorId: z.number().int().positive(),
  phases: z.array(scheduleItemInputSchema.strict()).min(1),
}).superRefine((value, context) => {
  try {
    scheduleProject({ ...value, id: 'template', anchor: Date.UTC(2030, 0, 7), planningAnchor: 0, anchorName: '', approvedBaseline: null, phases: value.phases.map(phase => ({ ...phase, s: 0, e: 0 })) })
  } catch (error) { context.addIssue({ code: 'custom', message: error instanceof Error ? error.message : 'Review the template schedule.' }) }
})
export const templateSchema = templateInputSchema.safeExtend({ schemaVersion: z.literal(1), id: z.uuid(), workspaceId: z.uuid(), revision: z.number().int().positive() })
export type ProcurementTemplate = z.infer<typeof templateSchema>
export type TemplateInput = z.infer<typeof templateInputSchema>
export const pipelineSchema = z.strictObject({
  schemaVersion: z.literal(1), id: z.uuid(), workspaceId: z.uuid(), revision: z.number().int().positive(),
  name, note: z.string().trim().max(2000).default(''), savedAt: z.iso.datetime(), savedBy: z.literal('Local user'),
  plans: z.array(projectSchema).min(1), acknowledgements: z.array(acknowledgementSchema),
  confirmation: z.strictObject({ at: z.iso.datetime(), by: z.literal('Local user'), rationale: z.string().trim().max(2000) }).optional(),
}).refine(record => new Set(record.plans.map(plan => plan.id)).size === record.plans.length, 'Procurement identities must be distinct.')

export type Library = z.infer<typeof librarySchema>
export type LibraryPhase = z.infer<typeof libraryPhaseSchema>
export type Project = z.infer<typeof projectSchema>
export type ProjectForm = z.infer<typeof projectFormSchema>
export type SavedPipeline = z.infer<typeof pipelineSchema>
export type Acknowledgement = z.infer<typeof acknowledgementSchema>
export type WorkspaceData = Workspace & { library: Library }

export const emptyLibrary = (workspaceId: string): Library => ({ schemaVersion: 1, workspaceId, revision: 0, phases: [], rules: [] })
