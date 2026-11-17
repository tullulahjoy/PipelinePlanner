/// <reference types="node" />
import assert from 'node:assert/strict'
import test from 'node:test'
import { readWorkspace, workspaceNameSchema, templateInputSchema, projectSchema } from './schemas.ts'
import { scheduleProject } from '../domain/project.ts'
import { moveSelection } from '../domain/scheduling.ts'
import { DAY, WEEK, parseDate } from '../domain/calendar.ts'

function christmasGapProject() {
  const libraryPhaseId = '8fd683fb-2305-44e4-8707-a0ebc66225b6'
  const phase = (id: number, weeks: number, offset = 0) => ({ id, name: `Stage ${id}`, kind: 'phase' as const, weeks, offset, libraryPhaseId, color: '#315ed4', durationInherited: false, s: 0, e: 0 })
  return scheduleProject({ id: crypto.randomUUID(), name: 'Gap movement', anchor: parseDate('2028-01-14'), planningAnchor: 0, anchorId: 4, anchorName: 'Service begins', nextPhaseId: 6, approvedBaseline: null, phases: [
    phase(1, 2), phase(2, 4, 4), phase(3, 6),
    { ...phase(4, 0), name: 'Service begins', kind: 'milestone' as const, libraryPhaseId: '' }, phase(5, 12),
  ] })
}

test('moving a range into a gap and back across Christmas preserves valid recorded dates and the fixed anchor', () => {
  const original = christmasGapProject(), selection = { planId: original.id, first: 1, last: 2 }
  const moved = moveSelection([original], selection, -1)[0]
  assert.equal(moved.phases[2].e, parseDate('2027-12-20'))
  assert.equal(scheduleProject(moved).phases[2].e, parseDate('2028-01-03'))
  assert.deepEqual(projectSchema.parse(moved), moved)
  for (const index of [0, 4]) assert.deepEqual(moved.phases[index], original.phases[index])
  assert.deepEqual(moved.phases[3], { ...original.phases[3], offset: 1 })
  assert.equal(moved.anchor, original.anchor)
  assert.equal(moved.phases[1].offset, 3)
  assert.deepEqual(projectSchema.parse(moveSelection([moved], selection, 1)[0]), original)
})

test('recorded-date validation still rejects incorrect durations, gaps, weekdays, milestones and anchor dates', () => {
  const original = christmasGapProject()
  const invalid = (change: (project: typeof original) => void) => {
    const project = structuredClone(original); change(project)
    assert.equal(projectSchema.safeParse(project).success, false)
  }
  invalid(project => { project.phases[1].e += WEEK })
  invalid(project => { project.phases[1].offset-- })
  invalid(project => { project.phases[1].s += DAY })
  invalid(project => { project.phases[3].e += WEEK })
  invalid(project => { project.phases[3].s -= WEEK; project.phases[3].e -= WEEK })
  invalid(project => { project.planningAnchor += WEEK })
  invalid(project => { project.anchorName = 'Other milestone' })
})

test('workspace names are trimmed and reject empty, non-text and oversized input', () => {
  assert.equal(workspaceNameSchema.parse('  Community services  '), 'Community services')
  for (const value of ['', '   ', null, 42, 'a'.repeat(81)]) {
    assert.equal(workspaceNameSchema.safeParse(value).success, false)
  }
  assert.equal(workspaceNameSchema.safeParse('a'.repeat(80)).success, true)
})

test('saved workspaces require the supported schema, valid identity and creation details', () => {
  const workspace = {
    schemaVersion: 1,
    id: '8fd683fb-2305-44e4-8707-a0ebc66225b6',
    name: 'Community services',
    createdAt: '2026-11-11T12:00:00.000Z',
    createdBy: 'local-user',
  }
  assert.deepEqual(readWorkspace(workspace), workspace)
  assert.deepEqual(readWorkspace({ ...workspace, displayOrder: 0 }), { ...workspace, displayOrder: 0 })
  for (const change of [
    { schemaVersion: 2 }, { id: 'not-an-id' }, { name: null },
    { createdAt: '2026-02-31' }, { createdBy: 'unknown-user' }, { unexpected: true }, { displayOrder: -1 }, { displayOrder: 1.5 },
  ]) {
    assert.throws(() => readWorkspace({ ...workspace, ...change }))
  }
})

test('templates are date-free schedules with a valid milestone anchor and distinct item identities', () => {
  const milestone = { id: 1, name: 'Service begins', kind: 'milestone', weeks: 0, offset: 0, libraryPhaseId: '', color: '#315ed4', durationInherited: false }
  const input = { name: 'Reference', description: '', anchorId: 1, phases: [milestone] }
  assert.equal(templateInputSchema.safeParse(input).success, true)
  for (const invalid of [{ ...input, anchorDate: '2030-01-01' }, { ...input, phases: [{ ...milestone, s: 0 }] }, { ...input, phases: [milestone, milestone] }, { ...input, anchorId: 2 }, { ...input, phases: [{ ...milestone, kind: 'phase', weeks: 2 }] }]) assert.equal(templateInputSchema.safeParse(invalid).success, false)
})
