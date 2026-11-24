# Hoja de ruta y estado real

| Fase | Contenido | Estado |
|---|---|---|
| 1 | Auditoría de recursos y comparativa | ✅ hecho |
| 2 | Arquitectura, sistema de diseño, documentación base | ✅ hecho |
| 3 | Cuentas, sincronización entre dispositivos (Neon + Functions, RLS), eliminación de cuenta | ⏳ pendiente |
| 4 | Biblioteca: 868 ejercicios con fotos e instrucciones en español, mapa anatómico | ✅ hecho (campos extra pendientes, abajo) |
| 5 | Generador de rutinas por reglas (2–6 días, tiempo, equipo, prioridades), editar/duplicar/importar/exportar/compartir/imprimir | ✅ hecho · métodos avanzados y periodización ⏳ |
| 6 | Entrenamiento en vivo: registro, RIR, temporizador con sonido/vibración, pausa, autoguardado, sustituir, notas, resumen | ✅ hecho · voz ⏳ |
| 7 | Progreso: indicadores, calendario, récords, 1RM estimado, distribución muscular, alertas de desequilibrio, CSV; sobrecarga progresiva explicada | ✅ hecho |
| 8 | Entrenador virtual con IA (proveedor desacoplado) | ⏳ pendiente (requiere backend y llave de API) |
| 9 | Nutrición, sueño, medidas, fotos; integraciones | ⏳ pendiente (solo peso corporal hoy) |
| 10 | Rendimiento, seguridad, pruebas | ✅ primera ronda medida (`TESTING.md`) |
| 11 | Despliegue | ver `DEPLOYMENT.md` |

## Pendiente dentro de la biblioteca
Por ejercicio faltan: errores frecuentes, respiración, tempo, estabilizadores, nombres alternativos, variantes curadas. La fuente no los trae y no se inventan; requieren redacción y revisión por un profesional. Panel administrativo: depende de la fase 3.

## Integraciones (viabilidad)
| Integración | PWA | Requiere |
|---|---|---|
| Apple HealthKit / Apple Watch | No | App nativa iOS |
| Health Connect / Samsung Health / Galaxy Watch | No | App nativa Android |
| Garmin, Fitbit, Strava | Sí (OAuth) | Backend + alta como desarrollador y aprobación del proveedor |
| Google Calendar | Sí (OAuth) | Backend + proyecto en Google Cloud |
