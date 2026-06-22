import { Component, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { AppService } from '../../../services/app.service';
import { MessageService } from 'primeng/api';
import { environment } from '../../../../environments/environment';
const { AppProps } = environment;
@Component({
    selector: 'app-login',
    imports: [ButtonModule, CardModule, ToastModule],
    providers: [MessageService],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent{
  public footerTitle = signal<string>("Inicia sesión con tu cuenta de colaborador Active Directory");
  public bannerSrc = signal<string>(`/assets/img/${AppProps.bannerFile}`);
  public logoSrc = signal<string>(`/assets/logo/${AppProps.logoFile}`);

  constructor(public appService: AppService) {
    if(this.appService.activeAccount()) {
      window.location.pathname = '/protected';
    };
  }
}
