// output utils
pathutil = require('path');


module.exports.writeFile = function( path, entries ) {
	var templatefile = pathutil.join( __dirname, '..', 'templates', 'entities.json' );
	var template;
	try {
		template = JSON.parse(fs.readFileSync( templatefile, {encoding:'utf-8'} ));
	}
	catch (err) {
		console.log('ERROR: reading entities template file '+templatefile+': '+err.message);
		return null;
	}
	template["annal:entity_list"] = entries;
	var text = JSON.stringify(template, null, '\t');
	fs.writeFileSync( path, text, {encoding:'utf-8'});
}
