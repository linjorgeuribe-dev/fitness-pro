# Arquitectura

## Resumen
SPA React 19 + TypeScript + Vite 8, estilos con Tailwind 4, datos en IndexedDB (Dexie), PWA con Workbox (vite-plugin-pwa). Sin backend en la v0.1: **local-first**.

```
┌────────────── Navegador / PWA instalada ──────────────┐
│ pages/ (pantallas) ──► engine/ (reglas puras, probadas)│
│      │                         ▲                        │
│      ▼                         │                        │
│ lib/store (hooks) ──► Dexie ──► IndexedDB (perfil,      │
│                                 rutinas, sesiones, peso)│
│ lib/catalog ──► /data/*.json + /media/ex/*.webp         │
│ Service Worker: precache app+catálogo, CacheFirst fotos │
└────────────────────────────────────────────────────────┘
        (fase 3) sincronización opcional ──► Netlify Functions ──► Neon (Postgres)
```

## Por qué local-first
En el gimnasio la señal falla. Si el registro depende de un servidor, se pierden series. Aquí cada cambio se escribe en IndexedDB al instante (autoguardado) y el temporizador de descanso usa hora de fin persistida, así sobrevive a recargas y bloqueo de pantalla.

## Módulos
| Carpeta | Responsabilidad |
|---|---|
| `engine/prescription` | series/reps/descanso/RIR por objetivo y nivel |
| `engine/generator` | reparto por días, selección por patrón de movimiento y equipo, recorte por tiempo, alternativas |
| `engine/overload` | doble progresión con explicación; descarga si hay 3 sesiones a la baja |
| `engine/analytics` | volumen, series por músculo, récords, recuperación estimada, desequilibrios, CSV |
| `engine/calc` | 1RM (Epley), discos, kg↔lb |

## Carga y rendimiento
Rutas con `lazy()`; catálogo (184 kB JSON, 868 ejercicios) separado de instrucciones (590 kB, se pide al abrir un detalle); fotos WebP 480 px (~14 kB) con `loading="lazy"`.

## Plataformas
Android, iPhone, tablet y escritorio vía navegador; instalable donde el navegador soporta PWA. Una app nativa (Capacitor) solo hace falta para HealthKit/Health Connect — ver `ROADMAP.md`.
