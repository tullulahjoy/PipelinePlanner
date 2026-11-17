import { useState } from 'react'
import type { Project, Library } from '../../data/schemas.ts'
import { Timeline } from '../../ui/timeline.tsx'
import { isoDate, parseDate } from '../../domain/calendar.ts'

export function ScheduleComparison({ before, after, library }: { before: Project; after: Project; library: Library }) {
  const phases = [...before.phases, ...after.phases]
  const extent = { first: Math.min(...phases.map(item => item.s)), last: Math.max(...phases.map(item => item.e)) }
  const [windowState, setWindow] = useState<{ start: number; months: number | 'all' }>({ start: extent.first, months: 12 })
  return <div className="schedule-comparison" onScrollCapture={event => {
    const target = event.target
    if (target instanceof HTMLElement && target.classList.contains('timeline-scroll')) event.currentTarget.querySelectorAll<HTMLElement>('.timeline-scroll').forEach(other => { if (other !== target && Math.abs(other.scrollLeft - target.scrollLeft) > 1) other.scrollLeft = target.scrollLeft })
  }}><div className="review-tools"><h3>Proposed schedule</h3><div className="comparison-controls"><label className="field">Viewing window<select value={windowState.months} onChange={event => setWindow({ ...windowState, months: event.target.value === 'all' ? 'all' : Number(event.target.value) })}><option value={6}>Six months</option><option value={12}>One year</option><option value="all">Full comparison</option></select></label><label className="field">Window starts<input type="date" value={isoDate(windowState.start)} disabled={windowState.months === 'all'} onChange={event => { const start = parseDate(event.target.value); if (Number.isFinite(start)) setWindow({ ...windowState, start }) }} /></label></div></div><Timeline plans={[after]} rules={library.rules} extent={extent} windowState={windowState} hideControls hideFooter /><h3>Saved schedule</h3><Timeline plans={[before]} rules={library.rules} extent={extent} windowState={windowState} hideControls /><p className="supporting-text">Scroll horizontally to see the full schedules. Procurement names stay fixed; both charts use the same dates when comparing.</p></div>
}
