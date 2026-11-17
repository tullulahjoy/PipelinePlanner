import { DAY } from './calendar.ts'
import { scheduleAtAnchor } from './scheduling.ts'
import type { Clash, Plan } from './scheduling.ts'

export interface ClashAcknowledgement { signature: string; explanation: string }

/** Calculate a new or edited schedule without altering the caller's working copy. */
export function scheduleProject<T extends Plan>(input: T): T {
  if (!input.name.trim()) throw new Error('Enter a procurement name.')
  if (!Number.isFinite(input.anchor) || input.anchor % DAY) throw new Error('Enter a valid anchor date.')
  if (!input.phases.length) throw new Error('Add phases or milestones to the schedule.')
  if (new Set(input.phases.map(phase => phase.id)).size !== input.phases.length) throw new Error('Schedule items must have distinct identities.')
  if (input.phases.find(phase => phase.id === input.anchorId)?.kind !== 'milestone') throw new Error('Choose a milestone as the anchor.')
  input.phases.forEach((phase, index) => {
    if (!phase.name.trim()) throw new Error(`Enter a name for item ${index + 1}.`)
    if (phase.kind === 'phase' && (!Number.isInteger(phase.weeks) || phase.weeks < 1 || phase.weeks > 5200)) throw new Error(`${phase.name}: enter 1 to 5,200 whole weeks.`)
    if (phase.kind === 'milestone' && phase.weeks !== 0) throw new Error('Milestones have no duration.')
    if (!Number.isInteger(phase.offset) || Math.abs(phase.offset) > 104 || index === 0 && phase.offset !== 0) throw new Error(`${phase.name}: use a whole-week relationship of up to 104 weeks; the first item has no preceding relationship.`)
    if (phase.offset < 0 && -phase.offset > Math.min(phase.weeks, input.phases[index - 1].weeks)) throw new Error(`${phase.name}: an overlap cannot exceed either adjacent phase's duration or overlap a milestone.`)
  })
  const result = structuredClone(input)
  scheduleAtAnchor(result, 0, result.phases.length - 1)
  return result
}

export function criticalSignature(finding: Clash): string {
  return JSON.stringify([
    [[finding.firstPlan, finding.firstPhase], [finding.secondPlan, finding.secondPhase]].sort((a, b) => String(a).localeCompare(String(b))),
    finding.severity, finding.reason, finding.spans,
  ])
}

export function unacknowledgedClashes(findings: Clash[], acknowledgements: ClashAcknowledgement[]) {
  const accepted = new Set(acknowledgements.filter(item => item.explanation.trim()).map(item => item.signature))
  return findings.filter(finding => finding.severity === 'critical' && !accepted.has(criticalSignature(finding)))
}

export function acknowledgeClashes(findings: Clash[], acknowledgements: ClashAcknowledgement[], explanation: string) {
  const remaining = unacknowledgedClashes(findings, acknowledgements)
  if (!explanation.trim()) return acknowledgements
  return [...acknowledgements, ...remaining.map(finding => ({ signature: criticalSignature(finding), explanation: explanation.trim() }))]
}
