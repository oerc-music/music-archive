import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';

import { Entity } from './entity';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class RecordsService {
  private recordsUrl = 'assets/data/urls.json';
  private records:Entity[] = [];
  private rawRecords:object[] = [];

  constructor(private http: Http) { }

  getRecords(): Promise<Entity[]> {
    return this.http.get(this.recordsUrl)
             .toPromise()
             // get all names files then concat
             .then(response => Promise.all(
                    response.json().map(url => this.http.get(url)
                       .toPromise().then(response => this.rawRecords = this.rawRecords.concat(response.json()['annal:entity_list'])))).then(res=> this.fixRecords()))
             .catch(this.handleError);
  }
  private fixRecords(): Entity[] {
    //console.log('fixRecords '+this.records.length);
    var rs = this.rawRecords.reverse();
    this.records = [];
    var ids = {};
    for (let r of rs) {
      let id = r['annal:type_id']+'/'+r['annal:id'];
      if (ids[id]===undefined) {
        ids[id] = r;
        this.records.push(new Entity(r));
        //console.log('added '+id);
      }
    }
    return this.records;
  }
	getEntity(type_id:string, id:string): Promise<Entity> {
		 return this.getRecords().then(records =>
			records.find(record => record.type_id==type_id && record.id==id));
	}
  getWork(id:string): Promise<Entity> {
	return this.getEntity('Performed_work', id);
  }
  getWorks(): Promise<Entity[]> {
    return this.getRecords().then(records => records.filter(record => record.type_id=='Performed_work'));
  }
	getPerformancesOfWork(work:Entity): Promise<Entity[]> {
		return this.getRecords().
			then(records => records.filter
			(record => 'Performance'==record.type_id &&
			record.getValues('frbroo:R25F_performed_r','frbroo:R25F_performed').indexOf(work.type_id+'/'+work.id)>=0));
	}
	getPerformance(id:string): Promise<Entity> {
		return this.getRecords().then(records => records.find(record => record.type_id=='Performance' && record.id==id));
	}
	getSubEvents(entity:Entity): Promise<Entity[]> {
		let eventids = entity.getValues('event:sub_event');
		var subevents = [];
		return Promise.all(eventids.map(eventid => 
		{
			let parts = eventid.split('/');
			this.getEntity(parts[0], parts[1])
			.then(e => { 
				if (e) subevents.push(e);
				else {
					console.log('Error: could not find subevent '+parts[0]+'/'+parts[1]);
				}
			})
		})).then(() => subevents); 
	}
  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }
}
