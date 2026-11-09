import type { OverlapRule, Plan } from './pipeline-scheduling'
import type { BaselineActionSource, BaselineState, PipelineVersion } from './pipeline-versions'

export interface VersionSource {
  plans: Plan[]
  rules: OverlapRule[]
  currentBaselineId: string
  editor: { id: string; name: string }
}

export interface PipelineSource extends VersionSource {
  context: { id: string | null; token: string; revision: number; mode?: 'baseline' | 'editing'; originBaseline?: { id: string; name: string; initialContent: string } }
  record: PipelineVersion | null
  dirty: boolean
  readOnly: boolean
  isLive: boolean
  librarySignature: string
}
export type PipelineSaveMode = 'save' | 'saveAs'
export type PipelineOpenResolution = { action: 'discard' } | { action: 'save'; input: { name: string; note: string }; mode: PipelineSaveMode }

export interface ConnectedAdjustment {
  plans: Plan[]
  rules: OverlapRule[]
  initialView: { start: number; end: number }
  background: HTMLElement[]
  returnFocus: HTMLElement
  save: (plans: Plan[], reason: string) => void
  close: () => void
  dirty: (changed: boolean) => void
}

declare global {
  interface Window {
    LTPPTooltips?: {
      bind: (source: HTMLElement, name: string, lines: string[]) => (() => void)
      hide: () => void
      closeWithin: (container: HTMLElement) => void
    }
    LTPPDemo: {
      plans: () => Plan[]
      library: () => { sharedRules: OverlapRule[] }
      updatePlans: (changed: Plan[], expected: Plan[], rules: OverlapRule[], reason: string) => Plan[]
      pipelineSource: () => PipelineSource
      savePipeline: (input: { name: string; note: string }, expected: PipelineSource, mode: PipelineSaveMode) => PipelineVersion
      openPipeline: (target: PipelineVersion, expected: PipelineSource, resolution?: PipelineOpenResolution) => PipelineVersion
      editBaseline: (target: PipelineVersion, expected: PipelineSource, resolution?: PipelineOpenResolution) => PipelineVersion
      viewLivePipeline: (expected: PipelineSource, resolution?: PipelineOpenResolution) => PipelineSource
      preparePipelineEntry: (resume?: boolean) => PipelineSource
      go: (url: string) => void
      savedVersions: () => PipelineVersion[]
      baselineState: () => BaselineState
      versionRecords: () => { versions: PipelineVersion[]; baseline: BaselineState }
      baselineActionSource: (id: string) => BaselineActionSource
      discardPipelineChanges: (expected: PipelineSource) => PipelineSource
      confirmBaseline: (id: string, rationale: string | undefined, expected: BaselineActionSource) => PipelineVersion
      setDirty: (check: () => boolean) => void
      error: (message: string) => void
    }
  }
}
