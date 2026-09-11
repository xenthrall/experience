# Terrario Digital — Ecosistema Vivo & Evolución (v10.0: El Cenote de Cristal Prismático & El Crisol de Quimeras Trascendentes)

Un simulador de vida artificial, selección natural y arte generativo que corre por completo en el navegador sobre un `<canvas>` 2D de alto rendimiento (acelerado por Spatial Hash Grid a 60 FPS). Sin dependencias ni build step — HTML, CSS y JS estáticos servidos como tres archivos (`index.html`, `styles.css`, `main.js`).

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

## 🌳 El Árbol Ancestral (Yggdrasil del Terrario & Santuario de Paz)

- **Núcleo Místico del Terrario**: En el corazón del mundo crece un árbol milenario con ramas y raíces vivas que respiran y pulsan bioluminiscencia en sincronía con el biorritmo del ecosistema.
- **Santuario Sagrado**: El dosel del árbol proyecta una zona de santuario esmeralda donde impera la paz cósmica: los depredadores se calman y no atacan a sus presas, y toda criatura herida o exhausta regenera energía y salud de forma acelerada.
- **Frutos de Ámbar Eterno**: Las ramas del árbol producen frutos dorados que caen al suelo; cualquier criatura que los consuma obtiene longevidad biológica prolongada y rejuvenecimiento celular.
- **Briznas del Alma (`SoulWisps`)**: Cada criatura que trasciende o perece cerca de las raíces ve su espíritu liberado como una voluta etérea de luz que asciende en espirales hacia el cielo, cantando una nota armónica al fundirse en el firmamento.
- **Modal de Sabiduría Ancestral (`🌳 Yggdrasil` o Tecla `T`)**: Abre un códice interactivo que muestra las eras vividas por el árbol, su vitalidad, almas acogidas y un **lienzo de anillos de crecimiento concéntricos** (`#treeRingCanvas`), dibujados proceduralmente según los años y eras del terrario.
- **Gran Floración Cósmica (`🌸 Florecer`)**: Al desatar la floración desde el modal, el árbol emite una onda expansiva dorada, un arpegio de arpa cósmica y una lluvia torrencial de flores místicas y bayas que reanima y fertiliza todo el mundo.

## 🌑 El Gran Eclipse Cósmico & Ingravidez

- **Alineación Astral Trascendental (`🌑 Eclipse` o Tecla `O`)**: El Sol y la Luna entran en conjunción perfecta sobre el terrario. Los cielos se oscurecen en un violeta abisal, revelando estrellas y constelaciones diurnas mientras la corona solar chisporrotea con llamaradas solares y perlas de Baily generativas.
- **Ingravidez Espiritual**: Durante el punto álgido del eclipse (*totality*), la gravedad se disuelve: las criaturas del terrario flotan suavemente en ingravidez cósmica, rodeadas de estelas de luz estelar.
- **Cántico Tibetano Ancestral**: La alineación viene acompañada de un resonante *singing bowl* tibetano sintetizado en frecuencia áurea (136.1 Hz — Ohm), induciendo un estado de meditación armónica en todo el ecosistema.

## 🌊 Resonancia Cimática del Terreno (Patrones Armónicos de Chladni)

- **Geometría Sagrada Acústica (`🌊 Cimática`)**: Modela matemáticamente las placas de Chladni sobre el sustrato del terrario: $m \cdot \cos(nx) - n \cdot \cos(my) = 0$.
- **Reacción en Tiempo Real**: La frecuencia nodal y el dibujo geométrico de la arena responden activamente al pulso de la simulación, a las notas musicales reproducidas y al estado de ánimo del ecosistema (*Caos*, *Tensión*, *Calma*, *Renacer*), haciendo visible el sonido como líneas doradas sobre el suelo.

## 🎼 Audio Bio-Polifónico Espacial (Web Audio 3D & Nuevos Timbres)

- **Posicionamiento Binaural Estéreo (`StereoPannerNode`)**: Cada sonido en el terrario (pasos, llamadas, meteoritos, mordiscos, bendiciones) se proyecta espacialmente en el estéreo izquierdo/derecho en función exacta de su coordenada horizontal $X$, sumergiendo al usuario en un entorno tridimensional.
- **Nuevos Timbres Sintetizados**:
  - 🪈 *Flauta Pastoral*: Melodías suaves en escala pentatónica para nacimientos y paseos serenos.
  - 🎻 *Cuerdas de Tensión*: Disonancias orgánicas sintetizadas que anuncian emboscadas y peligro inminente.
  - 🥁 *Taiko Telúrico*: Golpes resonantes de baja frecuencia para megafauna e impactos sísmicos.
  - 🔔 *Campanas de Cristal & Celesta*: Arpegios celestiales durante floraciones, auroras y mutaciones estelares.
  - ⚡ *Trueno Dinámico*: Convección de ruido blanco filtrado con sub-armónicos para rayos celestiales.
  - 🥣 *Cuenco Tibetano & Arpa Cósmica*: Osciladores senoidales puros en batimiento lento para eclipses y el Gran Árbol.
## 💎 Las Geodas de Cristal Prismático & Red de Refracción Láser

- **Geodas de Cuarzo Resonante (`data-tool="crystal"` o Tecla `X`)**: Espirales minerales facetadas de amatista y cuarzo que emergen de las profundidades de la tierra con núcleos palpitantes y anillos de resonancia armónica.
- **Red de Refracción Láser Óptica**: Cuando dos o más geodas se encuentran a distancia de acoplamiento (`340px`), proyectan haces láser cromáticos continuos con dispersión espectral (cian y magenta), chispas fotónicas que viajan por el rayo y estallidos de destellos estelares en sus nodos.
- **Sintonía Cristalina (`crystalTuned`)**: Las criaturas que cruzan la red de refracción o pastan junto a una geoda reciben la *Sintonía Cristalina*, obteniendo un halo orbital de gemas resplandecientes, restauración instantánea de fatiga/stamina y un impulso de agilidad del `+35%`.

## 🧬 El Crisol de Quimeras Trascendentes (Alquimia Genética de Híbridos)

- **Códice Alquímico Interactivo (`🧬 Quimeras` o Tecla `C`)**: Ventana modal con renderizado procedural tridimensional en tiempo real sobre `#chimeraPreviewCanvas`, pestañas para cada híbrido místico, recetas genéticas de transmutación y botones de invocación directa.
- **4 Híbridos Mitológicos Trascendentes**:
  1. 🌟 **Ciervo Alado de Luz (`chimera_celestial`)**: Fusión de *Ciervo Ágil* + *Polinizador*. Posee alas prismáticas con batido fluido, halo solar en sus astas y la habilidad *Lluvia Astral* (dispersa semillas divinas y bendice a la manada).
  2. 🌋 **Behemoth de Obsidiana (`chimera_behemoth`)**: Fusión de *Titán Acorazado* + *Apex*. Cuerpo volcánico colosal con fisuras de magma palpitante y la habilidad *Falla Geotérmica* (impacto sísmico que aturde y crea un cráter fértil humeante).
  3. 🦅 **Grifo Umbrío (`chimera_gryphon`)**: Fusión de *Cazador de Manada* + *Carroñero*. Plumaje de sombras abisales, ojos de obsidiana y la habilidad *Picado Umbrío* (vuelo supersónico fulgurante que derriba presas y deja una estela de vacío).
  4. 🔮 **Prisma Viviente (`chimera_prism`)**: Manifestación pura de luz nacida de la radiación cristalina. Poliedro flotante con rotación procedural 3D y la habilidad *Nova de Refracción* (estallido de radiación cromática que cura y muta benéficamente a las criaturas circundantes).
- **Transmutación Dirigida (`🧬 Transmutar`)**: Selecciona cualquier criatura viva del terrario y transmútala instantáneamente en cualquiera de las 4 quimeras, heredando su linaje y elevando su código genético a un estado mítico.

## 🪞 Ecos Temporales Cuánticos (Desplazamiento Cromático Dinámico)

- **Cronofotografía Fantasmal**: Toda criatura con *Sintonía Cristalina*, bendición cósmica o condición de quimera proyecta copias fantasmagóricas de sí misma a alta velocidad.
- **Aberración Espectral RGB**: Los ecos cuánticos se descomponen en canales independientes rojo/cian con transparencia atenuada, registrando el pasado inmediato de la trayectoria y creando un efecto visual cinematográfico similar al cine experimental y la física cuántica de partículas.

## 🎼 La Armónica de Cristal (Síntesis FM de Cuarzo & Canto Coral)

- **Síntesis FM Acústica Cuántica**: Emulación física de la armónica de cristal de Benjamin Franklin mediante un oscilador portador senoidal y un modulador acoplado a un ratio inarmónico de campana de cuarzo (`2.76:1`), con caída exponencial suave y reverberación estéreo.
- **Vocalizaciones de Quimera**: Cada una de las 4 quimeras posee un timbre acústico bespoke: arpegios polifónicos de campana para el ciervo celestial, rugidos cavernosos modulados por FM sub-grave para el behemoth, chillidos chirriantes de alta velocidad para el grifo y glissandos cristalinos puros para el prisma viviente.

## ⚡ Poderes Elementales de Creación

- **⚡ Rayo Celestial (`data-tool="lightning"`)**: Lanza un arco voltaico procedural ramificado desde las alturas con relámpago de pantalla, sonido de trueno envolvente e ionización de suelo que genera un cráter místico super-fértil.
- **💨 Vórtice de Viento (`data-tool="vortex"`)**: Engendra un remolino de aire que succiona y arremolina suavemente a las criaturas en espiral, redistribuyendo densidades poblacionales con suave flotabilidad.
- **🌟 Bendición Cósmica (`data-tool="blessing"`)**: Toca a cualquier criatura viva para consagrarla con un halo dorado de santidad: regenera al instante toda su salud, sacia su sed y hambre, y la bendice con fertilidad e inmunidad temporal ante depredadores.

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

- **Inspector de Criaturas**: Haz clic en cualquier criatura para ver su cerebro en vivo (estado actual, barras de necesidades, árbol genealógico, estadísticas genéticas y botón `🧬 Transmutar`).
- **Barra de Herramientas & Spawn**: Siembra comida, invoca cualquiera de las 6 especies base, crea estanques, planta `💎 Geodas de Cristal`, genera `🧬 Quimeras` o desata rayos y vórtices elementales.
- **Gráfico Histórico de Población**: Mini gráfica dinámica en tiempo real que muestra el equilibrio depredador-presa y población de quimeras.
- **Clima & Lluvia Fértil**: Activa lluvias que nutren el terreno y aceleran el crecimiento botánico.
- **Modos Visuales**: Alterna conos de visión, emociones flotantes (💭), barras de salud, red cimática y ciclo día/noche automático.
- **Atajos de Teclado**:
  - `E`: Encarnar en criatura seleccionada / Liberar vínculo del alma.
  - `WASD` / Flechas: Control cinético manual de la criatura poseída.
  - `Espacio`: Desatar habilidad única de la criatura / quimera poseída.
  - `A`: Alternar entre instinto autónomo y control manual en modo posesión.
  - `C`: Abrir / Cerrar el Códice de Quimeras Trascendentes.
  - `X`: Generar una Geoda de Cuarzo Resonante en el mundo.
  - `T`: Consultar la Sabiduría Ancestral del Gran Árbol Yggdrasil.
  - `O`: Desatar el Gran Eclipse Cósmico e ingravidez.
  - `Escape`: Desactivar posesión o cerrar ventanas modales.

## 🚀 Desarrollo Local

Abre `index.html` directamente en el navegador, o sírvelo con cualquier servidor estático:

```sh
python3 -m http.server 8000
```
