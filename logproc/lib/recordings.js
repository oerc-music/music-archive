// recordings.js
var utils = require('./utils');
var path = require('path');

yaml = require('js-yaml');

module.exports.readRecordings = function(filename) {
	 var doc = yaml.safeLoad(fs.readFileSync(filename, 'utf8'));
	 console.log('read '+doc.length+' recordings'/*, doc*/);
	 return doc;
};

module.exports.makeAnnalistRecording = function(recording, performanceAnnalistId, performanceTitle, performance) {
	// start time with offset
	// performance.startTime (java time) vs performance.notes[0].localTime (java time) vs recording firstNoteOffset (seconds, float) vs prov:startedAtTime
	// datetime = performance.notes[0].localTime - firstNoteOffset
	var datetime = performance.startDatetime;
	if (performance.notes.length==0) {
		console.log('Warning: no notes found in performance '+performance.id);
	} else {
		var offset = recording.firstNoteOffset ? 1000*recording.firstNoteOffset : 0;
		var startTime = performance.notes[0].localTime - offset;
		var datetime = (new Date(startTime)).toISOString();
	}
	
	var templatefile = path.join( __dirname, '..', 'templates', 'recording.json' );
	var template;
	try {
		template = JSON.parse(fs.readFileSync( templatefile, {encoding:'utf-8'} ));
	}
	catch (err) {
		console.log('ERROR: reading recording template file '+templatefile+': '+err.message);
		return null;
	}
	var variables = {
			performanceid: performanceAnnalistId, performancetitle: performanceTitle, 
			recordingid: recording.id, url: recording.url, datetime: datetime
	};
	utils.replaceVariables(template, variables);
	var res = [ template ];
	templatefile = path.join( __dirname, '..', 'templates', 'audio_clip.json' );
	try {
		template = JSON.parse(fs.readFileSync( templatefile, {encoding:'utf-8'} ));
	}
	catch (err) {
		console.log('ERROR: reading audio_clip template file '+templatefile+': '+err.message);
		return null;
	}
	utils.replaceVariables(template, variables);
	res.push(template);
	//console.log('recording...', res);
	return res;
};