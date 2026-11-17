import test from 'node:test'
import assert from 'node:assert/strict'
import { durationCandidates, previewDurationUpdates } from './library-updates.ts'
import { scheduleProject } from './project.ts'
import { parseDate } from './calendar.ts'
import type { Library, Project } from '../data/schemas.ts'

const phaseId = 'd81a5d18-0b7f-48ef-811c-4099c772f8b6'
const library: Library = { schemaVersion: 1, workspaceId: 'team', revision: 2, phases: [{ id: phaseId, name: 'Evaluation', weeks: 4, color: '#315ed4' }], rules: [] }
function plan(inherited = true, anchor = '2032-05-12'): Project {
  return scheduleProject({ id: 'test', name: 'Test procurement', anchor: parseDate(anchor), planningAnchor: 0, anchorId: 2, anchorName: 'Go-live', nextPhaseId: 3, approvedBaseline: null,
    phases: [{ id: 1, name: 'Evaluation', weeks: 2, kind: 'phase', libraryPhaseId: phaseId, color: '#315ed4', durationInherited: inherited, offset: 0, s: 0, e: 0 }, { id: 2, name: 'Go-live', weeks: 0, kind: 'milestone', libraryPhaseId: '', color: '#315ed4', durationInherited: false, offset: 0, s: 0, e: 0 }] })
}
test('duration updates are selective, nonmutating and preserve the actual anchor', () => {
  const original = plan(), snapshot = structuredClone(original), today = parseDate('2030-01-01')
  assert.equal(durationCandidates([original], library, today)[0].eligible, true)
  const [after] = previewDurationUpdates([original], library, ['test:1'], today)
  assert.equal(after.phases[0].weeks, 4)
  assert.equal(after.anchor, original.anchor)
  assert.deepEqual(original, snapshot)
  assert.deepEqual(previewDurationUpdates([original], library, [], today), [original])
})
test('custom durations and activities starting today or earlier are protected', () => {
  const custom = plan(false), original = plan()
  assert.equal(durationCandidates([custom], library, parseDate('2030-01-01'))[0].eligible, false)
  assert.throws(() => previewDurationUpdates([custom], library, ['test:1'], parseDate('2030-01-01')), /Only future/)
  assert.equal(durationCandidates([original], library, original.phases[0].s)[0].eligible, false)
  assert.throws(() => previewDurationUpdates([original], library, ['test:1'], original.phases[0].s), /Only future/)
})
test('updates cannot indirectly move protected activity or introduce activity into today', () => {
  const original = plan(), today = original.phases[0].s - 7 * 86_400_000
  assert.throws(() => previewDurationUpdates([original], library, ['test:1'], today), /past or today/)
  const extended = scheduleProject({ ...original, anchorId: 2, nextPhaseId: 4, phases: [...original.phases, { ...original.phases[0], id: 3, offset: 0 }] })
  const earliest = extended.phases[0].s
  const shorter = { ...library, phases: [{ ...library.phases[0], weeks: 1 }] }
  const [after] = previewDurationUpdates([extended], shorter, ['test:3'], earliest)
  assert.equal(after.phases[0].s, extended.phases[0].s)
  assert.equal(after.phases[0].weeks, 2)
})
