# Problemas y límites conocidos
1. **Cuentas sin recuperación de contraseña**: no hay servicio de correo; quien olvide su contraseña conserva sus datos en el dispositivo pero no puede entrar desde otro. Tampoco hay verificación de correo.
   **Sincronización**: gana la última escritura por registro; editar la misma rutina en dos dispositivos sin conexión conserva solo una versión.
   **Nutrición sin base de alimentos**: calorías y macros se escriben a mano desde la etiqueta; no hay buscador ni lector de código de barras.
   **Fotos de progreso solo locales**: se pierden si se borran los datos del navegador o se cambia de teléfono.
2. **Traducción en revisión**: nombres e instrucciones traducidos automáticamente; puede haber términos mejorables.
   **Animaciones esquemáticas**: 435 de 868 ejercicios (10 a mano y el resto por plantilla de patrón, de perfil, de frente o desde arriba). Varias variantes comparten plantilla: no distinguen agarre, ancho de pies ni inclinación del banco, y los curls de muñeca «sobre banco» se muestran sentado. Sin animación quedan 433: en fuerza 180 (levantamientos con kettlebell tipo cargada/arrancada/envión, giros y rotaciones de tronco, molinos, ejercicios con pelota o suspensión, cuello, máquinas particulares e isométricos) y las categorías completas de estiramiento (123), pliometría (61), halterofilia (34), strongman (21) y cardio (14). Las posturas las definió el desarrollador, sin revisión de un entrenador todavía.
3. **Demostración = 2 fotos**, no video. Algunas fotos de la fuente son de baja resolución.
4. **Fotos sin conexión**: solo quedan disponibles las que ya se vieron con conexión (el resto muestra un aviso). Texto e interfaz sí funcionan completos offline.
5. **Temporizador en segundo plano**: el aviso sonoro depende de que el navegador mantenga la pestaña activa; no hay notificaciones push. Se pide mantener la pantalla encendida (Wake Lock) donde se soporta.
6. **iOS**: vibración no disponible en Safari.
7. Cambiar el perfil no modifica rutinas existentes; hay que generar una nueva.
8. Lighthouse se midió sobre la pantalla de primera visita (onboarding), no sobre pantallas con datos.
9. Probado en Chrome (móvil emulado y escritorio). **Falta** Safari, Firefox y teléfonos reales.
10. Catálogo con pocos ejercicios de glúteo/aductores/abductores como músculo principal.
