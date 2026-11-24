# Datos

## Local (IndexedDB, base `fitness-pro`, versión 1) — vigente
| Tabla | Clave | Índices | Contenido |
|---|---|---|---|
| `profile` | `id='me'` | — | objetivo, nivel, días, minutos, equipo, prioridades, unidades, tema |
| `routines` | `id` | `updatedAt` | nombre, reparto, `days[].items[]` (exId, series, repMin, repMax, descanso, RIR), favorita, `nextDay` |
| `sessions` | `id` | `status`, `start` | rutina, día, inicio/fin, pausas, `items[].sets[]` (w en kg, r, rir, done, warm), notas |
| `body` | `id` | `date` | peso corporal por fecha (kg) |

Tipos en `src/lib/types.ts`. Migraciones: nuevas `version(n).stores()` de Dexie. Respaldo/restauración: JSON completo desde Perfil → Ajustes y datos.

## Servidor (Neon, proyecto `fitness-pro`, Postgres 18) — vigente
Migración: `migrations/001_init.sql`.
| Tabla | Contenido |
|---|---|
| `users` | `id`, `email` único, `pass_hash` (scrypt con sal) |
| `auth_sessions` | hash SHA-256 del token de sesión, usuario, vencimiento (30 días) |
| `records` | documento por `(user_id, kind, id)`: `data` jsonb, `deleted` (lápida), `rev` (secuencia global, cursor de sincronización) |
| `auth_attempts` | intentos para limitar registro e inicio de sesión |

`kind` ∈ profile, routine, session, body: los mismos objetos que guarda el dispositivo. Borrar un usuario elimina en cascada sesiones y registros.

**Sincronización**: el cliente compara la huella de cada registro local con la última sincronizada, envía cambios y lápidas, y recibe lo que tenga `rev` mayor a su cursor. Conflicto: gana la última escritura por registro; al enlazar un dispositivo por primera vez gana el servidor. IndexedDB v2 añade `synced` (huellas) y `kv` (cuenta, cursor).
