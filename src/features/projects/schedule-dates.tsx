import type { Project } from '../../data/schemas.ts'
import { christmasBreaks, formatDate } from '../../domain/calendar.ts'
import { dateMovementSummary, finishDate } from '../../domain/scheduling.ts'
import { christmasExplanation } from '../../domain/comparison.ts'

function ActiveDuration({ phase, previous, comparing = false }: { phase: Project['phases'][number]; previous?: Project['phases'][number]; comparing?: boolean }) {
  if (phase.kind === 'milestone') return 'Milestone'
  const paused = christmasBreaks(phase.s, phase.e).length > 0
  const wasPaused = previous?.kind === 'phase' && christmasBreaks(previous.s, previous.e).length > 0
  const weeks = (value: number) => value === 1 ? 'week' : 'weeks'
  if (comparing && previous?.kind === 'phase' && (paused || wasPaused)) return <>
    <span className="duration-comparison">Saved: {previous.weeks} {wasPaused ? 'active ' : ''}{weeks(previous.weeks)}</span>
    <span className="duration-comparison">Proposed: {phase.weeks} {paused ? 'active ' : ''}{weeks(phase.weeks)}</span>
    <small className="christmas-duration-note">{paused && wasPaused ? 'Christmas and New Year break excluded.' : wasPaused ? 'Saved duration excludes the Christmas and New Year break.' : 'Proposed duration excludes the Christmas and New Year break.'}</small>
  </>
  if (paused) return <>{phase.weeks} active {weeks(phase.weeks)}<small className="christmas-duration-note">Christmas and New Year break excluded.</small></>
  return comparing ? previous && previous.weeks !== phase.weeks ? `${previous.weeks} → ${phase.weeks}` : `${phase.weeks}` : `${phase.weeks} ${weeks(phase.weeks)}`
}

export function ScheduleDates({ before, after }: { before?: Project; after: Project }) {
  const dateCount = after.phases.length + (before?.phases.filter(phase => !after.phases.some(item => item.id === phase.id)).length ?? 0)
  const description = `Show ${before ? 'saved and proposed ' : ''}start and finish dates for ${dateCount === 1 ? '1 phase or milestone' : `all ${dateCount} phases and milestones`}.`
  const end = (phase: Project['phases'][number]) => phase.kind === 'milestone' ? phase.s : finishDate(phase)
  const anchorNote = (plan: Project, phase: Project['phases'][number]) => phase.id === plan.anchorId && plan.anchor !== phase.s ? <small className="anchor-planning-note">Anchor date entered: {formatDate(plan.anchor)}.</small> : null
  return <><details className="phase-date-details"><summary><span>Phase and milestone dates</span><small>{description}</small></summary><div className="table-scroll" tabIndex={0} role="region" aria-label="Phase and milestone dates"><table><thead><tr><th scope="col">Phase / milestone</th>{before ? <><th scope="col">Saved start</th><th scope="col">Proposed start</th><th scope="col">Saved finish</th><th scope="col">Proposed finish</th><th scope="col">Weeks: saved → proposed</th><th scope="col">What changed</th></> : <><th scope="col">Start</th><th scope="col">Finish</th><th scope="col">Active duration</th></>}</tr></thead><tbody>{after.phases.map(phase => {
    const old = before?.phases.find(item => item.id === phase.id)
    const note = christmasExplanation(old, phase)
    return <tr key={phase.id}><th scope="row">{phase.name}{old && old.name !== phase.name && <small>Previously {old.name}</small>}</th>{before ? <><td>{old ? <>{formatDate(old.s)}{anchorNote(before, old)}</> : 'Not present'}</td><td>{formatDate(phase.s)}{anchorNote(after, phase)}</td><td>{old ? formatDate(end(old)) : 'Not present'}</td><td>{formatDate(end(phase))}</td><td><ActiveDuration phase={phase} previous={old} comparing /></td><td>{old ? dateMovementSummary({ planId: before.id, planName: before.name, label: phase.name, kind: phase.kind, beforeStart: old.s, beforeEnd: end(old), afterStart: phase.s, afterEnd: end(phase) }).join('; ') : 'Added'}{note && <small>{note}</small>}</td></> : <><td>{formatDate(phase.s)}{anchorNote(after, phase)}</td><td>{formatDate(end(phase))}</td><td><ActiveDuration phase={phase} /></td></>}</tr>
  })}{before?.phases.filter(old => !after.phases.some(phase => phase.id === old.id)).map(old => <tr key={`removed-${old.id}`}><th scope="row">{old.name}</th><td>{formatDate(old.s)}{anchorNote(before, old)}</td><td>Removed</td><td>{formatDate(end(old))}</td><td>—</td><td><ActiveDuration phase={old} /></td><td>Removed</td></tr>)}</tbody></table></div></details></>
}
