import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';

import { Entity } from './entity';

class Line {
	constructor(public from:Entity, public to:Entity) {}
}

@Component({
	selector: 'parts-map',
	templateUrl: './parts-map.component.html',
	styleUrls: ['./parts-map.component.css']
})
export class PartsMapComponent implements OnChanges {
	@Input() parts: Entity[];
	@Input() work: Entity;
    @Output() select: EventEmitter<any> = new EventEmitter();
	lines: Line[] = [];
	
	clickPartPlay(event,part) {
		//console.log('parts-map clickPartPlay '+part.id);
		this.select.emit(part);
	}
	ngOnChanges(changes: any) {
		console.log('onChanges', changes);
		if (changes.parts.currentValue) {
			var parts = {};
			for (var pi in changes.parts.currentValue) {
				parts[changes.parts.currentValue[pi].getValue('coll:part_id')] = changes.parts.currentValue[pi];
			}
			var lines = [];
			for (var pi in parts) {
				let part = parts[pi];
				let cues = part.getValues('coll:map_cue');
				for (var ci in cues) {
					let cue = parts[cues[ci]];
					if (cue) {
						lines.push(new Line(part, cue));
					}
					console.log('line from '+part.id+' to '+cues[ci]);
				}
			}
			this.lines = lines;
		}
	}
}

