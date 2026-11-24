# Catálogo de ejercicios

- **Fuente**: free-exercise-db (github.com/yuhonas/free-exercise-db), dominio público.
- **Publicados**: 868 de 876 (se omiten 8 sin instrucciones o sin dos fotos).
- **Proceso**: `scripts/build-data.py` normaliza equipo y nivel, une la traducción y genera `public/data/exercises.json` (índice) e `instructions.json`.
- **Campos**: `id`, `n` (español), `e` (inglés), `eq` equipo, `lv` nivel 1–3, `f` fuerza, `m` mecánica, `c` categoría, `p` músculos principales, `s` secundarios, `g` n.º de fotos, `tr` traducido.
- **Traducción**: automática (12 lotes, verificación de mismo n.º de pasos por ejercicio). Estado editorial: **En revisión** — falta lectura humana de un entrenador.
- **Distribución**: fuerza 584, estiramiento 123, pliometría 61, powerlifting 38, halterofilia 35, strongman 21, cardio 14 (antes de omisiones).
- **Huecos conocidos**: pocos ejercicios con glúteo, aductores y abductores como principal; sin TRX como categoría; cardio escaso.
- **Agregar ejercicios hoy**: editar la fuente JSON + traducción y regenerar. Panel administrativo pendiente (fase 3).
