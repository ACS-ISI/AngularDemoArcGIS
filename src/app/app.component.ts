import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';

interface ITab {
  name: string;
  link: string;
}

@Component({
  selector: 'app-root',
  imports: [NgFor, RouterOutlet, RouterLink, RouterLinkActive, MatTabsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  readonly tabs: ITab[] = [{
    name: 'Home',
    link: '/home'
  }, {
    name: 'Map',
    link: '/map'
  }];
}
