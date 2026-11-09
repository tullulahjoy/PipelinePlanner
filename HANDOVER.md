# Project handover

Updated 8 November 2026. User timezone: Europe/London.

## Start here

This is a browser-based procurement pipeline planner, currently a connected local prototype with fictional data, HTML/vanilla JS pages and React functionality. It is not yet a hosted, authenticated, multi-user application.

Project root: `C:\Dev\code\react\react-empty-project-template`.

Read this file, `AGENTS.md` and `SNAGGING.md` before continuing. The README is still Vite template documentation. The main demo is `/mockups/pipeline.html` through Vite; `/` still shows Hello world.

**Latest task completed: the refined Option 1 Compare page is implemented with dynamic summaries and nested disclosures.** The user reviewed `mockups/compare-page-options.html`, refined schedule summaries, Christmas explanations, findings grouping and rule language, then explicitly authorised implementing the agreed Compare scope, verification and this handover update. This is a read-only presentation change; no dependencies, saved data, scheduling rules, or baseline-confirmation behaviour were changed. The six-finding/twelve-procurement mockup example was not installed as prototype data or used to cap real results.

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
- Preserve the existing visual language and the selected horizontal context bar. The earlier Option 3 side panel and the new page-background-colour alternative are superseded/unselected. No general redesign or framework migration is approved.
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
| `src/prototypes/pipeline-scheduling.ts` | Pure schedule, movement, duration, gap and clash logic, plus `dateMovementSummary` for adjustment-review calendar movement text. |
| `src/prototypes/pipeline-versions.ts` | Record types, pure comparison functions and test/example fixtures. |
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
| `src/App.tsx` | Hello world at `/`. |
| `SNAGGING.md` | Three still-open smaller tasks; unchanged by this handover. |

The architecture intentionally mixes HTML/vanilla JS and React. A full React migration is not approved. The old `pipeline-baseline-dialog.tsx` is removed; do not restore obsolete proposal/approval or nested-dialog flows.

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

The default build typechecks React but bundles the Hello world entry. To additionally check connected React entries:

```powershell
@'
import { build } from 'vite';
await build({build:{
  outDir:process.env.TEMP+'/ltpp-mockup-build',
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

## Outstanding work after the discard-confirmation fix

`SNAGGING.md` remains the authoritative smaller-task list and has not been edited here:

- **SG-001:** agree and replace Add Procurement confirmation's placeholder clash guidance.
- **SG-002:** preview/confirm procurement timing impacts from Library changes before applying them.
- **SG-003:** the user-selected red/yellow cards now use the requested continuous severity-ordered grid, replacing the rejected separate rows. Phase/procurement mapping, overlap dates and active duration remain. Await user review of the latest presentation before treating the snag as closed; `SNAGGING.md` itself has not been changed.

Packages 1–4's saved editing, baseline confirmation, Saved Pipelines and comparison changes are implemented; do not list saved loading as an unresolved design request. Updating this handover does not close snagging, complete every wider MVP check or authorise unrelated changes.

Longer-term work remains hosting, real accounts/roles, server storage, single-editor control, export, bank-holiday highlighting and broader accessibility/scale validation. None is authorised by the completed layout work.

## Prompt for the next context

> Continue the procurement pipeline project in `C:\Dev\code\react\react-empty-project-template`. Read AGENTS.md, HANDOVER.md and SNAGGING.md. The latest completed fix is the foreground discard modal in Adjust Pipeline. Unsaved Cancel/X use the same native modal; Keep editing/Escape retain the current review/editing stage, draft, explanation and scroll positions and restore initiating focus. Discard closes without applying the draft; clean sessions close directly. Do not restore the hidden inline side-panel question. The Movement column remains, using calendar weeks/days separately from active duration. All 86 tests and desktop/mobile modal checks passed. Do not repeat completed work. Preserve ONE continuous auto-fill findings grid (red critical cards then yellow warnings), the horizontal context bar, omitted main-page metadata, Saved details metadata, View/Edit/Compare actions, saved editing/baseline protections, comparisons, grouped purple Add/Adjust actions, four-point guide, unsaved work and schema 3 data. SG-003 awaits user review; SG-001/SG-002 remain open. Agree the next task and obtain the specific confirmation required by AGENTS.md before changes.
