import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class RecordsService {
  private recordsUrl = '/assets/data/records.json';

  constructor(private http: Http) { }

  getRecords(): Promise<object[]> {
    return this.http.get(this.recordsUrl)
             .toPromise()
             .then(response => response.json()['annal:entity_list'] as object[])
             .catch(this.handleError);
  }
  getWork(id:string): Promise<object> {
    return this.getRecords().then(records => records.find(record => record['annal:type_id']=='Performed_work' && record['annal:id']==id));
  }
  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }
}
