# Despliegue
Sitio estático. `netlify.toml` define build (`npm run build`), carpeta `dist`, redirección SPA, cabeceras de seguridad y caché.

0. Sitio: `fitness-pro-app-w2d4` (team Jorge Uribe), enlazado a `linjorgeuribe-dev/fitness-pro` rama `main`: cada push publica. Variable secreta `DATABASE_URL` (Neon, proyecto `fitness-pro`) en contexto producción.
1. Conectar el repositorio a un sitio de Netlify (o `netlify deploy --prod --dir dist`).
2. Verificar tras desplegar: abrir, completar onboarding, instalar como app, activar modo avión y registrar una serie.

**Mantenimiento**: `npm outdated` mensual; regenerar catálogo si cambia la fuente; revisar `KNOWN_ISSUES.md`. El service worker se actualiza solo (`autoUpdate`).
