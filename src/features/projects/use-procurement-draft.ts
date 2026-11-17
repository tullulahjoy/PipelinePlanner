import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { ProjectForm } from '../../data/schemas.ts'
import { clearProcurementDraft, writeProcurementDraft } from './procurement-draft.ts'
import type { ProcurementDraft } from './procurement-draft.ts'

export function useProcurementDraft(form: UseFormReturn<ProjectForm>, draft: Omit<ProcurementDraft, 'values' | 'updatedAt' | 'nextId'>, dirty: boolean, getNextId: () => number) {
  const cleared = useRef(false)
  const latest = useRef(() => {})
  const [error, setError] = useState('')
  useLayoutEffect(() => {
    latest.current = () => {
      if (cleared.current || !dirty) return
      try { writeProcurementDraft({ ...draft, nextId: getNextId(), values: form.getValues(), updatedAt: new Date().toISOString() }); setError('') }
      catch { setError('Draft recovery is unavailable in this browser. Keep this tab open and apply your schedule, then save the pipeline plan to retain your work.') }
    }
  })
  useEffect(() => {
    const subscription = form.watch(() => latest.current())
    const flush = () => latest.current()
    window.addEventListener('pagehide', flush)
    window.addEventListener('beforeunload', flush)
    return () => { subscription.unsubscribe(); window.removeEventListener('pagehide', flush); window.removeEventListener('beforeunload', flush) }
  }, [form])
  useEffect(() => { latest.current() }, [draft, dirty])
  return {
    error,
    clear: () => {
      cleared.current = true
      try { clearProcurementDraft(draft.workspaceId, draft.id) }
      catch { setError('The local draft could not be cleared. You may be offered this older draft again on your next visit.') }
    },
  }
}
