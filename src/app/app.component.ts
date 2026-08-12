import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import {
  MsalModule,
} from '@azure/msal-angular';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [
        MsalModule,
        RouterOutlet,
        RouterModule,
        CommonModule,
        ToastModule,
        FormsModule
    ],
    providers: [MessageService]
})
export class AppComponent {

  constructor(
  ) { }
}