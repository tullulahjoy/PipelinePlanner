/// <reference types="node" />
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DAY, WEEK, activeDays, changePhaseDuration, clonePlans, dateChanges, dateMovementSummary, defaultSelection, findClashes,
  initialPlans, isPaused, monday, moveSelection, parseDate, planGaps,
} from './pipeline-scheduling.ts'
import type { DateChange } from './pipeline-scheduling.ts'

const movementExample: DateChange = {
  planId: 'movement-example', planName: 'Procurement', label: 'Evaluation', kind: 'phase',
  beforeStart: parseDate('2030-03-04'), beforeEnd: parseDate('2030-03-29'),
  afterStart: parseDate('2030-03-04'), afterEnd: parseDate('2030-03-29'), beforeWeeks: 4, afterWeeks: 4,
}

test('movement summaries combine matching start and finish moves into whole calendar weeks', () => {
  for (const [weeks, expected] of [[-3, '3 weeks earlier'], [2, '2 weeks later'], [-1, '1 week earlier'], [1, '1 week later']] as const) {
    assert.deepEqual(dateMovementSummary({ ...movementExample,
      afterStart: movementExample.beforeStart! + weeks * WEEK, afterEnd: movementExample.beforeEnd! + weeks * WEEK,
    }), [expected])
  }
})

test('movement summaries distinguish duration edits with a fixed start or finish', () => {
  assert.deepEqual(dateMovementSummary({ ...movementExample, afterEnd: movementExample.beforeEnd! - 2 * WEEK, afterWeeks: 2 }), ['Start: unchanged', 'Finish: 2 weeks earlier'])
  assert.deepEqual(dateMovementSummary({ ...movementExample, afterStart: movementExample.beforeStart! + 2 * WEEK, afterWeeks: 2 }), ['Start: 2 weeks later', 'Finish: unchanged'])
})

test('movement summaries show separately when start and finish move in different directions', () => {
  assert.deepEqual(dateMovementSummary({ ...movementExample,
    afterStart: movementExample.beforeStart! - WEEK, afterEnd: movementExample.beforeEnd! + 2 * WEEK,
  }), ['Start: 1 week earlier', 'Finish: 2 weeks later'])
})

test('movement summaries do not infer date movement from a duration-only difference', () => {
  assert.deepEqual(dateMovementSummary({ ...movementExample, afterWeeks: 5 }), ['Unchanged'])
})

test('actual anchor movement retains remaining days and stays date-only across daylight saving', () => {
  const anchor: DateChange = { ...movementExample, kind: 'anchor',
    beforeStart: parseDate('2030-03-30'), beforeEnd: parseDate('2030-03-30'),
    afterStart: parseDate('2030-04-08'), afterEnd: parseDate('2030-04-08'),
  }
  assert.deepEqual(dateMovementSummary(anchor), ['1 week and 2 days later'])
  assert.deepEqual(dateMovementSummary({ ...anchor, afterStart: parseDate('2030-03-29'), afterEnd: parseDate('2030-03-29') }), ['1 day earlier'])
})

test('added and removed gaps are labelled without inventing a movement amount', () => {
  assert.deepEqual(dateMovementSummary({ ...movementExample, kind: 'gap', beforeStart: null, beforeEnd: null }), ['Gap added'])
  assert.deepEqual(dateMovementSummary({ ...movementExample, kind: 'gap', afterStart: null, afterEnd: null }), ['Gap removed'])
  assert.deepEqual(dateMovementSummary({ ...movementExample, kind: 'gap', afterStart: movementExample.beforeStart! - 2 * WEEK, afterEnd: movementExample.beforeEnd! - 2 * WEEK }), ['2 weeks earlier'])
})

test('movement review distinguishes calendar shifts when a phase moves clear of Christmas', () => {
  const before = initialPlans(), after = moveSelection(before, defaultSelection(before[0]), -8)
  const moderation = dateChanges(before, after).find(change => change.label === 'Moderation')!
  assert.equal(moderation.beforeWeeks, moderation.afterWeeks)
  assert.deepEqual(dateMovementSummary(moderation), ['Start: 8 weeks earlier', 'Finish: 10 weeks earlier'])
})

test('sample phases use whole active weeks and Monday planning boundaries', () => {
  for (const plan of initialPlans()) for (const phase of plan.phases) {
    assert.equal(monday(phase.s), phase.s)
    assert.equal(monday(phase.e), phase.e)
    assert.equal(activeDays(phase.s, phase.e), phase.weeks * 7)
  }
})

test('earlier procurement activity creates a gap without extending costed mobilisation', () => {
  const before = initialPlans(), snapshot = clonePlans(before), selection = defaultSelection(before[0])
  const after = moveSelection(before, selection, -8)
  assert.deepEqual(before, snapshot, 'the input must not be mutated')
  assert.deepEqual(after.slice(1), before.slice(1))
  assert.deepEqual(after[0].phases.slice(selection.last + 1).map(({ offset: _offset, ...phase }) => phase), before[0].phases.slice(selection.last + 1).map(({ offset: _offset, ...phase }) => phase))
  assert.equal(after[0].phases[selection.last + 1].offset, 8)
  assert.equal(after[0].anchor, before[0].anchor)
  assert.deepEqual(after[0].approvedBaseline, before[0].approvedBaseline)
  assert.equal(planGaps(after[0]).length, 1)
  assert.ok(dateChanges(before, after).some(change => change.kind === 'gap'))
  for (const phase of after[0].phases) assert.equal(activeDays(phase.s, phase.e), phase.weeks * 7)
})

test('later movement cannot silently move unselected mobilisation or anchors', () => {
  const plans = initialPlans()
  assert.throws(() => moveSelection(plans, defaultSelection(plans[0]), 1), /later activity/)
  assert.throws(() => moveSelection(plans, { planId: plans[0].id, first: 0, last: 12 }, 1), /locked anchor/)
})

test('an explicitly unlocked whole procurement moves its actual anchor and preserves weekday', () => {
  const before = initialPlans()
  before[0].anchor += 3 * DAY
  const after = moveSelection(before, { planId: before[0].id, first: 0, last: 12 }, -8, true)
  assert.equal(after[0].anchor, before[0].anchor - 8 * WEEK)
  assert.equal(new Date(after[0].anchor).getUTCDay(), 4)
  assert.equal(after[0].planningAnchor, monday(after[0].anchor))
  assert.deepEqual(after[0].approvedBaseline, before[0].approvedBaseline)
  for (const phase of after[0].phases) assert.equal(activeDays(phase.s, phase.e), phase.weeks * 7)
})

test('Christmas extension disappears when a phase moves clear of the pause', () => {
  const before = initialPlans(), selection = defaultSelection(before[0])
  const after = moveSelection(before, selection, -8)
  const moderationBefore = before[0].phases[7], moderationAfter = after[0].phases[7]
  assert.equal(moderationBefore.e - moderationBefore.s, 8 * WEEK)
  assert.equal(moderationAfter.e - moderationAfter.s, 6 * WEEK)
  assert.equal(activeDays(moderationAfter.s, moderationAfter.e), 42)
  assert.equal(after[0].phases[7].offset, -2)
  assert.equal(activeDays(after[0].phases[7].s, after[0].phases[6].e), 14)
})

test('Christmas pauses cover exactly the two Monday weeks containing Christmas and New Year', () => {
  assert.equal(isPaused(parseDate('2029-12-23')), false)
  assert.equal(isPaused(parseDate('2029-12-24')), true)
  assert.equal(isPaused(parseDate('2030-01-06')), true)
  assert.equal(isPaused(parseDate('2030-01-07')), false)
})

test('clashes refresh across the pipeline after movements and can appear again', () => {
  const before = initialPlans(), selection = defaultSelection(before[0])
  assert.equal(findClashes(before).length, 2)
  const earlier = moveSelection(before, selection, -8)
  assert.equal(findClashes(earlier).length, 0)
  const restored = moveSelection(earlier, selection, 8)
  assert.equal(findClashes(restored).length, 2)
  assert.deepEqual(restored[0].phases, before[0].phases)
})

test('moving another procurement can introduce fresh warnings and critical clashes', () => {
  const before = initialPlans(), existing = new Set(findClashes(before).map(clash => clash.key))
  const after = moveSelection(before, { planId: before[2].id, first: 0, last: 4 }, -8, true)
  const introduced = findClashes(after).filter(clash => !existing.has(clash.key))
  assert.ok(introduced.some(clash => clash.severity === 'warning'))
  assert.ok(introduced.some(clash => clash.severity === 'critical'))
  for (const clash of findClashes(after)) for (const span of clash.spans) {
    assert.equal(activeDays(span.s, span.e) * DAY, span.e - span.s, 'paused portions do not trigger clashes')
  }
})

test('a single phase can move within an available gap and report revised gaps', () => {
  const before = initialPlans(), range = defaultSelection(before[0])
  const earlier = moveSelection(before, range, -8)
  const single = { planId: before[0].id, first: 9, last: 9 }
  const after = moveSelection(earlier, single, 1)
  assert.equal(after[0].phases[9].s, earlier[0].phases[9].s + WEEK)
  assert.deepEqual(after[0].phases.slice(10).map(p => [p.s, p.e]), earlier[0].phases.slice(10).map(p => [p.s, p.e]))
  assert.equal(planGaps(after[0]).length, 2)
  assert.throws(() => moveSelection(earlier, single, -1), /earlier activity/)
  assert.throws(() => moveSelection(earlier, single, 1.5), /whole weeks/)
})

test('shortening with a fixed start creates a gap afterwards without moving other dates', () => {
  const before = initialPlans(), snapshot = clonePlans(before)
  const selection = { planId: before[0].id, first: 8, last: 8 }
  const after = changePhaseDuration(before, selection, 18, 'start')
  assert.deepEqual(before, snapshot)
  assert.equal(after[0].phases[8].s, before[0].phases[8].s)
  assert.equal(after[0].phases[8].e, before[0].phases[8].e - 2 * WEEK)
  assert.deepEqual(after[0].phases.filter((_, i) => i !== 8).map(p => [p.s, p.e, p.weeks]), before[0].phases.filter((_, i) => i !== 8).map(p => [p.s, p.e, p.weeks]))
  assert.deepEqual(after.slice(1), before.slice(1))
  assert.equal(after[0].anchor, before[0].anchor)
  assert.deepEqual(after[0].approvedBaseline, before[0].approvedBaseline)
  assert.equal(planGaps(after[0])[0].s, after[0].phases[8].e)
  const review = dateChanges(before, after).find(change => change.label === 'Governance')!
  assert.equal(review.beforeWeeks, 20)
  assert.equal(review.afterWeeks, 18)
})

test('shortening with a fixed finish creates a gap before the phase', () => {
  const before = initialPlans()
  const after = changePhaseDuration(before, { planId: before[0].id, first: 8, last: 8 }, 18, 'finish')
  assert.equal(after[0].phases[8].s, before[0].phases[8].s + 2 * WEEK)
  assert.equal(after[0].phases[8].e, before[0].phases[8].e)
  assert.equal(planGaps(after[0])[0].e, after[0].phases[8].s)
  assert.equal(activeDays(after[0].phases[8].s, after[0].phases[8].e), 18 * 7)
})

test('freed space can be used by another phase and durations survive later moves', () => {
  const before = initialPlans()
  const shortened = changePhaseDuration(before, { planId: before[0].id, first: 8, last: 8 }, 18, 'start')
  const award = { planId: before[0].id, first: 9, last: 9 }
  const moved = moveSelection(shortened, award, -2)
  assert.equal(moved[0].phases[9].s, shortened[0].phases[8].e)
  assert.equal(moved[0].phases[8].weeks, 18)
  assert.equal(moved[0].anchor, before[0].anchor)
  const restored = changePhaseDuration(shortened, { planId: before[0].id, first: 8, last: 8 }, 20, 'start')
  assert.deepEqual(restored[0].phases, before[0].phases)
  assert.deepEqual(dateChanges(before, restored), [])
})

test('duration changes recalculate Christmas pauses in either direction', () => {
  const before = initialPlans(), selection = { planId: before[0].id, first: 7, last: 7 }
  assert.equal(before[0].phases[7].e - before[0].phases[7].s, 8 * WEEK)
  for (const keep of ['start', 'finish'] as const) {
    const after = changePhaseDuration(before, selection, 2, keep)
    assert.equal(after[0].phases[7].e - after[0].phases[7].s, 2 * WEEK)
    assert.equal(activeDays(after[0].phases[7].s, after[0].phases[7].e), 14)
    assert.equal(after[0].anchor, before[0].anchor)
    const expanded = changePhaseDuration(after, selection, 6, keep)
    assert.deepEqual(expanded[0].phases, before[0].phases)
  }
})

test('gaps exclude activity still running in an overlapping phase', () => {
  const before = initialPlans()
  const after = changePhaseDuration(before, { planId: before[0].id, first: 7, last: 7 }, 1, 'start')
  assert.ok(after[0].phases[7].e < after[0].phases[6].e)
  const gap = planGaps(after[0])[0]
  assert.equal(gap.s, after[0].phases[6].e)
  assert.equal(gap.e, after[0].phases[8].s)
})

test('duration updates refresh shared overlap checks without touching other procurements', () => {
  const before = initialPlans(), selection = { planId: before[0].id, first: 6, last: 6 }
  const after = changePhaseDuration(before, selection, 2, 'start')
  assert.equal(findClashes(before).filter(clash => clash.severity === 'warning').length, 1)
  assert.equal(findClashes(after).filter(clash => clash.severity === 'warning').length, 0)
  const restored = changePhaseDuration(after, selection, 6, 'start')
  assert.equal(findClashes(restored).filter(clash => clash.severity === 'warning').length, 1)
  assert.deepEqual(after.slice(1), before.slice(1))
})

test('duration edits validate whole weeks, milestones, anchors and available space', () => {
  const before = initialPlans(), snapshot = clonePlans(before)
  const selected = { planId: before[0].id, first: 8, last: 8 }
  for (const weeks of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 5201]) {
    assert.throws(() => changePhaseDuration(before, selected, weeks, 'start'), /whole weeks/)
  }
  assert.throws(() => changePhaseDuration(before, { ...selected, first: 3, last: 3 }, 4, 'start'), /Milestones/)
  assert.throws(() => changePhaseDuration(before, { ...selected, first: 6, last: 7 }, 4, 'start'), /one phase/)
  assert.throws(() => changePhaseDuration(before, { ...selected, first: 10, last: 10 }, 100, 'start'), /fixed anchor/)
  assert.throws(() => changePhaseDuration(before, { ...selected, first: 4, last: 4 }, 7, 'start'), /milestone/)
  assert.throws(() => changePhaseDuration(before, selected, 21, 'start'), /make space first/)
  assert.throws(() => changePhaseDuration(before, { ...selected, first: 6, last: 6 }, 1, 'finish'), /order of activity/)
  assert.deepEqual(changePhaseDuration(before, selected, 20, 'finish'), before)
  assert.deepEqual(before, snapshot)
})

test('connected Library rules can match different phases and are symmetric', () => {
  const plans = initialPlans()
  const rules = [{ id: 'custom', sourceId: 'dialogue', target: 'bid-writing', kind: 'type', severity: 'critical' as const, reason: 'Shared bidder activity' }]
  const found = findClashes(plans, rules)
  assert.ok(found.length > 0)
  assert.ok(found.every(clash => clash.ruleId === 'custom' && clash.reason === 'Shared bidder activity'))
  assert.deepEqual(findClashes(plans, []), [])
  assert.deepEqual(findClashes(plans, [{ ...rules[0], sourceId: 'bid-writing', target: 'dialogue' }]), found)
})

test('new procurements retain their null baseline during repeated duration changes', () => {
  const before = initialPlans()
  before[0].approvedBaseline = null
  const selection = { planId: before[0].id, first: 6, last: 6 }
  const short = changePhaseDuration(before, selection, 4, 'start', before)
  const restored = changePhaseDuration(short, selection, 6, 'start', before)
  assert.equal(restored[0].approvedBaseline, null)
  assert.deepEqual(restored[0].phases, before[0].phases)
})

test('default selections support an anchor-first schedule and milestone-only procurements', () => {
  const plan = initialPlans()[0]
  plan.phases = plan.phases.slice(11)
  assert.deepEqual(defaultSelection(plan), { planId: plan.id, first: 1, last: 1 })
  plan.phases = plan.phases.slice(0, 1)
  assert.deepEqual(defaultSelection(plan), { planId: plan.id, first: 0, last: 0 })
})
