// general entity

export class Entity {
	id: string;
	type_id: string;
	label: string;
	description: string;
	fields: object;

	constructor(fields: object) {
		this.fields = fields;
		this.id = fields['annal:id'];
		this.type_id = fields['annal:type_id'];
		this.label = fields['rdfs:label'];
		this.description = fields['rdfs:comment'];
	}
	getValues(fieldname: string, subfieldname?: string) : string[] {
		var res = [];
		//console.log('getValues('+fieldname+', subfieldname) on '+this.type_id+'/'+this.id);
		subfieldname = subfieldname ? subfieldname : fieldname;
		if (undefined!==this.fields[fieldname]) {
			let val = this.fields[fieldname];
			if (Array.isArray(val)) {
				for (let item of val) {
					if (typeof(item)=='string')
						res.push(item);
					else if (typeof(item)=='number')
						res.push(String(item))
					else if (typeof(item)=='object' && item[subfieldname]!==undefined && typeof(item[subfieldname])=='string')
						res.push(item[subfieldname]);
					else if (typeof(item)=='object' && item[subfieldname]!==undefined && typeof(item[subfieldname])=='number')
						res.push(Number(item[subfieldname]));
					else
						console.log('getValues for non-string array value '+JSON.stringify(item)+':'+typeof(item));
				}
			} else if (typeof(val)=='string') {
				res.push(val);
			} else if (typeof(val)=='number') {
				res.push(String(val));
			} else {
				console.log('getValues for non-string value '+val+':'+typeof(val));
			}
		}
		//console.log(res);
		return res;
	}
	getNumberValues(fieldname: string, subfieldname?: string) : number[] {
		var res = [];
		//console.log('getValues('+fieldname+', subfieldname) on '+this.type_id+'/'+this.id);
		subfieldname = subfieldname ? subfieldname : fieldname;
		if (undefined!==this.fields[fieldname]) {
			let val = this.fields[fieldname];
			if (Array.isArray(val)) {
				for (let item of val) {
					if (typeof(item)=='number')
						res.push(item);
					else if (typeof(item)=='object' && item[subfieldname]!==undefined && typeof(item[subfieldname])=='number')
						res.push(item[subfieldname]);
					else
						console.log('getNumberValues for non-number array value '+JSON.stringify(item)+':'+typeof(item));
				}
			} else if (typeof(val)=='number') {
				res.push(val);
			} else {
				console.log('getNumberValues for non-number value '+val+':'+typeof(val));
			}
		}
		//console.log(res);
		return res;
	}
	getValue(fieldname:string, subfieldname?:string): string {
		let vs = this.getValues(fieldname, subfieldname);
		if (vs.length==0)
			return '';
		return vs[0];
	}
	getNumberValue(fieldname:string, subfieldname?:string): number {
		let vs = this.getNumberValues(fieldname, subfieldname);
		if (vs.length==0)
			return 0;
		return vs[0];
	}
	getTime(fieldname:string, subfieldname?:string): number {
		let v = this.getValue(fieldname, subfieldname);
		if (''==v || !v)
			return 0;
		return new Date(v).getTime()*0.001;
	}
	compareTo(b: Entity, field:string) {
		let v1 = this.getValues(field);
		let v2 = b.getValues(field);
		if (v1.length==0) {
			if (v2.length==0)
				return 0;
			return 1;
		}
		if (v2.length==0)
			return -1;
		return v1[0].localeCompare(v2[0]);
	}
	compareToNumber(b: Entity, field:string) {
		let v1 = this.getValues(field);
		let v2 = b.getValues(field);
		if (v1.length==0) {
			if (v2.length==0)
				return 0;
			return 1;
		}
		if (v2.length==0)
			return -1;
		return Number(v1[0])-Number(v2[0]);
	}

}
