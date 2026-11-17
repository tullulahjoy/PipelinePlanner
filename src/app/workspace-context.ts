import { useOutletContext } from 'react-router'
import { createContext, useContext } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Acknowledgement, Library, Project, SavedPipeline, WorkspaceData } from '../data/schemas.ts'

export type WorkspaceContext = WorkspaceData & { acceptLibrary: (library: Library) => void }
export const useWorkspace = () => useOutletContext<WorkspaceContext>()

export type WorkingPipeline = { saved: SavedPipeline | null; plans: Project[]; acknowledgements: Acknowledgement[] }
export type LibraryDurationChange = { phaseId: string; name: string; before: number; after: number }
export const PipelineSessionContext = createContext<{
  working: WorkingPipeline | null
  setWorking: Dispatch<SetStateAction<WorkingPipeline | null>>
  resumePath: string
  dirty: boolean
  save: (mode: 'save' | 'saveAs') => void
  reviewDurationChange: (change: LibraryDurationChange) => void
  exitEditing: () => void
  requestMakeLive: (record: SavedPipeline | null) => void
} | null>(null)

export function usePipelineSession() {
  const session = useContext(PipelineSessionContext)
  if (!session) throw new Error('A pipeline plan session requires a workspace.')
  return session
}
