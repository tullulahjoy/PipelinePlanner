// Ported from the approved framework-independent prototype tooltip controller.
// Listeners live only while timeline sources are mounted; no demo data is used.
import type { DetailBinder } from './timeline-segments.tsx'
import './timeline-details.css'

type Tooltip = { card: HTMLDivElement; source: HTMLElement; pin: HTMLButtonElement; status: HTMLSpanElement; pinned: boolean; timer: ReturnType<typeof setTimeout> | undefined }
let details: ReturnType<typeof createTimelineDetails> | undefined
let bindings = 0
export const bindTimelineDetails: DetailBinder = (source, name, lines) => {
  const api = details ??= createTimelineDetails()
  const unbind = api.bind(source, name, lines)
  bindings++
  return () => { unbind(); if (--bindings === 0) { api.dispose(); details = undefined } }
}
export function closeTimelineDetails() { details?.closeAll() }

function createTimelineDetails() {
  'use strict';
  const open = new Set<Tooltip>(), bySource = new WeakMap<HTMLElement, Tooltip>();
  const events = new AbortController();
  let current: Tooltip | null = null, serial = 0, layer = 300, suppressShow = false;
  const margin = 12, delay = 220;
  const element = <T extends keyof HTMLElementTagNameMap>(tag: T, className?: string, text?: string) => {
    const result = document.createElement(tag);
    if (className) result.className = className;
    if (text !== undefined) result.textContent = text;
    return result;
  };
  function icon(path: string) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const shape = document.createElementNS(svg.namespaceURI, 'path');
    shape.setAttribute('d', path);
    svg.append(shape);
    return svg;
  }
  function close(state: Tooltip | null | undefined, restoreFocus = false) {
    if (!state || !open.has(state)) return;
    clearTimeout(state.timer);
    open.delete(state);
    bySource.delete(state.source);
    if (current === state) current = null;
    state.source.removeAttribute('aria-describedby');
    state.source.removeAttribute('aria-controls');
    state.source.setAttribute('aria-expanded', 'false');
    state.card.remove();
    if (restoreFocus && state.source.isConnected) {
      suppressShow = true;
      state.source.focus({ preventScroll: true });
      suppressShow = false;
    }
  }
  function hide() { close(current); }
  function scheduleHide(state: Tooltip | undefined) {
    if (!state || state.pinned) return;
    clearTimeout(state.timer);
    state.timer = setTimeout(() => {
      if (!state.pinned && !state.card.matches(':hover') && !state.source.matches(':hover') &&
          !state.card.contains(document.activeElement) && document.activeElement !== state.source) close(state);
    }, delay);
  }
  function position(state: Tooltip) {
    const card = state.card, source = state.source.getBoundingClientRect();
    const width = card.offsetWidth, height = card.offsetHeight;
    const maxX = Math.max(margin, innerWidth - width - margin);
    const maxY = Math.max(margin, innerHeight - height - margin);
    const clampX = (x: number) => Math.max(margin, Math.min(x, maxX));
    const clampY = (y: number) => Math.max(margin, Math.min(y, maxY));
    const centre = clampX(source.left + source.width / 2 - width / 2);
    const candidates = [[centre, clampY(source.bottom + 10)], [centre, clampY(source.top - height - 10)]];
    for (let y = margin; y <= maxY; y += height + margin) {
      for (let x = margin; x <= maxX; x += width + margin) candidates.push([x, y]);
      candidates.push([maxX, y]);
    }
    candidates.push([margin, maxY], [maxX, maxY]);
    const occupied = [...open].filter(other => other !== state && other.card.parentNode === card.parentNode).map(other => other.card.getBoundingClientRect());
    const score = ([x, y]: number[]) => occupied.reduce((sum, rect) => sum +
      Math.max(0, Math.min(x + width + 6, rect.right) - Math.max(x - 6, rect.left)) *
      Math.max(0, Math.min(y + height + 6, rect.bottom) - Math.max(y - 6, rect.top)), 0);
    let best = candidates[0], bestScore = score(best);
    for (const candidate of candidates) {
      const value = score(candidate);
      if (value < bestScore) { best = candidate; bestScore = value; }
      if (bestScore === 0) break;
    }
    card.style.left = best[0] + 'px';
    card.style.top = best[1] + 'px';
  }
  function setPinned(state: Tooltip, pinned: boolean) {
    clearTimeout(state.timer);
    if (!pinned && current && current !== state) close(current);
    state.pinned = pinned;
    state.card.dataset.pinned = String(pinned);
    state.pin.setAttribute('aria-pressed', String(pinned));
    state.pin.setAttribute('aria-label', pinned ? 'Unpin tooltip' : 'Pin tooltip');
    state.pin.title = pinned ? 'Unpin tooltip' : 'Pin tooltip';
    state.status.textContent = pinned ? 'Pinned' : 'Timeline details';
    if (pinned && current === state) current = null;
    if (!pinned) { current = state; scheduleHide(state); }
  }
  function show(source: HTMLElement, name: string, lines: string[]) {
    if (suppressShow) return;
    const existing = bySource.get(source);
    if (existing) {
      clearTimeout(existing.timer);
      existing.card.style.zIndex = String(++layer);
      return existing;
    }
    hide();
    const id = 'timeline-tooltip-' + ++serial;
    const card = element('div', 'timeline-tooltip');
    card.id = id;
    // Buttons make these non-modal dialogs, rather than ARIA tooltips.
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', name + ': timeline details');
    card.setAttribute('aria-describedby', id + '-body');
    card.dataset.pinned = 'false';
    card.style.zIndex = String(++layer);
    const toolbar = element('div', 'timeline-tooltip-toolbar');
    const status = element('span', 'timeline-tooltip-status', 'Timeline details');
    const pin = element('button', 'timeline-tooltip-control');
    pin.type = 'button';
    pin.setAttribute('aria-label', 'Pin tooltip');
    pin.setAttribute('aria-pressed', 'false');
    pin.title = 'Pin tooltip';
    pin.append(icon('M16 3l5 5-4 1-3 6-2 2-5-5 2-2 6-3z M7 17l-4 4'));
    const dismiss = element('button', 'timeline-tooltip-control');
    dismiss.type = 'button';
    dismiss.setAttribute('aria-label', 'Close tooltip');
    dismiss.title = 'Close tooltip';
    dismiss.append(icon('M6 6l12 12 M18 6L6 18'));
    const body = element('div', 'timeline-tooltip-body');
    body.id = id + '-body';
    body.append(element('strong', '', name + ':'));
    lines.forEach(line => {
      const severity = /^(Warning|Critical clash):\s*/.exec(line);
      if (!severity) { body.append(element('div', '', line)); return; }
      const notice = element('div', 'timeline-tooltip-notice' + (severity[1] === 'Critical clash' ? ' critical' : ''));
      notice.append(element('strong', '', severity[1] + ':'), document.createTextNode(' ' + line.slice(severity[0].length)));
      body.append(notice);
    });
    toolbar.append(status, pin, dismiss);
    card.append(toolbar, body);
    const state: Tooltip = { card, source, pin, status, pinned: false, timer: undefined };
    current = state;
    open.add(state);
    bySource.set(source, state);
    (source.closest('[data-tooltip-container]') || document.body).append(card);
    source.setAttribute('aria-describedby', body.id);
    source.setAttribute('aria-controls', id);
    source.setAttribute('aria-expanded', 'true');
    position(state);
    pin.addEventListener('click', () => setPinned(state, !state.pinned));
    dismiss.addEventListener('click', () => close(state, card.contains(document.activeElement)));
    card.addEventListener('pointerenter', () => clearTimeout(state.timer));
    card.addEventListener('pointerleave', () => scheduleHide(state));
    card.addEventListener('focusin', () => clearTimeout(state.timer));
    card.addEventListener('focusout', () => scheduleHide(state));
    card.addEventListener('pointerdown', () => { card.style.zIndex = String(++layer); });
    card.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(state, true); }
      if (event.key === 'Tab' && event.shiftKey && event.target === pin && source.isConnected) {
        event.preventDefault();
        suppressShow = true;
        source.focus({ preventScroll: true });
        suppressShow = false;
      }
    });
    return state;
  }
  function bind(source: HTMLElement, name: string, lines: string[]) {
    const getName = () => name;
    source.setAttribute('aria-label', getName() + ': ' + lines.join(' '));
    source.setAttribute('aria-haspopup', 'dialog');
    source.setAttribute('aria-expanded', 'false');
    const inspect = () => show(source, getName(), lines);
    source.addEventListener('pointerenter', inspect);
    source.addEventListener('focus', inspect);
    source.addEventListener('click', inspect);
    const leave = () => scheduleHide(bySource.get(source));
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && !event.shiftKey && bySource.has(source)) {
        event.preventDefault();
        bySource.get(source)!.pin.focus();
      }
    };
    source.addEventListener('pointerleave', leave);
    source.addEventListener('blur', leave);
    source.addEventListener('keydown', keydown);
    return () => {
      close(bySource.get(source));
      source.removeEventListener('pointerenter', inspect);
      source.removeEventListener('focus', inspect);
      source.removeEventListener('click', inspect);
      source.removeEventListener('pointerleave', leave);
      source.removeEventListener('blur', leave);
      source.removeEventListener('keydown', keydown);
    };
  }
  document.addEventListener('pointerdown', event => {
    if (current && event.target instanceof Node && !current.source.contains(event.target) && !current.card.contains(event.target)) hide();
  }, { signal: events.signal });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !event.defaultPrevented && current) { event.preventDefault(); hide(); }
  }, { signal: events.signal });
  window.addEventListener('scroll', event => {
    if (event.target instanceof Element && event.target.closest('.timeline-tooltip')) return;
    // Focusing a source can scroll its timeline/page. Keep its keyboard-accessible
    // details available instead of closing them immediately after focus/click.
    if (current && (document.activeElement === current.source || current.card.contains(document.activeElement))) position(current);
    else hide();
  }, { capture: true, signal: events.signal });
  window.addEventListener('resize', () => {
    hide();
    open.forEach(state => {
      const rect = state.card.getBoundingClientRect();
      state.card.style.left = Math.max(margin, Math.min(rect.left, innerWidth - rect.width - margin)) + 'px';
      state.card.style.top = Math.max(margin, Math.min(rect.top, innerHeight - rect.height - margin)) + 'px';
    });
  }, { signal: events.signal });
  function closeWithin(container: HTMLElement){[...open].filter(state=>container.contains(state.source)).forEach(state=>close(state));}
  const closeAll = () => [...open].forEach(state => close(state));
  return { bind, hide, closeWithin, closeAll, dispose: () => { closeAll(); events.abort(); } };
}
