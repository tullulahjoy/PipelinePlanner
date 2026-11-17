import test from 'node:test'
import assert from 'node:assert/strict'
import type { ProjectForm } from '../data/schemas.ts'
import { relationshipDescription, relationshipError } from './relationships.ts'

const phase = (id: number, name: string, options: Partial<ProjectForm['phases'][number]> = {}): ProjectForm['phases'][number] => ({ id, name, kind: 'phase', weeks: 3, libraryPhaseId: '', color: '#315ed4', durationInherited: true, relation: 'after', amount: 0, ...options })

test('sequential phase and milestone descriptions follow the actual preceding activity', () => {
  const items = [phase(1, 'Evaluation'), phase(2, 'Award', { kind: 'milestone', weeks: 0 }), phase(3, 'Mobilisation')]
  assert.equal(relationshipDescription(items, 0), 'First item')
  assert.equal(relationshipDescription(items, 1), 'Occurs when Evaluation finishes.')
  assert.equal(relationshipDescription(items, 2), 'Starts at Award.')
  assert.equal(relationshipError(items, 1), '')
})
test('valid gap/overlap descriptions identify which neighbouring activity determines timing', () => {
  const items = [phase(1, 'Evaluation'), phase(2, 'Moderation', { relation: 'overlap', amount: 1 })]
  assert.equal(relationshipDescription(items, 1), '1-week overlap with Evaluation.')
  items[1].relation = 'gap'; items[1].amount = 2
  assert.equal(relationshipDescription(items, 1), 'Starts 2 weeks after Evaluation finishes.')
})
test('first-item offsets, invalid amounts and impossible overlaps require correction', () => {
  assert.match(relationshipError([phase(1, 'Review', { relation: 'gap', amount: 1 })], 0), /Choose First item/)
  for (const amount of [0, 105, 1.5, NaN]) assert.match(relationshipError([phase(1, 'Review'), phase(2, 'Award', { relation: 'gap', amount })], 1), /1–104/)
  assert.match(relationshipError([phase(1, 'Review'), phase(2, 'Award', { kind: 'milestone', weeks: 0, relation: 'overlap', amount: 1 })], 1), /milestone cannot overlap/)
  assert.match(relationshipError([phase(1, 'Review'), phase(2, 'Award', { relation: 'overlap', amount: 4 })], 1), /fit within both/)
})
