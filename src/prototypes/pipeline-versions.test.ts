/// <reference types="node" />
import assert from 'node:assert/strict'
import test from 'node:test'
import { EXAMPLE_VERSIONS, comparisonPair, comparisonMovementSummary, compareVersionAge, compareVersionFindings, compareVersionRules, compareVersionSchedules, scheduleDifferenceLabel, findingDifferenceLabel, ruleDifferenceLabel } from './pipeline-versions.ts'
import type { VersionChange } from './pipeline-versions.ts'
import { WEEK, activeDays, findClashes, parseDate } from './pipeline-scheduling.ts'

const baseline = EXAMPLE_VERSIONS.find(version => version.status === 'current')!
const proposal = EXAMPLE_VERSIONS.find(version => version.id === 'v04')!

test('comparison movement reverses with selected order rather than save chronology', () => {
  const alternative = EXAMPLE_VERSIONS.find(version => version.id === 'v03')!
  const forward = compareVersionSchedules(baseline, alternative).find(change => change.kind === 'phase' && change.label === 'Market engagement')!
  const reverse = compareVersionSchedules(alternative, baseline).find(change => change.id === forward.id)!
  assert.deepEqual(comparisonMovementSummary(forward, baseline.name, alternative.name), ['4 weeks earlier'])
  assert.deepEqual(comparisonMovementSummary(reverse, alternative.name, baseline.name), ['4 weeks later'])
})

test('comparison movement keeps absent items neutral in both orders and directional in baseline review', () => {
  const first = EXAMPLE_VERSIONS.find(version => version.id === 'v01')!
  const onlySecond = compareVersionSchedules(first, baseline).find(change => change.planId === 'facilities-support')!
  const onlyFirst = compareVersionSchedules(baseline, first).find(change => change.planId === 'facilities-support')!
  assert.deepEqual(comparisonMovementSummary(onlySecond, first.name, baseline.name), ['Only in Autumn pipeline'])
  assert.deepEqual(comparisonMovementSummary(onlyFirst, baseline.name, first.name), ['Only in Autumn pipeline'])
  assert.deepEqual(comparisonMovementSummary(onlySecond, first.name, baseline.name, true), ['Added'])
  assert.deepEqual(comparisonMovementSummary(onlyFirst, baseline.name, first.name, true), ['Removed'])
})

test('comparison movement handles actual anchors without end dates and metadata-only rows', () => {
  const anchor: VersionChange = { id: 'anchor', planId: 'p', planName: 'Procurement', label: 'Actual anchor', kind: 'anchor', status: 'changed',
    before: { start: parseDate('2031-01-20') }, after: { start: parseDate('2031-01-21') }, details: ['Anchor changed'] }
  assert.deepEqual(comparisonMovementSummary(anchor, 'First', 'Second'), ['1 day later'])
  assert.deepEqual(comparisonMovementSummary({ ...anchor, kind: 'procurement', before: { name: 'Old name' }, after: { name: 'New name' } }, 'First', 'Second'), ['Not applicable'])
})

test('comparison movement preserves different start and finish shifts and gap presence', () => {
  const change: VersionChange = { id: 'phase', planId: 'p', planName: 'Procurement', label: 'Evaluation', kind: 'phase', status: 'changed',
    before: { start: parseDate('2030-03-04'), end: parseDate('2030-03-29') }, after: { start: parseDate('2030-03-04'), end: parseDate('2030-03-15') }, details: ['Dates changed'] }
  assert.deepEqual(comparisonMovementSummary(change, 'First', 'Second'), ['Start: unchanged', 'Finish: 2 weeks earlier'])
  assert.deepEqual(comparisonMovementSummary({ ...change, kind: 'gap', before: null }, 'First', 'Second', true), ['Gap added'])
  assert.deepEqual(comparisonMovementSummary({ ...change, kind: 'gap', after: null }, 'First', 'Second', true), ['Gap removed'])
})

test('general comparison preserves the selected pipelines without inferring chronology', () => {
  const pair = comparisonPair(EXAMPLE_VERSIONS, 'v02', 'v01')!
  assert.equal(pair.before.id, 'v02')
  assert.equal(pair.after.id, 'v01')
  const addition = compareVersionSchedules(pair.before, pair.after).find(change => change.planId === 'facilities-support')!
  assert.equal(scheduleDifferenceLabel(addition, pair.before.name, pair.after.name), 'Only in Autumn pipeline')
  assert.equal(addition.after, null)
})

test('duplicate selections choose another pipeline without reversing the first selection', () => {
  const first = comparisonPair(EXAMPLE_VERSIONS, 'v01', 'v01')!
  assert.equal(first.before.id, 'v01')
  assert.notEqual(first.after.id, first.before.id)
  const latest = comparisonPair(EXAMPLE_VERSIONS, 'v04', 'v04')!
  assert.equal(latest.before.id, 'v04')
  assert.notEqual(latest.before.id, latest.after.id)
  assert.equal(comparisonPair(EXAMPLE_VERSIONS, 'unknown', 'v01'), null)
  assert.equal(comparisonPair([baseline], baseline.id, baseline.id), null)
})

test('neutral schedule labels identify presence and specific differences in either order', () => {
  const first = EXAMPLE_VERSIONS.find(version => version.id === 'v01')!, second = baseline
  const forward = compareVersionSchedules(first, second).find(change => change.planId === 'facilities-support')!
  const reverse = compareVersionSchedules(second, first).find(change => change.planId === 'facilities-support')!
  assert.equal(scheduleDifferenceLabel(forward, first.name, second.name), 'Only in Autumn pipeline')
  assert.equal(scheduleDifferenceLabel(reverse, second.name, first.name), 'Only in Autumn pipeline')
  const edited = structuredClone(baseline); edited.plans[0].anchor += 86400000
  const anchor = compareVersionSchedules(baseline, edited).find(change => change.kind === 'anchor')!
  assert.equal(scheduleDifferenceLabel(anchor, 'First', 'Second'), 'Different anchor')
})

test('neutral finding labels describe presence, severity and dates without implying a new or resolved clash', () => {
  const finding = findClashes(baseline.plans, baseline.rules)[0]
  assert.equal(findingDifferenceLabel(undefined, finding, 'First', 'Second'), 'Only in Second')
  assert.equal(findingDifferenceLabel(finding, undefined, 'First', 'Second'), 'Only in First')
  const other = structuredClone(finding); other.severity = finding.severity === 'warning' ? 'critical' : 'warning'
  other.spans[0].s += WEEK
  assert.equal(findingDifferenceLabel(finding, other, 'First', 'Second'), 'Different severity, overlap dates')
})

test('neutral rule labels identify presence and the actual rule differences in either order', () => {
  const rule = baseline.rules[0]
  assert.equal(ruleDifferenceLabel(undefined, rule, 'First', 'Second'), 'Only in Second')
  assert.equal(ruleDifferenceLabel(rule, undefined, 'First', 'Second'), 'Only in First')
  const changed = { ...rule, severity: 'critical' as const, reason: 'Shared team.' }
  assert.equal(ruleDifferenceLabel(rule, changed, 'First', 'Second'), 'Different severity, explanation')
  assert.equal(ruleDifferenceLabel(changed, rule, 'Second', 'First'), 'Different severity, explanation')
})

test('version chronology uses saved time, with version sequence breaking timestamp ties', () => {
  const older = structuredClone(baseline), newer = structuredClone(proposal)
  older.number = 10
  assert.ok(compareVersionAge(older, newer) < 0)
  newer.savedAt = older.savedAt
  newer.number = older.number + 1
  assert.ok(compareVersionAge(older, newer) < 0)
})

test('version comparison includes added and removed procurements without matching by name', () => {
  const before = structuredClone(baseline), after = structuredClone(baseline)
  after.plans[2].id = 'replacement'
  const changes = compareVersionSchedules(before, after)
  assert.equal(changes.length, 2)
  assert.equal(changes.find(change => change.planId === 'facilities-support')?.status, 'removed')
  assert.equal(changes.find(change => change.planId === 'replacement')?.status, 'added')
  assert.ok(changes.every(change => change.kind === 'procurement'))
})

test('adding a milestone does not falsely mark every following phase as reordered', () => {
  const before = structuredClone(baseline), after = structuredClone(baseline)
  const phase = after.plans[0].phases[2]
  after.plans[0].phases.splice(2, 0, { ...phase, id: 999, name: 'Decision point', kind: 'milestone', weeks: 0, libraryPhaseId: '', e: phase.s })
  const phaseChanges = compareVersionSchedules(before, after).filter(change => change.kind === 'phase')
  assert.equal(phaseChanges.length, 1)
  assert.equal(phaseChanges[0].status, 'added')
  const reversed = compareVersionSchedules(after, before).filter(change => change.kind === 'phase')
  assert.equal(reversed.length, 1)
  assert.equal(reversed[0].status, 'removed')
})

test('anchor changes within one planning week remain visible without false phase-date changes', () => {
  const after = structuredClone(baseline)
  after.plans[0].anchor += 3 * WEEK / 7
  const changes = compareVersionSchedules(baseline, after)
  assert.equal(changes.length, 1)
  assert.equal(changes[0].kind, 'anchor')
  assert.equal(changes[0].after?.start, after.plans[0].anchor)
})

test('gap lengths include Christmas weeks and distinguish added, changed and removed gaps', () => {
  const before = structuredClone(baseline), after = structuredClone(baseline)
  for (const version of [before, after]) {
    const plan = version.plans[0], seed = plan.phases[0]
    const start = parseDate('2029-12-17'), finish = parseDate('2030-01-14')
    plan.phases = [
      { ...seed, id: 1, s: start - WEEK, e: start, weeks: 1 },
      { ...seed, id: 2, s: finish, e: finish + WEEK, weeks: 1 },
    ]
  }
  after.plans[0].phases[0].s -= WEEK
  after.plans[0].phases[0].e -= WEEK
  const gap = compareVersionSchedules(before, after).find(change => change.kind === 'gap')!
  assert.equal(gap.before?.weeks, 4)
  assert.equal(gap.after?.weeks, 5)
  assert.equal(gap.after?.weekType, 'calendar')
  assert.equal(activeDays(gap.before!.start!, gap.before!.end!) / 7, 2)
  const continuous = structuredClone(after)
  continuous.plans[0].phases[0].e = continuous.plans[0].phases[1].s
  const removed = compareVersionSchedules(after, continuous).find(change => change.kind === 'gap')!
  assert.equal(removed.status, 'removed')
  assert.equal(removed.after, null)
  const added = compareVersionSchedules(continuous, after).find(change => change.kind === 'gap')!
  assert.equal(added.status, 'added')
  assert.equal(added.after?.weeks, 5)
})

test('each version uses its own overlap rules, including severity changes and removed rules', () => {
  const after = structuredClone(baseline)
  after.rules = after.rules.map(rule => ({ ...rule, severity: rule.severity === 'critical' ? 'warning' : 'critical' }))
  const findings = compareVersionFindings(baseline, after)
  assert.ok(findings.length > 0)
  assert.ok(findings.every(change => change.status === 'Changed' && change.before?.severity !== change.after?.severity))
  assert.equal(compareVersionRules(baseline, after).length, 2)
  after.rules = []
  assert.ok(compareVersionFindings(baseline, after).every(change => change.status === 'Resolved'))
  assert.ok(findClashes(baseline.plans, baseline.rules).length > 0)
})

test('identical versions have no schedule or rule changes and comparisons do not mutate records', () => {
  const snapshot = structuredClone(EXAMPLE_VERSIONS)
  assert.deepEqual(compareVersionSchedules(baseline, baseline), [])
  assert.deepEqual(compareVersionRules(baseline, baseline), [])
  assert.ok(compareVersionFindings(baseline, baseline).every(change => change.status === 'Unchanged'))
  const changes = compareVersionSchedules(baseline, proposal)
  assert.ok(changes.some(change => change.details.includes('Duration changed')))
  assert.ok(changes.some(change => change.status === 'added' && change.kind === 'phase'))
  assert.ok(changes.some(change => change.status === 'removed' && change.kind === 'procurement'))
  compareVersionRules(baseline, proposal)
  compareVersionFindings(baseline, proposal)
  assert.deepEqual(EXAMPLE_VERSIONS, snapshot)
})
