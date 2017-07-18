// log2midi.js
// Usage: annalistfile musicodeslog
mclog = require('./mclog');
writeMidi = require('midi-file').writeMidi;
fs = require('fs');

if (process.argv.length!=3) {
	console.log('ERROR: usage: node log2midi.js MUSICODESLOGFILE');
	process.exit(-1);
}

var mclogfile = process.argv[2];
try {
	console.log('read musicodes log '+mclogfile);
	mclog.read(mclogfile);
}
catch (err) {
	console.log('ERROR: reading musicodes logfile '+mclogfile+': '+err.message, err);
	process.exit(-2);
}

console.log('performances:');
var mcperformances = mclog.getPerformances();
for (var perfid in mcperformances) {
	var performance = mcperformances[perfid];
	console.log('MC performance '+perfid+':'+performance.notes.length+' notes');
//	console.log(performance);
}

for (var performanceId in mcperformances) {
	var performance = mcperformances[performanceId];
	if (performance) {

		var midioutfile = mclogfile+'-'+performanceId+'.midi';
		console.log('write performances '+performanceId+' midi to '+midioutfile);
		// millisecond timing format
		//var midi = {header: { format: 0, ticksPerFrame: 40, framesPerSecond: 25 }, tracks:[]};
		// try (default) 120 bpm
		var midi = {header: {format:0, ticksPerBeat: 500}, tracks:[]}
		var track = [];
		// initial tempo marker
		track.push({type:'setTempo', microsecondsPerBeat: 500*1000});
		// one track - can treat as type 0 or 1
		midi.tracks.push(track);
		var lastNoteTime = performance.startDatatime;
		for(var ni in performance.notes) {
			var note = performance.notes[ni];
			//  like {"localTime":1495029177971,"note":"E4","midinote":64,"freq":329.59534665249885,"velocity":127,"off":false}
			if (note.localTime<lastNoteTime) {
				console.log('Warning: jump back '+(lastNoteTime-note.localTime)+'ms');
				lastNoteTime = note.localTime;
			}
			var elapsed = note.localTime - lastNoteTime;
			lastNoteTime = note.localTime;
			var midievent = { deltaTime: elapsed, noteNumber: note.midinote, velocity: note.velocity, channel: 0 };
			if (note.off) {
				midievent.type = 'noteOff';
			} else {
				midievent.type = 'noteOn';
			}
			track.push(midievent);
		}
		track.push({type:'endOfTrack'});
		// write
		var output = writeMidi(midi);
		var outputBuffer = new Buffer(output);

		fs.writeFileSync(midioutfile, outputBuffer);
		// check...
		var check = require('midi-file').parseMidi(outputBuffer);
		console.log('check header', check.header);
		console.log('tracks: '+check.tracks.length);
		console.log('events in track 0: '+check.tracks[0].length);
	}
}

