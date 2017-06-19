import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule }    from '@angular/http';

import { AppComponent } from './app.component';
import { WorksComponent } from './works.component';
import { WorkDetailComponent } from './work-detail.component';
import { RecordsService } from './records.service';

import { AppRoutingModule } from './app-routing.module';

@NgModule({
  declarations: [
    AppComponent,
    WorksComponent,
    WorkDetailComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    HttpModule
  ],
  providers: [RecordsService],
  bootstrap: [AppComponent]
})
export class AppModule { }
