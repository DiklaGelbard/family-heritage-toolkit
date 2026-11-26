# Continue, ask, or finish

Run `node src/cli/index.mjs assess DIR` at session start, after a milestone or user answer, and before the final response. `status` includes the same assessment. Building HTML is a milestone, not evidence that the user's website is complete.

The research gate runs first. If stage is research, follow research-first.md: inspect sources, resolve access gaps or ask for explicit approval to proceed with listed gaps. Do not ask website-planning questions or write a website plan yet. All planning instructions below apply only after the gate opens.

## Check the brief, not just the files

Keep `discovery.json` up to date from the conversation and source findings. For an older workspace, start with templates/discovery.json and reconcile existing decisions; do not ask users to repeat already explicit answers.

The graph's root person and branch boundaries are **not** the site's narrative center. Explicitly establish whether the site tells the story of an individual, a couple, a family, a place or a community. Confirm the central relationship and themes before writing a definitive opening. Prior task handoffs and branch labels are context, not user confirmation of the story.

After initial source inspection, propose a short editorial brief: central people/place, story arc, supporting evidence, missing material and one or two suitable presentation options. A map may help when supported places and journeys matter; a timeline may suit changes over time; a photo-led story may suit shared family life. Explain which is supported and which remains hypothetical. Never invent routes, encounters or dates to make a visualization work. Ask the owner to confirm or correct the brief.

Use the assessment result:

- `ask_user`: actually present the next focused question. Prefer the available interactive-question tool; otherwise ask directly in the final reply. Continue independent authorized work while waiting. The final reply must contain or clearly repeat the outstanding question, not merely say “questions remain open.” Avoid repeated tool questions while one is still pending; preserve its text in the final reply instead.
- `continue`: execute the next authorized task. Do not end with an offer to do work already requested. Identify more independent tasks from the actual brief if the recorded list is incomplete.
- `blocked`: state the concrete missing access, capability or permission and ask for the next actionable input. Continue independent work if available. Do not label a technical limitation as successful completion.
- `complete`: first inspect the actual outputs against the agreed release scope. Report what was delivered and explicitly deferred. This result means only the recorded local-preview scope is reviewed, not that every possible source has been found.

Honor an explicit user pause. Do not ask endless questions about optional material the owner declined or deferred. A source-discovery answer of “nothing else for now” is valid. A placeholder, agent assumption, unanswered question or elapsed wait is not a user answer.

## State format

`answers` keys: `storyFocus`, `audience`, `additionalSources`, `storyPlan`, `cover`, `releaseScope`. Each confirmed answer needs `status: "confirmed"`, `by: "user"`, `answer` (the actual choice), and `evidence` (where the user's response was recorded). `releaseScope` also needs `deliverable: "preview"` or `"published"`. A no-cover choice is valid. Do not fabricate confirmations.

`tasks`: objects with `id`, `description`, `status` (`ready`, `awaiting_user`, `blocked`, `done`, `deferred`). Add `question` for a needed user choice. Completed tasks require an `evidence` reference; deferrals require a `deferral` object with the same user-confirmation fields above. Track inaccessible sources, identity conflicts, promised media and unmet requested sections here. A successful tree import does not resolve a missing story or interview.

`review`: the same confirmation fields, plus `fingerprint` from the assessment after the user reviews the current preview. A change to project settings, accepted data, publication selection or generated HTML invalidates that review. Unrecorded external/custom outputs need separate manual verification; the tool does not inspect them automatically.

This is a local decision aid, not a background agent scheduler or a technical guarantee that a host will not end a turn. Agents must follow the protocol. It never grants external-write authority or automatically resumes a chat.
