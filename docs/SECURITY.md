# Seguridad (v0.1, sin backend)
- **Superficie**: sitio estático; no hay servidor, cuentas, secretos ni API. No se envían datos personales fuera del dispositivo.
- **Cabeceras** (`netlify.toml`): CSP estricta (`script-src 'self'`, sin inline), `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- **Entradas**: importación de rutinas y respaldos validada por estructura; React escapa todo el texto; sin `dangerouslySetInnerHTML`.
- **Dependencias**: `npm audit` — ver resultado en `TESTING.md`.
- **Privacidad**: borrar todo desde Perfil; exportación completa en JSON.
- **Riesgo residual**: los datos viven en el navegador; borrar datos del sitio o perder el teléfono los elimina (mitigación actual: respaldo manual; definitiva: sincronización, fase 3).
- **Para la fase 3**: autenticación, RLS, validación en servidor, límites de tasa, secretos solo en variables de entorno, revisión OWASP ASVS.
