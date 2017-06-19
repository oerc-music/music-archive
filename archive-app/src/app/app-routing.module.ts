import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { WorksComponent } from './works.component';
import { WorkDetailComponent } from './work-detail.component';

const routes: Routes = [
  { path: '', redirectTo: '/works', pathMatch: 'full' },
  { path: 'works',  component: WorksComponent },
  { path: 'work/:id', component: WorkDetailComponent }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}

