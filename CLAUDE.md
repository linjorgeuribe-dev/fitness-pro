# Fitness Pro — contexto central

PWA local-first de entrenamiento en gimnasio. Idioma del producto y de la documentación: **español**.

## Comandos
- `npm run dev` · `npm run build` (tsc + vite) · `npm run preview` (puerto 4173)
- `npm test` (Vitest, motores) · `npm run e2e` (Playwright, requiere build previo; usa Chrome del sistema)
- `python3 scripts/build-data.py <exercises.json> <dir_traducciones>` regenera `public/data/`

## Reglas del proyecto
1. **Sin simulaciones**: no se agregan botones, integraciones ni datos que no funcionen de verdad. Lo pendiente va a `docs/KNOWN_ISSUES.md` y `docs/ROADMAP.md`, no a la interfaz.
2. **Pesos siempre en kg** en la base; se convierten al mostrar (`toDisp`/`fromDisp` en `src/lib/store.ts`).
3. **La lógica vive en `src/engine/`** (funciones puras, con prueba en `tests/`). Las pantallas no calculan.
4. **La app nunca cambia cargas sola**: `suggest()` devuelve sugerencia + motivo; el usuario decide.
5. Estimaciones (1RM, recuperación) se rotulan como estimaciones en la interfaz.
6. Contenido de ejercicios: solo fuentes con licencia verificada (`docs/MEDIA_LICENSES.md`). Nada generado por IA se publica como técnicamente correcto sin revisión.
7. Objetivos táctiles ≥ 44 px, contraste AA, todo control con nombre accesible.
8. Tras cambiar código: `npm test && npm run build && npm run e2e`. No dar por terminada una función solo porque se ve bien.

## Mapa
- `src/engine/` prescripción, generador, sobrecarga, analítica, cálculos
- `src/lib/` tipos, Dexie (IndexedDB), catálogo, estado
- `server/core.ts` API de cuentas/sincronización (pura, probada con PGlite) · `netlify/functions/api.ts` adaptador · `migrations/` SQL
- `src/lib/sync.ts` sincronización del cliente
- `src/anim/` animaciones esquemáticas: `rig.ts` (cinemática), `moves.ts` (posturas por ejercicio), `Figure.tsx` (dibujo)
- `src/pages/` pantallas · `src/components/` UI, mapa anatómico, gráficas
- `public/data/` catálogo generado · `public/media/ex/` fotos WebP
- Documentación en `docs/` (arquitectura, decisiones, datos, pruebas, pendientes)
