/** Shared schedule comparison; saved schedules carry no clash-rule snapshots here. */
import { DAY, WEEK, activeDays } from './calendar.ts'
import { dateMovementSummary, findClashes, finishDate, planGaps } from './scheduling.ts'
import type { Clash, OverlapRule, Phase, Plan } from './scheduling.ts'

export interface PipelineSchedule {
  name: string
  plans: Plan[]
}

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

const phaseValue = (phase: Plan['phases'][number]): ComparisonValue => ({
  name: phase.name, start: phase.s, end: finishDate(phase),
  ...(phase.kind === 'phase' ? { weeks: phase.weeks, weekType: 'active' as const } : { note: 'Milestone' }),
})
const planValue = (plan: Plan): ComparisonValue => ({ name: plan.name,
  start: Math.min(...plan.phases.map(phase => phase.s)), end: Math.max(...plan.phases.map(finishDate)),
  note: `${plan.phases.filter(phase => phase.kind === 'phase').length} phases; ${plan.anchorName}: anchor recorded in this version.`,
})
const gapValue = (gap: ReturnType<typeof planGaps>[number]): ComparisonValue => ({ start: gap.s, end: gap.e, weeks: (gap.e - gap.s) / WEEK, weekType: 'calendar' })

/** Compare identities and stored values, including additions and removals. */
export function compareSchedules(before: PipelineSchedule, after: PipelineSchedule): VersionChange[] {
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
      id: `${planId}:anchor`, label: 'Anchor', kind: 'anchor', status: 'changed',
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

export function christmasExplanation(previous?: Phase, next?: Phase): string | null {
  if (!previous || !next || previous.kind !== 'phase' || next.kind !== 'phase') return null
  const paused = (phase: Phase) => (phase.e - phase.s) / DAY - activeDays(phase.s, phase.e)
  const before = paused(previous), after = paused(next)
  if (before === after) return null
  const explanation = !before ? 'Now includes the Christmas break' : !after ? 'No longer includes the Christmas break' : 'The amount of Christmas break within this phase changed'
  return `${explanation}; ${previous.weeks === next.weeks ? 'active duration unchanged' : `active duration also changed from ${previous.weeks} to ${next.weeks} weeks`}.`
}

const phaseId = (change: VersionChange) => Number(change.id.slice(change.id.lastIndexOf(':') + 1))
export function projectComparisons(before: PipelineSchedule, after: PipelineSchedule) {
  const changes = compareSchedules(before, after)
  const ids = [...new Set(changes.map(change => change.planId))]
  return ids.map(id => {
    const previous = before.plans.find(plan => plan.id === id), next = after.plans.find(plan => plan.id === id)
    const entries = changes.filter(change => change.planId === id)
    const notes = new Map<string, string>()
    for (const entry of entries.filter(change => change.kind === 'phase')) {
      const note = christmasExplanation(previous?.phases.find(p => p.id === phaseId(entry)), next?.phases.find(p => p.id === phaseId(entry)))
      if (note) notes.set(entry.id, note)
    }
    const labels: string[] = [], summaries: string[] = []
    if (!previous || !next) {
      labels.push(`Only in ${next ? after.name : before.name}`)
      summaries.push(`This procurement is only in ${next ? after.name : before.name}.`)
      return { id, name: (next ?? previous)!.name, entries, notes, labels, summaries }
    }
    const start = (plan: Plan) => plan.phases.length ? Math.min(...plan.phases.map(phase => phase.s)) : null
    const oldStart = start(previous), newStart = start(next)
    if (oldStart !== null && newStart !== null && oldStart !== newStart) {
      const movement = dateMovementSummary({ planId: id, planName: next.name, label: 'Start', kind: 'milestone', beforeStart: oldStart, beforeEnd: oldStart, afterStart: newStart, afterEnd: newStart })[0]
      labels.push(`Begins ${movement}`)
    }
    const phaseChanges = entries.filter(change => change.kind === 'phase')
    if (phaseChanges.some(change => change.details.includes('Duration changed') && change.before?.weeks !== undefined && change.after?.weeks !== undefined)) labels.push('Phase durations altered')
    if (phaseChanges.some(change => !change.before)) labels.push('Activities added')
    if (phaseChanges.some(change => !change.after)) labels.push('Activities removed')
    const dateEntries = phaseChanges.filter(change => change.before?.start !== undefined && change.after?.start !== undefined)
    const movements = new Set(dateEntries.map(change => `${change.after!.start! - change.before!.start!}:${change.after!.end! - change.before!.end!}`))
    if (movements.size > 1 || dateEntries.some(change => change.details.includes('Dates changed')) && next.phases.some(phase => !dateEntries.some(change => phaseId(change) === phase.id))) labels.push('Phase timings altered')
    if (entries.some(change => change.kind === 'anchor')) labels.push('Anchor altered')
    if (entries.some(change => change.kind === 'gap')) labels.push('Gaps altered')
    if (entries.some(change => change.details.includes('Name changed'))) labels.push('Names altered')
    if (entries.some(change => change.details.includes('Order changed'))) labels.push('Activity order altered')
    if (!labels.length) labels.push('Activity details altered')

    // Only combine adjacent identities in BOTH saved orders, with equal start/finish
    // movement, unchanged work duration and no other edited properties.
    const eligible = (change: VersionChange) => change.kind === 'phase' && change.status === 'changed'
      && change.details.length === 1 && change.details[0] === 'Dates changed' && !notes.has(change.id)
      && change.before!.weeks === change.after!.weeks
      && change.after!.start! - change.before!.start! === change.after!.end! - change.before!.end!
    const ordered = [...phaseChanges.filter(change => change.after).sort((a, b) => next.phases.findIndex(p => p.id === phaseId(a)) - next.phases.findIndex(p => p.id === phaseId(b))), ...phaseChanges.filter(change => !change.after)]
    for (let i = 0; i < ordered.length;) {
      const first = ordered[i]; let last = i
      if (eligible(first)) while (last + 1 < ordered.length) {
        const current = ordered[last], candidate = ordered[last + 1]
        if (!eligible(candidate) || candidate.after!.start! - candidate.before!.start! !== first.after!.start! - first.before!.start!) break
        if (next.phases.findIndex(p => p.id === phaseId(candidate)) !== next.phases.findIndex(p => p.id === phaseId(current)) + 1 || previous.phases.findIndex(p => p.id === phaseId(candidate)) !== previous.phases.findIndex(p => p.id === phaseId(current)) + 1) break
        last++
      }
      const movement = comparisonMovementSummary(first, before.name, after.name).join('; ')
      if (last > i) summaries.push(`${first.label} to ${ordered[last].label} moved ${movement}.`)
      else if (!first.before || !first.after) summaries.push(`${first.label}: ${scheduleDifferenceLabel(first, before.name, after.name)}.`)
      else {
        const parts: string[] = []
        if (first.details.includes('Duration changed') && first.before.weeks !== undefined && first.after.weeks !== undefined) parts.push(`active duration ${first.after.weeks > first.before.weeks ? 'increased' : 'decreased'} from ${first.before.weeks} to ${first.after.weeks} weeks`)
        if (first.details.includes('Dates changed')) parts.push(movement)
        const other = first.details.filter(detail => detail !== 'Dates changed' && detail !== 'Duration changed').map(detail => detail.toLowerCase())
        parts.push(...other)
        summaries.push(`${first.label}: ${parts.join('; ')}.${notes.has(first.id) ? ` ${notes.get(first.id)}` : ''}`)
      }
      i = last + 1
    }
    for (const entry of entries.filter(change => change.kind !== 'phase')) {
      if (entry.kind === 'anchor') summaries.push(`${entry.label}: ${comparisonMovementSummary(entry, before.name, after.name).join('; ')}${entry.before?.name !== entry.after?.name ? `; ${entry.before?.name} to ${entry.after?.name}` : ''}.`)
      else if (entry.kind === 'gap') summaries.push(`${entry.label}: ${!entry.before || !entry.after ? scheduleDifferenceLabel(entry, before.name, after.name) : comparisonMovementSummary(entry, before.name, after.name).join('; ')}.`)
      else summaries.push(`Procurement renamed from ${previous.name} to ${next.name}.`)
    }
    return { id, name: next.name, entries, notes, labels, summaries }
  })
}

const pairKey = (clash: Clash) => [`${clash.firstPlan}:${clash.firstPhase}`, `${clash.secondPlan}:${clash.secondPhase}`].sort().join('|')
export function compareFindings(before: Clash[], after: Clash[]) {
  const oldFindings = new Map(before.map(finding => [pairKey(finding), finding]))
  const newFindings = new Map(after.map(finding => [pairKey(finding), finding]))
  return [...new Set([...oldFindings.keys(), ...newFindings.keys()])].map(key => {
    const previous = oldFindings.get(key), next = newFindings.get(key)
    const same = previous && next && previous.severity === next.severity && previous.reason === next.reason && JSON.stringify(previous.spans) === JSON.stringify(next.spans)
    return { key, before: previous, after: next, status: !previous ? 'New' : !next ? 'Resolved' : same ? 'Unchanged' : 'Changed' }
  })
}

export const findingIdentity = (finding: Clash) => JSON.stringify([[finding.firstPlan, finding.firstPhase], [finding.secondPlan, finding.secondPhase]].sort((a, b) => String(a).localeCompare(String(b))))

/** Both sides use the same current workspace rules, including fixed baselines. Matching issues stay visible. */
export function comparePipelineFindings(before: PipelineSchedule, after: PipelineSchedule, currentRules: OverlapRule[]) {
  return compareFindings(findClashes(before.plans, currentRules), findClashes(after.plans, currentRules)).map(change => {
    const finding = (change.after ?? change.before)!
    return {
      ...change,
      finding,
      pair: JSON.stringify([finding.firstPlan, finding.secondPlan].sort()),
      severity: change.before?.severity === 'critical' || change.after?.severity === 'critical' ? 'critical' as const : 'warning' as const,
    }
  })
}
