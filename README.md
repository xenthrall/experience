# Terrario Digital — Ecosistema Vivo & Evolución (v6.0: Memoria del Terrario)

Un simulador de vida artificial y selección natural que corre por completo en el navegador sobre un `<canvas>` 2D de alto rendimiento (acelerado por Spatial Hash Grid a 60 FPS). Sin dependencias ni build step — un único `index.html`.

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

## 💀 Memoria del Terrario — Persistencia entre Visitas

- **El suelo recuerda**: cada vez que una criatura muere (hambre, sed, vejez o caza), su ubicación, especie y generación quedan grabadas en la memoria del terrario (`localStorage`), sin backend ni servidor — pura persistencia del navegador.
- **Luciérnagas de la memoria**: durante el atardecer y la noche, puntos de luz tenues y parpadeantes aparecen exactamente donde murió cada criatura, coloreados según su especie y con brillo proporcional a su generación — los linajes más evolucionados dejan una marca más intensa.
- **Constelaciones de los caídos**: las muertes más recientes se conectan entre sí con líneas fantasmales, dibujando una constelación efímera que cambia con cada nueva pérdida.
- **Memoria que sobrevive al `Reiniciar`**: pulsar "Reiniciar" reinicia la simulación, pero no borra la memoria — las almas de generaciones anteriores (incluso de visitas anteriores, en días distintos) siguen ahí, acumulándose. Al volver a abrir la página, un mensaje te recuerda cuántas almas habitan ya el terrario.

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
