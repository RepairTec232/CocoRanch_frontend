import { effect, Inject, Injectable, OnDestroy, OnInit, signal } from '@angular/core';
import { AccountInfo, AuthenticationResult, EventMessage, EventType, InteractionStatus, RedirectRequest } from '@azure/msal-browser';
import { ThemeService } from './theme.service';
import { MSAL_GUARD_CONFIG, MsalBroadcastService, MsalGuardConfiguration, MsalService } from '@azure/msal-angular';
import { GraphService } from './graph.service';
import { environment } from '../../environments/environment';
import { AditionalUserData } from '../app.interfaces';
import { filter, Subject } from 'rxjs';
import { Logger } from '../app.utils';
const { AppProps } = environment;
@Injectable({
  providedIn: 'root'
})
export class AppService implements OnDestroy {
    private isLoadingUserData = signal<boolean>(false);
    private readonly _destroying$ = new Subject<void>();
    public activeAccount = signal<AccountInfo | null>(null);
    public accountData = signal<AditionalUserData | null>(null);
    public userProfilePicture = signal<string | undefined>(undefined);
    public navbarType = signal<string>(AppProps.navType);
    public isLoadingAD = signal<boolean>(true);
    public isSidebarMenuVisible = signal<boolean>(false);
    constructor(
        @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
        private msalService: MsalService,
        private themeService: ThemeService,
        private graphService: GraphService,
        private msalBroadcastService: MsalBroadcastService
    ) {
        this.subscribeToMsalEvents();
        this.initializeSession();   
    }
    ngOnDestroy(): void {
      this._destroying$.next(undefined);
      this._destroying$.complete();
    }
    /* MSAL */
    private initializeSession(): void {
        this.checkAndSetActiveAccount();
    }

    private subscribeToMsalEvents(): void {
        this.msalService.handleRedirectObservable().subscribe();
        this.msalService.instance.enableAccountStorageEvents(); 
        this.msalBroadcastService.msalSubject$.pipe().subscribe((result: EventMessage)=>{
            //Logger.info("Event AAD Detected:", result.eventType);
        })
        this.msalBroadcastService.msalSubject$.pipe(filter((event:EventMessage)=> event.eventType === EventType.LOGIN_SUCCESS)).subscribe((result: EventMessage)=>{
            const account = (result.payload as AuthenticationResult).account;
            this.setActiveAccount(account);
            window.location.pathname = "/";
        })
        this.msalBroadcastService.msalSubject$.pipe(filter((event: EventMessage) => event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS)).subscribe((result: EventMessage) => {
            const account = (result.payload as AuthenticationResult).account;
            this.setActiveAccount(account);
        })
        this.msalService.instance.addEventCallback((event: EventMessage) => {//Escucha los eventos login
            if (
                event.eventType === EventType.LOGIN_START || 
                event.eventType === EventType.ACQUIRE_TOKEN_START
            ) {
                this.isLoadingAD.set(true);
            } else if (
                event.eventType === EventType.LOGIN_SUCCESS || 
                event.eventType === EventType.LOGIN_FAILURE || 
                event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS || 
                event.eventType === EventType.ACQUIRE_TOKEN_FAILURE
            ) {
                this.isLoadingAD.set(false);
            }
        });
    }

    checkAndSetActiveAccount() {
        let activeAccount = this.msalService.instance.getActiveAccount();
        let activeAccounts = this.msalService.instance.getAllAccounts();
        //Logger.info("checkAndSetActiveAccount", {activeAccount,activeAccounts})
        if (
            !activeAccount &&
            activeAccounts.length > 0 
        ) {
            this.setActiveAccount(activeAccounts[0]);
        }else if(!this.activeAccount()) {
            this.setActiveAccount(activeAccount);
        }else if(!activeAccount && activeAccounts.length === 0) {
            this.isLoadingAD.set(false);
        }else{
        }
    }

    public setActiveAccount(account: AccountInfo | null): void {
        if(!account){
            this.isLoadingAD.set(false);
        }else{
            this.activeAccount.set(account);
            this.msalService.instance.setActiveAccount(account);
            this.loadAditionalUserData();
        }
    }

    private async loadAditionalUserData(): Promise<void> {
        if (this.isLoadingUserData()) return;
        try {
            this.isLoadingUserData.set(true);
            this.msalService.initialize();
            this.accountData.set(
                await this.graphService.loadAditionalUserData()
            );
            this.isLoadingUserData.set(false);
            this.isLoadingAD.set(false);
        } catch (error) {
            console.error('Error', error);
        }
    }
    /* Global methods */

    toggleSidebarMenu(): void {
        this.isSidebarMenuVisible.set(!this.isSidebarMenuVisible());
    }

    public getThemeClass(baseName: string | undefined): string {
        const isDark = this.themeService.isDarkTheme();
        if(baseName){
            let newClass = `${baseName} ${baseName}-${this.navbarType()}`;
            if(isDark) {
              newClass = `${baseName} ${baseName}-dark`;
            }
            return newClass;
        }
        return isDark ? "dark" : this.navbarType();
    }
  
    public loginRedirect() {
        if (this.msalGuardConfig.authRequest) {
        this.msalService.loginRedirect({
          ...this.msalGuardConfig.authRequest,
        } as RedirectRequest);
      } else {
        this.msalService.loginRedirect();
      }
    }

    /*public showUserInfoAAD() {
        Logger.info("showAddiionalData",{
            accountData:this.accountData(),
            activeAccount: this.activeAccount()
        });
    }*/

    public logout() {
        this.msalService.logoutRedirect();
    }
}