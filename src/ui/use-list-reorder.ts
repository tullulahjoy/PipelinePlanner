import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import './list-reorder.css'

type Item = { id: number | string; name: string }
type Drag = { id: number | string; label: string; from: number; to: number; handle: HTMLButtonElement; keyboard: boolean; active: boolean; validDrop: boolean; pointerId?: number; x: number; y: number; startX: number; startY: number }
type Options = { disabled?: boolean; containerName?: string; orderName?: string; announceMove?: boolean }

/** Port of the approved prototype's insertion-marker controller. Rows move only on drop. */
export function useListReorder(items: Item[], onMove: (from: number, to: number) => void, { disabled = false, containerName = 'table', orderName = 'phase', announceMove = true }: Options = {}) {
  const scroll = useRef<HTMLDivElement>(null)
  const latest = useRef({ items, onMove })
  const [status, setStatus] = useState('')
  const hasRows = items.length > 0
  useLayoutEffect(() => { latest.current = { items, onMove } })
  useEffect(() => {
    if (!hasRows || disabled || !scroll.current) return
    const container: HTMLDivElement = scroll.current
    const controller = new AbortController(), signal = controller.signal
    const ghost = document.createElement('div')
    ghost.className = 'reorder-ghost schedule-reorder-ghost'; ghost.hidden = true; ghost.setAttribute('aria-hidden', 'true'); document.body.append(ghost)
    let drag: Drag | null = null, animation = 0, focusFrame = 0
    const rows = () => [...container.querySelectorAll<HTMLElement>('[data-item-id]')]
    function mark(slot: number) {
      if (!drag) return
      const all = rows(), previous = drag.to
      drag.to = Math.max(0, Math.min(all.length - 1, slot > drag.from ? slot - 1 : slot))
      all.forEach(row => row.classList.remove('drop-before', 'drop-after'))
      if (slot >= all.length) all.at(-1)?.classList.add('drop-after'); else all[slot]?.classList.add('drop-before')
      ghost.textContent = `${drag.label} → position ${drag.to + 1}`
      if (drag.keyboard && drag.to !== previous) setStatus(`${drag.label}: position ${drag.to + 1} of ${all.length}. Press Space or Enter to drop, or Escape to cancel.`)
    }
    function pointerPosition() {
      if (!drag || drag.keyboard || !drag.active) return
      const bounds = container.getBoundingClientRect(), all = rows()
      drag.validDrop = drag.x >= bounds.left && drag.x <= bounds.right && drag.y >= bounds.top && drag.y <= bounds.bottom
      const slot = all.findIndex(row => drag!.y < row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2)
      mark(slot < 0 ? all.length : slot)
      if (!drag.validDrop) ghost.textContent = `${drag.label} · release inside the ${containerName} to place`
      ghost.style.left = `${Math.max(8, Math.min(drag.x + 14, innerWidth - ghost.offsetWidth - 8))}px`
      ghost.style.top = `${Math.max(8, Math.min(drag.y + 14, innerHeight - ghost.offsetHeight - 8))}px`
    }
    function animate() {
      if (!drag || drag.keyboard || !drag.active) return
      const bounds = container.getBoundingClientRect()
      if (drag.x >= bounds.left && drag.x <= bounds.right) {
        if (drag.y < 75) window.scrollBy(0, -14); else if (drag.y > innerHeight - 75) window.scrollBy(0, 14)
        if (container.scrollHeight > container.clientHeight) {
          if (drag.y < bounds.top + 35) container.scrollTop -= 12; else if (drag.y > bounds.bottom - 35) container.scrollTop += 12
        }
      }
      pointerPosition(); animation = requestAnimationFrame(animate)
    }
    function activate() {
      if (!drag) return
      drag.active = true; drag.handle.setAttribute('aria-pressed', 'true'); drag.handle.closest('[data-item-id]')?.classList.add('dragging'); ghost.hidden = false
      setStatus(`Picked up ${drag.label}. Choose its new position.`)
      if (drag.keyboard) {
        const bounds = drag.handle.getBoundingClientRect()
        ghost.style.left = `${Math.max(8, Math.min(bounds.left - 180, innerWidth - 360))}px`; ghost.style.top = `${Math.max(8, bounds.top - 45)}px`; mark(drag.from)
      } else animate()
    }
    function finish(apply: boolean, restoreFocus = true) {
      if (!drag) return
      const state = drag; drag = null; cancelAnimationFrame(animation)
      if (state.pointerId !== undefined && state.handle.hasPointerCapture(state.pointerId)) state.handle.releasePointerCapture(state.pointerId)
      state.handle.setAttribute('aria-pressed', 'false'); rows().forEach(row => row.classList.remove('dragging', 'drop-before', 'drop-after')); ghost.hidden = true
      const commit = apply && state.active && (state.keyboard || state.validDrop)
      if (commit && state.from !== state.to) { latest.current.onMove(state.from, state.to); setStatus(announceMove ? `${state.label} moved to position ${state.to + 1}.` : '') }
      else if (state.active) setStatus(commit ? 'Row kept in its original position.' : `Reordering cancelled. The ${orderName} order is unchanged.`)
      if (restoreFocus) focusFrame = requestAnimationFrame(() => container.querySelector<HTMLButtonElement>(`button[data-drag-item="${state.id}"]`)?.focus({ preventScroll: true }))
    }
    const grip = (target: EventTarget | null) => {
      const handle = target instanceof Element ? target.closest<HTMLButtonElement>('button[data-drag-item]') : null
      return handle && !handle.disabled ? handle : null
    }
    function begin(handle: HTMLButtonElement, keyboard: boolean, event?: PointerEvent) {
      finish(false, false); handle.focus({ preventScroll: true })
      const from = latest.current.items.findIndex(item => String(item.id) === handle.dataset.dragItem), item = latest.current.items[from]
      if (!item) return
      drag = { id: item.id, label: item.name, from, to: from, handle, keyboard, active: false, validDrop: true, pointerId: event?.pointerId, x: event?.clientX ?? 0, y: event?.clientY ?? 0, startX: event?.clientX ?? 0, startY: event?.clientY ?? 0 }
      if (event) handle.setPointerCapture(event.pointerId); else activate()
    }
    container.addEventListener('pointerdown', event => { const handle = grip(event.target); if (handle && event.button === 0) { event.preventDefault(); begin(handle, false, event) } }, { signal })
    container.addEventListener('pointermove', event => { if (!drag || drag.keyboard || event.pointerId !== drag.pointerId) return; drag.x = event.clientX; drag.y = event.clientY; if (!drag.active && Math.hypot(drag.x - drag.startX, drag.y - drag.startY) > 4) activate(); if (drag.active) { event.preventDefault(); pointerPosition() } }, { signal })
    container.addEventListener('pointerup', event => { if (drag && !drag.keyboard && event.pointerId === drag.pointerId) { pointerPosition(); finish(true) } }, { signal })
    container.addEventListener('pointercancel', () => finish(false), { signal })
    container.addEventListener('lostpointercapture', () => { if (drag && !drag.keyboard) finish(false) }, { signal })
    container.addEventListener('keydown', event => {
      const handle = grip(event.target)
      if (!handle) return
      if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); if (drag?.keyboard) finish(true); else if (!drag) begin(handle, true); return }
      if (!drag?.keyboard) return
      if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
        event.preventDefault()
        const to = event.key === 'Home' ? 0 : event.key === 'End' ? latest.current.items.length - 1 : Math.max(0, Math.min(latest.current.items.length - 1, drag.to + (event.key === 'ArrowUp' ? -1 : 1)))
        mark(to > drag.from ? to + 1 : to)
      } else if (event.key === 'Tab') finish(false, false)
    }, { signal })
    container.addEventListener('focusout', event => { if (drag?.keyboard && event.target === drag.handle) finish(false, false) }, { signal })
    window.addEventListener('keydown', event => { if (event.key === 'Escape' && drag) { event.preventDefault(); event.stopPropagation(); finish(false) } }, { capture: true, signal })
    window.addEventListener('blur', () => finish(false, false), { signal })
    return () => { controller.abort(); cancelAnimationFrame(animation); cancelAnimationFrame(focusFrame); if (drag) { drag.handle.setAttribute('aria-pressed', 'false'); rows().forEach(row => row.classList.remove('dragging', 'drop-before', 'drop-after')) } ghost.remove() }
  }, [hasRows, disabled, containerName, orderName, announceMove])
  return { scroll, status }
}
