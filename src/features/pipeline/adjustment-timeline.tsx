import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { DragDropProvider, useDraggable } from '@dnd-kit/react'
import { Feedback, KeyboardSensor, PointerActivationConstraints, PointerSensor } from '@dnd-kit/dom'
import { RestrictToHorizontalAxis, SnapModifier } from '@dnd-kit/abstract/modifiers'
import { configurator } from '@dnd-kit/abstract'
import type { Plan, OverlapRule, Selection } from '../../domain/scheduling.ts'
import { defaultSelection, moveSelection, selectedBounds } from '../../domain/scheduling.ts'
import { Timeline } from '../../ui/timeline.tsx'
import type { TimelineWindow } from '../../ui/timeline.tsx'
import { PhaseSegments } from '../../ui/timeline-segments.tsx'
import { closeTimelineDetails } from '../../ui/timeline-details.ts'
import { WEEK, addMonths, monday } from '../../domain/calendar.ts'

const LABEL_WIDTHS = { wide: 220, narrow: 180, breakpoint: 550 }

class WeekSnap extends SnapModifier {
  override apply({ transform }: Parameters<SnapModifier['apply']>[0]) {
    const size = this.options?.size ?? 1
    const width = typeof size === 'number' ? size : size.x
    return { x: Math.round(transform.x / width) * width, y: 0 }
  }
  static override configure = configurator(WeekSnap)
}

function SelectionHandle({ plan, selection, frame, pixelsPerWeek, locked, onWidth }: {
  plan: Plan; selection: Selection; frame: { start: number; end: number }; pixelsPerWeek: number; locked: boolean; onWidth: (width: number) => void
}) {
  useLayoutEffect(() => onWidth(pixelsPerWeek), [pixelsPerWeek, onWidth])
  const modifiers = useMemo(() => [RestrictToHorizontalAxis, WeekSnap.configure({ size: { x: pixelsPerWeek, y: 1 } })], [pixelsPerWeek])
  const { ref, handleRef, isDragging } = useDraggable({ id: plan.id, data: { selection, pixelsPerWeek }, modifiers,
    plugins: [Feedback.configure({ feedback: 'move', dropAnimation: null })] })
  const bounds = selectedBounds(plan, selection)
  return <div ref={ref} className={`adjustment-selection${locked ? ' locked' : ''}${isDragging ? ' dragging' : ''}`} style={{ left: `${(bounds.s - frame.start) / (frame.end - frame.start) * 100}%`, width: `${Math.max(.2, (bounds.e - bounds.s) / (frame.end - frame.start) * 100)}%` }}>
    <button type="button" ref={handleRef} className="adjustment-grip" aria-label={`Move selected activity in ${plan.name}. Press Space, then Left or Right to move by one week. Press Space to drop or Escape to cancel.`}>⠿ Move selection{locked ? ' - Anchor locked' : ''}</button>
  </div>
}

export function AdjustmentTimeline({ plans, rules, selection, allowAnchor, window, onWindowChange, onSelect, onMove, onError, reviewing }: {
  plans: Plan[]; rules: OverlapRule[]; selection: Selection; allowAnchor: boolean; window: TimelineWindow
  onWindowChange: (next: TimelineWindow) => void; onSelect: (next: Selection) => void
  onMove: (selection: Selection, weeks: number) => void; onError: (message: string) => void; reviewing: boolean
}) {
  const [live, setLive] = useState<{ plans: Plan[] | null; weeks: number; error: string } | null>(null)
  const [weekWidth, setWeekWidth] = useState(20)
  const drag = useRef<{ plans: Plan[]; selection: Selection; width: number } | null>(null)
  const frameRequest = useRef(0)
  useEffect(() => () => cancelAnimationFrame(frameRequest.current), [])
  const sensors = useMemo(() => [PointerSensor.configure({ activationConstraints: [new PointerActivationConstraints.Distance({ value: 5 })] }), KeyboardSensor.configure({ offset: { x: weekWidth, y: 0 } })], [weekWidth])
  const bounds = selectedBounds(plans.find(plan => plan.id === selection.planId)!, selection)
  useLayoutEffect(() => {
    if (reviewing || window.months === 'all') return
    if (bounds.s < window.start || bounds.e > addMonths(window.start, window.months)) {
      const start = monday(bounds.s - WEEK)
      if (start !== window.start) onWindowChange({ ...window, start })
    }
  }, [bounds.s, bounds.e, window, onWindowChange, reviewing])
  function proposal(weeks: number) {
    try { return { plans: moveSelection(drag.current!.plans, drag.current!.selection, weeks, allowAnchor), weeks, error: '' } }
    catch (failure) { return { plans: null, weeks, error: failure instanceof Error ? failure.message : 'This movement could not be calculated.' } }
  }
  return <DragDropProvider sensors={sensors} onBeforeDragStart={event => {
    if (reviewing) { event.preventDefault(); return }
    const data = event.operation.source?.data as { selection: Selection; pixelsPerWeek: number } | undefined
    if (!data) { event.preventDefault(); return }
    const plan = plans.find(plan => plan.id === data.selection.planId)!
    if (!allowAnchor && plan.phases.slice(data.selection.first, data.selection.last + 1).some(phase => phase.id === plan.anchorId)) {
      event.preventDefault(); onError('The selection includes the locked anchor. Allow this anchor date to move, or choose phases that leave it in place.')
    }
  }} onDragStart={event => {
    closeTimelineDetails()
    const data = event.operation.source!.data as { selection: Selection; pixelsPerWeek: number }
    drag.current = { plans, selection: data.selection, width: data.pixelsPerWeek }
    setWeekWidth(data.pixelsPerWeek); setLive(proposal(0))
  }} onDragMove={(_event, manager) => {
    cancelAnimationFrame(frameRequest.current)
    frameRequest.current = requestAnimationFrame(() => {
      if (drag.current && manager.dragOperation.status.dragging) setLive(proposal(Math.max(-104, Math.min(104, Math.round(manager.dragOperation.transform.x / drag.current.width)))))
    })
  }} onDragEnd={event => {
    cancelAnimationFrame(frameRequest.current)
    if (!drag.current) return
    const weeks = Math.max(-104, Math.min(104, Math.round(event.operation.transform.x / drag.current.width)))
    const result = proposal(weeks), selected = drag.current.selection
    drag.current = null; setLive(null)
    if (event.canceled || !weeks) return
    if (result.error) onError(result.error)
    else onMove(selected, weeks)
  }}>
    <Timeline plans={plans} rules={rules} windowState={window} onWindowChange={onWindowChange} labelWidths={LABEL_WIDTHS}
      onSelect={reviewing ? undefined : id => onSelect(defaultSelection(plans.find(plan => plan.id === id)!))}
      interaction={reviewing ? undefined : { selection, onPick: onSelect, moving: Boolean(live), overlay: (plan, frame, pixelsPerWeek) => <>
        {selection.planId === plan.id && <SelectionHandle plan={plan} selection={selection} frame={frame} pixelsPerWeek={pixelsPerWeek} onWidth={setWeekWidth} locked={!allowAnchor && plan.phases.slice(selection.first, selection.last + 1).some(phase => phase.id === plan.anchorId)} />}
        {live?.plans && selection.planId === plan.id && <div className="adjustment-ghost"><PhaseSegments plan={{ ...live.plans.find(item => item.id === plan.id)!, phases: live.plans.find(item => item.id === plan.id)!.phases.slice(selection.first, selection.last + 1) }} frame={frame} clashes={[]} /></div>}
      </> }} />
    {live && <p role="status" className={`adjustment-readout${live.error ? ' invalid' : ''}`}>{Math.abs(live.weeks)} {Math.abs(live.weeks) === 1 ? 'week' : 'weeks'} {live.weeks < 0 ? 'earlier' : 'later'}{live.error ? `: ${live.error}` : ' - Release to update the draft'}</p>}
  </DragDropProvider>
}
