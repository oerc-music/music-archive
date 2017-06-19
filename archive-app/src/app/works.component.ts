import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { RecordsService } from './records.service';
 
@Component({
  selector: 'my-works',
  templateUrl: './works.component.html'
})
export class WorksComponent implements OnInit {
  records: object[];

  constructor(private recordsService: RecordsService) { }

  ngOnInit(): void {
    this.recordsService.getRecords().then(records => this.records = records);
  }
}
