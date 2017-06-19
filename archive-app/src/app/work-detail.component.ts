import 'rxjs/add/operator/switchMap';
import { Component, OnInit }      from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Location }               from '@angular/common';

import { RecordsService }  from './records.service';
@Component({
  selector: 'work-detail',
  template: `<h3 *ngIf="work">Work</h3>
    `
})
export class WorkDetailComponent implements OnInit {
  work: object;
  records: object[];

  constructor(
    private recordsService: RecordsService,
    private route: ActivatedRoute,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.route.params
      .switchMap((params: Params) => this.recordsService.getWork(params['id']))
      .subscribe(work => this.work = work);
  }

  goBack(): void {
    this.location.back();
  }
}

