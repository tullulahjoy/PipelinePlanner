import type { ProjectForm } from '../data/schemas.ts'

type Item = ProjectForm['phases'][number]

export function relationshipError(items: Item[], index: number): string {
  const item = items[index]
  if (!item || item.relation === 'after') return ''
  if (index === 0) return 'There is no previous item. Choose First item.'
  if (!Number.isInteger(item.amount) || item.amount < 1 || item.amount > 104) return 'Enter 1–104 whole weeks for the overlap or gap.'
  const previous = items[index - 1]
  if (item.relation === 'overlap' && (item.kind === 'milestone' || previous.kind === 'milestone' || item.amount > Math.min(item.weeks, previous.weeks))) return 'Overlap must fit within both adjacent phases. A milestone cannot overlap.'
  return ''
}

export function relationshipDescription(items: Item[], index: number): string {
  const item = items[index], previous = items[index - 1]
  if (index === 0 && item.relation === 'after') return 'First item'
  if (!previous || relationshipError(items, index)) return ''
  if (item.relation === 'overlap') return `${item.amount}-week overlap with ${previous.name}.`
  const verb = item.kind === 'milestone' ? 'Occurs' : 'Starts'
  const event = previous.name + (previous.kind === 'milestone' ? '' : ' finishes')
  if (item.relation === 'gap') return `${verb} ${item.amount} ${item.amount === 1 ? 'week' : 'weeks'} after ${event}.`
  return previous.kind === 'milestone' ? `${verb} at ${previous.name}.` : `${verb} when ${previous.name} finishes.`
}
