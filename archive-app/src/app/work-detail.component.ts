import 'rxjs/add/operator/switchMap';
import { Component, OnInit }      from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Location }               from '@angular/common';

import { Entity } from './entity';
import { RecordsService }  from './records.service';

@Component({
  selector: 'work-detail',
  templateUrl: './work-detail.component.html'
})
export class WorkDetailComponent implements OnInit {
  work: Entity;
  performances: Entity[] = [];

  constructor(
    private recordsService: RecordsService,
    private route: ActivatedRoute,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.route.params
      .switchMap((params: Params) => this.recordsService.getWork(params['id']))
      .subscribe(work => { this.work = work; 
        this.recordsService.getPerformancesOfWork(work)
        .then(performances => this.performances = performances
          .sort((a,b) => a.compareTo(b, 'prov:startedAtTime')))});
  }

  goBack(): void {
    this.location.back();
  }
}

