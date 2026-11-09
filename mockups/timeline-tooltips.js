/* Shared, independently pinnable timeline details. No scheduling or saved state. */
(function () {
  'use strict';
  const open = new Set(), bySource = new WeakMap();
  let current = null, serial = 0, layer = 300, suppressShow = false;
  const margin = 12, delay = 220;
  const element = (tag, className, text) => {
    const result = document.createElement(tag);
    if (className) result.className = className;
    if (text !== undefined) result.textContent = text;
    return result;
  };
  function icon(path) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const shape = document.createElementNS(svg.namespaceURI, 'path');
    shape.setAttribute('d', path);
    svg.append(shape);
    return svg;
  }
  function close(state, restoreFocus = false) {
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
  function scheduleHide(state) {
    if (!state || state.pinned) return;
    clearTimeout(state.timer);
    state.timer = setTimeout(() => {
      if (!state.pinned && !state.card.matches(':hover') && !state.source.matches(':hover') &&
          !state.card.contains(document.activeElement) && document.activeElement !== state.source) close(state);
    }, delay);
  }
  function position(state) {
    const card = state.card, source = state.source.getBoundingClientRect();
    const width = card.offsetWidth, height = card.offsetHeight;
    const maxX = Math.max(margin, innerWidth - width - margin);
    const maxY = Math.max(margin, innerHeight - height - margin);
    const clampX = x => Math.max(margin, Math.min(x, maxX));
    const clampY = y => Math.max(margin, Math.min(y, maxY));
    const centre = clampX(source.left + source.width / 2 - width / 2);
    const candidates = [[centre, clampY(source.bottom + 10)], [centre, clampY(source.top - height - 10)]];
    for (let y = margin; y <= maxY; y += height + margin) {
      for (let x = margin; x <= maxX; x += width + margin) candidates.push([x, y]);
      candidates.push([maxX, y]);
    }
    candidates.push([margin, maxY], [maxX, maxY]);
    const occupied = [...open].filter(other => other !== state && other.card.parentNode === card.parentNode).map(other => other.card.getBoundingClientRect());
    const score = ([x, y]) => occupied.reduce((sum, rect) => sum +
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
  function setPinned(state, pinned) {
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
  function show(source, name, lines) {
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
    const state = { card, source, pin, status, pinned: false, timer: null };
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
  function bind(source, name, lines) {
    const getName = () => typeof name === 'function' ? name() : name;
    source.setAttribute('aria-label', getName() + ': ' + lines.join(' '));
    source.setAttribute('aria-haspopup', 'dialog');
    source.setAttribute('aria-expanded', 'false');
    const inspect = () => show(source, getName(), lines);
    source.addEventListener('pointerenter', inspect);
    source.addEventListener('focus', inspect);
    source.addEventListener('click', inspect);
    const leave = () => scheduleHide(bySource.get(source));
    const keydown = event => {
      if (event.key === 'Tab' && !event.shiftKey && bySource.has(source)) {
        event.preventDefault();
        bySource.get(source).pin.focus();
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
    if (current && !current.source.contains(event.target) && !current.card.contains(event.target)) hide();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
  window.addEventListener('scroll', event => {
    if (!event.target.closest?.('.timeline-tooltip')) hide();
  }, true);
  window.addEventListener('resize', () => {
    hide();
    open.forEach(state => {
      const rect = state.card.getBoundingClientRect();
      state.card.style.left = Math.max(margin, Math.min(rect.left, innerWidth - rect.width - margin)) + 'px';
      state.card.style.top = Math.max(margin, Math.min(rect.top, innerHeight - rect.height - margin)) + 'px';
    });
  });
  function closeWithin(container){[...open].filter(state=>container.contains(state.source)).forEach(state=>close(state));}
  window.LTPPTooltips = { bind, hide, closeWithin };
})();
