import { useId, useState } from 'react'

export function ProcurementApplyButton({ label, reason, onApply }: { label: string; reason: string; onApply: () => void }) {
  const hintId = useId()
  const [showHint, setShowHint] = useState(false)
  return <span className="procurement-apply-hint" onMouseEnter={() => setShowHint(true)} onMouseLeave={event => { if (!event.currentTarget.contains(document.activeElement)) setShowHint(false) }}>
    <button type="button" className="button primary" aria-disabled={reason ? true : undefined} aria-describedby={reason ? hintId : undefined}
      onFocus={() => setShowHint(true)} onBlur={() => setShowHint(false)}
      onKeyDown={event => { if (event.key === 'Escape' && reason && showHint) { event.preventDefault(); event.stopPropagation(); setShowHint(false) } }}
      onClick={() => { if (reason) setShowHint(true); else onApply() }}>{label}</button>
    {reason && <span id={hintId} role="tooltip" hidden={!showHint}>{reason}</span>}
  </span>
}
