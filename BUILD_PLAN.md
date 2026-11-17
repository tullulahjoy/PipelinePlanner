# React application build plan

Updated 16 November 2026. User timezone: Europe/London.

## Current checkpoint: Milestone 2 functionally complete, 16 November 2026

This is the authoritative status and specification. The user approved this documentation-only checkpoint after completion of the latest interface and anchor refinements. Older dated delivery records describe historical behaviour; they do not reinstate superseded baseline ceremonies, permanent anchor locks or duplicate page headings.

- **Milestone 2 functionality is complete:** local workspaces, independent Libraries and templates, Add/Edit procurement, shared timelines and findings, local Save/Save as, Live Pipeline and modal editing, procurement-form recovery, and Adjust with drag/numeric movement, undo and review.
- The populated Live Pipeline page has no separate "Your procurement pipeline plan" heading. The plan name in the blue context panel is its main heading; the blue live-status label and existing explanatory text remain. The live editor title is **Editing live pipeline plan**.
- In the Live Pipeline procurement overview, names are plain text. **View details** and **Edit** are in **Actions**; Edit opens that procurement directly in the editing modal. Closing resolves unapplied/unsaved changes and returns focus to the launch action.
- Edit procurement allows the anchor date and milestone to be changed through **Edit details**, without Unlock/Lock controls or a persistent lock status. Adjust protects the anchor by default; its explicit movement permission is temporary and resets when that modal closes, including after Apply. Older recovered drafts do not restore their obsolete lock flag.
- Procurement schedules belong to their containing pipeline plan. Save as retains identities for future comparison but creates an independent saved alternative. Editing a procurement in the live plan does not update its counterpart in another plan, even when their names and identities match. Current Library clash rules remain workspace-wide; existing duration updates require explicit selection and accepted preview.
- Valid range movement into available adjustment gaps, including Christmas boundaries, updates the adjustment draft immediately without another procurement preview. The anchor and unselected dates remain protected as applicable. Review changes / Apply adjustments remains the final adjustment confirmation, with named Save separate.
- First Save establishes live automatically. Save updates the open named plan; Save as keeps an alternative; one Make live confirmation changes the selected live plan and retains the outgoing plan. There is no first/replacement baseline ceremony or automatic history of every Save. Existing historical confirmation data remains readable.

**Verification already completed:** all 130 Node tests pass. The latest related browser runs passed 52/52 and 66/66 Chromium cases (overlapping groups, not a claim of 118 distinct tests). They cover direct Edit/details, anchor edits and cancellation, temporary Adjust permission, recovery including legacy lock data, saving/stale data, timeline parity and narrow layouts. Production build/strict TypeScript pass; lint retains only nine existing prototype/mockup warnings. Desktop/mobile visuals were inspected. This checkpoint changes documentation only and does not imply new test execution.

**Next in sequence:** Milestone 3 finishes Saved Pipeline Plans and implements general Compare for independent alternatives. Library timing-impact functionality already exists; complete its saved/Compare integration and acceptance. Milestone 4 delivers Excel workbook export and final cross-browser/device, accessibility and large-pipeline acceptance. Existing snagging/deferrals remain separate. The unchecked coverage checklist spans these later states and does not mean Milestone 2 functionality is unbuilt.

This checkpoint does not authorise Milestone 3 implementation, new dependencies or cloud work. Present the next bounded implementation proposal for separate approval.

## Earlier delivery: simpler Live Pipeline journey, 16 November 2026

The user separately approved implementation of this package, including live editing in a modal, automatic first-save activation, Make live for alternatives, compatibility with existing data, guidance, tests and plan/handover updates. This supersedes the earlier fixed-baseline, first-confirmation and full-page live-edit requirements. Dated delivery records below describe previous behaviour and are not the current specification where they conflict with this section.

- **Live Pipeline** replaces the Pipeline Plan navigation label. `/workspaces/:id/pipeline` always displays the workspace's live plan, or the illustrative empty state before one exists. Live editing opens at `?edit=1` in the shared near-full-screen native modal over that page, with the existing purple edit context. Closing returns to Live Pipeline after resolving unapplied forms and unsaved work.
- First use is **Add procurement -> review and add -> Save with a name**. The first successful Save establishes the live plan atomically, without a separate baseline review/confirmation. The welcome modal and How it works explain this same journey. Welcome still reappears on workspace entry while the example remains. The example is never saved as data.
- **Save** updates the latest contents of the open named plan, including the live plan. **Save as** creates an independent alternative and opens its editing modal over Saved Pipeline Plans. Notes remain optional. Warnings and critical clashes are advisory, without mandatory justification. Closing dirty editing offers Save and exit / Discard changes and exit / Keep editing; clean editing closes directly.
- Non-live View/Edit stays over Saved Pipeline Plans. **Make live** is available for a saved alternative in the list and viewer. One confirmation names incoming and outgoing plans and explains default workspace entry. It changes the live selection only; the outgoing plan and its saved details remain available. No automatic historical snapshots or history of every Save are introduced. Compare and Excel export remain later delivery.
- Preserve existing workspace isolation, records, notes, and historical confirmation metadata. Keep the stored `currentBaselineId` and optional legacy `setupPipelineId` fields for compatibility; user-facing baseline states/ceremony and confirmation overwrite locks are removed. Carry forward an existing selected setup candidate, otherwise the sole saved plan, when no live selection exists. Multiple unselected legacy records are not silently chosen. Previously recorded confirmation is historical information, not an immutability rule.
- Library rules remain current workspace-wide rules. Selective duration updates can target live or other saved plans, including formerly confirmed ones, using the appropriate modal. Past/started/custom activity protections, preview, explicit application and explicit Save remain. A Library change does not silently alter saved dates.
- Reuse the existing Pipeline, Timeline, findings, procurement editor, Adjust, Dialog and persistence boundary. Shared modal CSS is `src/ui/pipeline-modal.css`; no new dependency, database version, cloud integration, prototype fixture change or user-data reset is included.

Verification: all 128 Node tests pass. All 160 Chromium cases were verified across broad and affected runs: 152 passed broadly; all eight initial failures were resolved in the 44-case affected run (42 passed) and final six-case hint/review run (all passed). Final production build/strict TypeScript pass; lint retains nine existing prototype/mockup warnings only. Desktop/320px live-editor screenshots were inspected. This is not complete cross-browser/large-data acceptance. Recovery handoff and passive-hint/Escape handling were corrected for the modal context. Detailed evidence is recorded in HANDOVER.md. The remaining Milestone 3 work is full saved-plan status/filter/detail acceptance and general Compare, followed by Milestone 4 workbook export and final acceptance. The obsolete replacement-baseline package is removed from the remaining plan. This approval does not authorise those later packages.

## Earlier delivery: saved-plan view/edit modals, 15 November 2026

The user separately approved converting non-live saved-plan viewing and editing into large modals over Saved Pipeline Plans, retaining the existing content and functions, with tests and plan/handover updates. This explicitly supersedes full-page non-live saved viewing/editing and the associated return-to-live/origin navigation. It is a scoped navigation/presentation delivery, not approval of the proposed editable-live-plan simplification or of the rest of Milestone 3.

**Pipeline Plan is the live/setup destination.** The workspace's current live plan opens there; before one exists, the guided first-plan setup remains. Other saved plans open at `/workspaces/:workspaceId/saved-pipelines/:pipelineId`, with `?edit=1` for editing. The saved list remains behind the native modal and its top navigation section stays selected. Old `/pipeline/:pipelineId` links redirect non-live records to the equivalent modal, preserving query parameters. Current-live viewing resolves to `/pipeline`; the saved list's live-plan actions retain that live destination and protected live editing. Unqualified live `?edit=1` enters its protected editing journey rather than creating an unrelated unnamed plan.

View/Edit reuse the existing Pipeline content, timeline, findings, procurement overview/details and save controls. The modal header supplies Viewing saved pipeline plan or Editing pipeline plan instead of duplicating a page heading inside it. Save/Save as retain the editing modal, update the list and follow any newly created record. Saved details and notes remain available. Closing clean editing or viewing returns to the saved list; dirty editing offers Save and exit / Discard changes and exit / Keep editing. Unapplied procurement/adjustment edits are protected first, without bypassing the working-copy protection. Browser navigation and storage failures retain existing guards and retry behaviour. Focus returns to the launch action, with a row fallback for a deep link; Save as does not leave focus on a removed control.

**Navigation cleanup delivered:** remove Choose a saved pipeline plan from all Pipeline Plan setup/empty content; remove the Saved Pipeline Plans context-panel button and Return to live pipeline plan buttons; remove the blue Saved: [name] / View saved pipeline plan notice and its unused session state. Saved Pipeline Plans remains in the top ribbon. All changes saved remains beside the plan name with its accessible status. A read-only plan has one Edit this pipeline plan action, or Continue editing when it already has a matching working copy, with no separate duplicate Resume editing action.

Nested procurement settings, details, confirmation, Library-impact, recovery and Adjust dialogs remain usable over the editing/viewing window. Shared native Dialog opening ensures containing dialogs open before initially mounted child dialogs, so recovery and procurement deep-link details appear in front. Escape is handled only by the active dialog. Native CSS locks document scrolling while any app dialog is open and releases it after the final close; no nested overflow-restoration state is needed. Viewing/editing content scrolls within the modal at desktop and narrow widths. Existing full-page first-use/procurement focus behaviour remains outside modals.

No dependency, storage migration, cloud service, general recovery mechanism or baseline mutability change is included. Baselines remain fixed, saving progress alone does not confirm one, current Library rules remain advisory and notes remain optional. Existing selective Library updates and local procurement recovery now use the canonical saved-modal edit destination. Current/previous baseline history, full saved-page status/filter coverage, general Compare and workbook export retain their remaining planned packages.

Implementation references: `features/saved-pipelines/saved-pipelines.tsx` and its scoped CSS own the list/modal launch and return focus; `features/pipeline/pipeline.tsx` reuses its content in SavedPipelineModal; `pipeline-paths.ts`, `app/router.tsx` and `pipeline-session.tsx` coordinate canonical routes, Save and Close; shared Dialog owns native stacking/Escape/focus. The guide now describes closing a saved-plan window and using the top navigation, without referring to removed return buttons.

Verification: all 128 Node tests pass. All 162 Chromium cases were verified across the 161-case broad run and final affected reruns: the broad run passed 155, and the six failing cases were addressed in the 64-case affected run, which also includes the added procurement deep-link regression. All 64 passed. The final six saved-modal cases passed again after preserving the view explanations in the modal header. Viewer screenshots were inspected at 320px and 1440px. Final production build and strict TypeScript pass; lint retains only the nine existing prototype/mockup warnings. Coverage includes nested recovery/details/Adjust, Save/Save as and failure retention, stale data, protected baselines, close/discard/keep, deep links/refresh, navigation context, focus and scroll restoration. This is Chromium verification across broad and affected runs, not complete cross-browser/large-data acceptance. No user browser data is cleared by this package.

## Earlier delivery: Adjust Pipeline Plan, 15 November 2026

The user separately approved the Adjust implementation package after the audit, including its listed real-data/window/wording/staleness choices, relevant tests, visual comparison and status updates to these three documents. It is now implemented locally. This supersedes historical statements below that Adjust is the next unbuilt package. It does not authorise general Compare, full saved viewing, replacement-baseline/history or workbook implementation ahead of their existing milestones.

The editable timeline now offers Adjust pipeline plan beside Add procurement. A lazy-loaded native modal reproduces the connected prototype's desktop board/side-panel workspace, selected-row/range feedback, persistent header/footer, exact-movement direction/input/apply controls, phase action tabs, duration fixed-boundary choices, explicit anchor permission, undo, review navigation/date changes and foreground dirty-discard alertdialog. Narrow layouts use a single scrolling body with horizontal timeline inspection and persistent wrapping footer actions. The timeline, phase segments, issue colours/outlines, floating/pinnable details and finding cards reuse shared production components. No dependency, fixture import, calendar-library trial, saved-data migration or new recovery policy was added.

**Approved choices delivered:** initial phase range spans phases before the anchor, falling back to the first phase or whole procurement for milestone-only plans; no demo `award` identifier matching. Full pipeline remains Full in Adjust. Actions are Review changes / Apply adjustments; Apply only updates the working copy and explicit Save remains separate. Review and Apply read current Library/source revisions. A Library change since review refreshes checks and returns the user to adjustment for another review; a stale/deleted source blocks applying while retaining the draft. Storage errors retain draft/inputs for retry. UI interaction is disabled while these checks are pending.

Existing custom/default duration provenance, Library links, project identities, notes, unrelated procurements and baseline protection are retained. Explicit duration changes become custom. Cancelling this session preserves earlier working edits. Undo restores a complete adjustment snapshot; reopening starts a fresh history. The existing navigation guard protects unapplied adjustments in client-side navigation, and reload uses the browser's unsaved-work warning. There is no general adjustment recovery. Current-rule findings remain advisory, including New / Remaining / Resolved cards; no reason or acknowledgement is requested. Review has before/proposed dates, earlier/later movement, changed durations, anchor/gap changes and affected-only Christmas explanations, keyed by activity identity rather than name.

**Baseline simplification remains a discussion, not an adopted design.** The user asked to finish this planned package before revisiting the proposed editable-current-plan model. This package retains the existing protected baseline/setup journeys, exit destination, first-plan saved-choice control and blue saved notice. Their later review is not permission to silently change those behaviours now.

**Verification record:** all 128 Node tests pass. The complete 156-case Chromium suite was exercised: 153 passed in the broad run; three stale toolbar/guide assertions were corrected for the delivered feature and passed in the final 25-case adjustment/editor-visuals/usability run. After the final changed-procurement-only merge refinement, all 12 adjustment cases passed again. The earlier planning regression was corrected to expand the deliberately collapsed dates table before inspecting it. Desktop review and desktop/320px/390px scrolling screenshots were inspected. Final production build and strict TypeScript pass. Lint has only the nine existing prototype/mockup warnings, with no new warnings. The production output excludes the calendar-timeline trial/demo fixtures. This is Chromium acceptance across broad and affected reruns, not a claim of complete cross-browser, accessibility or large-data acceptance.

### Adjustment state/copy inventory and implementation evidence

| State / condition | Copy and dynamic data | Production location and evidence |
| --- | --- | --- |
| Entry / no edits | Pipeline adjustment; Adjust pipeline plan; No changes yet; Choose what to adjust; Selected activity. Procurement/phase names and initial range derive from actual records. | `features/pipeline/pipeline.tsx`, `adjustment-dialog.tsx`, shared Timeline. Focused selection, Full pipeline, baseline-entry and narrow-layout tests. |
| Selection / exact movement | Whole procurement / One phase / Phase range; From phase / Through to phase; Move by an exact amount; Earlier / Later; Apply movement; Number of weeks. Selected names use first through last; dates use start and Friday finish. | `adjustment-dialog.tsx`, `adjustment-timeline.tsx`; pointer/keyboard/numeric equivalence and anchor-permission tests. Preserve prototype control structure; do not replace it with separate direction buttons. |
| Anchor / duration | Anchor locked or Anchor movement allowed; Allow this procurement's anchor date to move; plotted Monday plus entered date. Move phase / Change duration; Keep this date fixed; start/finish choices. | `adjustment-controls.tsx`, domain scheduling; locked-anchor, fixed-finish, custom-provenance and milestone-only tests. Amounts/errors use actual activity and whole-week limits. |
| Changed / undo / cancel | Unsaved adjustments; Undo last change; dynamic changed entry/entries count; Discard these adjustments?; Keep editing / Discard adjustments. | `adjustment-dialog.tsx`, shared Dialog and navigation guard. Foreground confirmation, focus restoration, clean close, undo, leave protection and preservation of earlier working state. |
| Review / Apply | Review changes / Apply adjustments; Back to adjusting; Pipeline visual / Date and duration changes. Before / Proposed / Movement; singular procurement has versus procurements have. Movement and anchor/gap/duration rows derive from shared dateChanges/dateMovementSummary. | `adjustment-review.tsx`, shared domain/calendar. Saved-record isolation, explicit Save, retained metadata, fixed-baseline protection and date-review tests. Action wording is an approved departure from prototype save labels. |
| Christmas affected only | X active week/weeks and Christmas and New Year break excluded. Else X week/weeks. Changed-break explanation comes from shared christmasExplanation, including active duration unchanged where applicable. | `adjustment-review.tsx`, shared comparison/calendar functions. Christmas movement test checks both old/new cells and unchanged active duration. No blanket calendar-duration wording on all phase rows. |
| Findings | Named current findings use shared red/amber cards with New / Remaining / Resolved; counts and overlaps use the full timeline and current rules. Existing no-rules/no-findings alternatives are retained. | `adjustment-review.tsx`, `ui/findings.tsx`. Advisory apply, resolved-finding and changed-rule revalidation tests; no justification input. |
| Revalidation / failure | Library change refreshes checks and requests another review. Changed/deleted saved source blocks applying. Storage failure retains work for retry; validation errors use readable messages. | `adjustment-dialog.tsx`, existing localData revisions. Focused stale-source, changed-Library and storage retry cases. Browser multi-tab race guarantees remain limited to local revision checks; final Save also validates. |

## Prototype-parity audit: current specification, 15 November 2026

The user approved this documentation update after the full prototype review. That approval strengthened acceptance requirements and reconciled superseded checklist entries; it did not authorise application changes, additional dependencies or a different delivery order. At audit time Adjust Pipeline Plan was the next Milestone 2 package; its subsequent separate approval/delivery is recorded above. Complete saved viewing, general Compare, replacement-baseline history and workbook export retain their existing later milestones.

The connected prototype is the visual and interaction reference, subject to later expressly approved product decisions. Match its page structure, spacing, typography, colours, borders, action hierarchy, disclosures, scrolling and focus behaviour for each applicable state. Do not substitute a broadly similar design. Reference defects, demo-only assumptions and obsolete mandatory-justification or saved-rule behaviour are not requirements. The detailed acceptance lists below are specifications awaiting implementation/verification, not claims that those capabilities are delivered.

Current decisions override historical delivery records: use Pipeline Plan terminology and short hyphens in user-facing content, with Live Pipeline as the live-page navigation label. The populated page uses the plan name as its main heading; live editing is a modal titled Editing live pipeline plan. Call the anchor an anchor without usual/actual qualifiers; Edit details permits anchor changes without a persistent lock, while Adjust permission resets on close. Apply current workspace clash rules everywhere; findings are advisory and saving notes optional. Saved plans retain independent schedules and recorded names/colours. Library duration updates require selective accepted preview and preserve custom durations and past/started activity. Baseline ceremonies and immutable-baseline locks are superseded. These are settled decisions, not open choices.

First-use guidance follows the latest approved modal/setup/How it works lifecycle, rather than the prototype's older guide structure. Recent approved Add/Edit refinements are part of parity: the stronger blue-grey review treatment; collapsed Phase and milestone dates with a dynamic explanation; no separate Anchor and gaps section; expanded outlined Clash checks with a matching header, divider and description; Christmas-only active-week notes; the separated local/shared phase-edit controls; and creation/automatic selection of an anchor milestone beside the template selector. Capture the exact approved copy and styles from the delivered components and review records, without inventing replacements.

Historical paragraphs below remain delivery history where explicitly dated or labelled. They do not reopen settled decisions or override the current checklist. In particular, old required critical explanations, saving reasons, four-point guidance, actual/usual anchor labels and supposedly unresolved Library property/update policies are superseded.

### Audit decisions: subsequently approved adjustment choices and remaining exit question

- **Default adjustment selection, approved and delivered:** select phases before the anchor, otherwise the first phase; use whole procurement for milestone-only schedules. The shared helper no longer recognises the demo Library identifier `award` or infers names.
- **Full pipeline viewing in Adjust, approved and delivered:** preserve Full pipeline rather than the prototype bridge's twelve-month fallback.
- **Exit destination, superseded for saved windows:** the separately approved modal conversion now closes saved viewing/editing to the saved list, with matching close guidance. Main live editing retains its earlier origin-return behaviour; any remaining origin/wording review is confined to that journey rather than reopening the agreed saved-modal destination.
- **Adjustment action wording, approved and delivered:** Review changes / Apply adjustments replace Review and save / Confirm and save. Persistent Save remains separate.
- **Local stale-data handling, approved and delivered:** reread revisions on Review/Apply; changed Library checks require another review, and a changed/deleted source blocks Apply while preserving the draft. Reuse existing validation without hosted locks or adjustment recovery.

### Page/state evidence required for parity

For each PC item, record the reference file/component, exact static copy or dynamic template, display condition, real-data variables, React destination, implementation status and verification evidence. Record approved departures alongside the affected state. Use representative matching data and viewport sizes when comparing rendered pages; compare initial, expanded, changed, empty and failure states where relevant. Check typography, spacing, colours, button placement, overflow, sticky regions and scroll destinations, as well as behaviour. Component/domain test passes alone do not establish page parity. Keep this evidence with the package/checklist; no new copy-management or screenshot framework is implied.

All timeline surfaces must use the shared renderer/tokens for phase colours, warning and critical outlines, intentional-overlap splits, Christmas/gap hatching, milestones, legends and tooltip dates/durations. Include the empty-state example, procurement previews, main plan, saved viewer, Adjust and Compare. Add adjustment selection/drag feedback around that shared rendering rather than maintaining another independent visual or scheduling engine. Extract only the necessary production pieces from prototype trials; do not import fixtures or the calendar-timeline trial into production routes.

## Status and authority

The current checkpoint at the start of this document governs milestone status and the latest product decisions. The connected prototype remains the visual and interaction reference except where the user expressly approved a change, including the live-plan model, page heading, table actions and anchor behaviour.

Milestone 2 is functionally complete. Remaining Saved Pipeline Plans/Compare functionality belongs to Milestone 3. Final cross-browser/device, accessibility, large-data and whole-application acceptance belongs to Milestone 4; open checklist items must distinguish those checks from unbuilt functionality.

Earlier dated records are historical evidence, not instructions to restore fixed baselines, required clash justifications, full-page saved editing, persistent anchor locks or obsolete first-use journeys. The latest approval does not reopen settled decisions.

Approval of a plan or documentation update does not authorise subsequent implementation. Follow AGENTS.md and obtain separate confirmation for the specific next package. No application changes, dependency changes, user-data resets or new snag closures are included in this documentation checkpoint.

## 1. Purpose, scope and budget

**Agreed:** build a React application that delivers the chosen prototype journeys, works locally first, and can later connect to AWS. Its distinctive display puts a project's sequential phases together on one timeline row, with multiple projects planned together.

Procurement remains the MVP's primary use case and test case. The user is considering broader project use. **Proposed:** use a general Project entity and procurement examples/templates, without building a configurable workflow platform. Final product naming and visible Project/Procurement terminology are **open**.

This is a personal hobby project with a very small user base initially. Cost and simplicity are controlling requirements:

1. Assess native browser capabilities and suitable maintained, free libraries first.
2. Use exceptionally low-cost managed services where they materially reduce effort or risk.
3. Build straightforward application features where a paid alternative exceeds the hobby budget.
4. Treat recurring costs above pennies/a couple of pounds as outside the default preference. Flag genuinely useful, very low-cost options for explicit consideration.
5. Assess implementation effort, maintenance, licensing, accessibility, TypeScript support and integration complexity; an existing package is not automatically a good fit.
6. Avoid building authentication, cryptography, spreadsheet file formats or other complex standard infrastructure ourselves.
7. Show ongoing costs as well as introductory credits/free-tier assumptions. No claim that AWS will necessarily cost pennies has been validated for a complete architecture.

**Agreed:** AWS hosting and Cognito authentication are the later hosted direction. The first working delivery is local and single-user, with no dependency on AWS accounts, credentials or connectivity. Clerk is excluded. Remaining AWS services, region, infrastructure tooling and dependencies are **proposed**, not selected or provisioned.

**Agreed functional scope:** the core planning, Library, adjustment, saved-pipeline, live-plan and comparison journeys; Library timing-impact preview; Excel workbook export. Separate local workspaces are included. Real accounts, shared membership/access, invitations, admin transfer and multi-user editing enforcement are deferred to the AWS integration stage, remaining part of the intended hosted application. England bank-holiday highlighting is deferred.

### Local-first delivery boundary

| Capability | First local delivery | Later AWS integration |
| --- | --- | --- |
| Running the app | React through the local development server | Host the same application on AWS |
| Scheduling and comparison | Shared TypeScript domain functions | Reuse them in the client and server validation |
| Saved contents | Local browser storage | An authenticated API and AWS-backed database |
| Identity | One clearly identified local user | Verified Cognito accounts |
| Workspaces | Separate local Libraries and pipeline contents | Private shared workspaces with authenticated membership |
| Concurrent editing | Single-user editing, with explicit Save and baseline protections | Server-enforced editing ownership, revisions and conflict handling |
| Export | Generate the agreed XLSX workbook locally | Retain export with authenticated data access |

Build a usable application, not another disposable visual mockup. Keep the initial setup to the local React app and browser storage; a separate local API/database server, cloud emulator or local authentication system is not required by this approach. Do not create fake sign-up/invitation screens that imply real security or sharing.

Named pipeline contents persist only through explicit Save. Applied working state remains in memory; the approved local exception preserves unfinished Add/Edit procurement forms and their working context for explicit Resume/Discard. Applying/discarding a form removes that recovery copy. Local saved data and drafts are specific to that browser/origin and can be lost if storage is cleared. There is no automatic cloud sync or cross-device sharing. Keep the new app's storage separate from the existing prototype's `ltpp-connected-mockups-v1` data; no reset or implicit migration.

**Agreed for first use:** starter Libraries are deferred. Workspaces begin with no phase/template definitions, rules or procurements. A reusable phase and its optional clash rules can be explicitly created inside Add Procurement as well as from Library. Those definitions remain saved if the user subsequently discards the procurement. Offering starter definitions later can reuse the same data operations; no starter-import framework is being built now.

## 2. Accounts, workspaces and access

### Agreed hosted account model (deferred locally)

- Any email address can register; there is no organisational-domain restriction.
- Email ownership must be verified before workspace access.
- Invitations require acceptance. An invited person can register if they have no account.
- One account can create and belong to multiple workspaces.
- The creator is the workspace admin by default, unless they designate someone else.
- The admin manages membership/access and can transfer administration when leaving a team.
- Each workspace is private and independently contains its Library, projects, pipelines, saved alternatives, one selected live plan and other saved plans.
- Membership of one workspace grants no access to another. No shared project data or cross-workspace comparisons in the first release.
- This supersedes the earlier single-organisation, central organisation-admin and mandatory organisational-SSO proposals.

| Workspace role | Agreed capability |
| --- | --- |
| Admin | Editor capabilities plus workspace access management and administration transfer |
| Editor | Edit pipelines/projects, maintain the workspace Library and choose the live plan |
| Viewer | View and download/export workspace contents |
| Non-member | No access to private workspace contents |

The application's infrastructure operators are a separate technical concern; they are not a new customer-facing organisation-admin role.

### Implementation proposal

The local application uses one explicitly local identity. Local workspace separation is useful organisation of saved data, not a security boundary between multiple people using the browser. Genuine registration, invitations, roles and admin transfer are deferred rather than simulated as secure features.

At the AWS stage, use Cognito's managed authentication flows rather than custom credential handling. Store workspace membership and application roles in the application data model. Authenticate and authorise every server operation, including export, Library changes and administration transfer. Interface visibility is not an access-control boundary.

Open design details: invitation expiry/revocation, acceptance by the correct verified account, safe admin-transfer confirmation, the outgoing admin's remaining access, and what happens if an admin loses access to their account. Preserve an accountable administrator during a transfer. Choose sign-in methods, Cognito tier and session settings during the architecture/cost review.

## 3. Editing, saving and the live plan

### Agreed behaviour

- Viewing is the default; editing is deliberate and clearly indicated.
- Live editing is a modal over Live Pipeline. Other saved editing is a modal over Saved Pipeline Plans. Closing returns to the corresponding page beneath the modal. Clean edits close immediately; dirty edits offer Save and exit, Discard changes and exit, or Keep editing. Unapplied forms are protected first. Failed/cancelled saves retain inputs and work.
- One editor per named editable pipeline. Other pipelines and workspaces remain independently editable.
- Others can view the last saved contents of an edited pipeline or create a separate alternative.
- The first Save establishes the live plan automatically. Save updates its latest saved contents; Save as creates a separately named alternative. The Live Pipeline page always displays the selected live plan.
- Apply in an editor/adjustment updates working state. Explicit Pipeline Save persists the named pipeline.
- Each pipeline plan stores its own procurement schedules. Editing a procurement in one plan never automatically edits its counterpart in another saved plan. Save as preserves procurement identities for comparison while keeping plan contents independent.
- Edit procurement exposes editable anchor date/milestone fields through Edit details, without a persistent lock. Adjust defaults to protecting its anchor; movement permission expires when that modal closes.
- Save overwrites an existing editable record; Save as creates a separately named copy. Require a name for a new record and offer Notes (optional) on Save. Neither saving nor proceeding with a critical clash requires justification.
- Retain latest saved contents, saved details and any existing historical confirmation metadata. No browsable history of every overwritten Save in the first release.
- Make live changes the workspace selection after one confirmation naming the incoming and outgoing plans. The outgoing plan remains saved. Do not introduce baseline or approval stages.
- Unfinished Add/Edit procurement forms are preserved locally in the same browser, with an explicit Resume draft / Discard draft choice on return. Applying or explicitly discarding the form clears its draft. This is separate from named Pipeline Save; applied working changes still need Save. No server/cross-device draft recovery is included.
- Offer Save / Discard / Cancel for leaving or switching context where possible. Do not promise that a browser warning prevents every interruption.
- Abandoned editing ownership must expire; unsaved work must not hold a pipeline indefinitely.

### Implementation proposal

Keep applied working state in the current session's memory, distinct from named saved data. The approved exception is a browser-local procurement form draft: preserve incomplete inputs, phase identities, pending relationship reviews, anchor values and movement state together with the form's working-pipeline context. Obsolete recovered lock flags are ignored. Offer recovery on the Pipeline page; never silently apply it or overwrite saved contents. Recalculate preview using current Library checks after Resume. Use the existing browser APIs, schema validation and React form facilities without another dependency or database upgrade. In local mode, explicit Save writes the named pipeline store; handle quota/storage failures without losing the previous saved record or clearing active input.

Store one latest procurement draft per workspace in namespaced browser localStorage. This is local convenience for the existing single local identity, not a user access-control boundary or a multi-tab merge mechanism. Storage may be unavailable, full or cleared: show a visible warning when preservation fails, keep the form usable, and make no guarantee of cross-device recovery. Explicit navigation discard clears the form draft while independently protecting any applied pipeline changes. An older recovered context retains its saved-record revision, so existing stale-save checks prevent overwriting newer contents.

In the local stage, preserve explicit edit mode, coherent saving and Make live and relevant saved-record/Library validation. Do not implement a mock multi-user lease system. Decide the supported same-browser tab behaviour before claiming cross-tab protection.

At the AWS stage, add server-enforced editing ownership and record revisions. Reject stale saves, expired ownership, stale live-plan selections and changed relevant Library data. Make save-and-switch, Make live and administration transfer coherent operations, avoiding partial results. Request replay or a lost response must not accidentally create duplicate records or confirmations.

Open details: editing lease duration/renewal, idle warnings, abandoned-lock release/takeover, same-user multiple tabs and precise behaviour when ownership is lost. Make live must check whether the selected record or current live selection changed after the confirmation opened. Creating alternatives must not acquire a workspace-wide lock.

## 4. Scheduling and Library rules

### Scheduling rules to preserve

- Whole active weeks for phase durations and intentional phase overlaps; milestones have zero duration.
- Monday planning boundaries. Actual anchor dates remain distinct from the Monday plotting boundary.
- One named anchor milestone per project. Edit its date/milestone through Edit procurement's Edit details. Adjust protects it by default and requires temporary explicit movement permission for the current modal only.
- Normal phases finish on Friday for display/export; a normal sequential following phase starts Monday. Preserve intentional overlaps/gaps rather than forcing all activity into a sequential pattern.
- The two-week Christmas/New Year pause does not count as active phase duration. Moving clear of it removes the extension rather than changing stored active weeks.
- Paused time alone does not create a clash. Preserve separate active overlap spans and active-week totals.
- Adjustment gaps are inactive calendar time, not extra working phase duration.
- Warnings and critical clashes remain visible and advisory, including during adjustments. No recorded explanation or acknowledgement is required to apply, save or confirm a pipeline. Offer optional pipeline notes when saving or confirming; retain existing stored notes.
- **Current Add/Edit policy:** warnings and critical clashes remain visible and advisory. No explanation or acknowledgement is required to apply or save. Save still validates current Library references and revisions, and stale changes require refreshed review. Earlier 2A mandatory-explanation requirements are superseded.
- Preserve date-only calculations without local-time/DST shifts. Milestones retain actual dates; do not force their dates to Friday.

Broader project calendars are not an MVP feature. Keep calendar policy in a distinct domain module so future changes do not require rewriting the UI.

### Agreed simplification: one current set of clash rules per workspace

The user explicitly replaced the prototype's saved-rule behaviour:

1. A new or changed clash rule applies throughout its workspace: working pipelines, the live plan and all other saved plans.
2. Recalculate assessments against current rules. Checking a saved plan does not change its dates, while its warnings can reflect current knowledge.
3. A rule change does not move dates or change durations.
4. Compare evaluates both schedules with the same current workspace rules.
5. Do not implement historical clash-rule snapshots for the MVP or restore different-rule assessment as the normal comparison model.
6. The prototype's different-checking-rules comparison section, labels and counterfactual attribution are consequently unnecessary in the target application.

The prototype still uses recorded rules in saved viewing/comparison. Updating that behaviour is implementation work, not part of saving this plan.

### Agreed duration-update eligibility

Library duration changes are selective forward planning, not automatic rescheduling:

| Activity | Treatment |
| --- | --- |
| Past, already started, or starting today | Excluded from duration updates; past/started activity remains protected |
| Starting after today and using a Library default | Potentially eligible, subject to the user's selection and accepted preview |
| Using a custom duration | Never replace that duration with the new default |
| Future custom-duration activity affected by a neighbouring update | Its dates may move only after the user reviews and accepts the preview |
| Live and saved plans | Explicit preview/application and Save; no silent duration overwrite |

Eligibility depends on activity dates, not when a pipeline was saved. Record whether a duration is inherited or overridden; do not infer this simply because two numbers happen to match.

Before applying an update, show its direct and indirect timing effects, Christmas effects, gaps and changed clashes. Preserve protected activity and anchor constraints. Declining an update must leave the existing schedule intact. Apply remains distinct from named Pipeline Save.

**Agreed and implemented in the consolidated restoration package:** choose one editable pipeline from Library (the current working pipeline, live plan or another saved alternative), review eligible activities and apply selected updates to working memory. Repeat for another pipeline if needed. Save/Save as remains explicit; there is no multi-pipeline bulk overwrite. Existing session/navigation protection applies when another pipeline would replace unsaved work. Templates expose explicit per-phase review of current defaults; no template or procurement silently changes with a Library duration edit. No actual-progress tracking/status feature has been agreed.

**Agreed historical-property policy:** saved schedules retain their recorded names and colours. Library edits affect new additions; existing templates copy current defaults only through explicit selection, retaining custom-duration protection. Current clash rules remain workspace-wide, independent of those recorded properties.

## 5. Interface and Excel export

### Preserve the chosen design

- Use the approved horizontal context bar with clear viewing/editing/live states and the established actions.
- Keep main-page metadata uncluttered; retain saved details in Saved Pipelines.
- Preserve View / Edit / Compare terminology, modal editing and explicit Save.
- Use normal bold rather than extra-heavy inherited font weights.
- Preserve native automatically wrapping findings cards in ordinary findings lists, explicit severity text, red critical and amber warning styling, and accessible links/details.
- Compare keeps collapsed sections, collapsed project summaries and expandable exact dates. Combine adjacent activities only when they move equally, have unchanged durations and have no other changes hidden by grouping.
- Explain Christmas-induced differences only on affected activities, explicitly distinguishing unchanged active duration from changed date extent.
- Findings default to **All issues**, including matching problems labelled **Same in both pipelines**. Differences only is optional.
- Show full named per-pipeline issue totals, including on collapsed project-pair groups. Avoid combined differing-finding totals that compete with those counts. Filter result counts appear only when filtering.
- Compare's high-level overview is dynamic. Simplify rule wording to the current workspace-rule model; do not copy the obsolete rule-comparison section.
- Preserve numeric/keyboard alternatives to dragging, focus restoration, visible discard dialogs and sensible wide-table scrolling.

The agreed progressive-disclosure redesign concerns general Compare. Make live uses the approved single confirmation, without a separate baseline review.

### Shared workspace navigation

**Agreed:** after entering a workspace, show its name and switching/management controls discreetly in the shared top navigation bar on every workspace page. Remove the repeated workspace section/banner and its navigation controls from page content. Keep workspace creation and management on their dedicated page, reachable from the top bar. Apply this consistently to Pipeline, Add/Edit, Library, Saved Pipelines, saved viewing, Compare and How it works within a workspace, with usable keyboard access and narrow-screen behaviour. The approved pipeline context bar still describes the selected pipeline and its viewing/editing/live state.

### Approved wording is part of the design

**Agreed:** copy the approved static wording exactly on every page and in its dialogs, disclosures and notices. This includes headings, subheadings, explanatory notes, labels, buttons, table headings, legends, tooltips and relevant accessible instructions. Do not paraphrase, shorten, add competing explanations, rename actions or substitute generic application copy during the React conversion. Internal Project types do not authorise changing visible Procurement terminology.

Use the final connected prototype and the latest user-approved corrections recorded in `HANDOVER.md` as the reference. Read the HTML and the scripts/React components that populate it; initial HTML alone does not establish the displayed message. Earlier option mockups, rejected wording and historical handover entries are not alternative sources to choose from. Record the exact source element, function or component for each item when preparing its implementation package.

Dynamic text must preserve the agreed message templates and the conditions selecting them. Populate names, dates, counts and movement values from actual data; preserve the agreed singular/plural forms, ordering, severity labels and alternative messages. Matching issues remain visible by default. Do not replace specific messages with a single generic sentence or hardcode the demonstration's counts, names or dates.

Later agreed product changes still apply: current workspace rules replace saved-rule comparisons, XLSX replaces CSV, starter Libraries are deferred, and unfinished procurement forms now have the separately approved local Resume/Discard recovery. Identify text affected by these changes explicitly. Where replacement wording has not been approved, mark it **wording decision required** and present the proposed text and conditions for review. The same applies to genuinely new local-workspace, first-use and future hosted states without a prototype counterpart. Do not copy demo-only instructions into the real app or invent replacement wording silently. SG-001's unfinished prototype placeholder is not approved final guidance.

For each page/state, the implementation review must record: approved source; exact static text or dynamic message template; display condition and variable values; React destination; implementation status; verification evidence; and any specifically agreed departure. Keep this inventory with the relevant checklist item/package, rather than introducing a separate copy-management framework or duplicating scheduling logic. A functional test passing does not establish wording parity.

### Prototype coverage checklist

All items below remain unchecked until their stated behaviour, wording and relevant states have been verified. Some underlying functionality is already implemented; unchecked does not mean wholly unbuilt. Delivery assignments organise remaining work and do not grant implementation approval. Review guidance, navigation continuity and the existing pages' wording before expanding functionality.

| Status / ID | Area and approved reference | Required coverage and verification | Delivery assignment |
| --- | --- | --- | --- |
| [ ] PC-01 | **How it works and first use:** [original guide](mockups/how-it-works.html), latest approved guidance and setup-help lifecycle above, delivered How it works and welcome components | Preserve the guide and welcome layout and approved scheduling copy. Explain automatic first-save activation, Save/Save as, modal Close and Make live consistently. Welcome appears on workspace entry while the example remains; Getting started is dismissible per workspace, absent after a live plan is saved; How it works remains available. Verify guidance links and dynamic states. | Delivered subset; final acceptance remains. |
| [ ] PC-02 | **Navigation and working context:** [Pipeline script](mockups/pipeline.js), [connected adapter](mockups/demo-data.js), latest approved saved-modal/live/setup navigation and local recovery requirements | Keep workspace controls and saved navigation in the header. Live Pipeline is always live/empty; live editing is a native modal over it. Other saved View/Edit is over the saved list. Verify old-link redirects, Save/Save as, failures, Back, Close/Save/Discard, workspace isolation, focus/scroll restoration and procurement recovery. Applied working state remains memory-only. | Modal navigation delivered; final acceptance remains. |
| [ ] PC-03 | **Pipeline Plan page and procurement overview:** [page](mockups/pipeline.html), [dynamic copy](mockups/pipeline.js), approved first-live setup and terminology changes | Use the live plan name as the populated page's main heading inside its blue context panel; no separate Your procurement pipeline plan heading. Retain the blue live-status label and approved explanatory text. Use Editing live pipeline plan as the live editor title. Live overview names are plain text, with View details and direct Edit actions in Actions. Preserve prototype context colours, save states, checks and timeline, subject to approved live-plan changes. Keep metadata/prototype notices off the main page. Verify blue live/purple edit/grey saved context, Add/Adjust, example and narrow layouts. | Milestone 2 functionality complete; final cross-browser/device/accessibility/scale acceptance in Milestone 4. |
| [ ] PC-04 | **Ordinary warnings and critical clashes:** [Pipeline findings](mockups/pipeline.html#pipeline-findings-section), [rendering/filter messages](mockups/pipeline.js), `HANDOVER.md` findings requirements | Preserve the continuous automatically wrapping coloured grid, critical-first ordering, severity filters, pressed states, counts, announcements and meaningful empty results. Both procurement names link to the appropriate Edit or saved-details destination; map different phase names to the right procurement. Check exact notes and messages for all severities, filtering to zero, no findings and no configured rules. Apply the shared approach wherever ordinary findings appear. | Milestone 2 for Pipeline/editor findings; check subsequent Save/Adjust/viewer surfaces when delivered. |
| [ ] PC-05 | **Shared timeline and inspection:** [Pipeline rendering](mockups/pipeline.js), [adjustment](src/prototypes/pipeline-adjustment.tsx), [saved/comparison timelines](src/prototypes/pipeline-versions.tsx) | Reuse the shared renderer/tokens across example, previews, main plan, saved viewer, Adjust and Compare. Preserve hover/focus details, multiple pins, close/focus restoration, overlap dates and active durations, anchor symbol, exact approved legends and Christmas/gap hatching without Pause text. Preserve selected windows and usable scrolling; resolve Adjust Full pipeline handling explicitly. Compare windows/scrolling stay synchronised. Verify all surfaces against the same visual rules. | Milestone 2 ordinary/Adjust visuals; Milestone 3 saved/Compare; Milestone 4 complete accessibility/scale acceptance. |
| [ ] PC-06 | **Add/Edit Procurement:** [Add](mockups/add-procurement.html), [Edit](mockups/edit-procurement.html), latest approved review/dialog refinements | Preserve approved copy, Library browsing/contextual creation with selected search-name prefill, right-aligned repeated Add controls, colour swatches, Library information tooltip, optional expandable rule summaries without rationale, relationship review/reordering, context-specific anchor editing and duration provenance. Edit details allows anchor date/milestone changes without lock controls; only Adjust has temporary movement permission, reset on close. Retain range movement, refreshed preview and saved-schedule comparison. Verify blue-grey review treatment, collapsed Phase and milestone dates with description, expanded outlined Clash checks, first-procurement/no-rule states, Christmas-only active-week explanation and no Anchor and gaps section. Keep Monday planning dates/Friday finishes and entered-anchor note where different. Final confirmation applies to the working copy; named Save remains separate. Findings are advisory without required explanations. Verify form Resume/Discard. | Milestone 2 functionality complete; final rendered-state/browser/device/accessibility/scale acceptance stays in Milestone 4. |
| [ ] PC-07 | **Library and templates:** [Library](mockups/templates-and-phase-library.html), latest approved phase/rule dialogs and template-anchor refinements | Preserve section navigation/search, phase colours, compact summaries without rationale, shared-rule scope, tinted rule boxes, coloured severity labels and neutral black-text open menu options. Preserve template descriptions, ordered phases/milestones, relationship review, copied defaults/custom protection and optional loading/replacement. Provide Add anchor milestone beside the selector, auto-select the created anchor and clear/prompt if removed; templates carry no anchor date. Selective Library timing review includes direct/indirect effects, protected/custom activity and Apply versus Apply and save. Historical names/colours and update scope are already agreed; do not reopen them. Reusable Library milestones remain SG-005, not implicitly delivered. | Management/preview delivered; finish relevant live/saved acceptance in Milestone 3 and retain SG-002 review. |
| [ ] PC-08 | **Saved Pipeline Plans and saved viewer:** [entry page](mockups/versions-and-baselines.html), [viewer](src/prototypes/pipeline-versions.tsx), approved saved-modal conversion | Non-live View/Edit reuses content in large modals over the list. Preserve Close protection, saved details/notes, shared visuals, nested controls, canonical links and return focus. Live list actions go to Live Pipeline or its edit modal. Status is Live plan or Saved pipeline plan; Make live retains outgoing data. Complete status filters/empty results, Compare, scope and expandable schedules without baseline-only history UI. | Basic View/Edit and Make live delivered; full saved acceptance and Compare remain Milestone 3. |
| [ ] PC-09 | **Save, Save as and Make live:** [save dialog](src/prototypes/pipeline-save-version-dialog.tsx), [save adapter](src/prototypes/pipeline-save-version.tsx), [baseline journey](src/prototypes/pipeline-baseline-journey.tsx), approved simpler live-plan journey (the baseline reference is historical only) | First Save names and establishes live atomically. Save updates the open named plan; Save as creates a separate alternative and opens it over the saved list. Notes optional, findings advisory. One Make live confirmation names both plans, retains outgoing data and validates source revision/current selection. Verify cancellation, failures, retained inputs, stale/competing writes, legacy compatibility and modal focus. No first/replacement baseline ceremony. | Live/save/Make live delivered; final saved and Compare acceptance remains. |
| [ ] PC-10A | **Adjust Pipeline Plan:** [connected adjustment](src/prototypes/pipeline-adjustment.tsx), [workspace styles](src/prototypes/pipeline-adjustment.css), shared scheduling domain | Local package delivered with the approved selection/window/action/revalidation choices and state/copy inventory above. Preserve the detailed acceptance list below. Apply updates working state only. Record remaining final browser/device/scale evidence before closing the whole item. | Local Milestone 2 package delivered; Milestone 4 complete cross-browser/accessibility/large-data acceptance. |
| [ ] PC-10B | **General Compare:** [disclosures](src/prototypes/pipeline-comparison-details.tsx), [messages](src/prototypes/pipeline-comparison-model.ts), [shell](src/prototypes/pipeline-versions.tsx) | Verify the detailed Compare acceptance list below. Preserve neutral selected order, collapsed summaries/groups, nested exact dates, matching findings by default and current rules on both sides. Do not restore obsolete different-rule sections. | Milestone 3, after Adjust in the existing order; Milestone 4 complete acceptance. |

### PC-10A: detailed adjustment acceptance

Reference the connected workspace opened from `mockups/pipeline.html`, not the standalone calendar-library trial. Read its source/styles alongside `src/domain/scheduling.ts`; reuse existing domain operations and installed drag support. Native dialog/focus/scroll capabilities and existing shared controls should be assessed before custom wrappers or dependencies. Any additional dependency requires its own make-or-buy assessment and approval.

| Check | Required behaviour and visual evidence |
| --- | --- |
| Entry and geometry | Enter from the live or saved editing modal, respecting explicit Save/Save as boundaries. Preserve the near-full-screen foreground workspace, backdrop, white header, selected-row treatment, timeline/side-panel split and persistent action footer. Prototype desktop uses an 18px veil inset, maximum width 1700px, 11px radius and 325px panel, narrowing to 290px at 1050px. Preserve actual spacing, typography, borders/shadows and action order from the source rather than redesigning it as a procurement form. |
| Initial and changed selection | Phase range initially where available; whole procurement for milestone-only data. Use the implemented real-data default: phases before the anchor, with first-phase or milestone-only fallback. Procurement clicks, phase clicks, modes and selectors stay coordinated. Switching procurement resets permission to move its anchor. Range endpoint selectors list phases; milestones inside the range still move. Show selected names and start/Friday finish, with meaningful unavailable-mode explanations. |
| Move controls | Earlier/Later numeric movement accepts 1 to 104 whole calendar weeks. Only selected activities move; unselected dates and locked anchors stay fixed. Create/remove gaps as needed instead of stretching phase durations. Reject illegal ordering or newly disallowed collisions with a useful explanation. Verify both directions and zero/no-change outcomes. |
| Pointer and keyboard dragging | Preserve nearest-week snapping in both directions, 5px pointer activation threshold, original/ghost feedback, Move selection handle, earlier/later readout, invalid-move feedback and horizontal-scroll coordination. Keyboard Space starts, Left/Right changes week, Space drops and Escape cancels. Locked selection has visibly different feedback. Confirm equivalent results through numeric controls. |
| Phase duration | Single-phase Move phase / Change duration tabs support keyboard arrows, Home and End. Duration is 1 to 5200 active weeks. Keep start date / Keep finish date fixed is explicit. Other activities remain in place and shortening can leave a gap. Guard anchor/milestone/order boundaries and increased unapproved overlap. Do not reinterpret this as automatic downstream rescheduling. |
| Anchor | Name the anchor, retain its entered date and explain its Monday plotting position where relevant. Show deliberate Allow this procurement's anchor date to move permission only for relevant selection; otherwise explain that it stays fixed. Permission resets when the modal closes, including after Apply; it is not saved on the procurement. Duration protections must not be bypassed by movement permission. Preserve original date on cancelled/rejected changes. |
| Undo and session scope | Each committed adjustment has an undo snapshot, restoring draft, counts and status together. Undo is unavailable before a change and during review. Reopening starts a fresh adjustment history. The session starting point includes pre-existing working edits; cancelling this workspace must not discard those edits. |
| Review and dates | No-change review is disabled with an explanation. Review shows a read-only proposed timeline, before/proposed/movement table, anchor changes, added/removed gaps and active duration changes. Distinguish different start/finish movement and calendar-gap length. Preserve proposed-cell tint and changed-value emphasis, sticky Pipeline visual / Date and duration changes navigation, desktop review scroll/focus destination, and Back to adjusting without data loss. Explain Christmas effects only on affected rows. |
| Findings | Compare current-rule findings with the session starting point, across the full timeline rather than the viewing window. Distinguish New, Remaining and Resolved with correct counts/severity. Include procurement/phase mapping, actual overlap spans and active duration; Christmas-only overlap does not count. Preserve meaningful no-rules/no-findings/unchanged states. All findings remain advisory, without reason or acknowledgement fields. |
| Apply, revalidation and failures | Only changed procurements merge into the surrounding working copy. Preserve metadata, Library links, custom/default duration provenance and unrelated edits. Apply is distinct from named Save. Agree revalidation when rules or source records change while open. Failure leaves the draft available with actionable feedback. No general adjustment autosave/recovery or new hosted locking is included. |
| Cancel, X and Escape | Clean close returns immediately. Dirty close opens an unmistakable foreground alertdialog, with focus on Keep editing; keeping restores the launching control. Discard removes only this adjustment session. Escape first closes an unpinned tooltip, otherwise steps back from review, then uses the normal cancel/discard flow; it must not cascade through all levels. Trap modal focus, make background inert, lock body scrolling and restore focus to Adjust on exit. |
| Narrow presentation | At the prototype's 700px breakpoint, use the 5px veil inset and 7px radius, stack board then controls in one scrollable body and stop independent panel scrolling. Preserve horizontal timeline inspection and wrapping, available footer actions. Check keyboard access, enlarged text and wheel/touch scrolling with the pointer over content, not only over the backdrop. |

Do not carry demo fixture names, counts, legacy `award` identifiers or singular/plural bugs into the real-data implementation. Action labels and Full pipeline handling were subsequently approved with the implementation package as recorded above. Saved-window closing now returns to the saved list under the later approved modal conversion.

### PC-10B: detailed Compare acceptance

| Check | Required behaviour and visual evidence |
| --- | --- |
| Selection and context | Preserve two neutral selected-order names and selectors, selection/switch/cancel journeys, valid/invalid choices and return destinations. Directional baseline-replacement review is a separate journey. Do not confuse the read-only compared records with the live plan or pending working edits. |
| Timelines and navigation | Reuse shared timeline visuals/inspection, viewing window and synchronised horizontal scrolling. Show all actual procurements, including larger plans, rather than demo-only preview rows. Preserve top section navigation and descriptions of what each disclosure reveals. Verify identical/unequal plan contents and long names. |
| Schedule differences | Initially collapse the section and procurement groups. Group headings use dynamic high-level labels, including Phase durations. Expanding a procurement shows plain-language bullets; exact before/after dates are a further disclosure. Group contiguous phases only when movement is equal and duration conditions permit. Distinguish earlier/later start, different endpoint movement, duration changes, additions/removals and unchanged outcomes. Include Christmas explanations only where relevant. |
| Warnings and critical clashes | Initially collapse the section and each procurement-pair group. Keep named per-plan red critical and amber warning totals visible in the header, with an explanatory subtitle. Default to All issues, including matching problems; Differences only is optional. Preserve search, severity and comparison filters, selected/cleared/zero-result states, group counts and the matrix mapping each phase/pair to both plans. Do not repeat a finding under both procurement names or substitute opaque differing findings language for useful summaries. |
| Rules and dynamic summaries | Evaluate both sides using current workspace rules. Exclude obsolete saved-rule differences/repeated equal-rules panels. Derive summary names, counts, severities, high-level labels and singular/plural wording from data; use reviewed alternatives for identical schedules and no findings. Any genuinely new wording without an approved equivalent requires review. |
| Scale and accessibility | Keep larger schedules manageable through existing nested disclosures, not hundreds of initially expanded rows. Preserve regular bold rather than extra-bold headings, severity labels, focusable summaries, filter labels, readable narrow tables and predictable expansion/scrolling. Test representative one/many/zero conditions; final browser/device/scale acceptance remains Milestone 4. |

Saved-page verification in PC-08 must include its live summary/status filter and full viewer, not just the currently delivered basic table. PC-09 must separately verify first-baseline setup, replacement review, result/history and save-before-switch states. These remain in their existing milestones; the audit does not prioritise them ahead of Adjust.

**Dynamic-message verification:** complete these checks within each applicable PC item, recording exact approved strings/templates and branch conditions from its references. An example state or the initial page alone is insufficient.

| Message family | States/conditions to cover |
| --- | --- |
| Pipeline context and saving | New/unnamed; saved clean; unsaved edits; saved read-only; current/previous baseline; edit-as-copy; save/overwrite/Save as/switch success, validation, stale data and failed write. New states without approved wording remain open. |
| Findings and filters | Zero/one/multiple critical clashes and warnings; no rules versus rules with no findings; matching/differing issues; only in either selected pipeline; unfiltered/filtered/zero results; correct per-pipeline and procurement-pair counts, names and severity. Preserve approved singular/plural and announcement behaviour. |
| Dates, movement and durations | Earlier/later/unchanged; equal versus different start/finish movement; entered-anchor date versus planning Monday; phase durations versus calendar extent; added/removed activity or gap; Christmas explanation only where applicable. Group consecutive phases only under the agreed equal-movement/unchanged-duration conditions. |
| Editor and Library review | Unpreviewed/previewed/unchanged/changed schedule; editable procurement anchor fields; temporary Adjust movement permission; inherited/custom duration; relationship review required/complete; template replacement; eligible/ineligible updates and indirect effects; advisory critical/warning findings without explanation requirements. |
| Compare disclosures and empty states | Collapsed/expanded section and procurement group; summary versus exact dates; all issues versus Differences only; equal schedules versus differences; cleared filters; actual selected-order names and dynamic high-level summaries. Preserve the agreed descriptions of what expansion reveals. |
| Dialogs, results and failures | Clean close versus dirty close; Keep editing/Discard; required name versus Notes (optional); successful working-copy apply versus persisted Save; storage failure/staleness/retry with inputs retained. New local/hosted-only limitations or errors need reviewed text where the prototype provides no suitable message. |

**Usability package progress, 11 November:** header workspace navigation, session continuity and the guide are implemented. Applicable Pipeline titles/save states, checks, timeline legend, Add/Edit headings/introductions/table labels/anchor guidance, Library phase instructions, contextual phase creation and Save/Save as wording have been restored from the references. The approved new first-use copy below is implemented. Whole PC items remain unchecked where their future states or related features are still missing.

**Pipeline restoration progress, 12 November:** the procurement overview, ordinary findings filters/procurement actions and floating/pinned details are now delivered, with equivalent-schedule reference checks. The earlier next-package recommendation for those items is fulfilled. The current editing/viewing layout is restored using the approved source styling and available working controls. No demo notices, fictional-editor labels or Reset demo action are included in the application.

**Outstanding React parity work (historical 12 November snapshot; see latest status for completed packages):** real baseline states/default live entry, their exact state-dependent subheadings and actions, Adjust Pipeline, templates, Edit range movement/saved comparison/confirmation summaries and general Compare still require their functional packages. In particular, the screenshot's live heading/subheading and blue fixed-baseline bar must be delivered with actual baseline state; no current editable alternative is represented as live. Source editing text that assumes an existing live baseline is not silently rewritten or falsely displayed before that state exists. The current combined date-review layout and extra creation controls are not yet the complete prototype editor. New storage/staleness, form-discard and critical-explanation messages retain their existing local-build behaviour pending wording review where no approved equivalent applies; SG-001 remains open. This delivery does not establish exhaustive Add/Edit, Library, baseline-viewer or Compare parity. Broad PC rows remain open where they include those future states; SG-003's user review remains tracked separately.

### Implemented wording and navigation slice

The user separately approved the implementation package after reviewing its exact scope and revising the introduction. The only additional first-use/availability text agreed during this review is:

> A pipeline brings your procurements together on one timeline. The example on the page shows what you can create; your own timeline will replace it when you add your first procurement.
>
> 1. **Add your first procurement**
>
> To begin, close these instructions and choose **+ Add procurement**. Choose its phases (e.g. Dialogue, Evaluation, etc.) and their durations, and set its anchor milestone and date (the fixed point around which its schedule must be calculated).
>
> 2. **Build and check your pipeline**
>
> Add further procurements to see their schedules together and check for problematic overlaps using your Library rules.
>
> 3. **Save your pipeline**
>
> When ready, choose **Save** and give the pipeline a name so you can return to it later.

Here, Library links to that workspace's Library. A separate paragraph links How it works:

> See **How it works** for a guide to building procurement schedules, checking overlaps, saving and comparing pipelines, and choosing a baseline as your live plan.

> You can revisit these instructions at any time using **Getting started** on the Pipeline page.

**Single-step entry, separately approved 12 November:** an empty workspace offers **+ Add procurement**, which opens the existing form directly using the edit route and `add=1` intent. There is no intermediate Create pipeline step and no saved pipeline is created by opening the form. Cancel returns to the empty-state example; applying the first procurement replaces it with the unsaved working timeline. Save names/persists that pipeline later. The modal's four paragraphs above, links and bold emphasis are the approved current wording and supersede the earlier first-use copy. Existing shared editor, session and router protection are reused without a new dependency or data-schema change.

Single-step entry verification: all **45 Chromium tests pass**, including direct first Add/Cancel/reentry, replacement of the example on Apply, the approved four modal paragraphs and emphasis, responsive modal/focus behaviour, and the existing save/session/failure journeys. Production build/strict checks and new app/test lint pass. No domain code changed, so the prior 119 Node-test result was not rerun for this UI correction.

The guide preserves all four approved points and the date sidebar verbatim, including the pale-blue fourth section. Its separate temporary note is:

> Templates, Compare and baselines are not available in this build yet.

The unavailable View live pipeline action is omitted until baseline functionality exists. Existing Open Saved Pipelines/Open Library guide links remain; this does not change View/Edit/Compare row-action terminology.

| Delivered wording/state | Approved reference and condition | React destination / verification |
| --- | --- | --- |
| Initial pipeline and working context | The latest correction places the approved first-use paragraphs above exclusively in a native welcome modal, automatically shown on the first Pipeline visit in each workspace in this browser. Dismissal is remembered independently per workspace; Getting started reopens it on empty or populated pages. The empty panel retains its heading/actions and example, without the long paragraphs. The example disappears after the first Apply, without waiting for named Save. `refreshName` in `pipeline-save-version.tsx` supplies Editing pipeline, Unnamed pipeline, Not yet saved, Unsaved changes and All changes saved according to saved/dirty state. The saved-edit context bar retains “Make changes to this saved pipeline, or use Save as to keep another alternative.” | `features/pipeline/pipeline.tsx`; `tests/planning.spec.ts`, `tests/usability.spec.ts` and `tests/pipeline-parity.spec.ts` exercise initial, populated-unsaved, dirty and saved branches. |
| Saved viewing | `VersionViewer` in `pipeline-versions.tsx`: “Inspect these saved contents without changing them. Choose Edit this pipeline to make changes.” Viewing remains read-only and does not replace the working session. | Pipeline viewing branch; pending-work / saved-view / resume browser check. |
| Pipeline checks and timeline | `pipeline.html` supplies Pipeline checks, its whole-pipeline description, Pipeline timeline and the individual legend labels. Removed main-page metadata stays absent. | Pipeline, `ui/timeline.tsx`; layout/browser checks. Full-window options, instructions tied to procurement links and pinned interaction remain PC-03/05 work. |
| Findings empty states and counts | No rules: Add's shared-rule review text “No cross-procurement restrictions have been specified. Names alone do not create rules.” Rules present with no findings: Pipeline's “No warnings or critical clashes found against the shared Library rules.” Actual finding counts retain singular/plural severity wording. | `ui/findings.tsx`; advisory/critical/no-rule/current-rule browser checks. Filter-result messages remain tied to the future filters. |
| Add/Edit and phase creation | Add/Edit HTML supplies the distinct page introductions, Name your procurement / Procurement details, Build the schedule / Phases and milestones, anchor help and Preview schedule / Preview changes. Phase creation uses Library's “Define a reusable activity for future templates and procurements.” or Add's “Create a reusable Library phase and add it to this procurement. All rules below are included when saving.” according to context, with the corresponding Create phase / Create phase and add to procurement action. | Shared project editor and phase dialog; original planning flows and dirty-form tests. Associated unbuilt template/search/range/review controls remain explicitly pending. |
| Save and Save as | `pipeline-save-version-dialog.tsx` supplies first-name versus copy versus overwrite descriptions, Name (required), Reason for saving (required), the saving hint, author/time labels, Save / Overwrite and save / Save as… and singular/plural procurement counts. The UI's new-name limit is 120 characters; existing stored records remain readable. `saved` in the save adapter supplies “Saved: {name}.” and View saved pipeline; its obsolete baseline claim is omitted. | Extracted `features/pipeline/save-dialog.tsx`; overwrite, Save as, same-dialog copy, failure/retry, stale-tab and save-before-switch tests. No change to storage schemas/transactions. |

The working pipeline now belongs to a memory-only provider at the workspace layout, separate from read-only saved viewing. Library, Saved Pipelines, the guide and inspection of other saved contents preserve applied working changes. The header Pipeline link and brand resume that context; without a working session, the last viewed pipeline is retained during workspace navigation. Replacing an edited record, switching workspace or opening Workspaces protects pending changes. One router blocker coordinates dirty forms and working schedules: discarding a form does not discard applied pipeline changes, and a second pipeline decision is required when leaving both. Save before switching waits for a successful write; failure preserves the form, working data and intended destination. This original package excluded reload/crash recovery; the later approved local procurement-form exception is recorded in section 3 and the latest implementation record.

Verification: 119 Node tests and all 32 Chromium browser tests passed. Four affected Add/Edit/guide/dirty-form tests were rerun successfully after the final static-text corrections. The guide test compares every workflow/sidebar heading and paragraph to the approved HTML. Header placement, no repeated workspace section, keyboard navigation and page overflow were checked at 320/768/1440px; guide and Pipeline screenshots were inspected. Production build/strict checks pass; new code has no lint warnings and the nine existing prototype warnings remain. Full cross-browser/accessibility and large-data acceptance are still outstanding. No new dependency, domain calculation, schema, database version or prototype-source change was required.

For each package, review static wording against the referenced source and exercise the applicable dynamic branches with varied data. Use focused assertions for important conditional messages and manual page comparison for the full visible text; do not rely on a single large snapshot. Record explicitly agreed departures and unresolved wording. Final local delivery requires all applicable checklist items verified or an explicit user-approved deferral, with hosted-only and deliberately superseded behaviour identified separately.

### Welcome modal layout, separately approved 12 November

**Anchor placement correction, separately approved:** the user rejected the symbol hanging in the left padding. It is now inline immediately before the milestone name, with a 4px gap and inherited muted text colour/size. Long names wrap naturally, which may add one line to a timeline row. This supersedes earlier left-padding/unchanged-height notes. Reference comparisons retain the original styling checks with a bounded one-line allowance for the procurement row; real-label checks ensure the icon remains inside the text block.

**Anchor label symbol, separately approved 12 November:** the shared `ui/timeline.tsx` renderer prefixes each procurement's anchor-name/date label with a small native text anchor (⚓︎). Its accessible name and hover title are “Anchor milestone”. The label continues to use that procurement's actual `anchorName` and anchor date. This covers illustrative, editable, saved-view and editor-preview timelines through the same renderer; it does not alter timeline milestone plotting, dates or domain calculations. Native text rendering requires no icon dependency. Existing parity checks cover three illustrative symbols and accessible symbols on real saved-procurement labels.

**Example identification, separately approved 12 November:** the empty-state example has a pale-blue banner immediately above its timeline: **Example only — your pipeline is currently empty**, followed by “These fictional procurements show how your timeline could look. Choose **+ Add procurement** to start your own.” The banner and example disappear together on the first actual Apply, before Save. Timeline colours, illustrative records and absence of workspace writes remain unchanged. `example-pipeline.tsx` owns the banner; ordinary timelines and the shared renderer are unchanged. The exact banner copy/removal and narrow-screen wrapping are included in existing browser checks.

The standalone [welcome layout proposal](mockups/pipeline-welcome-layout.html) was reviewed and approved, followed by separate implementation approval. The React modal now follows that layout: short introduction, three numbered steps with bold headings, a separated help area and a separate Got it footer. Body text is consistently 15px rather than shrinking later paragraphs. Only the step headings, + Add procurement, Save and Getting started receive bold emphasis; Library/How it works remain links. This layout supersedes the earlier four-paragraph presentation and its scattered bold concepts; the instruction sentences themselves remain approved wording.

The shared native `Dialog` gains optional class/footer/title-focus props; existing dialogs retain their default layout/focus. `pipeline-welcome.css` scopes the 680px maximum width and actual-viewport maximum height. The modal itself is the native scroll container, with sticky header/footer, so wheel/trackpad scrolling can start over the body, header or footer without custom wheel handling. Initial focus is on the title without scrolling to the footer. The background is scroll-locked only while this welcome modal is open. Reduced-width/mobile views keep controls visible and permit vertical instruction scrolling. Dismissal, workspace separation, links, one-click Add, example isolation and saved-data behaviour remain unchanged.

### Welcome modal correction, 12 November

Anchor-label verification: all 9 Pipeline parity tests pass, including example/real accessible symbols, saved viewing, equivalent-source row dimensions and 320/768/1440px layouts. The small symbol occupies existing left padding, avoiding extra wrapping on long milestone names. Desktop screenshot inspected; production build/strict checks and new app/test lint pass. No domain code changed.

Example-banner validation: the 17 Pipeline parity/welcome tests passed; the first-procurement Apply/removal/storage case and 320/1440px empty-page checks were rerun successfully after the final banner/timeline join correction. Exact notice text, direct adjacency, disappearance on Apply and narrow-screen wrapping are checked. Mobile screenshots were inspected; production build/strict checks and new app/test lint pass. This scoped verification does not replace the historical complete-suite results.

Verification of the approved layout: all **49 Chromium tests passed**, including wheel scrolling in both directions over the modal body/header/footer at 320x520 and 720x450, PageDown, simulated touch swipes, enlarged text at 640x360, title focus, visible controls and stationary background. Reduced viewport tests cover layout constraints associated with browser zoom; physical trackpad/mobile-hardware and exhaustive browser zoom testing are not claimed. Desktop/mobile screenshots were inspected. Production build/strict checks and new app/test lint pass. No domain code changed; the prior 119 Node-test result was not rerun.

The previous restoration incorrectly left the long introduction embedded in the empty page. The user explicitly required a modal/pop-up and separately approved this correction: preserve the approved paragraphs and their workspace Library/How it works links inside the existing native `Dialog`, shown automatically on the first Pipeline visit per workspace. Close, Escape or Got it dismiss it; Getting started reopens it on empty and populated Pipeline pages. Links dismiss it before navigation. Native modal behaviour supplies the backdrop, inert background and keyboard focus containment; closing returns focus to Getting started. No new dependency or custom modal controller is needed.

`features/pipeline/pipeline-welcome.tsx` owns this small presentation preference. The browser stores only a namespaced per-workspace dismissal flag in localStorage, independently of pipeline/Library records and prototype storage. This is browser-local, not an account-wide onboarding service; clearing browser data resets it, and if localStorage is unavailable the guidance remains usable but dismissal cannot persist across mounts. No draft recovery, schema migration or workspace data mutation is introduced. The empty page retains its heading, creation/saved-selection actions and read-only example without the long introduction.

### Welcome modal correction, 12 November

The previous restoration incorrectly left the long introduction embedded in the empty page. The user explicitly required a modal/pop-up and separately approved this correction: preserve the approved paragraphs and their workspace Library/How it works links inside the existing native `Dialog`, shown automatically on the first Pipeline visit per workspace. Close, Escape or Got it dismiss it; Getting started reopens it on empty and populated Pipeline pages. Links dismiss it before navigation. Native modal behaviour supplies the backdrop, inert background and keyboard focus containment; closing returns focus to Getting started. No new dependency or custom modal controller is needed.

`features/pipeline/pipeline-welcome.tsx` owns this small presentation preference. The browser stores only a namespaced per-workspace dismissal flag in localStorage, independently of pipeline/Library records and prototype storage. This is browser-local, not an account-wide onboarding service; clearing browser data resets it, and if localStorage is unavailable the guidance remains usable but dismissal cannot persist across mounts. No draft recovery, schema migration or workspace data mutation is introduced. The empty page retains its heading, creation/saved-selection actions and read-only example without the long introduction.

Verification of the welcome correction: all **44 Chromium tests passed**, including per-workspace dismissal/reload/reopening, all close paths, guidance links, no pipeline/Library mutation, modal semantics and keyboard/responsive checks at 320/1440px. Mobile modal and desktop empty-page screenshots were inspected. Production build/strict checks and new app/test lint pass. Scheduling/domain code is unchanged, so the prior 119 Node-test result was not rerun for this presentation correction.

### Populated Pipeline restoration and illustrative empty state, completed 12 November

**Agreed and implemented:** the populated application should reproduce the chosen connected prototype's wording, layout, spacing and working interactions for the applicable state, incorporating later product decisions and compact header workspace navigation. Prototype/demo notices and Reset demo are excluded. The proposed replacement permanent subheading “Plan your procurements together on one timeline.” was rejected; it is not used. Keep the prototype's real state-dependent headings/subheadings as the reference, including “Your procurement pipeline” / “Follow the live plan, or explore a different way forward.” when the live-baseline state is actually implemented.

The user separately approved the revised page-restoration scope, including a read-only Example pipeline before the first procurement is added. The existing first-use explanation and How it works link are inside the empty-state panel; they are not permanent heading content. The example uses the same timeline renderer for three fictional procurement schedules with different phase lengths, dates and anchor milestones. Its deterministic illustrative definitions live only in `features/pipeline/example-pipeline.tsx`. They never enter the working session, Library or data API; no starter definitions, imported sample pipelines or saved records are created. Both explanation and illustration disappear immediately when an actual procurement is applied, even while the pipeline remains unnamed and unsaved. There is no persistent onboarding flag or draft recovery.

| Delivered portion | Verification and remaining boundary |
| --- | --- |
| Context bar and Save | Approved layout, name/status row, separate saved-edit explanation, purple/grey context styling, right-aligned checks/counts and Review findings. Native Save popover provides Save and Save as with their approved descriptions and the existing save workflows. Real baseline confirmation/return-to-live actions stay in the baseline package. |
| Timeline | Combined title/controls toolbar, arrow buttons, Six months/One year/Full pipeline, disabled stepping/date entry in Full pipeline, source label widths/row/bar dimensions, continuous phases, Christmas/gap hatching, outlines, legend and help. The Add action is wired to the existing editor. Adjust is not represented by a decorative control. |
| Floating details | The existing framework-independent controller is ported into typed `ui/timeline-details.ts` with its approved CSS, source binding and keyboard pin/close controls. Multiple independent pins are supported. Listeners/cards are disposed when their sources unmount; modals/navigation clean up the relevant details. Focus-driven scrolling keeps the active details available. The shared segment renderer's new Pipeline style is opt-in; reference prototype behaviour remains unchanged by default. |
| Findings | Critical-first wrapping cards, white section/header, severity filters/counts, pressed states, live announcements and conditional zero-result messages. Procurement/phase mappings, compact overlap dates and footer separators match the reference. Main-page procurement actions open Edit or read-only recorded details; critical explanations in review/save retain the existing workflow. |
| Procurement overview | Planning start, Planning finish, Actual anchor date and Edit/View details actions are restored for both current editing and saved viewing. Phase finishes use the shared Friday calculation, while actual milestone/anchor dates remain distinct. Read-only schedule details include phases, active durations, anchor information and gaps. Narrow tables keep readable columns in a labelled keyboard-scrollable region. |
| Navigation/focus | Returning from Add/Edit restores the Pipeline view/focus at the top. Review findings moves focus/scroll within the page without adding an unmanaged browser-history entry, preserving router leave protection. Existing session continuity, failed-save handling and workspace boundaries remain verified. |

Verification: **119 Node tests and all 41 Chromium browser tests passed.** The nine new parity journeys cover the illustration's lack of writes, its removal before Save, real finding filters/actions, read-only dates, independent pins/keyboard close/focus restoration, the native Save dropdown, Full pipeline and 320/768/1440px layouts. The reference test loads an editable connected-prototype pipeline into an isolated context and constructs equivalent schedules/phase links in isolated app storage. It compares context/row/label/phase dimensions, fonts, borders, radii and context colour; both screenshots were inspected. It is not a claim of whole-page pixel equality for unimplemented live/Adjust states. Empty and narrow populated screenshots were also inspected. Production build/strict checks pass; lint reports only the same nine existing prototype warnings; no dependency, schema, database version or scheduling-domain change was needed. Prototype source and the user's browser profile/data remain untouched. Cross-browser/full accessibility/large-data acceptance remain milestone 4 work.

### Agreed next priority: coordinated Library and Add/Edit restoration

**Planning sequence initially approved for documentation only; the complete implementation proposal was subsequently separately approved and implemented 12 November.** The user reported that Library and Add procurement did not resemble the approved prototype. Source review confirmed functional subsets with a different presentation. The consolidated approval covered all four stages plus the recommended one-pipeline update workflow and historical-property decisions, storage upgrade, tests and documentation. The sequence below records the agreed scope; it is not a request to obtain those same approvals again. It coordinates PC-06/07 without authorising unrelated later features.

Approved references are [Library](mockups/templates-and-phase-library.html), [Add procurement](mockups/add-procurement.html), [Edit procurement](mockups/edit-procurement.html), their connected behaviours and the latest product decisions in this plan. Current React destinations are `src/features/library/library.tsx`, `phase-dialog.tsx` in the same directory, and `src/features/projects/project-editor.tsx`. Reuse shared components across the three journeys; do not duplicate schedule or rule logic.

| Stage | Scope to propose for separate implementation approval | Acceptance criteria |
| --- | --- | --- |
| 1. Page structure and wording | Restore Library's Phases / Procurement templates selection cards and selected-section layout. Restore Add/Edit card structure, applicable numbered headings, explanatory text and action placement from their respective approved sources. | Inventory exact headings, paragraphs, notes, labels and conditional messages with source, display condition, React destination and remaining dependencies. Check Library selection/return and empty/populated Add/Edit layouts at desktop and narrow widths. Preserve compact workspace navigation. Identify functionality still missing explicitly; visual restoration alone is not complete screen parity, and inert controls must not suggest otherwise. |
| 2. Phase selection and settings | Restore searchable Library browsing, selected-phase details and shared-rule summaries, procurement row/settings interactions and repeated Add controls below the schedule. Consolidate phase browsing/settings where their behaviour is shared. | Check empty Library, search with results/no results, phase versus milestone, duration defaults/custom overrides, relationships, order changes requiring review and anchor restrictions. Rules map to the correct phases, including self-overlap and symmetric linked rules. Verify keyboard/modal focus and dirty close/navigation, including no unintended workspace writes on cancellation. |
| 3. Library editing and templates | Implement phase/rule maintenance and reusable templates with descriptions, ordered phases/milestones, relationships, usual anchor without dates, copied defaults/overrides and schedule replacement confirmation. | Verify shared-rule maintenance appears consistently under both affected phases, current workspace checks refresh without moving schedules, and templates are optional. Check create/edit, reordering/relationship review and keep-current/replace journeys. Before timing-impact actions, resolve the update-scope and historical-property decisions below; preview direct/indirect changes and protect started/past activities and custom durations. Verify stale/failed writes retain inputs and avoid partial changes. |
| 4. Preview and confirmation | Restore the approved review-table/timeline arrangement, action progression and final confirmation journeys for Add and Edit, preserving the shared scheduling/calculation engine. | Verify approved exact before/proposed/date-movement wording, changed/unchanged branches, Friday finish/actual-anchor dates, Christmas explanations only where relevant, warning/critical guidance and required critical explanations. Applying changes updates working memory; named Pipeline Save remains separate. Check cancel/back/failure and keyboard focus without losing work. Do not imply later Compare or movement functionality is complete until its real behaviour is delivered. |

**Required verification for each stage:** compare the actual rendered React pages with the approved prototype using equivalent data and matching states, at desktop and mobile widths. Record visual, exact-copy and interaction checks separately from calculation/data tests. Check empty, populated, dirty, validation-error, filtered-empty and unavailable states as applicable. Counts, names, dates, rule summaries and other dynamic text must derive from actual data and follow the agreed conditional wording. A stage is complete only for its explicitly delivered subset; retain remaining gaps in PC-06/07.

**Agreed exceptions remain:** workspaces start with empty Libraries; no starter records are inserted. Current workspace clash rules apply to every pipeline without changing dates. Unfinished procurement form recovery now follows the separately approved local recovery decision in section 3. No prototype/demo notices, fictional editors or reset controls enter the real app. Keep the existing one-step first procurement entry, explicit Save, shared session and leave protection. Older recorded-rule statements in prototype/history are superseded by the current-rule policy.

**Decisions required before affected stage-3 work:** choose where users may apply eligible Library duration updates (current working pipeline only or selected other editable pipelines), and how selection/preview/commit works across that scope. Clarify historical phase-name/colour behaviour and how Library updates are offered to linked templates. Future custom durations remain unchanged; adjacent future dates can move only after accepted preview. The already agreed protection for past/started activities remains. New empty-workspace, unavailable or changed-policy copy without an approved counterpart needs wording review rather than silent invention. These open points do not prevent proposing the earlier structure/browsing stages.

**Implementation gate:** present the exact next-stage files, behaviour, any data changes and verification before asking for implementation approval. Assess existing native/library solutions and reuse installed React Hook Form/Zod, native dialogs and shared domain code where suitable; this documentation approval does not authorise new dependencies, source/data edits or combining all stages into one implementation.

### Local unfinished-procurement recovery, 13 November

The user separately approved a limited exception to no recovery after experiencing loss of unfinished schedule inputs on refresh. `projects/procurement-draft.ts` defines a validated, versioned snapshot under `ltpp-app:procurement-draft:{workspaceId}`. Incomplete numeric/date/name fields remain recoverable without weakening normal Preview validation. The snapshot contains the Add/Edit form, original procurement and project identity, next item ID, anchor lock, pending movement and reviewed predecessor identities, plus the surrounding working-pipeline context and its original saved-record revision. It excludes unsaved Library/template dialogs and computed previews. No IndexedDB migration, new dependency, prototype-storage change or server service is introduced.

`use-procurement-draft.ts` writes main-form changes locally, flushes current values on pagehide/beforeunload, and reports preservation failures without clearing inputs. `procurement-recovery.tsx` asks Resume draft / Discard draft when the Pipeline route is revisited. Resume returns to the correct Add/Edit route and restores working context in memory; it never writes named pipeline contents. A fresh preview evaluates current Library rules, and deleted phase links must be corrected. Every refresh asks again; a one-time navigation marker is consumed rather than becoming an enduring recovery preference. Closing the prompt leaves the draft available. Explicit form/navigation discard or successful Apply clears the matching draft. Existing independent leave guards and stale named-save protection remain.

This is one latest local procurement draft per workspace for the existing local identity. Cross-device recovery, simultaneous-tab draft merging, general pipeline autosave and preservation of applied work after the form draft is cleared are outside scope. Named Save is still required after Apply. Browser storage deletion/unavailability can prevent recovery; warnings describe that limit. Revisit browser draft ownership/isolation before adding real accounts.

Verification: all **10 new Chromium recovery journeys passed** in the full browser run, covering repeated refresh, closed-tab return, incomplete inputs, pending reviews/IDs, cleared drafts after Apply, saved Edit/anchor lock, explicit/navigation discard, workspace separation, corrupt storage, storage-write failure, surrounding unsaved context and stale named-save rejection. The full run passed 79 of 80 tests; the remaining older assertion expected a plain Library reference and was updated to check its approved Library link, then passed in a targeted rerun. All 80 browser cases are therefore covered by the full run plus that rerun. **126/126 Node tests**, production build/strict TypeScript checks and app/test lint passed. Recovery prompt screenshots were inspected at 320px/1440px, with visible controls, modal focus and no horizontal overflow. Tests used isolated browser storage; user data was not cleared. Cross-browser and simultaneous-tab draft merging are not claimed.

### Phase search/creation and overlap wording refined, 13 November

The user explicitly authorised this refinement after reviewing the no-match modal. For a nonblank search with zero matches, `phase-browser.tsx` displays one grouped results state: **No phases found for “{search}”**, “Create a reusable phase for this procurement and future schedules.” and a primary **+ Create “{search}”** button directly underneath. The search value is trimmed for the contextual name while retaining the actual search input on cancellation. The duplicate zero count/no-match sentence and generic creation prompt are omitted in this branch. The disabled Add phase to procurement footer action is visually subdued. Selected-phase duration and preview guidance appears only once a phase is selected. Clearing/changing the search restores the normal browser state; this does not redesign the initial empty Library.

The shared schedule editor passes the search name to phase creation in both procurement and template editors. `PhaseDialog` accepts an initial name, using native focus/select on its name input when opening a new phase; typing replaces the selected text. Cancelling an unedited prefill returns directly to the chooser. Editing then cancelling retains the existing discard protection. Neither path creates a record until explicit Save/Create. Creating directly from Library still starts blank; existing phase editing retains the saved name. No new dependency or generic focus/combobox framework was needed.

The exact revised heading “Overlaps that will be flagged across the pipeline” is used in the phase browser, phase settings and Library phase create/edit dialog. Prototype files are unchanged; this is an explicitly approved wording departure. Native selection, existing validation and transactional creation are reused. No storage/schema, scheduling algorithm, draft recovery, starter records, AWS, AGENTS.md or SNAGGING.md change is included.

Verification for the search/wording refinement: **70/70 Chromium tests passed**, including four new journeys covering desktop/mobile no-results layouts, prefill/full selection, typing replacement, cancellation without writes, explicit creation, template reuse, blank direct Library creation and selected-phase guidance. Desktop/mobile screenshots were inspected. Production build/strict TypeScript checks and app/test lint passed. No domain logic changed in this refinement; the previously passing 126 Node tests were not rerun.

### Prototype phase interactions corrected, 13 November

The earlier functional verification did not establish complete phase interaction parity. The reference is the connected `mockups/add-procurement.html` phase browser, relationship tracking and insertion-marker reorder controller, with the matching shared Edit behaviours. This correction supersedes the earlier dnd-kit/up-down/Relationship reviewed implementation notes for the shared schedule editor.

- `phase-browser.tsx` restores the stacked Library radio results, selected Name in this procurement and Duration in whole weeks, source/default notes, linked rules, header description and Add phase to procurement footer action. Name/duration overrides are copied to the occurrence without changing Library data. Inline phase creation keeps the chooser open underneath; cancelling creation returns to it, while successful creation adds the phase and closes the chooser. Existing plain empty/no-match messages remain; the newly proposed redesign/messages are deferred.
- `domain/relationships.ts` and `use-relationship-review.ts` implement the prototype's predecessor-identity model in both procurement and template editors. Sequential items follow the actual neighbour without extra acknowledgement. Changed nonzero overlaps/gaps show previous/new neighbours, active-week amount, a Review first check shortcut and Keep this relationship only when valid. Changing the relationship/amount resolves a valid check. Invalid first-item offsets, impossible overlaps and invalid amounts must be corrected; there is no generic Relationship reviewed button or automatic clearing of a moved first item's nonzero relationship.
- `use-schedule-reorder.ts` ports the existing prototype's native pointer/keyboard controller rather than reproducing the incorrect live sorting. Actions contain Edit, remove and the grip; extra up/down buttons are removed. Dimmed source row, insertion marker and floating destination label preview the move; order changes only on a valid drop. It supports pointer capture, outside-drop/cancel protection, edge scrolling, Space/Enter, arrows, Home/End, Escape, Tab/focus/window-blur cancellation and focus restoration by item identity. Listener/animation/ghost cleanup is scoped to the mounted schedule. Existing installed dependencies and lockfile remain unchanged; the shared editor no longer imports dnd-kit for this interaction.

Verification: **126 Node tests and all 66 Chromium tests pass**, with successful production build/strict checks and new-code lint. Seven new browser journeys exercise staged phase selection/overrides without Library mutation, cancelled inline creation, contextual valid/invalid relationships, commit-only pointer insertion and outside cancellation, keyboard navigation/cancellation/focus, direct connected-prototype field/footer/note comparison, and narrow-screen chooser/touch drag. Existing template, data-upgrade, save/failure, critical-explanation, date and session checks remain passing. Desktop/mobile phase browser, relationship and drag screenshots were inspected. No storage/schema migration, scheduling-date algorithm, starter data, prototype source, AWS, AGENTS.md or SNAGGING.md change was included. Full-app parity and cross-browser/large-data acceptance are not claimed.

### Consolidated Library/Add/Edit implementation record, 12 November

| Area | Delivered implementation and source/exception |
| --- | --- |
| Library structure | `features/library/library.tsx` and `library.css`: approved page heading/introduction, icon selection cards, selected phases/templates sections, search/no-result state, phase/default/shared-rule/action table, counts and native create/edit dialogs. Shared rules appear under both phases and are edited/removed once through phase settings. Referenced phase deletion is blocked by current working state and transactional checks for saved pipelines/templates. |
| Shared controls | `phase-browser.tsx`, `projects/schedule-editor.tsx` and `schedule-values.ts`: Library browse/search, phase details and rule reasons, explicit duration inheritance, milestones, name/Library-link settings, repeated Add controls, grip sorting with installed dnd-kit and keyboard/up/down alternatives, review of changed neighbouring relationships and protected anchors. Shared settings Cancel restores its prior item; explicitly saved Library edits remain saved. |
| Templates | `template-editor.tsx` and validated template records: name/description, ordered phases/milestones, durations/relationships and date-free usual anchor. Explicit save, dirty cancellation, failure/stale-input retention, update-default review and optional loading/replacement. Applying a template assigns new procurement item identities and preserves procurement name/actual date; no existing procurement changes when a template is edited. Custom-duration defaults are not automatically replaced. |
| Add/Edit pages | `project-editor.tsx`, `project-editor.css`, `procurement-details-editor.tsx`: source numbered cards/compact Edit summary, approved headings/explanations, restored toolbar/anchor controls including Add anchor milestone, Edit details with deliberate unlock, pending range movement with edit/remove, source date-review/confirmation progression. Working changes remain separate from named Pipeline Save; critical explanations are retained. General Pipeline adjustment/Compare/baselines remain outside this package. |
| Review and comparison | `schedule-dates.tsx` supplies explicit start/finish columns, Friday phase finishes, actual milestone dates, movement summaries and targeted Christmas notes, removed rows and disclosed anchor/gaps. `schedule-comparison.tsx` uses the actual named-saved reference, a shared viewing-window control and synchronized scrolling for saved/proposed timelines. The shared Timeline gained optional extent/window/hidden-control props; ordinary timeline behaviour is preserved. |
| Duration impacts | `domain/library-updates.ts`, `library-impact.tsx`: selected one-pipeline review, future inherited activities only, unchanged custom durations, preview of direct/indirect changes and gaps, current clashes/required explanations. Updates that would move protected activity or move future activity into today/the past are blocked. Applying affects the working pipeline only; Save/Save as persists later. |
| Persistence | `schemas.ts` and `local-data.ts`: separate workspace-indexed template store added in IndexedDB v3, strict date-free template validation, atomic writes, case-insensitive name checks, workspace/reference checks and optimistic revisions for templates/Library edits. v1/v2 upgrades preserve prior records. No seed/reset/prototype migration, cloud or dependency installation. |

Approved source sentences and headings are retained where applicable; demo-only notices/placeholders and baseline-dependent statements are excluded. The new local-only timing-update/empty/failure text follows the workflow approved in the consolidated proposal. The How it works availability note now reads “Pipeline Compare and baselines are not available in this build yet.” because templates and Edit's saved-schedule comparison are functional. Header workspace controls remain the agreed real-app addition. Native up/down reorder controls supplement grips for accessibility. This is not a claim that unavailable baseline/whole-pipeline Compare/adjustment screens have been implemented or that every pixel of prototype/demo content is reproduced.

Verification: **123/123 Node tests and 59/59 Chromium browser tests passed.** Ten restoration journeys cover Library selection/search/shared rules, date-free templates and replacement, failed/stale writes, phase-range movement/removal and details cancellation, keyboard grip sorting, duration impact with no saved overwrite, source headings/paragraphs/type sizing and 390/1440px layouts, v2 data preservation and stale Library editing. Existing suites retain 320/768/1440px, critical-explanation, saved-state, failed-save and leave-guard checks. After the final movement-removal correction, its Edit journey was rerun successfully with an unrelated name change retained; the two strengthened reference/copy/layout checks also passed. Desktop/mobile source/app screenshots were inspected. Production build/strict checks and new app/data/domain/test lint pass. Only installed libraries are used. `vite.config.ts` explicitly prebundles the two installed dnd-kit entry points to prevent a first-route dependency-optimization reload interrupting navigation.

The approval completes this local functional package; broader checklist completion remains subject to user visual review and the remaining MVP states. No AWS/authentication, workbook export, baseline history, full Pipeline Compare/adjustment, exhaustive accessibility/cross-browser or large-data acceptance was included. AGENTS.md and SNAGGING.md remain unchanged.

### Agreed export

Export **one Excel workbook (`.xlsx`) with a worksheet and formatted schedule table per project**. This replaces both CSV and the proposed text timeline grid.

Required schedule information: activity/phase names, start dates, finish dates and active durations, with milestones and anchor dates represented accurately. Friday phase finishes must match the application's displayed finish dates; actual milestones keep their actual date. Preserve intentional overlaps, gaps and relevant Christmas information without confusing elapsed time with active duration.

**Proposed:** use native Excel date values with unambiguous display formatting, readable widths, header rows and table formatting. Handle duplicate/invalid/long worksheet names while retaining the complete project name in the sheet. Keep user-entered text as text. Generate the workbook using a maintained free library, loaded only when exporting; do not implement XLSX packaging ourselves. ExcelJS is a candidate, subject to the dependency review, not an approved installation.

Open export details: whole selected pipeline versus a selected subset of projects, whether exporting unsaved working state is offered, exact metadata/columns and gap representation. Default proposal is the complete selected saved/live pipeline, with unsaved export separately labelled if included. No timeline-grid export, CSV compatibility feature or bulk import is required by this decision.

## 6. Engineering approach and dependencies

### Reuse and consolidate

The new React app at `/` supports local workspace Libraries and templates, procurement Add/Edit, timeline/date/clash review, phase-range movement and saved-schedule comparison, explicit duration-update review and named pipeline saving/reopening. Baseline confirmation/history, general pipeline Compare, interactive Pipeline adjustment and export remain later packages. The hybrid reference prototype remains under `mockups/`; `window.LTPPDemo` and its localStorage are separate demonstration adapters.

Shared calculations now extracted:

- `src/domain/calendar.ts` and `scheduling.ts`: the existing UTC calendar, active-week movements, durations, gaps and clash algorithms. The domain's `findClashes` requires explicit rules.
- `src/domain/comparison.ts`: identity-based schedule changes, movement summaries, grouping, Christmas explanations and matching-inclusive findings. `PipelineSchedule` has only name/plans; `comparePipelineFindings(before, after, currentRules)` evaluates both schedules with the same current rules, ignoring legacy snapshot properties.
- The three old prototype calculation modules now delegate to shared calculations. Sample rules, schedules and version records are confined to `pipeline-fixtures.ts` and `pipeline-version-fixtures.ts`. Only the prototype retains a default sample rule set and saved-rule/counterfactual comparison policy.
- Existing React timeline, editor/review, findings and save/baseline components where they fit the production boundaries.
- The 99 original prototype regressions remain unchanged and passing. Two validation tests and 15 new domain tests bring the total to 116. Legacy saved-rule tests deliberately protect the reference prototype; the new domain tests independently enforce current workspace rules. Do not let legacy assertions dictate the new application's rule policy.

Package 2A uses one Add/Edit form and the shared domain, not copied HTML calculation engines. The timeline's segment rendering was extracted into `src/ui/timeline-segments.tsx`; a compatibility wrapper in the prototype retains its existing tooltip/selection behaviour. The new timeline imports that renderer directly, with no trial shell, demo seeds or unselected timeline library. The remaining legacy HTML/demo-data calculations stay confined to the reference prototype. No new scheduling or date library was needed.

### Proposed module boundaries

| Module | Owns |
| --- | --- |
| `app` | Routing, local layout/workspace selection, providers and page errors; authenticated layout later |
| `domain` | Pure date/calendar, schedule, clash, comparison and snapshot operations; no React, DOM, storage or fixtures |
| `features/workspaces` | Local workspace creation/selection first; real membership, invitations, roles and admin transfer at AWS integration |
| `features/pipeline` | Viewing, selection, adjustment session, undo and review |
| `features/projects` | Shared Add/Edit editor and project preview |
| `features/library` | Phases, templates, current rules and duration-impact review |
| `features/saved-pipelines` | Saved records, comparison, baseline confirmation and history |
| `features/export` | Workbook mapping and XLSX generation |
| `data` | Small asynchronous application data operations, implemented with browser storage first and an API later |
| Server handlers (later) | Authentication, permissions, authoritative validation, transactions, concurrency and AWS storage |
| `ui` | Only genuinely reused fields, dialogs, disclosures, badges and styling tokens |

Keep the number of deployable services small. These are responsibilities, not instructions to create one service/package or dozens of tiny files for each item.

### Small data boundary for later AWS connection

Put application-level load/save operations behind one typed asynchronous data module. Use plain application models and stable IDs; React components should not call browser-storage APIs directly or depend on AWS SDK types. Cover the operations a feature actually needs, such as loading a workspace, saving its Library or explicitly saving a named pipeline. Keep the interface feature-driven rather than inventing a universal CRUD framework.

**Selected and implemented for the foundation:** IndexedDB through `idb`, with Zod-validated, versioned workspace records. `src/data/local-data.ts` supplies only list/get/create workspace operations; extend it as features need more. Await committed writes before reporting success. Preserve prior records and active input on failure, and report unreadable records without silently resetting them. The separate database is `ltpp-app-local`; the prototype's `ltpp-connected-mockups-v1` key is untouched. Native localStorage was assessed as simpler initially, but IndexedDB transactions are a better fit for later related pipeline/baseline writes. No local database server or general migration/plugin platform is introduced.

Later, an API-backed implementation can serve the same application operations. The AWS backend still needs real authentication, validation, storage, authorisation and concurrency enforcement; it is not a configuration-only switch. Share the domain calculations, but never trust client validation as server enforcement. No generic provider registry or unused AWS adapter is needed during local development.

### Concise code standards

- Enable strict TypeScript during the foundation work; validate untrusted input at runtime.
- Have one source for each calculation, permission rule and saved state; derive counts/summaries rather than maintaining competing copies.
- Keep local interaction state local. A focused reducer suits adjustment drafts; avoid a global store for every control.
- Share demonstrated repetition; avoid generic CRUD/form/table/workflow engines and speculative provider abstractions.
- Format code readably. Compressed JSX/CSS and low line counts are not measures of simplicity. No arbitrary maximum file/function line count.
- Memoise expensive derived work where justified; do not scatter performance hooks through trivial expressions.
- Lazy-load genuinely large optional features. Measure realistic data before adding workers or virtualisation.
- Use stable activity/project identities and explicit date contracts. The server revalidates writes and protected-baseline constraints.
- Test user-visible and business outcomes, particularly date boundaries, current rules, workspace isolation, stale edits and atomic transitions. Avoid tests that only mirror markup.

### Proposed dependency review

| Need | Starting position | Status |
| --- | --- | --- |
| UI/runtime | Existing React, TypeScript, Vite; preserve design with scoped CSS | Existing tools; production configuration/version review needed |
| Routing | React Router data mode | Approved/installed: 8.5.1; shared layout, loaders, actions and navigation |
| Authentication (later) | AWS Cognito managed login/SDK integration | Deferred during local delivery; service direction agreed, tier/SDK/flow to approve later |
| Local persistence | IndexedDB through `idb` | Approved/installed: idb 8.0.4; separate new-app database |
| Dragging | Reuse the chosen dnd-kit approach | Existing; verify selected API/version and keyboard behaviour |
| Form handling | React Hook Form with Zod integration for repeating schedule/rule fields | Approved/installed for 2A: react-hook-form 7.92.0 and @hookform/resolvers 7.0.5; simple controls/dialogs remain native HTML |
| Runtime schemas | Zod, deriving TypeScript types from schemas | Approved/installed: 4.6.7; workspace input and stored-record validation |
| Data loading | Small async local data module first; router/API loading and TanStack Query considered at AWS integration | Remote caching machinery is deferred until it removes real work; no duplicate fetching systems |
| Complex controls | Native HTML first; React Aria selectively where it removes substantial accessibility code | Optional free candidate; styling/integration still required |
| Tables | Native semantic tables and the agreed disclosures | No data-grid subscription; Table/Virtual libraries only for demonstrated needs |
| Export | A maintained free XLSX library, e.g. ExcelJS | Candidate; licence, maintenance, bundle and date/table support to verify |
| Testing | Existing Node test runner plus Playwright browser journeys | Playwright Test 1.65.0 and Chromium approved/installed. Component testing additions remain candidates |
| Formatting/checks | Existing Oxlint, strict typecheck and a formatter | Configuration/packages require approval |

The preserved prototype adjustment module still imports the unselected `react-calendar-timeline` trial. `dayjs`/`interactjs` are associated with that trial. The new app does not import them or fictional scheduling builders. Shared segment rendering is extracted; full interactive adjustment extraction and dependency removal remain later work requiring approval.

### Skills

The project records `frontend-design` in `skills-lock.json`; `vercel-react-best-practices` is available at user level. Use design guidance to preserve the approved UI and applicable React rules to guide implementation; neither certifies compliance or requires Next.js/a particular service.

`find-skills` informed the optional-skill review. Image generation is not part of the production architecture. Optional additions for later approval: Vercel web-design-guidelines for interface/accessibility review and Microsoft's playwright-cli for browser inspection. These supplement repeatable tests. No skills have been installed during planning. Pin/document chosen guidance when the engineering setup is approved.

## 7. Later AWS and operational proposal

AWS and Cognito are the agreed later hosted direction. None of these services is required to run or review the first local delivery. The following is a **later cost-review shortlist**, not an approved architecture or a deployment instruction:

| Responsibility | Candidate | Review before committing |
| --- | --- | --- |
| Static React hosting | Private S3 origin and CloudFront, or another economical AWS static-hosting option | Total storage/requests/transfer, deployment/build charges, HTTPS and domain needs |
| Authentication | Cognito managed login | Tier, registration method, verification/recovery email, session behaviour, optional MFA and future federation |
| Application API | API Gateway HTTP API and TypeScript Lambda handlers | Low-traffic request/runtime costs, validation, token verification and application permissions |
| Persistent data | DynamoDB as a low-traffic candidate; compare with managed PostgreSQL only where relational benefits justify standing costs | Access patterns, conditional writes/transactions, size limits, backups and cost of modelling/querying our data |
| Email | SES or the appropriate Cognito delivery configuration | Verification/invitation delivery, verified sending identity, sandbox/production access and small usage costs |
| Operations | Minimal CloudWatch monitoring/logging and AWS cost alerts | Retention, request limits, alerts, restore procedure and actual standing/usage charges |

Do not default to always-running servers, paid database minimums, NAT gateways, load balancers, multi-region deployments or a large observability stack without a demonstrated requirement and an accepted cost estimate. Do not add custom infrastructure to save negligible costs where a suitable existing service is cheaper to maintain.

Before the AWS implementation/provisioning stage, present a complete estimate for small pilot and modest-growth scenarios, with explicit assumptions for users, workspaces, requests, storage, downloads, email, backups and logs. This estimate is not a prerequisite for beginning an approved local slice. Show post-credit costs and separate domain/tax/region effects. An exact total monthly ceiling, AWS account/free-tier eligibility, region, expected traffic and domain ownership remain open. Cost alerts are delayed notifications, not a guaranteed hard spending cap. The pricing links below are reference inputs, not a validated quote.

Keep database migrations/data evolution and deployment configuration explicit. Store workspace ownership consistently and keep credentials out of client code. Do not commit secrets or treat authentication alone as data authorisation.

## 8. First-release security and later sensitive-data support

**Agreed:** initially support non-sensitive information. Customers may use code names, but code names alone do not establish that dates, relationships or other details are non-sensitive. No OFFICIAL-SENSITIVE assurance or certification claim is made for the MVP.

For local delivery, use fictional/non-sensitive data, keep workspace contents separate, handle browser-storage failures, preserve explicit Save and keep dependencies maintained. Local mode makes no multi-user security, cloud-backup or sensitive-data assurance claim. Do not add production secrets or copy real account data into local fixtures.

Baseline proposals for the later hobby deployment:

- Verified accounts, accepted invitations and server-enforced workspace access.
- Managed authentication, HTTPS, encrypted managed storage/backups, protected secrets and routine dependency maintenance.
- Separate production/test data; use fictional fixtures for development and automated checks.
- Small, useful audit events for membership/admin changes and consequential saved operations; keep procurement/project content out of routine logs, emails and analytics captures.
- Explicit saved-data backup/restore and a lightweight incident/support process. These do not imply recovery of unsaved work or a browsable history of every Save.

Choose authentication services that can support MFA/organisational sign-in later, keep permissions/invitations centralised, and understand data flows before choosing providers. These are extension points, not permission to implement an enterprise policy engine now.

If customers later need sensitive-data handling, assess the complete service, operators, contracts, identity/sharing policy and data flows with the responsible organisation. That may require a different deployment or additional controls. A workspace label or UK database region alone is not approval. No sensitive-data migration or enterprise control suite is included in the MVP.

## 9. Proposed delivery stages and acceptance gates

Each milestone needs its own specific implementation approval under `AGENTS.md`. Review completed behaviour before broadening scope. No durations or delivery dates have been estimated.

### Gate 0: agree the first local implementation package

**Complete for foundation packages 1A and 1B:** each scope and verification package was presented explicitly and separately authorised on 11 November 2026. Subsequent packages still need their own approval.

- Resolve the local choices that affect the first slice: app structure, browser-storage approach, identity label and the small async data boundary.
- Review only the libraries/skills needed by that slice, preserving the negligible-spend constraint.
- Define the local acceptance matrix from the chosen journeys and changed policies here. Identify hosted-only checks explicitly.
- **Done when:** the user has reviewed and specifically authorised the local scope and initial changes. AWS account setup, authentication and a complete cloud cost estimate do not block this stage. Documentation approval alone does not satisfy this gate.

### Milestone 1: local foundation and domain consolidation

This milestone is split into two reviewable packages:

- **1A — layout, navigation and local saved data: implemented.** Shared prototype styling, one Local user, workspace creation/selection, versioned/validated IndexedDB records, useful storage/load errors, strict new-app/tooling checks and repeatable tests. Pipeline, Library and Saved Pipelines are future-feature empty states. This includes basic workspace creation originally placed in milestone 2; its planning/editing work remains outstanding.
- **1B — shared scheduling and comparison domain: implemented.** Existing algorithms moved into three strict, fixture-free domain modules. Prototype adapters preserve old imports/behaviour; separate fixture modules hold examples. New comparison assessments require current rules explicitly for both schedules and keep matching findings. No UI or saved-data changes, dependencies or AWS work.

Package 1A verification: typecheck and production build passed; 101 Node tests passed (99 existing plus two validation tests); all ten Chromium journeys passed. Visual/keyboard checks at 320, 768 and 1440px passed. Browser failure tests cover rejected saves, aborted transactions, blocked storage and unsupported/corrupt records, with isolated data. Lint has no errors and nine existing prototype warnings. Firefox/WebKit, complete accessibility review, planning behaviours and multi-user operation are not verified by this package.

Package 1B verification: all 116 Node tests passed, including tests for current checks on saved/current/previous schedules without mutation, matching issues, rule changes, selection reversal, grouping, Christmas, anchor dates, Friday finishes, gaps and whole-week edits. Typecheck and the app production build passed. The two prototype HTML entries bundled successfully, with their expected classic-script notices. An isolated Chromium check exercised matching findings in Compare and adjustment review/cancel/discard, preserving fixed saved records and reporting no runtime errors. Changed domain/adapters/fixtures have no lint warnings; the nine unrelated prototype warnings remain. The package 1A ten-journey browser result above is historical, not a new 1B run.

The following requirements describe the foundation milestone as a whole; the planning UI and its saved-data model remain milestone 2 work:

- Set up strict types, formatting/checks, a real application entry/router and reproducible tests.
- Consolidate date/scheduling/clash/comparison functions; separate fixtures and obsolete trial code from production imports.
- Adopt current workspace rules in the domain model; preserve existing date/anchor/save semantics where unchanged.
- Establish the one local identity and async browser-backed data module, with the new store separate from prototype data.
- **Acceptance:** the app runs through a local development command without AWS credentials or services. Explicitly saved data survives reload. The approved local procurement-form recovery supports Resume/Discard; other unsaved work remains memory-only. Domain tests cover whole active weeks, Friday finishes, actual anchors, Christmas, gaps, grouping, matching issues and current-rule assessment. No duplicate calculation engines are introduced; the prototype remains available as a reference.

### Milestone 2: local workspaces, pipeline and project editing

**Status: functionally complete, 16 November 2026.** This replaces the earlier 2A-only status and its obsolete future-work list.

Delivered functionality:
- Separate local workspaces, each with its own Library, templates, live plan and saved alternatives.
- Shared Add/Edit procurement, phase/milestone selection, contextual phase creation, phase durations and relationships, template loading, anchor editing through Edit details, date generation and advisory clash review.
- Shared pipeline visuals, inspection/pins, findings, procurement overview and direct View details/Edit actions, with the agreed page heading and modal presentation.
- Explicit Save/Save as, automatic first-save live activation, Make live, optional notes, transactional saved-data/revision checks, and save/discard/keep protection.
- Numeric, pointer and keyboard Adjust controls, selected ranges, duration changes, undo, gaps/Christmas handling and Review changes / Apply adjustments. Anchor movement permission is local to each Adjust session.
- Browser-local unfinished-procurement Resume/Discard, including retained inputs and identities; other applied unsaved work remains memory-only. There is no cross-device recovery.
- Library phase/rule/template management and selective timing-impact preview, with explicit application/Save and past/started/custom-duration protections.

Saved data uses IndexedDB `ltpp-app-local` version 3. Existing workspace, Library, template and pipeline records are retained. Obsolete baseline/lock fields do not create user-facing immutable plans or permanent anchor permissions.

**Functional acceptance evidence:** local workspace separation, independent plan contents, Save/Save as, failed/stale-write retention, scheduling rules, current-rule findings, modal exits, direct procurement editing, temporary anchor permission and local draft recovery have Chromium/domain coverage. Latest relevant results are in the current checkpoint above.

**Completion boundary:** this closes Milestone 2 functionality, not every state of the cross-milestone parity checklist. Milestone 3 covers the remaining saved-plan presentation/integration and general Compare. Milestone 4 retains final supported-browser/device, accessibility, realistic large-pipeline and complete local-release acceptance. Accounts, invitations and server-enforced shared editing remain at the AWS stage.

### Milestone 3: local saved planning, comparison and Library impact

- Automatic first-save live activation, live/saved editing modals and single-confirmation Make live are implemented. Complete full saved-plan acceptance and neutral selected-order general Compare. Replacement-baseline review/history is superseded by the simpler live-plan model.
- **Next functional package:** finish Saved Pipeline Plans coverage and implement general Compare, following PC-07, PC-08, PC-09 and PC-10B. Library/template management, optional template loading/replacement and duration-impact review are already implemented; complete their saved-plan/Compare integration and applicable wording/dynamic states.
- Compare independently saved alternatives, including the same procurements with different phase durations, dates or relationships. Match counterparts by retained identity, not by name; never synchronise their schedule edits automatically.
- Deliver current-rule assessment everywhere, including matching issues, dynamic summaries, collapsed project groups and exact-date review.
- The one-pipeline future/default-duration selection and impact preview is implemented, preserving custom durations and protected activity. Include live and formerly confirmed saved plans; keep past/started/custom activity protections.
- Complete SG-001's advisory-clash guidance review and SG-002's delivered-preview acceptance. Review SG-003 across applicable findings surfaces without silently closing it. SG-004 import and SG-005 reusable Library milestones remain separately deferred.
- **Acceptance:** a changed clash rule exposes relevant issues across all local schedules without moving dates; both sides of Compare use the same rules. Duration updates require selection and accepted preview, including indirect changes. Save and Make live are coherent within the local store; outgoing saved plans are retained.

### Milestone 4: workbook export and complete local delivery

- Deliver the formatted project-per-worksheet XLSX export using the selected library.
- Close the applicable section 5 coverage checklist with recorded behaviour/wording verification and explicitly agreed departures or deferrals; earlier functional package completion alone does not satisfy this check.
- Exercise complete local journeys, reloads/storage failures and supported browsers/devices with realistic multi-year data.
- Agree an accessibility target and verify keyboard, drag alternatives, disclosures, modal focus, dense timelines and horizontal table access.
- Document the local run command and saved-data limitations. Review the functioning application before starting cloud integration.
- **Acceptance:** exported dates match the application, phase finishes are Friday, milestones retain actual dates and Christmas/overlaps do not distort active durations. The workbook has readable per-project tables. The complete single-user planning application works locally without a backend/auth service, and makes its local-only limitations clear.

### AWS gate: review the hosted implementation and spend

- Approve the authentication/API/database architecture, ongoing cost estimate, email setup, supported usage and local-data carry-over policy.
- Resolve account, membership, admin-transfer and editing-lease interactions, plus hosting/support responsibilities.
- Approve a specific integration/provisioning package before any cloud changes. This gate follows local delivery and remains separate from permission to build locally.

### Milestone 5: AWS integration, real sharing and hosted release

- Add Cognito registration, verification, sign-in/recovery and authenticated server access.
- Connect an API-backed implementation of the data operations; revalidate writes using the shared domain logic.
- Deliver actual invitations, roles, admin transfer, join/leave handling and workspace switching with server-enforced isolation.
- Implement named-pipeline editing ownership, revisions and failure recovery for saved operations. Test competing users, expired ownership and stale baseline reviews.
- Deploy the React application and backend, with minimal monitoring, cost controls, saved-data backup/restore and release/rollback procedure.
- **Acceptance:** real accounts can share only authorised workspaces; changing request IDs cannot bypass permissions. Two users can work on different alternatives while same-record edits are controlled. The established local planning/export behaviour survives integration. Failed requests do not partially commit. Revisit local draft storage isolation and retention for authenticated users before deployment; this package does not add server or cross-device recovery. Costs and operational ownership are understood, and release makes no unsupported sensitive-data claim.

## 10. Open choices and deferrals

### Resolve for the local implementation

- Extend the selected IndexedDB/schema/data operations as planning features are added; settle supported multi-tab editing behaviour before claiming protection. Basic workspace storage is implemented, not a complete pipeline/Library data model.
- Library duration-update scope and historical names/colours are now agreed and implemented as recorded above; review their local workflow with the user rather than reopening the same decisions.
- Starter definitions are deferred and empty first use/guided first-baseline confirmation are implemented. Verify their remaining parity states; do not redesign settled first-use decisions. First Save remains distinct from baseline confirmation.
- Adjustment choices and the saved-modal/live navigation separation are approved and implemented. Do not reopen saved-window close destinations. The broader proposed editable-live-plan/baseline simplification has not been adopted; main live-edit origin wording remains a separate possible review. Complete advisory Add Procurement guidance acceptance and agree exact workbook columns/metadata within the approved per-project worksheet format.
- Supported browsers/devices, realistic size limits and accessibility acceptance target.
- Whether any existing prototype data should be carried over. Do not reset, migrate or expose the user's browser data without agreement.

### Resolve later at the AWS gate

- Full AWS cost estimate, database/storage choice, region, account ownership, domain and exact hobby-spend ceiling.
- Cognito sign-in method/tier, session settings, email delivery and account/invitation failure states.
- Invitation/admin-transfer details and server editing-ownership expiry/recovery policy.
- Whether and how saved local application data is carried over into a hosted account/workspace; no implicit upload or migration.

### Explicitly excluded or deferred

- Clerk and ordinary paid SaaS subscriptions beyond the user's negligible-spend preference.
- General pipeline autosave, Library/template form recovery and server/cross-device draft synchronisation (the approved local procurement-form recovery is included).
- Live simultaneous editing of the same pipeline and automatic conflict merging.
- Historical clash-rule snapshots and different-rule comparison machinery.
- Browsable overwritten-save revisions; baseline history remains included.
- CSV and text timeline-grid exports; XLSX schedule tables replace them.
- England bank-holiday highlighting for this release.
- Cross-workspace sharing/comparison or a shared organisation-wide Library/admin layer.
- Automatic clash resolution, bulk schedule import/Excel paste, approval/proposal governance and a general workflow/calendar builder.
- Enterprise certification, dedicated customer deployments and sensitive-data support until separately assessed and agreed.

## 11. Reference material

Official documentation consulted during planning and implementation; recheck features, maintenance, pricing and licence suitability when selecting further versions. Only the explicitly approved foundation libraries/test browser have been installed; no additional skills or cloud resources have been installed/provisioned.

- [Cognito overview](https://docs.aws.amazon.com/cognito/latest/developerguide/what-is-amazon-cognito.html), [managed login](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-managed-login.html), [pricing](https://aws.amazon.com/cognito/pricing/).
- [AWS Free Tier](https://aws.amazon.com/free/), [Lambda pricing](https://aws.amazon.com/lambda/pricing/), [API Gateway pricing](https://aws.amazon.com/api-gateway/pricing/), [DynamoDB pricing](https://aws.amazon.com/dynamodb/pricing/), [SES pricing](https://aws.amazon.com/ses/pricing/), [Budgets behaviour](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html).
- [React Router modes](https://reactrouter.com/start/modes), [React Hook Form](https://react-hook-form.com/get-started), [Zod](https://zod.dev/), [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview), [React Aria](https://react-aria.adobe.com/), [dnd-kit](https://dndkit.com/), [ExcelJS](https://github.com/exceljs/exceljs).
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/), [Playwright](https://playwright.dev/docs/best-practices), [Vitest](https://vitest.dev/guide/), [WCAG 2.2](https://www.w3.org/TR/WCAG22/).
- [Government classification guidance](https://www.gov.uk/government/publications/government-security-classifications/guidance-11-working-at-official-html), [cloud regions and SaaS](https://www.gov.uk/government/publications/multi-region-cloud-and-software-as-a-service/multi-region-cloud-and-software-as-a-service-html), [NCSC cloud security principles](https://www.ncsc.gov.uk/collection/cloud/the-cloud-security-principles).

## Documentation checkpoint

10 November 2026: the user explicitly approved creating `BUILD_PLAN.md` and updating `HANDOVER.md` to capture this plan, with the hobby-budget constraint. Only those two documents are changed by this task. Source/configuration/dependencies, prototype data, services and cloud state remain unchanged. Documentation review is not an application build/test run.

10 November 2026, local-first revision: the user separately approved revising these two documents so the first working delivery is a single-user local React application with browser-backed explicit saves and a small async data boundary. AWS/Cognito integration and multi-user security are later work. The revised milestones and stage-specific acceptance checks replace the earlier cloud-first order. This confirmation authorises documentation changes only; no source, dependencies, app data, services or cloud resources are changed, and no application builds/tests are run.

11 November 2026, package 1A: after the read-only audit, the user approved the specific implementation package. Source/configuration, the four named dependencies, Chromium, tests and these two documents were updated within that scope. The local React app is available through `npm.cmd run dev` on Windows (or `npm run dev` where shell policy permits). Verification commands are `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, `npm.cmd run test:e2e` and `npm.cmd run build`. Tests use an isolated server on port 4175 and a separate Vite cache; results/screenshots are under ignored `node_modules/.cache/playwright-results`. The test server stops after the run. A review server was started at http://127.0.0.1:5173/. Prototype source/data, AGENTS.md, SNAGGING.md and AWS remain unchanged. Domain consolidation is the next proposed package, not authorised by completion of 1A.

11 November 2026, package 1B: separately approved and implemented shared calendar/scheduling/comparison modules, compatibility entries and separate prototype fixtures, 15 domain tests, the test-script/TypeScript inclusion changes and these documentation updates. No dependencies, HTML/React screens, browser stores, AGENTS.md, SNAGGING.md or AWS resources were changed. Prototype bundling artifacts are under ignored `node_modules/.cache/ltpp-prototype-build`. The visible React application still has workspace functionality and future-feature empty states. Next review first-use Library/project data needs and present a specific Pipeline/Add/Edit implementation package for approval.

11 November 2026, package 2A: after agreeing to defer starter content and require Add critical-clash explanations, the user approved and later resumed this package following an approval-service usage-limit interruption. The two approved form dependencies, source/storage/routing/UI/tests, HTML title and documentation were updated. No AWS/auth work or prototype data migration/reset occurred. The reference prototype changed only to consume the extracted segment renderer; its behaviour remains protected by regression/browser checks. The review URL http://127.0.0.1:5173/ was checked successfully. AGENTS.md is unchanged; SG-001 records the new app's implementation pending user wording review, and the other snags remain open.
