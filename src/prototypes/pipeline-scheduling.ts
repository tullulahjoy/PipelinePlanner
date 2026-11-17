/** Compatibility entry: existing prototype imports share the application calculations. */
import { defaultSelection as selectCurrentRange, findClashes as assessClashes } from '../domain/scheduling.ts'
import type { OverlapRule, Plan } from '../domain/scheduling.ts'
import { SAMPLE_RULES } from './pipeline-fixtures.ts'

export * from '../domain/calendar.ts'
export * from '../domain/scheduling.ts'
export { initialPlans, SAMPLE_RULES } from './pipeline-fixtures.ts'

/** The prototype alone retains its sample-rule default. The domain requires explicit rules. */
export function findClashes(plans: Plan[], rules: OverlapRule[] = SAMPLE_RULES) {
  return assessClashes(plans, rules)
}

/** Preserve the reference demo's initial award selection; real data uses phase order. */
export function defaultSelection(plan: Plan) {
  const selection = selectCurrentRange(plan)
  const award = plan.phases.findIndex(phase => phase.libraryPhaseId === 'award')
  const anchor = plan.phases.findIndex(phase => phase.id === plan.anchorId)
  return award >= selection.first && award < anchor ? { ...selection, last: award } : selection
}
