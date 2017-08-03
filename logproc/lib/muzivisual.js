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
				ap.value = performance.emits;
			}
		}
	}
	
	// TODO - events
	return perfs;
}

