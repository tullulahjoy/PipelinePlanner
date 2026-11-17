import { useLayoutEffect, useRef } from 'react'
import type { ComponentProps, CSSProperties } from 'react'
import { DAY, activeDays, activeSpans, christmasBreaks, formatDate, isPaused } from '../domain/calendar.ts'
import { clashDates, finishDate } from '../domain/scheduling.ts'
import type { Clash, Phase, Plan, Selection } from '../domain/scheduling.ts'

export type DetailBinder = (source: HTMLElement, name: string, lines: string[]) => (() => void) | undefined
export type InspectDetails = (name: string, lines: string[]) => void
type View = { start: number; end: number }

function DetailButton({ name, lines, shared, bindDetails, onInspect, ...props }: ComponentProps<'button'> & { name: string; lines: string[]; shared: boolean; bindDetails?: DetailBinder; onInspect?: InspectDetails }) {
  const ref = useRef<HTMLButtonElement>(null)
  const details = JSON.stringify(lines)
  useLayoutEffect(() => {
    if (shared && ref.current && bindDetails) return bindDetails(ref.current, name, JSON.parse(details))
  }, [shared, name, details, bindDetails])
  return <button {...props} ref={ref} onClick={onInspect ? () => onInspect(name, lines) : props.onClick} title={shared && bindDetails ? undefined : `${name}: ${lines.join('. ')}`} aria-label={`${name}: ${lines.join('. ')}`} />
}
function durationSummary(phase: Phase, phases: Phase[]) {
  const overlaps = phases.filter(other => other.id !== phase.id && other.kind === 'phase')
    .map(other => ({ name: other.name, weeks: activeDays(Math.max(phase.s, other.s), Math.min(phase.e, other.e)) / 7 })).filter(other => other.weeks > 0)
  let text = `${phase.weeks} active ${phase.weeks === 1 ? 'week' : 'weeks'}`
  if (overlaps.length === 1) text += `; ${overlaps[0].weeks} of which overlap with ${overlaps[0].name}`
  else if (overlaps.length) text += `; overlaps with ${overlaps.map(other => `${other.name} (${other.weeks} active weeks)`).join(' and ')}`
  if (activeDays(phase.s, phase.e) * DAY < phase.e - phase.s) text += '; Christmas and New Year weeks are skipped'
  return `${text}.`
}
function overlapSummary(phases: Phase[]) {
  const start = Math.max(...phases.map(phase => phase.s)), end = Math.min(...phases.map(phase => phase.e))
  const spans = activeSpans(start, end), weeks = spans.reduce((total, span) => total + (span.e - span.s) / (7 * DAY), 0)
  return `Intentional overlap: ${formatDate(spans[0].s)} to ${formatDate(spans.at(-1)!.e - 3 * DAY)} · ${weeks} active ${weeks === 1 ? 'week' : 'weeks'}`
}
export function PhaseSegments({ plan, frame, clashes, onPick, range, faded = false, sharedTooltips = false, bindDetails, onInspect }: {
  plan: Plan; frame: View; clashes: Clash[]; onPick?: (index: number) => void
  range?: Selection; faded?: boolean; sharedTooltips?: boolean; bindDetails?: DetailBinder; onInspect?: InspectDetails
}) {
  const width = frame.end - frame.start
  if (width <= 0) return null
  const position = (time: number) => (time - frame.start) / width * 100
  const rect = (s: number, e: number): CSSProperties => ({ left: `${position(Math.max(s, frame.start))}%`, width: `${(Math.min(e, frame.end) - Math.max(s, frame.start)) / width * 100}%` })
  const boundaries = new Set([frame.start, frame.end])
  plan.phases.forEach(p => { if (p.s > frame.start && p.s < frame.end) boundaries.add(p.s); if (p.e > frame.start && p.e < frame.end) boundaries.add(p.e) })
  const pauses = christmasBreaks(frame.start, frame.end)
  pauses.forEach(({ s, e }) => { boundaries.add(s); boundaries.add(e) })
  const times = [...boundaries].sort((a, b) => a - b)
  const first = Math.min(...plan.phases.map(p => p.s)), last = Math.max(...plan.phases.map(p => p.e))
  return <div className="phase-content" data-plan-content={plan.id}>
    {pauses.map(p => <span key={p.s} className="shutdown-shade" style={rect(p.s, p.e)} />)}
    {times.slice(0, -1).map((s, i) => {
      const e = times[i + 1]
      if (s < first || e > last) return null
      const phases = plan.phases.filter(p => p.kind === 'phase' && p.s < e && p.e > s)
      const paused = isPaused(s), gap = !phases.length && !paused
      const relevant = clashes.filter(f => f.firstPlan === plan.id && phases.some(p => p.id === f.firstPhase) || f.secondPlan === plan.id && phases.some(p => p.id === f.secondPhase))
      const selected = range && phases.some(p => { const index = plan.phases.indexOf(p); return index >= range.first && index <= range.last })
      const names = phases.map(p => p.name).join(' + ')
      const lines = gap ? ['Pipeline Plan adjustment gap', `${formatDate(s)} to ${formatDate(e)}`, 'No activity scheduled.']
        : paused ? [...(names ? [names] : []), `Christmas and New Year break: ${formatDate(s)} to ${formatDate(e - DAY)}`]
          : phases.length > 1 ? [names, overlapSummary(phases)]
            : [names, `Planning dates: ${formatDate(phases[0].s)} to ${formatDate(finishDate(phases[0]))}`, durationSummary(phases[0], plan.phases)]
      if (!gap && !paused) relevant.forEach(f => {
        const first = f.firstPlan === plan.id
        lines.push(`${f.severity === 'critical' ? 'Critical clash' : 'Warning'}: ${first ? f.phase : f.secondPhaseName} overlaps with ${first ? f.secondPhaseName : f.phase} in ${first ? f.secondPlanName : f.firstPlanName}. Overlap: ${clashDates(f)} (${f.weeks} active weeks).`)
      })
      return <DetailButton bindDetails={bindDetails} onInspect={onInspect} key={s} type="button" name={plan.name} lines={lines} shared={sharedTooltips} className={`phase-segment${gap ? ' gap' : ''}${paused ? ' paused' : ''}${selected ? ' phase-selected' : ''}${faded && selected ? ' moving-original' : ''}`}
        style={{ ...rect(s, e), ...(!gap && !paused ? { background: phases.length > 1 ? `linear-gradient(135deg,${phases[0].color} 50%,${phases[1].color} 50%)` : phases[0].color } : {}) }}
        onClick={() => { if (!gap && !paused) onPick?.(plan.phases.indexOf(phases[0])) }}>
        <span className="phase-label">{paused ? '' : gap ? 'Pipeline Plan adjustment gap' : names}</span>
      </DetailButton>
    })}
    {plan.phases.filter(p => p.kind === 'milestone' && p.s >= frame.start && p.s <= frame.end).map(p => sharedTooltips
      ? <DetailButton bindDetails={bindDetails} onInspect={onInspect} key={p.id} type="button" name={plan.name} shared lines={p.id === plan.anchorId ? [p.name, `Anchor date: ${formatDate(plan.anchor)}`, `Planning milestone: ${formatDate(plan.planningAnchor)}`] : [p.name, formatDate(p.s)]} className={`phase-milestone interactive-milestone${p.id === plan.anchorId ? ' anchor-mark' : ''}`} style={{ left: `${position(p.s)}%` }} />
      : <span key={p.id} className={`phase-milestone${p.id === plan.anchorId ? ' anchor-mark' : ''}`} style={{ left: `${position(p.s)}%` }} title={`${p.name}: ${formatDate(p.id === plan.anchorId ? plan.anchor : p.s)}`} />)}
    {clashes.flatMap(f => f.firstPlan === plan.id || f.secondPlan === plan.id ? f.spans.map((span, i) => span.e > frame.start && span.s < frame.end ? <span key={`${f.key}:${i}`} className={`clash-outline ${f.severity}`} style={rect(span.s, span.e)} /> : null) : [])}
  </div>
}
