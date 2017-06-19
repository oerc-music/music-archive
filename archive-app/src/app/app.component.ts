import { Component } from '@angular/core';
 
@Component({
  selector: 'app-root',
  template: `
    <h1>{{title}}</h1>
    <nav>
      <a routerLink="/works" routerLinkActive="active">Works</a>
    </nav>
    <router-outlet></router-outlet>
  `,
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Music Archive';
}
