# Project handover

Updated 16 November 2026. User timezone: Europe/London.

## Start here

## First action in the next context: interrogate the Milestone 3 proposal

**Critically review the pending implementation package below before doing further implementation. It has not been approved.** The user's request to begin Milestone 3 was followed by a specific proposal; their next instruction was to compress context so that the first action in a fresh context would be to interrogate that proposal. They have since authorised consolidating that information into this file. These documentation approvals do not authorise Milestone 3 code, dependencies or project-state changes.

HANDOVER.md is the single handover entry point. Do not require a separate chat summary to understand the current task. Read AGENTS.md, the current checkpoint below, the current checkpoint and PC-07/08/09/10B requirements in BUILD_PLAN.md, and SNAGGING.md. Older dated records are historical; they do not reopen settled product decisions.

### Latest completed change after the milestone checkpoint

The user approved removing the tagline directly beneath the ordinary **Warnings and critical clashes** heading, including its viewing and editing variants. This is implemented in `src/ui/findings.tsx`; the unused `.findings-scope` rule was removed from `src/features/pipeline/pipeline.css`. The heading, findings, filter controls and accessible filter-result announcements remain. This concerns the shared ordinary findings heading; do not infer removal of the approved explanatory descriptions for collapsed Compare sections.

Verification for this small change: production build/strict TypeScript passed, and the focused Chromium case `findings filter counts, focus, empty results and procurement links use real data` in `tests/pipeline-parity.spec.ts` passed (1/1). The earlier 130 Node and 52/66 overlapping Chromium results recorded below describe the preceding packages; they were not all rerun for the tagline removal. No dependency, storage migration or user-data reset was introduced.

### Pending Milestone 3 implementation package - not approved

The assistant proposed one package covering:

1. Complete Saved Pipeline Plans with a live-plan summary, status filters, meaningful empty results, saved details and expandable procurement schedules.
2. Add Compare to saved-plan actions when two or more plans exist.
3. **Proposed presentation:** open a large read-only comparison modal over Saved Pipeline Plans, keeping Live Pipeline separate. This modal choice is a new recommendation requiring review; the user has not accepted it.
4. Reuse the approved comparison layout: synchronised timelines, initially collapsed sections and procurement groups, plain-language grouped movements, and expandable exact dates. Preserve phase-duration labels, equal-movement grouping conditions and affected-only Christmas explanations.
5. Show matching clashes by default, coloured named per-plan totals and optional filters. Evaluate both saved plans with current workspace Library rules. Exclude obsolete saved-rule differences panels and baseline-replacement/history journeys.
6. Verify independent procurement variants, unchanged comparisons, additions/removals, Christmas effects, larger plans, keyboard access and narrow layouts; update guidance and delivery records.
7. Reuse existing domain/UI code with no new dependency, paid service or storage migration. Proposed changes span saved-plan/comparison components, routing, shared schedule presentation, tests and documentation. This is a proposed boundary, not an approved final file list.

### What the first review must interrogate

- Check whether this combined package is appropriately bounded, and distinguish remaining functionality from existing functionality needing integration or acceptance. Do not rebuild delivered Library impact or Milestone 2 features.
- Compare the actual prototype layout, copy and interaction with the current proposal and later approved exceptions. Determine whether a comparison modal or a dedicated comparison view is the right presentation before committing to it.
- Define comparison entry/default selection, two distinct plan selectors, selection order, switching/cancel/close destinations, deep links/refresh and zero/one-plan states. Keep the Live Pipeline page dedicated to the live plan.
- Confirm that Compare reads saved contents, identifies which contents are being compared and never silently includes or overwrites pending working edits. Review stale/deleted records, Library changes and existing unsaved-work guards.
- Match procurement variants by retained identity, not name. Save as keeps corresponding identities while storing independent schedules. Separately created same-name procurements are not automatically the same procurement. Examine phase identity, rename, reorder, added/removed activity, duration and gap cases.
- Preserve the approved nested disclosures, dynamic high-level labels, exact-date access, synchronised windows/scrolling, findings matrix and filter/empty states. Avoid returning to an initially expanded table with hundreds of rows.
- Assess reuse of existing calculations, shared renderer, Dialog and native details/table/browser capabilities before proposing custom abstractions or dependencies. Keep modules concise. Any new dependency needs a separate fitness/licensing/accessibility/TypeScript/cost assessment and approval.
- Explain meaningful gaps, assumptions and design choices to the user. Present the resulting specific implementation package and obtain separate affirmative approval under AGENTS.md before mutations. Final supported-browser/device, accessibility and large-data acceptance remains in Milestone 4; representative functional checks still belong in Milestone 3.

### Source map for the review

- `src/features/saved-pipelines/saved-pipelines.tsx`: existing saved list, current statuses, View/Edit/Make live actions and saved-modal launch/focus handling.
- `src/features/pipeline/pipeline.tsx`, `pipeline-session.tsx`, `pipeline-paths.ts`: shared live/saved content and editing, Save/Save as, navigation guards and canonical destinations. Shared modal CSS is `src/ui/pipeline-modal.css`.
- `src/app/router.tsx` and `src/data/local-data.ts`: loaders/routes, workspace-scoped saved records, revision checks and live selection. Stored `currentBaselineId` is retained for compatibility, not a user-facing baseline concept.
- `src/domain/comparison.ts` and `comparison.test.ts`: existing schedule differences, movement/grouping and current-rule finding comparisons. Assess and extend these as needed; do not introduce a parallel calculation engine.
- `src/ui/timeline.tsx`, `findings.tsx`, `procurement-details.tsx`, `dialog.tsx`: shared visuals, findings, schedule details and native modal behaviour. Reuse the existing calendar/scheduling and phase-segment code.
- `src/prototypes/pipeline-versions.tsx`, `pipeline-comparison-details.tsx`, `pipeline-comparison-model.ts` and associated styles/tests: comparison reference. Baseline ceremonies, per-version rule snapshots and the different-rules panel are superseded and must not be ported back into production.
- `mockups/versions-and-baselines.html` and BUILD_PLAN PC-07/08/09/10B: remaining saved/Compare presentation, wording and acceptance references. Apply later expressly approved terminology, modal and live-plan decisions.
- Existing browser coverage: `tests/saved-plan-modals.spec.ts`, `pipeline-parity.spec.ts`, `baseline.spec.ts` (historical filename, now live-plan tests), `live-setup.spec.ts`, `pipeline-adjustment.spec.ts`, `procurement-recovery.spec.ts` and Library tests.

### Local execution and review constraints

Workspace: `C:\Dev\code\react\react-empty-project-template`. Use PowerShell and `npm.cmd` / `npx.cmd`. Review application URL is normally `http://127.0.0.1:5173/workspaces`; verify availability without stopping the user's development server or resetting browser data. Current delivery is local-only; AWS/authentication/sharing are deferred. Keep shared modular code and the approved copy/design, normal bold, short hyphens and low-cost reuse principles. Use the applicable frontend-design and React best-practice skills from the session catalogue. Do not delegate to sub-agents unless explicitly authorised by the user or applicable instructions.

Commands when authorised: `npm.cmd test`, `npm.cmd run build`, `npm.cmd run lint` and `npx.cmd playwright test ...`. Playwright config uses port 4175 and two Chromium workers, with artifacts in `node_modules/.cache/playwright-results`. Its Vite helper can remain alive after all cases finish, preventing the runner from returning: stop only the known test-server PID from that run after verifying cases have finished, then collect the runner result. Never stop port 5173. No test helper was left running by the completed tagline check. Nine existing lint warnings are confined to prototype/mockup files; do not count them as newly introduced problems.

## Current checkpoint: Milestone 2 functionally complete, 16 November 2026

This is the authoritative current handover. The user approved documentation-only reconciliation after the latest implemented refinements. Milestone 2 functionality is complete; older dated records below are historical evidence and must not be used to restore superseded behaviour.

**Current application behaviour**

- Live Pipeline always shows the selected live plan. First Save establishes it automatically; Save updates the open plan; Save as creates an independent alternative. Make live uses one confirmation and retains the outgoing saved plan. There is no first/replacement baseline ceremony or automatic history of every Save.
- The populated live page has no separate Your procurement pipeline plan heading. Its plan name in the blue context panel is the main heading; the blue live-status label and explanatory text remain. Live editing opens in the shared modal titled **Editing live pipeline plan**. Other saved View/Edit stays over Saved Pipeline Plans.
- Live overview procurement names are plain text. View details and Edit sit in Actions. Edit opens the selected procurement directly, retaining cancellation, Save/Discard/Keep protection and return focus to the launch action.
- Edit procurement's Edit details allows anchor date/milestone changes without Unlock/Lock controls or a persistent lock status. Adjust protects the anchor on every opening. Permission to move it is temporary for that modal and resets after closing or applying. Obsolete lock flags in recovered procurement drafts are ignored; their other inputs remain recoverable.
- Each plan owns its procurement schedules. Editing one does not update the counterpart in another saved plan, even with the same name/identity. Save as retains identities so future Compare can match versions of the same procurement. Shared current Library clash rules still apply workspace-wide. Existing duration changes require explicit selection and accepted preview.
- Valid range movements into available adjustment gaps, including Christmas boundaries, update the draft immediately without another procurement preview. Recorded-date validation checks active duration, relationships, weekdays and the anchor rather than demanding one ambiguous Christmas boundary. Failed moves clear stale success feedback. Review changes / Apply adjustments remains the final adjustment confirmation; named Save remains separate.
- Local workspaces/Libraries/templates, Add/Edit, shared visuals/findings, Save/Save as, selective Library timing review, Adjust and browser-local procurement recovery are implemented. Applied unsaved work otherwise remains memory-only. Real authentication, sharing and server-enforced editing ownership remain deferred to AWS integration.

**Latest recorded verification:** all 130 Node tests pass. The related Chromium groups passed 52/52 and 66/66 cases; those groups overlap and are not 118 distinct tests. They cover the heading/table/direct-edit changes, anchor edits/cancellation, temporary Adjust permission, legacy-draft recovery, live/saved flows, storage failures, timeline parity and responsive layouts. Production build/strict TypeScript pass; lint retains the nine existing prototype/mockup warnings. Desktop/mobile screenshots were inspected. This documentation checkpoint did not rerun application tests or change source, dependencies or user data.

**Next in plan:** Milestone 3 finishes Saved Pipeline Plans coverage and implements general Compare for independent alternatives, with current workspace rules on both sides, the approved collapsed/grouped summaries and expandable exact dates. Library impact already works; complete its saved-plan/Compare integration and acceptance. Milestone 4 provides Excel workbook export and final cross-browser/device, accessibility, large-pipeline and whole-local-release acceptance. Unchecked cross-milestone parity items do not mean Milestone 2 functionality is unbuilt.

The obsolete replacement-baseline package is removed from remaining work. Historical confirmation metadata and existing records remain preserved. Existing snagging/deferrals remain open as recorded in SNAGGING.md; this update does not close them. No Milestone 3 implementation, new dependency or cloud work is authorised by this documentation approval.


## Earlier delivery: simpler Live Pipeline journey, 16 November 2026

This records the earlier live-plan simplification expressly approved by the user. The current checkpoint above governs subsequent heading, action and anchor refinements. Live Pipeline is the top navigation label and always displays the selected live plan at `/workspaces/:id/pipeline`. Its editor uses the shared large native modal at `?edit=1`, over the live page. Other saved View/Edit remains over Saved Pipeline Plans. Shared modal styling is `src/ui/pipeline-modal.css`.

First use is Add procurement, review/add, then Save with a name. The first successful Save establishes the live selection atomically, without a baseline ceremony. Save updates that plan; Save as creates an alternative and opens its editor over the saved list, leaving the live selection unchanged. Make live is available for alternatives in the list and viewer. One confirmation names the incoming and outgoing plans; the outgoing plan stays saved. Source revision and expected live selection are validated transactionally. Notes remain optional and findings advisory.

Existing records, notes, live selection and historical confirmation metadata are preserved. Internal `currentBaselineId` and legacy `setupPipelineId` remain for storage compatibility. A selected setup candidate or sole saved record is carried forward when no live selection exists; ambiguous multiple records require explicit choice. Formerly confirmed records are editable and retain their historical confirmation details. There are no automatic snapshots, new dependencies, database upgrades, cloud changes or user-data resets.

Welcome and How it works describe the same simple journey. Editing suppresses background welcome guidance; closing empty editing restores it. Clean Close/Exit is immediate; dirty editing offers Save and exit, Discard changes and exit, or Keep editing, protecting unapplied procurement/Adjust edits first. Live close restores Edit live plan or Add procurement; saved close restores the launch/list fallback. Findings and overview IDs are unique across background/modal instances. Shared native Dialog handles nested focus, Escape and scroll locking.

Library duration updates include eligible live and formerly confirmed plans and route to the appropriate modal. Past/started/custom protections, preview, application and explicit Save remain. The duration prompt receives the live selection explicitly because it is outside the route Outlet context. Obsolete first-baseline/setup components are removed; prototype references are unchanged.

Verification: all 128 Node tests pass. All 160 Chromium cases were verified across the broad run and affected reruns: 152 passed in the broad run; the eight failing cases were addressed in the 44-case affected run and final six-case hint/review run. The affected run passed 42; its remaining two passed in the final six, all of which passed. Final production build/strict TypeScript pass; lint has only the nine existing prototype/mockup warnings. Desktop and 320px live-edit screenshots were inspected. Coverage includes first-save activation, live/saved modals, Save/Save as, Make live, atomic failures/concurrency, legacy preservation, optional notes, Library Apply and save, nested Adjust, recovery and narrow layouts. The modal conversion also required passive hints not to intercept nearby buttons, Escape to dismiss a hint before its editor, and recovery to finish its one-time route handoff before showing the form. This is Chromium verification across broad/affected runs, not complete cross-browser or large-data acceptance. The user's development server and browser data remain intact.

Next planned work remains full saved-plan acceptance and general Compare in Milestone 3, then Excel workbook export/final acceptance in Milestone 4. Replacement-baseline review/history is superseded and removed from remaining scope. Later packages still need their separate implementation approval.

## Earlier delivery: saved-plan modals and navigation cleanup, 15 November 2026

The user approved this implementation scope after clarifying that Pipeline Plan should be dedicated to the live plan and that other saved plans should keep their present view/edit design inside modals over Saved Pipeline Plans. This supersedes earlier full-page saved viewing/editing and return-to-live/origin guidance for those screens. The broader proposed editable-live-plan/baseline simplification has not been adopted. Baseline protection, first-live confirmation, optional notes, current-rule advisory findings and explicit persistence semantics are unchanged.

Non-live View/Edit now opens a large shared native dialog over the retained saved list. Canonical locations are `/workspaces/:workspaceId/saved-pipelines/:pipelineId` and the same path with `?edit=1`; old `/pipeline/:pipelineId` links redirect there with query parameters preserved. Refresh/deep links restore the correct modal. Pipeline Plan's top link remains live/setup; current-live View/Edit actions keep the main live/protected-edit journey. A first saved setup candidate's Continue editing opens its saved editing modal. Library timing-update and procurement-recovery entry points follow these destinations.

The existing content is reused: context colours/name/status, timeline and inspection, procurement overview/details, findings, Save/Save as, Add/Edit procurement, Library-impact review and Adjust. Modal header titles replace the page heading inside these windows. Save and Save as keep the editor open over the list; a new copy updates the selected record. Closing returns to the list with the existing Save/Discard/Keep protection, including unfinished forms before working-copy changes. Native browser Back/client navigation remains guarded. Clean close restores the launch action; direct entry has a row fallback and Save as preserves a meaningful return focus.

Choose a saved pipeline plan, the Saved Pipeline Plans context-panel button, Return to live buttons and duplicate Resume editing actions are removed from these surfaces. Read-only has one Edit this pipeline plan or Continue editing for its matching working copy. Saved Pipeline Plans remains in the top ribbon. The redundant blue Saved: [name] / View saved pipeline plan notice and session notice state are removed; All changes saved remains next to the plan name. How it works describes the new destinations without promising the removed buttons.

Shared Dialog opening now respects parent/child top-layer order when both mount together, which is necessary for first-load recovery and procurement detail deep links. Escape does not propagate to a containing modal. Shared native CSS locks document scroll for open app dialogs and releases it after the last close; saved windows scroll internally, including on narrow screens. This replaces separate parent/Adjust overflow effects that could leave the page locked. No new dependency, persisted schema, cloud service or data reset is included.

Implementation: `features/saved-pipelines/saved-pipelines.tsx`/CSS, reusable SavedPipelineModal in `features/pipeline/pipeline.tsx`, small `pipeline-paths.ts` helpers, route/session/frame coordination, existing recovery/update links and shared Dialog/App CSS. Tests now use explicit save-dialog locators where a saved window remains underneath, and replace obsolete background-navigation assumptions with modal Close/Save/Discard journeys. Main live-edit session continuity remains covered separately.

Verification: 128 Node tests pass. All 162 Chromium cases were verified across the broad run and affected reruns: 155 passed in the 161-case broad run; the six failing cases were addressed and all 64 affected cases passed, including the new procurement deep-link check. The final six saved-modal cases passed again after retaining the view explanations in the modal header. Viewer screenshots were inspected at 320px and 1440px. Final build/strict TypeScript pass; lint has the nine existing prototype/mockup warnings only. This is not complete cross-browser/large-data acceptance. Do not treat this navigation delivery as completion of the later complete saved viewer/status/history, general Compare, replacement-baseline or export packages. It does not authorise moving ahead to those packages.

## Earlier delivery: Adjust Pipeline Plan, 15 November 2026

The user separately approved implementation of the planned Adjust package, the proposed selection/window/action/revalidation choices, relevant tests, visual comparison and updates to BUILD_PLAN.md, HANDOVER.md and SNAGGING.md. Adjust is now implemented locally. Current implementation status below supersedes earlier statements that it is the next unbuilt package. Later saved-viewer/Compare/replacement-history/export work retains its agreed milestone order and is not authorised by this package.

Choose Adjust pipeline plan beside Add procurement in the editable timeline. The lazy-loaded native dialog follows the connected prototype's foreground desktop timeline/side-panel layout, with selected procurement/range, draggable blue Move selection handle, week-snapped pointer/keyboard movement, Earlier/Later exact movement controls, one-phase duration tabs and start/finish-fixed choices, deliberate anchor unlocking, undo, proposed-date review and foreground dirty-discard alertdialog. Narrow screens stack the board and controls in one scrollable body with an available wrapping footer. Review navigation scrolls/focuses the visual or dates without changing the route. Cancel removes only this adjustment session, preserving earlier working edits; clean close is immediate, Keep editing restores the launching control and final close restores Adjust focus.

Shared production Timeline/PhaseSegments, colours/outlines/hatching/legends, pinned inspection, findings cards and domain/calendar calculations are reused. Native dialog owns focus/inertness; existing installed dnd-kit supplies drag/keyboard handling. Timeline details are mounted inside their native dialog's top layer, and Escape dismisses transient details before modal actions. First-layout measurement supplies the actual week width before dragging. No dependency, prototype fixture/calendar trial, storage migration, AWS service or new recovery mechanism is introduced.

**Approved implementation choices:** the default range covers phases before the anchor, with first-phase fallback or whole-procurement mode for milestone-only schedules. It no longer depends on the demo `award` identifier. Full pipeline remains Full. Review changes and Apply adjustments replace prototype labels that misleadingly called working-copy application Save. Apply changes the working copy only; explicit Save still persists and protected baselines still require separately named alternatives. Preserve identities, Library links, inherited/custom duration metadata, saved notes and other work. Explicit duration edits become custom. Open reviews use current Library rules with New/Remaining/Resolved advisory findings and affected-only Christmas notes. No explanation or acknowledgement is required.

Review/Apply reread Library and source-record revisions. If Library changed since review, refreshed checks require another review. Changed/deleted source records block Apply without losing the draft; storage errors retain work for retry. Controls are inactive while checking. The shared navigation guard protects dirty adjustment work during client-side navigation, with a native unload warning on refresh. There is no general adjustment recovery. Existing Save validation remains the final persistence guard.

Implementation: `features/pipeline/adjustment-dialog.tsx` owns the session; `adjustment-timeline.tsx` adds drag/selection around shared Timeline; `adjustment-controls.tsx` ports prototype duration/tab controls; `adjustment-review.tsx` shares date/movement/Christmas calculations and finding cards; `adjustment.css` scopes workspace styling. `pipeline.tsx` lazy-loads and applies it while retaining the viewing window. Optional shared Timeline interaction and Dialog header/Escape/alert capabilities preserve their ordinary callers. `DateChange.phaseId` keeps review lookup identity-based. How it works no longer lists Adjust as unavailable.

Verification: 128 Node tests pass. All 156 Chromium cases were verified across the broad run and corrected affected reruns: the broad run passed 153, then the three outdated toolbar/guide assertions passed within the final 25-case adjustment/editor-visuals/usability run. All 12 adjustment cases passed again after the final changed-project-only merge refinement. Coverage includes movement/drag/anchor, duration provenance/fixed finish, advisory apply, undo/discard/focus, protected saved/baseline contents, stale rules/source, failure/retry, Christmas, milestone-only data, shared leave protection and desktop/320px/390px scrolling. Screenshots were inspected. Final production build/strict TypeScript pass; lint has the nine existing prototype/mockup warnings only. Production output excludes the calendar trial and demo fixtures. This is not complete cross-browser/accessibility/large-data acceptance. The older Add/Edit regression now expands the deliberately collapsed dates table, visual-toolbar checks identify both actions and the guide check no longer expects Adjust to be unavailable. The prototype compatibility adapter preserves its historical demo-only award selection while production defaults use phase order, avoiding accidental changes to the retained reference.

**Deferred discussion remains deferred:** the proposed simpler editable-current-plan model has not been adopted. The user requested this existing planned implementation first. Do not change baseline semantics, first-plan saved choice, blue saved notice or the unresolved exit destination under this approval. Revisit those with the user afterwards. Keep reusable Library milestones as SG-005 and import as SG-004, without expanding this package.

## Earlier documentation update: prototype-parity audit, 15 November

The user approved updating BUILD_PLAN.md, HANDOVER.md and SNAGGING.md after reviewing the full connected prototype's visual design and functionality. This is documentation only. No application implementation, dependencies, data migration or reprioritisation is authorised by that approval. Existing working-tree changes were retained.

The audit found that broad capability checklist entries were insufficient to guarantee exact appearance, wording and interaction parity. BUILD_PLAN.md now has an authoritative audit section, a refreshed PC-01 through PC-09 checklist and separate PC-10A Adjust / PC-10B Compare acceptance lists. Record reference source, exact static/dynamic copy, conditions/variables, React location, status, rendered/interaction evidence and approved departures for applicable page states. Use matching data/viewports for visual comparison; domain test success is not visual acceptance. Do not mark all states complete because a capability exists.

**Delivery order is unchanged:** Adjust Pipeline Plan is the next remaining Milestone 2 package and needs separate specific implementation approval. Full Saved Pipeline Plans/status/viewer, general Compare, replacement-baseline review/history remain Milestone 3; workbook export and complete browser/accessibility/scale acceptance remain Milestone 4. The currently basic saved list/viewer is not full PC-08 completion. Do not offer to reorder these packages merely because a later feature is absent.

For Adjust, use the connected foreground workspace, not the standalone calendar-library trial: timeline/side-panel desktop split, selected-range/drag feedback, persistent header/footer, stacked single-scroll narrow layout, numeric/keyboard alternatives, single-phase duration fixed-boundary choices, deliberate anchor permission, undo, proposed dates/movement review with jump navigation, New/Remaining/Resolved findings and foreground dirty-discard confirmation. Preserve earlier working edits when cancelling only the adjustment session. Apply affects the working copy; named Save remains separate. Reuse shared timeline rendering/tokens and existing scheduling functions/installed drag support; do not import fixtures or a second timeline/scheduling engine into production.

For Compare, preserve neutral selected order, shared windows/synchronised timelines, initially collapsed sections and procurement/pair groups, dynamic high-level labels and plain-language grouped movements with nested exact dates. Findings include matching issues by default, named per-plan red/amber totals and meaningful filters/empty states. Evaluate both sides with current workspace rules and exclude obsolete saved-rule differences panels.

**Current decisions supersede older delivery records:** findings are advisory everywhere; notes are optional; no critical justification or acknowledgement blocks Add/Edit, Save, confirmation, Library updates or future Adjust. Use Pipeline Plan terminology and anchor without usual/actual qualifiers. Main navigation opens live/setup with explicit Resume editing. Saved names/colours and selective Library duration-update protection are already settled. Preserve the latest onboarding lifecycle and approved review/dialog/template-anchor refinements; do not reinstate the old guide, Anchor and gaps review section, required reasons or older styling. Historical verification below describes past deliveries, not the current specification.

**Decisions still open before affected changes:** the default adjustment range must work without the demo `award` Library identifier; decide whether Full pipeline stays Full rather than the prototype bridge's twelve-month fallback; resolve guidance promising Pipeline Plan return versus the existing origin-return exit; approve or revise proposed Review changes / Apply adjustments labels; specify stale-source/rule revalidation within an open adjustment session. These are recorded in BUILD_PLAN.md, not decided or implemented by this audit. Do not reopen the agreed historical names/colours or Library update-scope decisions.

SNAGGING.md now distinguishes SG-001's advisory-guidance review from obsolete mandatory explanations, SG-002's delivered preview from remaining acceptance, and SG-003's delivered refinements from outstanding user review. Optional Library import remains SG-004. The previously requested reusable Library milestones item is restored as deferred SG-005; no new milestone functionality is claimed.

Audit evidence: source review across the connected Pipeline, Add/Edit, Library/templates, saved viewing, comparison and baseline journeys, plus rendered desktop/narrow inspection including Adjust editing/review and cancellation. This was not exhaustive pixel verification of every page/state or full cross-browser acceptance. This documentation update did not rerun application tests or establish new functionality as passing. No user browser data was reset or migrated.

## Earlier refinement: Pipeline Plan wording and temporary setup help

Current React user-facing language now consistently uses pipeline plan / pipeline plans. Navigation is Pipeline Plan and Saved Pipeline Plans; the brand subtitle is Long-term pipeline planner. The approved terminology change includes headings, actions, modals, guidance, tooltips, accessibility labels and errors. Internal APIs/identifiers/routes and persisted user-supplied names stay unchanged, as do reference prototypes.

Getting started is first-baseline setup help only. The example still showing causes the modal to open on each entry/refresh, regardless of earlier dismissal. Replacing the example with the first procurement stops automatic opening. The shortcut has a small accessible dismiss control, remembered per workspace in this browser, independent of automatic example guidance. After first-baseline confirmation, no shortcut or welcome modal is rendered. How it works remains available permanently. Existing dialog focus/scroll behaviour is retained. This supersedes earlier welcome dismissal and post-baseline guidance records below.

Verification: 127 Node tests pass; 128 Chromium cases were verified across the broad run and corrected affected reruns. Final focused guidance/setup run: 13/13, including the new keyboard-dismissal/per-workspace preference test. Desktop/mobile screenshots were inspected, and modal keyboard, wheel, touch and enlarged-text checks pass. Production build/strict TypeScript pass; lint has only nine existing prototype warnings. The preserved prototype retains its original terms; relevant comparisons account for the approved text change. No new dependency or saved-data migration was introduced.

## Earlier refinement: coordinated first-use guidance

The welcome modal, setup panel and How it works guide now have distinct roles. The modal introduces Add procurements, Save your progress and Review and make live; after confirmation it explains Follow the live plan instead. Its example wording is conditional on the actual example being displayed. Existing per-workspace dismissal, Getting started reopening, focus handling and modal scrolling are preserved.

The setup panel no longer repeats the introductory paragraph or numbered steps. Empty workspaces show one short prompt and + Add procurement. A candidate shows First live pipeline in progress, its name and save status, Continue editing and Review and make live. Continue editing supersedes the former Continue setup label. The saved-pipeline choice is hidden until saved records exist, using a derived workspace-loader flag without persisted schema changes. How it works preserves the original procurement/date concepts, explains saving, first-live confirmation and alternatives in order, and separates planned Adjust/Compare/replacement features from available actions. This supersedes longer setup instructions and earlier onboarding copy below. The user explicitly approved these coordinated changes, affected tests and documentation updates.

Verification: 34/34 affected Chromium browser tests passed, including first-use/resumed/live guidance, saved-record visibility, saving/navigation and modal keyboard/wheel/touch/enlarged-text behaviour. Desktop/mobile screenshots were inspected. Production build/strict TypeScript pass; lint has nine existing prototype warnings. No new dependencies or persisted data changes. Adjust Pipeline remains next in the agreed order.

## Earlier refinement: guided setup, optional notes and direct Library saving

This refinement is implemented and supersedes the older saving-reason and navigation descriptions below. Before a baseline exists, Pipeline guides the user through building a first live plan, saving unfinished progress, Continue setup, Review and make live, and the explicit Make this my live pipeline confirmation. Saving progress alone never confirms a baseline. The optional workspace setupPipelineId remembers the saved setup candidate atomically with Save; older workspaces with one saved pipeline can resume it, while multiple existing records remain an explicit choice.

The header Pipeline link always opens the live plan, or first-plan setup before confirmation. Saved viewing belongs to Saved Pipelines. Return to live pipeline and Resume editing are separate, explicit actions. Retained working progress never silently substitutes for the live plan. Exit edit mode still returns to its entry screen with the agreed Save/Discard/Keep editing protection.

Save and first-baseline confirmation offer Notes (optional). Critical clashes and warnings remain visible and advisory across procurement Add/Edit, Library updates, Save and confirmation. No reason or acknowledgement is required. Existing historical notes and explanations remain readable. Carry this policy into the later Adjust Pipeline package.

Library timing preview names its selected pipeline. Apply updates leaves reviewed changes in the unsaved working copy. Apply and save... opens shared Save/Save as immediately after applying, with optional notes. Cancelling or failing Save retains the applied working changes; a failed save retains entered notes for retry. Fixed baselines remain protected and require separately named alternatives. Rule changes refresh assessments without changing dates or making pipelines unsaved.

Verification: 127 Node tests passed. The 127 browser cases were verified across the broad regression run and corrected targeted reruns, including four new guided-setup/navigation/Library-save cases. The final corrected Save-as journey passed separately. Production build and strict TypeScript checks pass; lint has only nine existing prototype warnings. Mobile setup rendering was inspected. No new dependency, database store/version migration, cloud service or demo data was introduced. Adjust Pipeline remains next in the agreed implementation order.

### Earlier delivery record

## Earlier delivery: first baseline, live pipeline and exit editing, 14 November 2026

The user separately approved this implementation package, tests and plan/handover updates. The local React app now supports explicit first-baseline confirmation and default live-pipeline entry. Save does not automatically confirm a baseline. In the Pipeline Save menu or a saved pipeline's read-only view, choose Confirm as first baseline. Review its actual timeline, current clash findings and optional rationale, then continue to the separate confirmation. Newly unacknowledged critical clashes require a reason. Confirmation records the actual local time and Local user, retains original saved details, and sets the workspace's live reference in one IndexedDB transaction. Failed, stale or competing confirmations leave both records unchanged.

The live page uses the prototype's applicable headings and blue context bar, with read-only procurement details. Workspace entry and the Pipeline header link return to live by default when no working session is active. Confirmation details and rationale appear in Saved Pipelines and its saved viewer, not the live-page context bar. Edit this pipeline opens the prototype's baseline-copy explanation. Save cannot overwrite a confirmed baseline: it requires a separately named alternative. The storage API independently rejects an overwrite. Current Library clash rules still apply without changing dates. Fixed records are excluded from Library timing-update selection; an explicitly opened working alternative can be updated and saved separately.

Exit edit mode follows the user's agreed override of the prototype's baseline-dependent destination. It returns to the screen used to enter editing, whether or not a baseline exists. Clean exits are immediate; dirty exits offer Save and exit, Discard changes and exit, or Keep editing. Save/naming must succeed before returning. Cancellation/failure keeps work. The entry path survives normal in-workspace navigation and Save as; direct/reloaded edit URLs without an entry path fall back to the Pipeline page. Exiting clears the working copy so the header does not reopen editing.

Implementation: optional validated currentBaselineId on workspace records and confirmation metadata on pipeline records in data/schemas.ts; atomic confirmation and fixed-record guards in data/local-data.ts; default live loading in app/router.tsx; origin/exit/save-resolution handling in features/pipeline/pipeline-session.tsx; lazy first-baseline-dialog.tsx with scoped CSS; live/copy states in pipeline.tsx; protected Save-as behaviour in save-dialog.tsx; saved confirmation details/statuses and duration-update exclusions. No dependency, IndexedDB version/store migration, seed, prototype-source change, AWS service or multi-user lease was introduced. Existing version 1 workspace and earlier pipeline records remain readable.

Prototype references: pipeline-save-version.tsx, pipeline-save-version-dialog.tsx, pipeline-baseline-journey.tsx and mockups/pipeline-context.css. The live context bar has a rendered style comparison. First-use confirmation is a new explicit case because the prototype starts with a baseline. Its wording distinguishes procurement dates/phase durations from the overall pipeline and explains default workspace entry and multiple alternatives. Replacement confirmation is identified as later delivery, not offered as a working action. New content uses short hyphens, never long dashes.

Remaining order: Adjust Pipeline is the next Milestone 2 package. Replacement-baseline confirmation, baseline history and general Pipeline Compare remain later planned delivery; Excel export and complete accessibility/cross-browser/large-data acceptance follow. Library import is SG-004. Do not bring later work forward merely because a user asks about a missing control. Explain its place in the plan first. The broader checklist remains open for its undelivered states.

### Earlier project overview

Verification for the 14 November package: 127 Node tests passed; all 119 browser cases were verified across the broad run and affected reruns, including 10 new baseline/exit cases. Final navigation/guide rerun: 19/19; final baseline-only run after responsive refinements: 10/10. Production build/strict TypeScript checks pass. Lint has only nine pre-existing prototype warnings. Desktop/mobile screenshots were inspected and the live context bar has a passing rendered prototype-style comparison. Broader cross-browser, exhaustive accessibility and large-data acceptance remain outstanding.

This is a browser-based procurement pipeline planner. The new local React app now supports Library creation, procurement Add/Edit, timeline/date/clash review and named pipeline saving/reopening alongside the preserved HTML/vanilla JS/React reference prototype. It is not yet a hosted, authenticated, multi-user application.

Project root: `C:\Dev\code\react\react-empty-project-template`.

Read `AGENTS.md`, [BUILD_PLAN.md](BUILD_PLAN.md), this file and `SNAGGING.md` before continuing. The README is still Vite template documentation. The new app starts at `/` (redirecting to `/workspaces`); the complete prototype remains at `/mockups/pipeline.html`.

## Earlier refinement: no-results creation and overlap heading, 13 November 2026

After reviewing the restored phase chooser, the user asked to change the overlap heading and carry an unsuccessful search into new-phase creation with its text selected. They reviewed the no-results layout proposal and explicitly approved implementing both sets of proposals. This supersedes the earlier search-treatment deferral for this specific refinement. The separate Empty Library redesign and Save schedule as template remain deferred.

`phase-browser.tsx` now groups a nonblank zero-match search into **No phases found for “{query}”**, a short reusable-phase explanation and a primary **+ Create “{query}”** action below it. The duplicate zero count/no-match message and generic creation prompt are removed in this branch. Query text is trimmed for the proposed phase name; the original search input remains on cancellation. Duration/preview guidance is only shown after selecting a phase, and the disabled footer Add action has subdued styling. Blank initial empty-Library presentation is otherwise unchanged.

The query travels through the shared schedule editor into procurement/template phase creation. `PhaseDialog` uses the provided initial name and native input focus/select on opening a new phase. Typing replaces the full selection; untouched cancellation returns to the chooser immediately, edited cancellation uses the existing discard guard, and neither creates data. Creation remains explicit/transactional. Direct Library creation starts blank, and editing existing phases keeps their actual names. The three React heading occurrences now read **Overlaps that will be flagged across the pipeline**. Reference mockups remain unchanged as an intentional approved copy departure.

No dependency, schema/storage upgrade, scheduling algorithm, draft recovery, starter data, cloud, AGENTS.md or SNAGGING.md change is included. The previous prototype reordering/relationship corrections remain in place. Review this targeted no-match/creation refinement before considering the remaining deferred enhancements.

Verification for this refinement: **70/70 Chromium tests passed**, including four new desktop/mobile and shared-template journeys. These verify prefill/full native selection, typing replacement, cancellation without writes, explicit creation, blank direct Library creation and conditional guidance. Desktop/mobile screenshots were inspected. Production build/strict TypeScript checks and app/test lint passed. No domain logic changed; the previously passing 126 Node tests were not rerun. The local app at http://localhost:5173 returned HTTP 200.

## Earlier correction: prototype phase interactions restored, 13 November 2026

The user reported that Add phase, relationship review and schedule movement still differed from the prototype. They then explicitly deferred the newly proposed Empty Library styling, additional No search matches treatment and Save schedule as template action, directing restoration of prototype functionality first. This correction completes those interaction gaps within the existing approved Library/Add/Edit restoration. Do not add any of the three deferred enhancements on the strength of earlier discussion. Existing basic empty/search feedback and template create/edit/load remain available.

Add phase now follows the stacked source flow: Library radio choices, procurement-specific name/duration, default/provenance notes, linked rules and Add phase to procurement. Overrides retain the phase link and do not change the Library. Cancelling inline phase creation returns to the still-open chooser; successful creation adds/closes as in the source. The shared Dialog gained only an optional header-description prop, leaving other dialogs' existing markup/focus behaviour intact.

Relationship handling now follows predecessor identity, via `domain/relationships.ts` and `projects/use-relationship-review.ts`, shared by procurement/template editing. Ordinary sequential changes require no acknowledgement. Nonzero overlaps/gaps whose predecessor changes show the old/new neighbour and amount, with Review first check and valid-only Keep this relationship. Changing an amount/type also acknowledges a valid relationship. Invalid first-item offsets, impossible overlaps and invalid amounts must be corrected. Generic Relationship reviewed buttons and automatic first-offset reset are removed.

Reordering now ports the prototype's native insertion-marker controller in `projects/use-schedule-reorder.ts`: the grip is in Actions beside Edit/remove; extra up/down buttons and optimistic live row sorting are removed. Rows remain in place during the drag, with a dimmed source, insertion line and floating destination label; only a valid drop changes order. Pointer capture, outside-drop/cancel protection, edge scrolling, Space/Enter, arrow/Home/End, Escape, Tab, focus/window-blur cancellation and item-identity focus restoration are included. The controller cleans up listeners/animation/ghost elements on unmount. Installed dependencies/lockfile are unchanged; the new-app schedule editor no longer uses dnd-kit. The original controller remains untouched in the reference prototype.

Verification: **126/126 Node tests and 66/66 Chromium tests passed**, plus production build/strict checks and new app/domain/test lint. Seven new phase-interaction browser journeys include direct connected-prototype field/footer/relationship-note comparison, overrides without Library writes, creation cancellation, relationship correction, pointer insertion/outside cancellation, keyboard cancellation/focus and narrow-screen simulated touch drag. Existing Library/template, persistence upgrade, working-session, leave protection, critical explanation and failed/stale-save tests remain passing. Desktop/mobile chooser, relationship and drag screenshots were inspected. No user's browser data was reset/used as a fixture; no storage/schema/date-calculation algorithm, cloud, prototype-source, AGENTS.md or SNAGGING.md change was made. Cross-browser, physical-device and broad full-MVP parity are not claimed. Review these corrected interactions with the user before revisiting the deferred enhancements.

## Earlier completed package: coordinated Library/Add/Edit restoration, 12 November 2026

After approving the planning sequence, the user explicitly approved the full consolidated implementation proposal in one go, including Library/Add/Edit restoration, templates, shared controls, selective timing-impact review, the recommended update/historical-property decisions, storage upgrade, verification and documentation. **This package is implemented.** The earlier documentation-only authority below is historical and superseded for this exact package; do not seek approval again to finish or verify its authorised scope.

Library now uses the approved Templates and phase library heading/introduction, two section-selection cards, phase search/table and symmetric shared-rule summaries. Phase create/edit saves all its rules atomically with revision checks; deleting a referenced phase is blocked. Templates have descriptions, ordered phases/milestones, durations/relationships and a usual anchor without dates. Their create/edit/delete, stale/failed-save handling, dirty cancellation and explicit default-update review use shared schedule controls. New workspaces remain empty.

Add/Edit now use the approved numbered card/compact-summary approach, source wording, Library-first browser/details, phase settings, repeated Add controls, milestones and deliberate anchor unlocking. Optional template loading in Add assigns new item identities; replacement requires confirmation and retains procurement name/date. Shared grips use the installed MIT/typed dnd-kit package, with keyboard and up/down alternatives and required relationship review. Edit has pending phase-range movement with edit/remove, details cancellation without mutation, exact-date/Friday-finish review and native final confirmation. Removing a movement preserves unrelated later edits. Applying a procurement still changes only the working pipeline; named Save remains separate.

Edit comparison uses the actual named-saved reference, not a newer unsaved working copy. Saved/proposed timelines share one viewing-window control, matching date extents and synchronized scrolling. Review tables have explicit start/finish columns, movement wording, targeted Christmas explanations, removed activities and disclosed anchor/gap details. Ordinary findings retain the shared current-rule approach and critical-explanation requirement. Full Pipeline Compare/adjustment/baselines remain future packages.

Library timing review lets the user choose the current working pipeline or another editable saved alternative. The existing navigation guard protects replacement of unsaved work. Future inherited-duration activities may be selected; custom durations and past/started activity are protected. Preview includes indirect date/gap/Christmas effects and current clashes; proposals moving protected activity or pulling future work into today/the past are rejected. Apply updates working memory; Save/Save as persists later. Saved names/colours remain recorded, and template default updates are explicit. No bulk multi-pipeline overwrite is introduced.

Files: `features/library/{library,phase-dialog,phase-browser,template-editor,library-impact}.tsx`, scoped Library CSS; `features/projects/{project-editor,schedule-editor,schedule-values,procurement-details-editor,schedule-comparison,schedule-dates}` and scoped editor CSS; `domain/library-updates.ts`; schema/local-data and small Timeline/Pipeline integrations. `ltpp-app-local` is now **IndexedDB v3**, adding the workspace-indexed templates store while retaining v1/v2 records. Library, pipeline and existing workspace record schemas remain compatible. No new dependency was installed. `vite.config.ts` explicitly prebundles installed dnd-kit entry points to prevent first-route optimization reloads. The How it works availability note now excludes templates: “Pipeline Compare and baselines are not available in this build yet.”

Verification: **123/123 Node tests and 59/59 Chromium tests passed.** Ten new restoration journeys cover source/copy/layout comparisons at 390/1440px, Library search/shared rules, templates/replacement and no implicit saves, failed/stale records, details/range movement and comparison, keyboard sorting, duration preview, v2 upgrade/data retention and stale Library editing. Existing suites cover 320/768/1440px, failures/atomicity, critical explanations, Save/session/leave guards and no recovery. After the last movement-removal correction its Edit test passed again with a later name change retained; the two strengthened exact-copy/reference-layout tests also passed. App/reference desktop/mobile screenshots were inspected. Production build/strict checks and new app/data/domain/test lint pass. User browser storage was not used as a fixture or reset. Cross-browser/full accessibility/large-data acceptance is not claimed.

BUILD_PLAN.md records the resolved decisions, delivered modules, approval and remaining scope. PC-06/07 broad completion still awaits user visual review and remaining MVP states. AGENTS.md/SNAGGING.md, prototype sources, AWS/auth, general Pipeline Compare/adjustment, baselines and XLSX are unchanged. Next review this package with the user before proposing another bounded functional package.

## Earlier planning approval: Library and Add/Edit restoration, 12 November 2026

The user reported that Library and Add procurement do not look like the approved prototype. Read-only source comparison confirmed the gaps: Library lacks the two section-selection cards, searchable table/shared-rule actions and complete editing/templates; Add/Edit uses a simplified form/dropdown/table instead of the full approved browsing, row/settings, layout and confirmation journeys. Existing functional test passes are not evidence of complete visual/copy parity.

The user approved recording a coordinated four-stage sequence in BUILD_PLAN.md and this handover only:

1. Restore page structure and exact wording: Library section selection and Add/Edit source layouts, headings, notes and action placement.
2. Restore phase selection/settings: searchable Library browsing, phase details/rule summaries, row settings and repeated Add controls, sharing appropriate components.
3. Implement Library editing/templates: phase/rule maintenance, ordered phases/milestones, relationships, date-free anchor, overrides and replacement confirmation. Resolve Library update scope/historical properties before timing-impact actions.
4. Restore preview/confirmation: approved review tables, timeline/action arrangement and final Add/Edit confirmations, preserving calculations, clash checks and leave protection.

BUILD_PLAN.md section “Agreed next priority: coordinated Library and Add/Edit restoration” contains the source links, per-stage acceptance checklist, exceptions, open choices and implementation gate. For every stage, compare actual React screens against the corresponding prototype state at desktop/mobile widths and verify exact wording/dynamic conditions as well as functionality. Do not redesign the approved interface, claim whole-screen parity from partial checks, or add decorative controls for missing functionality. Preserve empty Libraries, current workspace rules, no recovery, no demo notices, one-step Add, explicit Save and working-session continuity.

**Authority: documentation only. No implementation is authorised by this approval.** No source, dependency, schema, saved data, prototype, AGENTS.md or SNAGGING.md changes are included. Next present the exact scope/files/behaviour and verification for the first bounded implementation stage, and obtain separate approval. New dependencies require an existing-solution assessment and approval. Library duration-update scope, linked-template update presentation and historical name/colour handling remain open before their affected work; earlier structure/browsing proposals can proceed without deciding them now. Documentation links/content were checked; no application tests are needed for this planning-only update.

## Previous delivery: anchor symbols on timeline labels, 12 November 2026

**Placement correction, separately approved:** the left-padding placement was rejected as messy. The anchor is now inline immediately before the milestone name, inherits the muted label colour and text size, and has a 4px gap. Long labels wrap naturally; the previous padding-placement and unchanged-row-height statements below are superseded. The reference comparison permits one additional line only for the procurement row, while retaining other dimension/style comparisons. Real-label checks ensure the icon stays inside the text block.

The user separately approved a tiny anchor beside each procurement's anchor milestone/date label, covering real and example timelines. The shared `ui/timeline.tsx` now prefixes the existing dynamic `anchorName`/actual-date label with a native text anchor (⚓︎), accessible name and title “Anchor milestone”. This automatically applies to illustrative, editable, saved-view and editor-preview timelines. No icon dependency, data/schema or scheduling change was needed; the prototype source remains unchanged. Existing parity tests now assert accessible symbols for the three examples and real procurement labels.

## Earlier delivery: explicit example banner, 12 November 2026

Anchor-symbol verification: all 9 Pipeline parity tests passed, including illustrative/real accessible symbols, read-only viewing, equivalent-source dimensions and 320/768/1440px layouts. The symbol is positioned in the label's existing left padding so long anchor names retain their wrapping/row height; the reference screenshot includes differing milestone names such as Contract awarded. Desktop screenshot inspected. Production build/strict checks and new app/test lint pass. Domain code is unchanged; no full Node/browser rerun was needed for this small presentation change.

The user separately approved making the example unmistakable. `features/pipeline/example-pipeline.tsx` now places a pale-blue notice directly above the timeline: **Example only — your pipeline is currently empty**. Its explanation reads “These fictional procurements show how your timeline could look. Choose **+ Add procurement** to start your own.” Scoped styles are in `pipeline.css`. Both notice and example disappear on the first real Apply, before named Save. Timeline colours, example inspection, current modal and normal populated timelines are unchanged; no new dependency, domain/schema/storage/prototype change is included. Existing browser checks now assert the exact text, removal, narrow-screen wrapping and unchanged workspace contents.

## Earlier delivery: approved welcome modal layout and scrolling, 12 November 2026

Example-banner verification: all 17 Pipeline parity/welcome tests passed, then the example Apply/removal/storage journey and 320/1440px empty-page checks passed again after the final banner/timeline join correction. Exact notice text and its adjacency to the timeline are asserted. Mobile screenshots were inspected. Production build/strict checks and new app/test lint pass. No domain code changed; the prior complete 49-browser/119-Node results are historical, not fresh full-suite runs for this banner.

The user approved the standalone welcome-layout mockup and then separately authorised applying it to React with tests and plan/handover updates. `pipeline-welcome.tsx` now displays a short introduction, three numbered steps (Add your first procurement / Build and check your pipeline / Save your pipeline), separate help and a Got it footer. Instruction sentences and workspace links are retained, with consistent 15px body text and restrained emphasis matching the approved mockup. This supersedes the earlier four-paragraph layout and its scattered bold concepts.

`pipeline-welcome.css` constrains the modal to the actual viewport, uses native scrolling on the dialog with sticky header/footer, and locks the background while it is open. Scrolling works with the pointer over instructions or either fixed control area. `ui/dialog.tsx` adds optional class/footer/title-focus props; other dialogs retain their normal structure and focus target. Welcome initial focus moves to the title without scrolling, not to Got it at the bottom. The existing dismissal flag is retained, so returning users reopen the changed modal via Getting started. No dependency, scheduling, workspace/schema, saved data or prototype change is included.

Verification: all **49 Chromium tests passed**. Welcome checks cover exact wording/headings/emphasis, initial title focus, per-workspace dismissal/reopening, wheel scrolling in both directions over body/header/footer at 320x520 and 720x450, PageDown, simulated touch swipe, enlarged text at 640x360, stationary background and visible controls. Reduced viewports exercise the layout constraints encountered at browser zoom; this is not a claim of testing a physical trackpad, every browser zoom level or real mobile hardware. Desktop/mobile screenshots were inspected. Production build/strict checks and new app/test lint pass. Domain code is unchanged; the prior 119 Node tests were not rerun for this presentation change.

## Earlier correction: single-step first procurement and welcome wording, 12 November 2026

The user explicitly approved removing the redundant Create pipeline step and applying the revised modal wording/emphasis, tests and documentation. An empty Pipeline page now has **+ Add procurement**; one click opens the existing Add form through `?edit=1&add=1`. Cancelling returns to the example, while applying the first procurement replaces it with the working timeline before named Save. Opening the form does not create a saved pipeline. Existing session, form protection and Save behaviour are retained; no dependency, schema or scheduling change is included.

The welcome modal now explains what the example shows and when the real timeline replaces it, explicitly directs the user to **+ Add procurement**, and ends by explaining that **Getting started** reopens the instructions. Bold emphasis covers that action, phases, anchor milestone and date, Library, Save, How it works and Getting started. Library/How it works links retain their workspace destinations. The exact four-paragraph copy is in BUILD_PLAN.md and `pipeline-welcome.tsx`; it supersedes the earlier introductory paragraphs.

Verification: all **45 Chromium tests passed**, including direct first-entry Add/Cancel/reentry, applying the first procurement before Save, approved modal paragraphs/emphasis, modal keyboard/responsive behaviour and existing save/session/failure journeys. Production build/strict checks and new app/test lint pass. No domain code changed; the prior 119 Node-test result was not rerun for this UI correction.

## Earlier correction: welcome introduction is a modal, 12 November 2026

The user pointed out that the long introduction must be a modal/pop-up, not embedded page content, and explicitly approved moving it into a dismissible welcome modal, adding Getting started to reopen it, per-workspace first-visit display and documentation updates. `features/pipeline/pipeline-welcome.tsx` now uses the existing native `Dialog` with the approved paragraphs and links unchanged. It opens automatically on the first Pipeline visit in each workspace in this browser. Close, Escape, Got it and following either guidance link remember dismissal; Getting started reopens it from empty or populated pages. Focus returns to the trigger on close. The empty panel retains its heading/actions and read-only example, without the introduction.

Only a namespaced per-workspace localStorage dismissal flag is added. No dependencies, domain logic, workspace records, IndexedDB schema, draft recovery or prototype data are changed. This preference is browser-local; clearing browser data resets it, and unavailable localStorage prevents persistence but does not block use. The correction supersedes older statements below that place long guidance in the empty-state panel.

Verification for the correction: **44/44 Chromium tests passed**, including per-workspace dismissal across reloads, reopening, Escape/Close/Got it, working guidance links, no pipeline/Library writes, modal background blocking and keyboard focus at 320/1440px. Mobile modal and desktop empty-page screenshots were inspected. Production build/strict checks and new app/test lint pass. Domain calculations are unchanged; their prior 119-test result was not rerun for this presentation-only correction. Review server http://127.0.0.1:5173/ returned HTTP 200.

## Earlier Pipeline restoration and empty-state example, 12 November 2026

The user rejected the long introduction as permanent page content and the newly proposed replacement subheading: the final populated page should reproduce the approved prototype for its actual state, excluding prototype notices. After a read-only comparison, the user approved the page-restoration package, added a read-only example before the first procurement, and gave separate explicit implementation approval for the full revised scope, tests and plan/handover updates. Their subsequent “resume” continues that same authorised work. **This package is implemented.** No new dependency, storage/schema migration, domain-calculation change, AWS work, AGENTS.md/SNAGGING.md change or prototype-source edit was included.

Empty state: the existing approved introduction and How it works signpost now live inside the empty-state panel only. `features/pipeline/example-pipeline.tsx` supplies three illustrative schedules using the shared renderer, with varied dates, durations, colours and anchors. It has no workspace/data-API imports and offers inspection only. No example/starter phase, rule, pipeline or working procurement is inserted. Both guidance and example disappear immediately after the first actual Apply, before named Save. No onboarding persistence or draft recovery was added.

Populated page: `features/pipeline/pipeline.css` restores the context-bar arrangement, name/status row, context explanation, right-aligned checks and Review findings link; native Save dropdown with approved Save/Save as descriptions; combined title/controls timeline toolbar; Full pipeline and arrow controls; reference row/label/bar dimensions, white canvas, outlines, legend/help and wrapping findings section. The procurement overview now shows planning start/finish, actual anchor and real Edit/View details actions in both editing/viewing states. Ordinary findings have All/Critical clashes/Warnings filters with counts, pressed states, live result messages, compact overlap dates, phase/participant mapping and working procurement actions. Read-only details in `ui/procurement-details.tsx` show recorded phases, Friday finishes, actual anchors and gaps without enabling edits. Narrow tables retain readable columns with labelled keyboard scrolling.

Details reuse: `ui/timeline-details.ts` ports the existing framework-independent tooltip controller with its CSS, hover/focus binding, independent pins, keyboard close and focus restoration. Its document/window listeners are installed only while timeline sources exist and removed when the last source unmounts. Focus-induced scrolling keeps active details usable. Save, record inspection and guarded navigation close details appropriately. `ui/timeline-segments.tsx` adds an opt-in Pipeline presentation; the reference prototype's adapter keeps its prior default. The app has no prototype fixture/global-data dependency. The new table/card links use existing Edit or read-only viewing, including selected procurement links for named saved routes.

Interaction corrections: Add/Edit returns focus to the Pipeline at the top so its newly populated state is visible. Review findings focuses and scrolls the in-page section without creating browser history outside React Router. The existing single workspace blocker, save/switch atomicity, input retention on failure and memory-only working context remain intact.

Verification: **119/119 Node tests and 41/41 Chromium browser tests passed.** Nine new parity journeys cover example isolation/removal before Save, real filter counts/empty results/links, dates/read-only details, multiple pins and keyboard focus/close, native Save dropdown, Full pipeline and responsive layouts at 320/768/1440px. One journey loads an actual editable prototype in an isolated browser context and builds equivalent app schedules in isolated test storage; it compares core context/row/label/bar dimensions, typography, borders/radii and context colour. Reference/app, empty-example and narrow screenshots were inspected. Build/strict/lint validation is recorded with completion; no tests use the user's browser profile or modify their data. Browser-test Vite child processes are stopped after their completed runs when Windows leaves the runner waiting for shutdown.

Remaining scope: real live/current/previous baseline states, their exact dependent headings/subheadings and actions, first-baseline confirmation/history, Adjust Pipeline, templates, Edit range/saved comparison/confirmation details, general Compare, Library timing-impact preview and XLSX remain later functional packages. The screenshot's blue live bar and “Follow the live plan, or explore a different way forward.” belong to real live state; do not label today's editable alternatives as live or add decorative Adjust/baseline controls. Editing copy that assumes an existing live baseline stays tied to that future state. The rejected substitute subheading is not used. Full page/MVP parity, complete accessibility, Firefox/WebKit and large-data acceptance are not claimed. BUILD_PLAN section 5 records delivered checklist subsets; SG-001/002/003 remain open. Next review this package with the user and prepare a separately approved remaining functional package.

## Earlier usability, wording and workspace navigation package, 11 November 2026

The user separately approved a bounded implementation package after the read-only prototype audit and checklist update: move workspace navigation into the top bar, restore applicable approved wording, add How it works, preserve working pipelines across page navigation, verify and update BUILD_PLAN.md/this handover. They revised and approved the first-use paragraph, its anchor milestone/date phrasing and the How it works signpost before authorising implementation. **This package is implemented.** No new dependencies, AWS work, data/schema migration, prototype-source edits or AGENTS.md/SNAGGING.md changes were included.

Shared header: workspace selection is a compact native select alongside Pipeline, Library, Saved Pipelines, How it works and Workspaces. There is no repeated workspace banner in page content. Workspace creation/selection remains on the dedicated Workspaces page. Long names and keyboard/narrow-screen access were checked. The pipeline context bar remains in its approved position and describes the selected pipeline rather than duplicating workspace controls.

Session continuity: `src/features/pipeline/pipeline-session.tsx` owns memory-only working schedules/acknowledgements and the save/switch modal at the persistent workspace layout. Its small context/types live in `src/app/workspace-context.ts`; `save-dialog.tsx` is the extracted existing save form. Visiting Library, Saved Pipelines, How it works or another saved viewer preserves applied working changes. Header Pipeline/brand resumes that session; a read-only saved view does not initialise or overwrite it. With no working session, returning from other workspace pages retains the last viewed pipeline. Explicit Edit on another record or a workspace change protects dirty work. Nothing persists an unsaved draft or restores it after reload/crash.

One router blocker coordinates the whole workspace. `src/ui/use-leave-protection.ts` now registers dirty page forms with that owner rather than installing competing blockers. Unfinished procurement/Library forms offer Keep editing or Discard. Discarding a form preserves already-applied pipeline changes; if the destination also replaces/leaves a dirty working pipeline, the subsequent pipeline Save/Discard/Keep editing decision remains required. Failed Save keeps inputs, saved contents, working changes and the pending destination. Successful Save proceeds to the requested destination. Browser interruption warnings remain supplementary.

Wording: `BUILD_PLAN.md` section “Implemented wording and navigation slice” records approved sources, branch conditions, destinations and remaining gaps. The initial Pipeline page uses the user's expanded explanation verbatim with Library linked, and the agreed “See How it works…” paragraph. Applicable Pipeline headings/context states/checks, timeline legend, Add/Edit introductions/headings/table labels/anchor notes, Library phase instructions and Save/Save as text are restored from the connected prototype. The phase dialog distinguishes Library creation from creating-and-adding a procurement phase, using the prototype's existing wording for each. Save retains actual counts, optional copying from the overwrite dialog, required saving reason, automatic author/time details and failure inputs. No claim of exhaustive copy/layout parity is made.

How it works: a route-loaded page at `/workspaces/:workspaceId/how-it-works` preserves all four approved points and date-sidebar text, the Christmas example and the pale-blue fourth section. The separate approved temporary note reads “Templates, Compare and baselines are not available in this build yet.” The unavailable live-pipeline action is omitted; existing guide links open the workspace Library/Saved Pipelines. The guide test compares all workflow/sidebar headings and paragraphs directly with `mockups/how-it-works.html`.

Verification: **119/119 Node tests and 32/32 Chromium browser tests passed**, with four affected Add/Edit/guide/dirty-form journeys rerun after final static-text corrections. Coverage includes dirty and clean navigation, read-only inspection without replacement, Edit-other-record protection, save/discard/cancel when switching workspaces, failed Save and retry with destination retained, no draft recovery, same-dialog Save as without overwriting, Library-rule refresh without rescheduling or implicit saves, native modal/keyboard handling and header/page widths at 320/768/1440px. Guide/Pipeline screenshots were visually inspected. Build/strict checks pass; new app/test code has no lint warnings, and the same nine old prototype warnings remain. This is not full accessibility, Firefox/WebKit or large-data acceptance. Test browser contexts use their own data and never the user's browser profile. The test Vite child processes were stopped after their completed runs because Windows left them alive during runner shutdown.

Review URL: http://127.0.0.1:5173/ was checked successfully (HTTP 200) after implementation. Confirm availability in a later session.

Next: review this package with the user, then propose the next bounded parity package: the procurement start/finish/anchor overview, ordinary findings filters/procurement links and floating/pinned timeline details. Baselines/history, templates, Edit range movement and saved-comparison/confirmation details, general Compare, Library timing-impact preview and XLSX export remain later work. Source text tied to those missing controls stays explicitly pending; do not silently invent replacements. PC-01/02 also retain future baseline-state work, so the broad checklist rows are not marked fully complete. SG-001's critical wording still awaits review, and SG-002/003 stay open. Further implementation requires separate approval.

## Earlier working planning journey, package 2A implemented, 11 November 2026

The user explicitly approved package 2A, including the two named form dependencies, data/schema/storage work, shared Add/Edit, timeline extraction, saving/reopening, tests and updates to BUILD_PLAN.md, this handover and SG-001. They subsequently resumed the same approved work after an approval-service usage-limit interruption. **This package is implemented. Later baseline/Compare/template/Library-update/adjustment/export work still requires specific approval.** AGENTS.md, AWS/auth and prototype saved data are unchanged.

Agreed first use: no starter Library is offered or inserted. Each workspace starts empty. Users can create phases and their optional overlap rules directly from Add Procurement or from Library. Creating a definition explicitly saves it independently of the unfinished procurement. Cancelling a procurement does not remove definitions already created. New rules assess all relevant saved/working schedules using the current workspace Library, without changing dates.

Working flow: choose workspace, Create pipeline, Add procurement, create/select Library phases and milestones, choose an actual anchor, preview, apply, then Pipeline Save with a name/reason. One `ProjectEditor` serves Add/Edit. Edit anchors are locked until explicitly unlocked; custom duration provenance is stored rather than inferred from matching numbers. Order changes flag affected relationships for review. Numeric Up/Down controls support ordering; stable per-project counters prevent reuse of removed activity identities. Date review shows before/proposed dates and plain-language movement, with Christmas explanations only where affected.

Warnings are advisory. New/changed critical findings require a recorded explanation before applying Add/Edit. Acknowledgements are tied to the reviewed project/phase pair, overlap spans, severity and rule explanation. Save rechecks current rules and Library/record revisions; changed checks must be refreshed and new critical issues reviewed. The Save modal displays those issues itself. The same severity-coloured finding cards are shared across Pipeline, procurement review and Save review. No-rules states explicitly say checks are not configured rather than implying a clean assessment.

Save overwrites the latest editable record, Save as creates a separate named copy, and the basic Saved Pipelines page provides View/Edit and saved details. First Save does not make a baseline. Baseline confirmation/history, Compare, template management, existing Library definition/rule editing/deletion, applying duration updates, interactive drag adjustment and XLSX export remain future packages. Current records are editable saved alternatives; do not label them as live baselines. Prototype baseline behaviour remains in the reference app.

Storage is still the separate `ltpp-app-local` IndexedDB database, upgraded to version 2 with `libraries` and `pipelines` stores and a workspace index. Existing v1 workspace rows are retained unchanged; absent Libraries load empty without writing starter data. Runtime schemas validate schedules/identities/date consistency and workspace references. Transactional writes check expected record/Library revisions, distinct pipeline names and current critical acknowledgements. Failed/stale writes preserve the saved record and active form state. Native foreground dialogs handle leave/discard decisions; browser interruption warnings complement them. Working procurements/pipelines remain memory-only until explicit Save; no draft recovery was added.

New modular code: `src/domain/project.ts` supplies schedule construction and critical acknowledgement helpers; `src/data` owns validated records and asynchronous operations; feature modules own Library/phase dialog, shared procurement editor, Pipeline and Saved Pipelines. `src/ui` owns native dialogs/leave protection, shared finding cards and timeline rendering. `src/app/workspace-context.ts` keeps current Library updates in the workspace UI context without resetting form drafts. Library/Pipeline/Saved Pipelines are route-loaded; there is no additional global state framework or local server.

The timeline segment renderer was extracted to `src/ui/timeline-segments.tsx`. The existing prototype adjustment module uses a thin wrapper to retain its shared tooltip bindings and selection callbacks. New timeline code does not import trial/demo modules. Pinned additions are react-hook-form 7.92.0 and @hookform/resolvers 7.0.5 (both MIT); existing libraries remain installed. React best-practice and frontend-design guidance were applied to preserve the approved colours/layout, normal bold, keyboard access and foreground confirmations.

Verification: **119/119 Node tests** and **23/23 Chromium browser tests** passed. Build/strict checks passed. Browser coverage includes empty-Library inline creation, atomic phase/rule rollback, advisory warnings and required critical explanations, preview/apply/save/reload/edit/Save as, record and Library staleness, preserving inputs on failed writes, workspace boundaries, v1 upgrade, no draft recovery, relationship review, stable IDs, native detail/discard dialogs and keyboard/narrow-screen checks. The relationship case was rerun after refining invalid-gap validation. Visual screenshots at 320/1440px were inspected; 320/768/1440px foundation checks still pass. Changed app/test files have no lint warnings; the same nine old prototype warnings remain. Full accessibility, Firefox/WebKit and realistic large-data performance acceptance are not claimed.

The reference prototype's two connected entries also bundle; expected classic-script notices remain. An isolated browser verified matching Compare findings, protected baseline editing, adjustment movement/review/discard and unchanged fixed saved records after renderer extraction, with no runtime errors. Test contexts never use the user's browser profile. The development review URL http://127.0.0.1:5173/ was checked successfully; confirm availability in later sessions.

Next: review package 2A with the user. Then propose the next bounded package, including decisions for first-baseline confirmation and the remaining Library/template/adjustment journeys. Do not treat approval of 2A as permission to implement those features or migrate prototype data. SG-001 records the implemented React guidance pending user wording review; SG-002/003 remain open.

## Earlier shared domain package 1B, 11 November 2026

The user separately approved the specific package 1B proposal after 1A: shared calendar/scheduling/comparison modules, prototype compatibility, fictional fixture separation, current-rule domain assessments, tests, configuration and these documentation updates. **Package 1B is implemented. The working Pipeline/editor UI and later milestones still need specific approval.** No new dependencies were installed; no HTML/React screens, browser stores, AGENTS.md, SNAGGING.md or AWS resources were changed.

Shared code is now in `src/domain/calendar.ts`, `scheduling.ts` and `comparison.ts`, checked with strict TypeScript. The calendar, movement, duration, gap, clash, identity-based comparison, grouping and Christmas algorithms were extracted rather than duplicated. These modules have no React, DOM, storage or fixture imports. `PipelineSchedule` contains name/plans, not saved rules. `findClashes(plans, rules)` requires explicit rules, and `comparePipelineFindings(before, after, currentRules)` assesses both schedules against those same current workspace rules. Matching findings remain in its output. No assessment mutates schedules or historical baseline contents.

The three prototype calculation entries now reuse the shared modules. The prototype alone retains its optional sample-rule default and legacy saved-rule/counterfactual comparison helpers; its historical behaviour is deliberately preserved. `pipeline-fixtures.ts` holds fictional rules/plans; `pipeline-version-fixtures.ts` holds example saved records. The new app must import the domain directly, not these compatibility entries or fixtures. Standalone legacy HTML/demo-data calculations remain reference code until the corresponding React features replace them; 1B did not rewrite those scripts or extract the timeline UI.

Verification: **116/116 Node tests passed** (99 original prototype regressions, two 1A validation tests, 15 new domain tests). Coverage includes current rules on saved/current/previous schedules without rescheduling or mutation; matching issues; added/changed/removed rules; selection reversal and grouping; Friday finishes, actual anchors, daylight-saving boundaries, Christmas active weeks, range movement, gaps and invalid fractional edits. Build/typecheck passed, including strict domain checks. All changed domain/adapter/fixture files pass lint with warnings denied; the whole project retains the same nine unrelated prototype warnings and zero errors.

Both connected prototype HTML entries bundled successfully into ignored `node_modules/.cache/ltpp-prototype-build`; classic-script notices remain expected. An isolated Chromium browser exercised Compare with matching issues visible, protected baseline editing, adjustment movement/review and foreground cancel/discard. Fixed saved records remained unchanged and no application runtime errors occurred. The 1A ten-test browser suite below is its earlier result, not a fresh 1B run. The 1B package introduced no visible changes to review on the new app's placeholder pages.

Next: review first-use Library/project data requirements and present a specific working Pipeline/Add/Edit package for approval. Do not treat completion of the shared engine as authorisation to connect all editors, migrate prototype data, remove trial dependencies or provision AWS.

## Earlier foundation package 1A, 11 November 2026

After the planning documents and read-only audit, the user explicitly approved the presented first implementation package: shared layout/navigation, local workspace creation/selection, browser storage, strict typing, React Router/idb/Zod, Playwright and its Chromium browser, verification and updates to these two documents. **That package is implemented; later domain/editor work and AWS are not authorised by this approval.** `AGENTS.md`, `SNAGGING.md`, prototype source and prototype saved data are unchanged.

The app has an approved-style header, workspace picker, Local user identity and honest empty states for Pipeline, Library and Saved Pipelines. Workspace creation is an explicit committed IndexedDB save; unsaved form entries are not recovered. Metadata includes stable ID, schema version, name and real creation time/local actor. The data model only includes what workspace creation needs; planning/Library contents and their operations will be added with those features. No fake accounts, permissions or shared editing are presented.

`src/data/local-data.ts` owns async list/get/create operations and the separate `ltpp-app-local` IndexedDB database. `schemas.ts` validates input/records with Zod and derives TypeScript types. Failed writes preserve input and prior saved records; invalid/unsupported records produce a useful error without reset/migration. The old prototype key `ltpp-connected-mockups-v1` is untouched. React Router data loaders/actions own navigation and workspace context, avoiding a second global state store.

Pinned additions: react-router 8.5.1 (MIT), idb 8.0.4 (ISC), zod 4.6.7 (MIT), @playwright/test 1.65.0 (Apache-2.0). Chromium was installed for isolated verification. Existing React/Vite and trial packages were retained. `frontend-design` and `vercel-react-best-practices` guidance were applied; no new skills were installed. Strict checks cover the new app, tooling and browser tests. `tsconfig.prototype.json` preserves checking the old prototype without expanding this package into a strict-mode rewrite.

Verification: production build/typecheck passed; **101/101 Node tests passed** (99 existing plus two schema tests); **10/10 Chromium tests passed**, plus the three layout cases rerun for screenshots. Coverage includes persistence, distinct workspace IDs/selection, reload/deep links, unchanged prototype-storage sentinel, non-recovered unfinished entries, validation/focus, save failures/retry, transaction rollback, unreadable records left intact, blocked storage recovery and missing routes. Keyboard/overflow and visual checks passed at 320/768/1440px. Lint has zero errors and nine existing prototype warnings; no warnings originate in new files. This is not full accessibility, cross-browser, scheduling or multi-user acceptance.

Run locally with `npm.cmd run dev` in PowerShell if `npm` is blocked by script policy. A review server was left at http://127.0.0.1:5173/; verify availability in a future session. Check with `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, `npm.cmd run test:e2e`, `npm.cmd run build`. Browser tests start/stop their own server on 4175 with a separate Vite cache and isolated browser contexts. Generated results/screenshots stay under ignored `node_modules/.cache/playwright-results`. The restricted execution environment needed escalation for dependency/browser downloads, dev-cache refresh and clean test-server teardown; the successful unrestricted browser run exited normally.

`BUILD_PLAN.md` is the consolidated reference for the **intended React application**. The first four milestones build a working single-user local application; the fifth adds AWS and real sharing after a separate architecture/cost gate. It distinguishes agreed decisions, technical proposals, open questions and acceptance criteria. The rest of this handover records the **current prototype** and earlier implementation history. Do not mistake planned behaviour for already implemented functionality, or restore a superseded product policy because it appears in older prototype notes.

**Latest delivery decision:** local React first, using one clearly identified local user and browser-backed saved contents. Use the small async data module, with IndexedDB/idb selected for the foundation; UI/domain code should not depend directly on storage primitives or AWS SDK types. There is no separate local API/database server, cloud emulator, custom authentication system or general plugin framework. Only explicit saves persist; no draft recovery is introduced. Local saved contents are browser/origin-specific and can be lost if storage is cleared. Preserve the existing prototype store under its current key; no reset/migration is authorised.

Real Cognito accounts, invitations, membership roles, admin transfer, cross-device sharing and server editing locks are **deferred to AWS integration**, not simulated as secure local features. The local app can organise separate workspaces, but browser storage is not a multi-user access boundary. The later API implementation can reuse the application data operations and domain code; server permissions, authoritative validation and concurrency still need implementation/testing. AWS pricing/account setup does not block an approved local slice.

Key decisions carried into the plan:

- Personal hobby budget: free/native libraries first; consider managed services only at genuinely negligible recurring cost. Ordinary paid SaaS subscriptions are outside the default preference. Flag useful exceptionally low-cost options. A complete ongoing AWS estimate is still required; pennies-level operation is not a verified quote or guarantee.
- Later AWS hosting and Cognito authentication; Clerk is excluded. The first local delivery requires no AWS account/credentials or hosted services. Other AWS services and library/skill additions are candidates requiring review and approval.
- Any email may register, with email verification and accepted invitations. One account may create/join multiple private workspaces. Creator is admin unless another is designated; workspace admins manage access and can transfer administration. No central organisation-admin gate or mandatory organisational-SSO requirement for the MVP.
- Each workspace has its own Library, projects, pipelines, saved alternatives and baseline history. Roles are admin/editor/viewer; editors may maintain the Library and confirm baselines. No cross-workspace sharing/comparison in the first release.
- Explicit edit mode and Save persist named contents locally first; baseline schedules remain fixed and are edited as copies. No automatic draft recovery. Retain latest saved contents/details and baseline history, not a browsable history of overwritten Saves. Server-enforced one-editor-per-named-pipeline coordination is later AWS work; do not build a fake multi-user lock system for local delivery.
- **One current set of workspace clash rules applies everywhere**, including saved alternatives and live/previous baselines. Compare uses those same current rules on both schedules. This supersedes the prototype's rule snapshots and different-checking-rules comparison machinery; the prototype has not been changed to implement it by this documentation task.
- Library duration changes require user-selected scope and accepted impact preview. Only future, not-yet-started activities following defaults are candidates; activity starting today/past/started is excluded. Custom durations stay unchanged; future dates of custom-duration activities may move only after preview/acceptance. The exact pipeline-selection scope remains open; a current-working-pipeline-only restriction was proposed but not agreed.
- Export is **XLSX with a worksheet and formatted schedule table per project**, showing dates/durations and Friday phase finishes, with actual milestone dates. This replaces CSV and text timeline-grid export proposals.
- Non-sensitive MVP; later sensitive-data support needs separate assessment. Design useful security extension points without an enterprise platform. Code names alone do not establish that data is non-sensitive. England bank-holiday highlighting is deferred.
- Procurement stays the MVP's main test case. A generic Project model is proposed to support broader use; final UI naming remains open. Preserve the selected visual language.

The shared domain now supplies the scheduling/comparison engine. Reuse the prototype's React components and regression suites where appropriate when connecting features. Replace legacy HTML/demo scheduling/editor duplication with calls to that engine rather than porting every page verbatim. Packages 1A/1B provide the real entry, workspace storage, strict checks, shared calculations and repeatable tests; they do not yet connect the planning/editor UI.

Costed AWS architecture remains a later gate. Do not extend either foundation approval to later milestones. The historical prototype verification records below remain useful but distinct from the new app's implemented scope and test results.

## Prototype implementation record

**Prototype UI task completed: the refined Option 1 Compare page is implemented with dynamic summaries and nested disclosures.** The user reviewed `mockups/compare-page-options.html`, refined schedule summaries, Christmas explanations, findings grouping and rule language, then explicitly authorised implementing the agreed Compare scope, verification and this handover update. This is a read-only presentation change; no dependencies, saved data, scheduling rules, or baseline-confirmation behaviour were changed. The six-finding/twelve-procurement mockup example was not installed as prototype data or used to cap real results.

General Compare shows initially collapsed Schedule differences and Warnings and critical clashes sections below the existing synchronised, height-bounded timelines. Clash-checking rules expands only when checks differ; matching checks have a short non-expandable explanation. Its overview is generated from the selected pipelines, with appropriate matching/no-change language. Schedule differences show only changed procurements, each initially collapsed with labels such as Begins earlier/later, Phase timings altered, **Phase durations altered**, activities added/removed, anchor, names, order and gaps. Expanding a procurement reveals plain-language bullets; Show exact dates reveals a four-column Activity / pipeline / pipeline / What changed table. Continuous activities combine only when adjacent identities match in both saved orders, both ends move equally by the same amount, work duration is unchanged, and no other properties changed. Unchanged, inserted, removed, reordered or renamed activities interrupt grouping. Actual anchors, metadata and gap changes remain separately described.

Christmas explanations are computed from the scheduler's paused days, appear only on affected phase rows and summary bullets, and explicitly distinguish unchanged active duration from active-duration edits. No calendar-week figures are added to unaffected phases. Earlier/later wording always follows the second selection relative to the first, preserving calendar-day precision and reversing correctly.

Warnings and critical clashes exposes each pipeline's full red critical / amber warning totals while collapsed. Expanding reveals optional procurement search, severity and presence filters, then initially collapsed procurement-pair groups with coloured counts. Each differing finding appears once; expanded groups reuse the aligned comparison-row approach. Matching findings are omitted from details but included in pipeline totals. Rule-driven differences carry **Different checking rules** only when counterfactual checking of the same dates with the other saved rules changes that finding. Schedule differences may also contribute; Not flagged is not proof of no overlap. Clash-checking rules states whether effective saved checks match and expands to actual rule differences, independently of overlap amounts. Checks are compared by phase pair and effective first-match priority, ignoring arbitrary rule IDs.

Implementation: `src/prototypes/pipeline-comparison-details.tsx` and its CSS handle general Compare; `pipeline-comparison-model.ts` derives read-only summaries and rule attribution. `pipeline-versions.tsx` integrates it only outside baseline review. Section navigation opens and focuses disclosures while retaining keyboard access. Baseline review retains its existing directional Movement table and aligned findings review; ordinary findings cards remain unchanged.

Follow-up refinement, separately approved: matching rules now states **Both pipelines use the same rules.** followed by **Any differences in warnings or critical clashes come from differences in the pipelines, rather than different checking rules.** This is a static section, not a disclosure with repeated content. Different rules retain their existing expandable details. Default build/typecheck and server-render verification of both branches passed. Section navigation already targets either a disclosure summary or a static heading. No comparison calculations changed.

Further findings communication refinement, separately approved: removed the combined differing-finding totals and repeated explanations from general Compare. Each procurement group now shows named, separate red/amber totals for each pipeline in the same order as the overall summary. These totals include matching issues; detailed rows still show only differences, as stated in one introduction. A group results count appears only while search/severity/presence filters are active and disappears when cleared. The collapsed-section description mentions rule effects only when the comparison actually contains rule-affected issues. Default build/typecheck, server-render checks for both rule states and isolated browser checks for group counts, filtering/clearing and 320/768/1440px widths passed without runtime errors. Comparison calculations and baseline review remain unchanged.

**Latest correction, separately approved: matching issues are inspectable in general Compare.** The earlier differences-only default hid ongoing problems when both pipelines matched. `comparisonFindings` now retains matching issues. Comparison defaults to **All issues** and includes an optional **Differences only** filter; matching rows say **Same in both pipelines**. Procurement groups still start collapsed, full per-pipeline counts remain visible, and the overview independently tests whether any issues differ. With Differences only selected and all issues matching, the empty state explains how to return to All issues. With no issues in either pipeline, it explicitly states that neither pipeline has warnings or critical clashes. The model regression now asserts matching issues are retained. All 99 tests and the default build/typecheck pass. Isolated browser verification reproduced Initial versus Autumn, inspected both matching issues, switched to Differences only and back, and checked 320/768/1440px widths without runtime errors. This supersedes earlier descriptions of omitting matching rows; baseline review is unchanged.

Verification: **99/99 tests pass**, including nine new comparison-model tests; default build/typecheck and connected-entry bundling pass. Isolated browser checks covered collapsed states, exact-date expansion, reversed selections, section navigation/focus, search and empty states, rule consistency/attribution, matching schedules/findings/rules, red/amber counts, 320/390/768/1440px layouts and baseline review. A larger isolated fixture retained twelve procurements, 156 changed entries and 66 finding pairs, with the timeline still bounded and scrollable. Verification fixture data was restored and the isolated browser closed. Local Vite remains available. SG-003 stays pending user review; `SNAGGING.md` is unchanged.

**Previous task: Option 1 aligned findings comparison rows in Compare and baseline review.** After testing a larger set, the user found the comparison cards difficult to scan, reviewed three standalone alternatives in `mockups/comparison-findings-options.html`, selected Option 1 and separately confirmed implementation and this handover update. Each finding now has one row with phase/procurement details and two aligned pipeline-value columns. Pipeline headings appear once on wider layouts. Native CSS container queries stack each finding with visible pipeline labels when its available width is 640px or less. Red/yellow value backgrounds preserve each saved finding's severity; resolved baseline-review rows retain green treatment. Neutral comparison labels, directional baseline labels, per-pipeline dates, active weeks, reasons, renamed participants/phases, counts, matching-entry notices and rule comparisons remain intact. Other findings lists retain their cards. No dependencies or scheduling/persistence changes were needed.

Verification for this layout: all 90 tests, default build/typecheck and connected-entry bundling pass. Isolated browser checks verified Compare at 320, 390, 768 and 1440px and baseline review at 320 and 1440px, with no row overflow or runtime errors. Desktop uses aligned columns; narrow containers stack. The isolated verification browser was closed.

Schedule differences include Movement beside the two pipeline values, using the same calendar weeks/days wording as Adjust Pipeline. Movement describes the second selected pipeline relative to the first; reversing selection reverses earlier/later. Added/removed entries retain neutral “Only in…” wording in general comparisons, while baseline review uses directional labels. Metadata-only changes say Not applicable. Separate start/finish movement and actual anchor dates retain their precision.

Ordinary findings share `mockups/findings-cards.css` across the main Pipeline page, Adjust Pipeline (including its standalone trial) and Edit Procurement. Adjustment React cards reuse `src/prototypes/pipeline-findings.tsx`. A single automatically wrapping grid places active red critical cards before yellow warnings; resolved findings follow with their existing green treatment. Compare and baseline review now use the aligned rows described above, replacing their earlier cards. Edit Procurement's finding keys include the other procurement ID to distinguish otherwise identical phase pairs.

Audit exclusions: Add Procurement contains guidance and the existing SG-001 placeholder, rather than a findings section; Library displays rule definitions. Historical design-option HTML files remain reference mockups. No new findings functionality or rule changes were introduced. SG-003 remains pending user review in the unchanged snagging list.

Verification: all 90 scheduling, connected-state and comparison tests pass, including new movement/reversal/anchor/gap tests. The app and connected prototype builds pass. Isolated browser checks covered both comparison orders, neutral and baseline statuses, resolved cards, the discard modal, keyboard table scrolling and card widths from 320 to 1440px. The verification browser was closed; the local Vite preview remains available.

Cancelling unsaved pipeline adjustments still opens a foreground discard-confirmation modal. Both Cancel adjustment and the workspace X use the same native `dialog.showModal()` alert dialog, independent of review-table or side-panel scroll position. Keep editing is focused initially; it and Escape dismiss only the confirmation, retaining the exact editing/review stage, draft, entered explanation and pane scroll positions, then returning focus to the initiating control. Discard adjustments closes the workspace without applying changes and returns focus to Adjust pipeline. With no changes, Cancel/X still close directly. The old inline discard stage in the side panel is removed.

The adjustment review's **Movement column** remains beside Before and Proposed. Equal shifts combine into one earlier/later summary; different start/finish movement uses separate lines. Calendar weeks/remaining days are separate from active phase durations, and added/removed gaps are labelled explicitly. Existing dates, duration information, Proposed highlighting and keyboard table scrolling remain.

Pipeline findings still use the selected **one continuous grid of coloured cards**: red critical clashes first, immediately followed by yellow warnings. Separate severity sections/headings were removed after the user rejected their empty space with one finding of each kind. Native CSS Grid `repeat(auto-fill, minmax(min(100%, 22rem), 1fr))` preserves card sizes and automatically wraps to available width without fixed column counts or device breakpoints. Severity labels, phase/procurement links, overlap dates, active duration, filters, counts and empty states remain. SG-003 stays open in the unchanged snagging list pending user review.

The previously selected **horizontal context bar** from `mockups/pipeline-layout-alternatives.html` remains implemented. It replaces the earlier Option 3 side panel: below the page heading and above the full-width timeline, with blue live, grey viewing and purple editing states. Main-page metadata stays omitted; saved metadata and scope remain in Saved Pipelines' Saved details card. Add and Adjust stay together in the editing toolbar. The page-background-colour alternative was not selected.

The saved-pipeline editing and baseline journeys have already been implemented. Do not restart their design discussion or restore proposals/approval. Details below record completed functionality and remaining review/work.

**Authorisation:** the user separately approved the initial Option 3 work, then removal of main-page metadata and consistent **View / Edit / Compare** list actions. They subsequently approved a new standalone two-option preview and selected its **Option 1: Horizontal context bar**. After the implementation scope was presented, they separately confirmed applying it to the connected main page and saved viewer, preserving metadata in Saved details, verifying the journeys and updating this handover. These tasks are complete; that approval does not authorise unrelated work. Agree the next task under `AGENTS.md` rather than repeating layout work or starting snagging automatically.

For findings, the user selected **one card per overlap** with coloured backgrounds and automatic wrapping, explicitly rejecting fixed desktop/tablet/mobile card counts. They initially approved separate red/yellow groups, then rejected the empty space these created for one of each. They selected the proposed **single continuous grid ordered by severity** and separately confirmed its implementation, small/larger-set verification and this handover update. Do not restore the separate severity rows/headings, a table, procurement-pair grouping or fixed card-count breakpoints without discussion.

For the adjustment review, the user separately confirmed inspecting the comparison code, adding a Movement summary alongside Before/Proposed, verifying its calculations and updating this handover. The implemented column includes equal earlier/later moves, separately described start/finish changes and unchanged dates. Calendar-day precision and explicit gap-added/removed labels prevent misleading summaries for actual anchors and gaps. No scheduling rules or persistence were changed.

The user then reported that Cancel/X seemed unresponsive because the discard question appeared in the scrolled side panel. They separately confirmed replacing it with a foreground modal shared by both controls, preserving position/state on Keep editing, Escape and focus return, testing from the scrolled review table and updating this handover. Do not restore an inline confirmation or reset the review to editing when dismissing the modal.

## Working agreement

The user separately confirmed adding the comparison Movement column, auditing and aligning all existing findings sections, verifying the affected journeys and updating this handover. That scope is complete; unrelated features still require agreement.

- Follow `AGENTS.md`: explain specific changes, explicitly ask permission and wait for affirmative confirmation before changing files, dependencies, configuration or project state. A request to implement, or approval of a plan, is not itself the required execution confirmation.
- Approval covers the discussed scope. Continue within it without repeated permission requests; obtain confirmation for additional scope.
- Present plans in chat. Saving a plan also requires confirmation.
- Browser actions checking agreed changes were previously authorised. Do not add conversational approval for ordinary verification. Environment-enforced tool escalation is separate; explain its source if necessary.
- Assess existing libraries and native browser capabilities before custom implementation; obtain approval before adding dependencies. The selected layout can use the existing CSS, DOM, React and native dialogs.
- Do not modify `AGENTS.md` without separate permission. No delegation is currently requested.
- Use plain English. Users choose a **name**, not an “approach name”. Avoid scenario/version jargon, invented governance and long dashes in UI prose.
- Preserve the existing visual language and the selected horizontal context bar. The earlier Option 3 side panel and the new page-background-colour alternative are superseded/unselected. Production React planning is documented in `BUILD_PLAN.md`; implementation and general redesign require separate approval.
- Use isolated browser profiles for checks. Never reset the user's actual browser data to simplify testing.
- User instruction: do not add features solely to handle the prototype development process. The earlier schema reset was deliberate; no migration/repair/proposal-selection journey is wanted.
- On Windows, read source with `-Encoding UTF8` to preserve punctuation. Prefer `rg` for searches. Keep file operations in one shell and avoid destructive cleanup without checking exact paths.

## Purpose, scope and product decisions

Help users build, review and continually revise multiple procurement schedules together. They explore alternatives to manage clashes and overlaps, compare saved plans, then replace the live baseline when ready. This cycle repeats as procurement approaches and experience develop.

The initial audience is a civil service department. Language should remain suitable for other procurement organisations, and the app must not assume how their governance works.

### Settled pipeline model

- **Current baseline = live pipeline.** It is the fixed plan people reference for day-to-day activity. There is no separate editable “live” designation.
- **Saved pipelines** are named alternatives. Multiple can exist and be reopened, edited and re-saved repeatedly until made into a baseline.
- **Working pipeline** means whichever pipeline is currently open for editing. It is not a separate document type or permanent primary plan.
- A current or previous baseline cannot be overwritten. **Edit this pipeline?** explains that changes will be saved under a new name. Internally this creates an editing context; keep the user-facing language simple.
- **Save** on an existing editable pipeline asks for confirmation that it will overwrite the previous saved contents, and reminds users that **Save as…** creates a separate copy under another name.
- A name and reason for saving are required. Saving records fictional editor Alex Morgan and the timestamp automatically.
- **Confirm as new baseline** replaces the live baseline when the user is ready. Rationale is optional; who and when are recorded automatically. No proposal status, approval stage, approver fields or governance assumptions.
- Confirmed baselines are fixed; previous baselines and all other saved pipelines remain available. Further changes start with Edit this pipeline and a new name.
- The user sees one concept, “saved pipeline”, rather than separate scenarios and saved versions. Internal version/revision names need not appear in the UI.
- Unsaved changes mean the open context differs from its named saved contents. Applying procurement edits updates the browser's working data; it does not overwrite that named record until Pipeline Save is confirmed.

### Longer-term requirements and deliberate exclusions

Longer-term requirements include webpage access with accounts, shared storage, editor/view-download roles, a single editor at a time, roughly 15–20 procurements over several years, reusable Library phases/templates, accessible tables, CSV export for Excel and records of changes.

These are not all implemented: authentication, server storage, editing locks, deployment and CSV export remain future work. England bank-holiday highlighting also needs verification/implementation; Christmas scheduling does not establish that it exists.

Keep these MVP decisions:

- Bulk import and Excel pasting of explicit schedules were removed. Do not restore without discussion.
- Automatic/suggested clash resolution was deferred; users decide changes.
- All phase durations, including mobilisation, use whole weeks, superseding calendar-month proposals.
- The anchor is always a milestone, superseding phase-start/end choices.
- Dragging was subsequently approved and implemented using dnd-kit.

## Scheduling decisions to preserve

1. **Whole weeks:** phase durations, intentional overlaps and adjustments use whole weeks; milestones have zero duration.
2. **Weekly plotting:** phases use Monday planning boundaries. Retain the actual anchor date and plot its milestone on Monday of that same week.
3. **One anchor per procurement:** a named milestone at a selected place in the schedule. It can coincide with another phase's start; surrounding phases calculate backwards and forwards.
4. **Actual versus planning date:** an actual anchor change within the same week must remain reviewable/saveable even if plotted dates do not move.
5. **Sequential by default:** adjacent phases follow one another unless users specify overlap or a gap; overlap amount is explicit.
6. **Christmas pause:** all phases, including mobilisation, pause for the two Monday–Sunday weeks containing Christmas Day and New Year's Day. These weeks do not count towards activity duration.
7. **Recalculate duration:** phases moving clear of Christmas lose the extension. Never permanently add two weeks to stored activity duration.
8. **Overlap checks:** paused portions alone do not create clashes. Intentional overlap uses active weeks excluding the pause.
9. **Other holidays:** England bank holidays should be visually apparent without extending durations; this is distinct from Christmas exclusion.
10. **Adjustment gaps:** moving earlier activity may create inactive time before anchored/costed mobilisation. Show a separate adjustment gap, not a longer paid phase. Gaps use calendar weeks; phases use active weeks.
11. **Clash severity:** warning means undesirable but manageable; critical means defined as unacceptable. Remaining critical clashes in adjustment confirmation require a recorded explanation.
12. **Anchor protection:** anchors are locked in adjustment mode until deliberately unlocked.

Internal dates are UTC date-only millisecond timestamps. Phase `s`/`e` are start/exclusive end; normal phase ends are Monday boundaries internally. `finishDate()` displays the preceding Friday. Avoid local-time/DST shifts.

The reference service-transfer template contains market engagement, launch/EOI, dialogue, final-documents milestone, bid writing, submission milestone, evaluation, moderation, governance, contract award, off-site mobilisation, service-transfer anchor and on-site mobilisation. Evaluation/moderation overlap by two active weeks; seed mobilisation durations are 26 and 78 weeks.

The internal per-procurement `approvedBaseline` field remains a reference schedule used by existing scheduling comparisons. Its legacy name does not imply an approval workflow in the UI. Loading an older pipeline uses the current baseline as this reference; do not roll it back to embedded historical metadata. An unconstrained ideal schedule is not a newly agreed additional baseline concept.

## Current connected user journeys

### Pipeline and navigation

- Main entry: `mockups/pipeline.html`. Displays the timeline, overlap findings and procurement list.
- Findings use one continuous, labelled list/grid, sorted with critical cards before warning cards. Cards retain their coloured backgrounds and explicit severity labels, without separate severity group headings. The final critical card and first warning can share a row. `auto-fill` preserves card sizes rather than stretching sparse results across the whole page; the 22rem minimum falls back to available width on narrow screens. No device-specific column counts are set.
- Each finding is listed once, using the existing clash results and ordering. Both procurement names are links: saved details in read-only mode, Edit Procurement while editing. Different phase names are also mapped explicitly beneath each procurement. Christmas-separated overlap spans retain their separate dates and active-week total. The filters retain their pressed states, counts, keyboard focus, live announcement and meaningful empty-result text.
- First entry normally displays the fixed current baseline. Retained unsaved work takes precedence rather than being discarded.
- Navigation within the editing session preserves the chosen pipeline. `pipeline.html?view=resume` explicitly resumes it; `pipeline.html?view=live` invokes the protected return-to-live journey.
- `pipeline.js` uses the sessionStorage marker `ltpp-pipeline-session=open` plus URL parameters to distinguish initial entry from resumption. Do not turn every return from Add/Edit/Library into an unconditional baseline reload.
- Returning to live or opening another pipeline with pending changes offers save, discard or cancel. Save-and-switch commits atomically.
- The page uses the selected horizontal context bar below the heading and above the full-width schedule, with explicit live/read-only/editing labels and real names, save state, actions and checks. Main-page confirmation/saving/source-baseline metadata and scope have been removed at the user's request; do not restore them. Saved details remain in Saved Pipelines. Add, Adjust and Save are hidden while a fixed baseline is open.
- Procurement links in baseline mode lead to saved details; in editing mode they lead to Edit Procurement. Direct Add/Edit access is protected while the baseline is open.
- **Adjust pipeline** and **Add procurement** are adjacent in the editing timeline toolbar, both solid purple `#6b4f86` with darker `#584070` hover and white text. Adjust retains its decorative sliders icon, behaviour and accessible label.
- Sticky positioning is constrained to the timeline card. The card allows visible overflow, while the timeline's inner scrolling element handles horizontal/vertical scrolling.
- Modal save and baseline confirmation entry points already work. Preserve Confirm as new baseline when arranging the new panel; the visual preview does not depict every connected control.

### Saved Pipelines, loading and comparisons

The visible page/navigation name is **Saved Pipelines**. Its existing filename is still `mockups/versions-and-baselines.html`.

- The overview identifies the live baseline and lists named records with status, saved details and consistent **View**, **Edit**, **Compare** actions for every row. The user rejected Open as ambiguous; do not reintroduce it as an action label.
- **Edit** on an editable saved pipeline loads it into the editing context, preserving the Library, unrelated records and baseline history. Added/removed procurements are replaced correctly; this is not an adjustment-only update.
- **View** opens recorded contents read-only at `versions-and-baselines.html#view=<id>` without replacing the current editing context.
- Current/previous baselines offer **Edit** in the list and **Edit this pipeline** in their viewer, both using the protected journey with the new-name explanation.
- The saved viewer uses the grey horizontal bar. Its saved/confirmed actor/time, rationale, saving reason, procurement count and schedule extent remain available in Saved details below the timeline; history and phase schedules are retained.
- Saved contents include schedules, colours and overlap rules. Historical viewing/comparison uses these recorded values.
- Editing retains saved dates/durations but uses current Library colours and overlap rules. Plain explanation: “Your saved dates and phase lengths will stay the same. Colours and checks for overlapping work will use the latest Library settings, so you may see different warnings or clashes.”
- General comparisons use **Pipeline** and **Compare with**, preserving the user's chosen order. Names label both sides. Different choices are required.
- General difference labels are neutral: **Only in [pipeline name]**, different dates/duration/anchor/severity/explanation, etc. Do not infer that absent items were removed or findings resolved merely because a snapshot is older. Do not restore older-to-newer restrictions or Compare from/to wording.
- Baseline confirmation is deliberately directional: **Current baseline → New baseline**, where Added/Removed/Changed/New/Resolved describe the proposed replacement.
- Viewer and comparison timelines reuse `ReadOnlyPipelineTimeline`. Saved tables support keyboard horizontal scrolling; long names wrap without page-width overflow.

### Save, Save as and baseline confirmation

- Shared native Save dialog supports first naming, overwrite confirmation, Save as, switching pipelines, baseline editing, resolving changes before review, and returning live.
- First save after editing a baseline requires a new name. Existing alternatives keep their name on Save; Save as requires a distinct available name.
- Name: up to 120 characters. Required save reason: up to 2,000. Keep form inputs on failed writes; focus the error so it is discoverable.
- Choose **Confirm as new baseline** on the relevant pipeline, resolve pending changes, review against the current baseline, optionally enter rationale, then explicitly confirm.
- Baseline rationale is optional even if critical findings exist. This is separate from the required reason for saving or proceeding with critical adjustment clashes.
- Confirmation records actor/time, marks the previous baseline as previous, fixes the selected record and retains other alternatives. If that selected record is currently open, it becomes read-only live.
- Confirming a different saved record does not overwrite another open working schedule. The result provides View live pipeline.
- The review is a modal over the relevant visible pipeline; preserve close/Escape behaviour, focus, viewing context, failure recovery and pinned-tooltip cleanup.
- Do not reintroduce a proposal stage, generic baseline wizard, approval fields or an automatic default proposal.

### Add and Edit Procurement

- Add starts without a preloaded template. Build from Library phases, optional templates and milestones, then select an anchor and preview.
- Phase selection is Library-first: search/browse before creating. Add phase/milestone controls repeat beneath rows.
- Scrollable previews support six-month/one-year windows.
- Edit supports numeric durations, overlaps/gaps and moving a selected range. Retain relationship explanations alongside numeric controls.
- Applying a range move refreshes the preview; a refreshed Edit preview begins at that procurement's start.
- Date review shows the complete schedule, emphasises changed rows and explicitly states when nothing changed. Gaps have distinct treatment.
- Save changes leads to a concise confirmation summary. The old separate Confirm review prerequisite was removed; disabled controls explain outstanding requirements.
- Add uses **Add Procurement to Pipeline** and a confirmation modal. Clash-guidance wording is still SG-001.
- Applying procurement edits updates the working context; Pipeline Save persists the named pipeline.

### Library and templates

- Side-by-side Phases and Procurement templates overview cards select their respective section on the same page.
- User-facing terminology is **Phases**, even though internal data uses `types`.
- Shared overlap rules directly link Library phases, across different procurements, including two occurrences of the same phase. A rule appears under both linked phases without duplicate maintenance.
- Rules may contain explanations; summaries show compact triggers without duplicating that text.
- Rule changes update editing checks without moving dates. Live baseline viewing retains its recorded rules and colours.
- Colour changes propagate to linked templates and editing procurements without the template-update modal; historical saved records retain their colours/rules.
- Library name/duration changes may offer updates to templates. Inherited defaults are eligible; explicit overrides remain. Disabled choices explain why and direct users to edit the template.
- Templates store ordered activities, durations, relationships and anchor milestone selection without procurement-specific dates.
- Template notes distinguish copied defaults from explicit overrides. Reordering uses drag handles and requires relationship review where needed.
- Impact preview before Library-driven procurement timing changes remains SG-002; do not imply that it is complete.

### Adjustment mode and visual conventions

- dnd-kit is selected; React Calendar Timeline remains an earlier, unselected trial.
- Adjustment opens over Pipeline with faded/inert background. Draft changes can be undone/cancelled.
- When unsaved adjustments exist, Cancel adjustment and X open a native foreground alert dialog with Keep editing and Discard adjustments. It is rendered as a sibling of the workspace overlay, outside its scrolling panes and manual keyboard trap. Native modality blocks background focus. Keep editing is initially focused, and Escape has the same safe behaviour. Keeping returns focus to the initiating control without changing the review/editing stage, draft, explanation or scroll positions; discarding closes the workspace and restores Adjust focus without writing the draft. Clean sessions close without prompting.
- Select a procurement, phase or range; drag the move handle with whole-week snapping or use numeric controls.
- Single-phase **Move** and **Duration** are tabs. Duration can retain start or finish and create usable gaps.
- Anchors lock by default; preserve the approved compact anchor notice and deliberate unlocking.
- Every change refreshes dates, Christmas pauses, gaps and affected overlaps across procurements.
- Review and save brings controls/change table into view; links switch between the table and pipeline visual. Gap comparisons explicitly use calendar weeks.
- The Date and duration changes table has Procurement/activity, Before, Proposed and Movement columns. Equal calendar shifts combine into a single earlier/later summary; different start/finish shifts use two labelled lines. Zero date movement says Unchanged even if an active duration differs. Remaining days are shown for actual anchors, rather than rounded to whole weeks. Added/removed gaps are labelled explicitly. Calendar movement is separate from the active-week durations retained beneath phase dates.
- The table uses a 760px minimum width inside a labelled, keyboard-focusable horizontal scroller. Proposed remains the highlighted third column; adding Movement must not transfer that highlight to the last column. Gap styling remains distinct.
- Final application is atomic. Remaining critical clashes require an explanation. This updates working data, not a named saved pipeline or baseline by itself.
- Reuse shared floating/pinned tooltips, with bold procurement names followed by a colon. Multiple pins and close controls stay within existing card width.
- Do not restore persistent last-hover detail panels.
- Mention Christmas only for phases crossing it. Mention intentional overlap even over a non-overlapping portion of that phase.
- Intentional overlap uses a diagonal colour split within one procurement row. Cross-procurement warnings use amber dashed outlines; critical clashes use solid red. Keep phase labels legible and continuous phases visually continuous.
- Other procurements in Edit comparisons may show complete schedules with unrelated phases diminished.

### How it works: current user-approved wording and styling

The expanded eight-step guide was replaced at the user's request. The current page has four points:

1. **Build a procurement’s plan** — retain original schedule/phase and Library/template explanations.
2. **Plan around a fixed date** — retain original anchor explanation.
3. **Identify problematic overlaps** — retain original overlap/rule, Warning and Critical clash explanations.
4. **The User Journey** — same heading formatting as other points, with a pale blue `#e8effb` background and padding around the whole fourth section. Its previously larger blue heading was rejected.

Point 4's approved text is:

> The current **baseline** is the 'live' pipeline used for day-to-day planning. To explore changes, choose **Edit this pipeline** and save your work under a new name. You can keep several alternatives, edit them as often as needed and compare their schedules and overlaps. When ready, confirm your chosen pipeline as the **new baseline**. It becomes the live plan, and the process can begin again.

The sidebar retains **How dates are planned**. Only the former Weekly planning heading changed to **Weeks commence on Mondays**; its body remains the original explanation beginning “Durations use whole weeks.” The original Christmas pause text and six-weeks/eight-weeks example remain. Do not shorten the weekly body to the heading or reinstate the eight-step guide.

## Selected horizontal context bar: implemented 6 November 2026

### Final design reference

The current reference is **Option 1: Horizontal context bar** in `mockups/pipeline-layout-alternatives.html#layout=bar&state=live`; also inspect `state=viewing` and `state=editing`. Its context belongs below the page heading, within the page content, not above the application navigation. This selection supersedes Option 3 in the older `pipeline-page-options.html`. The newer preview's Option 2 (page background colour) was not selected.

| State | Bar and contents | Actions |
| --- | --- | --- |
| Live baseline | Pale blue `#eaf1fd`, blue `#315ed4` top border; baseline name, explicit live/read-only state, explanation and checks. No metadata block. This is the homepage. | Edit this pipeline; Saved Pipelines. |
| Viewing a saved pipeline | Neutral grey `#eef1f4`, grey `#64748b` top border; viewing/read-only label, actual name, record status and checks. Metadata is in Saved details below the timeline. | Edit this pipeline; Return to live pipeline; comparison and baseline confirmation where applicable. |
| Editing | Pale purple `#f2edf8`, purple `#6b4f86` top border; editing label, name, unsaved/saved status, explanation and checks. Baseline-derived edits explain the required new name. No metadata block. | Existing Save menu retains Save, Save as and Confirm as new baseline; Saved Pipelines; protected Return to live pipeline. |

Use the same full-width horizontal bar above the schedule in all states. Name/status/explanation sit on the left and actions on the right; checks run along the lower row. Below 760px, content and actions stack within that bar. The page background remains neutral. Colour reinforces explicit labels; do not rely on colour alone. Previous baselines stay fixed and must never appear as the current live plan.

**Add procurement and Adjust pipeline belong together in the editing timeline toolbar, not in the context bar. Both use solid purple `#6b4f86` with white text and darker purple `#584070` hover.** Their compact 12px labels/14px horizontal padding keep them beside each other at 390px; narrower screens can wrap the group. Retain the existing adjustment icon/accessible label. Neither action can mutate a read-only baseline/view.

The preview's timeline, dates, names, counts and metadata are illustrative. Its state radios, option buttons, simplified dialogs and adjustment simulation are review controls, not product features. Do not copy its hard-coded fixtures or simplified persistence into the connected application.

### Completed implementation

1. `mockups/pipeline-context.css` is shared by the main page and saved viewer. It now uses a single full-width column with a 22px gap between context and schedule. The coloured bar uses a flex summary/actions row and a lower checks row, stacking internally at 760px and below. The former 260px/220px side columns are removed.
2. Main-page hooks remain intact inside the horizontal bar. Name, role, save status and overlap counts come from connected records/context. A clean saved alternative remains purple and editable. Removed metadata and its former rendering hooks were not restored.
3. Existing Save/Save as/baseline menu and protected Edit/Return-to-live controls are retained in the bar. Add and Adjust are grouped in the sticky editing toolbar and hidden for read-only baselines. No schema, scheduling or persistence changes were needed.
4. The saved viewer uses the grey horizontal bar without replacing the active editing context. Saved/confirmed details were already present in its Saved details card; scope (count and schedule extent) now joins them there. Comparison, baseline confirmation, saved reasons, history, phase schedules and recorded overlap rules remain available. The overlap-rules shortcut opens/focuses the existing disclosure without changing the hash route.
5. Context styles are scoped to avoid changing nested native Save dialogs. Both baseline-review entry points explicitly close pinned background timeline tooltips before opening review. Browser journeys and builds were verified as recorded below.

### Integration points and cautions

- `pipeline.html`/`pipeline.js` own the main layout and timeline; `pipeline-save-version.tsx` updates name/status, button visibility and dialogs. `pipeline-connected.tsx` bridges adjustment mode.
- Read-only saved viewing currently lives in `pipeline-versions.tsx` at `versions-and-baselines.html#view=<id>`, not a third mode of the active editing context. Reuse that viewer/shared layout without overwriting pending work merely to display a snapshot. The preview's viewing radio is not a production state API.
- Distinguish `source.isLive`, `source.readOnly`, saved-record status and `source.context.originBaseline`. A named editable alternative with no changes is still editing, not automatically read-only viewing.
- Home/Return to live must use the existing guarded live journey; Add/Edit returns must resume the selected context. Do not silently replace pending edits.
- Preserve DOM hooks or update all their consumers coherently: `pipeline-name`, `pipeline-save-state`, `pipeline-intro`, `pipeline-view-live`, `pipeline-edit-baseline`, Save/menu IDs, `adjust-pipeline`, `pipeline-version-root` and `pipeline-adjustment-root`.
- Account for the saved viewer's history, phase tables and Confirm as new baseline action as well as its timeline. This task must not drop existing functionality to match an abbreviated preview.
- Keep sticky toolbar bounds, scrollable tables/timelines, tooltip clipping/cleanup, accessible labels, native dialog focus and HMR cleanup working.
- No new dependency, schema reset, deployment, broad Library redesign or scheduling-rule change is needed for this layout.

## Files and architecture

| File/group | Role |
| --- | --- |
| `mockups/pipeline.html` | Connected main page, horizontal context bar, Save popover, grouped purple editing actions and automatically wrapping red/yellow findings cards. Findings card styling is local to this page. |
| `mockups/pipeline-context.css` | Shared responsive horizontal context-bar/schedule layout and state colours for the main page and saved viewer. Existing class names such as `pipeline-context-panel` are retained as code hooks. |
| `mockups/pipeline.js` | Main initial-entry/resume logic, continuous severity-ordered findings-card rendering/filtering, timeline geometry/view controls. Clash calculation is unchanged. |
| `mockups/demo-data.js` | `window.LTPPDemo` data API, seed, atomic persistence and baseline protection. |
| `mockups/add-procurement.html` / `edit-procurement.html` | Connected procurement journeys with inline JS/CSS. |
| `mockups/templates-and-phase-library.html` | Connected Library/templates. |
| `mockups/how-it-works.html` | Current four-point guide and date sidebar described above. |
| `mockups/demo-navigation.css` | Shared navigation. |
| `mockups/timeline-tooltips.js` / `.css` | Shared tooltips: `bind`, `hide`, `closeWithin`. |
| `src/prototypes/pipeline-connected.tsx` / `pipeline-connected-types.ts` | Adjustment bridge and shared API/source types. |
| `src/prototypes/pipeline-adjustment.tsx` / `.css` | React adjustment UI, trials and exported `ReadOnlyPipelineTimeline`. |
| `src/domain/calendar.ts`, `scheduling.ts`, `comparison.ts` | Strict shared calendar, schedule/clash and comparison/grouping engine; target assessment requires current rules. |
| `src/prototypes/pipeline-scheduling.ts` | Compatibility exports and prototype-only sample-rule default. |
| `src/prototypes/pipeline-versions.ts`, `pipeline-comparison-model.ts` | Shared-comparison adapters, legacy record types and prototype-only saved-rule attribution. |
| `src/prototypes/pipeline-fixtures.ts`, `pipeline-version-fixtures.ts` | Fictional rules/plans/example records, separate from the application engine. |
| `src/prototypes/pipeline-versions.tsx` / `.css` | Saved Pipelines overview, read-only viewer/history, neutral comparison; exports shared `Comparison`. |
| `src/prototypes/pipeline-open.tsx` | Open/Edit buttons and resolution of pending work before switching; optional label lets the saved viewer say Edit this pipeline. |
| `src/prototypes/pipeline-save-version.tsx` | Main context presentation, Save popover, edit-baseline/live-return/baseline entry points. |
| `src/prototypes/pipeline-save-version-dialog.tsx` / `pipeline-save-version.css` | Native Save/overwrite/Save as/switch/edit-baseline/resolve/live-return dialog. |
| `src/prototypes/pipeline-baseline-journey.tsx` / `.css` | Resolve pending work, directional review, optional rationale, confirmation and result. |
| `mockups/versions-and-baselines.html` | HTML entry, visibly named Saved Pipelines; keep existing path. |
| `mockups/pipeline-layout-alternatives.html` | Current visual reference: Option 1 horizontal context bar selected and implemented; Option 2 page background colour unselected. Standalone and disconnected from saved browser data. |
| `mockups/pipeline-page-options.html` | Earlier three-option exploration. Its Option 3 side-panel design is superseded by the newer horizontal bar. Standalone and disconnected from saved browser data. |
| `mockups/pipeline-adjustment.html` | Earlier isolated library trial, not main demo. |
| `mockups/design-options.html` / `anchor-options.html` / `phase-overlap.html` | Supporting explorations, not main product journeys. |
| `src/App.tsx`, `src/app/` | React entry, route-loaded planning screens, shared layout, current workspace/Library context and errors. |
| `src/data/` | Versioned workspace/Library/project/pipeline schemas and transactional local operations with stale-write checks. |
| `src/features/workspaces/` | Local workspace creation/selection. |
| `src/features/library/` | Phase/rule creation and the phase dialog shared with Add/Edit. |
| `src/features/projects/project-editor.tsx` | Shared Add/Edit form, relationship review, protected anchors and schedule/clash preview. |
| `src/features/pipeline/`, `src/features/saved-pipelines/` | Working pipeline, explicit saving, saved View/Edit and metadata. |
| `src/ui/` | Native foreground dialogs, leave protection, shared findings and timeline/segment rendering. |
| `playwright.config.ts`, `tests/` | Isolated local-foundation browser verification and separate test-server cache. |
| `SNAGGING.md` | Three still-open smaller tasks; unchanged by this handover. |

The reference prototype intentionally mixes HTML/vanilla JS and React. The new application is tracked in BUILD_PLAN.md; packages 1A/1B/2A have been separately authorised/implemented. The old `pipeline-baseline-dialog.tsx` is removed; do not restore obsolete proposal/approval or nested-dialog flows.

### Storage, records and APIs

- localStorage key: `ltpp-connected-mockups-v1`. Current data schema: **3**. Same host/port is needed to see the same data.
- The previously authorised reset replaces schema 1/2 data with seed schema 3 when read. Do not reset existing schema 3 data for layout work or introduce a migration UI.
- Stored seed records: `v01` Initial pipeline (previous baseline), `v02` Autumn pipeline (current/live), `v03` Later service transfer (editable), `v04` Earlier service transfer (editable). These are actual stored records usable by the journeys.
- Separate `EXAMPLE_VERSIONS` in `pipeline-versions.ts` remain pure fixtures. The Saved Pipelines UI loads persisted records and reports load errors rather than fabricating fallback records.
- There is one active open/editing context per browser storage origin, plus many named saved records. This is not multi-user locking.
- `PipelineSource` includes `plans`, `rules`, `record`, `currentBaselineId`, `editor`, `dirty`, `readOnly`, `isLive`, `librarySignature` and `context`. Context includes ID, token, revision, `mode: baseline|editing` and optional `originBaseline` (source ID/name/initial content).
- Baseline mode uses recorded rules/colours. Editing uses current Library rules/colours without changing saved dates/durations.
- Record status is `saved|current|previous`. Confirmation has actor/time, previous-baseline link and optional rationale. Legacy names such as `savedVersions` and `approvedBaseline` are internal.

Important `LTPPDemo` methods:

| Methods | Purpose |
| --- | --- |
| `plans`, `plan`, `library`, `saveLibrary` | Working schedules and Library; baseline viewing is protected. |
| `addPlan`, `updatePlan`, `updatePlans` | Working edits; reject baseline mode and stale context. `updatePlans` is an adjustment commit, not a full-record loader. |
| `pipelineSource` | Current coherent editing/viewing source. |
| `savePipeline(input, expected, mode)` | Save/overwrite or distinct named copy with stale checks; mode is `save` or `saveAs`. |
| `openPipeline(target, expected, resolution?)` | Open an editable saved record, optionally saving/discarding pending changes atomically. |
| `editBaseline(target, expected, resolution?)` | Start baseline-derived editing without modifying the baseline; requires a new name on save. |
| `viewLivePipeline(expected, resolution?)` | Protected switch to fixed current baseline. |
| `preparePipelineEntry(resume?)` | Initial live default or retain current/unsaved work. |
| `savedVersions`, `versionRecords`, `baselineState` | Saved records and workflow; `versionRecords()` returns `{versions, baseline}` in one read. |
| `baselineActionSource(id)`, `confirmBaseline(id, rationale, expected)` | Capture review and confirm the selected saved record with stale validation. |
| `discardPipelineChanges(expected)` | Resolve pending work before review/switching. |
| `guard`, `setDirty`, `canLeave`, `go`, `error` | Navigation, unfinished form protection and feedback. |

Obsolete APIs `versionSource`, `saveVersion`, `proposeBaseline`, `createBaselineProposal` and `approveBaseline` are not the current interface.

Mutations re-read data and check context tokens, revisions, reviewed records, schedules/rules, current-baseline ID and Library signature where relevant. Save-and-switch and baseline confirmation are atomic; failed writes leave records/context unchanged. Preserve form inputs and avoid partial saves. Data-changed events use `ltpp:pipeline-updated`; React mount/listener cleanup for HMR must remain intact.

Browser storage and fictional identity are demonstration mechanisms, not server authentication, durable organisational audit, backup or shared access control. Reset demo clears the local schedules, Library, saved pipelines and history; never use the user's data as a test fixture.

## Opening and checking the project

PowerShell:

```powershell
Set-Location 'C:\Dev\code\react\react-empty-project-template'
npm.cmd run dev
```

Use the exact Local URL printed by Vite, appending `/mockups/pipeline.html`. Usually:

`http://localhost:5173/mockups/pipeline.html`

Use the site's navigation for connected journeys. Do not open connected pages from File Explorer. The standalone design preview can be opened directly or through Vite:

`http://localhost:5173/mockups/pipeline-page-options.html#option=3&state=live`

Existing checks:

```powershell
npm.cmd run build
node --test src/prototypes/pipeline-connected.test.ts src/prototypes/pipeline-versions.test.ts src/prototypes/pipeline-scheduling.test.ts
```

The project uses React 19, TypeScript 6, Vite 8 and pinned dnd-kit 0.5.3 packages. Earlier react-calendar-timeline beta, dayjs and interactjs dependencies remain. Check package.json/lockfile; do not add/remove drag libraries without agreement.

The default build checks the new app/domain, tooling/tests and prototype separately, then bundles the workspace application. To additionally check connected prototype React entries:

```powershell
@'
import { build } from 'vite';
await build({build:{
  outDir:'node_modules/.cache/ltpp-prototype-build',
  emptyOutDir:false,
  rollupOptions:{input:[
    'mockups/versions-and-baselines.html',
    'mockups/pipeline.html'
  ]}
}});
'@ | node --input-type=module
```

Classic-script Vite notices are expected for these mockups. This checks module bundling, not production packaging/deployment. Use browser checks for the actual connected HTML/CSS/JS. New tests should cover meaningful behaviour, not mirror trivial styling.

### Foreground discard modal verification, 7 November 2026

- Default build/typecheck, connected-entry bundling and all **86/86 existing tests passed**. Expected classic-script Vite notices remain.
- In isolated headless Edge, an actual range adjustment was reviewed with the date table and right-hand controls scrolled down and a critical-clash explanation entered. Cancel opened a native modal above the workspace, fully inside the viewport. Both modal buttons were reachable, Keep editing was initially focused, and the background could not take keyboard focus.
- Keep editing retained the exact pane scroll positions, review rows, Movement column and entered explanation, returning focus to Cancel. X opened the same modal; Escape retained review and returned focus to X. Choosing Discard closed adjustment mode, restored main-page interaction/Adjust focus and left the underlying pipeline source unchanged.
- Mobile checks at 390×844 repeated the scrolled-review case, including preserved scroll/explanation after Keep. The modal also fitted a 320×480 viewport. Desktop/mobile screenshots were inspected.
- In editing mode, Enter on the initially focused Keep editing action retained the draft and editing controls. Keyboard Escape opened confirmation from a movement field; Escape on that confirmation returned focus to the field. Cancel and X without changes closed immediately without a modal. Browser checks reported no application runtime exceptions.
- The modal uses `showModal()`/native backdrop and focus handling rather than an inline review stage. Review state is left untouched while it is open; dialog cleanup closes the native top-layer entry on unmount. No scheduling, Movement calculations, persistence, data schema, baseline protection, findings presentation or dependencies were changed.
- Checks used a separate temporary profile; no user data was used as a fixture or reset. The verification browser was closed, and the local dev server remains available. `SNAGGING.md` is unchanged.

### Earlier Movement column verification, 7 November 2026

- All **86/86 tests passed**: the existing 79 plus seven movement-summary tests. They cover equal earlier/later calendar-week shifts, singular units, fixed start/finish edits, differing directions, unchanged dates despite a duration change, actual-anchor day precision across daylight saving, added/removed/moved gaps, and a real Christmas recalculation where the start moves eight weeks earlier and finish ten weeks earlier despite unchanged active duration.
- Default build/typecheck and connected-entry bundling passed. Expected classic-script Vite notices remain.
- Isolated headless Edge checks exercised an actual three-week-earlier range adjustment, showing the summary for phases/milestones and Gap added for its new gap. A fixed-start duration reduction showed Start: unchanged / Finish: 2 weeks earlier. An unlocked whole-procurement move later showed 2 weeks later for the actual-anchor row.
- Existing Before/Proposed dates, active/calendar durations and the Proposed-column highlight were checked. Desktop and mobile screenshots were inspected. At 390px, the table stayed inside the workspace and the labelled scrolling region accepted focus and ArrowRight horizontal scrolling.
- Discarding both duration and later-movement reviews left the working pipeline unchanged. Browser checks reported no application runtime exceptions. Verification used a separate temporary profile; the user's data and baselines were not test fixtures. The temporary browser was closed, and the local dev server remains available.
- No scheduling algorithm, whole-week input rule, Christmas calculation, gap rule, baseline protection, schema, persistence API or dependency was changed. Only movement presentation, review-table layout/accessibility and tests were added.

### Earlier continuous findings grid verification, 7 November 2026

- The initial live baseline's one critical and one warning card share a desktop row at matching widths. There is one labelled findings list and no separate severity group headings. Desktop screenshot inspected.
- All/Critical clashes/Warnings filters retained the correct cards, pressed state and counts without changing pipeline data. Keyboard filtering to zero warnings retained focus and announced zero of ten matching findings; the no-findings state also remained correct.
- An isolated editing fixture produced ten critical and ten warning findings through the real data API. Every red card preceded every yellow card, and the first warning filled the space beside the last critical card in the same row. The full set remained contained and intact at 320, 390, 650, 900, 1100 and 1440px. The original two-card set was also checked at small and larger widths.
- Classic-script syntax and build checks passed. Browser checks reported no application runtime exceptions. Underlying clash calculations, data, links and card contents were unchanged. The prior card implementation's 79-test result is recorded below; the small grouping refinement did not require another scheduling regression run.
- Fixtures used a separate temporary browser profile, without changing the user's data. The verification browser was closed and the existing local dev server remains available for review. `SNAGGING.md` remains unchanged; SG-003 awaits review of this latest presentation.

### Earlier separate findings groups verification, 7 November 2026

- Default build/typecheck and connected-entry bundling passed; expected classic-script Vite notices remain. Classic `pipeline.js` syntax check passed. All **79/79 existing regression tests passed**.
- Isolated headless Edge checks verified the initial live baseline's real critical/warning cards, colour treatments, count headings, phase names, two procurement links and active duration. Read-only links and accessible labels lead to saved details; editing links and labels lead to Edit Procurement.
- Keyboard activation of the Critical clashes filter retained focus, updated `aria-pressed`, and announced the filtered count through the existing live status. Warning and All filters showed the correct groups without changing pipeline data.
- A separate test editing context with added fictional procurements produced ten critical and ten warning findings through the real data API. Cards filled horizontal rows and wrapped to further rows; all warning rows followed all critical rows. Widths 320, 390, 650, 900, 1100 and 1440px stayed within the page. Changing only the containing section width, without a viewport resize, also reflowed the grid.
- Desktop/mobile screenshots were inspected. Two Christmas-separated date spans and the combined six-active-week duration remained visible. Temporary cross-phase rules verified that both phase names and their procurement mapping were explicit. Long procurement and phase names wrapped without card overflow at 320, 390, 768 and 1440px.
- Empty-state checks covered no findings at all, filtering to zero warnings while critical findings remained, then restoring a matching filter. Procurement links remained keyboard focusable with a visible focus outline. Browser checks reported no application runtime exceptions.
- All fixture records/rules were confined to a separate temporary browser profile. The user's browser storage and fixed baselines were not changed as test data. No clash calculations, scheduling, schema, persistence APIs, dependencies, adjustment/review layouts or saved-view layouts were changed. The local dev server was restarted for verification and left available for user review. The temporary verification browser was closed.

### Earlier horizontal context bar verification, 6 November 2026

- All **79/79 regression tests passed**, along with the default build/typecheck and connected-entry bundling. Expected classic-script Vite notices remain.
- Isolated headless Edge checks confirmed the blue live bar is below the heading and above a timeline with matching full width. Purple editing and grey saved-view bars were checked at 320, 390, 768, 1024 and 1440px without page-width overflow. A 120-character unbroken name remained contained at those widths.
- Main-page metadata stayed absent. Saved-view metadata remained available in Saved details: saved/confirmed actor/time, saving reason and the relocated scope. Previous-baseline status, history and phase schedules remained available. Viewing a saved record did not replace the active editing context.
- Baseline-derived editing and first save under a new name worked. Overwrite confirmation and native Save-dialog styling were checked. Keyboard-opening the Save popover at 390px kept it inside the viewport; Escape restored launcher focus. The two purple editing actions sat beside each other at that width.
- Adjustment mode retained its inert background and returned focus to Adjust. The sticky toolbar stayed bounded to the timeline. Return-to-live cancellation preserved pending edits; save-and-return persisted an actual-anchor-only edit and restored the fixed blue live state.
- Saved-view baseline review cleared pinned tooltips, and Escape restored focus to its horizontal-bar action. Confirmation with blank optional rationale promoted the chosen saved record; its viewer stayed grey. Return to live showed the replacement as fixed blue, while the former baseline retained its previous status and saved details. Saved-timeline keyboard horizontal scrolling still worked.
- Browser checks reported no application runtime exceptions. Tests used a separate temporary profile; the user's actual browser storage was not reset or modified as a test fixture. No dependencies, schema, scheduling, storage APIs or deployment were changed. The existing user-facing local dev server remains available; the temporary verification browser was closed.

### Earlier Option 3 completion verification, 6 November 2026

- All **79/79 existing regression tests passed**. Default build/typecheck and connected-entry bundling passed; the expected classic-script Vite notices remain.
- Isolated headless Edge checks exercised live blue, saved-view grey and editing purple states; actual record metadata/counts; baseline-derived first naming; clean alternatives remaining editable; overwrite Save; separate Save as; and protected return-to-live cancel, discard and save-and-return.
- Connected Edit Procurement changes returned to the same named context without overwriting its saved record. Connected Add Procurement via the grouped toolbar action returned to that context and updated scope from three to four procurements, leaving its saved record unchanged until Pipeline Save. Direct Add access while viewing a fixed baseline remained protected.
- Viewing a saved record preserved both clean and pending editing contexts. Editing another baseline while work was pending offered the existing save/discard/cancel choices; cancelling preserved the pending context. Viewer Return to live invoked the guarded journey.
- Baseline confirmation from the main menu completed with optional rationale left blank. The open pipeline became fixed blue live, and the former baseline remained available and explicitly labelled previous in the grey viewer. Saved-view baseline review, Escape/cancel and focus restoration were also checked.
- Desktop screenshots and 390px mobile screenshots were inspected. Live and saved-view layouts were checked at 320, 390, 768, 1024 and 1440px; editing at desktop/mobile. A 120-character unbroken name was checked as an isolated layout fixture. Horizontal overflow stayed in schedule/table scrollers rather than widening the page.
- Keyboard checks covered the mobile Save popover, Escape and focus restoration, and horizontal scrolling in both timeline implementations. Adjustment mode still opened with an inert background and returned focus to its grouped toolbar button. Sticky toolbar checks confirmed it sticks inside, and leaves with, the timeline card.
- Pinning and cleanup were checked in both main and saved-view baseline-review entry points. The saved viewer's overlap-rules shortcut retained its route and focused the expanded disclosure. Browser checks reported no application runtime exceptions.
- Tests used a separate temporary browser profile and fictional records. The user's browser storage was not reset or used as a fixture. No dependency, schema, scheduling, authentication, hosting or deployment changes were made. Broad accessibility, multi-user, production and 20-procurement validation remain outside this task.

### Earlier recorded verification and limits

These are prior recorded results, not fresh tests run to write this handover:

- Packages 1–4's connected saved-pipeline/baseline work completed with **79/79 tests passing**, successful default build and connected-entry bundling.
- Browser checks covered first-entry live default, retained unsaved work, saved loading/editing, baseline-derived first Save as, safe return live, save-and-switch, baseline confirmation and repeated editing cycles.
- Failure/stale-state checks retained drafts and reasons, focused errors, rejected outdated actions and prevented partial/orphan saves.
- General comparisons were checked in both orders for neutral schedule/finding/rule labels, distinct dropdown choices and preservation of records.
- Fixed baseline schedules/rules/colours, current-Library editing, direct Add/Edit protection, long names, keyboard scrolling, tooltip cleanup and mobile layouts were checked.
- Prior sticky-toolbar checks included scrolling, leaving the timeline section and an isolated 20-row layout fixture; this did not establish 20 real saved procurements.
- Subsequent How it works edits received content/CSS checks; the current four-point wording supersedes the earlier eight-step guide.
- The standalone three-option preview was browser-checked in all nine option/state combinations at desktop and 390px widths, including keyboard state selection, dialogs, focus and simulated saves.
- Option 3 refinements were checked for shared panels, mobile stacking, three distinct state colours and Add beside Adjust only while editing. The final purple-toolbar-button CSS change was source-checked after those browser passes; verify it again during connected implementation.
- The connected Option 3 implementation and its fresh checks are recorded above. Production/multi-user validation has not occurred.

Headless Edge/CDP checks used isolated temporary profiles. Debug ports and helper scripts were session-specific, not repository tooling. Re-discover tools instead of depending on previous in-memory helpers. No project dev server was intentionally left by the recorded checks; inspect current state before starting/stopping processes.

No Git repository was available during prior work. Check before assuming history/diff exists. Do not initialise Git, discard changes or reset work without approval.

## Historical prototype-only work after the discard-confirmation fix

This section records earlier prototype work. Its claims about completed baseline/comparison features do not mean those features are delivered in the React application. The current checkpoint above governs React milestone status; general Compare remains Milestone 3.

`SNAGGING.md` remains the authoritative smaller-task list and has not been edited here:

- **SG-001:** agree and replace Add Procurement confirmation's placeholder clash guidance.
- **SG-002:** preview/confirm procurement timing impacts from Library changes before applying them.
- **SG-003:** the user-selected red/yellow cards now use the requested continuous severity-ordered grid, replacing the rejected separate rows. Phase/procurement mapping, overlap dates and active duration remain. Await user review of the latest presentation before treating the snag as closed; `SNAGGING.md` itself has not been changed.

Packages 1–4's saved editing, baseline confirmation, Saved Pipelines and comparison changes are implemented; do not list saved loading as an unresolved design request. Updating this handover does not close snagging, complete every wider MVP check or authorise unrelated changes.

Longer-term work remains hosting, real accounts/roles, server storage, single-editor control, export, bank-holiday highlighting and broader accessibility/scale validation. None is authorised by the completed layout work.

## Prompt for the next context

> Continue in C:\Dev\code\react\react-empty-project-template. HANDOVER.md contains the complete handover. First read AGENTS.md and the First action in the next context section at the top of this file, then the current BUILD_PLAN.md checkpoint and SNAGGING.md. Critically interrogate the pending Milestone 3 implementation package already recorded here; do not start implementation or treat its comparison-modal recommendation as approved. Milestone 2 functionality is complete, and the ordinary findings tagline has subsequently been removed and checked. Preserve independent procurement variants, current workspace rules, the live/saved distinction, latest heading/actions and temporary Adjust-only anchor permission. Report gaps and design choices, refine the specific package and seek separate affirmative implementation approval. Final browser/device, accessibility and large-data acceptance remains in Milestone 4 with workbook export. This update authorised HANDOVER.md changes only. Historical delivery records are not current instructions.

