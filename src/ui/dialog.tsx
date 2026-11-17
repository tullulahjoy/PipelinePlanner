import { useEffect, useId, useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import type { useBlocker } from 'react-router'

const dialogOrigins = new WeakMap<HTMLDialogElement, Element | null>()
// Child layout effects run first. Open any containing dialog first so a
// recovery/detail dialog mounted with it remains at the front of the top layer.
function showDialog(element: HTMLDialogElement) {
  if (element.open) return
  const parent = element.parentElement?.closest('dialog')
  if (parent) showDialog(parent)
  dialogOrigins.set(element, document.activeElement)
  element.showModal()
}

export function Dialog({ title, children, onClose, onEscape, busy = false, wide = false, className = '', footer, focusTitle = false, description, alert = false, eyebrow, headerAside }: { title: string; children: ReactNode; onClose: () => void; onEscape?: () => void; busy?: boolean; wide?: boolean; className?: string; footer?: ReactNode; focusTitle?: boolean; description?: string; alert?: boolean; eyebrow?: string; headerAside?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()
  useLayoutEffect(() => {
    const element = ref.current!
    showDialog(element)
    const previous = dialogOrigins.get(element)
    const focusTarget = element.querySelector<HTMLElement>('[data-autofocus]')
    focusTarget?.focus({ preventScroll: focusTarget.tagName === 'H2' })
    return () => {
      element.close()
      dialogOrigins.delete(element)
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus()
    }
  }, [])
  const heading = <h2 id={id} tabIndex={focusTitle ? -1 : undefined} data-autofocus={focusTitle || undefined}>{title}</h2>
  return <dialog ref={ref} data-tooltip-container="" role={alert ? 'alertdialog' : undefined} className={`app-dialog${wide ? ' wide' : ''}${className ? ` ${className}` : ''}`} aria-labelledby={id} aria-describedby={description ? `${id}-description` : undefined} onCancel={event => { event.preventDefault(); event.stopPropagation(); if (!busy) (onEscape ?? onClose)() }}>
    <header>{description || eyebrow ? <div>{eyebrow && <span className="dialog-eyebrow">{eyebrow}</span>}{heading}{description && <p id={`${id}-description`}>{description}</p>}</div> : heading}{headerAside}<button className="close-button" type="button" aria-label={`Close ${title}`} disabled={busy} onClick={onClose}>×</button></header>
    <div className="dialog-content">{children}</div>
    {footer && <footer>{footer}</footer>}
  </dialog>
}

export function ErrorMessage({ message }: { message?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  useEffect(() => { if (message) ref.current?.focus() }, [message])
  return message ? <p ref={ref} role="alert" tabIndex={-1} className="form-error">{message}</p> : null
}

export function LeaveDialog({ blocker, onDiscard, onSave, hidden = false }: { blocker: ReturnType<typeof useBlocker>; onDiscard: () => void; onSave?: () => void; hidden?: boolean }) {
  if (blocker.state !== 'blocked' || hidden) return null
  return <Dialog title="Unsaved changes" onClose={() => blocker.reset()}>
    <p>{onSave ? 'Save your pipeline plan before leaving, discard the unsaved changes, or keep editing.' : 'Your current edits have not been applied and saved. Keep editing to review them, or discard the unsaved changes and leave.'}</p>
    <div className="actions">
      <button className="button" data-autofocus onClick={() => blocker.reset()}>Keep editing</button>
      <button className="button danger" onClick={() => { onDiscard(); blocker.proceed() }}>Discard changes</button>
      {onSave && <button className="button primary" onClick={onSave}>Save before leaving</button>}
    </div>
  </Dialog>
}
