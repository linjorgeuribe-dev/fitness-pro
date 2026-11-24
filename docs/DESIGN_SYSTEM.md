# Sistema de diseño

Tokens en `src/index.css` (variables CSS + `@theme` de Tailwind 4). Tema oscuro por defecto, claro opcional.

| Token | Oscuro | Claro | Uso |
|---|---|---|---|
| `bg` | #0e1013 | #f5f2ec | fondo |
| `surface` / `raised` | #171a1f / #20242b | #ffffff / #ece8df | tarjetas / controles |
| `line` | #2c313a | #d9d4c8 | bordes |
| `ink` / `mute` | #f4f1ea / #a3a8b3 | #16181c / #5a6070 | texto |
| `ember` | #ff6a33 | #c93f0b | acción principal, músculo principal |
| `amber` | #f5b83d | #8a5a00 | músculo secundario, avisos |
| `ok` / `bad` | #4fd28a / #ff7b7b | #0f7a45 / #b3261e | completado / destructivo |

**Tipografía**: Manrope (interfaz) y Barlow Condensed (cifras, clase `.num`, tabulares). Autoalojadas.
**Forma**: tarjetas radio 20 px; controles 16 px; chips en píldora.
**Tacto**: mínimo 44 px; controles de registro 56 px; acciones clave abajo, al alcance del pulgar.
**Movimiento**: entradas de 240–280 ms; se desactiva con `prefers-reduced-motion`.
**Componentes** (`src/components/ui.tsx`): Button (primary/soft/ghost/danger), Card, Chip, Sheet (diálogo inferior), Stat, Empty, Field, Page.
**Código de color anatómico**: principal = ember, secundario = amber, intensidad de volumen = mezcla ember→raised. Estabilizadores: sin datos en la fuente, no se muestran.
**Patrones**: navegación inferior de 5 accesos en móvil, lateral en ≥ 768 px; estados vacíos con siguiente paso; confirmación para todo lo destructivo.
