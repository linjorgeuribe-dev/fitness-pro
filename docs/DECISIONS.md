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
| 9 | Animación = alternancia de 2 fotos reales (inicio/fin) | Es lo que la licencia y la exactitud permiten hoy | GIF/3D generados sin revisión biomecánica |
