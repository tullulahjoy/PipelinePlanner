import type { Root } from 'react-dom/client'
import { addMonths, parseDate } from './pipeline-scheduling'
import type { ConnectedAdjustment } from './pipeline-connected-types'

const button = document.getElementById('adjust-pipeline') as HTMLButtonElement | null
const mount = document.getElementById('pipeline-adjustment-root')
let root: Root | null = null
let dirty = false

function close() {
  root?.unmount(); root = null
  dirty = false
  window.LTPPDemo.setDirty(() => false)
  if (button) { try { const source = window.LTPPDemo.pipelineSource(); button.disabled = source.readOnly || !source.plans.length } catch { button.disabled = true }; button.focus() }
}

if (button && mount) {
  button.disabled = window.LTPPDemo.pipelineSource().readOnly || !window.LTPPDemo.plans().length
  button.title = button.disabled ? 'Add a procurement before adjusting the pipeline.' : ''
  button.addEventListener('click', async () => {
    if (root) return
    button.disabled = true; button.setAttribute('aria-busy', 'true')
    try {
      const [{ createRoot }, { PipelineAdjustment }] = await Promise.all([import('react-dom/client'), import('./pipeline-adjustment')])
      const source = window.LTPPDemo.pipelineSource()
      if (source.readOnly) throw new Error('Choose Edit this pipeline before making adjustments.')
      const { plans, rules } = source
      if (!plans.length) throw new Error('Add a procurement before adjusting the pipeline.')
      const first = Math.min(...plans.flatMap(plan => plan.phases.map(phase => phase.s)))
      const requested = parseDate((document.getElementById('pipeline-start') as HTMLInputElement).value)
      const start = Number.isFinite(requested) ? requested : first
      const months = Number((document.getElementById('pipeline-window') as HTMLSelectElement).value)
      const bridge: ConnectedAdjustment = {
        plans, rules, initialView: { start, end: addMonths(start, months === 6 ? 6 : 12) },
        background: [...document.body.children].filter((node): node is HTMLElement => node instanceof HTMLElement && node !== mount),
        returnFocus: button,
        dirty: value => { dirty = value },
        close,
        save(changed, reason) {
          window.LTPPDemo.updatePlans(changed, plans, rules, reason)
          document.dispatchEvent(new CustomEvent('ltpp:pipeline-updated', { detail: { count: changed.length } }))
        },
      }
      window.LTPPDemo.setDirty(() => dirty)
      root = createRoot(mount)
      root.render(<PipelineAdjustment connected={bridge} />)
    } catch (error) {
      close()
      window.LTPPDemo.error(error instanceof Error ? error.message : 'Adjustment mode could not be opened.')
    } finally { button.removeAttribute('aria-busy') }
  })
}

if (import.meta.hot) import.meta.hot.dispose(close)
