import { useEffect, useMemo, useState } from 'react'
import { useRevalidator } from 'react-router'
import type { SavedPipeline } from '../../data/schemas.ts'
import { useWorkspace } from '../../app/workspace-context.ts'
import { comparePipelineFindings, projectComparisons } from '../../domain/comparison.ts'
import { Dialog } from '../../ui/dialog.tsx'
import { Timeline } from '../../ui/timeline.tsx'
import type { TimelineWindow } from '../../ui/timeline.tsx'
import { closeTimelineDetails } from '../../ui/timeline-details.ts'
import { FindingCounts } from '../../ui/findings.tsx'
import { ScheduleDifferences } from './comparison-schedules.tsx'
import { ComparisonFindings, FindingTotals } from './comparison-findings.tsx'
import './comparison.css'

type Props = {
  records: SavedPipeline[]; firstId: string; secondId: string
  onChoose: (first: string, second: string) => void; onClose: () => void
}

export function ComparisonModal({ records, firstId, secondId, onChoose, onClose }: Props) {
  const workspace = useWorkspace()
  const revalidator = useRevalidator()
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') void revalidator.revalidate() }
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [revalidator])
  useEffect(() => closeTimelineDetails, [])
  const first = records.find(record => record.id === firstId)
  const second = records.find(record => record.id === secondId)
  function choose(a: string, b: string) { closeTimelineDetails(); onChoose(a, b) }
  function close() { closeTimelineDetails(); onClose() }
  return <Dialog title="Compare pipeline plans" wide focusTitle className="flow-dialog comparison-modal" onClose={close}
    footer={<button className="button" onClick={close}>Close</button>}>
    <div className="comparison-selectors" aria-label="Choose pipeline plans to compare">
      <label className="field">Pipeline<select value={first?.id ?? ''} onChange={event => choose(event.target.value, event.target.value === secondId ? firstId : secondId)}>
        {!first && <option value="">Choose a saved pipeline plan</option>}
        {records.map(record => <option key={record.id} value={record.id}>{record.name}</option>)}
      </select></label>
      <label className="field">Compare with<select value={second?.id !== first?.id ? second?.id ?? '' : ''} onChange={event => choose(firstId, event.target.value)}>
        {(!second || firstId === secondId) && <option value="">Choose another saved pipeline plan</option>}
        {records.filter(record => record.id !== firstId).map(record => <option key={record.id} value={record.id}>{record.name}</option>)}
      </select></label>
    </div>
    <div className="comparison-scope">
      <p>Compare saved contents. Both pipeline plans use the current workspace clash-checking rules.</p>
      <button className="button" disabled={revalidator.state !== 'idle'} onClick={() => { closeTimelineDetails(); void revalidator.revalidate() }}>Refresh comparison</button>
    </div>
    {revalidator.state !== 'idle' && <p role="status">Refreshing comparison...</p>}
    {first && second && first.id !== second.id
      ? <Comparison key={`${first.id}:${second.id}`} first={first} second={second} rules={workspace.library.rules} />
      : <p className="notice" role="status">{records.length < 2 ? 'Save at least two pipeline plans to compare them.' : 'Choose two different saved pipeline plans to compare. A selected plan may no longer be available in this workspace.'}</p>}
  </Dialog>
}

function Comparison({ first, second, rules }: { first: SavedPipeline; second: SavedPipeline; rules: ReturnType<typeof useWorkspace>['library']['rules'] }) {
  const model = useMemo(() => {
    const findings = comparePipelineFindings(first, second, rules)
    return { procurements: projectComparisons(first, second), findings,
      firstFindings: findings.flatMap(row => row.before ? [row.before] : []),
      secondFindings: findings.flatMap(row => row.after ? [row.after] : []) }
  }, [first, second, rules])
  const findingsDiffer = model.findings.some(row => row.status !== 'Unchanged')
  return <div className="comparison-content">
    <section className="comparison-overview" aria-label="Comparison summary">
      <p>{model.procurements.length ? `Schedule changes in ${model.procurements.length} ${model.procurements.length === 1 ? 'procurement' : 'procurements'}` : 'Schedules match'} · {findingsDiffer ? 'Warnings and critical clashes differ between pipelines' : 'Warnings and critical clashes match'}</p>
      <div className="comparison-totals">{[first, second].map((record, index) => <div key={record.id}>
        <strong>{record.name}</strong>
        <small>Last saved {new Date(record.savedAt).toLocaleString('en-GB')}</small>
        <FindingCounts findings={index === 0 ? model.firstFindings : model.secondFindings} />
      </div>)}</div>
    </section>
    <ScheduleDifferences first={first} second={second} procurements={model.procurements} />
    <ComparisonTimelines first={first} second={second} rules={rules} />
    <details className="comparison-section">
      <summary><h3>Warnings and critical clashes</h3><span className="comparison-description">Expand to compare affected procurements, overlap dates and durations.</span>
        <div className="comparison-totals"><FindingTotals name={first.name} findings={model.firstFindings} /><FindingTotals name={second.name} findings={model.secondFindings} /></div>
      </summary>
      <ComparisonFindings first={first} second={second} rows={model.findings} hasRules={rules.length > 0} />
    </details>
  </div>
}

function ComparisonTimelines({ first, second, rules }: { first: SavedPipeline; second: SavedPipeline; rules: ReturnType<typeof useWorkspace>['library']['rules'] }) {
  const phases = [...first.plans, ...second.plans].flatMap(plan => plan.phases)
  const extent = { first: Math.min(...phases.map(phase => phase.s)), last: Math.max(...phases.map(phase => phase.e)) }
  const [window, setWindow] = useState<TimelineWindow>({ start: extent.first, months: 12 })
  const [open, setOpen] = useState(false)
  return <details className="comparison-section" onToggle={event => { setOpen(event.currentTarget.open); closeTimelineDetails() }}>
    <summary><h3>Timelines</h3><span className="comparison-description">Both timelines use the same viewing window. Scrolling either timeline updates both.</span></summary>
    {open && <div className="comparison-timelines" onScrollCapture={event => {
      const target = event.target
      if (target instanceof HTMLElement && target.classList.contains('timeline-scroll')) {
        event.currentTarget.querySelectorAll<HTMLElement>('.timeline-scroll').forEach(other => {
          if (other !== target && Math.abs(other.scrollLeft - target.scrollLeft) > 1) other.scrollLeft = target.scrollLeft
        })
      }
    }}>{[first, second].map((record, index) => <section className="comparison-chart" key={record.id} aria-label={`Pipeline timeline: ${record.name}`}>
      <h4>{record.name}</h4>
      <Timeline plans={record.plans} rules={rules} extent={extent} windowState={window} onWindowChange={setWindow} hideControls={index === 1} hideFooter={index === 0} />
    </section>)}</div>}
  </details>
}
