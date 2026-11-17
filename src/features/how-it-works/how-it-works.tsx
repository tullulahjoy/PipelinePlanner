import { Link } from 'react-router'
import { useWorkspace } from '../../app/workspace-context.ts'
import './how-it-works.css'

export function HowItWorks() {
  const workspace = useWorkspace()
  const base = `/workspaces/${workspace.id}`
  return <article className="how-it-works">
    <div className="page-heading"><h1>How it works</h1><p>Build your pipeline plan, save your progress and choose the live plan for your workspace.</p></div>
    <div className="guide-layout">
      <ol className="workflow" role="list">
        <li>
          <h2>Build a procurement’s plan</h2>
          <p>Each procurement has a <strong>schedule</strong>, meaning its activities and planned dates. Activities are organised into <strong>phases</strong>, such as writing bids or assessing them. Choose the phases you need and how many weeks each should take.</p>
          <p>Save reusable phases in <Link to={`${base}/library`}>Library</Link>. You can also save combinations of phases as <strong>templates</strong> to help build future procurements.</p>
        </li>
        <li>
          <h2>Plan around a fixed date</h2>
          <p>Choose a date for an important event, such as when a new service must begin. This is the <strong>anchor date</strong>. The planner uses it to calculate when the surrounding activities need to happen.</p>
        </li>
        <li>
          <h2>Clash checks</h2>
          <p>An overlap occurs when activities happen at the same time. Some overlaps are acceptable; others may cause problems, for example because they need the same people.</p>
          <p><strong>Clash-checking rules</strong> specify which combinations of phases in different procurements should be flagged. A <strong>Warning</strong> identifies an undesirable but manageable overlap. A <strong>Critical clash</strong> identifies an overlap you have defined as unacceptable.</p>
        </li>
        <li className="user-journey">
          <h2>Save your live plan</h2>
          <p>Choose <strong>Save</strong> and give your pipeline plan a name. Your first saved plan becomes your workspace's live plan automatically and opens by default when you enter the workspace. <strong>Notes</strong> are optional. You can keep building it later.</p>
          <p>Warnings and critical clashes help you review your plan. They do not prevent saving or require a justification.</p>
        </li>
        <li className="user-journey">
          <h2>Update or explore alternatives</h2>
          <p>Choose <strong>Edit live plan</strong> on <strong>Live Pipeline</strong>. Editing opens in a window over the live page. <strong>Save</strong> updates that plan; <strong>Save as</strong> creates a separate alternative over <Link to={`${base}/saved-pipelines`}>Saved Pipeline Plans</Link>, leaving the live plan unchanged.</p>
          <p>Close the editing window to return to the page beneath it. If you have unsaved changes, choose whether to save them, discard them or keep editing.</p>
        </li>
        <li>
          <h2>Choose a different live plan</h2>
          <p>View and edit alternatives in their own windows over <strong>Saved Pipeline Plans</strong>. Choose <strong>Make live</strong> for the alternative you want to use. A confirmation names the incoming and outgoing plans. The outgoing plan stays saved.</p>
          <p>Use <strong>Live Pipeline</strong> in the top navigation to see your current live plan. Each workspace has its own live plan, saved alternatives and Library.</p>
        </li>
      </ol>
      <aside className="date-notes" aria-labelledby="dates-heading">
        <h2 id="dates-heading">How dates are planned</h2>
        <section><h3>Weeks commence on Mondays</h3><p>Durations use whole weeks. The timeline uses Mondays as planning points. If an anchor date falls on another day, it is plotted on Monday of that week, while the entered date remains recorded.</p></section>
        <section><h3>Christmas pause</h3><p>The planner assumes no activity during the two weeks containing Christmas Day and New Year’s Day. These weeks run from Monday to Sunday and do not count towards phase durations.</p><p>Six weeks of activity spanning this break therefore occupies eight weeks on the timeline.</p></section>
      </aside>
    </div>
    <p className="supporting-text">Choose Compare beside a plan in Saved Pipeline Plans to compare two saved plans. Exporting to Excel is planned next.</p>
    <div className="guide-actions"><Link className="button primary" to={`${base}/pipeline`}>Return to Live Pipeline</Link><Link className="button" to={`${base}/saved-pipelines`}>Open Saved Pipeline Plans</Link><Link className="button" to={`${base}/library`}>Open Library</Link></div>
  </article>
}
