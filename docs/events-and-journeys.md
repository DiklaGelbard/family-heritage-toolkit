# Shared sourced events

Dataset.events is the shared record for timeline points, journey stops and person-event links. Update an event once; views reference its stable ID. A biography may cite these IDs rather than maintaining a second factual chronology.

An event has id, title, summary, personIds, status (proposed/confirmed/conflicted), date, citations, optional place, parentId, journeyIds and media. citations reference existing source IDs and precise locators. date.kind is exact/by/before/after/approximate/range/unknown; date.text preserves wording. Ranges also require start/end. Calendar text may be retained separately; the toolkit does not convert calendars or infer exact arrival from a latest-known date. Event order is editorial input order, not an invented chronology.

place has name and optional validated numeric lat/lon. The current renderer intentionally emits a schematic story route, not a geographic map. journeyIds link multiple routes to the same event; parentId nests an earlier/background chapter. Cycles and dangling parent chapters are rejected. Use a shared event ID when stories converge, not duplicated copies.

Select events using selection.eventIds. All referenced people must be selected and status must be confirmed. Select each image independently through eventMediaIds entries of EVENT_ID:MEDIA_ID. Media objects contain id, url (HTTPS) and caption. Internal citations and unselected images are excluded from the public dataset. Selecting an event approves its complete title/summary/date/place; inspect that text for living-person information and source permissions before selecting it.

The responsive journey uses dashed paths, native expandable chapters, event-linked pictures and person links. A location's earlier chapter can expand under its stop. It supports keyboard activation and hash links. The standard theme remains readable; handwritten typography or more elaborate map art are optional future theme choices, not universal defaults. See examples/family.json for fictional input.

Custom renderers must consume the current build/publication.json from the gated build command. Do not read raw research/accepted data directly. Run build again after evidence or selection changes; the gate rejects stale inputs. The toolkit cannot prevent arbitrary external scripts from ignoring this contract.
