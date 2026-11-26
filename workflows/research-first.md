# Research first

## 1. Agree research boundaries

Establish family branches, relevant people/places, the research purpose and permission to inspect sources. Keep any suggested narrative focus provisional. Do not ask the owner to settle the cover, layout, opening story or visualization before source review. Existing user preferences can be saved without treating them as final planning decisions.

## 2. Inventory and inspect

Use the discovery skill to summarize known material and ask what else is available. Aim for all reasonably available relevant sources within scope, not an endless search. Record each source in research/coverage.json, including project.sources and new leads. CLI imports add a located entry automatically. A filename, link, listing, partial extract or transcription job started is not a completed review.

Read documents and relevant email attachments, review photos, and transcribe/listen to relevant recordings using available authorized tools. Save findings, source locators, attribution, contradictions and extraction limits in review artifacts outside the public toolkit. Partial reads remain unfinished. Access failures are pending_access or unavailable, not reviewed. Do not contact relatives or broaden mailbox access without authorization.

## 3. Assess coverage

Run external-source-discovery.md after initial source review. Ask explicitly about new research opportunities, including BillionGraves for missing dates/burials. Persist the decision in externalDiscovery; requested searches become tracked work. Pending decisions or unfinished requested searches hold the planning gate. Declined/deferred research does not trigger repetitive prompts unless candidate scope changes.

Run `node src/cli/index.mjs assess DIR`. While stage is research, continue available review work or ask about access and missing sources. Planning questions are withheld. Relevant deferred/unavailable sources remain gaps; the agent cannot waive them. Excluding a source as irrelevant requires a recorded user confirmation in this initial implementation.

Prepare research/synthesis.md (or JSON) with supported family stories, citations, disagreements, remaining gaps and evidence limitations. This is a research summary, not a website plan. Associate it with the current inventoryFingerprint returned in assessment.research. When the inventory or review artifacts change, update the synthesis and its fingerprint after reviewing the changes.

## 4. Open the planning gate

The gate opens only when scope and source discovery have user-confirmed answers, all relevant inventory entries have review artifacts and summaries, all known project sources are tracked, and a current synthesis exists; **or** the user explicitly approves proceeding with the listed current gaps.

For a gap approval, show the missing/unread sources and consequences, ask whether to keep researching or proceed, then save the actual answer and its evidence in proceedWithGaps with the current assessment.research.fingerprint. Never prefill this confirmation. New sources or changed findings invalidate it. Research permission is not publication permission.

The CLI blocks select and build when the gate is closed, including old workspaces. It also rejects publication selections created against older research. There is no automatic exception for an existing preview. Imports and evidence work remain available.

## 5. Plan, build and review

Only now confirm narrative focus, propose a story structure, select a cover and consider maps/timelines based on evidence. Follow first-website.md and continue-or-ask.md. Preserve user-approved gaps in the brief. Publishing requires separate authorization and the actual hosting workflow.

## Coverage format

Start from templates/research-coverage.json (init creates it). scope and discovery use `{status: "confirmed", by: "user", answer: "actual response", evidence: "where recorded"}`. Discovery can say no additional sources for now.

sources entries have id, location, relevant, status (located, pending_access, reviewed, unavailable, deferred). Reviewed entries require `review: {artifact: "research/source-review.md", summary: "what was inspected and learned"}`. Artifacts must be files inside the workspace; their contents are hashed. They are internal evidence, never automatically published. An irrelevant source needs relevant:false and an exclusion object with user-confirmation fields.

synthesis is `{artifact: "research/synthesis.md", inventoryFingerprint: "value from assess"}`. proceedWithGaps is a user-confirmation object plus fingerprint. Copy the returned fingerprint only after the owner has approved those particular gaps.

This gate verifies recorded state and artifact existence, not the truth or completeness of a human/agent's reading. It cannot stop an agent from writing a custom website outside the CLI; the instructions prohibit bypassing the gate. Fictional demo confirmations are test data and must never be copied into real projects.
