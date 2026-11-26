# Family Heritage Toolkit

A lightweight agent harness for guided genealogy research and family website creation.

**Early v0.1 prototype:** discovery interview → source import → reviewed snapshot → publication selection → local website preview → resumable handoff.

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
# Inspect proposals/import.json, including all warnings.
node src/cli/index.mjs accept /path/to/private-family-workspace
# The command above prints the proposal hash without accepting it.
node src/cli/index.mjs accept /path/to/private-family-workspace REVIEWED_HASH
# Prepare a selection JSON using examples/selection.json as the format.
node src/cli/index.mjs select /path/to/private-family-workspace /path/to/selection.json
node src/cli/index.mjs build /path/to/private-family-workspace
node src/cli/index.mjs status /path/to/private-family-workspace
```

## Using an agent

Ask the agent to read AGENTS.md and skills/discovery-interview/SKILL.md, then start a project in a separate workspace. Skills are bundled but not installed globally. Keep this repository available: the skill uses its question bank, workflows and CLI. You can also operate the CLI without an agent.

## Implemented and planned

Implemented: guided discovery skill; fictional Hebrew example; JSON and limited GEDCOM intake; preserved source copies; validation; reviewed snapshot acceptance; explicit publication selection; stale-selection checks; RTL/LTR HTML preview; persistent receipts and a single-writer lock.

Planned: richer claim/conflict review, full GEDCOM fidelity and exports, media galleries and cover rendering, Hebrew transcription, exact photo edits, browser-assisted MyHeritage/BillionGraves/Google Photos workflows, hosting adapters. No automatic synchronization or external writes are provided today.

The GEDCOM subset reads names, birth/death date strings and parents. Other fields generate warnings and remain in the original. Import replaces the staged proposal; acceptance replaces the accepted snapshot, preserving history. It does not merge trees. Invalid UTF-8 is rejected, not silently repaired.

A preview has no authentication. Anyone receiving the output can read it. Only selected people and facts enter it; internal citations, source files and research notes are excluded. Selecting a person includes their name and links to other selected parents. Keep real workspaces outside this repository and do not commit family information.

See workflows/first-website.md, docs/integrations.md and docs/decisions/001-local-harness.md for boundaries. JSON Schemas in schemas/ document the supported formats. `npm test` is also supported when npm is available. Contributions should include fictional fixtures and tests. Do not attach private family data to issues.

## License

MIT. The package.json `private` flag prevents accidental npm publication; the GitHub source repository is public.
