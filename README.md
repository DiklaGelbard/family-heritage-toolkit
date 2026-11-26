# Family Heritage Toolkit

A lightweight agent harness for guided genealogy research and family website creation.

**Early v0.3 prototype:** research scope → source discovery and content review → synthesis → research gate → website planning → reviewed snapshot → publication selection → local preview.

## Quick start

Requires Node.js 22 or newer. No dependencies or account connections are required.

```sh
node --test tests/scenarios/*.test.mjs
node src/cli/index.mjs demo /tmp/heritage-demo
# Open /tmp/heritage-demo/build/index.html in a browser.
```

The demo explicitly accepts fictional records and publication choices. For real material, conduct the interview and review each stage:

```sh
node src/cli/index.mjs init /path/to/private-family-workspace
node src/cli/index.mjs questions
# Complete project.json using the interview. See examples/project.json.
node src/cli/index.mjs import /path/to/private-family-workspace /path/to/family.ged
# Inspect relevant source contents, record research/coverage.json and a synthesis.
# See workflows/research-first.md; planning/select/build wait for this gate.
# Inspect proposals/import.json, including all warnings.
node src/cli/index.mjs accept /path/to/private-family-workspace
# The command above prints the proposal hash without accepting it.
node src/cli/index.mjs accept /path/to/private-family-workspace REVIEWED_HASH
# Prepare a selection JSON using examples/selection.json as the format.
node src/cli/index.mjs select /path/to/private-family-workspace /path/to/selection.json
node src/cli/index.mjs build /path/to/private-family-workspace
node src/cli/index.mjs status /path/to/private-family-workspace
node src/cli/index.mjs assess /path/to/private-family-workspace
```

## Using an agent

Ask the agent to read AGENTS.md and skills/discovery-interview/SKILL.md, then start a project in a separate workspace. Skills are bundled but not installed globally. Keep this repository available: the skill uses its question bank, workflows and CLI. You can also operate the CLI without an agent.

The agent must assess unresolved decisions before ending a turn. `assess` reads discovery.json and returns continue, ask_user, blocked or complete, plus focused questions and independent work. See [continue-or-ask](workflows/continue-or-ask.md). A branch root is not a confirmed storytelling focus, and a generated preview is not a finished project. This protocol guides an agent; it cannot force the hosting app to keep a session running.

Research is checked first through research/coverage.json. Filenames and links are not reviews. Relevant sources require findings artifacts and a current synthesis, or an explicit user approval tied to the current gaps. New sources or changed findings invalidate readiness/selection as appropriate. Both select and build enforce the gate, including for old workspaces. See [research-first workflow and state format](workflows/research-first.md). The gate checks recorded evidence, not the semantic quality of research or whether all possible external sources exist.

## Implemented and planned

Person cards now expand to show explicitly selected portrait, biography and (for deceased people) grave photo/BillionGraves link. Selected birth/death dates remain visible on the collapsed card. See docs/person-cards.md. A guided photo-tagging review workflow is available in workflows/photo-tagging-review.md; a dedicated tagging application is not implemented.

External discovery now proposes grave-research opportunities from explicitly deceased accepted records and asks about BillionGraves/cemetery and other external sources. Decisions and requested search reports are tracked by the research gate. The agent conducts authorized searches with available tools; an automated scraper/API adapter is not implemented. See workflows/external-source-discovery.md.

Implemented: guided discovery skill; fictional Hebrew example; JSON and limited GEDCOM intake; partners, family-specific children, marriage/divorce events with dates and places; preserved source copies; validation; reviewed snapshot acceptance; explicit publication selection; stale-selection checks; RTL/LTR HTML preview; persistent receipts and a single-writer lock.

Planned: richer claim/conflict review, full GEDCOM fidelity and exports, media galleries and cover rendering, Hebrew transcription, exact photo edits, browser-assisted MyHeritage/BillionGraves/Google Photos workflows, hosting adapters. No automatic synchronization or external writes are provided today.

The GEDCOM subset reads names, birth/death date strings, FAM partners/children, and MARR/DIV events with date/place text. Other fields generate warnings and remain in the original. Import replaces the staged proposal; acceptance replaces the accepted snapshot, preserving history. It does not merge trees. Invalid UTF-8 is rejected, not silently repaired. Pedigree/adoption qualifiers are not yet modeled, so parent links do not assert biological parentage.

A preview has no authentication. Anyone receiving the output can read it. Only selected people, families and facts enter it; internal citations, source files and research notes are excluded. In v2 datasets, familyIds must explicitly select relationships; events must also be selected by ID in factIds. Events with an excluded partner cannot be published. Legacy v1 datasets retain their original selected-parent behavior. Keep real workspaces outside this repository and do not commit family information.

For an existing workspace, see [upgrading family relationships](docs/families.md). Do not infer partnerships from the old flattened parent list.

See workflows/first-website.md, docs/integrations.md and docs/decisions/001-local-harness.md for boundaries. JSON Schemas in schemas/ document the supported formats. `npm test` is also supported when npm is available. Contributions should include fictional fixtures and tests. Do not attach private family data to issues.

## License

MIT. The package.json `private` flag prevents accidental npm publication; the GitHub source repository is public.
