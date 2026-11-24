# Fitness Pro

Aplicación web instalable (PWA) para entrenar en gimnasio: rutinas generadas por reglas, registro en vivo con temporizador, historial, progreso y sugerencias de sobrecarga progresiva. Funciona sin conexión y guarda los datos en el dispositivo.

## Requisitos
Node 22+, npm 10+. Para e2e: Google Chrome instalado.

## Uso
```bash
npm install
npm run dev        # desarrollo
npm run build      # producción en dist/
npm run preview    # sirve dist/ en http://localhost:4173
npm test           # 34 pruebas unitarias
npm run e2e        # 7 pruebas end-to-end (tras build)
```
Despliegue: ver `docs/DEPLOYMENT.md`. Estado real de cada módulo: `docs/ROADMAP.md` y `docs/KNOWN_ISSUES.md`.

## Capturas
Capturas reales generadas por las pruebas e2e en `docs/capturas/`.
