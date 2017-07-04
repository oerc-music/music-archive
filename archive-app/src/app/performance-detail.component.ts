import 'rxjs/add/operator/switchMap';
import { Component, OnInit }      from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Location }               from '@angular/common';

import { Entity } from './entity';
import { RecordsService }  from './records.service';

@Component({
  selector: 'performance-detail',
  templateUrl: './performance-detail.component.html'
})
export class PerformanceDetailComponent implements OnInit {
  performance: Entity;
  subevents: Entity[] = [];
  recordings: Entity[] = [];

  constructor(
    private recordsService: RecordsService,
    private route: ActivatedRoute,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.route.params
      .switchMap((params: Params) => this.recordsService.getPerformance(params['id']))
      .subscribe(performance => { this.performance = performance; 
        this.recordsService.getSubEvents(performance)
        .then(subevents => { /*console.log(subevents);*/ this.subevents = subevents
          .sort((a,b) => a.compareTo(b, 'prov:startedAtTime'))});
        this.recordsService.getRecordingsOfPerformance(performance)
        .then(recordings => { 
          Promise.all( recordings.map(rec => this.recordsService.getUrlsOfRecording(rec).then(urls => rec.fields['urls'] = urls)) )
          .then(() => this.recordings = recordings)
        })});
  }

  goBack(): void {
    this.location.back();
  }
}

