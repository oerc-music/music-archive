# Music Archive

public (web) music archive, initially for performances of Climb! as
part of the EPSRC-funded FAST IMPACt project and the 
University of Nottingham Culture and Heritage RPA.

See docs

```
npm install --no-bin-links
```
 
e.g.
```
node lib/processlogs.js test/data/example_entity_list.json \
  test/data/20170608T112725862Z-default.log 'test/data/Climb!June8.csv' \
  test/data/recordingsJune8.yml
```

MIDI files of notes
```
node lib/log2midi.js test/data/20170608T112725862Z-default.log
```
