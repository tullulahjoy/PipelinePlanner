/** Shared scheduling and clash calculations. No fixtures, storage or UI dependencies. */
import { DAY, WEEK, activeDays, activeSpans, christmasBreaks, distance, formatDate, monday, moveActive } from './calendar.ts'

export interface Phase {
  id: number
  name: string
  kind: 'phase' | 'milestone'
  weeks: number
  offset: number
  libraryPhaseId: string
  color: string
  s: number
  e: number
}
export interface Plan {
  id: string
  name: string
  anchor: number
  planningAnchor: number
  anchorId: number
  anchorName: string
  phases: Phase[]
  approvedBaseline: { anchor: number; phases: Phase[] } | null
}
export interface OverlapRule {
  id: string; sourceId?: string; target?: string; kind?: string; a?: string; b?: string
  severity: 'warning' | 'critical'; reason?: string
}
export interface Selection { planId: string; first: number; last: number }
export interface Clash {
  key: string
  severity: 'warning' | 'critical'
  phase: string
  firstPlan: string
  secondPlan: string
  firstPlanName: string
  secondPlanName: string
  firstPhase: number
  secondPhase: number
  spans: { s: number; e: number }[]
  weeks: number
  secondPhaseName: string
  ruleId: string
  reason: string
}
export interface DateChange {
  planId: string; planName: string; label: string
  phaseId?: number
  beforeStart: number | null; beforeEnd: number | null
  afterStart: number | null; afterEnd: number | null
  beforeWeeks?: number; afterWeeks?: number
  kind: 'phase' | 'milestone' | 'anchor' | 'gap'
}
export const clonePlans = (plans: Plan[]): Plan[] => structuredClone(plans)

export const finishDate = (phase: Phase) => phase.kind === 'milestone' ? phase.s : phase.e - 3 * DAY

export function scheduleAtAnchor(plan: Plan, first: number, last: number) {
  const index = plan.phases.findIndex(p => p.id === plan.anchorId)
  plan.planningAnchor = monday(plan.anchor)
  plan.phases[index].s = plan.planningAnchor
  plan.phases[index].e = plan.planningAnchor
  for (let i = index - 1; i >= first; i--) {
    const item = plan.phases[i], next = plan.phases[i + 1]
    item.e = moveActive(next.s, -next.offset * 7)
    item.s = moveActive(item.e, -item.weeks * 7)
  }
  for (let i = index + 1; i <= last; i++) {
    const item = plan.phases[i], previous = plan.phases[i - 1]
    item.s = moveActive(previous.e, item.offset * 7)
    item.e = moveActive(item.s, item.weeks * 7)
  }
}
export function defaultSelection(plan: Plan): Selection {
  const first = plan.phases.findIndex(p => p.kind === 'phase')
  if (first < 0) return { planId: plan.id, first: 0, last: plan.phases.length - 1 }
  const anchor = plan.phases.findIndex(p => p.id === plan.anchorId)
  const beforeAnchor = plan.phases.findLastIndex((p, index) => p.kind === 'phase' && index < anchor)
  return { planId: plan.id, first, last: Math.max(first, beforeAnchor) }
}
export function selectedBounds(plan: Plan, selection: Selection) {
  const items = plan.phases.slice(selection.first, selection.last + 1)
  return { s: Math.min(...items.map(p => p.s)), e: Math.max(...items.map(p => p.e)) }
}
/** A drag is an intent in calendar weeks. Dates are recalculated, never stretched in pixels. */
export function moveSelection(plans: Plan[], selection: Selection, weeks: number, allowAnchor = false): Plan[] {
  if (!Number.isInteger(weeks) || Math.abs(weeks) > 104) throw new Error('Choose a movement of up to 104 whole weeks.')
  if (!weeks) return clonePlans(plans)
  const result = clonePlans(plans), plan = result.find(p => p.id === selection.planId)
  if (!plan) throw new Error('Select a procurement to move.')
  const { first, last } = selection, phases = plan.phases
  if (first < 0 || last < first || last >= phases.length) throw new Error('Choose a consecutive range of phases.')
  const anchorIndex = phases.findIndex(p => p.id === plan.anchorId)
  if (anchorIndex >= first && anchorIndex <= last) {
    if (!allowAnchor) throw new Error('The selection includes the locked anchor. Allow this anchor date to move, or choose phases that leave it in place.')
    plan.anchor += weeks * WEEK
    scheduleAtAnchor(plan, first, last)
  } else {
    phases[first].s += weeks * WEEK
    phases[first].e = moveActive(phases[first].s, phases[first].weeks * 7)
    for (let i = first + 1; i <= last; i++) {
      phases[i].s = moveActive(phases[i - 1].e, phases[i].offset * 7)
      phases[i].e = moveActive(phases[i].s, phases[i].weeks * 7)
    }
  }
  const original = plans.find(p => p.id === plan.id)!
  for (const boundary of [first, last + 1]) {
    if (boundary <= 0 || boundary >= phases.length) continue
    const offset = distance(phases[boundary - 1].e, phases[boundary].s) / 7
    if (!Number.isInteger(offset)) throw new Error('This movement does not produce whole-week relationships.')
    if (offset < Math.min(0, original.phases[boundary].offset)) {
      throw new Error(boundary === first
        ? 'This selection would run into earlier activity. Include that activity in the range or choose a smaller movement.'
        : 'This selection would run into later activity. Include that activity in the range or choose a smaller movement. Unselected phases and locked anchors stay in place.')
    }
    phases[boundary].offset = offset
  }
  return result
}
export type FixedPhaseBoundary = 'start' | 'finish'
/** Resize one phase, retaining the chosen boundary and every other activity's dates. */
export function changePhaseDuration(plans: Plan[], selection: Selection, weeks: number, keep: FixedPhaseBoundary, referencePlans = plans): Plan[] {
  if (!Number.isInteger(weeks) || weeks < 1 || weeks > 5200) throw new Error('Enter a duration of 1 to 5,200 whole weeks.')
  if (keep !== 'start' && keep !== 'finish') throw new Error('Choose which date to keep fixed.')
  const original = plans.find(plan => plan.id === selection.planId)
  const previous = original?.phases[selection.first]
  if (!original || selection.first !== selection.last || previous?.kind !== 'phase') throw new Error('Select one phase to change its duration. Milestones have no duration.')
  const result = clonePlans(plans), plan = result.find(item => item.id === original.id)!
  const phase = plan.phases[selection.first]
  if (phase.weeks === weeks) return result
  phase.weeks = weeks
  if (keep === 'start') phase.e = moveActive(phase.s, weeks * 7)
  else phase.s = moveActive(phase.e, -weeks * 7)

  const anchorIndex = plan.phases.findIndex(item => item.id === plan.anchorId)
  if (selection.first < anchorIndex && phase.e > plan.planningAnchor || selection.first > anchorIndex && phase.s < plan.planningAnchor) {
    throw new Error('This duration would cross the fixed anchor. Keep the other end of the phase fixed or choose a shorter duration.')
  }
  const previousItem = plan.phases[selection.first - 1], nextItem = plan.phases[selection.first + 1]
  if (previousItem && phase.s < previousItem.s || nextItem && phase.s > nextItem.s) {
    throw new Error('This duration would change the order of activity. Keep the other end fixed or adjust the neighbouring activity first.')
  }
  for (const other of plan.phases) {
    if (other.id === phase.id) continue
    const oldOther = original.phases.find(item => item.id === other.id)!
    if (other.kind === 'milestone') {
      const crossed = phase.s < other.s && phase.e > other.s
      const alreadyCrossed = previous.s < oldOther.s && previous.e > oldOther.s
      if (crossed && !alreadyCrossed) throw new Error(`This duration would run across the ${other.name} milestone. Keep the other end fixed or make space first.`)
      continue
    }
    const overlap = (a: Phase, b: Phase) => activeDays(Math.max(a.s, b.s), Math.min(a.e, b.e))
    const reference = plan.approvedBaseline?.phases ?? referencePlans.find(item => item.id === plan.id)?.phases ?? []
    const baselinePhase = reference.find(item => item.id === phase.id)
    const baselineOther = reference.find(item => item.id === other.id)
    const allowed = Math.max(overlap(previous, oldOther), baselinePhase && baselineOther ? overlap(baselinePhase, baselineOther) : 0)
    if (overlap(phase, other) > allowed) throw new Error(`This duration would run into ${other.name} beyond the existing planned overlap. Keep the other end fixed or make space first.`)
  }
  for (const boundary of [selection.first, selection.first + 1]) {
    if (boundary > 0 && boundary < plan.phases.length) {
      plan.phases[boundary].offset = distance(plan.phases[boundary - 1].e, plan.phases[boundary].s) / 7
    }
  }
  return result
}
export function findClashes(plans: Plan[], rules: OverlapRule[]): Clash[] {
  const result: Clash[] = []
  plans.forEach((plan, index) => plans.slice(index + 1).forEach(other => {
    for (const item of plan.phases) for (const target of other.phases) {
      if (item.kind === 'milestone' || target.kind === 'milestone' || !item.libraryPhaseId || !target.libraryPhaseId) continue
      const rule = rules.find(rule => {
        const first = rule.a ?? rule.sourceId, second = rule.b ?? (rule.kind === 'same' ? rule.sourceId : rule.target)
        return first === item.libraryPhaseId && second === target.libraryPhaseId || second === item.libraryPhaseId && first === target.libraryPhaseId
      })
      if (!rule) continue
      const spans = activeSpans(Math.max(item.s, target.s), Math.min(item.e, target.e))
      const weeks = spans.reduce((sum, span) => sum + (span.e - span.s) / WEEK, 0)
      if (weeks) result.push({ key: `${plan.id}:${item.id}:${other.id}:${target.id}`,
        severity: rule.severity, phase: item.name, secondPhaseName: target.name, ruleId: rule.id, reason: rule.reason || '',
        firstPlan: plan.id, secondPlan: other.id, firstPlanName: plan.name, secondPlanName: other.name, firstPhase: item.id, secondPhase: target.id, spans, weeks })
    }
  }))
  return result.sort((a, b) => Number(b.severity === 'critical') - Number(a.severity === 'critical') || a.spans[0].s - b.spans[0].s)
}
export function planGaps(plan: Plan) {
  const items = plan.phases.toSorted((a, b) => a.s - b.s || a.e - b.e)
  const gaps: { id: string; label: string; s: number; e: number }[] = []
  let covered = items[0]
  for (const item of items.slice(1)) {
    if (item.s > covered.e && activeDays(covered.e, item.s)) gaps.push({
      id: `${covered.id}:${item.id}`, label: `Gap before ${item.name}`, s: covered.e, e: item.s,
    })
    if (item.e >= covered.e) covered = item
  }
  return gaps
}
/** Non-working spans within the plotted schedule, without counting Christmas twice. */
export function planInactiveSpans(plan: Plan) {
  if (!plan.phases.length) return []
  const first = Math.min(...plan.phases.map(phase => phase.s)), last = Math.max(...plan.phases.map(phase => phase.e))
  return [
    ...christmasBreaks(first, last).map(span => ({ ...span, id: `christmas:${span.s}`, label: 'Christmas and New Year break' })),
    ...planGaps(plan).flatMap(gap => activeSpans(gap.s, gap.e).map(span => ({ ...span, id: `${gap.id}:${span.s}`, label: gap.label }))),
  ].sort((a, b) => a.s - b.s)
}
export function dateChanges(before: Plan[], after: Plan[]): DateChange[] {
  return after.flatMap(plan => {
    const old = before.find(p => p.id === plan.id)!
    const changes: DateChange[] = plan.phases.flatMap(item => {
      const previous = old.phases.find(p => p.id === item.id)!
      return item.s === previous.s && item.e === previous.e && item.weeks === previous.weeks ? [] : [{ planId: plan.id, planName: plan.name,
        label: item.name, phaseId: item.id, kind: item.kind, beforeStart: previous.s, beforeEnd: finishDate(previous),
        afterStart: item.s, afterEnd: finishDate(item),
        ...(item.kind === 'phase' ? { beforeWeeks: previous.weeks, afterWeeks: item.weeks } : {}) }]
    })
    if (old.anchor !== plan.anchor) changes.unshift({ planId: plan.id, planName: plan.name, label: `Anchor: ${plan.anchorName}`,
      kind: 'anchor', beforeStart: old.anchor, beforeEnd: old.anchor, afterStart: plan.anchor, afterEnd: plan.anchor })
    const oldGaps = planGaps(old), newGaps = planGaps(plan)
    for (const gap of newGaps) {
      const previous = oldGaps.find(g => g.id === gap.id)
      if (previous?.s === gap.s && previous.e === gap.e) continue
      changes.push({ planId: plan.id, planName: plan.name, label: gap.label, kind: 'gap',
        beforeStart: previous?.s ?? null, beforeEnd: previous?.e ?? null, afterStart: gap.s, afterEnd: gap.e })
    }
    for (const gap of oldGaps.filter(g => !newGaps.some(next => next.id === g.id))) changes.push({
      planId: plan.id, planName: plan.name, label: gap.label, kind: 'gap', beforeStart: gap.s, beforeEnd: gap.e,
      afterStart: null, afterEnd: null,
    })
    return changes
  })
}
/** Calendar movement is independent of a phase's active-week duration. */
export function dateMovementSummary(change: DateChange): string[] {
  if (change.beforeStart === null) return [change.afterStart === null ? 'Unchanged' : change.kind === 'gap' ? 'Gap added' : 'Added']
  if (change.afterStart === null) return [change.kind === 'gap' ? 'Gap removed' : 'Removed']
  function movement(before: number | null, after: number | null) {
    if (before === null || after === null) return 'Not available'
    const delta = after - before
    if (!delta) return 'Unchanged'
    const totalDays = Math.abs(delta) / DAY, weeks = Math.floor(totalDays / 7), days = totalDays % 7
    const parts: string[] = []
    if (weeks) parts.push(`${weeks} ${weeks === 1 ? 'week' : 'weeks'}`)
    if (days) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`)
    return `${parts.join(' and ')} ${delta < 0 ? 'earlier' : 'later'}`
  }
  const start = movement(change.beforeStart, change.afterStart), finish = movement(change.beforeEnd, change.afterEnd)
  return start === finish ? [start] : [`Start: ${start.toLowerCase()}`, `Finish: ${finish.toLowerCase()}`]
}
export function clashDates(clash: Clash) {
  return clash.spans.map(span => `${formatDate(span.s)} to ${formatDate(span.e - 3 * DAY)}`).join('; ')
}
