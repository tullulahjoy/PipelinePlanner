import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { BaselineActionSource, PipelineVersion } from './pipeline-versions'
import { Comparison } from './pipeline-versions.tsx'
import { SaveVersionDialog } from './pipeline-save-version-dialog'
import './pipeline-save-version.css'
import './pipeline-baseline-journey.css'

export type BaselineJourneyTarget = { kind: 'pipeline' } | { kind: 'version'; id: string; expected?: PipelineVersion }
type Props = { target: BaselineJourneyTarget; onClose: () => void; onChanged: (version: PipelineVersion) => void; onDirty?: (dirty: boolean) => void }
const dateTime = (value: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' }).format(new Date(value))

export function BaselineJourneyModal(props: Props) {
  const [initial] = useState(() => { try { return window.LTPPDemo.pipelineSource() } catch { return null } })
  const [resolved, setResolved] = useState(false)
  const [target, setTarget] = useState(props.target)
  const needsSave = initial && (initial.dirty || target.kind === 'pipeline' && initial.record?.status !== 'saved')
  function finishResolution() {
    document.dispatchEvent(new CustomEvent('ltpp:pipeline-updated', { detail: { silent: true } }))
    setResolved(true)
  }
  if (needsSave && !resolved) return <SaveVersionDialog source={initial} mode="resolve" allowDiscard={target.kind === 'version' || initial.record?.status === 'saved'}
    onClose={props.onClose} onDirty={props.onDirty} onResolved={finishResolution} onSaved={saved => {
      if (target.kind === 'version' && target.id === saved.id) setTarget({ ...target, expected: saved })
      finishResolution()
    }} />
  return <BaselineReview {...props} target={target} />
}

function capture(target: BaselineJourneyTarget): BaselineActionSource {
  const current = window.LTPPDemo.pipelineSource()
  if (current.dirty) throw new Error('Save or discard your changes before confirming a baseline.')
  const id = target.kind === 'version' ? target.id : current.record?.id
  if (!id) throw new Error('Save this pipeline under a name before confirming a baseline.')
  const source = window.LTPPDemo.baselineActionSource(id)
  if (target.kind === 'version' && target.expected && JSON.stringify(target.expected) !== JSON.stringify(source.version))
    throw new Error('The selected pipeline changed. Reload the page and review it again.')
  return source
}

function BaselineReview({ target, onClose, onChanged, onDirty }: Props) {
  const [initial] = useState(() => { try { return { source: capture(target), error: '' } } catch (error) { return { source: null, error: error instanceof Error ? error.message : 'The pipeline could not be loaded.' } } })
  const source = initial.source
  const [stage, setStage] = useState<'review' | 'confirm' | 'done'>('review')
  const [rationale, setRationale] = useState('')
  const [error, setError] = useState(initial.error)
  const [result, setResult] = useState<PipelineVersion | null>(null)
  const dialog = useRef<HTMLDialogElement>(null), body = useRef<HTMLDivElement>(null), heading = useRef<HTMLHeadingElement>(null), failure = useRef<HTMLParagraphElement>(null)
  const busy = useRef(false)
  useLayoutEffect(() => {
    const element = dialog.current!, previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'; element.showModal()
    return () => { window.LTPPTooltips?.closeWithin(element); element.close(); document.body.style.overflow = previous }
  }, [])
  useLayoutEffect(() => {
    window.LTPPTooltips?.closeWithin(dialog.current!)
    body.current?.scrollTo({ top: 0, behavior: 'instant' })
    heading.current?.focus({ preventScroll: true })
  }, [stage])
  useEffect(() => {
    const dirty = !!rationale && stage !== 'done'
    onDirty?.(dirty)
    if (!dirty) return
    const preventLoss = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', preventLoss)
    return () => { window.removeEventListener('beforeunload', preventLoss); onDirty?.(false) }
  }, [rationale, stage, onDirty])
  function fail(value: unknown) {
    setError(value instanceof Error ? value.message : 'The baseline could not be saved.')
    requestAnimationFrame(() => { failure.current?.focus({ preventScroll: true }); failure.current?.scrollIntoView({ block: 'nearest' }) })
  }
  function confirm() {
    if (!source || busy.current) return
    busy.current = true
    try {
      const version = window.LTPPDemo.confirmBaseline(source.version.id, rationale, source)
      setResult(version); setError(''); setStage('done'); onChanged(version)
    } catch (value) { fail(value) }
    finally { busy.current = false }
  }
  const title = stage === 'done' ? 'New baseline confirmed' : stage === 'confirm' ? `Confirm “${source?.version.name ?? 'this pipeline'}” as the new baseline?` : 'Review the new baseline'
  return <dialog ref={dialog} className="versions-page save-version-dialog baseline-journey-modal" aria-labelledby="baseline-journey-title" aria-describedby="baseline-journey-source" data-tooltip-container="" data-baseline-stage={stage}
    onCancel={event => { event.preventDefault(); onClose() }}>
    <header><div><h2 id="baseline-journey-title" ref={heading} tabIndex={-1}>{title}</h2><p id="baseline-journey-source">{source?.version.name ?? 'Baseline confirmation'}</p></div><button className="save-version-close" type="button" aria-label="Close baseline confirmation" onClick={onClose}>×</button></header>
    <ol className="baseline-steps" aria-label="Baseline steps">{['Review changes', 'Confirm baseline'].map((label, index) => <li key={label} className={stage === 'done' || stage === 'confirm' && index === 0 ? 'done' : stage === 'review' && index === 0 || stage === 'confirm' && index === 1 ? 'current' : ''} aria-current={stage === 'review' && index === 0 || stage === 'confirm' && index === 1 ? 'step' : undefined}><span>{index + 1}</span>{label}</li>)}</ol>
    <div className="baseline-journey-body" ref={body}>
      {source && stage === 'review' ? <>
        <p className="help">Review what will change when <strong>{source.version.name}</strong> replaces <strong>{source.baseline.name}</strong> as the live pipeline. Unchanged entries are omitted.</p>
        <div className="baseline-input"><label htmlFor="baseline-rationale">Rationale <span>(optional)</span></label><p className="help" id="baseline-rationale-help">You can explain why you are choosing this pipeline as the new baseline.</p><textarea id="baseline-rationale" maxLength={2000} rows={3} value={rationale} aria-describedby="baseline-rationale-help" onChange={event => setRationale(event.target.value)} /></div>
        <Comparison before={source.baseline} after={source.version} locked baselineReview />
      </> : null}
      {source && stage === 'confirm' ? <section className="baseline-modal-result">
        <p>This will become the live pipeline. Its saved contents will be fixed. The current baseline will remain available as a previous baseline.</p>
        <p>Other saved pipelines will remain available for editing and comparison.</p>
        {rationale.trim() ? <p><strong>Rationale:</strong> {rationale.trim()}</p> : null}
        <p>Confirmed by {source.editor.name} (fictional editor). The date and time will be recorded automatically.</p>
      </section> : null}
      {result && stage === 'done' ? <section className="baseline-modal-result" role="status"><span className="version-status current">Current baseline · Live pipeline</span><h3>{result.name}</h3>
        <p>The previous baseline and other saved pipelines have been retained. To make further changes, choose Edit this pipeline and save under a new name.</p>
        {result.confirmation ? <p>Confirmed by <strong>{result.confirmation.by}</strong> on {dateTime(result.confirmation.at)}.</p> : null}
        {result.confirmation?.rationale ? <p><strong>Rationale:</strong> {result.confirmation.rationale}</p> : null}
        <div className="version-actions"><a className="btn primary" href="pipeline.html?view=live">View live pipeline</a><a className="btn" href={`versions-and-baselines.html#view=${encodeURIComponent(result.id)}`}>View baseline record</a></div>
      </section> : null}
      {error ? <p ref={failure} className="baseline-field-error baseline-save-error" role="alert" tabIndex={-1}>{error}</p> : null}
    </div>
    <footer><button className="btn" type="button" onClick={onClose}>{stage === 'done' ? 'Close' : 'Cancel'}</button>
      {source && stage === 'review' ? <button className="btn primary" type="button" onClick={() => { setError(''); setStage('confirm') }}>Continue</button> : null}
      {source && stage === 'confirm' ? <><button className="btn" type="button" onClick={() => { setError(''); setStage('review') }}>Back to review</button><button className="btn primary" type="button" onClick={confirm}>Confirm baseline</button></> : null}
    </footer>
  </dialog>
}
