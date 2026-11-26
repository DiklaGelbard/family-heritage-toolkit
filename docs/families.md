# Families in v0.2

GEDCOM imports now produce dataset schemaVersion 2. Existing v1 JSON datasets remain readable and render as before. Do not change the version number alone: family membership cannot reliably be reconstructed from flattened parent lists, particularly after remarriage.

Reimport the original GEDCOM into a proposal, compare with accepted records and any manual corrections, then accept the reviewed snapshot. Reimport is not a merge. Keep prior corrections and resolve differences before accepting. Accepted snapshots are backed up in data/history. Re-select publication fields after acceptance.

Each family has:

- A stable id, a partners list, and a children list.
- A citation to the source record.
- An events list containing marriage/divorce occurrences, each with a stable id, original value, date, place and citation. Missing dates/places are null; approximate dates remain text.

A person can participate in multiple families. Each child stays attached to the family in which the source lists them. The compatibility parents field must equal the union of partners in that child's families; validation rejects inconsistencies. Parent links do not imply biological parentage. The prototype retains pedigree/adoption qualifiers only in the original GEDCOM and warns that review is required.

A family does not imply marriage. Missing partners remain absent; no surname-only or unnamed spouse record is invented. Partner labels are neutral and do not claim a currently married relationship. Marriage/divorce events are historical facts, not an inferred current marital-status field.

## Publication selection

```json
{
  "personIds": ["I1", "I2", "I4"],
  "familyIds": ["F1"],
  "factIds": ["F1-MARR-0", "F1-DIV-1"]
}
```

Use actual IDs from the reviewed proposal; the values above match tests/fixtures/families.ged. A familyId publishes links among its selected members. Omitted familyIds means no v2 relationship links. Family events are separately selected through factIds, and require all known partners to be selected. Hidden members, source text and internal citations are never included in the publication dataset.

The preview has linked family sections with partners, children, and selected marriage/divorce events, in Hebrew or English. It is not yet a graphical pedigree chart.
