import { lazy, Suspense, useState } from 'react'
import type { PipelineSource } from './pipeline-connected-types'
import type { PipelineVersion } from './pipeline-versions'

const SaveVersionDialog = lazy(() => import('./pipeline-save-version-dialog').then(module => ({ default: module.SaveVersionDialog })))

export function OpenPipelineButton({ version, small = false, label }: { version: PipelineVersion; small?: boolean; label?: string }) {
  const [source, setSource] = useState<PipelineSource | null>(null)
  const [error, setError] = useState('')
  const baseline = version.status === 'current' || version.status === 'previous'
  function open() {
    setError('')
    try {
      const current = window.LTPPDemo.pipelineSource()
      if (baseline) { setSource(current); return }
      if (current.context.id === version.id) { window.LTPPDemo.go('pipeline.html?view=resume'); return }
      if (current.dirty) { setSource(current); return }
      window.LTPPDemo.openPipeline(version, current)
      window.LTPPDemo.go('pipeline.html?view=resume')
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'The pipeline could not be opened.') }
  }
  return <>
    <button type="button" className={`btn${small ? ' small' : ''}`} onClick={open}>{label ?? (baseline ? 'Edit this pipeline' : 'Open')}<span className="sr-only"> {version.name}</span></button>
    {error ? <p className="save-version-error" role="alert">{error}</p> : null}
    {source ? <Suspense fallback={<p role="status">Opening save options…</p>}><SaveVersionDialog source={source} mode={baseline ? 'editBaseline' : 'switch'} target={version} onClose={() => setSource(null)} onSaved={() => window.LTPPDemo.go('pipeline.html?view=resume')} /></Suspense> : null}
  </>
}
