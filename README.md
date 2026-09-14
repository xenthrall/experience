# Experience

**`experience`** es un laboratorio de experiencias web independientes: arte generativo, juegos, instrumentos musicales, simulaciones, poesía visual, narrativas interactivas, interfaces experimentales — cualquier pieza interactiva que valga la pena construir y explorar en un navegador.

No es un único sitio con un único propósito. Es una **colección viva** que crece con el tiempo, donde cada pieza es un mundo propio con su propia identidad, tecnología y personalidad.

## El Hub de Experiencias

La puerta de entrada al proyecto es `index.html`, en la raíz del repositorio: una **landing/galería** que presenta una tarjeta por cada experiencia disponible (título, una línea que la describe, quizá una miniatura o vista previa animada).

Al elegir una tarjeta, el usuario es **transportado** a esa experiencia mediante navegación real de página — no un modal, no un iframe. Cada experiencia ocupa su propia URL y su propia página completa.

## Arquitectura del repositorio

```text
/
├── index.html              # Landing — el Hub de Experiencias
├── experiences/
│   ├── catalog.json         # Catálogo: metadatos de cada experiencia
│   ├── <slug-experiencia>/
│   │   ├── index.html       # Punto de entrada de la experiencia
│   │   ├── ...               # CSS, JS, assets, o build propio
│   └── <otro-slug>/
│       └── ...
├── EVOLUTION.md             # Registro de la evolución creativa del laboratorio
├── README.md
└── .github/workflows/       # Despliegue a GitHub Pages
```

Cada experiencia vive en `experiences/<slug>/` con su propio `index.html` como punto de entrada. Todo lo que necesite — estilos, scripts, assets, incluso un proceso de build propio — vive dentro de esa misma carpeta.

## Independencia entre experiencias

Cada experiencia es **autocontenida y desacoplada** del resto:

- Puede usar la tecnología que mejor le sirva: HTML/CSS/JS puro, Canvas, WebGL, SVG, una librería, un framework, un build step propio — lo que la idea requiera.
- Puede tener su propia estética, su propio lenguaje de interacción y su propia estructura interna, sin obligación de ser coherente con ninguna otra experiencia.
- No debe depender de código compartido con otras experiencias ni con el hub, salvo una librería común creada deliberadamente cuando existan patrones reales y repetidos entre varias piezas — nunca como anticipación especulativa.
- Se puede borrar o reescribir por completo sin afectar a ninguna otra experiencia ni al hub.

La única pieza compartida entre todas es el catálogo (`experiences/catalog.json`), que existe únicamente para que el hub sepa qué tarjetas mostrar.

## Cómo se agrega una nueva experiencia

1. Crear la carpeta `experiences/<slug-descriptivo>/` con su `index.html` (y lo que necesite) como pieza autocontenida y funcional.
2. Añadir una entrada en `experiences/catalog.json` con sus metadatos (slug, título, descripción breve, fecha, y cualquier campo adicional útil como tags o color de acento).
3. El Hub (`index.html`) lee `catalog.json` en tiempo de carga y renderiza automáticamente una tarjeta nueva — no requiere tocar el HTML del hub.
4. Registrar la experiencia en `EVOLUTION.md`.

## Catálogo de experiencias

`experiences/catalog.json` es la fuente de verdad de qué experiencias existen y en qué orden/forma se presentan en el hub. Es un array de objetos simple, legible y fácil de extender — el hub simplemente lo consume vía `fetch` y construye la galería en el DOM.

## Despliegue estático

Todo el proyecto —hub y cada experiencia— es un sitio **100% estático**: HTML, CSS, JS y assets, sin backend ni base de datos. Se despliega automáticamente vía **GitHub Pages + GitHub Actions** (`.github/workflows/deploy.yml`) al hacer push a `main`.

Una experiencia puede apoyarse en Node/npm durante desarrollo o build si lo necesita, siempre que el resultado final publicado sean archivos estáticos servibles directamente por GitHub Pages.

## `EVOLUTION.md`

Es el diario del laboratorio: un registro breve, iteración a iteración, de qué experiencia nueva se creó (o qué evolución significativa recibió una existente), qué la hace interesante y qué direcciones quedan abiertas para explorar después. Sirve como memoria creativa — para no repetir una idea ya explorada y para que cualquier agente que llegue al repositorio entienda de un vistazo el recorrido del proyecto.

## Principios para futuras iteraciones

- **Prioriza crear sobre acumular**: cada iteración vale más por una experiencia nueva, completa y sorprendente que por agregar funciones a una ya existente.
- **Desacopla, no combines**: una experiencia no necesita integrarse con las demás. Su valor está en ser su propio mundo.
- **Varía de familia**: visual, lúdica, narrativa, sonora, generativa — explora categorías distintas de una iteración a otra en vez de repetir el mismo tipo de pieza.
- **Calidad ante todo**: una experiencia debe funcionar de verdad antes de darse por terminada. Código roto no es una opción.
- **Mantén el mapa actualizado**: catálogo y `EVOLUTION.md` deben reflejar siempre el estado real del laboratorio.
- **La única restricción dura es técnica**: el resultado final siempre debe poder servirse como sitio estático en GitHub Pages. Todo lo demás —concepto, tecnología, estética, alcance— es terreno libre.
