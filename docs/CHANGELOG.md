# Cambios
## 0.9.0 — 2026-11-27
- **435 de 868 ejercicios con animación** (antes 331); en fuerza y powerlifting, 435 de 615.
- Perfil: 24 plantillas nuevas (curls de muñeca con mano articulada, crunch con piernas elevadas, navaja, encogimiento sentado, press con impulso y thruster, press de pecho en polea de pie, pull through, glute-ham, hiperextensión inversa, peso muerto a una pierna, sentadilla búlgara, sentadilla de rodillas, sentadilla con salto, prensa de pantorrilla, patada de glúteo en cuatro puntos, buenos días sentado, drag curl, curls acostado y en banco inclinado boca abajo, entre otras).
- Frente: aperturas inclinado al frente (tronco en escorzo), rotaciones interna/externa de hombro, desplante lateral, jalón alto sumo y variantes a un brazo.
- Tabla `EXACT` de asignación por nombre exacto para variantes que comparten patrón; una prueba verifica que cada nombre exista en el catálogo.

## 0.8.0 — 2026-11-27
- **Vista de frente y desde arriba** para el maniquí (`src/anim/front.tsx`): elevaciones laterales, encogimientos, aperturas con mancuernas y poleas, cruces de poleas, pec deck, aperturas posteriores, inclinaciones laterales, sentadilla plié, aductores/abductores y curl en polea alta. La leyenda indica la vista.
- 12 plantillas de perfil nuevas: pullover, crunch inverso, crunch en polea, hiperextensión, remo invertido, remo con pecho apoyado, patada de glúteo en polea, curl femoral de pie, rueda abdominal, curl concentrado, press alternado y elevación frontal sobre la cabeza.
- **331 de 868 ejercicios con animación** (antes 264).

## 0.7.0 — 2026-11-27
- **Animación esquemática en 264 de 868 ejercicios** (antes 10): 10 ajustados a mano + 254 por 39 plantillas de patrón de movimiento (`src/anim/templates.ts`: sentadilla, zancada, peso muerto, bisagra, press de banca/hombro, fondos, dominada, jalón, remos, curls, extensiones de tríceps, abdominales, pantorrilla, etc.).
- La asignación es conservadora (`templateFor`): solo fuerza/powerlifting y solo cuando el nombre identifica un patrón que el maniquí de perfil representa bien. El resto conserva sus fotos, sin animación.
- Pruebas: cada movimiento generado se valida (largos de hueso, apoyos fijos, rangos de codo/rodilla, nada bajo el piso ni fuera de cuadro).

## 0.6.0 — 2026-11-27
Animaciones esquemáticas propias (maniquí dibujado por programa, músculos resaltados y clave técnica) en 10 ejercicios de prueba. Ver `src/anim/`.

## 0.5.1 — 2026-11-25
El selector de ejercicios recuerda músculo y filtros entre aperturas; en el entrenamiento en vivo se pueden agregar varios ejercicios seguidos sin que se cierre; las versiones nuevas se aplican solas al abrir la app.

## 0.5.0 — 2026-11-24
Todas las fotos de ejercicios con tratamiento uniforme: persona a color y entorno atenuado hacia el fondo de la app.

## 0.4.0 — 2026-11-24
Crear rutina propia eligiendo ejercicios (selección múltiple), renombrar/agregar/quitar días, y borrar rutinas directamente desde la lista con confirmación.

## 0.3.0 — 2026-11-24
Nutrición y cuerpo: diario de calorías y macros con objetivos orientativos, agua, sueño, energía y recuperación; medidas corporales y % de grasa estimado; fotos de progreso privadas (solo en el dispositivo). Sexo opcional en el perfil. Corrección: toques muy seguidos al registrar series o agua ya no pueden pisarse entre sí.

## 0.2.0 — 2026-11-24
Cuentas opcionales (correo y contraseña) y sincronización entre dispositivos; eliminar cuenta; «Ya tengo cuenta» en el onboarding. Al sustituir un ejercicio, las series ya hechas se quedan con el original.

## 0.1.0 — 2026-11-23
Primera versión: onboarding, biblioteca de 868 ejercicios en español con fotos, mapa anatómico, generador de rutinas, entrenamiento en vivo, progreso, sobrecarga progresiva, herramientas, PWA offline, pruebas y documentación.
