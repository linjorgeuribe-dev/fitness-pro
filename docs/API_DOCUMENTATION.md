# Interfaces
No hay API de servidor en v0.1.

## Archivos estáticos
- `GET /data/exercises.json` → `{ meta, items: Exercise[] }`
- `GET /data/instructions.json` → `{ [id]: string[] }`
- `GET /media/ex/{id}/{0|1}.webp`

## Formatos de intercambio
- Rutina: `{ "app": "fitness-pro", "routine": Routine }`
- Respaldo: `{ app, version, exportedAt, profile[], routines[], sessions[], body[] }`
- CSV de progreso: `fecha, sesion, ejercicio, exercise, serie, peso_{unidad}, repeticiones, rir, calentamiento, nota`
