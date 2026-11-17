import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { Dialog } from '../../ui/dialog.tsx'
import { closeTimelineDetails } from '../../ui/timeline-details.ts'
import { workspaceStorageKeys } from '../../data/workspace-storage.ts'
import './pipeline-welcome.css'

export function PipelineWelcome({ workspaceId, base, showExample, live = false }: { workspaceId: string; base: string; showExample: boolean; live?: boolean }) {
  const key = workspaceStorageKeys(workspaceId).welcomeShortcut
  const trigger = useRef<HTMLButtonElement>(null)
  const [hidden, setHidden] = useState(() => {
    try { return localStorage.getItem(key) === '1' } catch { return false }
  })
  const [open, setOpen] = useState(showExample && !live)
  function focusPage() { (trigger.current ?? document.getElementById('main-content'))?.focus() }
  function dismiss() {
    setOpen(false)
    requestAnimationFrame(focusPage)
  }
  function hideShortcut() {
    try { localStorage.setItem(key, '1') } catch { /* Keep the shortcut dismissible for this visit without storage. */ }
    setHidden(true)
    requestAnimationFrame(() => document.getElementById('main-content')?.focus())
  }
  if (live) return null
  return <>
    {!hidden && <span className="pipeline-setup-help"><button ref={trigger} type="button" className="text-button" onClick={() => { closeTimelineDetails(); setOpen(true) }}>Getting started</button><button type="button" className="dismiss-setup-help" aria-label="Dismiss Getting started" title="Dismiss Getting started" onClick={hideShortcut}>×</button></span>}
    {open && <Dialog title="Your pipeline plan starts here" onClose={dismiss} className="pipeline-welcome" focusTitle footer={<button type="button" className="button primary" onClick={dismiss}>Got it</button>}>
      <div className="pipeline-introduction">
        <p>A pipeline plan brings your procurements together on one timeline.{showExample && ' The example on the page shows what you can create; your own timeline will replace it when you add your first procurement.'}</p>
        <ol className="welcome-steps">
          <li><div><h3>Add procurements</h3><p>{showExample ? 'Close these instructions and choose ' : 'While editing a pipeline plan, choose '}<strong>+ Add procurement</strong>. Choose its phases (e.g. Dialogue, Evaluation, etc.) and their durations, and set its anchor milestone and date (the fixed point around which its schedule must be calculated). Run clash checks using your <Link to={`${base}/library`} onClick={dismiss}>Library</Link> clash-checking rules.</p></div></li>
          <li><div><h3>Save your live plan</h3><p>Choose <strong>Save</strong> and give the pipeline plan a name. Your first saved plan becomes your live plan automatically. It opens by default whenever you enter the workspace. You can keep building it later.</p></div></li>
          <li><div><h3>Explore alternatives</h3><p>Choose <strong>Edit live plan</strong> to make changes. Use <strong>Save</strong> to update it, or <strong>Save as</strong> to keep a separate alternative in <strong>Saved Pipeline Plans</strong>. Choose <strong>Make live</strong> there if you want an alternative to replace the live plan.</p></div></li>
        </ol>
        <div className="welcome-help">
          <p>See <Link to={`${base}/how-it-works`} onClick={dismiss}>How it works</Link> for the full guide to building procurement schedules, checking for clashes, saving progress and working with your live plan.</p>
          {!hidden && <p>While creating your first plan, use <strong>Getting started</strong> on the Live Pipeline page to reopen these instructions. You can dismiss that shortcut when you no longer need it. <strong>How it works</strong> remains available in the navigation.</p>}
        </div>
      </div>
    </Dialog>}
  </>
}
