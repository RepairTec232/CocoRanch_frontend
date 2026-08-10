# CoppelframeworkWebclientAngularspa18

Contexto:
Aprovechando el estandar de Angular Universal builder como compilador se crea el template con opción de --ssr 
con el fín de incluir las configuraciones necesarias y paquetes para la configuracion SSR de Angular.

## Tipo de distribuible <CSR>
Si tu opción requiere despliegue de archivos estáticos (CSR): 
1.La imagen docker del pipeline debe construirse con el tag "target final-static" (requerido)
2.Remover paquetes de express (requerido para minimizar el bundle)
3.Debes asegurarte de remover estas propiedades del archivo angular.json (requerido) 
{//architect/build/options
    "server": "src/main.server.ts",
    "prerender": true,
    "ssr": {
        "entry": "server.ts"
    }
}

## Tipo de distribuible <SSR>
Si tu opción requiere despliegue de un servidor con SSR:
1.La imagen docker del pipeline debe construirse con el tag "target final-server". (requerido)
2.Debes asegurarte que existan estas tres propiedades en el archivo angular.json (requerido)
{//architect/build/options
    "server": "src/main.server.ts",
    "prerender": true,
    "ssr": {
        "entry": "server.ts"
    }
}

## Tipo de distribuible <SERVER-CSR> (Backend for frontend)
Si tu opción requiere despliegue de un servidor con CSR para añadir configuraciones backend for frontend:
1.La imagen docker del pipeline debe construirse con el tag "target final-server". (requerido)
2.Debes asegurarte que existan estas tres propiedades en el angular.json (requerido)
{//architect/build/options
    "server": "src/main.server.ts",
    "prerender": true,
    "ssr": {
        "entry": "server-csr.ts" <- Cambia para SSR
    }
}





En conclución añadiendo o removiendo las 3 propiedades del archivo angular.json para SSR/SERVER-CSR es posible tener un compilado estandarizado solo teniendo en consideración que:
Si se añaden las propiedades de SSR o SERVER-CSR el archivo que debe distribuir el frontend se encuentra dentro de "dist/server/server.mjs" el cual es un servidor de node que debe ser instanciado en el despliegue.
En caso contrario (Solo CSR) el archivo siempre será "dist/browser/index.html"

## Configuración de nginx SSR/SERVER-CSR

# server {
#    listen 80 default_server;
#    listen [::]:80 default_server;
#
#    root /sysx/progs/browser;
#
#    server_name _;
#    server_tokens off;
#
#    error_log /var/log/nginx/error.log;
#    access_log /var/log/nginx/access.log;
#
#    location / {
#        proxy_pass http://127.0.0.1:4000;
#        proxy_http_version 1.1;
#        proxy_set_header Upgrade $http_upgrade;
#        proxy_set_header Connection "upgrade";
#        proxy_set_header Host $host;
#        proxy_cache_bypass $http_upgrade;
#    }
#
#    location ~* \.(conf|inc|ini|log|sh|phar|properties|ht|htaccess)$|/\. {
#        deny all;
#        log_not_found off;
#        access_log off;
#        return 404;
#    }
#
#    location = /favicon.ico {
#        log_not_found off;
#        access_log off;
#    }
# }

## Configuración de nginx Static CSR

# server {
#    listen 80 default_server;
#    listen [::]:80 default_server;
#
#    root /sysx/progs/browser;
#    index index.html
#
#    server_name _;
#    server_tokens off;
#
#    error_log /var/log/nginx/error.log;
#    access_log /var/log/nginx/access.log;
#
#    location / {
#        add_header Strict-Transport-Security "max-age=31536000";
#        add_header Access-Control-Allow-Origin "*";
#        add_header X-XSS-Protection "1; mode=block";
#        add_header X-Content-Type-Options "nosniff";
#        add_header X-Frame-Options "SAMEORIGIN";
#        try_files $uri $uri/ /index.html;
#    }
#
#    location ~* \.(conf|inc|ini|log|sh|phar|properties|ht|htaccess)$|/\. {
#        deny all;
#        log_not_found off;
#        access_log off;
#        return 404;
#    }
#
#    location = /favicon.ico {
#        log_not_found off;
#        access_log off;
#    }
# }


### Arquitectura de Diseño y Frontend ###