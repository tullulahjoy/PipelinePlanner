import { useState } from 'react'
import type { SavedPipeline } from '../../data/schemas.ts'
import type { Clash } from '../../domain/scheduling.ts'
import { clashDates } from '../../domain/scheduling.ts'
import { findingDifferenceLabel } from '../../domain/comparison.ts'
import type { comparePipelineFindings } from '../../domain/comparison.ts'
import { FindingCounts } from '../../ui/findings.tsx'

type FindingRow = ReturnType<typeof comparePipelineFindings>[number]

export function FindingTotals({ name, findings }: { name: string; findings: Clash[] }) {
  return <div><strong>{name}</strong><FindingCounts findings={findings} /></div>
}

function FindingValue({ finding }: { finding?: Clash }) {
  if (!finding) return <span className="comparison-absent">Not flagged</span>
  return <>
    <span className={`severity ${finding.severity}`}>{finding.severity === 'critical' ? 'Critical clash' : 'Warning'}</span>
    <p>{finding.firstPlanName}: {finding.phase}<br />{finding.secondPlanName}: {finding.secondPhaseName}</p>
    <p><strong>Overlap:</strong> {clashDates(finding)}</p>
    <small>{finding.weeks} active {finding.weeks === 1 ? 'week' : 'weeks'} of overlap</small>
    {finding.reason && <p>{finding.reason}</p>}
  </>
}

export function ComparisonFindings({ first, second, rows, hasRules }: { first: SavedPipeline; second: SavedPipeline; rows: FindingRow[]; hasRules: boolean }) {
  const [query, setQuery] = useState('')
  const [severity, setSeverity] = useState('all')
  const [presence, setPresence] = useState('all')
  const filtersActive = Boolean(query.trim()) || severity !== 'all' || presence !== 'all'
  const shown = rows.filter(row => {
    const names = [row.before?.firstPlanName, row.before?.secondPlanName, row.after?.firstPlanName, row.after?.secondPlanName].join(' ').toLowerCase()
    const matches = presence === 'all' || presence === 'differences' && row.status !== 'Unchanged'
      || presence === 'first' && !row.after || presence === 'second' && !row.before
      || presence === 'both' && row.before && row.after && row.status !== 'Unchanged'
    return names.includes(query.trim().toLowerCase()) && (severity === 'all' || row.severity === severity) && matches
  })
  const pairs = new Map<string, FindingRow[]>()
  for (const row of shown.toSorted((a, b) => Number(b.severity === 'critical') - Number(a.severity === 'critical'))) {
    const group = pairs.get(row.pair) ?? []
    group.push(row); pairs.set(row.pair, group)
  }
  const totalGroups = new Set(rows.map(row => row.pair)).size
  const findingsDiffer = rows.some(row => row.status !== 'Unchanged')
  return <div className="comparison-section-body">
    <div className="comparison-filters">
      <label className="field">Find a procurement<input type="search" placeholder="Search either procurement" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <label className="field">Severity<select value={severity} onChange={event => setSeverity(event.target.value)}><option value="all">All severities</option><option value="critical">Critical clashes</option><option value="warning">Warnings</option></select></label>
      <label className="field">Comparison<select value={presence} onChange={event => setPresence(event.target.value)}>
        <option value="all">All issues</option><option value="differences">Differences only</option><option value="first">Only in {first.name}</option><option value="second">Only in {second.name}</option><option value="both">Present in both, with differences</option>
      </select></label>
      {filtersActive && <button className="button" onClick={() => { setQuery(''); setSeverity('all'); setPresence('all') }}>Clear filters</button>}
    </div>
    <p className="comparison-note">All issues are listed, including those that are the same in both pipelines. Select a procurement group to inspect its issues, or choose Differences only to focus on changes. Counts include all issues.</p>
    {filtersActive && <p className="comparison-note" role="status">Showing {pairs.size} of {totalGroups} procurement {totalGroups === 1 ? 'group' : 'groups'}.</p>}
    {[...pairs].map(([key, entries]) => {
      const all = rows.filter(row => row.pair === key)
      const firstFindings = all.flatMap(row => row.before ? [row.before] : [])
      const secondFindings = all.flatMap(row => row.after ? [row.after] : [])
      const pair = entries[0].finding
      return <details className="comparison-finding-pair" key={key}>
        <summary><strong>{pair.firstPlanName} / {pair.secondPlanName}</strong><div className="comparison-totals">
          <FindingTotals name={first.name} findings={firstFindings} /><FindingTotals name={second.name} findings={secondFindings} />
        </div></summary>
        <div className="table-scroll" tabIndex={0} role="region" aria-label={`Warnings and clashes for ${pair.firstPlanName} and ${pair.secondPlanName}`}>
          <table className="comparison-findings-table"><caption className="sr-only">Warnings and clashes comparison</caption>
            <thead><tr><th scope="col">Phase and procurement pair</th><th scope="col">{first.name}</th><th scope="col">{second.name}</th></tr></thead>
            <tbody>{entries.map(row => <tr key={row.key}>
              <th scope="row"><span className={`severity ${row.severity}`}>{row.severity === 'critical' ? 'Critical clash' : 'Warning'}</span>
                <p>{row.finding.firstPlanName}: {row.finding.phase}<br />{row.finding.secondPlanName}: {row.finding.secondPhaseName}</p>
                <span className="comparison-finding-status">{row.status === 'Unchanged' ? 'Same in both pipelines' : findingDifferenceLabel(row.before, row.after, first.name, second.name)}</span>
              </th>
              {[row.before, row.after].map((finding, index) => <td key={index} className={finding ? `comparison-finding-cell ${finding.severity}` : ''}><FindingValue finding={finding} /></td>)}
            </tr>)}</tbody>
          </table>
        </div>
      </details>
    })}
    {!pairs.size && <p>{!hasRules ? 'No clash-checking rules are configured in this workspace.' : !rows.length ? 'Neither pipeline has warnings or critical clashes.' : presence === 'differences' && !findingsDiffer ? 'There are no differences in warnings or critical clashes. Choose All issues to inspect the matching issues.' : 'No issues match these filters.'}</p>}
  </div>
}
