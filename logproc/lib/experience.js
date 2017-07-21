/* experience.js - experience file / spreadsheet processing.
 * See https://github.com/cgreenhalgh/fast-performance-demo/tree/master/scoretools */

var xlsx = require('xlsx');

var stages = [];
var codes = [];
var data = {};

function cellid(c,r) { 
	var p = String(r+1);
	while (true) {
		p = String.fromCharCode('A'.charCodeAt(0)+(c % 26)) + p;
		var c = Math.floor(c/26);
		if (c==0) 
			break;
		c = c-1;
	}
	return p;
}


module.exports.readSpreadsheet = function( xlfile ) {
	var workbook = xlsx.readFile( xlfile );
	var sheet = workbook.Sheets[workbook.SheetNames[0]];
	
	//console.log( 'A1 = '+cellid(0,0)+' '+(JSON.stringify (sheet[cellid(0,0)])) );
	//console.log( 'AA3 = '+cellid(26,2)+' '+(JSON.stringify (sheet[cellid(26,2)])) );

	function readrow(r) {
		var data = {};
		var prefix = '';
			for (var c=0; c<1000; c++) {
				var head = sheet[cellid(c,0)]!==undefined && sheet[cellid(c,0)].v!==undefined ? sheet[cellid(c,0)].v.toLowerCase() : null;
				if (head===null)
					break;
				if (head.indexOf( ':' ) >= 0) {
					prefix = head.substring( 0, head.indexOf( ':' ))+'_';
					head = head.substring(head.indexOf( ':' )+1);
				}
				var key = prefix+head;
				if (sheet[cellid(c,r)]!==undefined && sheet[cellid(c,r)].v!==undefined) {
					data[key] = sheet[cellid(c,r)].v;
				}
			}
		return data;
	}
	var maxrow = 1;
	var numstages = 0;
	for (var r=1; r<1000; r++) {
		if( sheet[cellid(0,r)] === undefined )
			break;
		var data = readrow( r );
		if (data.stage===undefined) {
			console.log( 'ignore row without stage name: '+JSON.stringify( data ));
			continue;
		}
		//console.log( 'stage '+data.stage, data );
		maxrow = r
		if (stages[data.stage]!==undefined) {
			console.log( 'ERROR: more than one entry found for stage '+data.stage );
		}
		data._index = numstages;
		numstages++;
		stages.push( data );
		// TODO...
		var cues = [];
		for (var ci=1; ci<5; ci++) {
			var prefix = 'mc'+ci+'_';
			var name = data[prefix+'name'];
			if (name===undefined) 
				continue;
			var cue = data[prefix+'cue'];
			if (cue && cues.indexOf(cue)<0)
				cues.push(cue);
		}
		console.log('stage '+data.stage+' cues: '+cues);
		for (var ci=1; ci<5; ci++) {
			var prefix = 'mc'+ci+'_';
			var name = data[prefix+'name'];
			if (name===undefined) 
				continue;
			var code = { id: name, stage: data.stage, meifile: data.meifile, measure: data[prefix] };
			var cue = data[prefix+'cue'];
			if (cue) {
				if (cues.length>1)
					code.type = 'choice';
				else
					code.type = 'challenge';
			} else if (data[prefix+'midi'] || data[prefix+'midi2']) {
				code.type = 'trigger';
			} else if (data[prefix+'app'] || data[prefix+'v.mc']) {
				// probably, but not necessarily?! 
				code.type = 'approach';
			} else {
				code.type = 'unknown';
			}
			codes.push(code);
		}
	}
}

module.exports.getStages = function() { 
	return stages;
}

module.exports.getCodes = function() {
	return codes;
}
