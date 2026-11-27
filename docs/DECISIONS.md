# Decisiones arquitectónicas

| # | Decisión | Motivo | Alternativa descartada |
|---|---|---|---|
| 1 | Vite + React SPA en vez de Next.js | La app es 100 % cliente y offline; SSR no aporta y complica el service worker | Next.js |
| 2 | Local-first con IndexedDB (Dexie) | Registro fiable sin señal; cero costo de servidor en v0.1 | Supabase como fuente primaria |
| 3 | Backend futuro: Netlify Functions + Neon | Son las cuentas que ya usa el propietario; evita un proveedor más | Supabase, Vercel |
| 4 | Catálogo base: free-exercise-db | Dominio público (Unlicense), 2 fotos por ejercicio, redistribuible | wger (licencias mixtas por recurso), bases comerciales |
| 5 | Generador por reglas, sin IA | Verificable, determinista, gratis, funciona offline | LLM |
| 6 | Pesos almacenados en kg | Cambiar de unidad no corrompe el historial | guardar en unidad del usuario |
| 7 | Gráficas SVG propias | ~2 kB frente a ~100 kB de una librería | Recharts |
| 8 | Se omiten 8 ejercicios de la fuente sin instrucciones o sin 2 fotos | «Publicado» exige demostración gráfica | publicarlos incompletos |
| 12 | Extender la animación con plantillas por patrón de movimiento y un clasificador conservador por nombre | Una definición probada por patrón cubre muchas variantes; lo que el perfil 2D no representa (plano frontal, rotaciones, olímpicos) se deja sin animación en vez de mostrar algo incorrecto | Definir 868 a mano; animar todo con un patrón aproximado |
| 11 | Animación por programa (maniquí 2D con cinemática inversa) en vez de video | Pesa unos kB, funciona offline, es original y verificable por pruebas (largos de hueso, apoyos, rangos articulares). Interpolar las dos fotos dio dobles imágenes en 8 de 10 | Interpolación de fotos; clips con licencia; IA de video |
| 10 | Fotos con entorno atenuado (no borrado) | El recorte total dejaba a la persona flotando en máquinas y poleas; atenuar conserva el equipo y unifica el aspecto | Recorte sobre fondo liso; ilustración generada |
| 9 | Animación = alternancia de 2 fotos reales (inicio/fin) | Es lo que la licencia y la exactitud permiten hoy | GIF/3D generados sin revisión biomecánica |
