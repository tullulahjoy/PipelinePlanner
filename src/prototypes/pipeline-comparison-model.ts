/** Read-only presentation models for the general saved-pipeline comparison. */
import { DAY, activeDays, dateMovementSummary, findClashes } from './pipeline-scheduling.ts'
import type { Clash, OverlapRule, Phase } from './pipeline-scheduling.ts'
import { compareVersionFindings, compareVersionSchedules, comparisonMovementSummary, scheduleDifferenceLabel } from './pipeline-versions.ts'
import type { PipelineVersion, VersionChange } from './pipeline-versions.ts'

export function christmasExplanation(previous?: Phase, next?: Phase): string | null {
  if (!previous || !next || previous.kind !== 'phase' || next.kind !== 'phase') return null
  const paused = (phase: Phase) => (phase.e - phase.s) / DAY - activeDays(phase.s, phase.e)
  const before = paused(previous), after = paused(next)
  if (before === after) return null
  const explanation = !before ? 'Now includes the Christmas break' : !after ? 'No longer includes the Christmas break' : 'The amount of Christmas break within this phase changed'
  return `${explanation}; ${previous.weeks === next.weeks ? 'active duration unchanged' : `active duration also changed from ${previous.weeks} to ${next.weeks} weeks`}.`
}

const phaseId = (change: VersionChange) => Number(change.id.slice(change.id.lastIndexOf(':') + 1))
export function procurementComparisons(before: PipelineVersion, after: PipelineVersion) {
  const changes = compareVersionSchedules(before, after)
  const ids = [...new Set(changes.map(change => change.planId))]
  return ids.map(id => {
    const previous = before.plans.find(plan => plan.id === id), next = after.plans.find(plan => plan.id === id)
    const entries = changes.filter(change => change.planId === id)
    const notes = new Map<string, string>()
    for (const entry of entries.filter(change => change.kind === 'phase')) {
      const note = christmasExplanation(previous?.phases.find(p => p.id === phaseId(entry)), next?.phases.find(p => p.id === phaseId(entry)))
      if (note) notes.set(entry.id, note)
    }
    const labels: string[] = [], summaries: string[] = []
    if (!previous || !next) {
      labels.push(`Only in ${next ? after.name : before.name}`)
      summaries.push(`This procurement is only in ${next ? after.name : before.name}.`)
      return { id, name: (next ?? previous)!.name, entries, notes, labels, summaries }
    }
    const start = (plan: typeof previous) => plan.phases.length ? Math.min(...plan.phases.map(phase => phase.s)) : null
    const oldStart = start(previous), newStart = start(next)
    if (oldStart !== null && newStart !== null && oldStart !== newStart) {
      const movement = dateMovementSummary({ planId: id, planName: next.name, label: 'Start', kind: 'milestone', beforeStart: oldStart, beforeEnd: oldStart, afterStart: newStart, afterEnd: newStart })[0]
      labels.push(`Begins ${movement}`)
    }
    const phaseChanges = entries.filter(change => change.kind === 'phase')
    if (phaseChanges.some(change => change.details.includes('Duration changed') && change.before?.weeks !== undefined && change.after?.weeks !== undefined)) labels.push('Phase durations altered')
    if (phaseChanges.some(change => !change.before)) labels.push('Activities added')
    if (phaseChanges.some(change => !change.after)) labels.push('Activities removed')
    const dateEntries = phaseChanges.filter(change => change.before?.start !== undefined && change.after?.start !== undefined)
    const movements = new Set(dateEntries.map(change => `${change.after!.start! - change.before!.start!}:${change.after!.end! - change.before!.end!}`))
    if (movements.size > 1 || dateEntries.some(change => change.details.includes('Dates changed')) && next.phases.some(phase => !dateEntries.some(change => phaseId(change) === phase.id))) labels.push('Phase timings altered')
    if (entries.some(change => change.kind === 'anchor')) labels.push('Anchor altered')
    if (entries.some(change => change.kind === 'gap')) labels.push('Gaps altered')
    if (entries.some(change => change.details.includes('Name changed'))) labels.push('Names altered')
    if (entries.some(change => change.details.includes('Order changed'))) labels.push('Activity order altered')
    if (!labels.length) labels.push('Activity details altered')

    // Only combine adjacent identities in BOTH saved orders, with equal start/finish
    // movement, unchanged work duration and no other edited properties.
    const eligible = (change: VersionChange) => change.kind === 'phase' && change.status === 'changed'
      && change.details.length === 1 && change.details[0] === 'Dates changed' && !notes.has(change.id)
      && change.before!.weeks === change.after!.weeks
      && change.after!.start! - change.before!.start! === change.after!.end! - change.before!.end!
    const ordered = [...phaseChanges.filter(change => change.after).sort((a, b) => next.phases.findIndex(p => p.id === phaseId(a)) - next.phases.findIndex(p => p.id === phaseId(b))), ...phaseChanges.filter(change => !change.after)]
    for (let i = 0; i < ordered.length;) {
      const first = ordered[i]; let last = i
      if (eligible(first)) while (last + 1 < ordered.length) {
        const current = ordered[last], candidate = ordered[last + 1]
        if (!eligible(candidate) || candidate.after!.start! - candidate.before!.start! !== first.after!.start! - first.before!.start!) break
        if (next.phases.findIndex(p => p.id === phaseId(candidate)) !== next.phases.findIndex(p => p.id === phaseId(current)) + 1 || previous.phases.findIndex(p => p.id === phaseId(candidate)) !== previous.phases.findIndex(p => p.id === phaseId(current)) + 1) break
        last++
      }
      const movement = comparisonMovementSummary(first, before.name, after.name).join('; ')
      if (last > i) summaries.push(`${first.label} to ${ordered[last].label} moved ${movement}.`)
      else if (!first.before || !first.after) summaries.push(`${first.label}: ${scheduleDifferenceLabel(first, before.name, after.name)}.`)
      else {
        const parts: string[] = []
        if (first.details.includes('Duration changed') && first.before.weeks !== undefined && first.after.weeks !== undefined) parts.push(`active duration ${first.after.weeks > first.before.weeks ? 'increased' : 'decreased'} from ${first.before.weeks} to ${first.after.weeks} weeks`)
        if (first.details.includes('Dates changed')) parts.push(movement)
        const other = first.details.filter(detail => detail !== 'Dates changed' && detail !== 'Duration changed').map(detail => detail.toLowerCase())
        parts.push(...other)
        summaries.push(`${first.label}: ${parts.join('; ')}.${notes.has(first.id) ? ` ${notes.get(first.id)}` : ''}`)
      }
      i = last + 1
    }
    for (const entry of entries.filter(change => change.kind !== 'phase')) {
      if (entry.kind === 'anchor') summaries.push(`${entry.label}: ${comparisonMovementSummary(entry, before.name, after.name).join('; ')}${entry.before?.name !== entry.after?.name ? `; ${entry.before?.name} to ${entry.after?.name}` : ''}.`)
      else if (entry.kind === 'gap') summaries.push(`${entry.label}: ${!entry.before || !entry.after ? scheduleDifferenceLabel(entry, before.name, after.name) : comparisonMovementSummary(entry, before.name, after.name).join('; ')}.`)
      else summaries.push(`Procurement renamed from ${previous.name} to ${next.name}.`)
    }
    return { id, name: next.name, entries, notes, labels, summaries }
  })
}

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
export const findingIdentity = (finding: Clash) => JSON.stringify([[finding.firstPlan, finding.firstPhase], [finding.secondPlan, finding.secondPhase]].sort((a, b) => String(a).localeCompare(String(b))))
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

