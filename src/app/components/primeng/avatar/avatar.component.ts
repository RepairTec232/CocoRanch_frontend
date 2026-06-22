import { CommonModule } from '@angular/common';
import { Component, Input, signal } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';

@Component({
    selector: 'app-avatar',
    imports: [AvatarModule, CommonModule],
    templateUrl: './avatar.component.html',
    styleUrl: './avatar.component.scss'
})
export class AvatarComponent {
  @Input() fullName: string | undefined;
  @Input() image: string | undefined = undefined;

  getInitials(): string {
    if (this.fullName) {
      const nameArray = this.fullName?.split(' ');
      const filteredArray = nameArray?.filter(name => name.trim() !== '');
      const initials = filteredArray?.map(name => name.charAt(0).toUpperCase()).join('');
      return initials||"Guest";
    }else{
      return 'Guest';
    }
  }
}
