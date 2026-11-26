# Proactive external-source discovery

Collecting existing files differs from researching sources not yet found. Include both in every interview. Inspect the accepted tree and source inventory. assessment.research.externalOpportunities flags explicitly deceased people missing birth/death dates, burial details or gravePhoto references. It does not infer death from age. Missing fields can reflect importer limitations: check originals before declaring a real gap.

Explain the missing details and ask whether to research BillionGraves, cemetery records, external family trees or archives. Ask about known cemeteries, spelling/transliteration variants and grave links. Record requested, declined or deferred. Reuse explicit authorization in this project; do not inherit it from another family project.

## State

research/coverage.json.externalDiscovery uses confirmed user answer/evidence fields plus choice (requested, declined, deferred) and scopeFingerprint from assessment.research.externalOpportunities.fingerprint. Changed candidates reopen the decision. An explicit user target can be researched even if automatic detection found none.

Requested work has searches entries: id, target, provider, status (pending, blocked, completed). Bound each search to specific targets. Completed entries require a report file inside the workspace and outcome (matched, possible_matches, no_match). Found records also require sourceIds referencing coverage.sources; those sources must undergo review. A possible match is not a confirmed identity. No match is a valid documented result; an access failure is blocked, not no_match. Pending or blocked work holds the planning gate unless current gaps are explicitly approved.

Declined/deferred choices place those searches outside this release; do not repeatedly ask. Reports, decisions and changed candidates affect research fingerprints. Found sources remain subject to ordinary source review.

## BillionGraves workflow

Use authorized web/browser tools; no automated scraper or live API client is included. Search original names, transliterations and known cemeteries. Inspect the record and legible grave image. Record queries, access date, stable record URL, grave-photo link when available, cemetery/location, original inscription, date text/calendar/precision and identity evidence. Preserve Hebrew dates and uncertainty; avoid unsupported conversion.

Compare relatives, spouse/parent names, location and chronology. Names alone do not prove identity; adjacent graves do not prove kinship. Keep uncertain matches and conflicting dates separate. Do not invent dates from unreadable inscriptions. Link confirmed findings to stable person IDs and propose reviewed changes, rather than silently overwriting the tree.

Respect access limits; do not bypass challenges or assume logged-in access. Ask when access is needed. Research authorization does not authorize downloading/republishing images or editing MyHeritage. Review attribution and publication permissions separately.

## Limits

Only accepted records are scanned. living:false or a positive death fact establishes eligibility; explicit living:true takes precedence and conflicts need manual review. DEAT Y indicates death without a known date. Burial/photo data omitted by the subset importer may exist in originals. Recommendations are leads, not proof that source data is missing.
