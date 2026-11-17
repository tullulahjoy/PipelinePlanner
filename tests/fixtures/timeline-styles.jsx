import { createRoot } from 'react-dom/client'
import { scheduleAtAnchor } from '../../src/domain/scheduling.ts'
import { Timeline } from '../../src/ui/timeline.tsx'
import '../../src/index.css'
import '../../src/App.css'

// Deliberately omit the Pipeline page stylesheet: Timeline must own its visuals.
const options = new URLSearchParams(location.search)
const overlap = Number(options.get('overlap'))
const plans = ['Community services', 'Digital services'].map((name, index) => {
  const plan = {
    id: String(index), name, anchor: options.has('christmas') ? Date.UTC(2031, 0, 13) : Date.UTC(2032, 4, 10), planningAnchor: 0,
    anchorId: 3, anchorName: 'Service begins', approvedBaseline: null,
    phases: [
      { name: 'Evaluation', weeks: 4, color: '#315ed4' },
      { name: 'Moderation', weeks: 2, color: '#a7622d' },
      { name: 'Service begins', weeks: 0, color: '#536ea1' },
    ].map((phase, i) => ({ ...phase, id: i + 1, kind: i === 2 ? 'milestone' : 'phase', libraryPhaseId: phase.name, offset: i === 1 ? -overlap : 0, s: 0, e: 0 })),
  }
  scheduleAtAnchor(plan, 0, 2)
  return plan
})
const rules = [
  { id: 'evaluation', a: 'Evaluation', b: 'Evaluation', severity: 'warning' },
  { id: 'moderation', a: 'Moderation', b: 'Moderation', severity: 'critical' },
]

createRoot(document.getElementById('root')).render(<main>
  <div data-testid="page"><Timeline plans={plans} rules={rules} page /></div>
  <div data-testid="example"><Timeline plans={plans} rules={rules} example /></div>
  <div data-testid="preview"><Timeline plans={plans} rules={rules} /></div>
  <div data-testid="saved"><Timeline plans={plans} rules={rules} viewing /></div>
</main>)
