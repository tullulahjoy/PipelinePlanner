import { lazy, Suspense, useId, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLoaderData, useLocation, useNavigate, useSearchParams } from 'react-router'
import type { Project, SavedPipeline } from '../../data/schemas.ts'
import { usePipelineSession, useWorkspace } from '../../app/workspace-context.ts'
import { findClashes, finishDate } from '../../domain/scheduling.ts'
import { formatDate } from '../../domain/calendar.ts'
import { ProjectEditor } from '../projects/project-editor.tsx'
import { ProcurementRecovery } from '../projects/procurement-recovery.tsx'
import type { ProcurementDraft } from '../projects/procurement-draft.ts'
import { FindingCounts, Findings } from '../../ui/findings.tsx'
import { Timeline } from '../../ui/timeline.tsx'
import type { TimelineWindow } from '../../ui/timeline.tsx'
import { ProcurementDetails, ProcurementLink } from '../../ui/procurement-details.tsx'
import { closeTimelineDetails } from '../../ui/timeline-details.ts'
import { ExamplePipeline } from './example-pipeline.tsx'
import { PipelineWelcome } from './pipeline-welcome.tsx'
import { LibraryImpact } from '../library/library-impact.tsx'
import { Dialog } from '../../ui/dialog.tsx'
import { SavedScope } from '../../ui/saved-scope.tsx'
import { editPlanPath } from './pipeline-paths.ts'
import './pipeline.css'
import '../../ui/pipeline-modal.css'
const AdjustmentDialog = lazy(() => import('./adjustment-dialog.tsx').then(module => ({ default: module.AdjustmentDialog })))

export function PipelineRoute() {
  const record = useLoaderData<SavedPipeline | null>()
  const [query] = useSearchParams()
  const workspace = useWorkspace()
  const editing = query.get('edit') === '1'
  const editOpener = useRef<string | null>(null)
  const background = useRef<HTMLDivElement>(null), wasEditing = useRef(editing)
  useLayoutEffect(() => {
    const closed = wasEditing.current && !editing
    wasEditing.current = editing
    if (!closed) return
    const frame = requestAnimationFrame(() => { const target = [...background.current?.querySelectorAll<HTMLAnchorElement>('a') ?? []].find(link => link.getAttribute('href') === editOpener.current) ?? background.current?.querySelector<HTMLElement>('.context-actions a, .pipeline-getting-started button'); target?.focus() })
    return () => cancelAnimationFrame(frame)
  }, [editing])
  return <ProcurementRecovery key={`${workspace.id}:${record?.id ?? 'new'}:${editing}`} workspaceId={workspace.id} liveId={workspace.currentBaselineId}>{recovery => <>
    <div ref={background} onClickCapture={event => { if (event.target instanceof Element) { const link = event.target.closest<HTMLAnchorElement>('a[href*="edit=1"]'); if (link) editOpener.current = link.getAttribute('href') } }} inert={editing} aria-hidden={editing || undefined}><Pipeline key={record?.id ?? 'new'} record={record} editing={false} adding={false} updates={false} selected={editing ? null : query.get('procurement')} recovery={null} suppressHelp={editing} /></div>
    {editing && <PipelineModal record={record} recovery={recovery} live />}
  </>}</ProcurementRecovery>
}

export function SavedPipelineModal({ record }: { record: SavedPipeline }) {
  const workspace = useWorkspace(), [query] = useSearchParams()
  return <ProcurementRecovery key={`${record.id}:${query.get('edit')}`} workspaceId={workspace.id} liveId={workspace.currentBaselineId}>{recovery => <PipelineModal record={record} recovery={recovery} />}</ProcurementRecovery>
}

function PipelineModal({ record, recovery, live = false }: { record: SavedPipeline | null; recovery: ProcurementDraft | null; live?: boolean }) {
  const workspace = useWorkspace(), navigate = useNavigate()
  const [query] = useSearchParams()
  const { exitEditing } = usePipelineSession()
  const editing = query.get('edit') === '1'
  return <Dialog key={editing ? 'edit' : 'view'} title={editing ? live ? 'Editing live pipeline plan' : 'Editing pipeline plan' : 'Viewing saved pipeline plan'} description={editing ? undefined : 'Inspect these saved contents without changing them. Choose Edit this pipeline plan to make changes.'} wide focusTitle className={`flow-dialog pipeline-modal ${live ? 'live-pipeline-modal' : 'saved-pipeline-modal'}`} onClose={() => { closeTimelineDetails(); if (editing) exitEditing(); else void navigate(`/workspaces/${workspace.id}/saved-pipelines`) }}>
    <Pipeline key={`${record?.id ?? 'new'}:${editing}:${recovery?.id ?? ''}`} record={record} editing={editing} adding={query.get('add') === '1'} updates={query.get('updates') === '1'} selected={query.get('procurement')} recovery={recovery} modal />
  </Dialog>
}

function Pipeline({ record, editing, adding, updates, selected, recovery, modal = false, suppressHelp = false }: { record: SavedPipeline | null; editing: boolean; adding: boolean; updates: boolean; selected: string | null; recovery: ProcurementDraft | null; modal?: boolean; suppressHelp?: boolean }) {
  const workspace = useWorkspace()
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useSearchParams()
  const { working, setWorking, dirty, save, exitEditing, requestMakeLive } = usePipelineSession()
  const matches = Boolean(working && (working.saved?.id ?? null) === (record?.id ?? null))
  const restored = useRef(false)
  useLayoutEffect(() => {
    if (!editing || restored.current) return
    restored.current = true
    if (recovery) setWorking(recovery.context)
    else if (!matches) setWorking({ saved: record, plans: structuredClone(record?.plans ?? []), acknowledgements: structuredClone(record?.acknowledgements ?? []) })
  }, [editing, matches, record, recovery, setWorking])
  const [editor, setEditor] = useState<{ project?: Project; recovery?: ProcurementDraft } | null>(() => recovery ? { project: recovery.original, recovery } : editing && (selected || adding) ? { project: selected ? (matches ? working?.plans : record?.plans)?.find(plan => plan.id === selected) : undefined } : null)
  const [inspecting, setInspecting] = useState<Project | null>(() => !editing ? record?.plans.find(plan => plan.id === selected) ?? null : null)
  const menu = useRef<HTMLDivElement>(null)
  const page = useRef<HTMLElement>(null)
  const saveButton = useRef<HTMLButtonElement>(null)
  const menuId = useId()
  const findingsId = `${menuId}-findings`
  const procurementsId = `${menuId}-procurements`
  const [saveExpanded, setSaveExpanded] = useState(false)
  const [adjusting, setAdjusting] = useState(false)
  const [timelineWindow, setTimelineWindow] = useState<TimelineWindow>(() => {
    const dates = (matches ? working!.plans : record?.plans ?? []).flatMap(plan => plan.phases.map(phase => phase.s))
    return { start: dates.length ? Math.min(...dates) : Date.now(), months: 12 }
  })
  const base = `/workspaces/${workspace.id}`
  if (editing && (!matches || !working)) return <p role="status">Loading pipeline plan…</p>
  const saved = editing ? working!.saved : record
  const plans = editing ? working!.plans : record?.plans ?? []
  const findings = findClashes(plans, workspace.library.rules)
  const getHref = (id: string) => `${saved && saved.id !== workspace.currentBaselineId ? `${base}/saved-pipelines/${saved.id}` : `${base}/pipeline`}?${editing ? 'edit=1&' : ''}procurement=${id}`
  function select(id: string) {
    closeTimelineDetails()
    const project = plans.find(plan => plan.id === id)
    if (editing) setEditor({ project })
    else setInspecting(project ?? null)
  }
  function openSave(mode: 'save' | 'saveAs') { menu.current?.hidePopover(); saveButton.current?.focus(); closeTimelineDetails(); save(mode) }
  function returnToPipeline() {
    setEditor(null)
    requestAnimationFrame(() => { (modal ? page.current : document.getElementById('main-content'))?.focus(); const surface = page.current?.closest('dialog')?.querySelector('.dialog-content'); if (surface) surface.scrollTo({ top: 0 }); else window.scrollTo({ top: 0, behavior: 'instant' }) })
  }
  const live = !editing && Boolean(saved && saved.id === workspace.currentBaselineId) && location.pathname === `${base}/pipeline`
  const PlanHeading = modal ? 'h2' : 'h1'
  const contextDescription = live ? 'The current plan for day-to-day activity.' : editing ? 'Save changes to this plan, or use Save as to keep a separate alternative.' : null

  if (editor && editing) return <ProjectEditor workspace={workspace} original={editor.project} recovery={editor.recovery ?? null} draftContext={working!} savedReference={working!.saved?.plans.find(plan => plan.id === editor.project?.id)} plans={plans} acknowledgements={working!.acknowledgements} onCancel={returnToPipeline} onApply={(project, accepted) => {
    if (!plans.length) setTimelineWindow({ start: Math.min(...project.phases.map(phase => phase.s)), months: 12 })
    setWorking(previous => previous && ({ ...previous, plans: previous.plans.some(item => item.id === project.id) ? previous.plans.map(item => item.id === project.id ? project : item) : [...previous.plans, project], acknowledgements: accepted }))
    returnToPipeline()
  }} />

  return <article className="pipeline-page" ref={page} tabIndex={-1}>
    {!modal && !suppressHelp && !workspace.currentBaselineId && <div className="page-heading"><PipelineWelcome key={workspace.id} workspaceId={workspace.id} base={base} showExample={!plans.length} /></div>}
    {!plans.length && <section className="empty-state pipeline-getting-started"><PlanHeading>Your pipeline plan starts here</PlanHeading><div className="actions"><button className="button primary" onClick={() => { if (editing) setEditor({}); else void navigate(`${base}/pipeline?edit=1&add=1`) }}>+ Add procurement</button>{editing && <button className="button" onClick={exitEditing}>Exit edit mode</button>}</div></section>}
    {!plans.length && <ExamplePipeline />}
    {plans.length > 0 && <>
      <section className={`pipeline-context-panel ${editing ? 'editing' : 'viewing'}`} data-state={live ? 'live' : editing ? 'editing' : 'viewing'} aria-label="Pipeline Plan context">
        <div className="context-main"><div className="context-copy"><span className="context-label">{live ? 'Live pipeline plan' : editing ? 'Editing pipeline plan' : 'Viewing saved pipeline plan'}</span><div className="context-name-row"><PlanHeading>{saved?.name ?? 'Unnamed pipeline plan'}</PlanHeading><p className="context-save-state" role="status">{editing ? dirty ? 'Unsaved changes' : saved ? 'All changes saved' : 'Not yet saved' : 'Read-only'}</p></div>{live && <p>Follow the live plan, or explore a different way forward.</p>}{contextDescription && <p>{contextDescription}</p>}</div>
        <div className="context-actions">{editing ? <div className="pipeline-save-control"><button className="button primary" ref={saveButton} type="button" popoverTarget={menuId} aria-controls={menuId} aria-expanded={saveExpanded}>Save <span aria-hidden="true">▾</span></button><div id={menuId} ref={menu} className="pipeline-save-options" popover="auto" role="group" aria-label="Save the displayed pipeline plan" onToggle={event => setSaveExpanded(event.newState === 'open')} onBeforeToggle={event => {
          if (event.newState === 'open' && saveButton.current && menu.current) {
            closeTimelineDetails()
            const bounds = saveButton.current.getBoundingClientRect()
            menu.current.style.left = `${Math.max(12, Math.min(bounds.right - 360, innerWidth - 372))}px`
            menu.current.style.top = `${Math.max(12, Math.min(bounds.bottom + 8, innerHeight - 190))}px`
          }
        }}><button type="button" aria-label="Save" onClick={() => openSave('save')}><strong>Save</strong><small>Save changes to the open pipeline plan.</small></button><button type="button" aria-label="Save as…" onClick={() => openSave('saveAs')}><strong>Save as…</strong><small>Save a new copy under a different name.</small></button></div></div> : <Link className="button primary" to={editPlanPath(base, saved!.id, workspace.currentBaselineId)}>{live ? 'Edit live plan' : working?.saved?.id === saved!.id ? 'Continue editing' : 'Edit this pipeline plan'}</Link>}{editing ? <button className="button" onClick={exitEditing}>Exit edit mode</button> : saved && saved.id !== workspace.currentBaselineId && <button className="button" onClick={() => requestMakeLive(saved)}>Make live</button>}</div></div>
        <section className="context-checks" aria-label="Clash checks"><div><h3>Clash checks</h3><p>Checks cover the whole pipeline plan, including dates outside the viewing window.</p></div><div className="context-check-counts"><FindingCounts findings={findings} /><a href={`#${findingsId}`} onClick={event => {
          if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
          event.preventDefault()
          const target = document.getElementById(findingsId)
          target?.focus({ preventScroll: true }); target?.scrollIntoView({ block: 'start' })
        }}>Review findings</a></div></section>
      </section>
      <Timeline plans={plans} rules={workspace.library.rules} onSelect={select} viewing={!editing} page windowState={timelineWindow} onWindowChange={setTimelineWindow} actions={editing && <><button className="button pipeline-add" onClick={() => setEditor({})}>+ Add procurement</button><button className="button pipeline-add" onClick={() => { closeTimelineDetails(); setAdjusting(true) }}>Adjust pipeline plan</button></>} />
      <Findings sectionId={findingsId} findings={findings} hasRules={workspace.library.rules.length > 0} filters onSelect={select} getHref={getHref} viewing={!editing} />
      <section className="procurement-overview" aria-labelledby={procurementsId}><div className="overview-heading"><h2 id={procurementsId}>Procurements <span>({plans.length})</span></h2></div><div className="table-scroll" tabIndex={0} role="region" aria-label="Procurements table"><table><thead><tr><th scope="col">Procurement</th><th scope="col">Planning start</th><th scope="col">Planning finish</th><th scope="col">Anchor date</th><th scope="col">Actions</th></tr></thead><tbody>{plans.map(plan => <tr key={plan.id} id={`${procurementsId}-${plan.id}`}><td>{live ? <strong>{plan.name}</strong> : <ProcurementLink id={plan.id} name={plan.name} href={getHref(plan.id)} onSelect={select} viewing={!editing} />}<small>{plan.phases.filter(phase => phase.kind === 'phase').length} phases</small></td><td>{formatDate(Math.min(...plan.phases.map(phase => phase.s)))}</td><td>{formatDate(Math.max(...plan.phases.map(finishDate)))}</td><td>{formatDate(plan.anchor)}<small>{plan.anchorName}</small></td><td><div className="actions"><ProcurementLink id={plan.id} name={plan.name} href={getHref(plan.id)} onSelect={select} viewing={!editing} action>{editing ? 'Edit' : 'View details'}</ProcurementLink>{live && <Link className="button" aria-label={`Edit ${plan.name}`} to={`${editPlanPath(base, saved!.id, workspace.currentBaselineId)}&procurement=${plan.id}`}>Edit</Link>}</div></td></tr>)}</tbody></table></div></section>
    </>}
    {!editing && saved && modal && <details className="planning-card saved-details"><summary>Saved details</summary><SavedScope record={saved} />{saved.note && <p>{saved.note}</p>}<p>Saved by {saved.savedBy} on {new Date(saved.savedAt).toLocaleString('en-GB')}.</p>{saved.confirmation && <><p>Previously recorded confirmation by {saved.confirmation.by} on {new Date(saved.confirmation.at).toLocaleString('en-GB')}.</p>{saved.confirmation.rationale && <p><strong>Notes:</strong> {saved.confirmation.rationale}</p>}</>}</details>}
    {inspecting && <ProcurementDetails plan={inspecting} onClose={() => setInspecting(null)} />}
    {editing && adjusting && <Suspense fallback={<p role="status">Loading adjustment controls...</p>}><AdjustmentDialog initial={plans} saved={saved} window={timelineWindow} onWindowChange={setTimelineWindow} onClose={() => setAdjusting(false)} onApply={next => { const changed = new Map(next.map(plan => [plan.id, plan])); setWorking(previous => previous && ({ ...previous, plans: previous.plans.map(plan => changed.get(plan.id) ?? plan) })); setAdjusting(false) }} /></Suspense>}
    {editing && updates && <LibraryImpact phaseId={query.get('phaseUpdate') ?? undefined} plans={plans} library={workspace.library} acknowledgements={working!.acknowledgements} pipelineName={saved?.name ?? 'Unnamed live plan'} onClose={() => setQuery(previous => { previous.delete('updates'); previous.delete('phaseUpdate'); return previous }, { replace: true })} onApply={(plans, acknowledgements, saveAfter) => { setWorking(previous => previous && ({ ...previous, plans, acknowledgements })); setQuery(previous => { previous.delete('updates'); previous.delete('phaseUpdate'); return previous }, { replace: true }); if (saveAfter) save('save') }} />}
  </article>
}
