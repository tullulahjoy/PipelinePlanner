import { scheduleAtAnchor } from '../../domain/scheduling.ts'
import type { Plan } from '../../domain/scheduling.ts'
import { Timeline } from '../../ui/timeline.tsx'

// Illustration only: these plans never enter the workspace/session or data API.
const examples: Plan[] = ['Community services', 'Digital services', 'Facilities support'].map((name, index) => {
  const plan: Plan = {
    id: `example-${index}`, name, anchor: Date.UTC(2030, 4 + index * 2, 20), planningAnchor: 0, anchorId: 5, anchorName: 'Service begins', approvedBaseline: null,
    phases: [
      { name: 'Dialogue', weeks: 8 + index * 2, color: '#705aa5' },
      { name: 'Evaluation', weeks: 4 + index, color: '#315ed4' },
      { name: 'Contract award', weeks: 3, color: '#a7622d' },
      { name: 'Mobilisation', weeks: 10 + index * 2, color: '#16766f' },
      { name: 'Service begins', weeks: 0, color: '#536ea1' },
    ].map((phase, i) => ({ ...phase, id: i + 1, kind: i === 4 ? 'milestone' : 'phase', libraryPhaseId: '', offset: 0, s: 0, e: 0 })),
  }
  scheduleAtAnchor(plan, 0, plan.phases.length - 1)
  return plan
})

export function ExamplePipeline() {
  return <div className="example-preview">
    <div className="example-notice">
      <h2>Example only - your pipeline plan is currently empty</h2>
      <p>These fictional procurements show how your timeline could look. Choose <strong>+ Add procurement</strong> to start your own.</p>
    </div>
    <Timeline plans={examples} rules={[]} example />
  </div>
}
