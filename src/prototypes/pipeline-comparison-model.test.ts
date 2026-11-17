/// <reference types="node" />
import assert from 'node:assert/strict'
import test from 'node:test'
import { DAY, WEEK, parseDate } from './pipeline-scheduling.ts'
import type { Phase, Plan } from './pipeline-scheduling.ts'
import { EXAMPLE_VERSIONS } from './pipeline-versions.ts'
import type { PipelineVersion } from './pipeline-versions.ts'
import { checkingRuleDifferences, christmasExplanation, comparisonFindings, procurementComparisons } from './pipeline-comparison-model.ts'

function phase(id: number, start: string, weeks = 2): Phase {
  const s = parseDate(start)
  return { id, name: `Phase ${id}`, kind: 'phase', weeks, offset: 0, libraryPhaseId: 'evaluation', color: '#123456', s, e: s + weeks * WEEK }
}
function plan(id = 'one'): Plan {
  return { id, name: id, anchor: parseDate('2030-04-01'), planningAnchor: parseDate('2030-04-01'), anchorId: 3, anchorName: 'Transfer', phases: [phase(1, '2030-02-04'), phase(2, '2030-02-18'), phase(3, '2030-03-04')], approvedBaseline: null }
}
function version(plans = [plan()]): PipelineVersion { return { ...structuredClone(EXAMPLE_VERSIONS[0]), name: 'First', plans, rules: [{ id: 'eval', sourceId: 'evaluation', kind: 'same', severity: 'warning' }] } }
function shifted(first: PipelineVersion, weeks = -2) { const second = structuredClone(first); second.name = 'Second'; second.plans.forEach(p => p.phases.forEach(f => { f.s += weeks * WEEK; f.e += weeks * WEEK })); return second }

test('continuous unchanged-duration phases combine and reverse with comparison order', () => {
  const first = version(), second = shifted(first), snapshot = JSON.stringify([first, second])
  const [model] = procurementComparisons(first, second)
  assert.deepEqual(model.summaries, ['Phase 1 to Phase 3 moved 2 weeks earlier.'])
  assert.ok(model.labels.includes('Begins 2 weeks earlier'))
  assert.equal(procurementComparisons(second, first)[0].summaries[0], 'Phase 1 to Phase 3 moved 2 weeks later.')
  assert.equal(JSON.stringify([first, second]), snapshot)
})
test('grouping stops at unchanged, inserted, removed or reordered activities and property edits', () => {
  const first = version(), second = shifted(first)
  second.plans[0].phases[1] = structuredClone(first.plans[0].phases[1])
  assert.equal(procurementComparisons(first, second)[0].summaries.filter(s => s.startsWith('Phase ')).length, 2)
  const inserted = shifted(first)
  inserted.plans[0].phases.splice(1, 0, phase(99, '2030-01-14'))
  assert.ok(!procurementComparisons(first, inserted)[0].summaries.some(s => s.startsWith('Phase 1 to Phase 3')))
  const removed = shifted(first); removed.plans[0].phases.splice(1, 1)
  assert.ok(!procurementComparisons(first, removed)[0].summaries.some(s => s.startsWith('Phase 1 to Phase 3')))
  const reordered = shifted(first); reordered.plans[0].phases.reverse()
  assert.equal(procurementComparisons(first, reordered)[0].summaries.filter(s => s.startsWith('Phase ')).length, 3)
  const renamed = shifted(first); renamed.plans[0].phases[1].name = 'Renamed'
  assert.equal(procurementComparisons(first, renamed)[0].summaries.length, 3)
})
test('different finish shifts and active duration edits are never hidden inside a movement range', () => {
  const first = version(), second = shifted(first)
  second.plans[0].phases[1].e += WEEK; second.plans[0].phases[1].weeks++
  const model = procurementComparisons(first, second)[0]
  assert.equal(model.summaries.length, 3)
  assert.ok(model.labels.includes('Phase durations altered'))
  assert.ok(model.summaries.some(s => s.includes('increased from 2 to 3 weeks') && s.includes('Finish: 1 week earlier')))
})
test('Christmas inclusion and exclusion are explicit, preserve active duration, and reverse', () => {
  const before = phase(1, '2029-12-03', 6); before.e += 2 * WEEK
  const after = phase(1, '2029-11-05', 6)
  assert.equal(christmasExplanation(before, after), 'No longer includes the Christmas break; active duration unchanged.')
  assert.equal(christmasExplanation(after, before), 'Now includes the Christmas break; active duration unchanged.')
  const changed = { ...before, weeks: 7, e: before.e + WEEK }
  assert.match(christmasExplanation(after, changed)!, /active duration also changed from 6 to 7 weeks/)
  assert.equal(christmasExplanation(phase(1, '2030-03-04'), phase(1, '2030-04-01')), null)
  const first = version(); first.plans[0].phases = [before]
  const second = version(); second.plans[0].phases = [after]
  const model = procurementComparisons(first, second)[0]
  assert.ok(!model.labels.includes('Phase durations altered'))
  assert.equal(model.notes.size, 1)
  assert.match(model.summaries[0], /Christmas break; active duration unchanged/)
})
test('starts use actual first scheduled activity and preserve days; metadata and gaps remain described', () => {
  const first = version(), second = structuredClone(first)
  second.plans[0].phases[0].s -= DAY; second.plans[0].name = 'Renamed procurement'; second.plans[0].anchor += DAY
  const model = procurementComparisons(first, second)[0]
  assert.ok(model.labels.includes('Begins 1 day earlier'))
  assert.ok(model.summaries.some(s => s.includes('Procurement renamed')))
  assert.ok(model.summaries.some(s => s.includes('Anchor: 1 day later')))
  assert.deepEqual(procurementComparisons(first, first), [])
  const gap = shifted(first, 0); gap.plans[0].phases[1].s += WEEK; gap.plans[0].phases[1].e += WEEK
  assert.ok(procurementComparisons(first, gap)[0].labels.includes('Gaps altered'))
})
test('added and removed procurements are neutral and retain their complete entries', () => {
  const first = version(), second = version([plan(), plan('two')]); second.name = 'Second'
  assert.deepEqual(procurementComparisons(first, second)[0].labels, ['Only in Second'])
  assert.deepEqual(procurementComparisons(second, first)[0].labels, ['Only in Second'])
})
test('changing an activity to a milestone describes its type without inventing an active duration', () => {
  const first = version(), second = structuredClone(first)
  Object.assign(second.plans[0].phases[1], { kind: 'milestone', weeks: 0, e: second.plans[0].phases[1].s })
  const model = procurementComparisons(first, second)[0]
  assert.ok(!model.labels.includes('Phase durations altered'))
  assert.ok(model.summaries.some(s => s.includes('phase or milestone changed')))
  assert.ok(model.summaries.every(s => !s.includes('undefined')))
})
test('rule consistency ignores arbitrary IDs and orientation but respects effective priority, severity and explanation', () => {
  const first = version(), second = structuredClone(first)
  second.rules[0].id = 'different-id'
  assert.deepEqual(checkingRuleDifferences(first, second), [])
  second.rules.push({ ...second.rules[0], id: 'unused', severity: 'critical' })
  assert.deepEqual(checkingRuleDifferences(first, second), [])
  second.rules.reverse()
  assert.equal(checkingRuleDifferences(first, second).length, 1)
  second.rules = [{ ...first.rules[0], reason: 'Shared team' }]
  assert.equal(checkingRuleDifferences(first, second).length, 1)
})
test('rule-driven missing findings are distinguished from schedule-only differences and unrelated rule edits', () => {
  const first = version([plan(), plan('two')]), second = structuredClone(first)
  second.rules = []
  const changes = comparisonFindings(first, second)
  assert.ok(changes.length > 0 && changes.every(c => c.rulesAffectFinding))
  assert.ok(comparisonFindings(second, first).every(c => c.rulesAffectFinding))
  const moved = shifted(first, 0)
  moved.plans[1].phases.forEach(p => { p.s += WEEK; p.e += WEEK })
  assert.ok(comparisonFindings(first, moved).some(c => !c.rulesAffectFinding))
  moved.rules.push({ id: 'unrelated', a: 'moderation', b: 'governance', severity: 'critical' })
  assert.ok(comparisonFindings(first, moved).every(c => !c.rulesAffectFinding))
  const matching = comparisonFindings(first, first)
  assert.ok(matching.length > 0)
  assert.ok(matching.every(c => c.status === 'Unchanged' && c.before && c.after && !c.rulesAffectFinding))
})
