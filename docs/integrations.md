# Integration boundaries

| Integration | v0.1 capability | Next step |
| --- | --- | --- |
| Local JSON | Import, validate, stage a reviewed snapshot | Reconciliation of independently sourced claims |
| GEDCOM | Names, birth/death dates, families, MARR/DIV date/place text with warnings | Custom fields, Hebrew continuation bytes, pedigree qualifiers and calendars |
| Website | Local RTL/LTR person and family sections | Cover, albums, audio and hosting adapters |
| MyHeritage | Not implemented | Reviewed diffs and browser-assisted edits with destination verification |
| BillionGraves | Candidate detection, interview decision and search-report tracking; agent-guided research workflow | No live API/scraper adapter; use authorized web/browser tools |
| Google Photos | Not implemented | Selected imports and source-link manifests; do not promise shared-album sync |
| Hebrew audio | Not implemented | Preserve originals, timestamped raw and corrected transcripts |

Prefer supported APIs or user-provided exports. A browser adapter must declare its capabilities and coordinate exclusive access to its browser session. Never retry an uncertain external mutation without checking destination state. No credentials belong in this repository or run receipts.

## Design references

- [Agent Skills format](https://agentskills.io/specification)
- [Gramps data model](https://github.com/gramps-project/gramps-web-docs/blob/main/docs/en/user-guide/data-model.md)
- [GEDCOM specification](https://gedcom.io/specifications/FamilySearchGEDCOMv7.html)
- [Google Photos API changes](https://developers.google.com/photos/support/updates)
- [Long-running agent harnesses](https://www.anthropic.com/research/effective-harnesses-for-long-running-agents)

The dependency-free validators enforce the supported subset plus cross-reference and cycle checks. JSON Schemas describe file shapes for editors; they are not a claim of full GEDCOM compliance.
