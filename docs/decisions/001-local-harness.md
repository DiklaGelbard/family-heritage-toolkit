# Local harness first

Historical v0.1 decision below. v0.2 now models families and marriage/divorce events; see ../families.md. Other planned features remain unimplemented.

Use dependency-free Node.js commands, standard skills and versioned JSON workspace files. Keep agent judgment outside deterministic transforms. No model SDK, workflow DSL, database or service scheduler in v0.1.

Accepted snapshots and publication selections are distinct. Bind selections to a hash of configuration plus accepted records. Preserve originals and operation receipts. Repeated imports must not duplicate records. Resume through status rather than chat memory. Historical accepted snapshots are retained before replacement.

GEDCOM is an interchange format. The first adapter supports names, birth/death date text and parent links only; other fields stay in the immutable original and generate warnings. Invalid UTF-8 fails closed. Full lossless parsing, round-trip export, calendar normalization, claim reconciliation, media processing and external adapters remain planned. Relationship links currently cite the source snapshot through the import receipt rather than individual relationship citations.

The current renderer is a minimal person-card preview with linked parents, not a finished interactive family website. The preview consumes a field allowlist, not raw research records. It does not authenticate access or deploy anything.

Future schemas should include families, relationship types, events, places, sources, citations, claims and reviewed conclusions. Do not advertise those as implemented until behavior is tested.
