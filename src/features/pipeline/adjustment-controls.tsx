import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import type { FixedPhaseBoundary, Phase } from '../../domain/scheduling.ts'
import { finishDate } from '../../domain/scheduling.ts'
import { formatDate } from '../../domain/calendar.ts'

export function PhaseDurationControls({ phase, onApply }: { phase: Phase; onApply: (weeks: number, keep: FixedPhaseBoundary) => string }) {
  const [duration, setDuration] = useState(String(phase.weeks))
  const [keep, setKeep] = useState<FixedPhaseBoundary>('start')
  const [error, setError] = useState('')
  return <form className="duration-form" onSubmit={event => {
    event.preventDefault()
    setError(onApply(Number(duration), keep))
  }} aria-labelledby="duration-title">
    <h4 id="duration-title">Change phase duration</h4>
    <label className="field-label">Duration (weeks)<input type="number" aria-label="Duration (weeks)" min={1} max={5200} step={1} required value={duration} onChange={event => { setDuration(event.target.value); setError('') }} /></label>
    <label className="field-label">Keep this date fixed<select value={keep} onChange={event => { setKeep(event.target.value as FixedPhaseBoundary); setError('') }}>
      <option value="start">Start date: {formatDate(phase.s)}</option><option value="finish">Finish date: {formatDate(finishDate(phase))}</option>
    </select></label>
    <p className="help">Shortening frees time {keep === 'start' ? 'after' : 'before'} this phase. Other activity and the anchor stay in place.</p>
    <button className="button" type="submit" disabled={Number(duration) === phase.weeks} title={Number(duration) === phase.weeks ? 'Enter a different duration to apply a change.' : undefined}>Apply duration change</button>
    {error ? <p className="error-box" role="alert">{error}</p> : null}
  </form>
}
export function PhaseActionTabs({ movement, duration, anchor, onActionChange }: {
  movement: ReactNode; duration: ReactNode; anchor: ReactNode; onActionChange: () => void
}) {
  const [action, setAction] = useState<'move' | 'duration'>('move')
  const id = useId()
  const actions = [{ value: 'move', label: 'Move phase' }, { value: 'duration', label: 'Change duration' }] as const
  function selectAction(next: typeof action) {
    if (next === action) return
    setAction(next); onActionChange()
  }
  return <>
    <div className="phase-action-tabs" role="tablist" aria-label="Phase adjustment" onKeyDown={event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
      event.preventDefault()
      const index = actions.findIndex(item => item.value === action)
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? actions.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : -1) + actions.length) % actions.length
      selectAction(actions[next].value)
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next].focus()
    }}>
      {actions.map(item => <button key={item.value} id={`${id}-${item.value}-tab`} type="button" role="tab"
        aria-selected={action === item.value} aria-controls={`${id}-${item.value}-panel`} tabIndex={action === item.value ? 0 : -1}
        onClick={() => selectAction(item.value)}>{item.label}</button>)}
    </div>
    {anchor}
    <section className="phase-action-panel" id={`${id}-move-panel`} role="tabpanel" aria-labelledby={`${id}-move-tab`} hidden={action !== 'move'} tabIndex={0}>
      {movement}
    </section>
    <section className="phase-action-panel" id={`${id}-duration-panel`} role="tabpanel" aria-labelledby={`${id}-duration-tab`} hidden={action !== 'duration'} tabIndex={0}>
      {duration}
    </section>
  </>
}
