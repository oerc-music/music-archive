// performances.js
// build/process...
var utils = require('./utils');
var path = require('path');

module.exports.makeAnnalistStagePerformances = function( stages, performanceId, performanceTitle, performanceStages ) {
	var templatefile = path.join( __dirname, '..', 'templates', 'part_performance.json' );
	var template;
	try {
		template = JSON.parse(fs.readFileSync( templatefile, {encoding:'utf-8'} ));
	}
	catch (err) {
		console.log('ERROR: reading part_performance template file '+templatefile+': '+err.message);
		return null;
	}
	var stageTitles = {};
	for (var si in stages) {
		stageTitles[stages[si].id] = stages[si].title;
	}
	var performances = [];
	var variables = {performanceid: performanceId, performancetitle: performanceTitle};
	for (var si in performanceStages) {
		var stage = performanceStages[si];
		var value = JSON.parse(JSON.stringify(template));
		variables.stageid = stage.id;
		variables.stagetitle = stageTitles[stage.id];
		variables.datetime = stage.datetime;
		utils.replaceVariables(value, variables);
		performances.push(value);
	}
	return performances;
}

module.exports.getPerformanceTitle = function( annalistEntries, performanceId ) {
	for (var i in annalistEntries) {
		var entry = annalistEntries[i];
		if ('Performance'==entry['annal:type_id'] && performanceId==entry['coll:system_id']) {
			return entry['rdfs:label'];
		}
	}
	return null;
}

module.exports.getPerformanceAnnalistId = function( annalistEntries, performanceId ) {
	for (var i in annalistEntries) {
		var entry = annalistEntries[i];
		if ('Performance'==entry['annal:type_id'] && performanceId==entry['coll:system_id']) {
			return entry['annal:id'];
		}
	}
	return null;
}

module.exports.fixAnnalistPerformance = function( annalistEntries, annalistStagePerformances, performance ) {
	for (var i in annalistEntries) {
		var entry = annalistEntries[i];
		if ('Performance'==entry['annal:type_id'] && performance.id==entry['coll:system_id']) {
			if (performance.startDatetime) {
				entry["prov:startedAtTime"] = performance.startDatetime;
			}
			var SUB_EVENT = "event:sub_event";
			entry[SUB_EVENT] = [];
			for (var si in annalistStagePerformances) {
				var stage = annalistStagePerformances[si];
				var item = {};
				item[SUB_EVENT] = stage['annal:type_id']+'/'+stage['annal:id'];
				entry[SUB_EVENT].push(item); 
			}
			return entry;
		}
		else {
			//console.log('skip '+entry['annal:type_id']+' '+entry['annal:id']);
		}
	}
	console.log('ERROR could not find Performance '+performance.id+' in annalist entries');
	return null;
} 