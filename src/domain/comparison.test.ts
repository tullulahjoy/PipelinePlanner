/// <reference types="node" />
import assert from 'node:assert/strict'
import test from 'node:test'
import { WEEK, parseDate } from './calendar.ts'
import { christmasExplanation, comparePipelineFindings, compareSchedules, projectComparisons } from './comparison.ts'
import type { PipelineSchedule } from './comparison.ts'
import type { OverlapRule, Phase, Plan } from './scheduling.ts'

const currentRules: OverlapRule[] = [
  { id: 'evaluation', sourceId: 'evaluation', kind: 'same', severity: 'warning' },
  { id: 'moderation', sourceId: 'moderation', kind: 'same', severity: 'critical' },
]

function phase(id: number, name: string, libraryPhaseId: string, start: number): Phase {
  return { id, name, libraryPhaseId, kind: 'phase', weeks: 2, offset: 0, color: '#315ed4', s: start, e: start + 2 * WEEK }
}

function plan(id: string): Plan {
  const start = parseDate('2030-03-04')
  const anchor = start + 4 * WEEK
  return {
    id, name: id, anchor, planningAnchor: anchor, anchorId: 3, anchorName: 'Go-live', approvedBaseline: null,
    phases: [
      phase(1, 'Evaluation', 'evaluation', start),
      phase(2, 'Moderation', 'moderation', start + 2 * WEEK),
      { ...phase(3, 'Go-live', '', anchor), kind: 'milestone', weeks: 0, e: anchor },
    ],
  }
}

function pipeline(name: string): PipelineSchedule {
  return { name, plans: [plan('Community services'), plan('Digital services')] }
}

test('matching issues stay visible, with the same current rules applied to both pipeline plans', () => {
  const before = pipeline('Initial pipeline plan')
  const after = pipeline('Autumn pipeline plan')
  const rows = comparePipelineFindings(before, after, currentRules)
  assert.equal(rows.length, 2)
  assert.ok(rows.every(row => row.status === 'Unchanged' && row.before && row.after))
  assert.deepEqual(rows.map(row => row.severity), ['critical', 'warning'])
})

test('current checks ignore obsolete rule snapshots on saved alternatives and both baseline states', () => {
  for (const status of ['saved', 'current', 'previous']) {
    const before = { ...pipeline('Before'), status, rules: [] }
    const after = { ...pipeline('After'), rules: [{ ...currentRules[0], severity: 'critical' }] }
    const saved = structuredClone({ before, after, currentRules })
    const rows = comparePipelineFindings(before, after, currentRules)
    assert.equal(rows.length, 2)
    assert.ok(rows.every(row => row.status === 'Unchanged'))
    assert.equal(rows.find(row => row.finding.ruleId === 'evaluation')?.severity, 'warning')
    assert.deepEqual({ before, after, currentRules }, saved)
  }
})

test('adding, changing and removing current rules updates both assessments without rescheduling', () => {
  const before = pipeline('Before')
  const after = pipeline('After')
  const saved = structuredClone({ before, after })
  assert.deepEqual(comparePipelineFindings(before, after, []), [])
  const criticalRule: OverlapRule = { ...currentRules[0], severity: 'critical', reason: 'Shared team capacity' }
  const rows = comparePipelineFindings(before, after, [criticalRule])
  assert.equal(rows.length, 1)
  assert.equal(rows[0].before?.severity, 'critical')
  assert.equal(rows[0].after?.severity, 'critical')
  assert.equal(rows[0].status, 'Unchanged')
  assert.equal(rows[0].before?.reason, 'Shared team capacity')
  assert.deepEqual(comparePipelineFindings(before, after, []), [])
  assert.deepEqual({ before, after }, saved)
})

test('overlap-date differences are detected independently of rule history and reverse with selection order', () => {
  const before = pipeline('Before')
  const after = structuredClone(before)
  after.name = 'After'
  for (const phase of after.plans[1].phases) { phase.s += WEEK; phase.e += WEEK }
  after.plans[1].anchor += WEEK
  after.plans[1].planningAnchor += WEEK
  const forward = comparePipelineFindings(before, after, currentRules)
  const reverse = comparePipelineFindings(after, before, currentRules)
  assert.equal(forward.length, 2)
  forward.forEach(row => {
    assert.equal(row.status, 'Changed')
    assert.equal(row.before?.weeks, 2)
    assert.equal(row.after?.weeks, 1)
    const reversed = reverse.find(other => other.key === row.key)!
    assert.deepEqual(reversed.before, row.after)
    assert.deepEqual(reversed.after, row.before)
  })
})

test('first matching current rule wins consistently on both sides', () => {
  const first = { ...currentRules[0], reason: 'First check' }
  const duplicate: OverlapRule = { ...first, id: 'duplicate', severity: 'critical', reason: 'Later check' }
  const rows = comparePipelineFindings(pipeline('Before'), pipeline('After'), [first, duplicate])
  assert.equal(rows.length, 1)
  assert.equal(rows[0].before?.ruleId, first.id)
  assert.equal(rows[0].after?.ruleId, first.id)
  assert.equal(rows[0].severity, 'warning')
})

test('reordering projects does not turn matching findings into additions and removals', () => {
  const before = pipeline('Before')
  const after = { name: 'After', plans: before.plans.toReversed() }
  const rows = comparePipelineFindings(before, after, currentRules)
  assert.equal(rows.length, 2)
  assert.ok(rows.every(row => row.status === 'Unchanged'))
})

test('schedule grouping is shared, reversible, and stops at other property changes', () => {
  const before = pipeline('Before')
  const after = structuredClone(before)
  after.name = 'After'
  after.plans[0].phases.forEach(phase => { phase.s -= 2 * WEEK; phase.e -= 2 * WEEK })
  after.plans[0].anchor -= 2 * WEEK
  after.plans[0].planningAnchor -= 2 * WEEK
  const saved = structuredClone({ before, after })
  assert.ok(projectComparisons(before, after)[0].summaries.includes('Evaluation to Go-live moved 2 weeks earlier.'))
  assert.ok(projectComparisons(after, before)[0].summaries.includes('Evaluation to Go-live moved 2 weeks later.'))
  assert.deepEqual({ before, after }, saved)
  after.plans[0].phases[1].name = 'Moderation revised'
  const summary = projectComparisons(before, after)[0]
  assert.ok(summary.labels.includes('Names altered'))
  assert.ok(summary.summaries.every(line => !line.startsWith('Evaluation to Go-live')))
  assert.ok(compareSchedules(before, after).some(change => change.details.includes('Name changed')))
})

test('Christmas explanation appears only where break exposure changed', () => {
  const previous = phase(1, 'Evaluation', 'evaluation', parseDate('2030-11-18'))
  const next = { ...previous, s: parseDate('2030-12-16'), e: parseDate('2031-01-13') }
  assert.equal(christmasExplanation(previous, next), 'Now includes the Christmas break; active duration unchanged.')
  assert.equal(christmasExplanation(next, previous), 'No longer includes the Christmas break; active duration unchanged.')
  assert.equal(christmasExplanation(previous, { ...previous, s: previous.s + WEEK, e: previous.e + WEEK }), null)
})
