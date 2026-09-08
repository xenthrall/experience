# Terrario Digital — Ecosistema Vivo & Evolución (v8.0: Vínculo del Alma & Gran Aurora)

Un simulador de vida artificial y selección natural que corre por completo en el navegador sobre un `<canvas>` 2D de alto rendimiento (acelerado por Spatial Hash Grid a 60 FPS). Sin dependencias ni build step — HTML, CSS y JS estáticos servidos como tres archivos (`index.html`, `styles.css`, `main.js`).

## 🔧 Optimización de arquitectura & corrección de bug crítico

- **Separación de archivos**: todo el proyecto vivía embebido en un único `index.html` de más de 3000 líneas (HTML + `<style>` + `<script>` inline). Se extrajo el CSS a `styles.css` y el JavaScript a `main.js`, dejando `index.html` en ~150 líneas. Mismo comportamiento, cero build step, mucho más fácil de mantener y seguir escalando.
- **Bug corregido — botones que no respondían**: el selector CSS genérico `canvas { position: fixed; inset: 0; ... }` (pensado solo para el lienzo principal `#c`) también alcanzaba al pequeño `<canvas id="popChart">` del gráfico de población. Combinado con el `backdrop-filter` del panel (que crea un *containing block* para elementos `fixed`), el gráfico terminaba estirándose para cubrir **todo el panel de control**, interceptando los clics de absolutamente todos los botones (Audio Vivo, Modo Onírico, Meteoritos, Reiniciar, etc.). Se corrigió acotando la regla a `#c` y fijando `#popChart` con `position: static; pointer-events: none`. Verificado con pruebas automatizadas (Playwright) haciendo clic real en cada botón del panel.

## 🌿 Especies & Red Trófica

1. **🦌 Ciervo Ágil (`HERB_AGILE`)**: Herbívoro de manada (*Boids*). Detecta depredadores, emite ondas de alarma para alertar a la manada, huye en zig-zag y busca refugio o camuflaje en arbustos.
2. **🦏 Titán Acorazado (`HERB_MEGA`)**: Megafauna masiva y resistente. Se alimenta de densos matorrales y se defiende con contraataques espinados si es atacado.
3. **🐺 Cazador de Manada (`CARN_PACK`)**: Depredador ágil con modo de acecho sigiloso, acometidas veloces (*sprint strike*) y descanso/digestión tras alimentarse.
4. **🦖 Depredador Apex (`CARN_APEX`)**: Bestia solitaria y territorial. Caza presas grandes y emite rugidos intimidatorios que dispersan en pánico a las criaturas cercanas.
5. **🦅 Carroñero (`SCAVENGER`)**: Vuela en órbitas majestuosas, localiza restos/cadáveres y los consume, dejando huesos limpios que fertilizan la tierra.
6. **✨ Polinizador (`POLLINATOR`)**: Insectos bioluminiscentes que fertilizan arbustos y dispersan brotes de flora por el terrario.

## 🧠 Inteligencia & Instintos de Supervivencia

- **Metabolismo Completo**: Energía (Hambre), Hidratación (Sed), Resistencia (Stamina) y Salud (HP).
- **Puntos de Agua & Oasis**: Las criaturas deben acudir periódicamente a las orillas a beber agua fresca para no deshidratarse.
- **Camuflaje en Arbustos**: La vegetación densa otorga sigilo, ocultando a las presas de la vista de depredadores lejanos.
- **Ciclo Día / Noche**: Comportamientos nocturnos de sueño/hibernación, ojos brillantes en la oscuridad y bioluminiscencia.
- **Cadáveres & Reciclaje de Nutrientes**: La descomposición de cadáveres genera nuevo suelo fértil con brotes de flores y frutos.
- **Genética Hereditaria & Mutación**: Velocidad, sentidos, tamaño, sigilo, eficiencia de resistencia y pigmentación varían con la selección natural.

## ☄️ Eventos Cósmicos & Mutación

- **Lluvias de Meteoritos**: caen periódicamente del cielo (o se invocan a demanda con el botón `☄️ Meteoritos`), dejando una estela ardiente antes de impactar.
- **Cráteres & Zonas de Mutación**: cada impacto forma un cráter que fertiliza el suelo y una zona de radiación cósmica pulsante que muta genes al azar (velocidad, sentidos, tamaño, sigilo, agresividad) de cualquier criatura que la atraviese, otorgándole además un destello de vigor y una estela de partículas.
- **Audio Generativo Vivo**: activa `🔊 Audio Vivo` para escuchar un paisaje sonoro ambiental (Web Audio API) que muta su acorde y brillo según la hora del día, sopla más fuerte con la lluvia, y reacciona en tiempo real a nacimientos, cacerías e impactos de meteoritos.

## 🍂 Ciclo de Estaciones

- **Un año, cuatro estaciones**: Primavera, Verano, Otoño e Invierno se suceden lentamente (mucho más despacio que el ciclo día/noche) con transición cromática suave (*crossfade*) entre cada una, visible en el tinte del terrario y en la insignia junto al reloj.
- **Metabolismo estacional**: el Invierno acelera el desgaste energético de todas las criaturas (más difícil sobrevivir), mientras la Primavera lo suaviza.
- **Flora dependiente del clima**: la regeneración de comida y bayas se dispara en Primavera/Verano y se reduce drásticamente en Invierno, forzando migraciones y competencia por recursos escasos.
- **Clima ambiental**: pétalos rosados flotan en Primavera, hojas ocres caen en Otoño y una nevada cubre la escena en Invierno — cada partícula con deriva de viento y rotación propia.
- **Paisaje sonoro estacional**: el audio generativo se oscurece y desafina levemente en Invierno y se aclara en Verano, sumándose a las variaciones por hora del día.

## 🌀 Modo Onírico — Arte Generativo & Poesía Visual

- **Botón `🌀 Modo Onírico`**: transforma el terrario en una pieza de arte generativo psicodélico. El lienzo deja de limpiarse por completo cada fotograma y en su lugar se desvanece lentamente, dejando estelas de color tras cada criatura, meteorito y partícula en movimiento.
- **Deriva cromática**: un filtro de rotación de matiz (`hue-rotate`) gira continuamente sobre toda la escena, sumado a saturación y contraste realzados, para que el ecosistema entero mute de paleta en tiempo real.
- **Poesía visual generativa**: cada pocos segundos aparece, con una transición suave, un verso construido a partir del estado vivo del ecosistema (población, generación, especie dominante, estación, hora del día, nacimientos y cacerías) — un poema que nunca se repite igual dos veces.
- **Eco sonoro onírico**: al activarse, el paisaje sonoro generativo gana un bucle de delay/retroalimentación que hace flotar cada acorde, disolviéndose de nuevo en silencio limpio al desactivarlo.

## 👁️ Vínculo del Alma — Modo Encarnación & Control Cinético

- **Botón `👁️ Encarnar` (Panel y Tarjeta Inspector)**: funde tu consciencia directamente en cualquier criatura viva del terrario (o pulsa la tecla `E`).
- **Cámara Sensorial de Seguimiento**: la vista se centra con zoom cinematográfico suave (`1.34×`) siguiendo cada movimiento de la criatura.
- **Latido Cardíaco Generativo & Telemetría ECG**: monitor electrocardiográfico en vivo con trazado de ondas P-Q-R-S-T en tiempo real y sintetizador de pulso biológico sub-grave (`lub-dub`) a través de la Web Audio API, acelerando en momentos de pánico, cacería o agotamiento físico (`48–168 BPM`).
- **Flujo Telepático de Consciencia**: pensamientos poéticos en primera persona generados dinámicamente en función del estado fisiológico (hambre, sed, resistencia, edad, descendencia, cacerías, estatus de leyenda o estación en curso).
- **Radar Sensorial Olfativo**: balizas concéntricas de sonar y vectores direccionales proyectados hacia el agua más cercana (`💧 95m`), vegetación (`🌿 60m`) y amenazas o presas (`⚠️ PELIGRO`).
- **Control Cinético Directo & Instintos Primordiales**: toma el control manual con `WASD` o las flechas de dirección (o clic/arrastre sobre el terreno), o alterna el modo `🤖 Auto-instinto` con la tecla `A`. Pulsa la `Barra Espaciadora` para desatar la habilidad única de la especie:
  - 🦌 **Ciervo Ágil**: *Ráfaga de Sigilo* (nube de esporas de camuflaje que despista depredadores y restaura resistencia).
  - 🦏 **Titán Acorazado**: *Impacto Sísmico* (golpe telúrico que repele carnívoros y germina brotes).
  - 🐺 **Cazador de Manada** / 🦖 **Apex**: *Acometida Voraz* (impulso hiperveloz con rugido intimidatorio de área).
  - 🦅 **Carroñero**: *Ascenso Celestial* (vuelo elevado invulnerable con visión panorámica de osamentas).
  - ✨ **Polinizador**: *Eclosión de Polen* (espiral de esporas que madura arbustos y esparce flora silvestre).
- **Muerte Trascendental**: si la criatura huésped muere mientras tu alma está enlazada, el terrario despliega una secuencia de despedida solemne antes de que su luz ascienda al Firmamento de las Almas.

## 🌌 La Gran Aurora Boreal & Estelas de Feromonas

- **Botón `✨ Aurora`**: invoca un despliegue de auroras boreales cósmicas en la alta atmósfera, con cortinas de luz ondulante en tonos esmeralda (`#00ffa2`), violeta místico (`#a855f7`) y cian glacial (`#38bdf8`), con reflejos que reverberan en las aguas de cada oasis y arpegios cristalinos en el paisaje sonoro.
- **Aparición Natural**: la Aurora Boreal emerge suavemente durante las noches y atardeceres del terrario, intensificándose cuando el Clima Emocional entra en *Renacer* o *Calma*.
- **Estelas Bioluminiscentes de Feromonas**: cada criatura viva deja un rastro efímero de partículas químicas bioluminiscentes a su paso (esporas de menta para herbívoros, ascuas carmesí para depredadores, polvo estelar para polinizadores), tejiendo una pintura generativa en constante disolución.

## 💀 Memoria del Terrario — Persistencia entre Visitas

- **El suelo recuerda**: cada vez que una criatura muere (hambre, sed, vejez o caza), su ubicación, especie y generación quedan grabadas en la memoria del terrario (`localStorage`), sin backend ni servidor — pura persistencia del navegador.
- **Luciérnagas de la memoria**: durante el atardecer y la noche, puntos de luz tenues y parpadeantes aparecen exactamente donde murió cada criatura, coloreados según su especie y con brillo proporcional a su generación — los linajes más evolucionados dejan una marca más intensa.
- **Constelaciones de los caídos**: las muertes más recientes se conectan entre sí con líneas fantasmales, dibujando una constelación efímera que cambia con cada nueva pérdida.
- **Memoria que sobrevive al `Reiniciar`**: pulsar "Reiniciar" reinicia la simulación, pero no borra la memoria — las almas de generaciones anteriores (incluso de visitas anteriores, en días distintos) siguen ahí, acumulándose. Al volver a abrir la página, un mensaje te recuerda cuántas almas habitan ya el terrario.

## 📜 Crónicas del Terrario — Mitología Generativa Persistente

- **Botón `📜 Crónicas`**: abre un pergamino que narra, en prosa generada automáticamente, la historia de cada "era" que ha vivido el terrario.
- **Cada `Reiniciar` sella una era**: al reiniciar la simulación, la era que termina queda archivada para siempre (en `localStorage`) con su duración, nacimientos, cacerías, generación máxima alcanzada, especie dominante, estación en curso, meteoritos caídos, mutaciones cósmicas provocadas y las especies que se extinguieron por completo.
- **Extinciones anunciadas**: cuando una especie desaparece por completo del terrario, aparece un aviso inmediato (`☠️ Extinción: ...`) y ese evento queda registrado en la crónica de la era.
- **Historia acumulativa entre visitas**: las crónicas de eras pasadas —incluso de sesiones anteriores, en otros días— se conservan y se muestran ordenadas de la más reciente a la más antigua, junto a un resumen de vidas totales nacidas y almas descansando en la memoria del suelo.

## 🛠️ Herramientas & Controles Interactivos

- **Inspector de Criaturas**: Haz clic en cualquier criatura para ver su cerebro en vivo (estado actual, barras de necesidades, árbol genealógico y estadísticas genéticas).
- **Barra de Spawn Inferior**: Siembra comida, invoca cualquiera de las 6 especies o crea nuevos estanques con un toque.
- **Gráfico Histórico de Población**: Mini gráfica dinámica en tiempo real que muestra el equilibrio depredador-presa.
- **Clima & Lluvia Fértil**: Activa lluvias que nutren el terreno y aceleran el crecimiento botánico.
- **Modos Visuales**: Alterna conos de visión, emociones flotantes (💭), barras de salud y ciclo día/noche automático.

## 🚀 Desarrollo Local

Abre `index.html` directamente en el navegador, o sírvelo con cualquier servidor estático:

```sh
python3 -m http.server 8000
```
