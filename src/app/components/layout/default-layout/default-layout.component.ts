import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ToastModule } from 'primeng/toast';
import { AppService } from '../../../services/app.service';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../services/theme.service';
import { ProgressBarComponent } from '../../primeng/progress-bar/progress-bar.component';
import { SidebarMenuItem } from '../../../app.interfaces';
import { sidebarData } from '../../../app.utils';
import { SidebarComponent } from '../../primeng/sidebar/sidebar.component';
import { NavbarComponent } from '../../primeng/navbar/navbar.component';
const { AppProps } = environment;

@Component({
    selector: 'app-default-layout',
    imports: [NavbarComponent, RouterOutlet, ToastModule, CommonModule, ProgressBarComponent, SidebarComponent],
    templateUrl: './default-layout.component.html',
    styleUrl: './default-layout.component.scss'
})
export class DefaultLayoutComponent implements OnInit {
  public includeNavBar = signal<boolean | undefined>(false);
  public logoSrc = signal<string>(`/assets/logo/${AppProps.logoFile}`);
  public sidebarData: SidebarMenuItem[] = sidebarData;
  public hideHeader: boolean = AppProps.hideSidebarHeader;
  constructor(public appService: AppService, private themeService: ThemeService,private route: ActivatedRoute){ 
    this.themeService.isDarkTheme.set(this.themeService.isDarkTheme());
  }
  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.includeNavBar.set(data['includeNavBar']);
    });
  }
}
