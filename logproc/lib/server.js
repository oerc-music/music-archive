// server.js
var path = require('path');
var yaml = require('js-yaml');
var fs = require('fs');
var app = require('express')();
var http = require('http').Server(app);
var dateFormat = require('dateformat');
var logging = require("./logging");
var auth = require('basic-auth');
var LOG_FILENAME_DATE_FORMAT = "yyyymmdd'T'HHMMssl'Z'";
mclog = require('./mclog');
performances = require('./performances');
output = require('./output');
stagetools = require('./stages');
experience = require('./experience');

logging.init('server', 'music-archive-uploader');

app.use(require('body-parser').json());
app.use(require('body-parser').urlencoded({ extended: true })); 

var configfile = path.join( __dirname, '..', 'etc', 'config.yml' );
if (process.argv.length>2) {
	configfile = process.argv[2];
}
console.log('read config file '+configfile);
var config = {};
try {
	var d = fs.readFileSync(configfile, 'utf8');
	config = yaml.safeLoad(d);
} catch (err) {
	console.log('ERROR reading config file '+configfile+': '+err.message, err);
	process.exit(-1);
}

var annalistEntries = [];
for (var ai in config.annalistfiles) {
	
	var annalistfile = config.annalistfiles[ai];
	console.log('read annalist file '+annalistfile);
	var annalistContext;
	try {
		annalistContext = JSON.parse(fs.readFileSync(annalistfile, {encoding:'utf-8'}));
		annalistEntries = annalistEntries.concat(annalistContext['annal:entity_list']);
	}
	catch (err) {
		console.log('ERROR: reading annalist file '+annalistfile+': '+err.message);
		process.exit(-3);
	}
	logging.log('server','read.annalist',{path: annalistfile}, logging.LEVEL_INFO);
}	

var mvfile = config.mvfile;
var narrativefile = config.narrativefile;
var stages = [];
try {
	console.log('read muzivisual config file '+mvfile+' and narrative file '+narrativefile);
	stages = stagetools.readMuzivisualStages(mvfile, narrativefile);
}
catch (err) {
	console.log('ERROR: reading muzivisual config file '+mvfile+': '+err.message, err);
	process.exit(-2);
}

var expfile = config.experiencefile;
try {
	console.log('read experience spreadsheet '+expfile);
	experience.readSpreadsheet(expfile);
}
catch(err) {
	console.log('ERROR: reading experience spreadsheet '+expfile+': '+err.message, err);
	process.exit(-2);
}

app.post('/api/1/processlog', function(req,resp) {
	var user = auth(req);
	if (user===undefined || user.name!=config.httpuser || user.pass!=config.httppass) {
		logging.log('server', 'post.error.auth', {path:req.path, user:user}, logging.LEVEL_INFO);
		resp.status(401).send('wrong or missing credentials');
		return;
	}
	console.log('process log headers', req.headers);
	var now = dateFormat(new Date(), LOG_FILENAME_DATE_FORMAT);
	var filename = 'processlog-upload-'+now+'.log';
	var logpath = path.resolve(config.logdir, filename);
	var out = null;
	var job = { logpath: logpath, complete: false, length: 0 };
	//logging.log('server', 'post.processlog', {})
	try {
		console.log('create '+logpath+'...');
		out = fs.createWriteStream(logpath, {flags:'w',defaultEncoding:'binary'});
		out.on('error', function(err) {
			console.log('stream '+logpath+' error', err);
			logging.log('server','processlog.error.write', {path:logpath,error:err.message}, logging.LEVEL_INFO);
		});
	}
	catch (err) {
		console.log('Error opening log file to write '+logpath+': '+err.message, err);
		resp.status(500).send('could not create log file copy on server');
		return;
	}
	out.on('finish', function() {
		if (!job.complete) {
			resp.status(500).send('could not create complete log file copy on server ('+job.error+')');
			return;
		}
		// TODO process
		console.log('read uploaded musicodes log '+logpath);
		var mclogfile = logpath;
		try {
			console.log('read musicodes log '+mclogfile);
			mclog.read(mclogfile);
		}
		catch (err) {
			console.log('ERROR: reading musicodes logfile '+mclogfile+': '+err.message, err);
			resp.status(500).send('error reading uploaded musicodes file ('+err.message+')');
			return;
		}

		console.log('performances:');
		var mcperformances = mclog.getPerformances();
		var perfids = [];
		for (var performanceId in mcperformances) {
			perfids.push(performanceId);
			var performance = mcperformances[performanceId];
			console.log('MC performance '+performanceId+':');

			var performanceEntities = [];
			var performanceTitle = performances.getPerformanceTitle( annalistEntries, performanceId );
			if (!performanceTitle) {
				console.log('Warning: could not find annalist entry for performance '+performanceId+' - ignored');
				continue;
			}
			var annalistStagePerformances = performances.makeAnnalistStagePerformances( stages, performanceId, performanceTitle, performance.stages, experience.getCodes() );
			performanceEntities = performanceEntities.concat(annalistStagePerformances);
			console.log('part performances for '+performanceTitle+' ('+performanceId+'): '+annalistStagePerformances.length);
			var annalistPerformance = performances.fixAnnalistPerformance( annalistEntries, annalistStagePerformances, performance );
			performanceEntities.push(annalistPerformance);

			var performanceoutfile = path.resolve(config.outputdir, 'performance-'+performanceId+'-annalist.json');
			console.log('write performance to '+performanceoutfile);
			output.writeFile(performanceoutfile, performanceEntities);
			logging.log('server','processlog.performance', {path:logpath, performance:performanceId, outpath: performanceoutfile}, logging.LEVEL_INFO);
		}
		
		resp.status(200).send('OK - found performances '+perfids.join(' '));
		logging.log('server','processlog', {path:logpath}, logging.LEVEL_INFO);
	});
	req.on('data', function(data) {
		job.length += data.length;
		console.log('write '+data.length+' bytes');
		out.write(data);
	});
	req.on('end', function() {
		console.log('got all data ('+job.length+')');
		out.end();
		job.complete = true;
	});
	req.on('error', function(err) {
		console.log('Error in request uploaded log file '+logpath+': '+err.message);
		logging.log('server','processlog.error', {path:logpath, error: err.message}, logging.LEVEL_INFO);
		job.error = err.message;
		out.close();
	});
});

var PORT = config.port || 4201;
http.listen(PORT, function(){
	console.log('listening on *:'+PORT);
	logging.log('server','http.listen',{port:PORT},logging.LEVEL_INFO);
});
