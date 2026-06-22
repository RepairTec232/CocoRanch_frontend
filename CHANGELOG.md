## v2.0.0 ##

### Actualizaciones ###
- Actualización del core de Angular a versión @19.2.14
- Actualización de la mayoría de dependencias de terceros a sus últimas versiones funcionales
- Se mantiene primeng@17.18.9 sin actualizar para evitar rehacer todos los componentes de diseño

### Compatibilidad ###
- Se ha añadido el comando `"preinstall": "npm config set legacy-peer-deps true"` al package.json para resolver problemas de compatibilidad con dependencias antiguas
- Este comando es necesario para que tanto `npm install` como `npm prune --production` funcionen correctamente en el pipeline de CI/CD
- Los desarrolladores deben mantener este comando en el package.json cuando trabajen con este template o en escenarios similares con dependencias que requieran legacy-peer-deps

## v1.0.0 ##

### Integraciones ###
-Integración con dependencia MSAL y lógica de enrutamiento con Login incluido.
-Integración con dependencia interna coltrane para estilos estandarizados.
-Integración con dependencia prime-ng alineado con coltrane para ejemplos de componentes reutilizables. 
-Integración con dependencia primeicons.
-Integración con dependencia microsoft client para ejemplo de obtencion de datos de sesion.
### Componentes ###
-Layout: Permite definir tu propio layour basado en tus requerimientos (Puedes crear mas si es necesario.)
-primeng: Permite definir componentes integrados con primeng para la reutilización de los mismos.
-routes: Permite definir los componentes de rutas implementados en el proyecto.
### Cambios en versiones anteriores ###
-Se migran componentes a standalone por defecto
-Se habilitan configuraciones de compilación para SSR
-Se habilitan configuraciones de compilación para Backend for frontend
-Se remueven métodos de encriptación para localstorage (Requerimientos especiales pueden migrar a cookies o sesiones)
-Se implementan ejemplos de obtención de token de sesión con MSAL.
