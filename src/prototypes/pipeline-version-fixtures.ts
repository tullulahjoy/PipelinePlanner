/** Illustrative saved records; never imported by the new application domain. */
import { changePhaseDuration, clonePlans, defaultSelection, moveSelection } from '../domain/scheduling.ts'
import { initialPlans, SAMPLE_RULES } from './pipeline-fixtures.ts'
import type { PipelineVersion } from './pipeline-versions.ts'

function examples(): PipelineVersion[] {
  const baseline = initialPlans()
  const first = clonePlans(baseline.slice(0, 2))
  const iteration = moveSelection(baseline, defaultSelection(baseline[0]), -4)
  let proposal = moveSelection(baseline, defaultSelection(baseline[0]), -8)
  proposal = changePhaseDuration(proposal, { planId: proposal[0].id, first: 8, last: 8 }, 18, 'start')
  const readiness = proposal[0].phases[8].e
  proposal[0].phases.splice(9, 0, {
    id: 101, name: 'Internal readiness review', kind: 'milestone', weeks: 0,
    offset: 0, libraryPhaseId: '', color: '#536ea1', s: readiness, e: readiness,
  })
  const property = clonePlans([baseline[2]])
  property[0].id = 'property-services'
  property[0].name = 'Property services procurement'
  const movedProperty = moveSelection(property, { planId: property[0].id, first: 0, last: property[0].phases.length - 1 }, 26, true)[0]
  movedProperty.phases[1].name = 'Bid assessment'
  proposal = [...proposal.slice(0, 2), movedProperty]
  const rules = structuredClone(SAMPLE_RULES)
  // This version records an example rule change independently of today's Library.
  const proposedRules = [...structuredClone(rules), {
    id: 'example-dialogue', sourceId: 'dialogue', target: 'bid-writing', kind: 'type',
    severity: 'warning' as const, reason: 'Dialogue and bid writing need the same commercial support.',
  }]
  return [
    { id: 'v04', number: 4, name: 'Revised delivery sequence', status: 'saved',
      note: 'Earlier community services activity, shorter governance, a readiness milestone and an updated procurement list.',
      savedAt: '2026-10-29T11:20:00Z', savedBy: 'Alex Morgan', plans: proposal, rules: proposedRules },
    { id: 'v03', number: 3, name: 'Earlier community services launch', status: 'saved',
      note: 'An intermediate option retained before the wider changes in version 04.',
      savedAt: '2026-10-23T14:10:00Z', savedBy: 'Sam Patel', plans: iteration, rules: structuredClone(rules) },
    { id: 'v02', number: 2, name: 'Autumn pipeline', status: 'current',
      note: 'Facilities support added to the pipeline.',
      savedAt: '2026-10-12T10:30:00Z', savedBy: 'Alex Morgan', plans: baseline, rules: structuredClone(rules),
      confirmation: { at: '2026-10-15T14:00:00Z', by: 'Alex Morgan', byId: 'demo-editor-alex', fromBaselineId: 'v01', rationale: 'Facilities support added to the pipeline.' } },
    { id: 'v01', number: 1, name: 'Initial pipeline', status: 'previous',
      note: 'The first baseline, before facilities support was added.',
      savedAt: '2026-09-02T09:00:00Z', savedBy: 'Sam Patel', plans: first, rules: structuredClone(rules),
      confirmation: { at: '2026-09-04T11:00:00Z', by: 'Alex Morgan', byId: 'demo-editor-alex', rationale: 'First recorded pipeline.' } },
  ]
}
export const EXAMPLE_VERSIONS = examples()
