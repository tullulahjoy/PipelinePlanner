import { lazy, Suspense, useLayoutEffect, useRef } from 'react'
import { Link, useLoaderData, useOutletContext, useParams, useSearchParams } from 'react-router'
import type { SavedPipeline, WorkspaceData } from '../../data/schemas.ts'
import { editPlanPath } from '../pipeline/pipeline-paths.ts'
import { usePipelineSession } from '../../app/workspace-context.ts'
import { SavedScope } from '../../ui/saved-scope.tsx'
import './saved-pipelines.css'

const SavedPipelineModal = lazy(() => import('../pipeline/pipeline.tsx').then(module => ({ default: module.SavedPipelineModal })))
const ComparisonModal = lazy(() => import('./comparison.tsx').then(module => ({ default: module.ComparisonModal })))

export function SavedPipelines() {
  const { requestMakeLive } = usePipelineSession()
  const records = useLoaderData<SavedPipeline[]>()
  const workspace = useOutletContext<WorkspaceData>()
  const { pipelineId } = useParams()
  const [query, setQuery] = useSearchParams()
  const filter = query.get('show') ?? 'all'
  const comparing = !pipelineId && query.has('compare')
  const selected = records.find(record => record.id === pipelineId)
  const modalId = pipelineId ? `view:${pipelineId}` : comparing ? `compare:${query.get('compare')}` : undefined
  const list = useRef<HTMLElement>(null), opener = useRef<HTMLAnchorElement | null>(null), previousId = useRef(modalId)
  const heading = useRef<HTMLHeadingElement>(null)
  const returnScroll = useRef<number | null>(null)
  useLayoutEffect(() => {
    const closedId = !modalId ? previousId.current : undefined
    previousId.current = modalId
    if (!closedId) return
    const [kind, id] = closedId.split(':')
    const target = opener.current?.isConnected ? opener.current : list.current?.querySelector<HTMLAnchorElement>(`a[data-plan-${kind}="${id}"]`) ?? heading.current
    const frame = requestAnimationFrame(() => {
      target?.focus({ preventScroll: true })
      if (returnScroll.current !== null) window.scrollTo({ top: returnScroll.current, behavior: 'instant' })
      returnScroll.current = null
    })
    return () => cancelAnimationFrame(frame)
  }, [modalId])
  const base = `/workspaces/${workspace.id}`
  const viewPath = (record: SavedPipeline) => record.id === workspace.currentBaselineId ? `${base}/pipeline` : `${base}/saved-pipelines/${record.id}`
  const shown = records.filter(record => filter === 'live' ? record.id === workspace.currentBaselineId : filter === 'saved' ? record.id !== workspace.currentBaselineId : true)
  function comparePath(record: SavedPipeline) {
    const other = records.find(item => item.id === workspace.currentBaselineId && item.id !== record.id) ?? records.find(item => item.id !== record.id)!
    const next = new URLSearchParams(query)
    next.set('compare', other.id); next.set('with', record.id)
    return `${base}/saved-pipelines?${next}`
  }
  function closeComparison() {
    setQuery(previous => { const next = new URLSearchParams(previous); next.delete('compare'); next.delete('with'); return next }, { replace: true })
  }
  return <>
    <div className="page-heading"><h1 ref={heading} tabIndex={-1}>Saved Pipeline Plans</h1><p>A named pipeline plan you can view and edit. Save updates it after confirmation; Save as keeps a separate copy.</p></div>
    <section className="planning-card saved-plans" ref={list} onClickCapture={event => { if (event.target instanceof Element) { opener.current = event.target.closest('a'); if (opener.current) returnScroll.current = window.scrollY } }}>
      {records.length > 0 && <label className="field saved-plan-filter">Show<select value={['live', 'saved'].includes(filter) ? filter : 'all'} onChange={event => setQuery(previous => {
        const next = new URLSearchParams(previous)
        if (event.target.value === 'all') next.delete('show'); else next.set('show', event.target.value)
        return next
      }, { replace: true })}><option value="all">All</option><option value="live">Live</option><option value="saved">Saved</option></select></label>}
      {filter !== 'all' && <p role="status">Showing {shown.length} of {records.length} pipeline plans.</p>}
      {records.length ? shown.length ? <div className="table-scroll" tabIndex={0} role="region" aria-label="Saved pipeline plans table"><table><thead><tr><th scope="col">Pipeline Plan</th><th scope="col">Status</th><th scope="col">Last saved</th><th scope="col">Actions</th></tr></thead><tbody>{shown.map(record => <tr key={record.id}>
        <th scope="row"><Link to={viewPath(record)}>{record.name}</Link><details className="saved-details"><summary>Saved details</summary><SavedScope record={record} />{record.note && <p>{record.note}</p>}{record.confirmation && <><p>Previously recorded confirmation by {record.confirmation.by} on {new Date(record.confirmation.at).toLocaleString('en-GB')}.</p>{record.confirmation.rationale && <p><strong>Notes:</strong> {record.confirmation.rationale}</p>}</>}<p>Saved by {record.savedBy}</p>{[...new Set(record.acknowledgements.map(item => item.explanation))].map(explanation => <p key={explanation}><strong>Previously recorded note:</strong> {explanation}</p>)}</details></th>
        <td><span className="stage-label">{record.id === workspace.currentBaselineId ? 'Live plan' : 'Saved pipeline plan'}</span></td><td>{new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(record.savedAt))}<small>{record.savedBy}</small></td>
        <td><div className="actions"><Link className="button" data-plan-view={record.id} to={viewPath(record)}>View</Link><Link className="button" to={editPlanPath(base, record.id, workspace.currentBaselineId)}>Edit</Link>{records.length > 1 && <Link className="button" data-plan-compare={record.id} to={comparePath(record)}>Compare<span className="sr-only"> {record.name}</span></Link>}{record.id !== workspace.currentBaselineId && <button className="button" onClick={() => requestMakeLive(record)}>Make live</button>}</div></td>
      </tr>)}</tbody></table></div> : <div className="empty-state"><p>No pipeline plans match this filter.</p><button className="button" onClick={() => setQuery(previous => { const next = new URLSearchParams(previous); next.delete('show'); return next }, { replace: true })}>Show all pipeline plans</button></div> : <div className="empty-state"><h2>No saved pipeline plans yet</h2><p>Build your first live pipeline plan and save your progress in this workspace.</p><Link className="button primary" to={`${base}/pipeline?edit=1&add=1`}>Create your first live pipeline plan</Link></div>}
    </section>
    {selected && <Suspense fallback={<p role="status">Loading saved pipeline plan...</p>}><SavedPipelineModal key={selected.id} record={selected} /></Suspense>}
    {comparing && <Suspense fallback={<p role="status">Loading comparison...</p>}><ComparisonModal records={records} firstId={query.get('compare') ?? ''} secondId={query.get('with') ?? ''} onClose={closeComparison} onChoose={(first, second) => setQuery(previous => {
      const next = new URLSearchParams(previous); next.set('compare', first); next.set('with', second); return next
    }, { replace: true })} /></Suspense>}
  </>
}
