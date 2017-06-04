# Design notes

Archive service.

## Overview

The initial archive will be web-based, and served from static files.

There will be an import/maintainance service (in node.js) that will 
process log files, etc. and generate/update the static files for the
archive.

The archive will also link to [annalist](https://github.com/gklyne/annalist)
(over HTTP or copies of files) to provide the human-curated metadata
about e.g. performances.

## Annalist usage

Based on annalist
[Performance_defs](https://github.com/gklyne/Performance_defs), in 
particular:

- `Performance` events, including entire `Concert`s, but also performances
of specific pieces and movements/part of specific pieces (such as 
fragments of Climb!)

- `Performed_work`s, including "Climb!" as a whole, and also its 
individual fragments (which are comparable to movements)

- `Person`s, including `Performer`s and composers

- `Place`s, in particular performance venues.

See sample data [../test/data/example_entity_list.json]

There are (will be) a couple of extensions to Performance_defs, for:
- has_part within Performed_work, e.g. mo:movement
- part_type(s), e.g. Stage (in Climb!)
- sub_event (event:sub_event) within Event (esp. Performane of part within Performance of whole)

