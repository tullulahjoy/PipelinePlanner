---
name: app-consistency
description: Review related instances of an application function when proposing or implementing a UI or behaviour change in this project, and recommend consistent treatment where it benefits users.
---

# App consistency

Before scoping a change to one screen, inspect the shared component, its callers and comparable user journeys. A request naming Add Procurement, for example, may reveal the same issue in Edit Procurement or Library previews.

Consider which other instances would benefit from the same change and explain the recommendation briefly. Preserve differences that serve a real purpose; consistency does not require every screen to look or behave identically. Keep the review proportionate to the requested change.

Recommend related changes before implementation. Finding another instance does not authorise changing it: follow the project's AGENTS.md confirmation requirements and the user's agreed scope.

For actions that open or refresh a review, bring the relevant section into view in its actual scrolling pane and move keyboard focus to its heading. Account for modal headers and sticky navigation. Failed validation should reveal the error; routine field changes and unrelated renders should not move focus or scroll unexpectedly.

Reuse shared behaviour where it removes demonstrated repetition. Verify representative instances, including Live/Saved contexts and narrow layouts where relevant. Report deliberate exceptions or remaining gaps concisely.
