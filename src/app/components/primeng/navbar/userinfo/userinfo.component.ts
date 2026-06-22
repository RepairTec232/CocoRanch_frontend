import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppService } from '../../../../services/app.service';
import { AvatarComponent } from '../../avatar/avatar.component';

@Component({
    selector: 'app-userinfo',
    imports: [AvatarComponent, CommonModule],
    templateUrl: './userinfo.component.html',
    styleUrl: './userinfo.component.scss'
})
export class UserinfoComponent {
  constructor(public appService: AppService){ }
}
