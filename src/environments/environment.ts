export const environment = {
    Production: false,
    apiUrl: '/api',
    // apiUrl: 'http://localhost:8080/api',

    DebugMode: true,

    ActiveDirectory: {
        auth: {
            clientId: '<clientId>',
            authority: 'https://login.microsoftonline.com/<tenantId>',
            redirectUri: 'http://localhost:4200'
        },
        defaultScopes: ['user.read'],
        forceRefresh: true,
        refreshTokenExpirationOffsetSeconds: 3000 
    },
    AppProps:{
        //navType: "white-1",
        //navType: "blue",
        //navType: "blue-1",
        navType: "white", 
        logoFile: 'logo-fidel.svg',
        bannerFile: "banner.jpg",
        useLoginScreen: true,
        hideSidebarHeader: true,
    }
}