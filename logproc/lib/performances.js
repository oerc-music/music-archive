// performances.js
// build/process...
var utils = require('./utils');
var path = require('path');

var SUB_EVENT = "event:sub_event";

module.exports.makeAnnalistStagePerformances = function( stages, performanceId, performanceTitle, performanceStages, codes ) {
	var templatefile = path.join( __dirname, '..', 'templates', 'part_performance.json' );
	var template;
	try {
		template = JSON.parse(fs.readFileSync( templatefile, {encoding:'utf-8'} ));
	}
	catch (err) {
		console.log('ERROR: reading part_performance template file '+templatefile+': '+err.message);
		return null;
	}
	var templatefile2 = path.join( __dirname, '..', 'templates', 'code_event.json' );
	var template2;
	try {
		template2 = JSON.parse(fs.readFileSync( templatefile2, {encoding:'utf-8'} ));
	}
	catch (err) {
		console.log('ERROR: reading code_event template file '+templatefile2+': '+err.message);
		return null;
	}
	var stageTitles = {};
	for (var si in stages) {
		stageTitles[stages[si].id] = stages[si].title;
	}
	var performances = [];
	var variables = {performanceid: performanceId, performancetitle: performanceTitle};
	var codeix = 1;
	for (var si in performanceStages) {
		var stage = performanceStages[si];
		var value = JSON.parse(JSON.stringify(template));
		variables.stageid = stage.id;
		variables.stagetitle = stageTitles[stage.id];
		variables.datetime = stage.datetime;
		utils.replaceVariables(value, variables);
		// codes triggered within stage
		value[SUB_EVENT] = [];
		for (var ci in stage.codes) {
			var code = stage.codes[ci];
			// TODO codetype, narrative
			var description = "Performed code "+code.id;
			var cvar = {performanceid: performanceId, codeix: (codeix++), codeid: code.id, 
					datetime: code.datetime, codetype: 'unknown', description: description };
			if (codes) {
				var code = codes.find(function(c) { return c.id==code.id; });
				if (code) {
					cvar.codetype = code.type;
					switch(code.type) {
					case 'choice':
						cvar.description = 'Performed choice code ("'+code.id+'")';
						break;
					case 'challenge':
						cvar.description = 'Performed challenge code successfully ("'+code.id+'")';
						break;
					case 'trigger':
						cvar.description = 'Performed code to start disklavier ("'+code.id+'")';
						break;
					case 'approach':
						cvar.description = 'Performed code on approach to a challenge ("'+code.id+'")';
						break;
					}
				}
			}
			var value2 = JSON.parse(JSON.stringify(template2));
			utils.replaceVariables(value2, cvar);
			performances.push(value2);
			var item = {};
			item[SUB_EVENT] = value2['annal:type_id']+'/'+value2['annal:id'];
			value[SUB_EVENT].push(item); 
		}
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
			entry[SUB_EVENT] = [];
			for (var si in annalistStagePerformances) {
				var stage = annalistStagePerformances[si];
				if (stage['annal:type_id']!='Performance')
					continue;
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

module.exports.getMuzivisualPerformances = function( annalistEntries ) {
	var perfs = [];
	for (var i in annalistEntries) {
		var entry = annalistEntries[i];
		if ('Performance'==entry['annal:type_id']) {
			// for muzivisual! performer location time title
			var perf = { 'title': entry['rdfs:label'], 'id': entry['coll:system_id'], 'performer': 'unspecified performer' };
			// prov:startedAtTime xsd:datetime
			if (entry['prov:startedAtTime'])
				perf.time = new Date(entry['prov:startedAtTime']).getTime();
			perf.location = 'unspecified location';
			//"prov:qualifiedAssociation": [ { "crm:P12i_was_present_at":
			if (entry['prov:qualifiedAssociation'] && entry['prov:qualifiedAssociation'].length>0) {
				var pid = entry['prov:qualifiedAssociation'][0]['crm:P12i_was_present_at'];
				if (pid) {
					var pe = annalistEntries.find(function(e) { return pid == e['annal:type_id']+'/'+e['annal:id']; });
					if (pe)
						perf.performer = pe['rdfs:label'];
					else
						console.log('Warning: could not find performer '+pid);
				}
				else
					console.log('Warning: no performer specified for '+entry['rdfs:label']);
			}
			perfs.push(perf);
		}
	}
	return perfs;
}

