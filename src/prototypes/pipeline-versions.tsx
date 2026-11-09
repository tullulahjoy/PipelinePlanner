import { createContext, lazy, Suspense, useContext, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { ComponentProps } from 'react'
import { createRoot } from 'react-dom/client'
import { WEEK, addMonths, clashDates, findClashes, finishDate, formatDate, monday, planGaps } from './pipeline-scheduling'
import type { Clash, Plan, OverlapRule } from './pipeline-scheduling'
import './pipeline-connected-types'
import type { BaselineJourneyTarget } from './pipeline-baseline-journey'
import { comparisonPair, comparisonMovementSummary, compareVersionAge, compareVersionFindings, compareVersionRules, compareVersionSchedules, findingDifferenceLabel, ruleDifferenceLabel, scheduleDifferenceLabel, ruleDescription, statusLabel } from './pipeline-versions'
import type { BaselineState, ComparisonValue, PipelineVersion, VersionChange } from './pipeline-versions'
import './pipeline-versions.css'
import '../../mockups/pipeline-context.css'
import { OpenPipelineButton } from './pipeline-open'
import { GeneralComparisonDetails } from './pipeline-comparison-details'

const Timeline = lazy(() => import('./pipeline-adjustment').then(module => ({ default: module.ReadOnlyPipelineTimeline })))
const BaselineJourneyModal = lazy(() => import('./pipeline-baseline-journey').then(module => ({ default: module.BaselineJourneyModal })))
function ReadOnlyPipelineTimeline(props: ComponentProps<typeof Timeline>) {
  return <Suspense fallback={<p className="version-empty" role="status">Loading saved timeline…</p>}><Timeline {...props} /></Suspense>
}
const VersionsContext = createContext<PipelineVersion[]>([])
const initialWorkflow: BaselineState = { currentId: 'v02', events: [] }
const BaselinesContext = createContext<{
  state: BaselineState; notice: { versionId: string; text: string } | null; complete: (version: PipelineVersion) => void
}>({ state: initialWorkflow, notice: null, complete: () => {} })
const viewLink = (version: PipelineVersion) => `#view=${encodeURIComponent(version.id)}`
const compareLink = (version: PipelineVersion, reference: PipelineVersion) => `#compare=${encodeURIComponent(reference.id)}&with=${encodeURIComponent(version.id)}`
const fullDate = (value: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' }).format(new Date(value))
const subscribe = (notify: () => void) => { window.addEventListener('hashchange', notify); return () => window.removeEventListener('hashchange', notify) }
const currentHash = () => window.location.hash
function comparisonReference(version: PipelineVersion, current: PipelineVersion, versions: PipelineVersion[]) {
  return version.id !== current.id ? current : versions.find(item => item.id === version.confirmation?.fromBaselineId) ?? versions.find(item => item.id !== current.id) ?? current
}
function Status({ version }: { version: PipelineVersion }) { return <span className={`version-status ${version.status}`}>{statusLabel[version.status]}</span> }
function Counts({ version }: { version: PipelineVersion }) {
  const findings = findClashes(version.plans, version.rules)
  return <div className="version-counts"><span>{version.plans.length} procurements</span><span className="critical-count">{findings.filter(finding => finding.severity === 'critical').length} critical clashes</span><span className="warning-count">{findings.filter(finding => finding.severity === 'warning').length} warnings</span></div>
}
function RecordDetails({ version }: { version: PipelineVersion }) {
  return <div className="version-record"><p>Last saved {fullDate(version.savedAt)} by <strong>{version.savedBy}</strong>.</p>
    {version.confirmation ? <><p>Confirmed as a baseline {fullDate(version.confirmation.at)} by <strong>{version.confirmation.by}</strong>.</p>{version.confirmation.rationale ? <p className="version-saving-reason"><strong>Rationale:</strong> {version.confirmation.rationale}</p> : null}</> : null}
  </div>
}
function Overview() {
  const versions = useContext(VersionsContext), { state } = useContext(BaselinesContext)
  const baseline = versions.find(version => version.id === state.currentId)!
  const [filter, setFilter] = useState('all')
  const filtered = versions.filter(version => filter === 'all' || version.status === filter)
  return <>
    <div className="version-summary-grid" style={{ gridTemplateColumns: '1fr' }}>
      <section className="version-summary approved" aria-labelledby="baseline-title"><span className="eyebrow">Live pipeline</span><h2 id="baseline-title">{baseline.name}</h2><Status version={baseline} />
        {baseline.confirmation ? <p>Confirmed {fullDate(baseline.confirmation.at)} by {baseline.confirmation.by}.</p> : null}
        <p className="help">This is the fixed plan used for day-to-day activity. Other saved pipelines can be edited without changing it.</p><a className="btn" href="pipeline.html?view=live">View live pipeline</a></section>
    </div>
    <section className="version-card" aria-labelledby="versions-title"><div className="version-card-head"><div><h2 id="versions-title">Saved pipelines</h2><p>Choose View to inspect saved contents, Edit to make changes, or Compare to compare pipelines. Editing a baseline requires saving under a new name. Your saved dates and phase lengths stay the same. Editing uses the latest Library colours and checks for overlapping work, so warnings and clashes may differ.</p></div>
      <label className="version-field">Show<select value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All pipelines</option><option value="saved">Saved pipelines</option><option value="current">Live pipeline</option><option value="previous">Previous baselines</option></select></label></div>
      <div className="version-table-scroll" tabIndex={0} role="region" aria-label="Saved pipelines table"><table className="versions-list"><caption className="sr-only">Saved pipelines, most recently saved first</caption><thead><tr><th scope="col">Pipeline</th><th scope="col">Status</th><th scope="col">Last saved</th><th scope="col">Actions</th></tr></thead><tbody>{filtered.map(version => <tr key={version.id}><th scope="row"><a href={viewLink(version)}>{version.name}</a><small>{version.note}</small></th><td><Status version={version} /></td><td>{fullDate(version.savedAt)}<small>{version.savedBy}</small></td><td><div className="version-actions"><a className="btn small" href={viewLink(version)}>View<span className="sr-only"> {version.name}</span></a><OpenPipelineButton version={version} small label="Edit" />{versions.length > 1 ? <a className="btn small" href={compareLink(version, comparisonReference(version, baseline, versions))}>Compare<span className="sr-only"> {version.name}</span></a> : null}</div></td></tr>)}</tbody></table></div>
      {!filtered.length ? <p className="version-empty" role="status">No pipelines match this filter.</p> : null}
    </section>
    <details className="version-explainer"><summary>Saved pipeline or baseline?</summary><dl><dt>Saved pipeline</dt><dd>A named pipeline you can view and edit. Save updates it after confirmation; Save as keeps a separate copy.</dd><dt>Current baseline · Live pipeline</dt><dd>The fixed plan people follow. Confirm another saved pipeline as a new baseline when you are ready to replace it.</dd><dt>Previous baseline</dt><dd>A fixed reference retained from an earlier point.</dd></dl></details>
  </>
}
function defaultView(plans: Plan[]) {
  const start = monday(Math.min(...plans.flatMap(plan => plan.phases.map(phase => phase.s))))
  return { start, end: addMonths(start, 12) }
}
function PhaseSchedules({ version }: { version: PipelineVersion }) {
  return <section className="version-card" aria-labelledby="schedule-title"><div className="version-card-head"><div><h2 id="schedule-title">Procurement schedules</h2><p>Open a procurement to inspect its recorded phase dates and anchor.</p></div></div>{version.plans.map(plan => <details className="version-schedule" key={plan.id}><summary>{plan.name}<span>{plan.phases.filter(phase => phase.kind === 'phase').length} phases</span></summary><div className="version-anchor"><strong>Actual anchor: {formatDate(plan.anchor)}</strong><p>{plan.anchorName}. Plotted on Monday {formatDate(plan.planningAnchor)} for weekly planning.</p></div><div className="version-table-scroll" tabIndex={0} role="region" aria-label="Procurement schedule table"><table><caption className="sr-only">{plan.name} schedule</caption><thead><tr><th scope="col">Phase or milestone</th><th scope="col">Start</th><th scope="col">Finish</th><th scope="col">Duration</th></tr></thead><tbody>{plan.phases.map(phase => <tr key={phase.id}><th scope="row">{phase.name}{phase.id === plan.anchorId ? <small>Anchor milestone</small> : null}</th><td>{formatDate(phase.s)}</td><td>{formatDate(finishDate(phase))}</td><td>{phase.kind === 'milestone' ? 'Milestone' : `${phase.weeks} active ${phase.weeks === 1 ? 'week' : 'weeks'}`}</td></tr>)}{planGaps(plan).map(gap => <tr key={gap.id} className="gap-change"><th scope="row">{gap.label}</th><td>{formatDate(gap.s)}</td><td>{formatDate(gap.e)}</td><td>{(gap.e - gap.s) / WEEK} calendar weeks</td></tr>)}</tbody></table></div></details>)}</section>
}

function VersionViewer({ version, autoAction }: { version: PipelineVersion; autoAction?: boolean }) {
  const versions = useContext(VersionsContext), { state, complete } = useContext(BaselinesContext)
  const baseline = versions.find(item => item.id === state.currentId)!
  const [view, setView] = useState(() => defaultView(version.plans))
  const [target, setTarget] = useState<BaselineJourneyTarget | null>(null)
  const timeline = useRef<HTMLElement>(null), actionButton = useRef<HTMLButtonElement>(null)
  const returnPosition = useRef(0), handledAction = useRef(false)
  const phases = version.plans.flatMap(plan => plan.phases), findings = findClashes(version.plans, version.rules)
  const critical = findings.filter(finding => finding.severity === 'critical').length, warnings = findings.length - critical
  function open() {
    returnPosition.current = window.scrollY
    if (timeline.current) window.LTPPTooltips?.closeWithin(timeline.current)
    timeline.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
    setTarget({ kind: 'version', id: version.id, expected: version })
  }
  function close() {
    setTarget(null)
    requestAnimationFrame(() => {
      window.scrollTo({ top: returnPosition.current, behavior: 'instant' })
      const destination = actionButton.current ?? timeline.current?.querySelector<HTMLElement>('h2')
      if (destination) { destination.tabIndex = destination instanceof HTMLButtonElement ? 0 : -1; destination.focus({ preventScroll: true }) }
    })
  }
  useEffect(() => {
    if (!autoAction || handledAction.current) return
    handledAction.current = true
    if (version.status === 'saved') open()
  }, [autoAction, version.id, version.status])
  return <>
    <div className="pipeline-layout">
    <section className="pipeline-context-panel" data-state="viewing" aria-labelledby="saved-pipeline-name">
      <div className="context-main"><div className="context-copy">
      <span className="context-label">Viewing saved pipeline</span><div className="context-name-row"><h2 id="saved-pipeline-name" className="context-panel-name">{version.name}</h2><p className="context-save-state">Read-only view</p><Status version={version} /></div>
      <p>{version.status === 'saved' ? 'Inspect these saved contents without changing them. Choose Edit this pipeline to make changes.' : version.status === 'current' ? 'This is the fixed current baseline and live pipeline. Changes must be saved under a new name.' : 'This previous baseline is fixed. Changes must be saved under a new name.'}</p>
      </div>
      <div className="context-actions"><OpenPipelineButton version={version} label="Edit this pipeline" /><a className="btn" href="pipeline.html?view=live">Return to live pipeline</a>{versions.length > 1 ? <a className="btn" href={compareLink(version, comparisonReference(version, baseline, versions))}>Compare with {version.id === baseline.id ? 'previous' : 'current'} baseline</a> : null}{version.status === 'saved' ? <button ref={actionButton} className="btn" type="button" onClick={open}>Confirm as new baseline</button> : null}</div>
      </div>
      <section className="context-checks" aria-labelledby="saved-checks-title"><div><h3 id="saved-checks-title">Pipeline checks</h3><p>Checks use the rules saved with this pipeline and cover its whole schedule.</p></div><div className="context-check-counts"><span className="context-badge critical">{critical} critical {critical === 1 ? 'clash' : 'clashes'}</span><span className="context-badge">{warnings} {warnings === 1 ? 'warning' : 'warnings'}</span><button className="context-text-action" type="button" onClick={() => { const rules = document.getElementById('saved-overlap-rules') as HTMLDetailsElement | null; if (rules) { rules.open = true; rules.querySelector('summary')?.focus(); rules.scrollIntoView({ block: 'start', behavior: 'instant' }) } }}>View overlap rules</button></div></section>
    </section>
    <div className="pipeline-content">
    <section ref={timeline} className="version-card" aria-labelledby="version-timeline-title"><div className="version-card-head"><div><h2 id="version-timeline-title">Pipeline timeline</h2><p>These are the dates, colours and overlap rules saved with this pipeline.</p></div><span className="readonly-label">Read-only</span></div><ReadOnlyPipelineTimeline plans={version.plans} rules={version.rules} view={view} onView={setView} /><p className="version-card-note">Scroll to inspect the full schedule. Hover over or focus a block for details. Tooltips can be pinned.</p></section>
    <section className="version-card" aria-labelledby="record-title"><div className="version-card-head"><h2 id="record-title">Saved details</h2></div><div className="version-card-content"><RecordDetails version={version} /><dl className="version-scope"><dt>Scope</dt><dd>{version.plans.length} {version.plans.length === 1 ? 'procurement' : 'procurements'}<br />{phases.length ? `${formatDate(Math.min(...phases.map(phase => phase.s)))} to ${formatDate(Math.max(...phases.map(finishDate)))}` : 'No scheduled dates'}</dd></dl><p className="version-saving-reason"><strong>Reason for saving:</strong> {version.note}</p><Counts version={version} /></div></section>
    <BaselineHistory version={version} /><PhaseSchedules version={version} />
    <details id="saved-overlap-rules" className="version-card version-rules-disclosure"><summary>View rules used to check overlaps</summary><p className="version-card-note">These saved rules define which overlaps should trigger a warning or critical clash.</p><ul className="version-rule-list">{version.rules.map(rule => <li key={rule.id}><span className={`finding-severity ${rule.severity}`}>{rule.severity === 'critical' ? 'Critical clash' : 'Warning'} trigger</span><span>{ruleDescription(rule, version)}{rule.reason ? <small>{rule.reason}</small> : null}</span></li>)}</ul></details>
    </div></div>
    {target ? <Suspense fallback={<p role="status">Opening baseline review…</p>}><BaselineJourneyModal target={target} onClose={close} onChanged={complete} /></Suspense> : null}
  </>
}
function Value({ value, other, showName = true }: { value: ComparisonValue | null; other: ComparisonValue | null; showName?: boolean }) {
  if (!value) return <span className="not-present">Not present</span>
  return <>{showName && value.name ? <strong>{value.name}</strong> : null}{value.start !== undefined ? <span>{formatDate(value.start)}{value.end !== undefined && value.end !== value.start ? ` to ${formatDate(value.end)}` : ''}</span> : null}{value.weeks !== undefined ? <small className={other && other.weeks !== value.weeks ? 'duration-changed' : ''}>{value.weeks} {value.weekType} {value.weeks === 1 ? 'week' : 'weeks'}{other && other.weeks !== value.weeks ? ' (different)' : ''}</small> : null}{value.note ? <small>{value.note}</small> : null}</>
}

type ComparisonLabels = { before: string; after: string }
function ChangesTable({ changes, before, after, labels, directional }: { changes: VersionChange[]; before: PipelineVersion; after: PipelineVersion; labels: ComparisonLabels; directional: boolean }) {
  const [onlyPlan, setOnlyPlan] = useState('all')
  const shown = changes.filter(change => onlyPlan === 'all' || change.planId === onlyPlan), changedPlans = new Map(changes.map(change => [change.planId, change.planName]))
  return <section className="version-card" id="version-date-changes" aria-labelledby="changes-title"><div className="version-card-head"><div><h2 id="changes-title">Schedule {directional ? 'changes' : 'differences'}</h2><p>{changes.length ? `${changes.length} differing entries across ${changedPlans.size} procurements. Matching entries are omitted.` : 'The schedules match.'}</p><p>Movement shows {labels.after} relative to {labels.before}, in calendar weeks and days.</p></div>{changedPlans.size > 1 ? <label className="version-field">Procurement<select value={onlyPlan} onChange={event => setOnlyPlan(event.target.value)}><option value="all">All differing procurements</option>{[...changedPlans].map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></label> : null}</div>
    {changes.length ? <div className="version-table-scroll" tabIndex={0} role="region" aria-label="Schedule comparison table"><table className="version-comparison-table schedule-comparison-table"><caption className="sr-only">Schedules in {before.name} and {after.name}</caption><thead><tr><th scope="col">Procurement / activity</th><th scope="col">{labels.before}</th><th scope="col">{labels.after}</th><th scope="col">Movement</th><th scope="col">{directional ? 'Change' : 'Difference'}</th></tr></thead><tbody>{shown.map(change => <tr key={change.id} className={change.kind === 'gap' ? 'gap-change' : ''}><th scope="row"><small>{change.planName}</small><strong>{change.label}</strong>{change.kind === 'gap' ? <small>Inactive pipeline adjustment gap</small> : null}</th><td><Value value={change.before} other={null} showName={change.kind !== 'phase' || change.before?.name !== change.after?.name} /></td><td className={directional ? 'proposed-value' : undefined}><Value value={change.after} other={change.before} showName={change.kind !== 'phase' || change.before?.name !== change.after?.name} /></td><td className="comparison-movement">{comparisonMovementSummary(change, before.name, after.name, directional).map(line => <span key={line}>{line}</span>)}</td><td><span className={`change-status ${directional ? change.status : 'changed'}`}>{directional ? change.status === 'added' ? 'Added' : change.status === 'removed' ? 'Removed' : 'Changed' : scheduleDifferenceLabel(change, before.name, after.name)}</span>{directional ? change.details.map(detail => <small key={detail}>{detail}</small>) : null}</td></tr>)}</tbody></table></div> : <p className="version-empty">The saved procurements, phase dates, durations, anchors and gaps are the same.</p>}
  </section>
}
function FindingValue({ finding }: { finding?: Clash }) {
  if (!finding) return <span className="not-present">Not flagged</span>
  return <div className="finding-value"><span className={`finding-severity ${finding.severity}`}>{finding.severity === 'critical' ? 'Critical clash' : 'Warning'}</span><span><strong>Overlap: </strong>{clashDates(finding)}</span><small>{finding.weeks} active {finding.weeks === 1 ? 'week' : 'weeks'} of overlap</small>{finding.reason ? <p className="finding-note">{finding.reason}</p> : null}</div>
}
function RuleValue({ rule, version }: { rule?: OverlapRule; version: PipelineVersion }) {
  if (!rule) return <span className="not-present">Not present</span>
  return <><strong>{ruleDescription(rule, version)}</strong><span>{rule.severity === 'critical' ? 'Critical clash' : 'Warning'} trigger</span>{rule.reason ? <small>{rule.reason}</small> : null}</>
}
function FindingsComparison({ before, after, labels, directional }: { before: PipelineVersion; after: PipelineVersion; labels: ComparisonLabels; directional: boolean }) {
  const all = compareVersionFindings(before, after), changes = all.filter(finding => finding.status !== 'Unchanged'), rules = compareVersionRules(before, after)
  const representative = (change: typeof changes[number]) => change.before?.severity === 'critical' ? change.before : (change.after ?? change.before)!
  const ordered = changes.toSorted((a, b) => Number(directional && a.status === 'Resolved') - Number(directional && b.status === 'Resolved') || Number(representative(b).severity === 'critical') - Number(representative(a).severity === 'critical'))
  return <section className="version-card" id="version-findings" aria-labelledby="finding-changes-title"><div className="version-card-head"><div><h2 id="finding-changes-title">Warnings and critical clashes</h2><p>Each pipeline is checked using its own saved rules, across its full timeline.</p></div></div><div className="finding-totals"><div><h3>{labels.before}</h3><Counts version={before} /></div><div><h3>{labels.after}</h3><Counts version={after} /></div></div>
    {ordered.length ? <div className="comparison-findings"><div className="findings-matrix" role="table" aria-label="Warnings and clashes comparison"><div className="findings-matrix-head" role="row"><div role="columnheader">Phase and procurement pair</div><div role="columnheader">{labels.before}</div><div role="columnheader">{labels.after}</div></div>{ordered.map(change => {
      const finding = representative(change)
      const samePhase = finding.phase === finding.secondPhaseName
      return <div key={change.key} role="row" className={`findings-matrix-row ${finding.severity}${directional && change.status === 'Resolved' ? ' resolved' : ''}`}>
        <div role="rowheader"><div className="matrix-labels"><span className={`finding-severity ${finding.severity}`}>{finding.severity === 'critical' ? 'Critical clash' : 'Warning'}</span><span className="change-status">{directional ? change.status : findingDifferenceLabel(change.before, change.after, before.name, after.name)}</span></div><h3>{samePhase ? 'Phase: ' : 'Phases: '}{finding.phase}{samePhase ? '' : ` / ${finding.secondPhaseName}`}</h3><ul className="matrix-participants"><li>{finding.firstPlanName}{!samePhase ? <small>Phase: {finding.phase}</small> : null}</li><li>{finding.secondPlanName}{!samePhase ? <small>Phase: {finding.secondPhaseName}</small> : null}</li></ul></div>
        {([{ label: labels.before, value: change.before }, { label: labels.after, value: change.after }]).map((side, index) => <div role="cell" key={index} className={side.value ? `matrix-value ${side.value.severity}` : 'matrix-absent'}><span className="matrix-mobile-label" aria-hidden="true">{side.label}</span>{side.value && (side.value.firstPlanName !== finding.firstPlanName || side.value.secondPlanName !== finding.secondPlanName || side.value.phase !== finding.phase || side.value.secondPhaseName !== finding.secondPhaseName) ? <p className="finding-note">{side.value.firstPlanName}: {side.value.phase}; {side.value.secondPlanName}: {side.value.secondPhaseName}</p> : null}<FindingValue finding={side.value} /></div>)}
      </div>
    })}</div></div> : <p className="version-empty">{directional ? 'No new, resolved or changed findings.' : 'The warnings and clashes match.'}</p>}
    {all.some(finding => finding.status === 'Unchanged') ? <p className="version-card-note">{all.filter(finding => finding.status === 'Unchanged').length} matching findings are not repeated here.</p> : null}
    <div className="version-rule-changes"><h3>Overlap rule {directional ? 'changes' : 'differences'}</h3>{rules.length ? <div className="version-table-scroll" tabIndex={0} role="region" aria-label="Overlap rules comparison table"><table className="version-comparison-table"><caption className="sr-only">Saved overlap rules</caption><thead><tr><th scope="col">{labels.before}</th><th scope="col">{labels.after}</th><th scope="col">{directional ? 'Change' : 'Difference'}</th></tr></thead><tbody>{rules.map(change => <tr key={change.id}><td><RuleValue rule={change.before} version={before} /></td><td><RuleValue rule={change.after} version={after} /></td><td><span className="change-status changed">{directional ? change.status : ruleDifferenceLabel(change.before, change.after, before.name, after.name)}</span></td></tr>)}</tbody></table></div> : <p>The saved overlap rules are the same.</p>}</div>
  </section>
}
function BaselineHistory({ version }: { version: PipelineVersion }) {
  const versions = useContext(VersionsContext), { state } = useContext(BaselinesContext)
  const events = state.events.filter(event => event.versionId === version.id || event.previousBaselineId === version.id).toReversed()
  if (!events.length) return null
  return <details className="version-card baseline-history"><summary>Baseline history ({events.length} {events.length === 1 ? 'record' : 'records'})</summary><ol>{events.map(event => {
    const target = versions.find(item => item.id === event.versionId), previous = versions.find(item => item.id === event.previousBaselineId)
    return <li key={event.id}><h3>{event.versionId !== version.id ? `Replaced by ${target?.name ?? 'a new baseline'}` : 'Confirmed as the baseline and live pipeline'}</h3><p>{fullDate(event.at)} by <strong>{event.by}</strong>.</p>{event.rationale ? <p className="version-saving-reason">{event.rationale}</p> : null}{target && previous ? <a href={compareLink(target, previous)}>Compare these baselines</a> : null}</li>
  })}</ol></details>
}
export function Comparison({ before, after, locked = false, baselineReview = false }: { before: PipelineVersion; after: PipelineVersion; locked?: boolean; baselineReview?: boolean }) {
  const versions = useContext(VersionsContext).toSorted((first, second) => first.name.localeCompare(second.name))
  const [view, setView] = useState(() => defaultView([...before.plans, ...after.plans]))
  const changes = compareVersionSchedules(before, after), labels = baselineReview ? { before: 'Current baseline', after: 'New baseline' } : { before: before.name, after: after.name }
  function chooseFirst(id: string) {
    const second = id === after.id ? before.id : after.id
    window.location.hash = `compare=${encodeURIComponent(id)}&with=${encodeURIComponent(second)}`
  }
  function jump(id: string) {
    const section = document.getElementById(id), heading = section?.querySelector<HTMLElement>('summary, h2')
    if (!section || !heading) return
    if (section instanceof HTMLDetailsElement) section.open = true
    if (heading.tagName !== 'SUMMARY') heading.tabIndex = -1
    heading.focus({ preventScroll: true })
    const body = section.closest<HTMLElement>('.baseline-journey-body')
    if (body) body.scrollTo({ top: body.scrollTop + section.getBoundingClientRect().top - body.getBoundingClientRect().top - (body.querySelector('.version-review-nav')?.getBoundingClientRect().height ?? 0) - 12, behavior: 'instant' })
    else heading.scrollIntoView({ block: 'start', behavior: 'instant' })
  }
  return <>
    {locked ? <div className="comparison-choices baseline-locked-versions"><div><span>{labels.before}</span><strong>{before.name}</strong></div><div><span>{labels.after}</span><strong>{after.name}</strong></div></div> : <section className="comparison-choices" aria-label="Choose pipelines to compare"><label className="version-field">Pipeline<select value={before.id} onChange={event => chooseFirst(event.target.value)}>{versions.map(version => <option value={version.id} key={version.id}>{version.name}</option>)}</select></label><label className="version-field">Compare with<select value={after.id} onChange={event => { window.location.hash = `compare=${encodeURIComponent(before.id)}&with=${encodeURIComponent(event.target.value)}` }}>{versions.filter(version => version.id !== before.id).map(version => <option value={version.id} key={version.id}>{version.name}</option>)}</select></label></section>}
    <p className="comparison-scope">{baselineReview ? 'Changes show what will be added, removed or changed when this pipeline replaces the current baseline.' : 'Compare saved contents. Each pipeline uses the colours and overlap rules saved with it.'}</p>
    <nav className="version-review-nav" aria-label="Comparison sections"><button type="button" onClick={() => jump('version-timelines')}>Pipeline visuals</button><button type="button" onClick={() => jump('version-date-changes')}>Schedule {baselineReview ? `changes (${changes.length})` : 'differences'}</button><button type="button" onClick={() => jump('version-findings')}>Warnings and clashes</button>{!baselineReview ? <button type="button" onClick={() => jump('version-rule-differences')}>Clash-checking rules</button> : null}</nav>
    {baselineReview ? <><ChangesTable changes={changes} before={before} after={after} labels={labels} directional /><FindingsComparison before={before} after={after} labels={labels} directional /></> : null}
    <section id="version-timelines" aria-labelledby="comparison-timelines-title"><h2 id="comparison-timelines-title" className="comparison-section-title">Pipeline visuals</h2><p className="help">Both timelines use the same viewing window. Scrolling either timeline updates both.</p>{[before, after].map((version, index) => <section className="version-card comparison-timeline" key={`${index}:${version.id}`} aria-label={`Pipeline timeline: ${version.name}`}><div className="version-card-head"><div>{baselineReview ? <span className="eyebrow">{index === 0 ? labels.before : labels.after}</span> : null}<h3>{version.name}</h3></div><Status version={version} /></div><ReadOnlyPipelineTimeline plans={version.plans} rules={version.rules} view={view} onView={setView} showControls={index === 0} /></section>)}</section>
    {!baselineReview ? <GeneralComparisonDetails key={`${before.id}:${after.id}`} before={before} after={after} /> : null}
  </>
}
function VersionJourney({ hash }: { hash: string }) {
  const versions = useContext(VersionsContext), { notice } = useContext(BaselinesContext), params = new URLSearchParams(hash.slice(1))
  const id = params.get('view') ?? params.get('confirm'), version = versions.find(item => item.id === id), autoAction = params.has('confirm')
  const pair = comparisonPair(versions, params.get('compare') ?? '', params.get('with') ?? '')
  const heading = useRef<HTMLHeadingElement>(null)
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    if (hash) heading.current?.focus({ preventScroll: true })
  }, [hash])
  return <main className="versions-main">
    {version || pair ? <a className="version-back" href="#">Back to Saved Pipelines</a> : null}
    <div className="version-heading-row"><div className="version-page-heading"><span className="eyebrow">{version ? 'Viewing saved contents' : pair ? 'Review differences' : 'Your pipelines'}</span><h1 ref={heading} tabIndex={-1}>{version ? 'Viewing saved pipeline' : pair ? 'Compare pipelines' : 'Saved Pipelines'}</h1><p>{version ? 'View the saved schedule and details, or choose Edit this pipeline to make changes.' : pair ? 'See which contents are shared and which differ.' : 'View, edit and compare saved pipelines, and find the live plan.'}</p></div></div>
    <p className="version-prototype-note">Pipelines and baseline history are saved in this browser using fictional editor details.</p>
    {notice && notice.versionId === version?.id ? <p className="baseline-success" role="status">{notice.text}</p> : null}
    {version ? <VersionViewer key={version.id} version={version} autoAction={autoAction} /> : pair ? <Comparison before={pair.before} after={pair.after} /> : <Overview />}
  </main>
}
function App() {
  const hash = useSyncExternalStore(subscribe, currentHash), [records, setRecords] = useState(loadVersions), [notice, setNotice] = useState<{ versionId: string; text: string } | null>(null)
  useEffect(() => {
    const refresh = (event: StorageEvent) => { if (event.key === 'ltpp-connected-mockups-v1' || event.key === null) setRecords(loadVersions()) }
    const onReturn = () => setRecords(loadVersions())
    window.addEventListener('storage', refresh); window.addEventListener('pageshow', onReturn); document.addEventListener('ltpp:pipeline-updated', onReturn)
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener('pageshow', onReturn); document.removeEventListener('ltpp:pipeline-updated', onReturn) }
  }, [])
  return <VersionsContext value={records.versions}><BaselinesContext value={{ state: records.workflow, notice, complete(version) {
    setRecords(loadVersions()); setNotice({ versionId: version.id, text: `${version.name} is now the current baseline and live pipeline. The previous baseline and other saved pipelines are retained.` })
  } }}>{records.error ? <main className="versions-main"><p className="version-loading-error" role="alert">{records.error}</p></main> : <VersionJourney key={hash} hash={hash} />}</BaselinesContext></VersionsContext>
}
function loadVersions() {
  try {
    const stored = window.LTPPDemo.versionRecords()
    if (!stored.versions.some(version => version.id === stored.baseline.currentId && version.status === 'current')) throw new Error('The current baseline could not be loaded. Reload this page.')
    return { versions: stored.versions.toSorted((first, second) => compareVersionAge(second, first)), workflow: stored.baseline, error: '' }
  } catch (error) { return { versions: [] as PipelineVersion[], workflow: initialWorkflow, error: error instanceof Error ? error.message : 'Saved pipelines could not be loaded.' } }
}
const mount = document.getElementById('versions-root')
if (mount) {
  const root = createRoot(mount)
  root.render(<App />)
  if (import.meta.hot) import.meta.hot.dispose(() => root.unmount())
}
