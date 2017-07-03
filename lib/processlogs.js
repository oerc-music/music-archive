// processlogs.js
// Usage: annalistfile musicodeslog
mclog = require('./mclog');
stagetools = require('./stages');
performances = require('./performances');
recordings = require('./recordings');
output = require('./output');

if (process.argv.length!=6) {
	console.log('ERROR: usage: node processlogs.js ANNALISTEXPORTFILE MUSICODESLOGFILE MUZIVISUALCSVFILE RECORDINGSYMLFILE');
	process.exit(-1);
}

var annalistfile = process.argv[2];
var annalistContext, annalistEntries;
try {
	annalistContext = JSON.parse(fs.readFileSync(annalistfile, {encoding:'utf-8'}));
	annalistEntries = annalistContext['annal:entity_list'];
}
catch (err) {
	console.log('ERROR: reading annalist file '+annalistfile+': '+err.message);
	process.exit(-3);
}

var mclogfile = process.argv[3];
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
	console.log('MC performance '+perfid+':');
//	console.log(performance);
}

var mvfile = process.argv[4];
var stages = [];
try {
	console.log('read muzivisual config file '+mvfile);
	stages = stagetools.readMuzivisualStages(mvfile);
}
catch (err) {
	console.log('ERROR: reading muzivisual config file '+mvfile+': '+err.message, err);
	process.exit(-2);
}

console.log('read '+stages.length+' stages');
//console.log(stages);

var recfile = process.argv[5];
var recs = [];
try {
	console.log('read recordings file '+recfile);
	recs = recordings.readRecordings(recfile);
}
catch (err) {
	console.log('ERROR: reading recordings file '+recfile+': '+err.message, err);
	process.exit(-3);
}

var annalistStages = stagetools.makeAnnalistStages( stages );
console.log('annalist data for stages:');
//console.log(annalistStages);

var annalistClimb = stagetools.fixAnnalistClimb( annalistEntries, annalistStages );
console.log('annalist climb:');
console.log(annalistClimb);

var stageoutfile = mvfile+'-annalist.json'; 
console.log('write stages to '+stageoutfile);
output.writeFile( stageoutfile, annalistStages.concat([annalistClimb]));

var performanceEntities = [];
for (var performanceId in mcperformances) {
	var performance = mcperformances[performanceId];
	if (performance) {
		var performanceTitle = performances.getPerformanceTitle( annalistEntries, performanceId );
		if (!performanceTitle) {
			console.log('Warning: could not find annalist entry for performance '+performanceId+' - ignored');
			continue;
		}
		var annalistStagePerformances = performances.makeAnnalistStagePerformances( stages, performanceId, performanceTitle, performance.stages);
		performanceEntities = performanceEntities.concat(annalistStagePerformances);
		console.log('part performances for '+performanceTitle+' ('+performanceId+'): '+annalistStagePerformances.length);
		var annalistPerformance = performances.fixAnnalistPerformance( annalistEntries, annalistStagePerformances, performance );
		performanceEntities.push(annalistPerformance);
		//console.log('Annalist performance '+performanceId+':');
		//console.log(annalistPerformance);
	}
}

var performanceoutfile = mclogfile+'-annalist.json';
console.log('write performances to '+performanceoutfile);
output.writeFile(performanceoutfile, performanceEntities);

var recordingEntities = [];
for (var ri in recs) {
	var recording = recs[ri];
	var performance = mcperformances[recording.performanceid];
	if (!performance) {
		console.log('Warning: could not find annalist entry for performance '+recording.performanceid+' (recording '+(recording.url)+')');
		continue;
	}
	var performanceTitle = performances.getPerformanceTitle( annalistEntries, recording.performanceid );
	if (!performanceTitle) {
		console.log('Warning: could not find annalist entry for performance '+recording.performanceid+' - ignored');
		continue;
	}
	var performanceAnnalistId = performances.getPerformanceAnnalistId( annalistEntries, recording.performanceid );
	if (!performanceAnnalistId) {
		console.log('Warning: could not find annalist entry for performance '+recording.performanceid+' - ignored');
		continue;
	}
	var annalistRecording = recordings.makeAnnalistRecording( recording, performanceAnnalistId, performanceTitle, performance );
	recordingEntities = recordingEntities.concat(annalistRecording);
}

var recoutfile = recfile+'-annalist.json';
console.log('write recordings to '+recoutfile);
output.writeFile(recoutfile, recordingEntities);
