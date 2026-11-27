# Cambios
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
