import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { WorksComponent } from './works.component';
import { WorkDetailComponent } from './work-detail.component';
import { PerformanceDetailComponent } from './performance-detail.component';

const routes: Routes = [
  { path: '', redirectTo: '/works', pathMatch: 'full' },
  { path: 'works',  component: WorksComponent },
  { path: 'work/:id', component: WorkDetailComponent },
  { path: 'performance/:id', component: PerformanceDetailComponent }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}

