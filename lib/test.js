// test.js
var fs = require('fs');
var path = require('path');
var utils = require('./utils');

var templatefile = path.join( __dirname, '..', 'templates', 'part_performance.json' );
var template;
try {
	template = JSON.parse(fs.readFileSync( templatefile, {encoding:'utf-8'} ));
}
catch (err) {
	console.log('ERROR: reading part_performance template file '+templatefile+': '+err.message);
	return null;
}
var variables = {performanceid: 'performanceId', performancetitle: 'performanceTitle'};
variables.stageid = 'stageid';
variables.stagetitle = 'stage title';
variables.datetime = 'datetime';
utils.replaceVariables(template, variables);

console.log(template);