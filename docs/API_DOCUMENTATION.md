# Interfaces

## Archivos estáticos
- `GET /data/exercises.json` → `{ meta, items: Exercise[] }`
- `GET /data/instructions.json` → `{ [id]: string[] }`
- `GET /media/ex/{id}/{0|1}.webp`

## Formatos de intercambio
- Rutina: `{ "app": "fitness-pro", "routine": Routine }`
- Respaldo: `{ app, version, exportedAt, profile[], routines[], sessions[], body[] }`
- CSV de progreso: `fecha, sesion, ejercicio, exercise, serie, peso_{unidad}, repeticiones, rir, calentamiento, nota`

## API de cuentas (`/api/*`, Netlify Function `netlify/functions/api.ts`, lógica en `server/core.ts`)
Todas las respuestas son JSON. Las peticiones POST exigen `Content-Type: application/json` y mismo origen. Errores: `{ "error": "mensaje" }`.
| Método y ruta | Cuerpo | Respuesta |
|---|---|---|
| `POST /api/register` | `{ email, password }` | 201 `{ email }` + cookie · 400 · 409 · 429 |
| `POST /api/login` | `{ email, password }` | 200 `{ email }` + cookie · 401 · 429 |
| `POST /api/logout` | `{}` | 200 |
| `GET /api/me` | — | 200 `{ email }` · 401 |
| `POST /api/sync` | `{ since, changes: [{ kind, id, data, deleted }] }` | 200 `{ changes, cursor, more }` · 400 · 401 |
| `POST /api/account/delete` | `{ password }` | 200 · 401 |

Desarrollo local: `node scripts/local-server.mjs` sirve `dist/` y la API con Postgres embebido (PGlite).
