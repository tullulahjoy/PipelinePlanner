import { useState } from 'react'
import type { Library, LibraryPhase } from '../../data/schemas.ts'
import { Dialog } from '../../ui/dialog.tsx'

export function RuleSummary({ library, phaseId }: { library: Library; phaseId: string }) {
  const rules = library.rules.filter(rule => rule.a === phaseId || rule.b === phaseId)
  return rules.length ? <ul className="shared-rule-summary">{rules.map(rule => <li key={rule.id}><span className={`severity ${rule.severity}`}>{rule.severity === 'critical' ? 'Critical clash' : 'Warning'}</span> {library.phases.find(phase => phase.id === (rule.a === phaseId ? rule.b : rule.a))?.name}</li>)}</ul> : <p className="supporting-text">No clash-checking rules are set for this Library phase.</p>
}

export function CompactRuleSummary({ library, phaseId }: { library: Library; phaseId: string }) {
  const rules = library.rules.filter(rule => rule.a === phaseId || rule.b === phaseId)
  if (!rules.length) return null
  const ordered = [...rules].sort((a, b) => Number(b.severity === 'critical') - Number(a.severity === 'critical'))
  const descriptions = ordered.map(rule => <p key={rule.id} className="phase-rule-line">If this phase overlaps with {library.phases.find(phase => phase.id === (rule.a === phaseId ? rule.b : rule.a))?.name ?? 'the linked phase'} in another procurement, a <strong className={rule.severity}>{rule.severity === 'critical' ? 'critical clash' : 'warning'}</strong> will be flagged.</p>)
  return <details className="phase-rule-summary"><summary>{(['critical', 'warning'] as const).map(severity => {
    const count = rules.filter(rule => rule.severity === severity).length
    return count > 0 && <span className={severity} key={severity}>{count} {severity === 'critical' ? 'critical clash' : 'warning'} {count === 1 ? 'rule' : 'rules'}</span>
  })}</summary>{descriptions}</details>
}

export function PhaseBrowser({ library, onClose, onCreate, onAdd }: { library: Library; onClose: () => void; onCreate: (name: string) => void; onAdd: (phase: LibraryPhase, inherited: boolean) => void }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState('')
  const phase = library.phases.find(item => item.id === selected)
  const [weeks, setWeeks] = useState<number | ''>('')
  const [inherited, setInherited] = useState(true)
  const [name, setName] = useState('')
  const query = search.trim()
  const visible = library.phases.filter(item => item.name.toLowerCase().includes(query.toLowerCase()))
  const noMatches = query.length > 0 && visible.length === 0
  return <Dialog title="Add phase" description="Browse or search the Library, then select a phase to review it. Create a new phase if none meets your need." onClose={onClose} className="phase-browser" footer={<><button type="button" className="button" onClick={onClose}>Cancel</button><button type="button" className="button primary" disabled={!phase || !name.trim() || !Number.isInteger(weeks) || Number(weeks) < 1 || Number(weeks) > 5200} onClick={() => { if (phase) onAdd({ ...phase, name: name.trim(), weeks: Number(weeks) }, inherited) }}>Add phase to procurement</button></>}>
    <label className="field">Search phases in the Library<input data-autofocus type="search" placeholder="Search by phase name" value={search} onChange={event => { const query = event.target.value; setSearch(query); if (phase && !phase.name.toLowerCase().includes(query.trim().toLowerCase())) { setSelected(''); setName(''); setWeeks('') } }} /></label>
    <fieldset className="phase-browser-options"><legend>Phases in the Library</legend>{!noMatches && <p className="supporting-text" role="status">Showing {visible.length} of {library.phases.length} Library phases.</p>}
      <div className="phase-browser-results">{visible.map(item => <label className="phase-browser-choice" key={item.id}><input type="radio" name="library-phase-choice" value={item.id} checked={selected === item.id} onChange={() => { setSelected(item.id); setName(item.name); setWeeks(item.weeks); setInherited(true) }} /><span className="colour-swatch" style={{ background: item.color }} aria-hidden="true" /><strong>{item.name}</strong><small>{item.weeks} weeks</small></label>)}</div>
      {noMatches ? <div className="phase-browser-no-results" role="status"><h3>No phases found for “{query}”</h3><p>Create a reusable phase for this procurement and future schedules.</p><button type="button" className="button primary" onClick={() => onCreate(query)}>+ Create “{query}”</button></div> : !visible.length && <p>Your Library is empty. Create a phase to begin.</p>}
    </fieldset>
    {!noMatches && <div className="phase-browser-create"><p>If nothing here meets your need, create a new phase.</p><button type="button" className="button" onClick={() => onCreate(query)}>+ Create a new phase</button></div>}
    {phase && <div className="phase-browser-details"><p>You can change a phase’s duration for this procurement without creating a new Library phase.</p><div className="phase-browser-fields"><label className="field">Name in this procurement<input value={name} maxLength={150} onChange={event => setName(event.target.value)} /></label><label className="field">Duration in whole weeks<input type="number" min={1} max={5200} value={weeks} onChange={event => { setWeeks(event.target.value === '' ? '' : Number(event.target.value)); setInherited(false) }} /></label></div><p>Library default: {phase.weeks} weeks for '{phase.name}'. {inherited ? 'You can override the name or duration for this procurement without changing the Library.' : 'This duration is overridden for this procurement.'} Shared clash-checking rules remain linked to the Library phase.</p><h3>Clash-checking rules</h3><RuleSummary library={library} phaseId={phase.id} /><p>Preview the schedule after adding a phase or milestone to calculate its dates and review its effect.</p></div>}
  </Dialog>
}
