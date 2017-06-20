import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { RecordsService } from './records.service';
import { Entity } from './entity';
 
@Component({
  selector: 'my-works',
  templateUrl: './works.component.html'
})
export class WorksComponent implements OnInit {
  works: Entity[];

  constructor(private recordsService: RecordsService) { }

  ngOnInit(): void {
    this.recordsService.getWorks()
    .then(works => this.works = works.sort((a,b) => a.compareTo(b,'rdfs:label')));
  }
}
