/** Version records and comparisons, including fixed illustrative records. */
import {
  WEEK, SAMPLE_RULES, changePhaseDuration, clonePlans, dateMovementSummary, defaultSelection, findClashes,
  finishDate, initialPlans, moveSelection, planGaps,
} from './pipeline-scheduling.ts'
import type { Clash, OverlapRule, Plan } from './pipeline-scheduling.ts'
import type { PipelineSource } from './pipeline-connected-types'

export interface PipelineVersion {
  id: string
  number: number
  revision?: number
  name: string
  note: string
  savedAt: string
  savedBy: string
  savedById?: string
  isExample?: boolean
  isPreview?: boolean
  status: 'saved' | 'current' | 'previous'
  plans: Plan[]
  rules: OverlapRule[]
  confirmation?: BaselineConfirmation
}
export interface BaselineConfirmation { at: string; by: string; byId: string; fromBaselineId?: string; rationale?: string }
export interface BaselineEvent {
  id: string; type: 'confirmed'; versionId: string; previousBaselineId: string | null
  rationale?: string; at: string; by: string; byId: string
}
export interface BaselineState { currentId: string; events: BaselineEvent[] }
export interface BaselineActionSource { version: PipelineVersion; baseline: PipelineVersion; currentBaselineId: string; working: PipelineSource; editor: { id: string; name: string } }
export interface ComparisonValue {
  name?: string
  start?: number
  end?: number
  weeks?: number
  weekType?: 'active' | 'calendar'
  note?: string
}
export interface VersionChange {
  id: string
  planId: string
  planName: string
  label: string
  kind: 'procurement' | 'phase' | 'anchor' | 'gap'
  status: 'added' | 'removed' | 'changed'
  before: ComparisonValue | null
  after: ComparisonValue | null
  details: string[]
}
export const statusLabel: Record<PipelineVersion['status'], string> = {
  saved: 'Saved pipeline', current: 'Current baseline · Live pipeline', previous: 'Previous baseline',
}

function examples(): PipelineVersion[] {
  const baseline = initialPlans()
  const first = clonePlans(baseline.slice(0, 2))
  const iteration = moveSelection(baseline, defaultSelection(baseline[0]), -4)
  let proposal = moveSelection(baseline, defaultSelection(baseline[0]), -8)
  proposal = changePhaseDuration(proposal, { planId: proposal[0].id, first: 8, last: 8 }, 18, 'start')
  const readiness = proposal[0].phases[8].e
  proposal[0].phases.splice(9, 0, {
    id: 101, name: 'Internal readiness review', kind: 'milestone', weeks: 0,
    offset: 0, libraryPhaseId: '', color: '#536ea1', s: readiness, e: readiness,
  })
  const property = clonePlans([baseline[2]])
  property[0].id = 'property-services'
  property[0].name = 'Property services procurement'
  const movedProperty = moveSelection(property, { planId: property[0].id, first: 0, last: property[0].phases.length - 1 }, 26, true)[0]
  movedProperty.phases[1].name = 'Bid assessment'
  proposal = [...proposal.slice(0, 2), movedProperty]
  const rules = structuredClone(SAMPLE_RULES)
  // This version records an example rule change independently of today's Library.
  const proposedRules = [...structuredClone(rules), {
    id: 'example-dialogue', sourceId: 'dialogue', target: 'bid-writing', kind: 'type',
    severity: 'warning' as const, reason: 'Dialogue and bid writing need the same commercial support.',
  }]
  return [
    { id: 'v04', number: 4, name: 'Revised delivery sequence', status: 'saved',
      note: 'Earlier community services activity, shorter governance, a readiness milestone and an updated procurement list.',
      savedAt: '2026-10-29T11:20:00Z', savedBy: 'Alex Morgan', plans: proposal, rules: proposedRules },
    { id: 'v03', number: 3, name: 'Earlier community services launch', status: 'saved',
      note: 'An intermediate option retained before the wider changes in version 04.',
      savedAt: '2026-10-23T14:10:00Z', savedBy: 'Sam Patel', plans: iteration, rules: structuredClone(rules) },
    { id: 'v02', number: 2, name: 'Autumn pipeline', status: 'current',
      note: 'Facilities support added to the pipeline.',
      savedAt: '2026-10-12T10:30:00Z', savedBy: 'Alex Morgan', plans: baseline, rules: structuredClone(rules),
      confirmation: { at: '2026-10-15T14:00:00Z', by: 'Alex Morgan', byId: 'demo-editor-alex', fromBaselineId: 'v01', rationale: 'Facilities support added to the pipeline.' } },
    { id: 'v01', number: 1, name: 'Initial pipeline', status: 'previous',
      note: 'The first baseline, before facilities support was added.',
      savedAt: '2026-09-02T09:00:00Z', savedBy: 'Sam Patel', plans: first, rules: structuredClone(rules),
      confirmation: { at: '2026-09-04T11:00:00Z', by: 'Alex Morgan', byId: 'demo-editor-alex', rationale: 'First recorded pipeline.' } },
  ]
}
export const EXAMPLE_VERSIONS = examples()

export const compareVersionAge = (first: PipelineVersion, second: PipelineVersion) =>
  Date.parse(first.savedAt) - Date.parse(second.savedAt) || first.number - second.number || first.id.localeCompare(second.id)

/** General comparisons retain the user's selections, regardless of save date. */
export function comparisonPair(versions: PipelineVersion[], firstId: string, secondId: string) {
  const first = versions.find(version => version.id === firstId)
  const second = versions.find(version => version.id === secondId)
  if (!first || !second || versions.length < 2) return null
  return { before: first, after: first.id === second.id ? versions.find(version => version.id !== first.id)! : second }
}

export function scheduleDifferenceLabel(change: VersionChange, firstName: string, secondName: string) {
  if (!change.before) return `Only in ${secondName}`
  if (!change.after) return `Only in ${firstName}`
  if (change.kind === 'gap') return 'Different gap dates or length'
  const fields: Record<string, string> = { 'Dates changed': 'dates', 'Duration changed': 'duration', 'Name changed': 'name', 'Anchor changed': 'anchor', 'Phase or milestone changed': 'activity type', 'Timing relationship changed': 'overlap or gap', 'Library phase changed': 'Library phase', 'Order changed': 'order' }
  return `Different ${change.details.map(detail => fields[detail] ?? detail.toLowerCase()).join(', ') || 'details'}`
}

export function findingDifferenceLabel(before: Clash | undefined, after: Clash | undefined, firstName: string, secondName: string) {
  if (!before) return `Only in ${secondName}`
  if (!after) return `Only in ${firstName}`
  const fields = [before.severity !== after.severity ? 'severity' : '', before.reason !== after.reason ? 'explanation' : '', JSON.stringify(before.spans) !== JSON.stringify(after.spans) ? 'overlap dates' : ''].filter(Boolean)
  return `Different ${fields.join(', ') || 'details'}`
}

/** Movement follows the selected second pipeline relative to the first, never save chronology. */
export function comparisonMovementSummary(change: VersionChange, firstName: string, secondName: string, directional = false): string[] {
  if (!change.before || !change.after) {
    if (!directional) return [scheduleDifferenceLabel(change, firstName, secondName)]
    return [change.kind === 'gap' ? change.before ? 'Gap removed' : 'Gap added' : change.before ? 'Removed' : 'Added']
  }
  if (change.before.start === undefined || change.after.start === undefined) return ['Not applicable']
  return dateMovementSummary({
    planId: change.planId, planName: change.planName, label: change.label, kind: change.kind === 'procurement' ? 'phase' : change.kind,
    beforeStart: change.before.start, beforeEnd: change.before.end ?? change.before.start,
    afterStart: change.after.start, afterEnd: change.after.end ?? change.after.start,
  })
}

export function ruleDifferenceLabel(before: OverlapRule | undefined, after: OverlapRule | undefined, firstName: string, secondName: string) {
  if (!before) return `Only in ${secondName}`
  if (!after) return `Only in ${firstName}`
  const phases = (rule: OverlapRule) => [rule.a ?? rule.sourceId, rule.b ?? (rule.kind === 'same' ? rule.sourceId : rule.target)].sort().join('|')
  const fields = [phases(before) !== phases(after) ? 'phases' : '', before.severity !== after.severity ? 'severity' : '', (before.reason ?? '') !== (after.reason ?? '') ? 'explanation' : ''].filter(Boolean)
  return `Different ${fields.join(', ') || 'rule details'}`
}

const phaseValue = (phase: Plan['phases'][number]): ComparisonValue => ({
  name: phase.name, start: phase.s, end: finishDate(phase),
  ...(phase.kind === 'phase' ? { weeks: phase.weeks, weekType: 'active' as const } : { note: 'Milestone' }),
})
const planValue = (plan: Plan): ComparisonValue => ({ name: plan.name,
  start: Math.min(...plan.phases.map(phase => phase.s)), end: Math.max(...plan.phases.map(finishDate)),
  note: `${plan.phases.filter(phase => phase.kind === 'phase').length} phases; ${plan.anchorName}: actual anchor recorded in this version.`,
})
const gapValue = (gap: ReturnType<typeof planGaps>[number]): ComparisonValue => ({ start: gap.s, end: gap.e, weeks: (gap.e - gap.s) / WEEK, weekType: 'calendar' })

/** Compare identities and stored values, including additions and removals. */
export function compareVersionSchedules(before: PipelineVersion, after: PipelineVersion): VersionChange[] {
  const result: VersionChange[] = []
  const oldPlans = new Map(before.plans.map(plan => [plan.id, plan]))
  const newPlans = new Map(after.plans.map(plan => [plan.id, plan]))
  for (const planId of new Set([...oldPlans.keys(), ...newPlans.keys()])) {
    const previous = oldPlans.get(planId), next = newPlans.get(planId)
    const common = { planId, planName: (next ?? previous)!.name }
    if (!previous || !next) {
      result.push({ ...common, id: `${planId}:procurement`, label: 'Whole procurement', kind: 'procurement',
        status: next ? 'added' : 'removed', before: previous ? planValue(previous) : null, after: next ? planValue(next) : null, details: [] })
      continue
    }
    if (previous.name !== next.name) result.push({ ...common, id: `${planId}:name`, label: 'Procurement name', kind: 'procurement', status: 'changed', before: { name: previous.name }, after: { name: next.name }, details: ['Name changed'] })
    if (previous.anchor !== next.anchor || previous.anchorId !== next.anchorId || previous.anchorName !== next.anchorName) result.push({ ...common,
      id: `${planId}:anchor`, label: 'Actual anchor', kind: 'anchor', status: 'changed',
      before: { name: previous.anchorName, start: previous.anchor }, after: { name: next.anchorName, start: next.anchor }, details: ['Anchor changed'] })
    const oldPhases = new Map(previous.phases.map(phase => [phase.id, phase]))
    const newPhases = new Map(next.phases.map(phase => [phase.id, phase]))
    const commonOldOrder = previous.phases.filter(phase => newPhases.has(phase.id)).map(phase => phase.id)
    const commonNewOrder = next.phases.filter(phase => oldPhases.has(phase.id)).map(phase => phase.id)
    for (const phaseId of new Set([...oldPhases.keys(), ...newPhases.keys()])) {
      const oldPhase = oldPhases.get(phaseId), phase = newPhases.get(phaseId)
      const row = { ...common, id: `${planId}:phase:${phaseId}`, label: (phase ?? oldPhase)!.name, kind: 'phase' as const }
      if (!oldPhase || !phase) {
        result.push({ ...row, status: phase ? 'added' : 'removed', before: oldPhase ? phaseValue(oldPhase) : null, after: phase ? phaseValue(phase) : null, details: [] })
        continue
      }
      const details = [
        ...(oldPhase.s !== phase.s || oldPhase.e !== phase.e ? ['Dates changed'] : []),
        ...(oldPhase.weeks !== phase.weeks ? ['Duration changed'] : []),
        ...(oldPhase.name !== phase.name ? ['Name changed'] : []),
        ...(oldPhase.kind !== phase.kind ? ['Phase or milestone changed'] : []),
        ...(oldPhase.offset !== phase.offset ? ['Timing relationship changed'] : []),
        ...(oldPhase.libraryPhaseId !== phase.libraryPhaseId ? ['Library phase changed'] : []),
        ...(commonOldOrder.indexOf(phaseId) !== commonNewOrder.indexOf(phaseId) ? ['Order changed'] : []),
      ]
      if (details.length) result.push({ ...row, status: 'changed', before: phaseValue(oldPhase), after: phaseValue(phase), details })
    }
    const oldGaps = new Map(planGaps(previous).map(gap => [gap.id, gap]))
    const newGaps = new Map(planGaps(next).map(gap => [gap.id, gap]))
    for (const id of new Set([...oldGaps.keys(), ...newGaps.keys()])) {
      const oldGap = oldGaps.get(id), gap = newGaps.get(id)
      if (oldGap?.s === gap?.s && oldGap?.e === gap?.e) continue
      result.push({ ...common, id: `${planId}:gap:${id}`, label: (gap ?? oldGap)!.label, kind: 'gap',
        status: !oldGap ? 'added' : !gap ? 'removed' : 'changed', before: oldGap ? gapValue(oldGap) : null, after: gap ? gapValue(gap) : null, details: [] })
    }
  }
  return result
}

const pairKey = (clash: Clash) => [`${clash.firstPlan}:${clash.firstPhase}`, `${clash.secondPlan}:${clash.secondPhase}`].sort().join('|')
export function compareVersionFindings(before: PipelineVersion, after: PipelineVersion) {
  const oldFindings = new Map(findClashes(before.plans, before.rules).map(finding => [pairKey(finding), finding]))
  const newFindings = new Map(findClashes(after.plans, after.rules).map(finding => [pairKey(finding), finding]))
  return [...new Set([...oldFindings.keys(), ...newFindings.keys()])].map(key => {
    const previous = oldFindings.get(key), next = newFindings.get(key)
    const same = previous && next && previous.severity === next.severity && previous.reason === next.reason && JSON.stringify(previous.spans) === JSON.stringify(next.spans)
    return { key, before: previous, after: next, status: !previous ? 'New' : !next ? 'Resolved' : same ? 'Unchanged' : 'Changed' }
  })
}

export function ruleDescription(rule: OverlapRule, version: PipelineVersion) {
  const first = rule.a ?? rule.sourceId, second = rule.b ?? (rule.kind === 'same' ? rule.sourceId : rule.target)
  const name = (id?: string) => version.plans.flatMap(plan => plan.phases).find(phase => phase.libraryPhaseId === id)?.name ?? id ?? 'Unknown phase'
  return first === second ? `${name(first)} phases in different procurements` : `${name(first)} and ${name(second)} in different procurements`
}
const ruleSignature = (rule: OverlapRule) => JSON.stringify({
  phases: [rule.a ?? rule.sourceId, rule.b ?? (rule.kind === 'same' ? rule.sourceId : rule.target)].sort(), severity: rule.severity, reason: rule.reason ?? '',
})
export function compareVersionRules(before: PipelineVersion, after: PipelineVersion) {
  const oldRules = new Map(before.rules.map(rule => [rule.id, rule])), newRules = new Map(after.rules.map(rule => [rule.id, rule]))
  return [...new Set([...oldRules.keys(), ...newRules.keys()])].flatMap(id => {
    const previous = oldRules.get(id), next = newRules.get(id)
    if (previous && next && ruleSignature(previous) === ruleSignature(next)) return []
    return [{ id, before: previous, after: next, status: !previous ? 'Added' : !next ? 'Removed' : 'Changed' }]
  })
}
