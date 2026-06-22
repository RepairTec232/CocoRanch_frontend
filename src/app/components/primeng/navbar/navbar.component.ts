import { Component, HostListener, Input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { TimeAgoPipe } from '../../../pipes/time-ago.pipe';
import { AppService } from '../../../services/app.service';
import { ThemeService } from '../../../services/theme.service';
import { SearchInputComponent } from './search-input/search-input.component';
import { ThemeSwitchComponent } from './theme-switch/theme-switch.component';

import { InputTextModule } from 'primeng/inputtext';
import { UserinfoComponent } from './userinfo/userinfo.component';
import { Notifications, SearchOptions } from '../../../app.utils';
import { Notification, SearchOption } from '../../../app.interfaces';

import { RouterModule } from '@angular/router';


@Component({
    selector: 'app-navbar',
    imports: [
        SearchInputComponent,
        ThemeSwitchComponent,
        InputTextModule,
        UserinfoComponent,
        CommonModule,
        TimeAgoPipe,
        RouterModule
    ],
    standalone: true,
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  accountConfigUrl: string = "https://portal.office.com/account/";
  @Input() type = signal<string | null>(null);
  @Input() logoSrc = signal<string>("white");
  isNotificationsVisible = signal<boolean>(false);
  isUserMenuVisible = signal<boolean>(false);
  searchOptions = signal<SearchOption[]>(SearchOptions);
  notifications = signal<Notification[]>(Notifications);
  viewAllNotifications = signal<boolean>(false);
  constructor(
    private router: Router,
    public messageService: MessageService,
    public appService: AppService,
    public themeService: ThemeService
  ){ }


  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {//Identifica clicks para ocultar elementos
    const target = event.target as HTMLElement;
    
    if (
      this.isNotificationsVisible() &&
      !target.closest('.notifications-dropdown') &&
      !target.closest('.navbar-icon.pi-bell')
    ) {
      this.isNotificationsVisible.set(false);
    }

    if (
      this.isUserMenuVisible() &&
      !target.closest('.user-dropdown') &&
      !target.closest('.navbar-icon.pi-user')
    ) {
      this.isUserMenuVisible.set(false);
    }

  }


  toogleViewAllNotifications(): void {
    this.viewAllNotifications.set(!this.viewAllNotifications());
  }

  toggleTheme(): void {
    this.themeService.isDarkTheme.set(!this.themeService.isDarkTheme());
  }

  onBlurNotifications(): void {
    this.isNotificationsVisible.set(false);
  }

  onBlurUserMenu(): void {
    this.isUserMenuVisible.set(false);
  }
  
  toggleNotifications(): void {
    this.isNotificationsVisible.set(!this.isNotificationsVisible());
    if (this.isNotificationsVisible()) {
      this.isUserMenuVisible.set(false);
    }
  }
  getNotifications(): Notification[] {
    if(this.viewAllNotifications()) return Notifications;
    return this.notifications();
  }
  onClickNotification(index:number): void {
    let selectedNotification = this.notifications().find((el,i)=>i===index);
    if(selectedNotification) this.messageService.add({ 
      severity: selectedNotification?.type, 
      summary: selectedNotification?.title, 
      detail: selectedNotification?.text, 
      icon: selectedNotification?.icon 
    });
    this.notifications.set(this.notifications().filter((_,i)=>i!==index));
    this.isNotificationsVisible.set(false);
  }

  toggleUserMenu(): void {
    this.isUserMenuVisible.set(!this.isUserMenuVisible());
  }

  navTo(path: String): void {
    this.router.navigate([`/${path}`]);
  }
  
  userConfigRedirect(): void {
    window.open(this.accountConfigUrl, '_blank');
  }

  logout(): void {
    this.isUserMenuVisible.set(false);
    let userName = this.appService.accountData()?.givenName;
    this.messageService.add({ 
      severity: 'info', 
      summary: 'Cerrando sesión', 
      detail: `${userName || this.appService.activeAccount()?.name} para cerrar completamente la sesión selecciona tu cuenta activa en la ventana emergente.` 
    });
    setTimeout(()=>this.appService.logout(),1500);
  }
}
