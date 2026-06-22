import { Injectable } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { Client, GraphError } from '@microsoft/microsoft-graph-client';
import { AditionalUserData } from '../app.interfaces';
import { environment } from '../../environments/environment';
const { ActiveDirectory } = environment;

@Injectable({
  providedIn: 'root',
})
export class GraphService {
  private graphClient: Client;

  constructor(private msalService: MsalService) {
    this.msalService.initialize();
    this.graphClient = Client.init({
      authProvider: async (done) => {
        const account = this.msalService.instance.getActiveAccount();
        if (account) {
          try {
            const response = await this.msalService.instance.acquireTokenSilent({
              account: account,
              scopes: ActiveDirectory.defaultScopes,
              //forceRefresh: ActiveDirectory.forceRefresh, //Forza a regenerar un token nuevo si el valor es true
              //refreshTokenExpirationOffsetSeconds: ActiveDirectory.refreshTokenExpirationOffsetSeconds //Garantiza que el metodo acquireToken pueda refrescar los tokens cada n segundos
            });
            done(null, response.accessToken);
          } catch (error) {
            done(error, null);
          }
        }
      },
    });
  }

  async loadAditionalUserData(): Promise<AditionalUserData> {
    try {
      return await this.graphClient.api('/me?$select=displayName,givenName,surname,employeeId,mail,jobTitle,department,companyName,email').get();
    } catch (error: unknown) {
      if(error instanceof GraphError){
        switch (error.statusCode) {
          case 404:
            console.info("Usuario no encontrado.")
            break;
        
          case 403:
            console.warn("Debes solicitar el permiso necesario.")
            break;
          default:
            console.error("Error inesperado");
            break;
        }
      }
      throw error;
    }
  }
}
