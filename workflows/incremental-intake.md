# Refresh supplied collections

When the owner adds files, refresh only authorized collections through available connectors/browser/export tools. Record a manifest with provider, collection and items. Each item has stable provider id, revision (content hash or provider revision), kind, location and extent when known. Do not put credential-bearing temporary URLs into manifests. For scans, capture date is not scene date.

Run `node src/cli/index.mjs intake DIR MANIFEST.json`. New or changed items become located sources; changed entries retain prior review history and require renewed review. Identical manifests are idempotent. Missing entries become unavailable only if complete:true explicitly says all pages of the provider listing were fetched. Never treat a partial listing as deletion, and never delete originals. Possible cross-provider duplicates need review; this command deduplicates stable provider IDs only.

The command consumes a manifest; it does not connect to Drive or Photos itself. New sources invalidate research readiness and old selections. Ask focused follow-ups only for genuinely new context, then review the new material before revising the synthesis.
