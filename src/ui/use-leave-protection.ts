import { createContext, useContext, useId, useLayoutEffect, useRef } from 'react'
import type { Dispatch, SetStateAction } from 'react'

export type UnsavedForm = { id: string; discard: () => void }
export const NavigationGuardContext = createContext<Dispatch<SetStateAction<UnsavedForm | null>> | null>(null)

// One workspace blocker coordinates forms and pipeline changes, including when
// both need review. Register only dirty forms; form values remain in their page.
export function useLeaveProtection(dirty: boolean, onDiscard: () => void) {
  const register = useContext(NavigationGuardContext)
  const id = useId()
  const discard = useRef(onDiscard)
  useLayoutEffect(() => { discard.current = onDiscard })
  useLayoutEffect(() => {
    if (!dirty || !register) return
    register({ id, discard: () => discard.current() })
    return () => register(current => current?.id === id ? null : current)
  }, [dirty, id, register])
}
