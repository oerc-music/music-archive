import 'rxjs/add/operator/switchMap';
import { Component, OnInit, ElementRef }      from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Location }               from '@angular/common';

import { Entity } from './entity';
import { RecordsService }  from './records.service';

class ScreenEntity extends Entity {
	selected:boolean = false;
	available:boolean = false;
	active:boolean = false;
	highlighted:boolean = false;

	constructor(fields: object) {
		super(fields);
	}
}

class Recording extends Entity {
	startTime:number;
	urls:string[] = [];
	performance:Performance;
	audio:Object;
	canplay:boolean = false;
	shouldplay:boolean = false;
	lastTime:number = 0;
	isVideo:boolean = false;
	visible:boolean = false;
	constructor(fields: object, performance:Performance) {
		super(fields);
		this.performance = performance;
		this.startTime = this.getTime('prov:startedAtTime');
		
	}
	setUrls(urls:string[]) {
		this.urls = urls;
		this.isVideo = urls.find(url => url.length>4 && '.mp4'==url.substr(-4))!==undefined;
		if (this.isVideo)
			console.log('found video recording '+this.id+' url '+urls);
	}
}

class Performance extends ScreenEntity {
	startTime:number;
	recordings:Recording[];
	constructor(fields: object) {
		super(fields);
		this.startTime = this.getTime('prov:startedAtTime');
	}
}

class Part extends ScreenEntity {
	constructor(fields: object) {
		super(fields);
	}
}

class AudioClip {
	recording:Recording;
	start:number;
	duration:number;
	constructor(recording:Recording,start:number,duration:number) {
		this.recording = recording;
		this.start = start;
		this.duration = duration;
	}
}

class SubEvent extends Entity {
	startTime:number;
	startTimeText:string;
	highlight:boolean=false;
	countdown:number=0;
	constructor(fields:object, pp: PartPerformance) {
		super(fields);
		this.startTime = this.getTime('prov:startedAtTime');
		var partOffset = this.startTime - pp.startTime;
		let minutes = Math.floor(partOffset / 60);
		let seconds = Math.floor(partOffset-60*minutes);
		this.startTimeText = (minutes)+':'+Math.floor(seconds/10)+(seconds%10);
	}
	clear() {
		this.countdown = 0;
		this.highlight = false;
	}
	setAbsTime(time:number) {
		var delta = this.startTime-time;
		this.highlight = (delta<=0 && delta> -1);
		if (delta>0 && delta<5)
			this.countdown = Math.floor(delta+1);
		else
			this.countdown = 0;
		console.log('setAbsTime '+time+'/'+this.startTime+'='+delta+', countdown='+this.countdown+', highlight='+this.highlight);
	}
}

class PartPerformance extends Entity {
	startTime:number;
	performance:Performance;
	part:Part;
	clip:AudioClip;
	audioClip:AudioClip;
	videoClip:AudioClip;
	currentTimeText:string = '0:00';
	subevents:SubEvent[] = [];
	constructor(fields:object, performance:Performance, part:Part) {
		super(fields);
		this.startTime = this.getTime('prov:startedAtTime');
		this.performance = performance;
		this.part = part;
	}
	setCurrentTime(time:number) {
		time = Math.floor(time);
		let minus = (time<0) ? '-' : '';
		if (time<0)
			time = -time;
		let minutes = Math.floor(time / 60);
		let seconds = time-60*minutes;
		this.currentTimeText = minus+(minutes)+':'+Math.floor(seconds/10)+(seconds%10);
	}
}

@Component({
  selector: 'work-explorer',
  templateUrl: './work-explorer.component.html',
  styleUrls: ['./work-explorer.component.css']
})

export class WorkExplorerComponent implements OnInit {
  work: Entity;
  performances: Performance[] = [];
  parts: Part[] = [];
  recordings: Recording[] = [];
	partPerformances: PartPerformance[] = [];
	currentlyPlaying: PartPerformance = null;
	selectedPart: Part = null;
	selectedPerformance: Performance = null;
	showMap: boolean = false;
	countdownLevels: number[] = [5,4,3,2,1];
	showVideo: boolean = true;
	
  constructor(
	private elRef:ElementRef,
    private recordsService: RecordsService,
    private route: ActivatedRoute,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.route.params
      .switchMap((params: Params) => this.recordsService.getWork(params['id']))
      .subscribe(work => this.initialiseForWork(work));
  }
	initialiseForWork(work:Entity):void {
		this.work = work; 
		this.showMap = !!work.getValue('coll:map_url');
		/* get all performances of work */
		this.recordsService.getPerformancesOfWork(work)
		.then(performances => {
			this.performances = performances
			.map(p => new Performance(p.fields))
			.sort((a,b) => a.compareTo(b, 'prov:startedAtTime'));
			/* then get all parts (members) of work */
			return this.recordsService.getMembers(work); 
		})
		.then(members => {
			this.parts = members
			.map(m => new Part(m.fields))
			.sort((a,b) => a.compareToNumber(b, 'coll:part_rank'));
			/* then get all recordings of each performance */
			return Promise.all(this.performances.map(p => 
				this.recordsService.getRecordingsOfPerformance(p)
				.then(recs => {
					p.recordings = recs.map(rec => new Recording(rec.fields, p));
					/* and the URLs for each performance */
					return Promise.all(p.recordings.map(r => 
						this.recordsService.getUrlsOfRecording(r).then(urls => r.setUrls(urls) )));
				})));
		})
		.then(() => 
			Promise.all(this.performances.map(p =>
				this.recordsService.getSubEvents(p)
				.then(events => 
					this.partPerformances = this.partPerformances.concat(
						events.map(ev => new PartPerformance(ev.fields, p, this.parts.find(p => 
							ev.getValues('frbroo:R25F_performed_r','frbroo:R25F_performed').indexOf(p.type_id+'/'+p.id)>=0)))
					)
				))
			)
		)
		.then(() => 
			Promise.all(this.partPerformances.map(pp =>
				this.recordsService.getSubEvents(pp)
				.then(subevents => 
					pp.subevents = subevents.map(subevent => new SubEvent(subevent.fields, pp))
				)
			))
		)
		.then(() => {
			console.log('loaded work to explore');
			this.buildAudioClips();
		});
	}
	
  goBack(): void {
    this.location.back();
  }
  
	setShowMap(value) {
		this.showMap = value;
	}
	setShowVideo(value) {
		this.pause();
		this.showVideo = value;
		this.partPerformances.forEach(pp => pp.clip = (this.showVideo ? pp.videoClip : pp.audioClip) );
		this.recordings.forEach(r => r.visible = r.isVideo==this.showVideo && (r.performance==this.selectedPerformance || (this.currentlyPlaying && this.currentlyPlaying.performance==r.performance)));
		if (this.currentlyPlaying) {
			this.playInternal(this.currentlyPlaying.performance, this.currentlyPlaying.part);
		}
	}
	buildAudioClips() {
		for (var pi in this.performances) {
			let p = this.performances[pi];
			for (var video=0; video<2; video++) {
				let rec = p.recordings.find(r => r.isVideo==(video>0) && !!r.urls && r.urls.length>0);
				if (undefined===rec) {
					console.log('Note: no '+(video ? 'video' : 'audio')+' recording with url for performance '+p.label);
					continue;
				}
				this.recordings.push(rec);
			}
		}
		for (var pi in this.partPerformances) {
			let pp = this.partPerformances[pi];
			for (var video=0; video<2; video++) {
				// first recording for now
				let rec = this.recordings.find(r => r.isVideo==(video>0) && r.performance===pp.performance);
				if (undefined===rec) {
					console.log('Note: no '+(video ? 'video' : 'audio')+' recording with url for performance '+pp.label);
					continue;
				}
				let startTime = pp.startTime;
				let recStartTime = rec.startTime;
				// TODO end of last stage??
				let endTime = this.partPerformances.filter(p => p.performance===pp.performance && p.startTime > pp.startTime)
				.map(p => p.startTime).sort().find(() => true);
				let clip = new AudioClip(rec, startTime-recStartTime, endTime? endTime-startTime : null);
				console.log('part '+pp.id+' is '+clip.start+'+'+clip.duration);
				if (video) {
					pp.videoClip = clip;
					if (this.showVideo)
						pp.clip = pp.videoClip;
				}
				else {
					pp.audioClip = clip;
					if (!this.showVideo)
						pp.clip = clip;
				}
			}
		}
	}
	clickPerformance(perf) {
		console.log('highlight performance '+perf.id);
		for (var pi in this.performances) {
			let p = this.performances[pi];
			if (p!==perf)
				p.highlighted = false;
		}
		perf.highlighted = true;
		// highlight stages in this performance
		for (var pi in this.parts) {
			let part = this.parts[pi];
			part.highlighted = !!this.partPerformances.find(pp =>  pp.performance === perf && pp.part === part);
		}
	}
	clickPerformanceCheckbox(event,perf) {
		console.log('select performance '+perf.id);
		for (var pi in this.performances) {
			let p = this.performances[pi];
			if (p!==perf && p.selected)
				p.selected = false;
			p.available = false;
		}
		for (var pi in this.parts) {
			let p = this.parts[pi];
			p.selected = false;
		}
		this.selectedPart = null;
		if (!perf.selected)
			perf.selected = true;
		this.selectedPerformance = perf;
		// available stages in this performance
		for (var pi in this.parts) {
			var part = this.parts[pi];
			part.available = !!this.partPerformances.find(pp =>  pp.performance === perf && pp.part === part);
		}
		if (this.currentlyPlaying) {
			if (this.currentlyPlaying.performance!==perf || !this.currentlyPlaying.part.available)
				this.stop();
			else
				this.currentlyPlaying.part.active = true;
		}
		if (!this.currentlyPlaying) {
			var part = this.parts.find(p => p.available);
		 	if (part) {
				this.playInternal(perf, part);
			} else {
				this.recordings.forEach(r => r.visible = r.isVideo==this.showVideo && r.performance==perf);
			}
		}
	}
	clickPerformancePlay(event,perf) {
		event.preventDefault();
		event.stopPropagation();
		let part = this.parts.find(p => p.selected);
		if (part!==undefined) {
			this.playInternal(perf, part);
		}
	}
	clickPart(part) {
		console.log('highlight part'+part.id);
		for (var pi in this.parts) {
			let p = this.parts[pi];
			if (p!==part)
				p.highlighted = false;
		}
		part.highlighted = true;
		// highlight performances including this part/stage
		for (var pi in this.performances) {
			var performance = this.performances[pi];
			performance.highlighted = !!this.partPerformances.find(pp => pp.performance === performance && pp.part === part);
		}
	}
	clickMapPart(part) {
		console.log('clickMapPart('+part.id+')');
		if (part.available) {
			this.clickPartPlay(null, part);
		} else {
			this.clickPartCheckbox(null, part);
		}
	}
	getMedia() {
		var media = [];
		if (!!this.elRef) {
			let audios = this.elRef.nativeElement.getElementsByTagName('audio');
			let videos = this.elRef.nativeElement.getElementsByTagName('video');
			for (var ai=0; ai<audios.length; ai++) {
				media.push(audios[ai]);
			}
			for (var ai=0; ai<videos.length; ai++) {
				media.push(videos[ai]);
			}
		}
		return media;
	}

	clickPartCheckbox(event,part) {
		console.log('select part'+part.id);
		for (var pi in this.parts) {
			let p = this.parts[pi];
			if (p!==part && p.selected)
				p.selected = false;
			p.available = false;
		}
		for (var pi in this.performances) {
			let p = this.performances[pi];
			p.selected = false;
		}
		this.selectedPerformance = null;
		if (!part.selected)
			part.selected = true;
		this.selectedPart = part;
		for (var pi in this.performances) {
			var performance = this.performances[pi];
			performance.available = !!this.partPerformances.find(pp => pp.performance === performance && pp.part === part);
		}
		if (this.currentlyPlaying) {
			if (this.currentlyPlaying.part!==part|| !this.currentlyPlaying.performance.available) {
				this.stop();
			}
			else
				this.currentlyPlaying.performance.active = true;
		}
		if (!this.currentlyPlaying) {
			var perf = this.performances.find(p => p.available);
		 	if (perf) {
				this.playInternal(perf, part);
			}
			else {
				this.recordings.forEach(r => r.visible = false );
			}
		}
	}
	clickPartPlay(event,part) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
		let perf = this.performances.find(p => p.selected);
		if (perf!==undefined) {
			this.playInternal(perf, part);
		}
	}
	playInternal(perf, part) {
		console.log('play '+perf.id+' '+part.id);
		for (var pi in this.parts) {
			let p = this.parts[pi];
			p.active = p===part && !part.selected;
		}
		for (var pi in this.performances) {
			let p = this.performances[pi];
			p.active = p===perf && !perf.selected;
		}
		
		let wasPlaying = this.currentlyPlaying;
		this.currentlyPlaying = this.partPerformances.find(pp => pp.performance===perf && pp.part===part);
		this.currentlyPlaying.subevents.map(ev => ev.clear());
		
		//console.log('elRef',this.elRef);
		let rec = this.recordings.find(r => r.isVideo==this.showVideo && r.performance===perf);
		if (!rec) {
			console.log('no '+(this.showVideo ? 'video' : 'audio')+' recording for performance '+perf.id);
		}
		this.recordings.forEach(r => r.visible = r==rec );
		if (!!this.elRef) {
			let media = this.getMedia();
			for (var ai=0; ai<media.length; ai++) {
				let audio = media[ai];
				console.log('media '+ai+'/'+media.length+': '+rec.id+' vs '+audio.id, audio);
				if (!!rec && audio.id==rec.id) {
					rec.shouldplay = true;
					console.log('media '+ai+' visible!');
					// start time...
					var partOffset = 0;
					if (!!wasPlaying && wasPlaying.part===part && wasPlaying!==this.currentlyPlaying) {
						// same time in part?
						partOffset = wasPlaying.clip.recording.lastTime + wasPlaying.clip.recording.startTime 
						- wasPlaying.startTime;
						if (partOffset<0) {
							console.log('warning: part offset <0: '+partOffset+' (lastTime '+wasPlaying.clip.recording.lastTime+')');
							partOffset = 0;
						}
					}
					this.currentlyPlaying.setCurrentTime(partOffset);	
					if (this.currentlyPlaying.clip.start+partOffset>=0) {
						console.log('seek to '+(this.currentlyPlaying.clip.start+partOffset));
						audio.currentTime = this.currentlyPlaying.clip.start+partOffset;
					} else {
						console.log('warning: clip start <0: '+this.currentlyPlaying.id+', '+this.currentlyPlaying.clip.start+'+'+partOffset);
						audio.currentTime = 0;
					}
					if (audio.readyState>=2)
						// canplay
						audio.play();
				} else {
					audio.pause();
				}
			}
		}
	}
	stop() {
		if (this.currentlyPlaying) {
			this.currentlyPlaying.part.active = false;
			this.currentlyPlaying.performance.active = false;
		}
		this.pause();
		this.currentlyPlaying = null;
	}
	audioTimeupdate(event,rec) {
		console.log('timeupdate '+rec.id+' '+event.target.currentTime);
		rec.lastTime = event.target.currentTime;
		if (!!this.currentlyPlaying && this.currentlyPlaying.clip && this.currentlyPlaying.clip.recording===rec) {
			let offset = rec.lastTime+rec.startTime-this.currentlyPlaying.startTime;
			this.currentlyPlaying.setCurrentTime(offset);
			this.currentlyPlaying.subevents.map(ev => ev.setAbsTime(rec.lastTime+rec.startTime));
			if (this.currentlyPlaying.performance.selected) {
				// check best clip...
				let nextPp = this.partPerformances.filter(pp=>pp.performance===this.currentlyPlaying.performance
					&& (!pp.clip.duration || pp.startTime+pp.clip.duration-0.1>rec.lastTime+rec.startTime))
					.sort((a,b)=>a.startTime-b.startTime).find(()=>true);
				if (!nextPp) {
					console.log('no valid part to play');
					//this.stop();
				} else if (nextPp!==this.currentlyPlaying) {
					console.log('change part to '+nextPp.id);
					this.currentlyPlaying.part.active = false;
					this.currentlyPlaying = nextPp;
					this.currentlyPlaying.part.active = true;
					this.currentlyPlaying.setCurrentTime(rec.lastTime+rec.startTime-this.currentlyPlaying.startTime);
					this.currentlyPlaying.subevents.map(ev => ev.setAbsTime(rec.lastTime+rec.startTime));
				}
			}
			else if (this.currentlyPlaying.part.selected) {
				if (this.currentlyPlaying.clip.duration && offset > this.currentlyPlaying.clip.duration) {
					// pause
					this.pause();
					event.target.currentTime = this.currentlyPlaying.startTime-rec.startTime;
				} else if (offset < 0) {
					// before clip?!
					event.target.currentTime = rec.lastTime-offset;
				}
			}
		}
	}
	audioEnded(event,rec) {
		console.log('ended '+rec.id);
		this.pause();
		event.target.currentTime = 0;
	}
	audioCanplay(event,rec) {
		console.log('canplay '+rec.id);
		rec.canplay = true;
		if (rec.shouldplay) {
			console.log('play '+rec.id+' on canplay');
			event.target.play();
		}
	}
	audioSeeked(event,rec) {
		console.log('seeked '+rec.id);
	}
	play() {
		if (!!this.currentlyPlaying && !this.currentlyPlaying.clip.recording.shouldplay) {
			this.currentlyPlaying.clip.recording.shouldplay = true;
			if (!!this.elRef) {
				let audios = this.getMedia();
				for (var ai=0; ai<audios.length; ai++) {
					let audio = audios[ai];
					if (audio.id==this.currentlyPlaying.clip.recording.id) {
						this.currentlyPlaying.clip.recording.shouldplay = true;
						if (audio.readyState>=2)
							// canplay
							audio.play();
					}
				}
			}
		}
	}
	pause() {
		if (this.currentlyPlaying) {
			if (!!this.elRef) {
				let audios = this.getMedia();
				for (var ai=0; ai<audios.length; ai++) {
					let audio = audios[ai];
					audio.pause();
				}
			}
			this.recordings.forEach(r => r.shouldplay = false);
		}
	}
	getAudio(rec:Recording) {
		if (!!this.elRef) {
			let audios = rec.isVideo ? this.elRef.nativeElement.getElementsByTagName('video') :
				this.elRef.nativeElement.getElementsByTagName('audio');
			for (var ai=0; ai<audios.length; ai++) {
				let audio = audios[ai];
				console.log('audio '+ai+'/'+audios.length+':', audio);
				if (!!rec && audio.id==rec.id) {
					return audio;
				}
			}
		}
		return null;
	}
	forward() {
		if (!!this.currentlyPlaying) {
			let audio = this.getAudio(this.currentlyPlaying.clip.recording);
			if (!!audio) {
				let currentTime = audio.currentTime;
				if (audio.duration!=0 && currentTime+10>audio.duration) {
					this.pause();
					audio.currentTime = audio.duration;
				}
				else
					audio.currentTime = currentTime+10;
			}
		}
	}
	back() {
		if (!!this.currentlyPlaying) {
			let audio = this.getAudio(this.currentlyPlaying.clip.recording);
			if (!!audio) {
				let currentTime = audio.currentTime;
				if (this.currentlyPlaying.part.selected) {
					if (this.currentlyPlaying.clip.recording.startTime+currentTime-10 < this.currentlyPlaying.startTime)
						audio.currentTime = this.currentlyPlaying.startTime - this.currentlyPlaying.clip.recording.startTime;
					else if (currentTime>10)
						audio.currentTime = currentTime-10;
					else
						audio.currentTime = 0;
				} else {
					// performance
					if (currentTime>10)
						audio.currentTime = currentTime-10;
					else {
						audio.currentTime = 0;
					}
				}
			}
		}
	}
	next() {
		console.log('next');
		if (!!this.currentlyPlaying) {
			if (this.currentlyPlaying.part.selected) {
				let options = this.partPerformances.filter(pp=>pp.part===this.currentlyPlaying.part);
				let ix = (options.indexOf(this.currentlyPlaying)+1) % options.length;
				this.playInternal(options[ix].performance, options[ix].part);
			} else {
				let pp = this.partPerformances.filter(pp=>pp.performance===this.currentlyPlaying.performance && 
					pp.startTime>this.currentlyPlaying.startTime).sort((a,b)=>a.startTime-b.startTime).find(()=>true);
				if (!!pp)
					this.playInternal(pp.performance, pp.part);
			}
		}
	}
	previous() {
		console.log('previous');
		if (!!this.currentlyPlaying) {
			if (this.currentlyPlaying.part.selected) {
				let options = this.partPerformances.filter(pp=>pp.part===this.currentlyPlaying.part);
				let ix = (options.indexOf(this.currentlyPlaying)+options.length-1) % options.length;
				this.playInternal(options[ix].performance, options[ix].part);
			} else {
				let pp = this.partPerformances.filter(pp=>pp.performance===this.currentlyPlaying.performance && 
					pp.startTime<this.currentlyPlaying.startTime).sort((a,b)=>b.startTime-a.startTime).find(()=>true);
				if (!!pp)
					this.playInternal(pp.performance, pp.part);
			}
		}
	}
	playSubevent(subevent) {
		if (!!this.currentlyPlaying) {
			let audio = this.getAudio(this.currentlyPlaying.clip.recording);
			if (!!audio) {
				var time = subevent.startTime - this.currentlyPlaying.clip.recording.startTime - 3;
				console.log('seek to subevent '+subevent.startTime+' => '+time);
				if (time<0)
					time = 0;
				if (audio.duration!=0 && time>audio.duration) {
					this.pause();
					audio.currentTime = audio.duration;
				}
				else
					audio.currentTime = time;
			}
		}
	}
}

