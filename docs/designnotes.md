# Design notes

Archive service.

## Overview

The initial archive (UI) will be web-based, and served from static files. 
See [../archive-app](../archive-app).

There will be an import/maintainance service (in node.js) that will 
process log files, etc. and generate/update the static files for the
archive. (As of 2017-07-13 this is just a command-line tool.) See 
[../lib/](../lib/).

The archive links to [annalist](https://github.com/gklyne/annalist)
(over HTTP or copies of files) to provide the human-curated metadata
about e.g. performances.

The system currently (2017-07-13) draws on the following information
sources:

- a JSON-LD dump from Annalist with the hand-curated definitions of 
performances, artists and works e.g. [example_entity_list.json](../data/test/example_entity_list.json).

- two config files for the [mobile app](https://github.com/littlebugivy/muzivisual)
which contain information about the names and descriptions of each of
the stages/fragments of climb and the associated mountain visualisation,
e.g. [Climb!June8.csv](../data/test/Climb!June8.csv) and 
[narrativesJune8.csv](../data/test/narrativesJune8.csv).

- the log files from [muzicodes](https://github.com/cgreenhalgh/musiccodes)
for the performance(s), e.g. [20170608T112725862Z-default.log](../data/test/20170608T112725862Z-default.log).

- a list of available recordings, e.g. [recordingsJune8.yml](../data/test/recordingsJune8).

The hand-curated definitions are passed straight to the archive, 
see [records.json](../archive-app/src/assets/data/records.json).
However updated versions of some of the records are created in other
output files which must be used instead of the original records 
(e.g. the start times of performances are "fixed", the Performed_work
for Climb! is updated to point to the generated parts).

The mobile app config files are used to generate the `Part_of_Work` 
records for each fragment of climb, see [climb-stages-20170608.json](../archive-app/src/assets/data/climb-stages-20170608.json).

The Musicodes log file generates updated `Performance` records
for each performance (correcting start time), and `Performance` records 
for each fragment of the performance (linking to the respective 
`Part_of_Work` records). See [climb-performances-20170608.json](../archive-app/src/assets/data/climb-performances-20170608.json).

The recording config file (see spec below) generates new `Recording`
records associated with the identified `Performance` and file URL, 
see [climb-recordings-20170608.json](../archive-app/src/assets/data/climb-recordings-20170608.json).

## Annalist (type) usage

Currently the internal data model is based on annalist definitions
[Performance_defs](https://github.com/cgreenhalgh/Performance_defs)

- `Performance` events, including entire `Concert`s, but also performances
of specific pieces and movements/part of specific pieces (such as 
fragments of Climb!)

- `Event`, specifically triggering a musicode (could be a new sub-type).

- `Performed_work`s, including "Climb!" as a whole, and also its 
individual fragments using the new type `Part_of_Work`
(which are loosely comparable to movements)

- `Person`s, including `Performer`s and composers

- `Place`s, in particular performance venues.

- `Recording`s, of particular `Performance`s. 

See [sample data](../test/data/example_entity_list.json).

There are a couple of extensions compared to the original
[Performance_defs](https://github.com/gklyne/Performance_defs), in 
particular:

`Performed_work` gains:

- `has_part`, c.f. mo:movement, to link to
fragment `Part_of_Work`s (see below)

`Event` gains:

- `sub_event` (event:sub_event), esp. for use within 
`Performance` of part within Performance of whole

`Performance` gains:

- `system_id`, the mobile app ID used for the performance. 
(this is a random GUID that is currently hand-configured into
the music-performance-manager config and used in mobile app URLs
and musicode system logs).

- `meld_session`, the MELD session (formerly collection) URL
associated with a performance of a part.

There is one extension to `Recording`, for:

- `prov:startedAtTime`, i.e. dateTime of recording start

The new `Part_of_Work` is based on `Performed_work`, and has 
additional properties:

- `part_ID` and `part_rank` for system ID and sort-order of fragments
within Climb

Note that `Recording` is using `linked_audio_clips` for both video and audio recordings!

There are also some properties being added to generated 
`Part_of_Work` for each fragment to carry information used in
the whole-piece visualisation/mobile app:

- `coll:map_x` - x position on map visusaliation
- `coll:map_y` - y position on map visualisation
- `coll:map_path` - which main "path" in the composition the part lies on
- `coll:map_cue` - array of possible next parts (part_IDs)
- `coll:map_narratives` - map from previous part (part_ID) to narrative for this stage.

There are also some properties being added to generated
`Event` for each musicode being triggered:

- `coll:musicode_id` - ID of musicode
- `coll:musicode_type` - `choice`, `challenge`, `trigger` (start disklav), `approach` (challenge approaching).

## Recording config file

Recordings are specified in a YAML file. E.g.
```
- id: example # unique among recordings of a performance
  url: http://somedomain/somefile.wav
  performanceid: 13a7fa70-ae91-4541-9526-fd3b332b585d # match with muzicodes/vStart performance id
  description: a textual description of the recording
  firstNoteOffset: 5.5 # time from start of file in seconds
  video: true # or false (default)
- url: ...
  ...
```
