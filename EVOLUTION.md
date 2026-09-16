# Evolución de `experience`

Diario del laboratorio: qué se construyó en cada iteración y qué queda abierto para explorar.

## 2026-09-14 — Construcción del Hub + primera experiencia: Ecos de Cristal

El reinicio arquitectónico (commit `cfb8562`) había definido la visión del Hub de Experiencias en el README, pero el repositorio aún no tenía ningún archivo real: faltaban `index.html` (hub), `experiences/catalog.json` y toda experiencia. Esta iteración construyó esa base:

- **Hub (`index.html`)**: landing minimalista y oscura que hace `fetch` de `experiences/catalog.json` y renderiza una tarjeta por experiencia, con acento de color propio por tarjeta, tags y navegación real (no modal/iframe) a `experiences/<slug>/`.
- **`experiences/catalog.json`**: catálogo inicial con una entrada.
- **Primera experiencia — `experiences/ecos-de-cristal/`**: un instrumento visual-sonoro. Cada toque o arrastre sobre el lienzo dispara una campanilla de cristal (dos osciladores sinusoidales, uno con leve detune como armónico) en una escala pentatónica de tres octavas mapeada horizontalmente a la pantalla, y libera un anillo de luz que se expande y se desvanece con un color derivado de la frecuencia tocada (cian → violeta). Usa Web Audio API + Canvas 2D puro, sin dependencias.

Categoría explorada: sonora/generativa/interactiva — variando respecto al simulador de terrario que dominaba las iteraciones previas al reinicio.

### Direcciones abiertas
- El hub podría beneficiarse de una miniatura animada por tarjeta (por ahora solo texto + acento de color).
- Ecos de Cristal podría ganar un modo de "grabar y repetir" la secuencia tocada, o acordes al mantener varios dedos/clicks.
- Quedan libres las categorías: narrativa interactiva, poesía visual generativa, simulación física.

## 2026-09-14 — Segunda experiencia: Última Luz (puzzle)

Siguiendo la sugerencia de `NEXT.md`, se exploró la categoría de **juego con reglas claras y estado ganar/perder**, ausente hasta ahora en el hub (las piezas previas eran sonoras/generativas sin objetivo).

- **`experiences/ultima-luz/`**: variante de "Lights Out". Un tablero de celdas empieza scrambleado desde el estado resuelto (garantizando siempre solubilidad); tocar una celda invierte su luz y la de sus vecinas ortogonales. El objetivo es apagar todas las luces. Al resolverlo aparece un overlay con el conteo de movimientos y un botón para pasar al siguiente nivel, que crece el tablero (3×3 hasta 6×6) y aumenta el scramble. HTML/CSS/JS puro, un solo archivo, sin dependencias.

Categoría explorada: puzzle/juego con reglas claras — primera pieza del hub con condición de victoria explícita.

### Direcciones abiertas
- El hub sigue sin miniaturas animadas por tarjeta.
- Última Luz podría ganar un contador de "mejor puntaje" persistido en localStorage, o un modo diario con semilla fija.
- Quedan libres: narrativa interactiva, poesía visual generativa, simulación física.

## 2026-09-16 — Tercera experiencia: Última Transmisión (ficción interactiva)

Cubre dos direcciones sugeridas a la vez: **narrativa interactiva** e **interacción por teclado** (las dos piezas previas eran táctiles/mouse).

- **`experiences/ultima-transmision/`**: ficción interactiva ambientada en una estación espacial abandonada que empieza a transmitir un mensaje. El texto se revela con efecto de máquina de escribir sobre una estética de terminal fósforo verde (scanlines, viñeta, resplandor de texto). Las elecciones se muestran numeradas y se seleccionan con las teclas 1-2 o con clic/touch. Grafo de nodos ramificado con 5 finales distintos según las decisiones tomadas. HTML/CSS/JS puro, un solo archivo, sin dependencias ni assets externos.

Categoría explorada: narrativa/texto interactivo con teclado — estética de terminal, contraste deliberado frente al brillo neón de las dos piezas anteriores.

### Direcciones abiertas
- El hub sigue sin miniaturas animadas por tarjeta.
- Última Transmisión podría registrar qué finales ya se vieron (localStorage) para animar a explorar los que faltan.
- Quedan libres: poesía visual generativa, simulación física simple (partículas/gravedad).

## 2026-09-16 — Cuarta experiencia: Pozos de Gravedad (simulación física)

Cubre la dirección de **simulación física simple** que quedaba pendiente desde el reinicio del hub.

- **`experiences/pozos-de-gravedad/`**: un campo continuo de ~260 partículas flota a la deriva sobre un lienzo oscuro con estelas por desvanecimiento de alfa. Al tocar o hacer clic se crea un pozo de gravedad transitorio que atrae las partículas cercanas con una fuerza inversamente proporcional a la distancia; mantener presionado aumenta su intensidad. Los pozos decaen con el tiempo, las partículas rebotan en los bordes y su brillo/color reacciona a su velocidad. Canvas 2D puro, sin dependencias, con soporte táctil y de mouse.

Categoría explorada: simulación física/generativa con interacción directa por toque — primera pieza del hub con física continua (fuerzas, decaimiento, colisión con bordes) en vez de estados discretos.

### Direcciones abiertas
- El hub sigue sin miniaturas animadas por tarjeta (ya son 4 experiencias — buen candidato para una próxima iteración dedicada solo a eso).
- Pozos de Gravedad podría ganar distintos "modos" de partícula (atracción/repulsión alternada) si se quiere expandir, pero no es prioritario.
- Queda libre: poesía visual generativa con tipografía animada.
