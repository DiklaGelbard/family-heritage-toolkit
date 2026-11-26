# Coordinated research workers

When parallel agents are authorized and available, separate independent transcript, document, source-search and photo-review tasks. The coordinator owns the brief, research gate and merge/review decisions. Workers write to distinct artifact paths and do not edit shared accepted data. Do not spawn agents solely because this workflow exists; obey the user's and host's authorization rules. With no delegation capability, execute the same task queue sequentially.

Use `node src/cli/index.mjs task DIR OPERATION.json`. Operations:

- register: id, description, dependsOn (already registered IDs), resources (for example browser:personal or file:research/transcript.json), phase (research by default, or planning).
- claim: id, owner. Dependencies must be done; conflicting resources cannot be claimed concurrently.
- complete: id, owner, artifact. Only the current owner can complete; a workspace-local artifact is required.
- release: id, owner, after verifying that worker is stopped. Never release a live browser worker to steal control.
- ask: id, text, optional phase. Only one unanswered question can be queued.
- answer: id, by:user, answer, evidence. Record actual user responses, not inferred consent.

The coordinator presents the queued question via the available UI and continues independent work. Workers should request human input through the coordinator, avoiding simultaneous competing questions. Task state persists in work.json. A claimed task is not evidence that a worker is running; check actual agent status. This is a coordination primitive, not a scheduler, automatic agent launcher or background service.

Unfinished research tasks hold the research gate; completed artifacts are hashed. Verify transcript coverage, identity evidence and schema validity before merging. Inspect worker outputs for contradictions. Resume abandoned tasks only after confirming no writer remains. The CLI serializes state writes, while resource claims coordinate longer tasks between commands.
