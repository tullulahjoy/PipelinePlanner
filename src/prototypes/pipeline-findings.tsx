import type { ReactNode } from 'react'
import type { Clash } from './pipeline-scheduling'
import { clashDates } from './pipeline-scheduling'
import '../../mockups/findings-cards.css'

export function FindingCard({ finding, status, resolved = false, headingLevel = 3, children }: {
  finding: Clash; status?: string; resolved?: boolean; headingLevel?: 3 | 4; children?: ReactNode
}) {
  const Heading = headingLevel === 4 ? 'h4' : 'h3'
  const samePhase = finding.phase === finding.secondPhaseName
  return <li className={`finding-card ${finding.severity}${resolved ? ' resolved' : ''}`}>
    <div className="finding-card-labels"><span className={`severity-badge ${finding.severity}`}>{finding.severity === 'critical' ? 'Critical clash' : 'Warning'}</span>{status ? <span className="finding-card-status">{status}</span> : null}</div>
    <Heading className="finding-phase">{samePhase ? 'Phase: ' : 'Phases: '}{finding.phase}{samePhase ? '' : ` / ${finding.secondPhaseName}`}</Heading>
    <p className="finding-field-label">Procurements:</p><ul className="finding-participants"><li className="finding-participant"><strong>{finding.firstPlanName}</strong>{!samePhase ? <small>Phase: {finding.phase}</small> : null}</li><li className="finding-participant"><strong>{finding.secondPlanName}</strong>{!samePhase ? <small>Phase: {finding.secondPhaseName}</small> : null}</li></ul>
    <div className="finding-overlap">{children ?? <><p><strong>{resolved ? 'Previous overlap: ' : 'Overlap: '}</strong>{clashDates(finding)}</p><p className="finding-duration">{finding.weeks} active {finding.weeks === 1 ? 'week' : 'weeks'}</p>{resolved ? <p className="finding-note">This overlap is resolved in the proposed schedule.</p> : null}{finding.reason ? <p className="finding-note">{finding.reason}</p> : null}</>}</div>
  </li>
}
