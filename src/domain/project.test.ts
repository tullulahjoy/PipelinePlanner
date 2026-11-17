/// <reference types="node" />
import assert from 'node:assert/strict'
import test from 'node:test'
import { DAY, WEEK, parseDate } from './calendar.ts'
import { acknowledgeClashes, criticalSignature, scheduleProject, unacknowledgedClashes } from './project.ts'
import { findClashes } from './scheduling.ts'
import type { Plan } from './scheduling.ts'

function project(id = 'one'): Plan {
  return { id, name: id, anchor: parseDate('2032-05-12'), planningAnchor: 0, anchorId: 2, anchorName: 'Go-live', approvedBaseline: null, phases: [
    { id: 1, name: 'Evaluation', kind: 'phase', weeks: 2, offset: 0, libraryPhaseId: 'evaluation', color: '#315ed4', s: 0, e: 0 },
    { id: 2, name: 'Go-live', kind: 'milestone', weeks: 0, offset: 0, libraryPhaseId: '', color: '#536ea1', s: 0, e: 0 },
  ] }
}

test('schedule construction preserves actual anchors and extra duration-source metadata without mutating input', () => {
  const input = { ...project(), phases: project().phases.map(phase => ({ ...phase, durationInherited: true })) }
  const before = structuredClone(input)
  const result = scheduleProject(input)
  assert.deepEqual(input, before)
  assert.equal(result.anchor, parseDate('2032-05-12'))
  assert.equal(result.planningAnchor, parseDate('2032-05-10'))
  assert.equal(result.phases[0].e - result.phases[0].s, 2 * WEEK)
  assert.equal(result.phases[0].durationInherited, true)
})

test('invalid anchors, duplicate identities and impossible overlaps are rejected before preview', () => {
  const input = project()
  assert.throws(() => scheduleProject({ ...input, anchorId: 1 }), /milestone/)
  assert.throws(() => scheduleProject({ ...input, anchor: input.anchor + 1000 }), /date/)
  const duplicate = structuredClone(input); duplicate.phases[1].id = 1
  assert.throws(() => scheduleProject(duplicate), /identities/)
  const overlap = structuredClone(input); overlap.phases[1].offset = -1
  assert.throws(() => scheduleProject(overlap), /overlap/)
})

test('critical-clash explanations apply only to the reviewed issues and survive project-order changes', () => {
  const plans = [scheduleProject(project()), scheduleProject(project('two'))]
  const rules = [{ id: 'rule', a: 'evaluation', b: 'evaluation', severity: 'critical' as const, reason: 'Shared team' }]
  const findings = findClashes(plans, rules)
  assert.deepEqual(acknowledgeClashes(findings, [], '  '), [])
  const accepted = acknowledgeClashes(findings, [], 'Separate staffing has been arranged.')
  assert.equal(unacknowledgedClashes(findings, accepted).length, 0)
  assert.equal(criticalSignature(findings[0]), criticalSignature(findClashes(plans.toReversed(), rules)[0]))
  const moved = structuredClone(plans); moved[1].anchor += 7 * DAY
  moved[1] = scheduleProject(moved[1])
  assert.equal(unacknowledgedClashes(findClashes(moved, rules), accepted).length, 1)
  assert.equal(unacknowledgedClashes(findClashes(plans, [{ ...rules[0], reason: 'Changed checking rationale' }]), accepted).length, 1)
})
