// muzivisual.js - history file generation for muzivisual programme guide
performances = require('./performances');

module.exports.makePerformances = function( annalistEntries, mcperformances ) {
	var perfs = {};
	var aps = performances.getMuzivisualPerformances( annalistEntries );
	for (var i in aps) {
		var ap = aps[i];
		if (ap.id) {
			ap.type = 'list';
			ap.value = [];
			perfs['performance:'+ap.id] = ap;
			var performance = mcperformances[ap.id];
			if (performance) {
				for (var ei in performance.emits) 
					ap.value.push(JSON.stringify(performance.emits[ei]));
			}
		}
	}
	
	// TODO - events
	return perfs;
}

