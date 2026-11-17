import type { SavedPipeline } from '../../data/schemas.ts'
import type { ComparisonValue, VersionChange, projectComparisons } from '../../domain/comparison.ts'
import { comparisonMovementSummary, scheduleDifferenceLabel } from '../../domain/comparison.ts'
import { formatDate } from '../../domain/calendar.ts'

function ScheduleValue({ value, phase, position, showRelationship }: {
  value: ComparisonValue | null; phase?: SavedPipeline['plans'][number]['phases'][number]
  position?: number; showRelationship: boolean
}) {
  if (!value) return <span className="comparison-absent">Not present</span>
  return <>
    {value.name && <strong>{value.name}</strong>}
    {value.start !== undefined && <span>{formatDate(value.start)}{value.end !== undefined && value.end !== value.start ? ` to ${formatDate(value.end)}` : ''}</span>}
    {value.weeks !== undefined && <small>{value.weeks} {value.weekType} {value.weeks === 1 ? 'week' : 'weeks'}</small>}
    {phase?.kind === 'milestone' && <small>Milestone</small>}
    {position !== undefined && <small>Activity position: {position}</small>}
    {showRelationship && phase && <small>{phase.offset === 0 ? 'Follows the previous activity' : `${phase.offset < 0 ? 'Overlap' : 'Gap'}: ${Math.abs(phase.offset)} active ${Math.abs(phase.offset) === 1 ? 'week' : 'weeks'}`}</small>}
  </>
}

function activity(record: SavedPipeline, change: VersionChange) {
  if (change.kind !== 'phase') return {}
  const plan = record.plans.find(plan => plan.id === change.planId)
  const id = Number(change.id.slice(change.id.lastIndexOf(':') + 1))
  const index = plan?.phases.findIndex(phase => phase.id === id) ?? -1
  return { phase: plan?.phases[index], position: change.details.includes('Order changed') && index >= 0 ? index + 1 : undefined }
}

export function ScheduleDifferences({ first, second, procurements }: {
  first: SavedPipeline; second: SavedPipeline; procurements: ReturnType<typeof projectComparisons>
}) {
  return <details className="comparison-section">
    <summary><h3>Schedule differences</h3><span className="comparison-section-count">{procurements.length} {procurements.length === 1 ? 'procurement' : 'procurements'} with changes</span>
      <span className="comparison-description">Expand to read what changed for each procurement. Open exact dates only when needed.</span>
    </summary>
    <div className="comparison-section-body">
      <p className="comparison-note">Changes in {second.name} compared with {first.name}. Consecutive activities that moved together are summarised in one line.</p>
      {procurements.length ? procurements.map(procurement => <details className="comparison-procurement" key={procurement.id}>
        <summary><strong>{procurement.name}</strong><span className="comparison-change-labels">{procurement.labels.map(label => <span key={label}>{label}</span>)}</span></summary>
        <ul className="comparison-sentences">{procurement.summaries.map((sentence, index) => <li key={index}>{sentence}</li>)}</ul>
        <details className="comparison-exact-dates">
          <summary>Show exact dates <small>({procurement.entries.length} differing {procurement.entries.length === 1 ? 'entry' : 'entries'})</small></summary>
          <div className="table-scroll" tabIndex={0} role="region" aria-label={`Exact schedule differences for ${procurement.name}`}>
            <table className="comparison-schedule-table">
              <caption className="sr-only">{procurement.name}: {second.name} relative to {first.name}. Movement is in calendar weeks and days.</caption>
              <thead><tr><th scope="col">Activity</th><th scope="col">{first.name}</th><th scope="col">{second.name}</th><th scope="col">What changed</th></tr></thead>
              <tbody>{procurement.entries.map(change => <tr key={change.id}>
                <th scope="row">{change.label}</th>
                {[first, second].map((record, index) => <td key={record.id}>
                  <ScheduleValue value={index === 0 ? change.before : change.after} {...activity(record, change)} showRelationship={change.details.includes('Timing relationship changed')} />
                </td>)}
                <td>{change.before && change.after && comparisonMovementSummary(change, first.name, second.name).filter(line => line !== 'Not applicable').map(line => <span key={line}>{line}</span>)}
                  <small>{scheduleDifferenceLabel(change, first.name, second.name)}</small>
                  {procurement.notes.has(change.id) && <p className="comparison-note">{procurement.notes.get(change.id)}</p>}
                </td>
              </tr>)}</tbody>
            </table>
          </div>
        </details>
      </details>) : <p>No schedule differences.</p>}
    </div>
  </details>
}
