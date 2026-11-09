import type { Root } from 'react-dom/client'
import type { PipelineVersion } from './pipeline-versions'
import './pipeline-connected-types'
import type { PipelineSaveMode, PipelineSource } from './pipeline-connected-types'

const button = document.getElementById('save-pipeline-version') as HTMLButtonElement | null
const saveAsButton = document.getElementById('save-pipeline-as') as HTMLButtonElement | null
const baselineButton = document.getElementById('confirm-pipeline-baseline') as HTMLButtonElement | null
const editBaselineButton = document.getElementById('pipeline-edit-baseline') as HTMLButtonElement | null
const liveButton = document.getElementById('pipeline-view-live') as HTMLButtonElement | null
const launcher = document.getElementById('pipeline-save') as HTMLButtonElement | null
const options = document.getElementById('pipeline-save-options')
const mount = document.getElementById('pipeline-version-root')
const listeners = new AbortController()
let root: Root | null = null
let loading = false, dirty = false
let returnPosition: number | null = null
let displayedSource: PipelineSource | null = null

function close() {
  root?.unmount(); root = null
  dirty = false
  window.LTPPDemo.setDirty(() => false)
  if (returnPosition !== null) window.scrollTo({ top: returnPosition, behavior: 'instant' })
  returnPosition = null
  refreshName()
  ;(editBaselineButton && !editBaselineButton.hidden ? editBaselineButton : launcher)?.focus({ preventScroll: true })
}
function baselineChanged(version: PipelineVersion) {
  refreshName()
  const notice = document.getElementById('pipeline-message')
  if (!notice) return
  const link = document.createElement('a')
  link.href = `versions-and-baselines.html#view=${encodeURIComponent(version.id)}`
  link.textContent = 'View saved record'
  notice.replaceChildren(document.createTextNode(`${version.name} is now the current baseline and live pipeline. The previous baseline and other saved pipelines are retained. `), link)
  notice.hidden = false
}
async function openBaseline() {
  if (!mount || root || loading) return
  if (options?.matches(':popover-open')) options.hidePopover()
  loading = true; baselineButton?.setAttribute('aria-busy', 'true')
  try {
    const source = window.LTPPDemo.pipelineSource()
    if (displayedSource && JSON.stringify(source) !== JSON.stringify(displayedSource)) throw new Error('The pipeline changed since this page was displayed. Reload before reviewing a new baseline.')
    const [{ createRoot }, { BaselineJourneyModal }] = await Promise.all([import('react-dom/client'), import('./pipeline-baseline-journey')])
    returnPosition = window.scrollY
    const timeline = document.getElementById('timeline-title')?.closest('section')
    if (timeline) window.LTPPTooltips?.closeWithin(timeline)
    timeline?.scrollIntoView({ block: 'start', behavior: 'instant' })
    root = createRoot(mount)
    root.render(<BaselineJourneyModal target={{ kind: 'pipeline' }} onClose={close} onChanged={baselineChanged} onDirty={value => { dirty = value }} />)
  } catch (error) {
    close()
    window.LTPPDemo.error(error instanceof Error ? error.message : 'Baseline review could not be opened.')
  } finally { loading = false; baselineButton?.removeAttribute('aria-busy') }
}
function positionOptions() {
  if (!launcher || !options) return
  const anchor = launcher.getBoundingClientRect(), menu = options.getBoundingClientRect()
  const width = menu.width || Math.min(360, innerWidth - 24), height = menu.height || 200
  const left = Math.max(12, Math.min(anchor.right - width, innerWidth - width - 12))
  const below = anchor.bottom + 8, above = anchor.top - height - 8
  options.style.left = `${left}px`
  options.style.top = `${Math.max(12, Math.min(below + height <= innerHeight - 12 || above < 12 ? below : above, innerHeight - height - 12))}px`
}
function saved(version: PipelineVersion) {
  close()
  refreshName()
  const notice = document.getElementById('pipeline-message')
  if (notice) {
    const link = document.createElement('a')
    link.href = `versions-and-baselines.html#view=${encodeURIComponent(version.id)}`
    link.textContent = 'View saved pipeline'
    notice.replaceChildren(document.createTextNode(`Saved: ${version.name}. The current baseline has not been replaced. `), link)
    notice.hidden = false
  }
}
function refreshName() {
  try {
    const source = window.LTPPDemo.pipelineSource()
    displayedSource = source
    if (baselineButton) {
      baselineButton.disabled = !source.plans.length || !(source.record?.status === 'saved' || source.dirty || source.context.originBaseline)
      baselineButton.title = baselineButton.disabled ? 'Open an editable saved pipeline, or save under a new name, before confirming a new baseline.' : ''
    }
    const name = document.getElementById('pipeline-name'), state = document.getElementById('pipeline-save-state')
    const baselineName = source.context.originBaseline?.name ?? (source.record && (source.record.status === 'current' || source.record.status === 'previous') ? source.record.name : null)
    if (name) name.textContent = source.record?.name ?? baselineName ?? 'Unnamed pipeline'
    if (state) state.textContent = source.readOnly ? 'Read-only' : source.dirty ? 'Unsaved changes' : baselineName ? 'No changes yet' : source.record ? 'All changes saved' : 'Not yet saved'
    const panel = document.getElementById('pipeline-context'), label = document.getElementById('pipeline-context-label')
    if (panel) panel.dataset.state = source.isLive ? 'live' : source.readOnly ? 'viewing' : 'editing'
    if (label) label.textContent = source.isLive ? 'Current baseline · Live pipeline' : source.readOnly ? 'Viewing previous baseline' : 'Editing pipeline'
    const pageTitle = document.getElementById('pipeline-page-title'), description = document.getElementById('pipeline-page-description')
    if (pageTitle) pageTitle.textContent = source.isLive ? 'Your procurement pipeline' : source.readOnly ? 'Viewing saved pipeline' : 'Editing pipeline'
    if (description) description.textContent = source.isLive ? 'Follow the live plan, or explore a different way forward.' : source.readOnly ? 'Inspect this fixed baseline, or start changes under a new name.' : 'Explore changes while keeping the live baseline fixed.'
    launcher?.closest<HTMLElement>('.pipeline-save-control')?.toggleAttribute('hidden', source.readOnly)
    if (button) button.disabled = source.readOnly || !source.plans.length
    if (saveAsButton) saveAsButton.disabled = source.readOnly || !source.plans.length
    if (launcher) { launcher.disabled = source.readOnly || !source.plans.length; launcher.title = !source.plans.length ? 'Add a procurement before saving the pipeline.' : '' }
    if (editBaselineButton) editBaselineButton.hidden = !source.readOnly
    if (liveButton) liveButton.hidden = source.isLive
    const add = document.querySelector<HTMLElement>('a[href="add-procurement.html"]')
    if (add) add.hidden = source.readOnly
    const editingActions = document.getElementById('pipeline-edit-actions')
    if (editingActions) editingActions.hidden = source.readOnly
    const adjust = document.getElementById('adjust-pipeline') as HTMLButtonElement | null
    if (adjust) { adjust.disabled = source.readOnly || !source.plans.length; adjust.title = source.readOnly ? 'Choose Edit this pipeline before making adjustments.' : '' }
    const intro = document.getElementById('pipeline-intro')
    if (intro) intro.textContent = source.readOnly ? source.isLive ? 'The fixed plan for day-to-day activity. Changes are saved separately under a new name.' : 'This previous baseline is fixed. Choose Edit this pipeline to explore changes under a new name.' : baselineName ? 'Save any changes under a new name. The baseline stays unchanged.' : 'Make changes to this saved pipeline, or use Save as to keep another alternative.'
    const timelineHelp = document.getElementById('timeline-help')
    if (timelineHelp) timelineHelp.textContent = source.readOnly ? 'Scroll to inspect the saved schedule. Open a procurement’s details, or choose Edit this pipeline to explore changes.' : 'Scroll to inspect the schedule. Open a procurement’s name to edit it. Select or focus a block for dates and overlap details.'
    const findingsHelp = document.querySelector<HTMLElement>('.findings-scope')
    if (findingsHelp) findingsHelp.textContent = source.readOnly ? 'Across the whole baseline. Select a procurement to view its saved details.' : 'Across the whole pipeline. Select a procurement to edit.'
    document.title = `${source.record?.name ?? baselineName ?? 'Procurement pipeline'} · LTPP`
  } catch (error) { window.LTPPDemo.error(error instanceof Error ? error.message : 'The open pipeline could not be read.') }
}
async function openBaselineEditing() {
  if (!mount || root || loading) return
  loading = true
  try {
    const source = window.LTPPDemo.pipelineSource()
    if (!source.readOnly || !source.record) return
    if (displayedSource && JSON.stringify(source) !== JSON.stringify(displayedSource)) throw new Error('This view is out of date. Reload before editing this baseline.')
    const [{ createRoot }, { SaveVersionDialog }] = await Promise.all([import('react-dom/client'), import('./pipeline-save-version-dialog')])
    root = createRoot(mount)
    root.render(<SaveVersionDialog source={source} mode="editBaseline" target={source.record} onClose={close} onSaved={() => { close(); window.LTPPDemo.go('pipeline.html?view=resume') }} />)
  } catch (error) { close(); window.LTPPDemo.error(error instanceof Error ? error.message : 'This baseline could not be opened for editing.') }
  finally { loading = false }
}
async function viewLive() {
  if (!mount || root || loading) return
  loading = true
  try {
    const source = window.LTPPDemo.pipelineSource()
    if (!source.dirty) { window.LTPPDemo.viewLivePipeline(source); window.LTPPDemo.go('pipeline.html?view=resume'); return }
    const records = window.LTPPDemo.versionRecords(), baseline = records.versions.find(version => version.id === source.currentBaselineId)
    if (!baseline || records.baseline.currentId !== source.currentBaselineId) throw new Error('The live pipeline changed. Reload this page before continuing.')
    const [{ createRoot }, { SaveVersionDialog }] = await Promise.all([import('react-dom/client'), import('./pipeline-save-version-dialog')])
    window.LTPPDemo.setDirty(() => dirty)
    root = createRoot(mount)
    root.render(<SaveVersionDialog source={source} mode="viewLive" target={baseline} onClose={close} onSaved={() => { close(); window.LTPPDemo.go('pipeline.html?view=resume') }} onDirty={value => { dirty = value }} />)
  } catch (error) { close(); window.LTPPDemo.error(error instanceof Error ? error.message : 'The live pipeline could not be opened.') }
  finally { loading = false }
}
editBaselineButton?.addEventListener('click', () => { void openBaselineEditing() }, { signal: listeners.signal })
liveButton?.addEventListener('click', () => { void viewLive() }, { signal: listeners.signal })
if (button && launcher && options && mount) {
  button.disabled = !window.LTPPDemo.plans().length
  launcher.disabled = button.disabled
  if (baselineButton) baselineButton.disabled = button.disabled
  launcher.title = button.disabled ? 'Add a procurement before saving the pipeline.' : ''
  options.addEventListener('beforetoggle', positionOptions, { signal: listeners.signal })
  options.addEventListener('toggle', () => {
    const open = options.matches(':popover-open')
    launcher.setAttribute('aria-expanded', String(open))
    if (open) positionOptions()
  }, { signal: listeners.signal })
  window.addEventListener('resize', () => { if (options.matches(':popover-open')) positionOptions() }, { signal: listeners.signal })
  window.addEventListener('scroll', event => {
    if (options.matches(':popover-open') && !(event.target instanceof Node && options.contains(event.target))) options.hidePopover()
  }, { capture: true, signal: listeners.signal })
  async function openSave(mode: PipelineSaveMode) {
    if (!button || !options || !mount) return
    if (root || loading) return
    if (options.matches(':popover-open')) options.hidePopover()
    loading = true; button.setAttribute('aria-busy', 'true')
    try {
      const [{ createRoot }, { SaveVersionDialog }] = await Promise.all([import('react-dom/client'), import('./pipeline-save-version-dialog')])
      const source = window.LTPPDemo.pipelineSource()
      if (displayedSource && JSON.stringify(source) !== JSON.stringify(displayedSource)) throw new Error('The pipeline changed since this page was displayed. Reload it to review the latest contents before saving.')
      if (!source.plans.length) throw new Error('Add a procurement before saving a pipeline.')
      window.LTPPDemo.setDirty(() => dirty)
      root = createRoot(mount)
      root.render(<SaveVersionDialog source={source} mode={mode} onClose={close} onSaved={saved} onDirty={value => { dirty = value }} />)
    } catch (error) {
      close()
      window.LTPPDemo.error(error instanceof Error ? error.message : 'Save version could not be opened.')
    } finally { loading = false; button.removeAttribute('aria-busy') }
  }
  button.addEventListener('click', () => { void openSave('save') }, { signal: listeners.signal })
  saveAsButton?.addEventListener('click', () => { void openSave('saveAs') }, { signal: listeners.signal })
  if (saveAsButton) saveAsButton.disabled = button.disabled
  refreshName()
  document.addEventListener('ltpp:pipeline-updated', refreshName, { signal: listeners.signal })
  window.addEventListener('storage', event => {
    if (event.key !== 'ltpp-connected-mockups-v1' && event.key !== null) return
    window.LTPPDemo.error('Pipeline data changed in another tab. Reload this page before saving.')
    const state = document.getElementById('pipeline-save-state')
    if (state) state.textContent = 'This view is out of date. Reload to see the latest pipeline.'
    launcher.disabled = true
  }, { signal: listeners.signal })
  baselineButton?.addEventListener('click', openBaseline, { signal: listeners.signal })
  if (new URLSearchParams(window.location.search).get('baseline') === 'confirm') {
    const url = new URL(window.location.href)
    url.searchParams.delete('baseline')
    window.history.replaceState(null, '', url)
    void openBaseline()
  }
}
if (import.meta.hot) import.meta.hot.dispose(() => { listeners.abort(); if (options?.matches(':popover-open')) options.hidePopover(); close() })

if (new URLSearchParams(window.location.search).get('view') === 'live') void viewLive()
