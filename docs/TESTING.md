# Pruebas y resultados (2026-11-23)

| Tipo | Herramienta | Resultado |
|---|---|---|
| Unitarias (motores, catálogo, nutrición) | Vitest | 47/47 |
| API de cuentas y sincronización sobre Postgres embebido | Vitest + PGlite | 15/15 |
| End-to-end móvil (Pixel 7 emulado, Chrome) | Playwright | 10/10 |
| End-to-end escritorio 1280 px | Playwright | 1/1 |
| Tipos | `tsc` estricto | sin errores |
| Dependencias de producción | `npm audit --omit=dev` | 0 vulnerabilidades |
| Dependencias de desarrollo | `npm audit` | 4 moderadas (herramientas de build/pruebas; no llegan al usuario) |

## Flujos e2e cubiertos
1. Onboarding → inicio → empezar → registrar peso/reps/RIR → temporizador (+15, saltar) → heredar valores → **recargar a mitad de sesión sin perder datos** → ver técnica → sustituir ejercicio → pausar/reanudar → finalizar → resumen con volumen correcto → la rutina avanza de día → historial → descarga CSV. Falla si hay cualquier error de consola.
2. Explorar: búsqueda, sin resultados, mapa muscular, filtros, detalle con instrucciones e imagen cargada.
3. Rutinas: generar, editar (persiste tras recarga), duplicar, eliminar.
4. Herramientas (discos, 1RM), tema claro, borrar todos los datos.
5. **Sin conexión**: la app abre, inicia entrenamiento, registra serie y muestra el catálogo.
7. **Cuenta con dos dispositivos**: registrar en A, entrar en B desde el onboarding (contraseña incorrecta rechazada), B recibe perfil e historial, B borra una rutina y A lo recibe, la sesión sobrevive a recargar, cerrar sesión conserva datos locales, eliminar cuenta impide volver a entrar.
8. **Nutrición y cuerpo**: objetivos calculados, alimento con kcal automáticas, agua, sueño, energía, persistencia tras recargar, resumen en inicio, medidas con % de grasa estimado, foto guardada/abierta/eliminada.
9. **Rutina propia**: crear con 2 días, elegir y quitar ejercicios en el selector, agregar y quitar días, persistencia, iniciar entrenamiento con ella, borrar desde la lista (cancelar y confirmar).
6. Escritorio: navegación lateral, sin desborde horizontal en las 5 secciones.

## Lighthouse 13 (móvil simulado, build de producción en local)
| Página | Rendimiento | Accesibilidad | Buenas prácticas | LCP | CLS | TBT |
|---|---|---|---|---|---|---|
| `/` (primera visita) | 99 | 100 | 100 | 2.1 s | 0 | 0 ms |
| `/explore` (primera visita) | 99 | 100 | 100 | 2.2 s | 0 | 0 ms |

Ambas mediciones caen en la pantalla de onboarding porque Lighthouse entra sin perfil. INP no se mide en laboratorio. Falta medir pantallas con datos y en teléfono real de gama media.

## No probado todavía
Safari/iOS, Firefox, teléfonos físicos, lector de pantalla manual, sesiones largas (cientos de entrenamientos), importación de archivos maliciosos más allá de la validación de estructura.
