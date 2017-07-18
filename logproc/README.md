# Archive Log Processing

## Install / set up

you will need at least node/npm.

```
cd logproc
npm install --no-bin-links
```

## Process Logs offline

e.g.
```
node lib/processlogs.js ../test/data/example_entity_list.json \
  ../test/data/20170608T112725862Z-default.log '../test/data/Climb!June8.csv' \
  ../test/data/recordingsJune8.yml ../test/data/narrativesJune8.csv
```

Copy processed logs over to archive app...
```
cp ../test/data/recordingsJune8.yml-annalist.json ../archive-app/src/assets/data/climb-recordings-20170608.json
cp ../test/data/Climb\!June8.csv-annalist.json ../archive-app/src/assets/data/climb-stages-20170608.json
cp ../test/data/20170608T112725862Z-default.log-annalist.json ../archive-app/src/assets/data/climb-performances-20170608.json
cp ../test/data/example_entity_list.json ../archive-app/src/assets/data/records.json
```
Note, app data files to load in ../archive-app/src/assets/data/. See especially
urls.json (list of files to read).

At some point this should be wrapped up in an on-demand server.

## Midi files

MIDI files of notes
```
node lib/log2midi.js test/data/20170608T112725862Z-default.log
```

## Online

Configure log processing server (just processes musicodes logs to performances).
See `etc/config.yml`

Run server
```
node lib/server.js [CONFIGFILE]
```

By default runs on port 4202 (see config) and accepts musicodes log file POST to `/api/1/processlog`.

Outputs a file like `performance-PERFID-annalist.json` to the specified output directory.

Note, will only output files for performances found in the annalist entries loaded at start-up time.
