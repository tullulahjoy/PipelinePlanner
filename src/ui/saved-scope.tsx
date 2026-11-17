import type { SavedPipeline } from '../data/schemas.ts'
import { formatDate } from '../domain/calendar.ts'
import { finishDate } from '../domain/scheduling.ts'

export function SavedScope({ record }: { record: SavedPipeline }) {
  const starts: number[] = [], finishes: number[] = []
  for (const plan of record.plans) for (const phase of plan.phases) {
    starts.push(phase.id === plan.anchorId ? plan.anchor : phase.s)
    finishes.push(phase.id === plan.anchorId ? plan.anchor : finishDate(phase))
  }
  return <p className="saved-scope">
    {record.plans.length} {record.plans.length === 1 ? 'procurement' : 'procurements'}
    {starts.length > 0 && <> · {formatDate(Math.min(...starts))} to {formatDate(Math.max(...finishes))}</>}
  </p>
}
