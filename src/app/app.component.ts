import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  MsalModule,
} from '@azure/msal-angular';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [
        MsalModule,
        RouterOutlet,
        ToastModule
    ],
    providers: [MessageService]
})
export class AppComponent {

  constructor(
  ) { }
}