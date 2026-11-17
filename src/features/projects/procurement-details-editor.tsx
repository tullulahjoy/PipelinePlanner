import { useState } from 'react'
import type { ProjectForm } from '../../data/schemas.ts'
import { Dialog, ErrorMessage } from '../../ui/dialog.tsx'

export function ProcurementDetailsEditor({ values, onClose, onApply }: { values: ProjectForm; onClose: () => void; onApply: (details: Pick<ProjectForm, 'name' | 'anchorDate' | 'anchorId'>) => void }) {
  const [draft, setDraft] = useState({ name: values.name, anchorDate: values.anchorDate, anchorId: values.anchorId })
  const [error, setError] = useState('')
  return <Dialog title="Edit procurement details" onClose={onClose}><label className="field">Procurement name<input data-autofocus value={draft.name} maxLength={150} onChange={event => setDraft({ ...draft, name: event.target.value })} /></label><label className="field">Anchor date<input type="date" value={draft.anchorDate} onChange={event => setDraft({ ...draft, anchorDate: event.target.value })} /></label><label className="field">Anchor milestone<select value={draft.anchorId} onChange={event => setDraft({ ...draft, anchorId: Number(event.target.value) })}>{values.phases.filter(item => item.kind === 'milestone').map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><ErrorMessage message={error} /><div className="actions"><button type="button" className="button" onClick={onClose}>Cancel</button><button type="button" className="button primary" onClick={() => { if (!draft.name.trim() || !draft.anchorDate || !draft.anchorId) { setError('Enter a procurement name, anchor date and milestone.'); return } onApply({ ...draft, name: draft.name.trim() }) }}>Use these details</button></div></Dialog>
}
