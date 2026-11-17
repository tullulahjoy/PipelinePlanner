/** Legacy version metadata and saved-rule behaviour, backed by shared comparisons. */
import { findClashes } from './pipeline-scheduling.ts'
import type { OverlapRule, Plan } from '../domain/scheduling.ts'
import { compareFindings } from '../domain/comparison.ts'
import type { PipelineSource } from './pipeline-connected-types'

export { EXAMPLE_VERSIONS } from './pipeline-version-fixtures.ts'
export { compareSchedules as compareVersionSchedules, comparisonMovementSummary, scheduleDifferenceLabel, findingDifferenceLabel } from '../domain/comparison.ts'
export type { ComparisonValue, VersionChange } from '../domain/comparison.ts'

export interface PipelineVersion {
  id: string
  number: number
  revision?: number
  name: string
  note: string
  savedAt: string
  savedBy: string
  savedById?: string
  isExample?: boolean
  isPreview?: boolean
  status: 'saved' | 'current' | 'previous'
  plans: Plan[]
  rules: OverlapRule[]
  confirmation?: BaselineConfirmation
}
export interface BaselineConfirmation { at: string; by: string; byId: string; fromBaselineId?: string; rationale?: string }
export interface BaselineEvent {
  id: string; type: 'confirmed'; versionId: string; previousBaselineId: string | null
  rationale?: string; at: string; by: string; byId: string
}
export interface BaselineState { currentId: string; events: BaselineEvent[] }
export interface BaselineActionSource { version: PipelineVersion; baseline: PipelineVersion; currentBaselineId: string; working: PipelineSource; editor: { id: string; name: string } }
export const statusLabel: Record<PipelineVersion['status'], string> = {
  saved: 'Saved pipeline', current: 'Current baseline · Live pipeline', previous: 'Previous baseline',
}

export const compareVersionAge = (first: PipelineVersion, second: PipelineVersion) =>
  Date.parse(first.savedAt) - Date.parse(second.savedAt) || first.number - second.number || first.id.localeCompare(second.id)

/** General comparisons retain the user's selections, regardless of save date. */
export function comparisonPair(versions: PipelineVersion[], firstId: string, secondId: string) {
  const first = versions.find(version => version.id === firstId)
  const second = versions.find(version => version.id === secondId)
  if (!first || !second || versions.length < 2) return null
  return { before: first, after: first.id === second.id ? versions.find(version => version.id !== first.id)! : second }
}

export function ruleDifferenceLabel(before: OverlapRule | undefined, after: OverlapRule | undefined, firstName: string, secondName: string) {
  if (!before) return `Only in ${secondName}`
  if (!after) return `Only in ${firstName}`
  const phases = (rule: OverlapRule) => [rule.a ?? rule.sourceId, rule.b ?? (rule.kind === 'same' ? rule.sourceId : rule.target)].sort().join('|')
  const fields = [phases(before) !== phases(after) ? 'phases' : '', before.severity !== after.severity ? 'severity' : '', (before.reason ?? '') !== (after.reason ?? '') ? 'explanation' : ''].filter(Boolean)
  return `Different ${fields.join(', ') || 'rule details'}`
}


/** Saved-rule snapshots remain a prototype-only policy. */
export function compareVersionFindings(before: PipelineVersion, after: PipelineVersion) {
  return compareFindings(findClashes(before.plans, before.rules), findClashes(after.plans, after.rules))
}

export function ruleDescription(rule: OverlapRule, version: PipelineVersion) {
  const first = rule.a ?? rule.sourceId, second = rule.b ?? (rule.kind === 'same' ? rule.sourceId : rule.target)
  const name = (id?: string) => version.plans.flatMap(plan => plan.phases).find(phase => phase.libraryPhaseId === id)?.name ?? id ?? 'Unknown phase'
  return first === second ? `${name(first)} phases in different procurements` : `${name(first)} and ${name(second)} in different procurements`
}
const ruleSignature = (rule: OverlapRule) => JSON.stringify({
  phases: [rule.a ?? rule.sourceId, rule.b ?? (rule.kind === 'same' ? rule.sourceId : rule.target)].sort(), severity: rule.severity, reason: rule.reason ?? '',
})
export function compareVersionRules(before: PipelineVersion, after: PipelineVersion) {
  const oldRules = new Map(before.rules.map(rule => [rule.id, rule])), newRules = new Map(after.rules.map(rule => [rule.id, rule]))
  return [...new Set([...oldRules.keys(), ...newRules.keys()])].flatMap(id => {
    const previous = oldRules.get(id), next = newRules.get(id)
    if (previous && next && ruleSignature(previous) === ruleSignature(next)) return []
    return [{ id, before: previous, after: next, status: !previous ? 'Added' : !next ? 'Removed' : 'Changed' }]
  })
}
