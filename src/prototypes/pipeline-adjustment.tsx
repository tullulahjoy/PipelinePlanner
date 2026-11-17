import { PhaseSegments } from '../ui/timeline-segments.tsx'
import type { DetailBinder } from '../ui/timeline-segments.tsx'
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ComponentProps, CSSProperties, ReactNode, RefObject } from 'react'
import { createRoot } from 'react-dom/client'
import { DragDropProvider, useDraggable, useDroppable } from '@dnd-kit/react'
import { Feedback, KeyboardSensor, PointerActivationConstraints, PointerSensor } from '@dnd-kit/dom'
import { RestrictToHorizontalAxis, SnapModifier } from '@dnd-kit/abstract/modifiers'
import { configurator } from '@dnd-kit/abstract'
import Timeline from 'react-calendar-timeline'
import type { TimelineGroupBase, TimelineItemBase } from 'react-calendar-timeline'
import 'react-calendar-timeline/style.css'
import {
  DAY, WEEK, addMonths, changePhaseDuration, clonePlans, dateChanges, dateMovementSummary, defaultSelection,
  findClashes, finishDate, formatDate, initialPlans, isoDate, monday,
  moveSelection, parseDate, SAMPLE_RULES, selectedBounds,
} from './pipeline-scheduling'
import type { FixedPhaseBoundary, OverlapRule, Phase, Plan, Selection } from './pipeline-scheduling'
import type { ConnectedAdjustment } from './pipeline-connected-types'
import './pipeline-adjustment.css'
import { FindingCard } from './pipeline-findings'

type Trial = 'dnd' | 'calendar'
type View = { start: number; end: number }
type Mode = 'whole' | 'phase' | 'range'
type LiveMove = { selection: Selection; weeks: number; plans: Plan[] | null; error: string }
type ChartProps = {
  plans: Plan[]; view: View; onView: (view: View) => void
  rules?: OverlapRule[]; sharedTooltips?: boolean
  selection?: Selection; allowAnchor?: boolean
  onSelect?: (selection: Selection) => void
  onMove?: (selection: Selection, weeks: number) => void
  onError?: (message: string) => void
}
const SEED = initialPlans()
const FIRST = Math.min(...SEED.flatMap(p => p.phases.map(item => item.s)))
const INITIAL_VIEW: View = { start: FIRST, end: addMonths(FIRST, 12) }
const LABEL_WIDTH = 220
// The stock modifier rounds up. Nearest-week rounding treats earlier and later
// movement equally and avoids fractional-pixel errors with keyboard steps.
class WeekSnapModifier extends SnapModifier {
  override apply({ transform }: Parameters<SnapModifier['apply']>[0]) {
    const size = this.options?.size ?? 1
    const weekWidth = typeof size === 'number' ? size : size.x
    return { x: Math.round(transform.x / weekWidth) * weekWidth, y: 0 }
  }
  static override configure = configurator(WeekSnapModifier)
}
const getPlan = (plans: Plan[], id: string) => plans.find(p => p.id === id)!
const sameSelection = (a: Selection, b: Selection) => a.planId === b.planId && a.first === b.first && a.last === b.last
const selectionHasAnchor = (plan: Plan, selection: Selection) => plan.phases.slice(selection.first, selection.last + 1).some(p => p.id === plan.anchorId)
const countMessage = (plans: Plan[], rules: OverlapRule[] = SAMPLE_RULES) => {
  const findings = findClashes(plans, rules)
  return { findings, critical: findings.filter(f => f.severity === 'critical').length, warnings: findings.filter(f => f.severity === 'warning').length }
}
function useWidth(ref: RefObject<HTMLDivElement | null>) {
  const [width, setWidth] = useState(900)
  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new ResizeObserver(() => setWidth(previous => {
      const next = Math.round(node.clientWidth)
      return next === previous ? previous : next
    }))
    observer.observe(node)
    setWidth(node.clientWidth)
    return () => observer.disconnect()
  }, [ref])
  return width
}
function safeProposal(plans: Plan[], selection: Selection, weeks: number, allowed: boolean): LiveMove {
  try { return { selection, weeks, plans: moveSelection(plans, selection, weeks, allowed), error: '' } }
  catch (error) { return { selection, weeks, plans: null, error: error instanceof Error ? error.message : 'This movement could not be calculated.' } }
}
const bindTimelineDetails: DetailBinder = (source, name, lines) => window.LTPPTooltips?.bind(source, name, lines)
function PhaseContent(props: ComponentProps<typeof PhaseSegments>) {
  return <PhaseSegments {...props} bindDetails={bindTimelineDetails} />
}
function Legend() {
  return <div className="chart-legend"><span>Coloured blocks: phases</span><span>Diagonal split: intentional overlap</span><span>Hatching: pause or gap</span><span className="key-warning">Warning</span><span className="key-critical">Critical clash</span></div>
}
function SelectionDrag({ plan, selection, start, end, pixelsPerWeek, locked }: {
  plan: Plan; selection: Selection; start: number; end: number; pixelsPerWeek: number; locked: boolean
}) {
  const modifiers = useMemo(() => [RestrictToHorizontalAxis, WeekSnapModifier.configure({ size: { x: pixelsPerWeek, y: 1 } })], [pixelsPerWeek])
  const { ref, handleRef, isDragging } = useDraggable({ id: `selection:${plan.id}`, data: { selection }, modifiers,
    plugins: [Feedback.configure({ feedback: 'move', dropAnimation: null })] })
  const bounds = selectedBounds(plan, selection)
  return <div ref={ref} data-dnd-dragging={isDragging ? 'true' : undefined} className={`selection-drag${isDragging ? ' is-dragging' : ''}${locked ? ' is-locked' : ''}`}
    style={{ left: `${(bounds.s - start) / (end - start) * 100}%`, width: `${Math.max(.2, (bounds.e - bounds.s) / (end - start) * 100)}%` }}>
    <button ref={handleRef} type="button" className="drag-grip" aria-label={`Drag selected activity in ${plan.name}. Press Space, then Left or Right to move by one week. Press Space to drop or Escape to cancel.`} data-drag-handle={plan.id}>
      <span aria-hidden="true">⠿</span> Move selection{locked ? ' · Anchor locked' : ''}
    </button>
  </div>
}
function DndChart(props: ChartProps & { editable?: boolean }) {
  const { plans, view, onView, selection, onSelect, onMove, onError, allowAnchor = false, editable = false, rules = SAMPLE_RULES, sharedTooltips = false } = props
  const scroll = useRef<HTMLDivElement>(null), width = useWidth(scroll)
  const [live, setLive] = useState<LiveMove | null>(null)
  const liveRef = useRef<LiveMove | null>(null)
  const first = Math.min(...plans.flatMap(p => p.phases.map(item => item.s)))
  const start = monday(Math.min(first - 4 * WEEK, view.start))
  const end = Math.max(view.end, ...plans.flatMap(p => p.phases.map(item => item.e + WEEK)))
  const label = width < 550 ? 180 : LABEL_WIDTH
  const axisWidth = Math.max(260, width - label) * (end - start) / (view.end - view.start)
  const pixelsPerWeek = axisWidth / (end - start) * WEEK
  const monthTickStride = Math.max(1, Math.ceil(62 / (pixelsPerWeek * 4.35)))
  const sensors = useMemo(() => [PointerSensor.configure({ activationConstraints: [new PointerActivationConstraints.Distance({ value: 5 })] }), KeyboardSensor.configure({ offset: { x: pixelsPerWeek, y: 0 } })], [pixelsPerWeek])
  const { ref: dropRef } = useDroppable({ id: 'timeline-drop', disabled: !editable })
  const findings = useMemo(() => findClashes(plans, rules), [plans, rules])
  useLayoutEffect(() => { if (scroll.current) scroll.current.scrollLeft = (view.start - start) / WEEK * pixelsPerWeek }, [view.start, start, pixelsPerWeek])
  const latest = useRef({ plans, allowAnchor, onSelect, onMove, onError })
  useLayoutEffect(() => { latest.current = { plans, allowAnchor, onSelect, onMove, onError } }, [plans, allowAnchor, onSelect, onMove, onError])
  const base = useRef<Plan[] | null>(null)
  const dragFrame = useRef(0)
  useEffect(() => () => cancelAnimationFrame(dragFrame.current), [])
  const updateLive = (next: LiveMove | null) => { liveRef.current = next; setLive(next) }
  const chart = <div className="custom-chart-scroll" ref={scroll} tabIndex={0} aria-label="Scrollable procurement pipeline" role="region"
    onScroll={event => {
      const next = start + Math.round(event.currentTarget.scrollLeft / pixelsPerWeek) * WEEK
      if (!liveRef.current && Math.abs(next - view.start) > 1000) onView({ start: next, end: next + view.end - view.start })
    }}>
    <div className="custom-chart" ref={dropRef} style={{ width: label + axisWidth, '--trial-label': `${label}px`, '--trial-week': `${pixelsPerWeek}px` } as CSSProperties}>
      <div className="custom-row ruler-row"><div className="row-label">Procurement</div><div className="custom-ruler">
        {Array.from({ length: Math.ceil((end - start) / (28 * DAY)) + 2 }, (_, index) => {
          const d = new Date(start); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + index)
          const t = d.getTime()
          return t >= start && t < end && index % monthTickStride === 0 ? <span key={t} style={{ left: `${(t - start) / (end - start) * 100}%` }}>{new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(t)}</span> : null
        })}
      </div></div>
      {plans.map(plan => {
        const selected = selection?.planId === plan.id ? selection : undefined
        const moving = live?.selection.planId === plan.id ? live : null
        const proposal = moving?.plans?.find(p => p.id === plan.id)
        return <div className={`custom-row${selected ? ' selected-row' : ''}`} key={plan.id}>
          <div className="row-label">{onSelect ? <button type="button" onClick={() => onSelect(defaultSelection(plan))}>{plan.name}</button> : <strong>{plan.name}</strong>}<small>{plan.anchorName}: {formatDate(plan.anchor)}</small></div>
          <div className="custom-track">
            <PhaseContent plan={plan} frame={{ start, end }} clashes={findings} range={selected} faded={!!moving} sharedTooltips={sharedTooltips}
              onPick={editable ? index => onSelect?.({ planId: plan.id, first: index, last: index }) : undefined} />
            {editable && selected ? <SelectionDrag plan={plan} selection={selected} start={start} end={end} pixelsPerWeek={pixelsPerWeek} locked={selectionHasAnchor(plan, selected) && !allowAnchor} /> : null}
            {proposal ? <div className="ghost-phases"><PhaseContent plan={{ ...proposal, phases: proposal.phases.slice(moving!.selection.first, moving!.selection.last + 1) }} frame={{ start, end }} clashes={[]} /></div> : null}
          </div>
        </div>
      })}
    </div>
  </div>
  return <DragDropProvider sensors={sensors} onBeforeDragStart={event => {
    if (!editable) { event.preventDefault(); return }
    const selected = event.operation.source?.data.selection as Selection | undefined
    if (!selected) { event.preventDefault(); return }
    const check = safeProposal(latest.current.plans, selected, 1, latest.current.allowAnchor)
    if (selectionHasAnchor(getPlan(plans, selected.planId), selected) && !latest.current.allowAnchor) {
      event.preventDefault(); onError?.(check.error); return
    }
  }} onDragStart={event => {
    const selected = event.operation.source?.data.selection as Selection
    base.current = clonePlans(latest.current.plans)
    latest.current.onSelect?.(selected)
    updateLive(safeProposal(base.current, selected, 0, latest.current.allowAnchor))
  }} onDragMove={(event, manager) => {
    const selected = event.operation.source?.data.selection as Selection | undefined
    if (!selected || !base.current) return
    // Drag-move events precede the library's position update. Read its modified
    // transform on the next frame, including snapping and auto-scroll movement.
    cancelAnimationFrame(dragFrame.current)
    dragFrame.current = requestAnimationFrame(() => {
      if (!base.current || !manager.dragOperation.status.dragging) return
      const weeks = Math.max(-104, Math.min(104, Math.round(manager.dragOperation.transform.x / pixelsPerWeek)))
      if (liveRef.current?.weeks === weeks) return
      updateLive(safeProposal(base.current, selected, weeks, latest.current.allowAnchor))
    })
  }} onDragEnd={event => {
    cancelAnimationFrame(dragFrame.current)
    const selected = event.operation.source?.data.selection as Selection | undefined
    const amount = Math.max(-104, Math.min(104, Math.round(event.operation.transform.x / pixelsPerWeek)))
    const candidate = selected && base.current ? safeProposal(base.current, selected, amount, latest.current.allowAnchor) : null
    base.current = null; updateLive(null)
    if (event.canceled || !candidate?.weeks) return
    if (candidate.error) latest.current.onError?.(candidate.error)
    else latest.current.onMove?.(candidate.selection, candidate.weeks)
  }}>
    {chart}
    {live ? <div className={`drag-readout${live.error ? ' invalid' : ''}`} role="status">{Math.abs(live.weeks)} weeks {live.weeks < 0 ? 'earlier' : 'later'}{live.error ? `: ${live.error}` : ' · Release to update the draft'}</div> : null}
  </DragDropProvider>
}

type CalendarItem = TimelineItemBase<number> & { planId: string; selection?: Selection }
const CALENDAR_KEYS = { groupIdKey: 'id', groupTitleKey: 'title', groupLabelKey: 'title', groupRightTitleKey: 'title', itemIdKey: 'id', itemTitleKey: 'title', itemDivTitleKey: 'title', itemGroupKey: 'group', itemTimeStartKey: 'start_time', itemTimeEndKey: 'end_time' }
const TIME_STEPS = { second: 1, minute: 1, hour: 1, day: 1, month: 1, year: 1 }
function CalendarChart({ plans, view, onView, selection, onSelect, onMove, onError, allowAnchor = false, rules = SAMPLE_RULES }: ChartProps) {
  const [dragging, setDragging] = useState<{ selection: Selection; weeks: number; error: string } | null>(null)
  const [dragSession, setDragSession] = useState(0)
  const isDragging = dragging !== null
  useEffect(() => {
    if (!isDragging) return
    const cancelDrag = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault(); event.stopImmediatePropagation()
      setDragging(null)
      // Remount the library's item interaction, leaving the draft untouched.
      setDragSession(previous => previous + 1)
    }
    document.addEventListener('keydown', cancelDrag, true)
    return () => document.removeEventListener('keydown', cancelDrag, true)
  }, [isDragging])
  const findings = useMemo(() => findClashes(plans, rules), [plans, rules])
  const groups: TimelineGroupBase[] = useMemo(() => plans.map(plan => ({ id: plan.id, title: plan.name, height: 88, stackItems: false })), [plans])
  const items: CalendarItem[] = useMemo(() => plans.flatMap(plan => {
    const start = Math.min(...plan.phases.map(p => p.s)), end = Math.max(...plan.phases.map(p => p.e))
    const background: CalendarItem = { id: `background:${plan.id}`, group: plan.id, title: plan.name, planId: plan.id,
      start_time: start, end_time: end, canMove: false, canResize: false, canChangeGroup: false, height: 76, className: 'calendar-background' }
    if (selection?.planId !== plan.id) return [background]
    const bounds = selectedBounds(plan, selection)
    return [background, { id: `selection:${plan.id}`, group: plan.id, title: `Move selection in ${plan.name}`, planId: plan.id,
      start_time: bounds.s, end_time: Math.max(bounds.e, bounds.s + WEEK / 4), canMove: !!onMove, canResize: false,
      canChangeGroup: false, height: 40, className: 'calendar-selection', selection }]
  }), [plans, selection, onMove])
  const itemRenderer: NonNullable<ComponentProps<typeof Timeline<CalendarItem, TimelineGroupBase>>['itemRenderer']> = ({ item, timelineContext, itemContext, getItemProps }) => {
    const plan = getPlan(plans, item.planId)
    const timelineState = timelineContext.getTimelineState()
    const pxPerMs = timelineState.canvasWidth / (timelineState.canvasTimeEnd - timelineState.canvasTimeStart)
    const shift = itemContext.dragging && itemContext.dragTime !== null ? itemContext.dragTime - item.start_time : 0
    const originalLeft = itemContext.dimensions.left - shift * pxPerMs
    const frame = { start: timelineState.canvasTimeStart + originalLeft / pxPerMs,
      end: timelineState.canvasTimeStart + (originalLeft + itemContext.dimensions.width) / pxPerMs }
    const { key: itemKey, ...itemProps } = getItemProps({ style: { background: 'transparent', color: '#17283d', border: 0, overflow: 'visible', boxSizing: 'border-box', zIndex: item.selection ? 87 : 80 } })
    return <div key={itemKey} {...itemProps} data-calendar-item={item.id}>
      {item.selection ? <>
        <div className="calendar-drag-label">⠿ Move selection{selectionHasAnchor(plan, item.selection) && !allowAnchor ? ' · Anchor locked' : ''}</div>
        <div className="calendar-selection-content"><PhaseContent plan={plan} frame={frame} clashes={[]} range={item.selection} /></div>
      </> : <PhaseContent plan={plan} frame={frame} clashes={findings}
        onPick={index => onSelect?.({ planId: plan.id, first: index, last: index })} />}
    </div>
  }
  return <div className="calendar-trial" data-library="react-calendar-timeline">
    <Timeline<CalendarItem, TimelineGroupBase> key={dragSession} groups={groups} items={items} keys={CALENDAR_KEYS}
      defaultTimeStart={INITIAL_VIEW.start} defaultTimeEnd={INITIAL_VIEW.end} visibleTimeStart={view.start} visibleTimeEnd={view.end}
      sidebarWidth={LABEL_WIDTH} rightSidebarWidth={0} lineHeight={88} itemHeightRatio={1} minZoom={4 * WEEK} maxZoom={20 * 52 * WEEK}
      timeSteps={TIME_STEPS} dragSnap={WEEK} stackItems={false} canMove canResize={false} canChangeGroup={false} traditionalZoom
      selected={selection ? [`selection:${selection.planId}`] : []} itemRenderer={itemRenderer}
      groupRenderer={({ group }) => { const plan = getPlan(plans, String(group.id)); return <div className="calendar-group"><button type="button" onClick={() => onSelect?.(defaultSelection(plan))}>{plan.name}</button><small>{plan.anchorName}: {formatDate(plan.anchor)}</small></div> }}
      moveResizeValidator={(_action, item, time) => {
        if (!items.find(candidate => candidate.id === item.id)?.selection) return item.start_time
        const weeks = Math.round((time - item.start_time) / WEEK)
        return item.start_time + Math.max(-104, Math.min(104, weeks)) * WEEK
      }}
      onItemSelect={id => { const item = items.find(i => i.id === id); if (item) onSelect?.(item.selection ?? defaultSelection(getPlan(plans, item.planId))) }}
      onTimeChange={(start, end, update) => { update(start, end); onView({ start, end }) }}
      onItemDrag={event => {
        if (event.eventType !== 'move') return
        const item = items.find(i => i.id === event.itemId)
        if (!item?.selection) return
        const weeks = Math.round((event.time - item.start_time) / WEEK)
        const next = safeProposal(plans, item.selection, weeks, allowAnchor)
        setDragging(previous => previous?.weeks === weeks && sameSelection(previous.selection, item.selection!) ? previous : { selection: item.selection!, weeks, error: next.error })
      }}
      onItemMove={(id, time) => {
        setDragging(null)
        const item = items.find(i => i.id === id)
        if (!item?.selection) return
        const weeks = Math.round((time - item.start_time) / WEEK)
        const result = safeProposal(plans, item.selection, weeks, allowAnchor)
        if (result.error) onError?.(result.error)
        else if (weeks) onMove?.(item.selection, weeks)
      }}
    />
    {dragging ? <div className={`drag-readout${dragging.error ? ' invalid' : ''}`} role="status">{Math.abs(dragging.weeks)} weeks {dragging.weeks < 0 ? 'earlier' : 'later'}{dragging.error ? `: ${dragging.error}` : ' · Release to update the draft'}</div> : null}
    <p className="calendar-navigation">Drag empty timeline space to pan. Shift + wheel pans horizontally; Ctrl + wheel zooms. Use the controls for exact dates and keyboard movement.</p>
  </div>
}

function Findings({ plans, before, rules = SAMPLE_RULES }: { plans: Plan[]; before?: Plan[]; rules?: OverlapRule[] }) {
  const current = countMessage(plans, rules), previous = before ? findClashes(before, rules) : []
  const keys = new Set(current.findings.map(f => f.key))
  const previousKeys = new Set(previous.map(f => f.key))
  const resolved = previous.filter(f => !keys.has(f.key))
  return <section className="findings-block" aria-label="Clash checks">
    <h3>Clash checks</h3><div className="check-counts"><span className="badge critical">{current.critical} critical {current.critical === 1 ? 'clash' : 'clashes'}</span><span className="badge warning">{current.warnings} {current.warnings === 1 ? 'warning' : 'warnings'}</span>{before ? <span className="badge resolved">{resolved.length} resolved</span> : null}</div>
    <p className="help">Across the full pipeline, including dates outside the viewing window.</p>
    {current.findings.length || resolved.length ? <ul className="findings-grid" role="list" aria-label="Clash findings">{[...current.findings, ...resolved].map(f => {
      const isResolved = !keys.has(f.key), status = isResolved ? 'Resolved' : before && !previousKeys.has(f.key) ? 'New' : before ? 'Remaining' : ''
      return <FindingCard key={f.key} finding={f} status={status} resolved={isResolved} headingLevel={4} />
    })}</ul> : null}
    {!current.findings.length && !resolved.length ? <p className="empty-check">No overlaps flagged by the Library rules.</p> : null}
  </section>
}
function ViewControls({ view, onView }: { view: View; onView: (value: View) => void }) {
  return <div className="view-controls"><label>Viewing window<select aria-label="Viewing window" value={Math.round((view.end - view.start) / DAY) > 200 ? '12' : '6'} onChange={e => onView({ start: view.start, end: addMonths(view.start, Number(e.target.value)) })}><option value="6">Six months</option><option value="12">One year</option></select></label><label>Window starts<input type="date" aria-label="Window starts" value={isoDate(view.start)} onChange={e => { const next = parseDate(e.target.value); if (Number.isFinite(next)) onView({ start: next, end: next + view.end - view.start }) }} /></label><button className="btn small" type="button" aria-label="Previous window" onClick={() => onView({ start: view.start - (view.end - view.start), end: view.start })}>←</button><button className="btn small" type="button" aria-label="Next window" onClick={() => onView({ start: view.end, end: view.end + view.end - view.start })}>→</button></div>
}
/** The existing timeline in inspection mode, with shared floating tooltips. */
export function ReadOnlyPipelineTimeline({ plans, rules, view, onView, showControls = true }: Pick<ChartProps, 'plans' | 'rules' | 'view' | 'onView'> & { showControls?: boolean }) {
  return <div className="readonly-pipeline ltpp-adjustment">
    {showControls ? <div className="board-toolbar"><ViewControls view={view} onView={onView} /></div> : null}
    {plans.length ? <DndChart plans={plans} rules={rules} view={view} onView={onView} sharedTooltips /> : <p className="board-help">No procurements in this version.</p>}
    <Legend />
  </div>
}
function DateReview({ before, after, headingId, headingRef }: { before: Plan[]; after: Plan[]; headingId: string; headingRef: RefObject<HTMLHeadingElement | null> }) {
  const changes = dateChanges(before, after)
  return <section className="date-review" aria-labelledby={headingId}><h3 id={headingId} ref={headingRef} tabIndex={-1}>Date and duration changes</h3><p className="help">{changes.length} changed entries, including phase durations, anchor dates and pipeline adjustment gaps. Movement shows the calendar weeks and days between the dates.</p>
    <div className="review-table-scroll" tabIndex={0} role="region" aria-label="Date and duration changes table"><table><thead><tr><th scope="col">Procurement / activity</th><th scope="col">Before</th><th scope="col">Proposed</th><th scope="col">Movement</th></tr></thead><tbody>{changes.map((change, index) => {
      const isGap = change.kind === 'gap'
      const beforeWeeks = isGap ? (change.beforeStart !== null && change.beforeEnd !== null ? (change.beforeEnd - change.beforeStart) / WEEK : undefined) : change.beforeWeeks
      const afterWeeks = isGap ? (change.afterStart !== null && change.afterEnd !== null ? (change.afterEnd - change.afterStart) / WEEK : undefined) : change.afterWeeks
      const weekType = isGap ? 'calendar' : 'active'
      return <tr key={`${change.planId}:${change.label}:${index}`} className={isGap ? 'gap-change' : ''}>
      <td><small>{change.planName}</small><strong>{change.label}</strong></td>
      <td>{change.beforeStart === null ? 'No gap' : `${formatDate(change.beforeStart)}${change.beforeEnd !== change.beforeStart && change.beforeEnd !== null ? ` to ${formatDate(change.beforeEnd)}` : ''}`}
        {beforeWeeks !== undefined ? <small>{beforeWeeks} {weekType} {beforeWeeks === 1 ? 'week' : 'weeks'}</small> : null}</td>
      <td>{change.afterStart === null ? 'Gap removed' : `${formatDate(change.afterStart)}${change.afterEnd !== change.afterStart && change.afterEnd !== null ? ` to ${formatDate(change.afterEnd)}` : ''}`}
        {afterWeeks !== undefined ? <small className={beforeWeeks !== afterWeeks ? 'duration-changed' : ''}>{afterWeeks} {weekType} {afterWeeks === 1 ? 'week' : 'weeks'}{beforeWeeks !== afterWeeks ? ' (changed)' : ''}</small> : null}</td>
      <td className="date-movement">{dateMovementSummary(change).map(line => <span key={line}>{line}</span>)}</td>
    </tr>})}</tbody></table></div>
  </section>
}
function PhaseDurationControls({ phase, onApply }: { phase: Phase; onApply: (weeks: number, keep: FixedPhaseBoundary) => string }) {
  const [duration, setDuration] = useState(String(phase.weeks))
  const [keep, setKeep] = useState<FixedPhaseBoundary>('start')
  const [error, setError] = useState('')
  return <form className="duration-form" onSubmit={event => {
    event.preventDefault()
    setError(onApply(Number(duration), keep))
  }} aria-labelledby="duration-title">
    <h4 id="duration-title">Change phase duration</h4>
    <label className="field-label">Duration in whole weeks<input type="number" aria-label="Duration in whole weeks" min={1} max={5200} step={1} required value={duration} onChange={event => { setDuration(event.target.value); setError('') }} /></label>
    <label className="field-label">Keep this date fixed<select value={keep} onChange={event => { setKeep(event.target.value as FixedPhaseBoundary); setError('') }}>
      <option value="start">Start date: {formatDate(phase.s)}</option><option value="finish">Finish date: {formatDate(finishDate(phase))}</option>
    </select></label>
    <p className="help">Shortening frees time {keep === 'start' ? 'after' : 'before'} this phase. Other activity and the anchor stay in place.</p>
    <button className="btn" type="submit" disabled={Number(duration) === phase.weeks} title={Number(duration) === phase.weeks ? 'Enter a different duration to apply a change.' : undefined}>Apply duration change</button>
    {error ? <p className="error-box" role="alert">{error}</p> : null}
  </form>
}
function PhaseActionTabs({ movement, duration, anchor, onActionChange }: {
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
function DiscardAdjustmentDialog({ returnFocus, onKeep, onDiscard }: {
  returnFocus: HTMLElement | null; onKeep: () => void; onDiscard: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null), keepButton = useRef<HTMLButtonElement>(null)
  const restoreFocus = useRef(true), id = useId()
  useLayoutEffect(() => {
    const element = dialog.current!
    element.showModal()
    keepButton.current?.focus({ preventScroll: true })
    return () => {
      element.close()
      if (restoreFocus.current && returnFocus?.isConnected) returnFocus.focus({ preventScroll: true })
    }
  }, [returnFocus])
  return <dialog ref={dialog} className="discard-adjustments-dialog" role="alertdialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
    onCancel={event => { event.preventDefault(); onKeep() }} onKeyDown={event => event.stopPropagation()}>
    <div className="discard-dialog-body"><h2 id={`${id}-title`}>Discard these adjustments?</h2><p id={`${id}-description`}>Your unsaved adjustments will be lost. The pipeline will stay as it was before this adjustment session.</p></div>
    <footer className="discard-dialog-actions"><button ref={keepButton} className="btn" type="button" onClick={onKeep}>Keep editing</button><button className="btn destructive" type="button" onClick={() => { restoreFocus.current = false; onDiscard() }}>Discard adjustments</button></footer>
  </dialog>
}
export function PipelineAdjustment({ connected }: { connected?: ConnectedAdjustment }) {
  const startingPlans = connected?.plans ?? SEED
  const rules = connected?.rules ?? SAMPLE_RULES
  const [trial, setTrial] = useState<Trial>('dnd')
  const [saved, setSaved] = useState<Record<Trial, Plan[]>>(() => ({ dnd: clonePlans(startingPlans), calendar: clonePlans(startingPlans) }))
  const [draft, setDraft] = useState<Plan[] | null>(() => connected ? clonePlans(startingPlans) : null)
  const [history, setHistory] = useState<Plan[][]>([])
  const [selection, setSelection] = useState<Selection>(() => defaultSelection(startingPlans[0]))
  const [mode, setMode] = useState<Mode>(() => startingPlans[0].phases.some(p => p.kind === 'phase') ? 'range' : 'whole')
  const [allowAnchor, setAllowAnchor] = useState(false)
  const [view, setView] = useState(connected?.initialView ?? INITIAL_VIEW)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [direction, setDirection] = useState(-1)
  const [weeks, setWeeks] = useState('4')
  const [stage, setStage] = useState<'edit' | 'review'>('edit')
  const [discardOpen, setDiscardOpen] = useState(false)
  const discardReturnFocus = useRef<HTMLElement | null>(null)
  const [overrideReason, setOverrideReason] = useState('')
  const [acceptedClashes, setAcceptedClashes] = useState<Record<Trial, string>>({ dnd: '', calendar: '' })
  const workspace = useRef<HTMLDivElement>(null), background = useRef<HTMLDivElement>(null), adjustButton = useRef<HTMLButtonElement>(null)
  const controlsPanel = useRef<HTMLElement>(null), reviewHeading = useRef<HTMLHeadingElement>(null)
  const pipelineVisual = useRef<HTMLDivElement>(null), dateReviewHeading = useRef<HTMLHeadingElement>(null)
  const reviewNavigationId = useId()
  const pipelineVisualId = `${reviewNavigationId}-pipeline`, dateReviewId = `${reviewNavigationId}-dates`
  function jumpToReviewSection(target: HTMLElement | null) {
    target?.focus({ preventScroll: true })
    target?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }
  const plans = draft ?? saved[trial], selectedPlan = getPlan(plans, selection.planId)
  const changes = draft ? dateChanges(saved[trial], draft) : []
  const counts = countMessage(plans, rules)
  const hasPhases = selectedPlan.phases.some(phase => phase.kind === 'phase')
  const isDirty = changes.length > 0
  const adjustmentOpen = draft !== null
  const anchorIncluded = selectionHasAnchor(selectedPlan, selection)
  useLayoutEffect(() => {
    if (stage !== 'review') return
    const panel = controlsPanel.current, heading = reviewHeading.current
    // Run after the review content replaces the editing controls.
    panel?.scrollTo({ top: 0, behavior: 'instant' })
    heading?.focus({ preventScroll: true })
    // The date table and timeline share the left pane. Start the review at the
    // table, keeping both sections available through its sticky navigation.
    // On small screens the controls follow in the same scrolling container.
    if (panel && getComputedStyle(panel).overflowY === 'visible') dateReviewHeading.current?.focus({ preventScroll: true })
    dateReviewHeading.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
  }, [stage])
  useEffect(() => {
    if (!adjustmentOpen) return
    const pages = connected?.background ?? (background.current ? [background.current] : [])
    const returnFocus = connected?.returnFocus ?? adjustButton.current
    const previousInert = pages.map(page => page.inert)
    pages.forEach(page => { page.inert = true })
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    workspace.current?.focus()
    return () => {
      pages.forEach((page, index) => { page.inert = previousInert[index] })
      document.body.style.overflow = previous
      returnFocus?.focus()
    }
  }, [adjustmentOpen, connected])
  useEffect(() => {
    connected?.dirty(isDirty)
    return () => connected?.dirty(false)
  }, [connected, isDirty])
  const select = useCallback((value: Selection) => {
    if (sameSelection(value, selection)) return
    setSelection(value); setError('')
    if (value.planId !== selection.planId) setAllowAnchor(false)
    if (!getPlan(plans, value.planId).phases.some(phase => phase.kind === 'phase')) setMode('whole')
    else if (value.first === value.last && getPlan(plans, value.planId).phases[value.first].kind === 'phase') setMode('phase')
    else setMode('range')
  }, [selection, plans])
  function changeProcurement(id: string) {
    const plan = getPlan(plans, id)
    const next = mode === 'whole' || !plan.phases.some(phase => phase.kind === 'phase') ? { planId: id, first: 0, last: plan.phases.length - 1 }
      : mode === 'phase' ? { planId: id, first: Math.max(0, plan.phases.findIndex(p => p.kind === 'phase')), last: Math.max(0, plan.phases.findIndex(p => p.kind === 'phase')) } : defaultSelection(plan)
    setSelection(next)
    if (!plan.phases.some(phase => phase.kind === 'phase')) setMode('whole')
    showSelection(next, plans)
    setAllowAnchor(false); setError('')
  }
  function changeMode(next: Mode) {
    setMode(next); setError('')
    const firstPhase = selectedPlan.phases[selection.first].kind === 'phase' ? selection.first : selectedPlan.phases.findIndex(p => p.kind === 'phase')
    setSelection(next === 'whole' ? { planId: selectedPlan.id, first: 0, last: selectedPlan.phases.length - 1 }
      : next === 'phase' ? { planId: selectedPlan.id, first: firstPhase, last: firstPhase } : defaultSelection(selectedPlan))
  }
  function showSelection(value: Selection, source: Plan[], keepStartVisible = false) {
    const bounds = selectedBounds(getPlan(source, value.planId), value)
    if (bounds.s >= view.end || bounds.e <= view.start || keepStartVisible && bounds.s < view.start) {
      const start = bounds.s - WEEK
      setView({ start, end: start + view.end - view.start })
    }
  }
  function applyMove(value: Selection, amount: number) {
    if (!draft || !amount) return
    const result = safeProposal(draft, value, amount, allowAnchor)
    if (result.error || !result.plans) { setError(result.error); return }
    setHistory(previous => [...previous, clonePlans(draft)])
    setDraft(result.plans); setSelection(value); setError('')
    showSelection(value, result.plans, true)
    setMessage(`Moved ${Math.abs(amount)} calendar ${Math.abs(amount) === 1 ? 'week' : 'weeks'} ${amount < 0 ? 'earlier' : 'later'}. Draft dates and clash checks updated.`)
  }
  function applyDuration(amount: number, keep: FixedPhaseBoundary) {
    if (!draft) return ''
    try {
      const phase = selectedPlan.phases[selection.first]
      const result = changePhaseDuration(draft, selection, amount, keep, saved[trial])
      if (phase.weeks === amount) return ''
      setHistory(previous => [...previous, clonePlans(draft)])
      setDraft(result); setError('')
      showSelection(selection, result, true)
      setMessage(`${phase.name}: duration changed from ${phase.weeks} to ${amount} active ${amount === 1 ? 'week' : 'weeks'}, keeping its ${keep} date fixed. Draft dates and clash checks updated.`)
      return ''
    } catch (error) {
      return error instanceof Error ? error.message : 'The duration could not be updated.'
    }
  }
  function openAdjustment() {
    setDraft(clonePlans(saved[trial])); setHistory([]); setSelection(defaultSelection(saved[trial][0])); setMode('range')
    setAllowAnchor(false); setStage('edit'); setDiscardOpen(false); setError(''); setMessage(''); setOverrideReason(''); setDirection(-1); setWeeks('4')
  }
  function closeAdjustment() { setDiscardOpen(false); setDraft(null); setHistory([]); setError(''); setStage('edit'); connected?.close() }
  function cancel(returnFocus?: HTMLElement) {
    if (!changes.length) { closeAdjustment(); return }
    discardReturnFocus.current = returnFocus ?? (document.activeElement instanceof HTMLElement ? document.activeElement : workspace.current)
    setDiscardOpen(true)
  }
  function saveTrial() {
    if (!draft) return
    if (counts.critical && !overrideReason.trim()) { setError('Record a reason for proceeding with the remaining critical clashes.'); return }
    if (connected) {
      try {
        const changedIds = new Set(changes.map(change => change.planId))
        connected.save(draft.filter(plan => changedIds.has(plan.id)), overrideReason)
        closeAdjustment()
      } catch (error) { setError(error instanceof Error ? error.message : 'The pipeline could not be saved.') }
      return
    }
    setSaved(previous => ({ ...previous, [trial]: clonePlans(draft) }))
    setAcceptedClashes(previous => ({ ...previous, [trial]: counts.critical ? overrideReason.trim() : '' }))
    closeAdjustment(); setMessage('Trial pipeline saved in this page only. The connected demo and current baseline have not changed. Reloading restores the sample.')
  }
  const movementControls = <form className="movement-form" onSubmit={event => { event.preventDefault(); const amount = Number(weeks); if (!Number.isInteger(amount) || amount < 1 || amount > 104) setError('Enter 1 to 104 whole weeks.'); else applyMove(selection, direction * amount) }}><h4>Move by an exact amount</h4><div className="movement-inputs"><select aria-label="Movement direction" value={direction} onChange={e => setDirection(Number(e.target.value))}><option value={-1}>Earlier</option><option value={1}>Later</option></select><input type="number" aria-label="Number of weeks" min={1} max={104} step={1} value={weeks} onChange={e => setWeeks(e.target.value)} /><span>weeks</span></div><button className="btn" type="submit">Apply movement</button></form>
  const anchorControls = <section className="anchor-box"><h4>{allowAnchor ? 'Anchor movement allowed' : 'Anchor locked'}</h4><p>{selectedPlan.anchorName}<strong>{formatDate(selectedPlan.anchor)}</strong></p><small>Plotted on Monday {formatDate(selectedPlan.planningAnchor)}.</small>{anchorIncluded ? <label className="anchor-permission"><input type="checkbox" checked={allowAnchor} onChange={e => { setAllowAnchor(e.target.checked); setError('') }} />Allow this procurement’s anchor date to move</label> : <small>The selected range leaves this anchor in place.</small>}</section>
  const chartProps: ChartProps = { plans, view, onView: setView, selection, allowAnchor, onSelect: select, onMove: applyMove, onError: setError, rules, sharedTooltips: !!connected }
  return <div className="ltpp-adjustment">
    <div ref={background} hidden={!!connected} aria-hidden={draft ? true : undefined}>
      <header className="app-header"><a className="app-brand" href="pipeline.html">LTPP<span>Long-term pipeline plan</span></a><nav aria-label="Main navigation"><a href="pipeline.html" aria-current="page">Pipeline</a><a href="templates-and-phase-library.html">Library</a><a href="how-it-works.html">How it works</a></nav><small>Isolated adjustment trial</small></header>
      <main className="page-main">
        <section className="trial-switch" aria-label="Choose the library trial"><div><strong>Compare adjustment libraries</strong><p>Both trials use the same sample schedules and scheduling rules.</p></div><div className="trial-tabs"><button type="button" aria-pressed={trial === 'dnd'} onClick={() => { setTrial('dnd'); setView(INITIAL_VIEW); setMessage('') }}>A · dnd-kit</button><button type="button" aria-pressed={trial === 'calendar'} onClick={() => { setTrial('calendar'); setView(INITIAL_VIEW); setMessage('') }}>B · React Calendar Timeline</button></div></section>
        <div className="page-heading"><div><h1>Your procurement pipeline</h1><p>Review the plan and try adjusting procurements on the timeline.</p></div><button type="button" className="btn primary" ref={adjustButton} onClick={openAdjustment}>Adjust pipeline</button></div>
        <p className="trial-note">Fictional data. Trial saves stay in memory and reset on reload. The connected demo’s saved pipeline is not read or changed.</p>
        <p className="library-note">{trial === 'dnd' ? 'Trial A: dnd-kit 0.5.3 supplies drag, snapping, keyboard controls and auto-scrolling around the existing timeline style.' : 'Trial B: React Calendar Timeline 0.30.0-beta.19 supplies the time axis, panning, zooming and item dragging.'}</p>
        {message ? <p className="notice" role="status">{message}</p> : null}
        {acceptedClashes[trial] ? <p className="notice">Critical clashes accepted in this trial: {acceptedClashes[trial]}</p> : null}
        <div className="pipeline-checks"><div><h2>Pipeline checks</h2><p>Shared sample rules across the whole pipeline.</p></div><div className="check-counts"><span className="badge critical">{counts.critical} critical {counts.critical === 1 ? 'clash' : 'clashes'}</span><span className="badge warning">{counts.warnings} {counts.warnings === 1 ? 'warning' : 'warnings'}</span></div></div>
        <section className="card"><div className="card-top"><h2>Pipeline timeline</h2><ViewControls view={view} onView={setView} /></div><DndChart plans={saved[trial]} view={view} onView={setView} /><Legend /></section>
        <div className="normal-findings card"><Findings plans={saved[trial]} /></div>
        <section className="card"><div className="card-top"><h2>Procurements (3)</h2><button className="btn small" type="button" onClick={() => { setSaved(previous => ({ ...previous, [trial]: clonePlans(SEED) })); setAcceptedClashes(previous => ({ ...previous, [trial]: '' })); setMessage('This trial has been reset to its fictional examples.'); setView(INITIAL_VIEW) }}>Reset this trial</button></div><div className="review-table-scroll"><table><thead><tr><th>Procurement</th><th>Planning start</th><th>Planning finish</th><th>Actual anchor date</th></tr></thead><tbody>{saved[trial].map(plan => <tr key={plan.id}><td><button className="text-button" onClick={openAdjustment}>{plan.name}</button></td><td>{formatDate(Math.min(...plan.phases.map(p => p.s)))}</td><td>{formatDate(Math.max(...plan.phases.map(finishDate)))}</td><td>{formatDate(plan.anchor)}</td></tr>)}</tbody></table></div></section>
      </main>
    </div>
    {draft ? <div className="workspace-veil" style={connected ? { zIndex: 10000 } : undefined}><div className="adjustment-workspace" ref={workspace} data-tooltip-container={connected ? '' : undefined} role="dialog" aria-modal={discardOpen ? undefined : true} aria-labelledby="adjust-title" tabIndex={-1}
      onKeyDown={event => {
        if (event.key === 'Escape' && !event.defaultPrevented && connected && workspace.current?.querySelector('.timeline-tooltip:not([data-pinned="true"])')) {
          event.preventDefault(); window.LTPPTooltips?.hide(); return
        }
        if (event.key === 'Escape' && !event.defaultPrevented && !document.querySelector('[data-dnd-dragging]')) { event.preventDefault(); if (stage !== 'edit') setStage('edit'); else cancel() }
        if (event.key !== 'Tab') return
        const nodes = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea,[tabindex="0"]')].filter(node => node.getClientRects().length)
        if (!nodes.length) return
        const first = nodes[0], last = nodes.at(-1)!
        if (event.shiftKey && (document.activeElement === first || document.activeElement === workspace.current)) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }}>
      <header className="workspace-head"><div><span className="workspace-eyebrow">{connected ? 'Pipeline adjustment' : trial === 'dnd' ? 'Trial A / dnd-kit' : 'Trial B / React Calendar Timeline'}</span><h2 id="adjust-title">Adjust pipeline</h2></div><span className="draft-badge">{changes.length ? 'Unsaved adjustments' : 'No changes yet'}</span><button className="btn icon-button" type="button" aria-label="Close adjustment mode" onClick={event => cancel(event.currentTarget)}>×</button></header>
      <div className="workspace-body"><div className="board-area">
        {stage === 'review' ? <nav className="review-navigation" aria-label="Review sections"><button type="button" aria-controls={pipelineVisualId} onClick={() => jumpToReviewSection(pipelineVisual.current)}>Pipeline visual</button><span aria-hidden="true">·</span><button type="button" aria-controls={dateReviewId} onClick={() => jumpToReviewSection(dateReviewHeading.current)}>Date and duration changes</button></nav> : null}
        <div className="board-toolbar" id={pipelineVisualId} ref={pipelineVisual} tabIndex={-1} role="region" aria-label="Pipeline visual"><p>{stage === 'review' ? 'Review the proposed pipeline. The date and duration changes table is below.' : 'Drag the blue Move selection handle to move activity. Select One phase to change its duration.'}</p><ViewControls view={view} onView={setView} /></div>
        <div className="board-chart">{trial === 'dnd' ? <DndChart {...chartProps} editable={stage === 'edit'} /> : <CalendarChart {...chartProps} onMove={stage === 'edit' ? applyMove : undefined} />}</div><Legend />
        <p className="board-help">Move activity or change a phase’s duration in whole weeks. Christmas pauses are recalculated. Use the controls for precise or keyboard-only adjustments.</p>
        {stage === 'review' ? <DateReview before={saved[trial]} after={draft} headingId={dateReviewId} headingRef={dateReviewHeading} /> : null}
      </div><aside className="controls-panel" ref={controlsPanel}>
{stage === 'review' ? <section className="review-stage"><h3 ref={reviewHeading} tabIndex={-1}>Review and save</h3><p>{new Set(changes.map(c => c.planId)).size} procurements have changed. The table shows changed dates, phase durations, anchors and adjustment gaps.</p><p className="info-box">{connected ? 'This applies adjustments to the open pipeline. Use Save on the Pipeline page to update the named pipeline. The current baseline stays unchanged.' : 'This saves the working pipeline within this trial only. It does not approve or replace a baseline.'}</p>
          {counts.critical ? <label className="field-label">Reason for proceeding with critical clashes<textarea value={overrideReason} onChange={e => { setOverrideReason(e.target.value); setError('') }} placeholder="Record why these remaining clashes are being accepted." rows={4} /><small>{connected ? 'This explanation is recorded with the saved adjustment.' : 'This explanation is kept with the trial session.'}</small></label> : null}
          <button className="btn" type="button" onClick={() => { setStage('edit'); setError('') }}>Back to adjusting</button>
        </section> : <>
          <h3>Choose what to adjust</h3><label className="field-label">Procurement<select value={selection.planId} onChange={e => changeProcurement(e.target.value)}>{draft.map(plan => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select></label>
          <fieldset className="mode-choice"><legend>Selection</legend>{([['whole', 'Whole procurement'], ['phase', 'One phase'], ['range', 'Phase range']] as const).map(([value, label]) => <label key={value}><input type="radio" name="selection-mode" checked={mode === value} disabled={value !== 'whole' && !hasPhases} onChange={() => changeMode(value)} />{label}</label>)}</fieldset>
          {mode !== 'whole' ? <div className="range-fields"><label className="field-label">{mode === 'phase' ? 'Phase' : 'From phase'}<select value={selection.first} onChange={e => { const first = Number(e.target.value); const next = { ...selection, first, last: mode === 'phase' ? first : Math.max(first, selection.last) }; setSelection(next); showSelection(next, plans); setError('') }}>{selectedPlan.phases.map((phase, index) => phase.kind === 'phase' ? <option value={index} key={phase.id}>{phase.name}</option> : null)}</select></label>{mode === 'range' ? <label className="field-label">Through to phase<select value={selection.last} onChange={e => { setSelection(previous => ({ ...previous, last: Number(e.target.value) })); setError('') }}>{selectedPlan.phases.map((phase, index) => phase.kind === 'phase' && index >= selection.first ? <option value={index} key={phase.id}>{phase.name}</option> : null)}</select></label> : null}</div> : null}
          <div className="selected-summary"><strong>Selected activity</strong><p>{selectedPlan.phases[selection.first].name}{selection.last !== selection.first ? ` through to ${selectedPlan.phases[selection.last].name}` : ''}</p><small>{formatDate(selectedBounds(selectedPlan, selection).s)} to {formatDate(finishDate(selectedPlan.phases[selection.last]))}</small></div>
          {mode === 'phase' ? <PhaseActionTabs key={`${selectedPlan.id}:${selection.first}`} movement={movementControls} anchor={anchorControls} onActionChange={() => setError('')}
            duration={<PhaseDurationControls key={`${selectedPlan.id}:${selection.first}:${selectedPlan.phases[selection.first].s}:${selectedPlan.phases[selection.first].e}:${selectedPlan.phases[selection.first].weeks}`} phase={selectedPlan.phases[selection.first]} onApply={applyDuration} />} /> : <>{anchorControls}{movementControls}</>}
        </>}
        {error ? <p className="error-box" role="alert">{error}</p> : null}
        {message && stage === 'edit' ? <p className="movement-status" role="status">{message}</p> : null}
        <Findings plans={draft} before={saved[trial]} rules={rules} />
      </aside></div>
      <footer className="workspace-footer"><button className="btn" type="button" onClick={event => cancel(event.currentTarget)}>Cancel adjustment</button><button className="btn" type="button" disabled={!history.length || stage !== 'edit'} onClick={() => { const previous = history.at(-1)!; setDraft(clonePlans(previous)); setHistory(items => items.slice(0, -1)); setError(''); setMessage('Last change undone. Dates, durations and clash checks refreshed.') }}>Undo last change</button><span>{changes.length ? `${changes.length} changed entries` : 'Make an adjustment to review and save.'}</span>{stage === 'review' ? <button className="btn primary" type="button" onClick={saveTrial}>{connected ? 'Confirm and save' : 'Confirm and save trial'}</button> : <button className="btn primary" type="button" disabled={!changes.length || stage !== 'edit'} title={!changes.length ? 'Move activity or change a phase duration before reviewing changes.' : undefined} onClick={() => { setStage('review'); setError(''); setOverrideReason('') }}>Review and save</button>}</footer>
    </div></div> : null}
    {discardOpen ? <DiscardAdjustmentDialog returnFocus={discardReturnFocus.current} onKeep={() => setDiscardOpen(false)} onDiscard={closeAdjustment} /> : null}
  </div>
}

const trialRoot = document.getElementById('root')
if (trialRoot) {
  const root = createRoot(trialRoot)
  root.render(<PipelineAdjustment />)
  if (import.meta.hot) import.meta.hot.dispose(() => root.unmount())
}
