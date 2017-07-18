// utils.js

function replaceVariables(data, variables, name) {
	if (!name)
		name = '';
	if (Array.isArray(data) || typeof(data)=='object') {
		for (var key in data) {
			var value = data[key];
			if (typeof(value)=='string') {
				for (var name in variables) {
					if (value=='{{'+name+'}}') {
						value =  variables[name];
						break;
					}
					value = value.replace('{{'+name+'}}', variables[name]);
				}
				if (data[key]!=value) {
					//console.log('replace '+data[key]+' -> '+value);
				}
				data[key] = value;
			} else {
				replaceVariables(value, variables, name+'.'+key);
			}
		}
	} else {
		//console.log('ignore '+name+' - '+typeof(data));
	}
}

module.exports.replaceVariables = replaceVariables;
