// mclog.js
// process muzicodes log file, intially for vStart/vStop/vStageChange events
fs = require('fs');

var performances = {}

module.exports.read = function( path ) {
	var data = fs.readFileSync( path, {encoding:'utf-8'} );
	var lines = data.split('\n');
	console.log('read '+lines.length+' lines');
	for (var l in lines) {
		var line = lines[l];
		try {
			var entry = JSON.parse(line);
			// event: action.triggered
			// see also time, datetime
			// note typo :-)
			if (('action.tiggered'==entry.event || 'action.triggered'==entry.event) && entry.info && entry.info.actions) {
				// entry.info.actions[]
				for (var ai in entry.info.actions) {
					var action = entry.info.actions[ai];
					if (action.url && action.url.indexOf('emit:vStart:mobileapp:')==0) {
						// like emit:vStart:mobileapp:9333e7a2-16a9-4352-a45a-f6f42d848cde:basecamp
						var parts = action.url.split(':');
						var perfid = parts[3];
						if (perfid) {
							//console.log('Found start for performance '+perfid+' at '+entry.datetime);
							if (performances[perfid]) {
								console.log('Warning: performance '+perfid+' restarted at '+entry.datetime);
							}
							console.log('adding performance '+perfid);
							var performance = { startTime: entry.time, startDatetime: entry.datetime, id: perfid, stages: [] };
							performances[perfid] = performance;
							performance.stages.push({id: parts[4], time: entry.time, datetime: entry.datetime});
						}
						else {
							console.log('WARNING: Found start for unspecified performance: '+action.url+' a tline '+(l+1));
						}
					}
					else if (action.url && action.url.indexOf('emit:vStop:mobileapp:')==0) {
						// emit:vStop:mobileapp:9333e7a2-16a9-4352-a45a-f6f42d848cde
						var parts = action.url.split(':');
						var perfid = parts[3];
						if (perfid) {
							//console.log('Found stop for performance '+perfid+' at '+entry.datetime);
							var performance = performances[perfid];
							if (performance) {
								performance.stopTime = entry.time;
								performance.stopDatetime = entry.datetime;
							} else {
								console.log('Warning: performance '+perfid+' not found (vStop) at '+entry.datetime);
							}
						}						
					}
					else if (action.url && action.url.indexOf('emit:vStageChange:mobileapp:')==0) {
						// like emit:vStageChange:mobileapp:9333e7a2-16a9-4352-a45a-f6f42d848cde:end->3b
						var parts = action.url.split(':');
						var perfid = parts[3];
						if (perfid) {
							//console.log('Found stage change for performance '+perfid+' at '+entry.datetime);
							var performance = performances[perfid];
							if (performance && parts[4]) {
								var ix = parts[4].indexOf('->');
								if (ix<0) {
									console.log('Found invalid vStageChange at line '+(l+1)+': '+action.url);
								} else {
									performance.stages.push({id: parts[4].substring(ix+2), time: entry.time, datetime: entry.datetime});
								}
							} else {
								console.log('Warning: performance '+perfid+' not found (vStageChange) at '+entry.datetime);
							}
						}						
					}
				}
			}
		} catch (err) {
			console.log('ERROR reading/processing log line: '+err.message+' - '+line+' (line '+(l+1)+')');
		}
	}
}

module.exports.getPerformances = function() {
	return performances;
}
