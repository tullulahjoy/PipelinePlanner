import { useState } from 'react'
import { useWatch } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'
import type { ProjectForm } from '../../data/schemas.ts'
import { relationshipError } from '../../domain/relationships.ts'

const predecessors = (items: ProjectForm['phases']) => new Map(items.map((item, index) => [item.id, items[index - 1]?.id ?? null]))

/** The prototype reviews a non-sequential relationship against its predecessor identity. */
export function useRelationshipReview(form: UseFormReturn<ProjectForm>, initialReview?: [number, number | null][]) {
  const items = useWatch({ control: form.control, name: 'phases' })
  const [reviewed, setReviewed] = useState(() => initialReview ? new Map(initialReview) : predecessors(form.getValues('phases')))
  const checks = new Map(items.flatMap((item, index) => {
    const error = relationshipError(items, index)
    const previousId = items[index - 1]?.id ?? null
    if (!error && (item.relation === 'after' || reviewed.get(item.id) === previousId)) return []
    const old = items.find(old => old.id === reviewed.get(item.id))
    return [[item.id, { error, oldName: old?.name ?? 'the previous phase (now removed)', newName: items[index - 1]?.name ?? 'no phase' }] as const]
  }))
  return {
    reviewed,
    checks,
    pending: new Set(checks.keys()),
    reset: (items: ProjectForm['phases']) => setReviewed(predecessors(items)),
    acknowledge: (id: number) => {
      const current = form.getValues('phases'), index = current.findIndex(item => item.id === id)
      if (index >= 0 && !relationshipError(current, index)) setReviewed(previous => new Map(previous).set(id, current[index - 1]?.id ?? null))
    },
  }
}
