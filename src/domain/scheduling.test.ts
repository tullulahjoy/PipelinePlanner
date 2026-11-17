/// <reference types="node" />
import assert from 'node:assert/strict'
import test from 'node:test'
import { DAY, WEEK, activeDays, activeSpans, isoDate, monday, moveActive, parseDate } from './calendar.ts'
import { changePhaseDuration, defaultSelection, finishDate, findClashes, moveSelection, planGaps, planInactiveSpans, scheduleAtAnchor } from './scheduling.ts'
import { initialPlans, SAMPLE_RULES } from '../prototypes/pipeline-fixtures.ts'

test('calendar weeks stay date-only across both UK daylight-saving transitions', () => {
  for (const date of ['2030-03-25', '2030-10-21']) {
    const start = parseDate(date)
    assert.equal(moveActive(start, 14), start + 2 * WEEK)
    assert.equal(moveActive(start + 2 * WEEK, -14), start)
    assert.equal(monday(start + 6 * DAY), start)
  }
})

test('inactive spans include Christmas within phases and between phases, without duplicating other gaps', () => {
  const plan = initialPlans()[0], base = plan.phases[0]
  const phase = (id: number, start: string, end: string) => ({ ...base, id, s: parseDate(start), e: parseDate(end) })
  const spans = (phases: typeof plan.phases) => planInactiveSpans({ ...plan, phases }).map(span => ({ label: span.label, s: isoDate(span.s), e: isoDate(span.e) }))
  const christmas = { label: 'Christmas and New Year break', s: '2030-12-23', e: '2031-01-06' }
  assert.deepEqual(spans([phase(1, '2030-12-16', '2031-01-13')]), [christmas])
  assert.deepEqual(spans([phase(1, '2030-12-16', '2030-12-23'), phase(2, '2031-01-06', '2031-01-13')]), [christmas])
  const mixed = spans([phase(1, '2030-12-09', '2030-12-16'), phase(2, '2031-01-13', '2031-01-20')])
  assert.deepEqual(mixed.map(({ s, e }) => ({ s, e })), [
    { s: '2030-12-16', e: '2030-12-23' }, { s: '2030-12-23', e: '2031-01-06' }, { s: '2031-01-06', e: '2031-01-13' },
  ])
  assert.deepEqual(spans([phase(1, '2031-01-06', '2031-01-13')]), [])
  assert.deepEqual(spans([]), [])
})

test('Christmas extends date extent, not active duration, and sequential work resumes on Monday', () => {
  const start = parseDate('2030-12-16')
  const end = moveActive(start, 14)
  assert.equal(isoDate(end), '2031-01-13')
  assert.equal(activeDays(start, end), 14)
  assert.deepEqual(activeSpans(start, end), [
    { s: start, e: parseDate('2030-12-23') },
    { s: parseDate('2031-01-06'), e: end },
  ])
  const phase = { ...initialPlans()[0].phases[0], s: start, e: end, weeks: 2 }
  assert.equal(isoDate(finishDate(phase)), '2031-01-10')
  assert.equal(new Date(end).getUTCDay(), 1)
  assert.equal(moveActive(end, -14), start)
  assert.deepEqual(activeSpans(parseDate('2030-12-23'), parseDate('2031-01-06')), [])
})

test('actual anchor and milestone dates remain distinct from the Monday plotting boundary', () => {
  const plan = initialPlans()[0]
  plan.anchor = parseDate('2031-01-22')
  scheduleAtAnchor(plan, 0, plan.phases.length - 1)
  assert.equal(isoDate(plan.anchor), '2031-01-22')
  assert.equal(isoDate(plan.planningAnchor), '2031-01-20')
  const actualMilestone = { ...plan.phases[0], kind: 'milestone' as const, s: plan.anchor, e: plan.anchor, weeks: 0 }
  assert.equal(finishDate(actualMilestone), plan.anchor)
  for (const phase of plan.phases.filter(item => item.kind === 'phase')) {
    assert.equal(new Date(finishDate(phase)).getUTCDay(), 5)
  }
})

test('moving a range preserves active durations, unselected dates and approved baseline contents', () => {
  const plans = initialPlans()
  const saved = structuredClone(plans)
  const selection = defaultSelection(plans[0])
  const moved = moveSelection(plans, selection, -4)
  assert.deepEqual(plans, saved)
  assert.deepEqual(moved.slice(1), saved.slice(1))
  assert.deepEqual(moved[0].approvedBaseline, saved[0].approvedBaseline)
  assert.equal(moved[0].anchor, saved[0].anchor)
  moved[0].phases.forEach((phase, index) => {
    assert.equal(phase.weeks, saved[0].phases[index].weeks)
    if (index < selection.first || index > selection.last) {
      assert.equal(phase.s, saved[0].phases[index].s)
      assert.equal(phase.e, saved[0].phases[index].e)
    }
  })
})

test('default range uses phase order and anchor position rather than demo Library identifiers', () => {
  const plan = initialPlans()[0]
  const renamed = structuredClone(plan)
  renamed.phases.forEach(phase => { if (phase.kind === 'phase') phase.libraryPhaseId = crypto.randomUUID() })
  assert.deepEqual(defaultSelection(plan), defaultSelection(renamed))
  assert.equal(defaultSelection(plan).last, plan.phases.findLastIndex((phase, index) => phase.kind === 'phase' && index < plan.phases.findIndex(item => item.id === plan.anchorId)))
  const anchorFirst = { ...renamed, phases: [renamed.phases.find(phase => phase.id === renamed.anchorId)!, renamed.phases[0]] }
  assert.deepEqual(defaultSelection(anchorFirst), { planId: plan.id, first: 1, last: 1 })
  assert.deepEqual(defaultSelection({ ...renamed, phases: [anchorFirst.phases[0]] }), { planId: plan.id, first: 0, last: 0 })
})

test('a shorter phase creates an inactive gap while preserving its neighbours and fixed baseline', () => {
  const plans = initialPlans()
  const saved = structuredClone(plans)
  const changed = changePhaseDuration(plans, { planId: plans[0].id, first: 8, last: 8 }, 18, 'start')
  assert.deepEqual(plans, saved)
  assert.deepEqual(changed[0].approvedBaseline, saved[0].approvedBaseline)
  const phase = changed[0].phases[8]
  assert.equal(activeDays(phase.s, phase.e), 18 * 7)
  assert.equal(phase.s, saved[0].phases[8].s)
  assert.equal(changed[0].phases[9].s, saved[0].phases[9].s)
  assert.ok(planGaps(changed[0]).some(gap => gap.s === phase.e && gap.e === changed[0].phases[9].s))
})

test('whole-week constraints reject fractional edits without changing the input', () => {
  const plans = initialPlans()
  const saved = structuredClone(plans)
  assert.throws(() => moveSelection(plans, defaultSelection(plans[0]), 1.5), /whole weeks/)
  assert.throws(() => changePhaseDuration(plans, { planId: plans[0].id, first: 8, last: 8 }, 2.5, 'start'), /whole weeks/)
  assert.deepEqual(plans, saved)
})

test('clash assessment requires explicit current rules and does not seed sample findings', () => {
  const plans = initialPlans()
  assert.deepEqual(findClashes(plans, []), [])
  const findings = findClashes(plans, SAMPLE_RULES)
  assert.ok(findings.length > 0)
  assert.deepEqual(findClashes(plans, []), [])
})
