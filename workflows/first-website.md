# First website workflow

1. Conduct the discovery interview; complete project.json and record decisions and missing sources.
2. Import a toolkit JSON dataset or the documented GEDCOM subset. Inspect proposals/import.json and its warnings. This stages a complete snapshot, not a merge.
3. Compare the proposal with existing accepted data. Resolve identity and relationship questions; never merge by name alone. Accept with the exact proposal hash after review. Running accept without a hash prints the required hash and makes no change.
4. Prepare a selection JSON with personIds, familyIds and factIds. In v2, select families explicitly to publish relationship links between selected people. Select marriage/divorce event IDs through factIds as well; all known partners must be selected to publish an event. Each selected person fact publishes its type and value. Legacy v1 retains selected-parent links. Review conflicting facts before selecting them. Citation text and original sources are excluded from output. See docs/families.md for migration.
5. Run select, then build. Inspect build/index.html, especially Hebrew direction, relationships and selected fields.
6. Run status for handoff. Changes to project or accepted data invalidate the publication selection. Publishing is a separate, currently manual action.

No external writes, browser operations or deployment are implemented in this release. A local preview is not authenticated hosting. Keep private builds private. All writes to a workspace must use one writer at a time; the CLI enforces a local lock for its mutation commands.
