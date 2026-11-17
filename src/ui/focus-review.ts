/** Reveal the next review without scrolling an outer modal or the page behind it. */
export function focusReview(heading: HTMLElement | null, section: HTMLElement | null = heading) {
  if (!heading) return
  const target = section ?? heading
  heading.focus({ preventScroll: true })
  for (let pane = target.parentElement; pane; pane = pane.parentElement) {
    if (!/(auto|scroll)/.test(getComputedStyle(pane).overflowY) || pane.scrollHeight <= pane.clientHeight) continue
    const top = pane.scrollTop + target.getBoundingClientRect().top - pane.getBoundingClientRect().top - pane.clientTop
    pane.scrollTo({ top: Math.max(0, top), behavior: 'instant' })
    return
  }
  target.scrollIntoView({ block: 'start', behavior: 'instant' })
}
