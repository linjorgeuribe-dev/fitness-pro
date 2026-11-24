# Seguridad

## Modelo
La app funciona sin cuenta y sin enviar datos. Con cuenta (opcional), perfil, rutinas, sesiones y peso corporal se copian a Postgres (Neon) mediante una función de Netlify (`/api/*`).

## Controles implementados
- **Contraseñas**: scrypt (N=16384, r=8, p=1) con sal aleatoria por usuario; mínimo 10 caracteres; comparación en tiempo constante.
- **Sesiones**: token aleatorio de 256 bits en cookie `HttpOnly; Secure; SameSite=Lax`; en la base solo se guarda su SHA-256; vence a los 30 días; se invalida al cerrar sesión.
- **CSRF**: toda petición que modifica datos exige cabecera `Origin` igual al origen del sitio y cuerpo JSON.
- **Fuerza bruta**: 8 intentos fallidos por correo y 30 por IP cada 15 min; 5 registros por IP por hora. Mismo mensaje exista o no el correo.
- **Aislamiento**: cada consulta filtra por el `user_id` de la sesión; probado que un usuario no lee ni pisa datos de otro.
- **Inyección**: solo consultas parametrizadas. **XSS**: React escapa todo; CSP `script-src 'self'`.
- **Validación**: tipo, id y tamaño de cada registro; límites de 2 MB por petición y 300 kB por registro.
- **Secretos**: `DATABASE_URL` vive como variable secreta en Netlify; no está en el repositorio ni en el frontend.
- **Privacidad**: eliminar cuenta (pide contraseña) borra todo en cascada; exportación completa en JSON desde el dispositivo.
- **Cabeceras**: CSP, `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- **Dependencias**: 0 vulnerabilidades en producción (`npm audit --omit=dev`).

## Límites conocidos
- La autenticación es propia (no un proveedor externo auditado). Antes de abrir al público conviene una revisión de seguridad externa.
- Sin recuperación de contraseña (requiere servicio de correo), sin verificación de correo y sin segundo factor.
- El registro revela si un correo ya tiene cuenta (mensaje 409).
- Sin RLS en Postgres: el aislamiento depende del código de la función (una sola credencial de base).
- Sin copias de seguridad propias: se depende de la retención de Neon (6 h en plan gratis).
- La tabla `auth_attempts` no se purga sola todavía.
