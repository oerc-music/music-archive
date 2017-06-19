import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class RecordsService {
  private recordsUrl = '/assets/data/urls.json';
  private records:object[] = [];

  constructor(private http: Http) { }

  getRecords(): Promise<object[]> {
    return this.http.get(this.recordsUrl)
             .toPromise()
             // get all names files then concat
             .then(response => Promise.all(
                    response.json().map(url => this.http.get(url)
                       .toPromise().then(response => this.records = this.records.concat(response.json()['annal:entity_list'])))).then(res=> this.records as object[]))
             .catch(this.handleError);
  }
  getWork(id:string): Promise<object> {
    return this.getRecords().then(records => records.find(record => record['annal:type_id']=='Performed_work' && record['annal:id']==id));
  }
  getWorks(): Promise<object[]> {
    return this.getRecords().then(records => records.filter(record => record['annal:type_id']=='Performed_work'));
  }
  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }
}
