# Guided photo tagging and review

Offer this during source review when photographs are available. Ask whether the owner wants to label new photos or review existing labels. Use a small batch and show one photo at a time with its source link. Do not treat this as automatic face recognition or infer identities from appearance. Candidate labels must come from existing captions, records or user testimony, with their provenance shown.

Ask the owner to identify people from right to left or by a numbered region, then optionally provide approximate year, event/place and memory. Offer confirm, correct, unsure, skip and stop-for-now. Never guess names to fill missing labels. Use stable person IDs for confirmed matches, and keep a new or ambiguous person as an unresolved label until reconciled.

Save workspace-local research/photo-annotations.json with media ID/source, region or right-to-left position, original candidate label and provenance, corrected label/person ID, status (proposed, confirmed, rejected, unsure, skipped), user answer and timestamp. Preserve previous assertions and corrections. Record exact versus approximate dates separately; photographing an old print is not the historical scene date.

Use `node src/cli/index.mjs annotate DIR ANSWER.json` to persist an actual user response. Include mediaId, labelId, source, by:user, evidence and status (confirmed/rejected/unsure/skipped), plus supplied name/personId, position, posture, region, date, event or memory. Regions use normalized x/y/width/height. Corrections patch only supplied fields, preserving earlier identity and position; previous versions go into history. The cursor records the last reviewed item for resumption. Store proposed labels as source candidates before asking; this mutation command only records responses, not automatic identification. A posture-only correction must not erase a name.

An interruption must save the current item and remaining queue. Resume without re-asking confirmed items unless the source or identification changed. Unsupported labels remain unresolved. Explicitly record whether the user approved deferring unreviewed photos for this release.

Confirmed tagging is not permission to publish a photo or personal details. Apply publication choices independently. Do not write labels into Google Photos or another service without that action being authorized. The current workflow is agent-guided using available image-viewing/question tools; no dedicated tagging web UI or external synchronization is implemented.
