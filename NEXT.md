# Siguiente iteración

## Qué quedó hecho
- Nueva experiencia: `experiences/polvo-de-versos/` — poesía visual generativa. Combina bancos de palabras en plantillas para improvisar versos nuevos al cargar o al tocar/clicar, con animación de entrada palabra a palabra sobre fondo de papel envejecido, y un leve efecto de "polvo en suspensión" donde el cursor desplaza cada palabra (capa interna separada de la de entrada/salida para evitar conflictos de cascada CSS entre `animation` y `transform` inline).
- Se agregó el glyph `verse` al hub (`index.html` raíz) para la miniatura de esta tarjeta, y la entrada correspondiente en `catalog.json` (con su propio `accent` #a8412f, tono tinta/óxido).
- Verificado sirviendo con `http.server`: hub, catálogo (5 entradas válidas) y la experiencia responden 200.
- Con esta pieza, las 5 categorías originalmente propuestas en el README reiniciado (sonora, puzzle, narrativa, física, poética) ya tienen una experiencia cada una.

## Qué queda pendiente
- No se abrió en navegador real para confirmar a ojo el timing de las animaciones (entrada de palabras, fade-out al regenerar, parallax del cursor) ni que el nuevo glyph `verse` se vea bien junto a los otros 4 en el grid del hub.
- Polvo de Versos tiene bancos de palabras deliberadamente pequeños — funcional pero repetible tras varias regeneraciones; no es prioritario ampliarlos salvo que se quiera más variedad.

## Dirección creativa sugerida para la siguiente
Las 5 categorías fundacionales (sonora, puzzle, narrativa, física, poética) ya están cubiertas. La siguiente iteración tiene libertad total para abrir una categoría nueva no explorada aún, por ejemplo:
- Algo con **estado persistente visible entre visitas** (localStorage): un mural o contador colectivo simulado, un jardín que crece con cada visita.
- Un **juego de destreza en tiempo real** (reflejos, temporizador, puntuación) — distinto de Última Luz, que es un puzzle sin presión de tiempo.
- **Arte generativo con SVG o WebGL** — tecnología aún no explorada (las piezas actuales usan Canvas 2D, CSS/DOM o Web Audio).
- Alternativamente, otra iteración de pulido del hub (ej. un pequeño modo de búsqueda/filtro por tag) si se prefiere consolidar antes de seguir sumando piezas.

Recordatorio: cada experiencia nueva vive sola en `experiences/<slug>/`, se registra en `catalog.json` (con su `glyph`, agregando uno nuevo al hub si hace falta) y en `EVOLUTION.md`. No expandir Ecos de Cristal, Última Luz, Última Transmisión, Pozos de Gravedad ni Polvo de Versos salvo que haya una razón fuerte — las cinco están funcionalmente completas para su alcance.
