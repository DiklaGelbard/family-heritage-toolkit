# Expandable person cards

Cards show selected birth/death facts while collapsed. Clicking or keyboard-activating the summary expands the card to show selected portrait, biography, other facts, family links and grave media. Source date text, including uncertainty, is preserved. Unknown dates are not invented. Person links open the destination card.

The existing cited facts schema supports these optional types:

- portrait: an approved HTTPS image URL.
- biography: reviewed plain text with a source citation.
- gravePhoto: an approved HTTPS gravestone image URL.
- graveRecord: verified BillionGraves record URL.

Each has a stable fact ID and citation, and must be explicitly included in factIds. A record-page URL is not an image URL. Do not scrape/download or republish grave photos automatically; check the available source and publication rights. HTTPS images are loaded directly from their host, not copied into the build, and may become unavailable. Only the first selected portrait/grave photo is displayed.

Grave facts are excluded unless the archive explicitly marks the person deceased (living:false or a positive death fact). living:true takes precedence. Selecting grave content reveals burial information even when the death date is excluded, so approve that disclosure deliberately. Raw research notes and unselected facts are never copied into the expanded card.

This is an expandable card interface, not yet a zoomable graphical pedigree chart or a modal image viewer. No photograph or biography is fabricated when absent.
