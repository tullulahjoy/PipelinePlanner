/** Fictional inputs for the preserved prototype and regression tests only. */
import { monday, parseDate } from '../domain/calendar.ts'
import { scheduleAtAnchor } from '../domain/scheduling.ts'
import type { OverlapRule, Phase, Plan } from '../domain/scheduling.ts'

export const SAMPLE_RULES: OverlapRule[] = [
  { id: 'sample-evaluation', sourceId: 'evaluation', target: 'evaluation', kind: 'same', severity: 'warning' },
  { id: 'sample-moderation', sourceId: 'moderation', target: 'moderation', kind: 'same', severity: 'critical' },
]
type PhaseSeed = [string, number, string, string, number?]
const serviceSeed: PhaseSeed[] = [
  ['Market engagement', 2, 'engagement', '#476b8d'],
  ['Launch and EOI', 2, 'eoi', '#536ea1'],
  ['Dialogue with bidders', 4, 'dialogue', '#6a62a2'],
  ['Final procurement documents issued', 0, '', '#536ea1'],
  ['Bid writing', 6, 'bid-writing', '#5077a0'],
  ['Bids submitted', 0, '', '#536ea1'],
  ['Evaluation', 6, 'evaluation', '#315ed4'],
  ['Moderation', 6, 'moderation', '#bc4c16', -2],
  ['Governance', 20, 'governance', '#7658a7'],
  ['Contract award', 2, 'award', '#7658a7'],
  ['Off-site mobilisation', 26, 'offsite', '#17766e'],
  ['Service responsibility transfers', 0, '', '#536ea1'],
  ['On-site mobilisation', 78, 'onsite', '#34654c'],
]
function buildPlan(id: string, name: string, anchor: number, seeds: PhaseSeed[], anchorIndex: number): Plan {
  const phases: Phase[] = seeds.map(([label, weeks, libraryPhaseId, color, offset = 0], index) => ({
    id: index + 1, name: label, kind: weeks ? 'phase' : 'milestone', weeks,
    libraryPhaseId, color, offset, s: 0, e: 0,
  }))
  const plan: Plan = { id, name, anchor, planningAnchor: monday(anchor), anchorId: phases[anchorIndex].id,
    anchorName: phases[anchorIndex].name, phases, approvedBaseline: { anchor, phases: [] } }
  scheduleAtAnchor(plan, 0, phases.length - 1)
  plan.approvedBaseline!.phases = structuredClone(phases)
  return plan
}
export function initialPlans(): Plan[] {
  return [
    buildPlan('community-services', 'Community services procurement', parseDate('2031-01-20'), serviceSeed, 11),
    buildPlan('digital-services', 'Digital services procurement', parseDate('2031-02-03'), serviceSeed, 11),
    buildPlan('facilities-support', 'Facilities support procurement', parseDate('2030-03-18'), [
      ['Launch and EOI', 2, 'eoi', '#536ea1'], ['Evaluation', 2, 'evaluation', '#315ed4'],
      ['Moderation', 1, 'moderation', '#bc4c16'], ['Contract award', 2, 'award', '#7658a7'],
      ['Contract awarded', 0, '', '#536ea1'],
    ], 4),
  ]
}
