/** Prototype-only saved-rule attribution, sharing schedule summaries with the application. */
import { findClashes } from './pipeline-scheduling.ts'
import type { Clash, OverlapRule } from '../domain/scheduling.ts'
import { findingIdentity } from '../domain/comparison.ts'
import { compareVersionFindings } from './pipeline-versions.ts'
import type { PipelineVersion } from './pipeline-versions.ts'

export { christmasExplanation, projectComparisons as procurementComparisons, findingIdentity } from '../domain/comparison.ts'

const rulePair = (rule: OverlapRule) => JSON.stringify([rule.a ?? rule.sourceId, rule.b ?? (rule.kind === 'same' ? rule.sourceId : rule.target)].sort())
/** Match effective checks by phase pair, not arbitrary saved rule IDs. First rule wins, as in findClashes. */
export function checkingRuleDifferences(before: PipelineVersion, after: PipelineVersion) {
  const effective = (rules: OverlapRule[]) => { const map = new Map<string, OverlapRule>(); rules.forEach(rule => { const key = rulePair(rule); if (!map.has(key)) map.set(key, rule) }); return map }
  const oldRules = effective(before.rules), newRules = effective(after.rules)
  return [...new Set([...oldRules.keys(), ...newRules.keys()])].flatMap(key => {
    const previous = oldRules.get(key), next = newRules.get(key)
    if (previous && next && previous.severity === next.severity && (previous.reason ?? '') === (next.reason ?? '')) return []
    return [{ key, before: previous, after: next }]
  })
}
const findingSignature = (finding?: Clash) => finding ? JSON.stringify([finding.severity, finding.reason]) : ''
export function comparisonFindings(before: PipelineVersion, after: PipelineVersion) {
  // Counterfactual checks isolate rule effects from date effects. A global rule
  // change does not label unrelated findings as caused by different rules.
  const oldWithOtherRules = new Map(findClashes(before.plans, after.rules).map(f => [findingIdentity(f), f]))
  const newWithOtherRules = new Map(findClashes(after.plans, before.rules).map(f => [findingIdentity(f), f]))
  return compareVersionFindings(before, after).map(change => {
    const finding = (change.after ?? change.before)!, identity = findingIdentity(finding)
    const rulesAffectFinding = findingSignature(change.before) !== findingSignature(oldWithOtherRules.get(identity)) || findingSignature(change.after) !== findingSignature(newWithOtherRules.get(identity))
    return { ...change, finding, rulesAffectFinding, pair: JSON.stringify([finding.firstPlan, finding.secondPlan].sort()), severity: change.before?.severity === 'critical' || change.after?.severity === 'critical' ? 'critical' as const : 'warning' as const }
  })
}

