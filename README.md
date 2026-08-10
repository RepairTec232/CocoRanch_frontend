# @coppelframework/webclient-angularspa18

Este proyecto fue generado originalmente con [Angular CLI](https://github.com/angular/angular-cli) versión `18.2.13` y actualmente está actualizado a la versión `19.2.14`

**@coppelframework/webclient-angularspa18** es un template basado en Angular 19, proporcionando un punto de partida robusto para aplicaciones web empresariales. Está diseñado con las mejores prácticas y convenciones actuales, facilitando el mantenimiento, escalabilidad e integración rápida de equipos de desarrollo. Este template utiliza PrimeNG para componentes reutilizables y está adaptado al sistema de diseño Coltrane.

---

## Prerrequisitos

- `NodeJS v20.x` o superior.
- `Git`.

---

## Dependencias

Instalar de forma global:

```bash
npm install -g @angular/cli
```

---

## Plugins recomendados para VSCode

- `Angular Essentials`
- `ESLint`
- `GitLens`
- `Prettier - Code formatter`
- `SonarLint`

Consulta la documentación oficial de cada plugin para más detalles.

---

## Descargar e instalar la plantilla

Descarga la plantilla desde el repositorio oficial:

```bash
git clone <url-del-repositorio>
cd coppelframework-webclient-angularspa18
npm install
```

Para ejecutar localmente:

```bash
npm start
```

La aplicación estará disponible en `http://localhost:4200`.

---

## Tipos de Distribuible

Este template permite generar tres tipos diferentes de distribuibles usando Angular Universal builder:

### CSR (Client Side Rendering)
- Usado para archivos estáticos.
- Imagen Docker debe usar tag: `final-static`.
- Remover paquetes de express.
- Remover propiedades en `angular.json`:
```json
"server": "src/main.server.ts",
"prerender": true,
"ssr": {
    "entry": "server.ts"
}
```

### SSR (Server Side Rendering)
- Para renderizado en servidor.
- Imagen Docker debe usar tag: `final-server`.
- Asegúrate que existan estas propiedades en `angular.json`:
```json
"server": "src/main.server.ts",
"prerender": true,
"ssr": {
    "entry": "server.ts"
}
```

### SERVER-CSR (Backend for Frontend)
- Para aplicaciones CSR que necesitan configuración dinámica backend.
- Imagen Docker debe usar tag: `final-server`.
- Configura estas propiedades en `angular.json`:
```json
"server": "src/main.server.ts",
"prerender": true,
"ssr": {
    "entry": "server-csr.ts"
}
```

Dependiendo del tipo, la distribución estará en:
- SSR o SERVER-CSR: `dist/server/server.mjs`
- CSR: `dist/browser/index.html`

---

## Configuración NGINX

### Para SSR/SERVER-CSR

```nginx
server {
    listen 80 default_server;
    root /sysx/progs/browser;
    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Para Static CSR

```nginx
server {
    listen 80 default_server;
    root /sysx/progs/browser;
    index index.html;
    location / {
        add_header Strict-Transport-Security "max-age=31536000";
        add_header Access-Control-Allow-Origin "*";
        add_header X-XSS-Protection "1; mode=block";
        add_header X-Content-Type-Options "nosniff";
        add_header X-Frame-Options "SAMEORIGIN";
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Estructura del proyecto (Scaffolding)

### src
Contiene componentes standalone, servicios, pipes y configuraciones para Angular 19.

### app
- **layout**: estructura principal (navbar, sidebar, progress-bar).
- **primeng**: componentes reutilizables (avatar, navbar, sidebar, progress-bar, etc.).
- **routes**: rutas protegidas y login.

### services
- **AppService**: sesión Active Directory y estado global.
- **GraphService**: integración Microsoft Graph.
- **ThemeService**: manejo dinámico de temas.

### pipes
- **timeAgo**: formateo relativo del tiempo.

### environments
Archivos de configuración por ambiente (`development` y `production`).

---

## Servidor de desarrollo
```bash
npm start
```

Inicia servidor local en `http://localhost:4200`.

---

## Construir distribuible (Build)
```bash
npm run build
```
Genera distribuible en carpeta `dist/`.

---

## Pruebas Unitarias
```bash
npm test
```

---

## Comandos Angular CLI
- Crear módulo:
```bash
ng generate module module-name --routing
```
- Crear componente:
```bash
ng generate component component-name
```

---

## Autenticación
Autenticación con **Azure Active Directory** vía `AppService`.

---

## Gestión dinámica de Temas
Soporta temas claro/oscuro con `ThemeService`.

---

## Seguridad
Implementa headers seguros, CSP y DOMPurify para sanitización.
Utiliza AcquireTokenSilent del paquete MSAL para obtener tokens necesarios para validaciones de servicios de backend. 
Permite configuraciones backend for frontend para tener la capacidad de cubrir requerimientos especiales.

---

## Más ayuda
Para más información `ng help` o [Angular CLI README](https://github.com/angular/angular-cli).

---

## Actualización desde versiones anteriores
Consulta la documentación oficial: [Developers/frameworks/webclientV3/mantenimiento](https://sites.google.com/coppel.com/developers/frameworks/v3/mantenimiento).
