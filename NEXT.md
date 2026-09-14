# Siguiente iteración

## Qué quedó hecho
- Nueva experiencia: `experiences/ultima-luz/` — puzzle tipo "Lights Out". Tablero de celdas donde tocar una invierte su luz y la de sus vecinas; el objetivo es apagarlas todas. Genera tableros siempre solubles (scramble desde el estado resuelto), cuenta movimientos, y sube de nivel (3×3 → 6×6) al resolver. HTML/CSS/JS puro, autocontenido, verificado sirviendo con `http.server` (200 en hub, catálogo y experiencia).
- `catalog.json` y `EVOLUTION.md` actualizados con la nueva entrada.

## Qué queda pendiente
- No se probó en un navegador real con interacción de mouse/touch (solo se verificó que los archivos cargan sin error de red vía curl). La siguiente iteración podría abrir el hub en un navegador y jugar una partida completa para confirmar que el overlay de victoria y el cambio de nivel se sienten bien.
- Última Luz no persiste progreso ni mejor puntaje — podría añadirse localStorage si hace falta continuidad entre visitas, pero no es prioritario.
- El hub sigue sin miniaturas visuales por tarjeta (solo texto + acento de color).

## Dirección creativa sugerida para la siguiente
Categorías aún no exploradas en este hub reiniciado:
- **Narrativa interactiva** de ramas cortas (texto + elecciones, sin audio ni canvas).
- **Poesía visual generativa** con tipografía animada.
- **Simulación física simple** (partículas, gravedad, colisiones) — distinta al viejo terrario.
- Algo con **interacción por teclado** en vez de mouse/touch (las dos piezas actuales son táctiles).

Recordatorio: cada experiencia nueva vive sola en `experiences/<slug>/`, se registra en `catalog.json` y en `EVOLUTION.md`. No expandir Ecos de Cristal ni Última Luz salvo que haya una razón fuerte — ambas están funcionalmente completas para su alcance.
