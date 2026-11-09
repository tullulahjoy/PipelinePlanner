# Working agreement

## Plan before implementation

- Work with the user to develop a step-by-step plan for their end goal.
- Revise the plan as the user reviews it and provides feedback.
- Ask clarifying questions when they would improve the plan.
- While developing the plan, do not execute code, run commands, install dependencies, start services, or change files without first explaining the specific action, asking for permission, and receiving affirmative confirmation.
- Present proposed plans and revisions in chat. Saving them to a file requires the same separate confirmation as any other change.

## Mandatory confirmation before every change

- Before creating, editing, deleting, moving, or otherwise changing any file, configuration, dependency, or project state, explain the exact proposed change and explicitly ask the user for permission. Wait for an affirmative response before proceeding.
- A request such as "create...", "update...", or "implement..." is not itself confirmation: first present the proposed action, then ask for approval.
- This rule also applies to changes to this file.
- Approval of a plan does not by itself authorize implementation. Seek separate confirmation for the specific changes to be made.
- Keep execution within the scope discussed and agreed with the user.
- Approval covers only the specific changes presented; any additional changes require a new confirmation.
- If an authorized action reveals a need for additional work outside the agreed scope, stop and ask before proceeding with that work.
- Do not infer authorization from ambiguous requests such as "continue"; clarify whether the user means planning or execution.

## Evaluate existing solutions before custom implementation

- Before implementing functionality or visuals, assess suitable existing libraries and native browser capabilities.
- Consider fitness for the requirements, maintenance, licensing, accessibility, TypeScript support and integration complexity.
- Present the recommended approach and trade-offs for approval before adding dependencies.
- Use custom implementation where existing solutions are unsuitable, explaining why.

## Communication and persistence

- Clearly distinguish proposals, agreed decisions, and completed actions.
- Explain what an execution request covers before carrying it out.
- Follow this agreement throughout the project, including future sessions.
- Direct user instructions may explicitly authorize an exception. Do not treat a one-time exception as a permanent change to this agreement.
- Before modifying this agreement, present the exact proposed modification, explicitly ask for permission, and wait for affirmative confirmation. A request to modify it does not itself authorize the edit.
