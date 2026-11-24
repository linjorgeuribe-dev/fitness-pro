# Datos

## Local (IndexedDB, base `fitness-pro`, versión 1) — vigente
| Tabla | Clave | Índices | Contenido |
|---|---|---|---|
| `profile` | `id='me'` | — | objetivo, nivel, días, minutos, equipo, prioridades, unidades, tema |
| `routines` | `id` | `updatedAt` | nombre, reparto, `days[].items[]` (exId, series, repMin, repMax, descanso, RIR), favorita, `nextDay` |
| `sessions` | `id` | `status`, `start` | rutina, día, inicio/fin, pausas, `items[].sets[]` (w en kg, r, rir, done, warm), notas |
| `body` | `id` | `date` | peso corporal por fecha (kg) |

Tipos en `src/lib/types.ts`. Migraciones: nuevas `version(n).stores()` de Dexie. Respaldo/restauración: JSON completo desde Perfil → Ajustes y datos.

## Servidor (fase 3, propuesto, no implementado)
Postgres en Neon: `users`, `profiles`, `routines`, `routine_items`, `sessions`, `sets`, `body_entries`, `exercises`, `muscles`, `equipment`, `media`, `sources_licenses`, con RLS por `user_id`, `updated_at` para sincronización «última escritura gana» por registro y borrado lógico.
