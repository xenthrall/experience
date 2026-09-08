(function () {
  "use strict";

  // ==========================================
  // CONFIGURACIÓN & VARIABLES PRINCIPALES
  // ==========================================
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const popCanvas = document.getElementById("popChart");
  const popCtx = popCanvas.getContext("2d");

  let W = window.innerWidth, H = window.innerHeight;

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const r = popCanvas.getBoundingClientRect();
    popCanvas.width = r.width * dpr; popCanvas.height = r.height * dpr;
    popCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (ancientTree) {
      ancientTree.x = W * 0.5;
      ancientTree.y = H * 0.44;
      buildTreeStructure();
    }
  }
  window.addEventListener("resize", resize);

  // Utilidades matemáticas
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
  const spread = (r) => (Math.random() * 2 - 1) * r;
  const distSq = (x1, y1, x2, y2) => (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
  const angleDiff = (target, current) => Math.atan2(Math.sin(target - current), Math.cos(target - current));

  // Opciones de visualización
  const options = {
    showVision: true,
    showEmotes: true,
    showBars: false,
    autoDayNight: true,
    dreamMode: false,
    showCymatics: true,
    activeTool: "food"
  };

  // Especies soportadas
  const SPECIES = {
    HERB_AGILE: {
      id: "herb_agile",
      name: "Ciervo Ágil",
      swatch: "#2ca06d",
      baseSpeed: 1.6,
      baseSense: 120,
      baseSize: 4.5,
      maxAge: 3200,
      reproAge: 220,
      reproFrac: 0.75,
      cap: 70
    },
    HERB_MEGA: {
      id: "herb_mega",
      name: "Titán Acorazado",
      swatch: "#758e38",
      baseSpeed: 0.75,
      baseSense: 90,
      baseSize: 11.0,
      maxAge: 5200,
      reproAge: 400,
      reproFrac: 0.82,
      cap: 22
    },
    CARN_PACK: {
      id: "carn_pack",
      name: "Cazador de Manada",
      swatch: "#d24e38",
      baseSpeed: 1.75,
      baseSense: 145,
      baseSize: 6.2,
      maxAge: 3400,
      reproAge: 320,
      reproFrac: 0.80,
      cap: 28
    },
    CARN_APEX: {
      id: "carn_apex",
      name: "Depredador Apex",
      swatch: "#8e2b88",
      baseSpeed: 1.45,
      baseSense: 165,
      baseSize: 14.0,
      maxAge: 6000,
      reproAge: 600,
      reproFrac: 0.85,
      cap: 8
    },
    SCAVENGER: {
      id: "scavenger",
      name: "Carroñero",
      swatch: "#4a5c82",
      baseSpeed: 1.3,
      baseSense: 220,
      baseSize: 4.0,
      maxAge: 4000,
      reproAge: 300,
      reproFrac: 0.75,
      cap: 25
    },
    POLLINATOR: {
      id: "pollinator",
      name: "Polinizador",
      swatch: "#d8a018",
      baseSpeed: 1.1,
      baseSense: 70,
      baseSize: 2.2,
      maxAge: 2600,
      reproAge: 180,
      reproFrac: 0.70,
      cap: 35
    }
  };
  const SPECIES_BY_ID = {};
  Object.values(SPECIES).forEach((sp) => { SPECIES_BY_ID[sp.id] = sp; });

  // Estado del Terrario
  let creatures = [];
  let plants = [];
  let bushes = [];
  let waterBodies = [];
  let carcasses = [];
  let particles = [];
  let alarmWaves = [];
  let popHistory = [];

  let births = 0, totalKills = 0, maxGen = 0, nextCreatureId = 1;
  let running = true, foodRate = 0.5, speedMult = 1.0;
  let simTime = 0, realElapsedMs = 0, frameCounter = 0, lastTs = null;
  let dayTime = 0.25; // 0=Amanecer, 0.25=Mediodía, 0.5=Atardecer, 0.75=Noche
  let rainActive = 0; // Temporizador de lluvia

  // Ciclo de estaciones: un "año" avanza mucho más lento que un día
  const SEASONS = [
    { name: "Primavera", icon: "🌸", tint: "rgba(140, 220, 130, 0.08)", metabolism: 0.88, foodMult: 1.6, weather: "petal", weatherColor: "#ffb3d9" },
    { name: "Verano", icon: "☀️", tint: "rgba(255, 205, 80, 0.06)", metabolism: 1.00, foodMult: 1.1, weather: null, weatherColor: null },
    { name: "Otoño", icon: "🍂", tint: "rgba(196, 120, 45, 0.14)", metabolism: 1.08, foodMult: 0.65, weather: "leaf", weatherColor: "#c9762e" },
    { name: "Invierno", icon: "❄️", tint: "rgba(178, 210, 235, 0.24)", metabolism: 1.55, foodMult: 0.22, weather: "snow", weatherColor: "#eef6ff" }
  ];
  let seasonTime = 0; // 0..1 = un año completo (4 estaciones)
  let seasonIdx = 0;
  let seasonProgress = 0;
  let seasonMetabolismMult = 1;
  let skyParticles = []; // Nieve, hojas y pétalos ambientales

  // ==========================================
  // CLIMA EMOCIONAL DEL TERRARIO
  // Un aura viva que responde al pulso real del ecosistema: hambre, duelo,
  // cacería, nacimientos y abundancia se convierten en luz, color y partículas.
  // ==========================================
  const MOODS = {
    calma:    { label: "Calma",      icon: "🌾", color: "150,190,150", baseAlpha: 0.020, spawnRate: 0.020 },
    prospero: { label: "Próspero",   icon: "🌻", color: "255,205,90",  baseAlpha: 0.045, spawnRate: 0.130 },
    tenso:    { label: "En tensión", icon: "⚡", color: "214,80,60",   baseAlpha: 0.065, spawnRate: 0.110 },
    duelo:    { label: "En duelo",   icon: "🕯️", color: "120,130,170", baseAlpha: 0.075, spawnRate: 0.090 },
    renacer:  { label: "Renacer",    icon: "🌱", color: "110,220,150", baseAlpha: 0.045, spawnRate: 0.110 },
    hambruna: { label: "Hambruna",   icon: "🥀", color: "190,120,50",  baseAlpha: 0.060, spawnRate: 0.060 }
  };
  let currentMood = Object.assign({ id: "calma" }, MOODS.calma);
  let moodPulse = 0;
  let moodParticles = [];
  let recentDeathTimes = [];
  let recentBirthTimes = [];
  let recentKillTimes = [];

  function computeMood() {
    const now = Date.now();
    recentDeathTimes = recentDeathTimes.filter(t => now - t < 20000);
    recentBirthTimes = recentBirthTimes.filter(t => now - t < 20000);
    recentKillTimes = recentKillTimes.filter(t => now - t < 12000);

    let avgEnergy = 0.6;
    if (creatures.length > 0) {
      let sum = 0;
      for (let c of creatures) sum += c.energy / c.maxEnergy;
      avgEnergy = sum / creatures.length;
    }

    let moodId = "calma";
    if (creatures.length > 0 && avgEnergy < 0.32) moodId = "hambruna";
    else if (recentDeathTimes.length >= 5) moodId = "duelo";
    else if (recentKillTimes.length >= 3) moodId = "tenso";
    else if (recentBirthTimes.length >= 4) moodId = "renacer";
    else if (avgEnergy > 0.72 && creatures.length > 20) moodId = "prospero";

    if (moodId !== currentMood.id) {
      currentMood = Object.assign({ id: moodId }, MOODS[moodId]);
      moodPulse = 1;
      const iconEl = document.getElementById("moodIcon");
      if (iconEl) {
        iconEl.classList.remove("pulse");
        void iconEl.offsetWidth;
        iconEl.classList.add("pulse");
      }
    }

    const iconEl = document.getElementById("moodIcon");
    const labelEl = document.getElementById("moodLabel");
    if (iconEl) iconEl.textContent = currentMood.icon;
    if (labelEl) {
      labelEl.textContent = currentMood.label;
      labelEl.style.color = `rgb(${currentMood.color})`;
    }
  }

  function spawnMoodParticle(moodId) {
    switch (moodId) {
      case "prospero":
        return { x: rand(0, W), y: H + 6, vx: rand(-0.15, 0.15), vy: rand(-0.55, -0.2), r: rand(1, 2.2), life: rand(220, 420), baseAlpha: rand(0.4, 0.85), alpha: 0.6, color: "255,214,120", flicker: true, seed: rand(0, 100), grav: 0 };
      case "tenso":
        return { x: rand(0, W), y: rand(0, H), vx: rand(-0.35, 0.35), vy: rand(-0.35, 0.35), r: rand(1, 1.8), life: rand(40, 90), baseAlpha: rand(0.3, 0.6), alpha: 0.5, color: "214,80,60", flicker: true, seed: rand(0, 100), grav: 0 };
      case "duelo":
        return { x: rand(0, W), y: -6, vx: rand(-0.05, 0.05), vy: rand(0.15, 0.35), r: rand(1, 2), life: rand(320, 520), baseAlpha: rand(0.25, 0.5), alpha: 0.35, color: "150,160,190", flicker: false, seed: 0, grav: 0.0003 };
      case "renacer":
        return { x: rand(0, W), y: H + 6, vx: rand(-0.1, 0.1), vy: rand(-0.4, -0.15), r: rand(1.2, 2.4), life: rand(180, 340), baseAlpha: rand(0.4, 0.75), alpha: 0.55, color: "120,220,150", flicker: true, seed: rand(0, 100), grav: 0 };
      case "hambruna":
        return { x: rand(0, W), y: rand(0, H), vx: rand(-0.4, 0.4), vy: rand(0.05, 0.2), r: rand(1, 1.6), life: rand(120, 220), baseAlpha: rand(0.2, 0.4), alpha: 0.3, color: "190,140,60", flicker: false, seed: 0, grav: 0 };
      default:
        return { x: rand(0, W), y: rand(0, H), vx: rand(-0.05, 0.05), vy: rand(-0.1, -0.02), r: rand(0.8, 1.4), life: rand(150, 300), baseAlpha: rand(0.15, 0.3), alpha: 0.2, color: "180,200,170", flicker: true, seed: rand(0, 100), grav: 0 };
    }
  }

  function updateMoodAura(dt) {
    moodPulse = Math.max(0, moodPulse - 0.01 * dt);

    if (moodParticles.length < 90 && Math.random() < currentMood.spawnRate * dt) {
      moodParticles.push(spawnMoodParticle(currentMood.id));
    }

    for (let i = moodParticles.length - 1; i >= 0; i--) {
      const p = moodParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.grav || 0) * dt;
      p.life -= dt;
      p.alpha = p.flicker ? p.baseAlpha * (0.5 + 0.5 * Math.sin(simTime * 0.006 + p.seed)) : p.baseAlpha;
      if (p.life <= 0 || p.y < -25 || p.y > H + 25 || p.x < -25 || p.x > W + 25) moodParticles.splice(i, 1);
    }
  }

  function drawMoodAura(actx) {
    actx.save();
    const alpha = currentMood.baseAlpha + moodPulse * 0.08;
    const grad = actx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.78);
    grad.addColorStop(0, `rgba(${currentMood.color},0)`);
    grad.addColorStop(1, `rgba(${currentMood.color},${alpha.toFixed(3)})`);
    actx.fillStyle = grad;
    actx.fillRect(0, 0, W, H);

    for (const p of moodParticles) {
      actx.globalAlpha = p.alpha;
      actx.fillStyle = `rgb(${p.color})`;
      actx.beginPath();
      actx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      actx.fill();
    }
    actx.restore();
  }

  // Modo Onírico: poesía visual generativa a partir del estado del ecosistema
  let poemTimer = 0;
  const POEM_TEMPLATES = [
    (s) => `${s.season} respira sobre ${s.pop} sombras que aún no saben que sueñan`,
    (s) => `en la ${s.todLower}, nacieron ${s.births} vidas nuevas — ninguna recuerda su nombre`,
    (s) => `${s.dominant} camina como si el tiempo no tuviera colmillos`,
    (s) => `cada muerte es una semilla: ${s.kills} cacerías ya escritas en la tierra`,
    (s) => `generación ${s.gen}: la mutación es la única forma honesta de la esperanza`,
    (s) => `bajo un cielo de ${s.seasonLower}, ${s.pop} corazones cuentan el mismo segundo`,
    (s) => `el agua recuerda a todos los que bebieron y ya no están`,
    (s) => `${s.dominant} no sabe que es un poema que camina`,
    (s) => `${s.pop} pulsos diminutos discuten en silencio quién merece sobrevivir`,
    (s) => `la ${s.todLower} cae sobre el terrario como una pregunta sin dueño`,
    (s) => `todo lo que muta, muta hacia algo que todavía no tiene nombre`,
    (s) => `en generación ${s.gen}, alguien aprendió a tener miedo mejor que sus padres`
  ];
  function ecosystemSnapshot() {
    let counts = { herb_agile: 0, herb_mega: 0, carn_pack: 0, carn_apex: 0, scavenger: 0, pollinator: 0 };
    for (let c of creatures) if (counts[c.speciesId] !== undefined) counts[c.speciesId]++;
    let dominantId = "herb_agile", dominantCount = -1;
    for (let k in counts) if (counts[k] > dominantCount) { dominantCount = counts[k]; dominantId = k; }
    const dominantSpec = Object.values(SPECIES).find((sp) => sp.id === dominantId);
    const todLabel = document.getElementById("todLabel").textContent || "día";
    return {
      pop: creatures.length,
      births, kills: totalKills, gen: maxGen,
      season: SEASONS[seasonIdx].name,
      seasonLower: SEASONS[seasonIdx].name.toLowerCase(),
      todLower: todLabel.toLowerCase(),
      dominant: dominantSpec ? dominantSpec.name.toLowerCase() : "algo sin nombre"
    };
  }
  function nextPoemLine() {
    const tpl = POEM_TEMPLATES[Math.floor(Math.random() * POEM_TEMPLATES.length)];
    const line = tpl(ecosystemSnapshot());
    const el = document.getElementById("poemText");
    el.classList.remove("in");
    setTimeout(() => {
      el.textContent = line;
      el.classList.add("in");
    }, 350);
  }

  let selectedCreature = null;
  let followingCreature = null;
  let camX = W / 2, camY = H / 2, camZoom = 1.0;
  let targetCamX = W / 2, targetCamY = H / 2, targetCamZoom = 1.0;

  // Aurora Boreal Cósmica
  let auroraActive = 0.0;
  let auroraManualTimer = 0;

  // Estelas de Feromonas Bioluminiscentes (Bio-Trails)
  const bioTrails = [];
  const MAX_BIO_TRAILS = 450;

  // Vínculo del Alma / Modo Encarnación
  let possessedCreature = null;
  let possessionAutopilot = true;
  let possessionAbilityCooldown = 0;
  const possessionAbilityMaxCooldown = 220;
  let possessionBPM = 74;
  let lastHeartbeatAudioSimTime = 0;
  let possessionThoughtTimer = 0;
  let ecgPhase = 0;
  const ecgHistory = new Array(130).fill(16);
  const possessionKeys = {
    KeyW: false, KeyA: false, KeyS: false, KeyD: false,
    ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false,
    ShiftLeft: false, ShiftRight: false
  };

  // Eventos cósmicos: lluvias de meteoritos, cráteres y zonas de mutación
  let meteors = [];
  let craters = [];
  let mutationZones = [];
  let meteorCooldown = rand(1400, 3200);
  let audioEnabled = false;

  // Resonancia Cimática del Terreno (Chladni Patterns)
  let cymaticPulse = 0;

  // El Gran Eclipse Cósmico
  let eclipseActive = 0.0;
  let eclipseTimer = 0;
  let eclipsesWitnessed = 0;

  // El Árbol Ancestral (Yggdrasil del Terrario)
  let ancientTree = null;
  let treeBloomsWitnessed = 0;
  let soulWisps = [];

  // Poderes Elementales: Rayos y Vórtices
  let lightningBolts = [];
  let vortices = [];

  // ==========================================
  // MEMORIA DEL TERRARIO (persiste entre reinicios y entre visitas)
  // ==========================================
  const DEATH_LEDGER_KEY = "terrario_death_ledger_v1";
  const MAX_LEDGER = 500;
  let deathLedger = [];

  function loadDeathLedger() {
    try {
      const raw = localStorage.getItem(DEATH_LEDGER_KEY);
      deathLedger = raw ? JSON.parse(raw) : [];
    } catch (e) {
      deathLedger = [];
    }
  }

  function saveDeathLedger() {
    try {
      localStorage.setItem(DEATH_LEDGER_KEY, JSON.stringify(deathLedger));
    } catch (e) { /* almacenamiento no disponible: la memoria vive solo esta sesión */ }
  }

  function recordDeath(c, cause) {
    const legendary = isLegendary(c);
    deathLedger.push({
      xf: c.x / W, yf: c.y / H, species: c.speciesId, gen: c.gen, t: Date.now(),
      name: c.name || null, cause: cause || "natural",
      kills: c.kills || 0, kids: c.kids || 0, legendary
    });
    if (deathLedger.length > MAX_LEDGER) deathLedger.shift();
    saveDeathLedger();
    markLineageDeath(c, cause || "natural");
    recentDeathTimes.push(Date.now());

    if (possessedCreature === c) {
      handlePossessedDeath(c, cause || "natural");
    }

    if (legendary) {
      legendLedger.unshift({
        name: c.name, species: c.speciesId, gen: c.gen, cause: cause || "natural",
        kills: c.kills || 0, kids: c.kids || 0, t: Date.now(),
        saga: generateSaga(c, cause || "natural")
      });
      if (legendLedger.length > MAX_LEGENDS) legendLedger.pop();
      saveLegendLedger();
      showToast(`📖 Una leyenda ha caído: ${c.name}`);
    }

    if (ancientTree) {
      spawnSoulWisp(c.x, c.y, c.speciesId);
    }
  }

  // ==========================================
  // SAGAS LEGENDARIAS (hazañas que trascienden una sola vida)
  // ==========================================
  const LEGEND_KEY = "terrario_legend_ledger_v1";
  const MAX_LEGENDS = 60;
  const LEGEND_KILLS = 6, LEGEND_KIDS = 5, LEGEND_GEN = 6;
  let legendLedger = [];

  function loadLegendLedger() {
    try {
      const raw = localStorage.getItem(LEGEND_KEY);
      legendLedger = raw ? JSON.parse(raw) : [];
    } catch (e) {
      legendLedger = [];
    }
  }

  function saveLegendLedger() {
    try {
      localStorage.setItem(LEGEND_KEY, JSON.stringify(legendLedger));
    } catch (e) { /* almacenamiento no disponible: las sagas viven solo esta sesión */ }
  }

  function isLegendary(c) {
    return (c.kills || 0) >= LEGEND_KILLS || (c.kids || 0) >= LEGEND_KIDS || (c.gen || 0) >= LEGEND_GEN;
  }

  const SAGA_OPENERS = [
    (n, sp) => `Se cuenta que ${n} no nació para pastar entre las sombras, sino para que otros ${sp} contaran su historia.`,
    (n, sp) => `Antes de que ${n} cruzara este terrario, ningún ${sp} había dejado una huella tan profunda.`,
    (n, sp) => `${n} empezó como cualquier otro ${sp}: pequeño, hambriento, invisible. No terminó así.`,
    (n, sp) => `Hay nombres que el terrario no olvida. ${n} es uno de ellos.`
  ];
  const SAGA_DEEDS = [
    (n, k) => `Se le atribuyen ${k} cacería${k === 1 ? "" : "s"}, cada una contada y recontada por quienes sobrevivieron para huir.`,
    (n, k) => `${k} veces salió victorioso donde otros solo dejaron huesos.`,
    (n, k) => `Su sombra sobre la hierba significaba, ${k} veces, que algo más no volvería a casa.`
  ];
  const SAGA_LEGACY = [
    (n, kids) => `Dejó ${kids} descendientes, y en cada uno de ellos algo de ${n} sigue caminando.`,
    (n, kids) => `${kids} crías llevan su sangre esparcida por el terrario, generación tras generación.`,
    (n, kids) => `De ${n} nacieron ${kids} líneas nuevas, cada una jurando —a su manera— no repetir sus errores.`
  ];
  const SAGA_CLOSERS = [
    (n, c) => `Al final, murió ${c}. Pero las leyendas, a diferencia de las criaturas, no se pudren bajo tierra.`,
    (n, c) => `Cuando cayó, ${c}, incluso los buitres guardaron distancia un momento antes de acercarse.`,
    (n, c) => `Su final llegó ${c} — y aun así, esta saga seguirá contándose mucho después de que sus huesos se disuelvan.`
  ];

  function generateSaga(c, cause) {
    const spec = SPECIES_BY_ID[c.speciesId];
    const spName = spec ? spec.name.toLowerCase() : "criatura";
    const name = c.name || "un alma sin nombre";
    const causeText = CAUSE_LABEL[cause] || CAUSE_LABEL.natural;
    const seed = hashStr(name + c.id + c.speciesId);
    const rnd = seededRand(seed);

    const parts = [];
    parts.push(SAGA_OPENERS[Math.floor(rnd() * SAGA_OPENERS.length)](name, spName));
    if (c.kills > 0) parts.push(SAGA_DEEDS[Math.floor(rnd() * SAGA_DEEDS.length)](name, c.kills));
    if (c.kids > 0) parts.push(SAGA_LEGACY[Math.floor(rnd() * SAGA_LEGACY.length)](name, c.kids));

    const chain = buildLineageChain(c.id);
    if (chain.length > 2) {
      const founder = chain[0];
      parts.push(`Su linaje se remonta ${chain.length - 1} generaciones atrás, hasta ${founder.name}, el primero de su estirpe en pisar este terrario.`);
    } else if (c.gen >= LEGEND_GEN) {
      parts.push(`Perteneció a la generación ${c.gen}, heredera de incontables mutaciones silenciosas que la trajeron hasta aquí.`);
    }

    parts.push(SAGA_CLOSERS[Math.floor(rnd() * SAGA_CLOSERS.length)](name, causeText));
    return parts.join(" ");
  }

  function legendRank(entry) {
    return entry.kills * 3 + entry.kids * 2 + entry.gen;
  }

  // ==========================================
  // CRÓNICAS DEL TERRARIO (bitácora mitológica persistente)
  // ==========================================
  const CHRONICLE_KEY = "terrario_chronicle_v1";
  const MAX_CHRONICLE = 60;
  let chronicle = [];
  let meteorImpacts = 0;
  let mutationsCount = 0;
  let extinctions = [];
  let prevSpeciesCounts = {};

  function loadChronicle() {
    try {
      const raw = localStorage.getItem(CHRONICLE_KEY);
      chronicle = raw ? JSON.parse(raw) : [];
    } catch (e) {
      chronicle = [];
    }
  }

  function saveChronicle() {
    try {
      localStorage.setItem(CHRONICLE_KEY, JSON.stringify(chronicle));
    } catch (e) { /* almacenamiento no disponible: la crónica vive solo esta sesión */ }
  }

  // ==========================================
  // EL ORÁCULO DEL TERRARIO (adivinación persistente, tejida con datos vivos)
  // ==========================================
  const ORACLE_KEY = "terrario_oracle_v1";
  const MAX_PROPHECIES = 40;
  let prophecies = [];

  function loadProphecies() {
    try {
      const raw = localStorage.getItem(ORACLE_KEY);
      prophecies = raw ? JSON.parse(raw) : [];
    } catch (e) {
      prophecies = [];
    }
  }

  function saveProphecies() {
    try {
      localStorage.setItem(ORACLE_KEY, JSON.stringify(prophecies));
    } catch (e) { /* almacenamiento no disponible: las profecías viven solo esta sesión */ }
  }

  function stripAccents(s) {
    return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }

  function oracleSnapshot() {
    const snap = ecosystemSnapshot();
    return {
      ...snap,
      memory: deathLedger.length,
      eras: chronicle.length,
      meteors: meteorImpacts,
      mutations: mutationsCount,
      chosen: selectedCreature ? selectedCreature.name : null,
      chosenSpecies: selectedCreature && SPECIES_BY_ID[selectedCreature.speciesId] ? SPECIES_BY_ID[selectedCreature.speciesId].name.toLowerCase() : null
    };
  }

  const ORACLE_CATEGORIES = [
    {
      id: "muerte",
      keywords: ["muer", "matar", "mori", "final", "acab", "fin del", "sufr"],
      templates: [
        (s) => `La muerte ya visitó este terrario ${s.memory} veces. Cada una fue una semilla, no un punto final.`,
        (s) => `${s.kills} cacerías se han escrito en la tierra. Lo que termina aquí siempre alimenta lo que sigue.`,
        (s) => `Nada muere del todo mientras haya generación ${s.gen} para heredar el miedo que aprendió.`,
        (s) => `El suelo recuerda a ${s.memory} almas. Pregúntale a las luciérnagas del atardecer, ellas no mienten.`
      ]
    },
    {
      id: "amor",
      keywords: ["amor", "amar", "pareja", "corazon", "querer", "enamor"],
      templates: [
        (s) => `${s.dominant} no conoce el amor, solo la proximidad útil. Y aun así, ${s.births} vidas nacieron de ella.`,
        (s) => `El vínculo más honesto que existe aquí es genético: cada cría hereda un poco de quien la crió con hambre.`,
        (s) => `En ${s.seasonLower}, hasta los depredadores bajan la guardia un instante. Llámalo lo que quieras.`,
        (s) => `No hay romance en el terrario, solo generación ${s.gen} intentando no desaparecer sola.`
      ]
    },
    {
      id: "futuro",
      keywords: ["futuro", "destino", "pasara", "ocurrira", "manana", "profec", "prediccion", "vendra"],
      templates: [
        (s) => `Si nada cambia, ${s.dominant} seguirá dominando este ${s.seasonLower} — pero el terrario nunca promete nada.`,
        (s) => `Generación ${s.gen + 1} ya se está gestando en alguna madriguera que no has visto todavía.`,
        (s) => `${s.eras} eras ya han terminado y ninguna terminó como se esperaba. Esta tampoco lo hará.`,
        (s) => `Lo próximo que ocurra dependerá de quién beba primero en el oasis cuando caiga la noche.`
      ]
    },
    {
      id: "guerra",
      keywords: ["guerra", "pelea", "luchar", "depredador", "caza", "ataque", "matanza", "violen"],
      templates: [
        (s) => `${s.kills} cacerías exitosas y contando. El terrario no conoce la paz, conoce el equilibrio.`,
        (s) => `Cada ${s.seasonLower} trae su propia versión de la violencia: hambre, frío, o dientes. Elige tu enemigo.`,
        (s) => `Los cazadores no odian a sus presas. Solo necesitan que dejen de existir para seguir existiendo ellos.`,
        (s) => `${s.mutations} mutaciones cósmicas ya han afilado garras que antes no eran garras.`
      ]
    },
    {
      id: "comida",
      keywords: ["comida", "hambre", "comer", "alimento", "hambr"],
      templates: [
        (s) => `En ${s.seasonLower}, la flora ${s.season === "Invierno" ? "apenas alcanza" : "crece con generosidad"}. El hambre decide más que el instinto.`,
        (s) => `Todo lo que nace, nace hambriento. ${s.pop} bocas se abren ahora mismo, en algún rincón de este mundo.`,
        (s) => `Siembra más de lo que crees necesario. El terrario nunca perdona la escasez.`,
        (s) => `El hambre no distingue entre generación 1 y generación ${s.gen}. Es la única ley que no muta.`
      ]
    },
    {
      id: "clima",
      keywords: ["tiempo", "clima", "lluvia", "invierno", "verano", "estacion", "frio", "calor", "nieve"],
      templates: [
        (s) => `Estamos en ${s.seasonLower}, bajo un cielo de ${s.todLower}. El clima aquí no anuncia nada, solo sucede.`,
        (s) => `Cada estación es una promesa distinta: ${s.season === "Invierno" ? "esta te pide sobrevivir" : "esta te deja crecer"}.`,
        (s) => `El tiempo no pasa igual para todos: un titán acorazado envejece distinto que un polinizador.`,
        (s) => `${s.eras} eras han visto pasar las cuatro estaciones. Ninguna se repite exactamente igual.`
      ]
    },
    {
      id: "arbol_eclipse",
      keywords: ["arbol", "yggdrasil", "raiz", "raices", "eclipse", "sol", "luna", "sombra", "floracion", "boreal", "cielo"],
      templates: [
        (s) => ancientTree ? `El Árbol Ancestral custodia ${ancientTree.soulsAbsorbed} almas en su savia. Nadie muere por completo mientras su tronco sostenga el cielo.` : `Las raíces del mundo son invisibles, pero sostienen cada paso de este valle.`,
        (s) => `Cuando la sombra del Gran Eclipse cubre el sol, el terrario suspende sus leyes y todo aprende a volar.`,
        (s) => `Bajo el Yggdrasil existe una tregua sagrada: los que comen hojas y los que afilan colmillos descansan bajo el mismo verde.`
      ]
    },
    {
      id: "criatura",
      keywords: ["criatura", "animal", "mascota", "especie", "el mio", "mi criatura"],
      templates: [
        (s) => s.chosen
          ? `${s.chosen}, ${s.chosenSpecies}, camina por este mundo sin saber que le preguntaste por su destino.`
          : `No has elegido a nadie todavía. Toca una criatura y vuelve a preguntar — el oráculo habla mejor con nombres.`,
        (s) => `${s.dominant} domina el terrario ahora mismo, con ${s.pop} vidas repartiéndose el mismo suelo.`,
        (s) => `Cada criatura que ves ya lleva en sus genes la respuesta a una pregunta que nadie le hizo.`,
        (s) => `Generación ${s.gen}: cada una un experimento que la anterior no vivió para ver terminado.`
      ]
    },
    {
      id: "general",
      keywords: [],
      templates: [
        (s) => `${s.pop} vidas laten ahora mismo bajo un cielo de ${s.seasonLower}. Esa es toda la verdad que tengo.`,
        (s) => `El terrario no responde con certezas, responde con generación ${s.gen} y lo que sobrevivió hasta aquí.`,
        (s) => `${s.eras > 0 ? `${s.eras} eras ya se escribieron en el pergamino` : "esta es la primera era, nada está escrito todavía"} — y aun así preguntas.`,
        (s) => `Pregúntale al agua, ella ha visto beber a todos los que ya no están.`,
        (s) => `La respuesta cambia si vuelves a preguntar en ${s.todLower}. Este mundo no se queda quieto para nadie.`,
        (s) => `${s.dominant} no tiene opinión sobre tu pregunta, pero domina el terrario mientras la haces.`
      ]
    }
  ];

  function classifyQuestion(q) {
    const norm = stripAccents(q);
    for (const cat of ORACLE_CATEGORIES) {
      if (cat.keywords.some((kw) => norm.includes(kw))) return cat;
    }
    return ORACLE_CATEGORIES[ORACLE_CATEGORIES.length - 1];
  }

  function consultOracle(question) {
    const cat = classifyQuestion(question);
    const tpl = cat.templates[Math.floor(Math.random() * cat.templates.length)];
    return tpl(oracleSnapshot());
  }

  function recordProphecy(question, answer) {
    prophecies.push({ q: question, a: answer, t: Date.now() });
    if (prophecies.length > MAX_PROPHECIES) prophecies.shift();
    saveProphecies();
  }

  function renderOracleHistory() {
    const el = document.getElementById("oracleHistory");
    document.getElementById("oracleCount").textContent = prophecies.length;
    if (prophecies.length === 0) {
      el.innerHTML = `<p class="oracle-empty">El libro está en blanco. Tu primera pregunta quedará grabada aquí para siempre.</p>`;
      return;
    }
    let html = "";
    for (let i = prophecies.length - 1; i >= 0; i--) {
      const p = prophecies[i];
      html += `<div class="oracle-entry"><span class="oracle-entry-q">"${escapeHtml(p.q)}"</span><span class="oracle-entry-a">${escapeHtml(p.a)}</span></div>`;
    }
    el.innerHTML = html;
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // ==========================================
  // POSTALES DEL TERRARIO (captura descargable de un instante)
  // ==========================================
  const POSTAL_COUNT_KEY = "terrario_postal_count_v1";
  let postalCount = 0;

  function loadPostalCount() {
    try {
      const raw = localStorage.getItem(POSTAL_COUNT_KEY);
      postalCount = raw ? parseInt(raw, 10) || 0 : 0;
    } catch (e) {
      postalCount = 0;
    }
  }

  function savePostalCount() {
    try {
      localStorage.setItem(POSTAL_COUNT_KEY, String(postalCount));
    } catch (e) { /* almacenamiento no disponible: el contador vive solo esta sesión */ }
  }

  const POSTCARD_CAPTIONS = [
    (s) => `${s.pop} vidas laten bajo un cielo de ${s.seasonLower}`,
    (s) => `generación ${s.gen}, y todavía nadie sabe que esto es historia`,
    (s) => `${s.dominant} reina hoy — mañana puede que no`,
    (s) => `un instante robado al tiempo, en la ${s.todLower}`,
    (s) => `${s.memory} almas descansan bajo este mismo suelo`,
    (s) => `esto también será una crónica algún día`,
    (s) => `${s.births} nacimientos, ${s.kills} cacerías, un solo instante`,
    (s) => `nada de esto volverá a verse exactamente igual`,
    (s) => s.eras > 0 ? `era ${s.eras + 1} del terrario, capturada en silencio` : `la primera era del terrario, capturada en silencio`,
    (s) => s.chosen ? `${s.chosen} existió — aquí está la prueba` : `alguien aquí no sabe que está siendo recordado`,
    (s) => ancientTree && ancientTree.soulsAbsorbed > 0 ? `el Árbol Ancestral custodia ${ancientTree.soulsAbsorbed} almas en sus raíces` : `el latido secreto de la tierra florece en silencio`,
    (s) => eclipseActive > 0.3 ? `bajo la corona del Gran Eclipse, el universo contuvo la respiración` : `la luz y la sombra se entrelazan sobre el terrario`
  ];

  function wrapTextBlock(octx, text, x, bottomY, maxWidth, lineHeight, maxLines) {
    const words = text.split(" ");
    let lines = [];
    let current = "";
    for (const w of words) {
      const test = current ? current + " " + w : w;
      if (octx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = w;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      let last = lines[maxLines - 1];
      while (octx.measureText(last + "…").width > maxWidth && last.length > 0) {
        last = last.slice(0, -1);
      }
      lines[maxLines - 1] = last + "…";
    }
    const startY = bottomY - (lines.length - 1) * lineHeight;
    lines.forEach((line, i) => octx.fillText(line, x, startY + i * lineHeight));
  }

  function flashScreen() {
    const el = document.getElementById("flashOverlay");
    el.classList.add("active");
    setTimeout(() => el.classList.remove("active"), 220);
  }

  function capturePostcard() {
    const srcW = canvas.width, srcH = canvas.height;
    const maxDim = 1600;
    const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
    const outW = Math.round(srcW * scale), outH = Math.round(srcH * scale);

    const off = document.createElement("canvas");
    off.width = outW; off.height = outH;
    const octx = off.getContext("2d");
    octx.drawImage(canvas, 0, 0, srcW, srcH, 0, 0, outW, outH);

    const vignette = octx.createRadialGradient(outW / 2, outH / 2, outH * 0.35, outW / 2, outH / 2, outH * 0.78);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.45)");
    octx.fillStyle = vignette;
    octx.fillRect(0, 0, outW, outH);

    const bottomH = outH * 0.26;
    const bgrad = octx.createLinearGradient(0, outH - bottomH, 0, outH);
    bgrad.addColorStop(0, "rgba(6,4,10,0)");
    bgrad.addColorStop(1, "rgba(6,4,10,0.85)");
    octx.fillStyle = bgrad;
    octx.fillRect(0, outH - bottomH, outW, bottomH);

    const pad = outW * 0.018;
    octx.strokeStyle = "rgba(255,255,255,0.35)";
    octx.lineWidth = Math.max(1, outW * 0.0022);
    octx.strokeRect(pad, pad, outW - pad * 2, outH - pad * 2);

    const snap = oracleSnapshot();
    const caption = POSTCARD_CAPTIONS[Math.floor(Math.random() * POSTCARD_CAPTIONS.length)](snap);
    const dateStr = new Date().toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" });
    const statsLine = `${snap.pop} vidas · gen ${snap.gen} · ${snap.dominant} · ${snap.season} · ${dateStr}`;

    octx.textAlign = "left";
    octx.fillStyle = "#f0e8ff";
    octx.font = `italic 600 ${Math.round(outW * 0.024)}px Georgia, 'Fraunces', serif`;
    wrapTextBlock(octx, `"${caption}"`, outW * 0.04, outH - outH * 0.10, outW * 0.92, outW * 0.03, 2);

    octx.font = `600 ${Math.round(outW * 0.014)}px 'JetBrains Mono', monospace`;
    octx.fillStyle = "rgba(240,232,255,0.7)";
    octx.fillText(statsLine.toUpperCase(), outW * 0.04, outH - outH * 0.035);

    octx.textAlign = "right";
    octx.font = `700 ${Math.round(outW * 0.016)}px Georgia, serif`;
    octx.fillStyle = "rgba(255,255,255,0.55)";
    octx.fillText("TERRARIO DIGITAL", outW - outW * 0.04, outH * 0.06);

    off.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `terrario-postal-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    }, "image/png");

    postalCount++;
    savePostalCount();
    flashScreen();
    Sound.shutter();
    showToast(`🖼️ Postal #${postalCount} guardada — revisa tus descargas`);
  }

  // ==========================================
  // GENEALOGÍA VIVA (árbol de linaje, vive mientras dure la sesión)
  // ==========================================
  const NAME_PREFIX = ["Ka", "Rho", "Tha", "Nyx", "Vel", "Or", "Ith", "Zar", "Mor", "Sil", "Ae", "Ux", "Fen", "Dra", "Quel", "Bry", "Es", "Ol", "Ura", "Vex", "Iz", "Aum", "Ny", "Sor"];
  const NAME_SUFFIX = ["rin", "dor", "eth", "ux", "ara", "iel", "oth", "ynn", "al", "um", "ir", "esh", "ova", "yx", "en", "ash", "or", "ika", "une", "az"];
  function generateCreatureName() {
    return NAME_PREFIX[Math.floor(Math.random() * NAME_PREFIX.length)] + NAME_SUFFIX[Math.floor(Math.random() * NAME_SUFFIX.length)];
  }

  const LINEAGE_TRAITS = [
    { key: "speed", label: "veloz", icon: "💨" },
    { key: "sense", label: "perceptivo", icon: "👁️" },
    { key: "size", label: "grande", icon: "📏" },
    { key: "stealth", label: "sigiloso", icon: "🌑" },
    { key: "aggression", label: "agresivo", icon: "⚔️" }
  ];
  function traitDrift(parentGenes, childGenes) {
    if (!parentGenes) return null;
    let best = null, bestPct = 0;
    for (const t of LINEAGE_TRAITS) {
      const base = parentGenes[t.key] || 0.001;
      const pct = (childGenes[t.key] - base) / base;
      if (Math.abs(pct) > Math.abs(bestPct)) { bestPct = pct; best = t; }
    }
    if (!best || Math.abs(bestPct) < 0.035) return null;
    const dir = bestPct > 0 ? "más" : "menos";
    return `${best.icon} ${dir} ${best.label} (${bestPct > 0 ? "+" : ""}${Math.round(bestPct * 100)}%)`;
  }

  let lineageArchive = {};

  function registerLineage(c, parentId) {
    lineageArchive[c.id] = {
      id: c.id,
      name: c.name,
      speciesId: c.speciesId,
      gen: c.gen,
      parentId: parentId || null,
      genes: { ...c.genes },
      born: simTime,
      alive: true,
      deathTime: null,
      cause: null,
      kids: 0,
      kills: 0
    };
  }

  function markLineageDeath(c, cause) {
    const rec = lineageArchive[c.id];
    if (rec) {
      rec.alive = false;
      rec.deathTime = simTime;
      rec.cause = cause;
      rec.kids = c.kids;
      rec.kills = c.kills;
    }
  }

  function buildLineageChain(creatureId) {
    const chain = [];
    let currentId = creatureId;
    let guard = 0;
    while (currentId != null && guard < 60) {
      const rec = lineageArchive[currentId];
      if (!rec) break;
      chain.push(rec);
      currentId = rec.parentId;
      guard++;
    }
    return chain.reverse();
  }

  function archiveEra() {
    if (births === 0 && totalKills === 0 && simTime < 1000) return; // nada digno de crónica aún
    const snap = ecosystemSnapshot();
    chronicle.push({
      endedAt: Date.now(),
      durationSec: Math.round(realElapsedMs / 1000),
      births, kills: totalKills, maxGen,
      dominant: snap.dominant,
      season: snap.season,
      meteorImpacts, mutations: mutationsCount,
      eclipses: eclipsesWitnessed,
      treeBlooms: treeBloomsWitnessed,
      extinctions: extinctions.slice(),
      memorySize: deathLedger.length
    });
    if (chronicle.length > MAX_CHRONICLE) chronicle.shift();
    saveChronicle();
  }

  // ==========================================
  // SPATIAL HASH GRID (Para 60 FPS con cientos de entidades)
  // ==========================================
  class SpatialGrid {
    constructor(cellSize = 90) {
      this.cellSize = cellSize;
      this.cols = Math.ceil(W / cellSize) + 2;
      this.rows = Math.ceil(H / cellSize) + 2;
      this.cells = new Map();
    }
    clear() {
      this.cells.clear();
    }
    insert(item) {
      const cx = Math.floor(item.x / this.cellSize);
      const cy = Math.floor(item.y / this.cellSize);
      const key = `${cx},${cy}`;
      if (!this.cells.has(key)) this.cells.set(key, []);
      this.cells.get(key).push(item);
    }
    queryRadius(x, y, radius, filterFn) {
      const minX = Math.floor((x - radius) / this.cellSize);
      const maxX = Math.floor((x + radius) / this.cellSize);
      const minY = Math.floor((y - radius) / this.cellSize);
      const maxY = Math.floor((y + radius) / this.cellSize);
      const r2 = radius * radius;
      const res = [];
      for (let cy = minY; cy <= maxY; cy++) {
        for (let cx = minX; cx <= maxX; cx++) {
          const key = `${cx},${cy}`;
          const list = this.cells.get(key);
          if (!list) continue;
          for (let i = 0; i < list.length; i++) {
            const it = list[i];
            if (distSq(it.x, it.y, x, y) <= r2) {
              if (!filterFn || filterFn(it)) res.push(it);
            }
          }
        }
      }
      return res;
    }
    nearest(x, y, radius, filterFn) {
      const items = this.queryRadius(x, y, radius, filterFn);
      let best = null, bestD2 = Infinity;
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const d2 = distSq(it.x, it.y, x, y);
        if (d2 < bestD2) {
          bestD2 = d2;
          best = it;
        }
      }
      return best;
    }
  }

  const creatureGrid = new SpatialGrid(90);
  const plantGrid = new SpatialGrid(80);

  // ==========================================
  // AUDIO GENERATIVO (Paisaje sonoro vivo y reactivo)
  // ==========================================
  const Sound = (function () {
    let ctx = null, master = null, filter = null, padGain = null, windGain = null;
    let dreamDelay = null, dreamFeedback = null, dreamWet = null;
    let padOscs = [];
    let lastLabel = null;

    const CHORD = {
      "Amanecer": [130.81, 164.81, 196.00, 261.63],
      "Día": [130.81, 164.81, 196.00, 293.66],
      "Atardecer": [130.81, 155.56, 196.00, 261.63],
      "Noche": [98.00, 116.54, 146.83, 196.00]
    };
    const CUTOFF = { "Amanecer": 1100, "Día": 1600, "Atardecer": 900, "Noche": 420 };

    function build() {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);

      filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1200;
      filter.connect(master);

      padGain = ctx.createGain();
      padGain.gain.value = 0.5;
      padGain.connect(filter);

      // Eco onírico: bucle de delay silencioso hasta que se active el Modo Onírico
      dreamDelay = ctx.createDelay(1.2);
      dreamDelay.delayTime.value = 0.38;
      dreamFeedback = ctx.createGain();
      dreamFeedback.gain.value = 0;
      dreamWet = ctx.createGain();
      dreamWet.gain.value = 0;
      padGain.connect(dreamDelay);
      dreamDelay.connect(dreamFeedback);
      dreamFeedback.connect(dreamDelay);
      dreamDelay.connect(dreamWet);
      dreamWet.connect(master);

      CHORD["Día"].forEach((f, i) => {
        const o = ctx.createOscillator();
        o.type = i === 0 ? "sine" : (i % 2 === 0 ? "triangle" : "sine");
        o.frequency.value = f;
        o.detune.value = (i - 1.5) * 3;
        const g = ctx.createGain();
        g.gain.value = 0.18;
        o.connect(g);
        g.connect(padGain);
        o.start();
        padOscs.push(o);
      });

      const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuf;
      noiseSrc.loop = true;
      const windFilter = ctx.createBiquadFilter();
      windFilter.type = "bandpass";
      windFilter.frequency.value = 500;
      windFilter.Q.value = 0.6;
      windGain = ctx.createGain();
      windGain.gain.value = 0.02;
      noiseSrc.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(master);
      noiseSrc.start();
    }

    function ping(freq, dur, type, vol, delay, panX) {
      if (!ctx) return;
      const t0 = ctx.currentTime + (delay || 0);
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(vol, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g);

      if (panX !== undefined && panX !== null && ctx.createStereoPanner && W > 0) {
        try {
          const panner = ctx.createStereoPanner();
          const panVal = Math.max(-0.85, Math.min(0.85, (panX / W) * 2 - 1));
          panner.pan.setValueAtTime(panVal, t0);
          g.connect(panner);
          panner.connect(master);
        } catch (e) {
          g.connect(master);
        }
      } else {
        g.connect(master);
      }

      o.start(t0);
      o.stop(t0 + dur + 0.05);
    }

    return {
      setEnabled(on) {
        if (on && !ctx) build();
        if (!ctx) return;
        if (ctx.state === "suspended") ctx.resume();
        const t = ctx.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.setTargetAtTime(on ? 0.55 : 0, t, 0.8);
      },
      updateAtmosphere(label, raining, seasonName) {
        if (!ctx) return;
        windGain.gain.setTargetAtTime(raining ? 0.10 : 0.02, ctx.currentTime, 1.5);
        const seasonBrightness = { "Primavera": 1.15, "Verano": 1.3, "Otoño": 0.85, "Invierno": 0.55 }[seasonName] || 1;
        const seasonDetune = { "Primavera": 0, "Verano": 0, "Otoño": -4, "Invierno": -9 }[seasonName] || 0;
        const t = ctx.currentTime;
        if (label !== lastLabel) {
          lastLabel = label;
          const freqs = CHORD[label] || CHORD["Día"];
          padOscs.forEach((o, i) => {
            o.frequency.setTargetAtTime(freqs[i] || freqs[freqs.length - 1], t, 4);
          });
        }
        const cutoff = (CUTOFF[label] || 1200) * seasonBrightness;
        filter.frequency.setTargetAtTime(cutoff, t, 4);
        padOscs.forEach((o, i) => {
          o.detune.setTargetAtTime((i - 1.5) * 3 + seasonDetune, t, 6);
        });
      },
      setDream(on) {
        if (!ctx) return;
        const t = ctx.currentTime;
        dreamWet.gain.setTargetAtTime(on ? 0.4 : 0, t, 1.5);
        dreamFeedback.gain.setTargetAtTime(on ? 0.45 : 0, t, 1.5);
      },
      pluck(x) { ping(880 + Math.random() * 220, 0.5, "sine", 0.09, 0, x); },
      thud(x) { ping(90, 0.4, "sine", 0.16, 0, x); },
      chime(x) {
        ping(660, 1.1, "sine", 0.1, 0, x);
        ping(990, 1.3, "triangle", 0.07, 0.12, x);
        ping(1320, 1.6, "sine", 0.05, 0.26, x);
      },
      shutter() {
        ping(1900, 0.045, "square", 0.1);
        ping(500, 0.08, "square", 0.09, 0.05);
      },
      boom(x) {
        ping(60, 1.4, "sine", 0.28, 0, x);
        ping(45, 1.8, "triangle", 0.18, 0.05, x);
      },
      aurora() {
        if (!ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((f, i) => {
          ping(f, 1.8 + i * 0.2, "sine", 0.07, i * 0.14);
          ping(f * 1.5, 2.0, "triangle", 0.03, i * 0.14 + 0.08);
        });
      },
      pastoralFlute(x) {
        const pentatonic = [392.00, 440.00, 493.88, 587.33, 659.25, 783.99];
        const f = pentatonic[Math.floor(Math.random() * pentatonic.length)];
        ping(f, 0.45, "sine", 0.07, 0, x);
        ping(f * 2, 0.35, "triangle", 0.03, 0.02, x);
      },
      tenseStrings(x) {
        const tones = [146.83, 164.81, 174.61, 220.00];
        const f = tones[Math.floor(Math.random() * tones.length)];
        ping(f, 0.35, "sawtooth", 0.07, 0, x);
      },
      earthTaiko(x) {
        ping(68, 0.4, "triangle", 0.18, 0, x);
        ping(42, 0.6, "sine", 0.14, 0.03, x);
      },
      crystalChimes(x) {
        ping(1174.66, 0.9, "sine", 0.05, 0, x);
        ping(1760.00, 1.2, "triangle", 0.04, 0.08, x);
      },
      celestaArp(x) {
        const notes = [1046.50, 1318.51, 1567.98];
        notes.forEach((f, i) => ping(f, 0.6, "sine", 0.04, i * 0.07, x));
      },
      thunder(x) {
        ping(50, 1.2, "sawtooth", 0.28, 0, x);
        ping(35, 1.6, "triangle", 0.35, 0.04, x);
        ping(120, 0.5, "square", 0.12, 0.01, x);
      },
      singingBowl() {
        if (!ctx) return;
        const notes = [216, 432, 648, 864];
        notes.forEach((f, i) => {
          ping(f, 3.4 + i * 0.6, "sine", 0.08 / (i + 1), i * 0.12);
        });
      },
      cosmicHarp() {
        if (!ctx) return;
        const harp = [261.63, 329.63, 392.00, 493.88, 587.33, 659.25, 783.99];
        harp.forEach((f, i) => {
          const pan = (i / (harp.length - 1)) * (W || 800);
          ping(f, 1.8, "sine", 0.07, i * 0.12, pan);
          ping(f * 2, 1.2, "triangle", 0.02, i * 0.12 + 0.02, pan);
        });
      },
      soulBond() {
        if (!ctx) return;
        const notes = [220, 329.63, 440, 554.37, 659.25, 880];
        notes.forEach((f, i) => {
          ping(f, 1.2, "sine", 0.08, i * 0.1);
        });
      },
      soulRelease() {
        if (!ctx) return;
        const notes = [880, 659.25, 440, 329.63];
        notes.forEach((f, i) => {
          ping(f, 0.9, "sine", 0.07, i * 0.12);
        });
      },
      heartbeat(bpm, stress = 1) {
        if (!ctx) return;
        const t0 = ctx.currentTime;
        const o1 = ctx.createOscillator();
        const g1 = ctx.createGain();
        o1.frequency.setValueAtTime(52 + stress * 10, t0);
        o1.frequency.exponentialRampToValueAtTime(32, t0 + 0.08);
        g1.gain.setValueAtTime(0.22 * Math.min(1.4, stress), t0);
        g1.gain.exponentialRampToValueAtTime(0.001, t0 + 0.08);
        o1.connect(g1); g1.connect(master);
        o1.start(t0); o1.stop(t0 + 0.09);

        const t1 = t0 + 0.12;
        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.frequency.setValueAtTime(44 + stress * 8, t1);
        o2.frequency.exponentialRampToValueAtTime(28, t1 + 0.09);
        g2.gain.setValueAtTime(0.16 * Math.min(1.4, stress), t1);
        g2.gain.exponentialRampToValueAtTime(0.001, t1 + 0.09);
        o2.connect(g2); g2.connect(master);
        o2.start(t1); o2.stop(t1 + 0.1);
      },
      whoosh(x) {
        ping(320, 0.45, "triangle", 0.12, 0, x);
        ping(480, 0.35, "sine", 0.09, 0.05, x);
      },
      roar(x) {
        if (!ctx) return;
        const t0 = ctx.currentTime;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(95, t0);
        o.frequency.exponentialRampToValueAtTime(38, t0 + 0.55);
        g.gain.setValueAtTime(0.22, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.55);
        const f = ctx.createBiquadFilter();
        f.type = "lowpass";
        f.frequency.value = 400;
        o.connect(f); f.connect(g);
        if (x !== undefined && x !== null && ctx.createStereoPanner && W > 0) {
          try {
            const panner = ctx.createStereoPanner();
            panner.pan.setValueAtTime(Math.max(-0.85, Math.min(0.85, (x / W) * 2 - 1)), t0);
            g.connect(panner);
            panner.connect(master);
          } catch (e) {
            g.connect(master);
          }
        } else {
          g.connect(master);
        }
        o.start(t0); o.stop(t0 + 0.6);
      }
    };
  })();

  // ==========================================
  // EVENTOS CÓSMICOS (Lluvias de meteoritos y mutación)
  // ==========================================
  function spawnMeteorShower(count) {
    count = count || Math.floor(rand(3, 7));
    const dir = Math.random() < 0.5 ? 1 : -1;
    for (let i = 0; i < count; i++) {
      meteors.push({
        x: dir > 0 ? rand(-100, W * 0.5) : rand(W * 0.5, W + 100),
        y: rand(-140, -20),
        vx: dir * rand(1.6, 2.6),
        vy: rand(3.2, 4.6),
        trail: [],
        delay: i * rand(6, 22)
      });
    }
    showToast("☄️ Lluvia de meteoros aproximándose...");
  }

  function impactMeteor(m) {
    const ix = clamp(m.x, 20, W - 20), iy = clamp(m.y, 20, H - 20);
    for (let i = 0; i < 26; i++) {
      const ang = rand(0, Math.PI * 2);
      const spd = rand(1, 6);
      particles.push({
        x: ix, y: iy,
        r: rand(1.5, 4),
        alpha: 1,
        color: i % 3 === 0 ? "#9be8ff" : (i % 3 === 1 ? "#ffd36b" : "#ff8a5c"),
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd
      });
    }
    craters.push({ x: ix, y: iy, r: 0, maxR: rand(50, 90), life: 900 });
    mutationZones.push({ x: ix, y: iy, radius: rand(70, 120), life: 1400, maxLife: 1400, seed: rand(0, 1000) });
    alarmWaves.push({ x: ix, y: iy, r: 8, maxR: 260, alpha: 1.0, color: "#4ae0ff" });
    meteorImpacts++;
    Sound.boom();
    showToast("☄️ ¡Impacto! Zona de mutación cósmica activa");
  }

  function cosmicMutate(c) {
    if (c.cosmicMutatedAt && simTime - c.cosmicMutatedAt < 9000) return;
    c.cosmicMutatedAt = simTime;
    const wild = () => 1 + spread(0.4);
    c.genes = {
      speed: clamp(c.genes.speed * wild(), 0.5, 3.2),
      sense: clamp(c.genes.sense * wild(), 45, 260),
      size: clamp(c.genes.size * (1 + spread(0.2)), 1.8, 18),
      stealth: clamp(c.genes.stealth * wild(), 0.2, 0.98),
      aggression: clamp(c.genes.aggression * wild(), 0.1, 1.0),
      staminaEfficiency: clamp(c.genes.staminaEfficiency * wild(), 0.5, 1.8),
      hueOffset: clamp(c.genes.hueOffset + rand(-60, 60), -80, 80)
    };
    c.energy = Math.min(c.maxEnergy, c.energy + 25);
    c.health = Math.min(100, c.health + 15);
    c.setEmote("🌠", 90);
    c.cosmicGlow = 140;
    mutationsCount++;
  }

  function updateCosmicEvents(dt) {
    meteorCooldown -= dt;
    if (meteorCooldown <= 0 && meteors.length === 0) {
      spawnMeteorShower();
      meteorCooldown = rand(2600, 5400);
    }

    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      if (m.delay > 0) { m.delay -= dt; continue; }
      m.x += m.vx * dt * 6;
      m.y += m.vy * dt * 6;
      m.trail.push({ x: m.x, y: m.y });
      if (m.trail.length > 14) m.trail.shift();
      if (m.y >= H - rand(10, 60)) {
        impactMeteor(m);
        meteors.splice(i, 1);
      }
    }

    for (let i = craters.length - 1; i >= 0; i--) {
      const cr = craters[i];
      cr.life -= dt;
      if (cr.r < cr.maxR) cr.r += (cr.maxR - cr.r) * 0.08 * dt;
      if (cr.life <= 0) craters.splice(i, 1);
    }

    for (let i = mutationZones.length - 1; i >= 0; i--) {
      const z = mutationZones[i];
      z.life -= dt;
      if (z.life <= 0) { mutationZones.splice(i, 1); continue; }
      if (Math.random() < 0.02 * dt) spawnFood(z.x + spread(z.radius * 0.7), z.y + spread(z.radius * 0.7));
      const near = creatureGrid.queryRadius(z.x, z.y, z.radius);
      for (let c of near) cosmicMutate(c);
    }

    for (let c of creatures) {
      if (c.cosmicGlow > 0) {
        c.cosmicGlow -= dt;
        if (Math.random() < 0.3 * dt) {
          particles.push({ x: c.x + spread(6), y: c.y + spread(6), r: rand(1, 2.2), alpha: 0.9, color: "#c9a8ff" });
        }
      }
    }
  }

  function drawCraters(ctx) {
    for (let cr of craters) {
      const fade = clamp(cr.life / 900, 0, 1);
      ctx.save();
      ctx.globalAlpha = 0.5 * fade;
      const grad = ctx.createRadialGradient(cr.x, cr.y, 2, cr.x, cr.y, cr.r || 1);
      grad.addColorStop(0, "rgba(20, 14, 10, 0.55)");
      grad.addColorStop(0.7, "rgba(40, 26, 18, 0.35)");
      grad.addColorStop(1, "rgba(40, 26, 18, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cr.x, cr.y, cr.r || 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawMutationZones(ctx) {
    for (let z of mutationZones) {
      const fade = clamp(z.life / z.maxLife, 0, 1);
      const pulse = 0.75 + Math.sin(simTime * 0.006 + z.seed) * 0.25;
      ctx.save();
      ctx.globalAlpha = 0.35 * fade;
      const grad = ctx.createRadialGradient(z.x, z.y, 4, z.x, z.y, z.radius * pulse);
      grad.addColorStop(0, "rgba(180, 140, 255, 0.45)");
      grad.addColorStop(0.6, "rgba(120, 90, 220, 0.18)");
      grad.addColorStop(1, "rgba(120, 90, 220, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.radius * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.6 * fade;
      ctx.strokeStyle = "rgba(201, 168, 255, 0.6)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  function drawMeteors(ctx) {
    for (let m of meteors) {
      if (m.delay > 0) continue;
      ctx.save();
      for (let i = 0; i < m.trail.length; i++) {
        const t = m.trail[i];
        const a = (i / m.trail.length) * 0.7;
        ctx.globalAlpha = a;
        ctx.fillStyle = "#ffe8b0";
        ctx.beginPath();
        ctx.arc(t.x, t.y, 1.6 * (i / m.trail.length) + 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 8);
      grad.addColorStop(0, "#fffdf2");
      grad.addColorStop(0.4, "#ffd88a");
      grad.addColorStop(1, "rgba(255, 180, 80, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ==========================================
  // CLASE CRIATURA (Inteligencia, Instinto y Genética)
  // ==========================================
  class Creature {
    constructor(x, y, speciesId, genes, gen = 0, parentId = null) {
      this.id = nextCreatureId++;
      this.name = generateCreatureName();
      this.parentId = parentId;
      this.x = x;
      this.y = y;
      this.speciesId = speciesId;
      this.spec = SPECIES[speciesId.toUpperCase()] || SPECIES.HERB_AGILE;
      this.genes = genes || this.defaultGenes();
      this.gen = gen;

      this.heading = rand(0, Math.PI * 2);
      this.targetHeading = this.heading;
      this.vx = 0;
      this.vy = 0;

      // Necesidades fisiológicas
      this.maxEnergy = 70 + this.genes.size * 6;
      this.energy = this.maxEnergy * 0.7;
      this.maxWater = 80;
      this.water = this.maxWater * 0.8;
      this.maxStamina = 100;
      this.stamina = this.maxStamina;
      this.health = 100;

      this.age = 0;
      this.maxAge = this.spec.maxAge + this.genes.size * 90 + rand(-300, 300);
      this.state = "WANDER"; // WANDER, GRAZE, DRINK, STALK, CHASE, FLEE, COURT, SLEEP, SCAVENGE, DEFEND
      this.stateTimer = 0;
      this.isSprinting = false;
      this.isInBush = false;

      this.kids = 0;
      this.kills = 0;
      this.legendary = false;
      this.blessed = false;
      this.blessedTimer = 0;
      this.seed = rand(0, 1000);
      this.emote = "";
      this.emoteTimer = 0;
      this.attackCooldown = 0;
      this.target = null;
      this.lastTrailX = x;
      this.lastTrailY = y;
      this.camouflageBoost = 0;
      this.celestialAscent = 0;

      registerLineage(this, parentId);
    }

    defaultGenes() {
      return {
        speed: this.spec.baseSpeed * rand(0.85, 1.15),
        sense: this.spec.baseSense * rand(0.85, 1.15),
        size: this.spec.baseSize * rand(0.85, 1.15),
        stealth: rand(0.4, 0.9),
        aggression: rand(0.3, 0.9),
        staminaEfficiency: rand(0.8, 1.2),
        hueOffset: rand(-15, 15)
      };
    }

    mutateGenes() {
      const g = this.genes;
      return {
        speed: clamp(g.speed * (1 + spread(0.14)), 0.5, 3.2),
        sense: clamp(g.sense * (1 + spread(0.14)), 45, 260),
        size: clamp(g.size * (1 + spread(0.12)), 1.8, 18),
        stealth: clamp(g.stealth * (1 + spread(0.12)), 0.2, 0.98),
        aggression: clamp(g.aggression * (1 + spread(0.12)), 0.1, 1.0),
        staminaEfficiency: clamp(g.staminaEfficiency * (1 + spread(0.12)), 0.5, 1.8),
        hueOffset: clamp(g.hueOffset + spread(6), -35, 35)
      };
    }

    growth() {
      const maturation = this.spec.reproAge * 0.8;
      return Math.min(1, 0.4 + 0.6 * Math.min(1, this.age / maturation));
    }

    radius() {
      return this.genes.size * this.growth();
    }

    setEmote(emoji, duration = 60) {
      if (!options.showEmotes) return;
      this.emote = emoji;
      this.emoteTimer = duration;
    }

    steerToward(tx, ty, dt, turnSpeed, speedScale) {
      const targetHeading = Math.atan2(ty - this.y, tx - this.x);
      this.heading += angleDiff(targetHeading, this.heading) * Math.min(1, turnSpeed * dt);
      const spd = this.genes.speed * speedScale * (this.isSprinting ? 1.45 : 1.0);
      this.x += Math.cos(this.heading) * spd * dt;
      this.y += Math.sin(this.heading) * spd * dt;
    }

    steerAway(px, py, dt, turnSpeed, speedScale) {
      const targetHeading = Math.atan2(this.y - py, this.x - px);
      this.heading += angleDiff(targetHeading, this.heading) * Math.min(1, turnSpeed * dt);
      const spd = this.genes.speed * speedScale * (this.isSprinting ? 1.55 : 1.0);
      this.x += Math.cos(this.heading) * spd * dt;
      this.y += Math.sin(this.heading) * spd * dt;
    }

    wander(dt) {
      this.heading += spread(0.25) * dt;
      const spd = this.genes.speed * 0.45 * dt;
      this.x += Math.cos(this.heading) * spd;
      this.y += Math.sin(this.heading) * spd;
    }

    wrap() {
      const margin = 20;
      if (this.x < -margin) this.x = W + margin;
      else if (this.x > W + margin) this.x = -margin;
      if (this.y < -margin) this.y = H + margin;
      else if (this.y > H + margin) this.y = -margin;
    }

    checkBushCover() {
      if (this.camouflageBoost > 0) {
        this.isInBush = true;
        return;
      }
      this.isInBush = false;
      for (let i = 0; i < bushes.length; i++) {
        const b = bushes[i];
        if (distSq(this.x, this.y, b.x, b.y) < b.radius * b.radius) {
          this.isInBush = true;
          break;
        }
      }
    }

    update(dt) {
      this.age += dt;
      this.stateTimer += dt;
      if (this.emoteTimer > 0) this.emoteTimer -= dt;
      if (this.attackCooldown > 0) this.attackCooldown -= dt;
      if (this.camouflageBoost > 0) this.camouflageBoost -= dt;
      if (this.celestialAscent > 0) this.celestialAscent -= dt;

      if (!this.legendary && isLegendary(this)) {
        this.legendary = true;
        showToast(`⚔️ ${this.name} se ha convertido en leyenda del terrario`);
      }

      this.checkBushCover();

      // Generación de estelas de feromonas bioluminiscentes
      const dTrailSq = distSq(this.x, this.y, this.lastTrailX, this.lastTrailY);
      const minTrailDistSq = this.speciesId === "pollinator" ? 80 : (this.speciesId === "herb_mega" ? 140 : 180);
      if (dTrailSq >= minTrailDistSq) {
        this.lastTrailX = this.x;
        this.lastTrailY = this.y;
        spawnBioTrail(this);
      }

      // Control manual en Modo Encarnación (cuando no está en piloto automático)
      if (possessedCreature === this && !possessionAutopilot) {
        let mx = 0, my = 0;
        if (possessionKeys.KeyW || possessionKeys.ArrowUp) my -= 1;
        if (possessionKeys.KeyS || possessionKeys.ArrowDown) my += 1;
        if (possessionKeys.KeyA || possessionKeys.ArrowLeft) mx -= 1;
        if (possessionKeys.KeyD || possessionKeys.ArrowRight) mx += 1;

        if (mx !== 0 || my !== 0) {
          const targetAngle = Math.atan2(my, mx);
          this.heading += angleDiff(targetAngle, this.heading) * Math.min(1, 0.24 * dt);
          this.isSprinting = Boolean(possessionKeys.ShiftLeft || possessionKeys.ShiftRight) && this.stamina > 10;
          const spd = this.genes.speed * (this.isSprinting ? 1.65 : 1.0) * dt;
          this.x += Math.cos(this.heading) * spd;
          this.y += Math.sin(this.heading) * spd;
          this.wrap();
          this.checkReproduction();
          return;
        }
      }

      // Efectos de Bendición Cósmica
      if (this.blessedTimer > 0) {
        this.blessedTimer -= dt;
        if (this.blessedTimer <= 0) {
          this.blessed = false;
        } else {
          this.blessed = true;
          this.health = Math.min(100, this.health + 0.12 * dt);
          if (Math.random() < 0.25 * dt) {
            particles.push({
              x: this.x + spread(this.radius() * 1.4),
              y: this.y + spread(this.radius() * 1.4),
              r: rand(1.5, 3), alpha: 0.85, color: "#fde047"
            });
          }
        }
      }

      // Santuario Sagrado del Árbol Ancestral
      if (ancientTree) {
        const dTreeSq = distSq(this.x, this.y, ancientTree.x, ancientTree.y);
        if (dTreeSq < 135 * 135) {
          this.stamina = Math.min(this.maxStamina, this.stamina + 0.3 * dt);
          this.health = Math.min(100, this.health + 0.08 * dt);
          if (this.speciesId.startsWith("carn_") && this.energy > 20 && this.target) {
            this.target = null;
            this.state = "WANDER";
            this.setEmote("🕊️", 40);
          }
        }
      }

      // Ingravidez y calma durante el Gran Eclipse
      if (eclipseActive > 0.15) {
        if (Math.random() < 0.15 * dt) {
          particles.push({
            x: this.x + spread(this.radius()),
            y: this.y + spread(this.radius()),
            r: 1.6, alpha: 0.7 * eclipseActive, color: "#e879f9"
          });
        }
      }

      // Desgaste metabólico
      const baseMetabolism = (0.035 * this.genes.size + 0.05 * this.genes.speed);
      const sprintCost = this.isSprinting ? 2.2 / this.genes.staminaEfficiency : 1.0;
      this.energy -= baseMetabolism * sprintCost * dt * seasonMetabolismMult;
      this.water -= 0.035 * dt;

      // Resistencia
      if (this.isSprinting) {
        this.stamina = Math.max(0, this.stamina - 0.45 * dt);
        if (this.stamina <= 0) this.isSprinting = false;
      } else {
        this.stamina = Math.min(this.maxStamina, this.stamina + 0.25 * dt);
      }

      // Ciclo nocturno
      const isNight = dayTime > 0.65 && dayTime < 0.95;
      if (isNight && this.energy > this.maxEnergy * 0.35 && this.water > 25 && this.state === "WANDER") {
        this.state = "SLEEP";
        this.setEmote("💤", 120);
      }

      if (this.state === "SLEEP") {
        if (!isNight || this.energy < this.maxEnergy * 0.25 || this.water < 15) {
          this.state = "WANDER";
        } else {
          this.stamina = Math.min(this.maxStamina, this.stamina + 0.5 * dt);
          this.wrap();
          return;
        }
      }

      // Comportamiento por especie
      switch (this.speciesId) {
        case "herb_agile":
          this.updateHerbAgile(dt);
          break;
        case "herb_mega":
          this.updateHerbMega(dt);
          break;
        case "carn_pack":
          this.updateCarnPack(dt);
          break;
        case "carn_apex":
          this.updateCarnApex(dt);
          break;
        case "scavenger":
          this.updateScavenger(dt);
          break;
        case "pollinator":
          this.updatePollinator(dt);
          break;
      }

      this.wrap();
      this.checkReproduction();
    }

    updateHerbAgile(dt) {
      const senseR = this.genes.sense;
      const predator = creatureGrid.nearest(this.x, this.y, senseR, (c) => {
        if (c.speciesId !== "carn_pack" && c.speciesId !== "carn_apex") return false;
        if (c.isInBush && distSq(this.x, this.y, c.x, c.y) > 40 * 40) return false;
        return true;
      });

      if (predator) {
        this.state = "FLEE";
        this.isSprinting = this.stamina > 15;
        this.steerAway(predator.x, predator.y, dt, 0.22, 1.2);
        this.setEmote("❗", 40);

        if (Math.random() < 0.08 * dt) {
          alarmWaves.push({ x: this.x, y: this.y, r: 5, maxR: 130, alpha: 0.9 });
          const friends = creatureGrid.queryRadius(this.x, this.y, 120, (c) => c.speciesId === "herb_agile" && c !== this);
          for (let f of friends) {
            if (f.state !== "FLEE") {
              f.state = "FLEE";
              f.setEmote("⚠️", 50);
              f.steerAway(predator.x, predator.y, dt, 0.18, 1.1);
            }
          }
        }
        return;
      }

      this.isSprinting = false;

      if (this.water < 35) {
        const pond = this.findNearestWater();
        if (pond) {
          this.state = "DRINK";
          this.steerToward(pond.x, pond.y, dt, 0.14, 0.9);
          if (distSq(this.x, this.y, pond.x, pond.y) < (pond.radius + 10) * (pond.radius + 10)) {
            this.water = Math.min(this.maxWater, this.water + 0.8 * dt);
            this.setEmote("💧", 20);
          }
          return;
        }
      }

      if (this.energy < this.maxEnergy * 0.78) {
        const nearestFood = plantGrid.nearest(this.x, this.y, senseR);
        if (nearestFood) {
          this.state = "GRAZE";
          this.steerToward(nearestFood.x, nearestFood.y, dt, 0.16, 1.0);
          if (distSq(this.x, this.y, nearestFood.x, nearestFood.y) < Math.pow(this.radius() + 5, 2)) {
            this.energy = Math.min(this.maxEnergy, this.energy + nearestFood.nutrition);
            const pIdx = plants.indexOf(nearestFood);
            if (pIdx >= 0) plants.splice(pIdx, 1);
            this.setEmote("🌿", 30);
          }
          return;
        }
      }

      const herd = creatureGrid.queryRadius(this.x, this.y, 80, (c) => c.speciesId === "herb_agile" && c !== this);
      if (herd.length > 0) {
        let avgX = 0, avgY = 0, avgH = 0;
        for (let h of herd) {
          avgX += h.x; avgY += h.y; avgH += h.heading;
          if (distSq(this.x, this.y, h.x, h.y) < 22 * 22) {
            this.steerAway(h.x, h.y, dt, 0.1, 0.6);
          }
        }
        avgX /= herd.length; avgY /= herd.length; avgH /= herd.length;
        this.steerToward(avgX, avgY, dt, 0.05, 0.7);
        this.heading += angleDiff(avgH, this.heading) * 0.04 * dt;
        this.state = "WANDER";
        return;
      }

      this.state = "WANDER";
      this.wander(dt);
    }

    updateHerbMega(dt) {
      const threat = creatureGrid.nearest(this.x, this.y, 50, (c) => c.speciesId === "carn_pack" || c.speciesId === "carn_apex");
      if (threat && distSq(this.x, this.y, threat.x, threat.y) < 35 * 35) {
        this.state = "DEFEND";
        this.setEmote("🛡️", 40);
        if (this.attackCooldown <= 0) {
          threat.health -= 25;
          threat.setEmote("💥", 30);
          this.attackCooldown = 40;
          particles.push({ x: threat.x, y: threat.y, r: 6, alpha: 1, color: "#d24e38" });
        }
      }

      if (this.water < 30) {
        const pond = this.findNearestWater();
        if (pond) {
          this.state = "DRINK";
          this.steerToward(pond.x, pond.y, dt, 0.08, 0.7);
          if (distSq(this.x, this.y, pond.x, pond.y) < (pond.radius + 18) * (pond.radius + 18)) {
            this.water = Math.min(this.maxWater, this.water + 0.9 * dt);
          }
          return;
        }
      }

      if (this.energy < this.maxEnergy * 0.85) {
        const bush = this.findNearestBush();
        if (bush && bush.berries > 0) {
          this.state = "GRAZE";
          this.steerToward(bush.x, bush.y, dt, 0.08, 0.8);
          if (distSq(this.x, this.y, bush.x, bush.y) < (bush.radius + 12) * (bush.radius + 12)) {
            this.energy = Math.min(this.maxEnergy, this.energy + 28);
            bush.berries = Math.max(0, bush.berries - 1);
            this.setEmote("🍃", 35);
          }
          return;
        }
        const food = plantGrid.nearest(this.x, this.y, this.genes.sense);
        if (food) {
          this.state = "GRAZE";
          this.steerToward(food.x, food.y, dt, 0.08, 0.8);
          if (distSq(this.x, this.y, food.x, food.y) < Math.pow(this.radius() + 6, 2)) {
            this.energy = Math.min(this.maxEnergy, this.energy + food.nutrition * 1.5);
            const pIdx = plants.indexOf(food);
            if (pIdx >= 0) plants.splice(pIdx, 1);
          }
          return;
        }
      }

      this.state = "WANDER";
      this.wander(dt);
    }

    updateCarnPack(dt) {
      this.isSprinting = false;

      if (this.energy > this.maxEnergy * 0.88) {
        this.state = "REST";
        this.setEmote("🍖", 30);
        this.wander(dt * 0.5);
        return;
      }

      if (this.water < 25) {
        const pond = this.findNearestWater();
        if (pond) {
          this.state = "DRINK";
          this.steerToward(pond.x, pond.y, dt, 0.12, 0.8);
          if (distSq(this.x, this.y, pond.x, pond.y) < (pond.radius + 12) * (pond.radius + 12)) {
            this.water = Math.min(this.maxWater, this.water + 0.8 * dt);
          }
          return;
        }
      }

      const corpse = this.findNearestCarcass();
      if (corpse && corpse.meat > 0) {
        this.state = "SCAVENGE";
        this.steerToward(corpse.x, corpse.y, dt, 0.15, 1.0);
        if (distSq(this.x, this.y, corpse.x, corpse.y) < 18 * 18) {
          const bite = Math.min(corpse.meat, 0.6 * dt * 25);
          corpse.meat -= bite;
          this.energy = Math.min(this.maxEnergy, this.energy + bite);
          this.setEmote("🥩", 20);
        }
        return;
      }

      const prey = creatureGrid.nearest(this.x, this.y, this.genes.sense, (c) => {
        if (c.speciesId !== "herb_agile" && c.speciesId !== "herb_mega") return false;
        if (c.isInBush && distSq(this.x, this.y, c.x, c.y) > 35 * 35) return false;
        return true;
      });

      if (prey) {
        const d = Math.sqrt(distSq(this.x, this.y, prey.x, prey.y));

        if (d > 75) {
          this.state = "STALK";
          this.steerToward(prey.x, prey.y, dt, 0.12, 0.65);
          this.setEmote("🎯", 30);
        } else {
          this.state = "CHASE";
          this.isSprinting = this.stamina > 10;
          this.steerToward(prey.x, prey.y, dt, 0.22, 1.25);
          this.setEmote("⚡", 25);

          if (d < this.radius() + prey.radius() + 4) {
            prey.health -= 45 * dt * 0.15;
            if (prey.health <= 0) {
              this.energy = Math.min(this.maxEnergy, this.energy + prey.energy * 0.6 + 30);
              this.kills++;
              totalKills++;
              recentKillTimes.push(Date.now());
              Sound.thud();
              this.setEmote("🐺", 60);
              spawnCorpse(prey.x, prey.y, prey.speciesId, prey.radius() * 8);
              recordDeath(prey, "cazado en manada");
              removeCreature(prey);
            }
          }
        }
        return;
      }

      this.state = "WANDER";
      this.wander(dt);
    }

    updateCarnApex(dt) {
      this.isSprinting = false;

      if (this.energy > this.maxEnergy * 0.9) {
        this.state = "REST";
        this.wander(dt * 0.4);
        return;
      }

      if (Math.random() < 0.005 * dt) {
        this.setEmote("🦖", 80);
        alarmWaves.push({ x: this.x, y: this.y, r: 8, maxR: 220, alpha: 1.0, color: "#8e2b88" });
        const nearby = creatureGrid.queryRadius(this.x, this.y, 200, (c) => c !== this && c.speciesId !== "carn_apex");
        for (let c of nearby) {
          c.setEmote("😱", 60);
          c.steerAway(this.x, this.y, dt, 0.25, 1.4);
        }
      }

      const prey = creatureGrid.nearest(this.x, this.y, this.genes.sense, (c) => {
        return c !== this && (c.speciesId === "herb_mega" || c.speciesId === "herb_agile" || c.speciesId === "carn_pack");
      });

      if (prey) {
        this.state = "CHASE";
        this.isSprinting = this.stamina > 20;
        this.steerToward(prey.x, prey.y, dt, 0.15, 1.15);

        const d = Math.sqrt(distSq(this.x, this.y, prey.x, prey.y));
        if (d < this.radius() + prey.radius() + 6) {
          prey.health -= 70 * dt * 0.15;
          if (prey.health <= 0) {
            this.energy = Math.min(this.maxEnergy, this.energy + 70);
            this.kills++;
            totalKills++;
            recentKillTimes.push(Date.now());
            Sound.thud();
            this.setEmote("👑", 70);
            spawnCorpse(prey.x, prey.y, prey.speciesId, prey.radius() * 12);
            recordDeath(prey, "cazado por un apex");
            removeCreature(prey);
          }
        }
        return;
      }

      this.state = "WANDER";
      this.wander(dt);
    }

    updateScavenger(dt) {
      const corpse = this.findNearestCarcass();
      if (corpse && corpse.meat > 0) {
        this.state = "SCAVENGE";
        this.steerToward(corpse.x, corpse.y, dt, 0.18, 1.1);
        if (distSq(this.x, this.y, corpse.x, corpse.y) < 14 * 14) {
          const bite = Math.min(corpse.meat, 0.4 * dt * 20);
          corpse.meat -= bite;
          this.energy = Math.min(this.maxEnergy, this.energy + bite * 1.2);
          this.setEmote("🦅", 25);
        }
        return;
      }

      this.state = "WANDER";
      this.heading += 0.04 * dt;
      this.x += Math.cos(this.heading) * this.genes.speed * dt;
      this.y += Math.sin(this.heading) * this.genes.speed * dt;
    }

    updatePollinator(dt) {
      this.heading += spread(0.5) * dt;
      this.x += Math.cos(this.heading) * this.genes.speed * 0.8 * dt;
      this.y += Math.sin(this.heading) * this.genes.speed * 0.8 * dt;

      const bush = this.findNearestBush();
      if (bush && distSq(this.x, this.y, bush.x, bush.y) < (bush.radius + 15) * (bush.radius + 15)) {
        if (bush.berries < bush.maxBerries && Math.random() < 0.04 * dt) {
          bush.berries++;
          this.energy = Math.min(this.maxEnergy, this.energy + 8);
          this.setEmote("✨", 25);
        }
      }

      if (Math.random() < 0.012 * dt && plants.length < 180) {
        spawnFood(this.x + spread(15), this.y + spread(15));
      }
    }

    checkReproduction() {
      if (creatures.filter(c => c.speciesId === this.speciesId).length >= this.spec.cap) return;
      if (this.age < this.spec.reproAge) return;
      if (this.energy < this.maxEnergy * this.spec.reproFrac) return;
      if (this.water < 30) return;

      const childGenes = this.mutateGenes();
      const child = new Creature(
        this.x + spread(12),
        this.y + spread(12),
        this.speciesId,
        childGenes,
        this.gen + 1,
        this.id
      );
      child.energy = this.energy * 0.45;
      this.energy *= 0.55;
      this.kids++;
      births++;
      recentBirthTimes.push(Date.now());
      Sound.pluck();
      if (child.gen > maxGen) maxGen = child.gen;

      creatures.push(child);
      this.setEmote("❤️", 60);
      particles.push({ x: this.x, y: this.y, r: 8, alpha: 1, color: "#ff6b8b" });
    }

    findNearestWater() {
      let best = null, bestD2 = Infinity;
      for (let p of waterBodies) {
        const d2 = distSq(this.x, this.y, p.x, p.y);
        if (d2 < bestD2) { bestD2 = d2; best = p; }
      }
      return best;
    }

    findNearestBush() {
      let best = null, bestD2 = Infinity;
      for (let b of bushes) {
        const d2 = distSq(this.x, this.y, b.x, b.y);
        if (d2 < bestD2) { bestD2 = d2; best = b; }
      }
      return best;
    }

    findNearestCarcass() {
      let best = null, bestD2 = Infinity;
      for (let c of carcasses) {
        if (c.meat <= 0) continue;
        const d2 = distSq(this.x, this.y, c.x, c.y);
        if (d2 < bestD2) { bestD2 = d2; best = c; }
      }
      return best;
    }

    draw(ctx) {
      const r = this.radius();
      const energyFrac = clamp(this.energy / this.maxEnergy, 0, 1);
      const isNight = dayTime > 0.65 && dayTime < 0.95;

      ctx.save();
      ctx.translate(this.x, this.y);

      ctx.beginPath();
      ctx.ellipse(0, r * 0.4, r * 1.1, r * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
      ctx.fill();

      if (this.isInBush) ctx.globalAlpha = 0.5;

      ctx.rotate(this.heading);

      switch (this.speciesId) {
        case "herb_agile": {
          const legPhase = Math.sin(simTime * 0.025 * this.genes.speed + this.seed);
          ctx.strokeStyle = "#1b4d37";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-r * 0.4, -r * 0.7); ctx.lineTo(-r * 0.4 + legPhase * 4, -r * 1.1);
          ctx.moveTo(-r * 0.4, r * 0.7); ctx.lineTo(-r * 0.4 - legPhase * 4, r * 1.1);
          ctx.moveTo(r * 0.4, -r * 0.7); ctx.lineTo(r * 0.4 - legPhase * 4, -r * 1.1);
          ctx.moveTo(r * 0.4, r * 0.7); ctx.lineTo(r * 0.4 + legPhase * 4, r * 1.1);
          ctx.stroke();

          ctx.fillStyle = `hsl(${145 + this.genes.hueOffset}, 62%, ${38 + energyFrac * 16}%)`;
          ctx.beginPath();
          ctx.ellipse(0, 0, r * 1.25, r * 0.75, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(0,0,0,0.3)";
          ctx.lineWidth = 0.8;
          ctx.stroke();

          ctx.fillStyle = "#8dcfa5";
          ctx.beginPath();
          ctx.ellipse(r * 0.6, -r * 0.6, r * 0.35, r * 0.15, -0.4, 0, Math.PI * 2);
          ctx.ellipse(r * 0.6, r * 0.6, r * 0.35, r * 0.15, 0.4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#112211";
          ctx.beginPath();
          ctx.arc(r * 0.7, -r * 0.3, Math.max(1, r * 0.18), 0, Math.PI * 2);
          ctx.arc(r * 0.7, r * 0.3, Math.max(1, r * 0.18), 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case "herb_mega": {
          const wag = Math.sin(simTime * 0.008 + this.seed) * 0.3;
          ctx.strokeStyle = "#4d5e23";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-r * 0.9, 0);
          ctx.lineTo(-r * 1.6, wag * 8);
          ctx.stroke();
          ctx.fillStyle = "#2c3b12";
          ctx.beginPath();
          ctx.arc(-r * 1.6, wag * 8, 3.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `hsl(${85 + this.genes.hueOffset}, 45%, ${32 + energyFrac * 14}%)`;
          ctx.beginPath();
          ctx.ellipse(0, 0, r * 1.15, r * 0.95, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(0,0,0,0.4)";
          ctx.lineWidth = 1.8;
          ctx.stroke();

          ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
          ctx.beginPath();
          ctx.arc(-r * 0.3, 0, r * 0.45, 0, Math.PI * 2);
          ctx.arc(r * 0.3, 0, r * 0.4, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case "carn_pack": {
          const tailWag = Math.sin(simTime * 0.03 * this.genes.speed + this.seed) * 0.6;
          ctx.fillStyle = "#8a2416";
          ctx.beginPath();
          ctx.moveTo(-r * 0.9, 0);
          ctx.lineTo(-r * 1.8, tailWag * 6);
          ctx.lineTo(-r * 1.7, tailWag * 6 - 3);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = `hsl(${12 + this.genes.hueOffset}, 75%, ${42 + energyFrac * 16}%)`;
          ctx.beginPath();
          ctx.ellipse(0, 0, r * 1.35, r * 0.65, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(0,0,0,0.35)";
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = "#4a0f07";
          ctx.beginPath();
          ctx.moveTo(r * 0.2, -r * 0.55); ctx.lineTo(r * 0.5, -r * 1.1); ctx.lineTo(r * 0.7, -r * 0.45);
          ctx.moveTo(r * 0.2, r * 0.55); ctx.lineTo(r * 0.5, r * 1.1); ctx.lineTo(r * 0.7, r * 0.45);
          ctx.fill();

          ctx.fillStyle = isNight ? "#ffeb3b" : "#1a0503";
          ctx.beginPath();
          ctx.arc(r * 0.8, -r * 0.25, Math.max(1, r * 0.16), 0, Math.PI * 2);
          ctx.arc(r * 0.8, r * 0.25, Math.max(1, r * 0.16), 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case "carn_apex": {
          const jawPhase = Math.sin(simTime * 0.015 + this.seed) * 0.2;
          ctx.fillStyle = "#481044";
          for (let i = -3; i <= 3; i++) {
            ctx.beginPath();
            ctx.moveTo(i * r * 0.28, -r * 0.55);
            ctx.lineTo(i * r * 0.28, -r * 1.1);
            ctx.lineTo(i * r * 0.28 + 4, -r * 0.55);
            ctx.fill();
          }

          ctx.fillStyle = `hsl(${295 + this.genes.hueOffset}, 60%, ${28 + energyFrac * 16}%)`;
          ctx.beginPath();
          ctx.ellipse(0, 0, r * 1.3, r * 0.8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(0,0,0,0.5)";
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = "#ff2a55";
          ctx.beginPath();
          ctx.arc(r * 0.9, 0, r * 0.35 + jawPhase * 2, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#00ffff";
          ctx.beginPath();
          ctx.arc(r * 0.75, -r * 0.35, Math.max(1.5, r * 0.15), 0, Math.PI * 2);
          ctx.arc(r * 0.75, r * 0.35, Math.max(1.5, r * 0.15), 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case "scavenger": {
          const wingPhase = Math.sin(simTime * 0.025 + this.seed);
          ctx.fillStyle = "#33415c";
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-r * 0.5, -r * 2.2 + wingPhase * 4);
          ctx.lineTo(r * 0.6, 0);
          ctx.lineTo(-r * 0.5, r * 2.2 - wingPhase * 4);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = "#1e293b";
          ctx.beginPath();
          ctx.ellipse(0, 0, r * 1.1, r * 0.45, 0, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case "pollinator": {
          const flutter = Math.sin(simTime * 0.05 + this.seed);
          ctx.fillStyle = "rgba(255, 220, 80, 0.4)";
          ctx.beginPath();
          ctx.arc(0, 0, r * 2.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
          ctx.beginPath();
          ctx.ellipse(0, -r * 1.2, r * 0.8, r * 0.4 + flutter * 0.2, 0.3, 0, Math.PI * 2);
          ctx.ellipse(0, r * 1.2, r * 0.8, r * 0.4 - flutter * 0.2, -0.3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#ffd54f";
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
      }

      ctx.restore();

      if (this.legendary) {
        const pulse = 0.5 + 0.5 * Math.sin(simTime * 0.004 + this.seed);
        ctx.save();
        ctx.globalAlpha = 0.35 + 0.35 * pulse;
        ctx.strokeStyle = "#ffd54f";
        ctx.shadowColor = "#ffd54f";
        ctx.shadowBlur = 12 + pulse * 10;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r + 5 + pulse * 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.font = "11px sans-serif";
        ctx.textAlign = "center";
        ctx.globalAlpha = 0.85;
        ctx.fillText("⭐", this.x, this.y - r - 14);
        ctx.restore();
      }

      if (this.blessed) {
        const bPulse = 0.5 + 0.5 * Math.sin(simTime * 0.006 + this.seed);
        ctx.save();
        ctx.strokeStyle = "#fde047";
        ctx.shadowColor = "#eab308";
        ctx.shadowBlur = 10 + bPulse * 8;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - r - 12, r * 0.85 + 3, (r * 0.85 + 3) * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (options.showVision && (this === selectedCreature || this.speciesId === "carn_apex" || this.state === "CHASE")) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
        ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.genes.sense, this.heading - 0.7, this.heading + 0.7);
        ctx.lineTo(this.x, this.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      if (options.showEmotes && this.emote && this.emoteTimer > 0) {
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(this.emote, this.x, this.y - r - 8);
      }

      if (options.showBars || this === selectedCreature) {
        const barW = Math.max(20, r * 2.5);
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(this.x - barW / 2, this.y - r - 6, barW, 3);
        ctx.fillStyle = "#4ae0b5";
        ctx.fillRect(this.x - barW / 2, this.y - r - 6, barW * energyFrac, 3);
      }

      if (this === selectedCreature) {
        ctx.strokeStyle = "#4ae0b5";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r + 7, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  // ==========================================
  // AMBIENTE, BIOMAS Y VEGETACIÓN DINÁMICA
  // ==========================================
  function initBiomes() {
    initAncientTree();
    waterBodies = [];
    bushes = [];

    const numPonds = W > 800 ? 3 : 2;
    for (let i = 0; i < numPonds; i++) {
      let px = rand(W * 0.15, W * 0.85);
      let py = rand(H * 0.15, H * 0.85);
      if (ancientTree && distSq(px, py, ancientTree.x, ancientTree.y) < 140 * 140) {
        px = px < W * 0.5 ? px - 90 : px + 90;
      }
      waterBodies.push({
        x: clamp(px, 60, W - 60),
        y: clamp(py, 60, H - 60),
        radius: rand(45, 80),
        seed: rand(0, 1000)
      });
    }

    const numBushes = Math.floor(W * H / 45000);
    for (let i = 0; i < numBushes; i++) {
      bushes.push({
        x: rand(30, W - 30),
        y: rand(30, H - 30),
        radius: rand(24, 42),
        berries: Math.floor(rand(2, 6)),
        maxBerries: 8,
        seed: rand(0, 1000)
      });
    }
  }

  function spawnFood(x, y) {
    if (plants.length >= 220) return;
    plants.push({
      x: clamp(x, 10, W - 10),
      y: clamp(y, 10, H - 10),
      nutrition: rand(25, 45),
      seed: rand(0, 1000),
      grow: 0.1
    });
  }

  function spawnCorpse(x, y, speciesId, meatAmount) {
    carcasses.push({
      x: x,
      y: y,
      speciesId: speciesId,
      meat: meatAmount,
      maxMeat: meatAmount,
      decay: 0,
      bones: false
    });
  }

  function removeCreature(c) {
    const idx = creatures.indexOf(c);
    if (idx >= 0) {
      if (selectedCreature === c) selectedCreature = null;
      creatures.splice(idx, 1);
    }
  }

  // ==========================================
  // REINICIO Y POBLACIÓN INICIAL
  // ==========================================
  function seedWorld() {
    archiveEra();
    meteorImpacts = 0;
    mutationsCount = 0;
    extinctions = [];
    prevSpeciesCounts = {};
    lineageArchive = {};

    creatures = [];
    plants = [];
    carcasses = [];
    particles = [];
    alarmWaves = [];
    popHistory = [];
    meteors = [];
    craters = [];
    mutationZones = [];
    meteorCooldown = rand(1400, 3200);
    skyParticles = [];
    moodParticles = [];
    recentDeathTimes = [];
    recentBirthTimes = [];
    recentKillTimes = [];
    currentMood = Object.assign({ id: "calma" }, MOODS.calma);
    moodPulse = 0;
    seasonTime = 0;
    births = 0;
    totalKills = 0;
    maxGen = 0;
    simTime = 0;
    realElapsedMs = 0;
    selectedCreature = null;
    followingCreature = null;
    bioTrails.length = 0;
    releaseSoulBond();
    auroraActive = 0;
    auroraManualTimer = 0;
    eclipsesWitnessed = 0;
    treeBloomsWitnessed = 0;
    eclipseActive = 0;
    eclipseTimer = 0;
    cymaticPulse = 0;
    soulWisps = [];
    lightningBolts = [];
    vortices = [];
    camX = W / 2;
    camY = H / 2;
    camZoom = 1.0;

    initBiomes();

    for (let i = 0; i < 60; i++) spawnFood(rand(0, W), rand(0, H));

    for (let i = 0; i < 28; i++) creatures.push(new Creature(rand(0, W), rand(0, H), "herb_agile", null, 0));
    for (let i = 0; i < 6; i++) creatures.push(new Creature(rand(0, W), rand(0, H), "herb_mega", null, 0));
    for (let i = 0; i < 7; i++) creatures.push(new Creature(rand(0, W), rand(0, H), "carn_pack", null, 0));
    for (let i = 0; i < 2; i++) creatures.push(new Creature(rand(0, W), rand(0, H), "carn_apex", null, 0));
    for (let i = 0; i < 6; i++) creatures.push(new Creature(rand(0, W), rand(0, H), "scavenger", null, 0));
    for (let i = 0; i < 8; i++) creatures.push(new Creature(rand(0, W), rand(0, H), "pollinator", null, 0));

    showToast("Terrario reiniciado con éxito");
  }

  // ==========================================
  // BUCLE DE ACTUALIZACIÓN (SIMULACIÓN FÍSICA)
  // ==========================================
  function tick(dt) {
    updateMoodAura(dt);
    if (options.autoDayNight) {
      dayTime = (dayTime + 0.00015 * dt) % 1.0;
      document.getElementById("rangeTod").value = Math.floor(dayTime * 100);
    } else {
      dayTime = document.getElementById("rangeTod").value / 100;
    }

    // Avance del ciclo anual (mucho más lento que el ciclo día/noche)
    seasonTime = (seasonTime + 0.000016 * dt) % 1.0;
    const seasonPos = seasonTime * 4;
    seasonIdx = Math.floor(seasonPos) % 4;
    seasonProgress = seasonPos - Math.floor(seasonPos);
    const seasonA = SEASONS[seasonIdx], seasonB = SEASONS[(seasonIdx + 1) % 4];
    seasonMetabolismMult = seasonA.metabolism + (seasonB.metabolism - seasonA.metabolism) * seasonProgress;
    const seasonFoodMult = seasonA.foodMult + (seasonB.foodMult - seasonA.foodMult) * seasonProgress;

    if (rainActive > 0) {
      rainActive -= dt;
      if (Math.random() < 0.3 * dt) spawnFood(rand(0, W), rand(0, H));
      for (let i = 0; i < 3; i++) {
        particles.push({
          x: rand(0, W),
          y: rand(0, H),
          r: 1.5,
          alpha: 0.6,
          color: "#70c2e6"
        });
      }
    }

    const foodChance = foodRate * 0.08 * dt * seasonFoodMult;
    if (Math.random() < foodChance) {
      spawnFood(rand(0, W), rand(0, H));
    }

    for (let b of bushes) {
      if (b.berries < b.maxBerries && Math.random() < 0.003 * dt * seasonFoodMult * (foodRate + (rainActive > 0 ? 2 : 0))) {
        b.berries++;
      }
    }

    // Clima ambiental estacional: nieve, hojas caídas o pétalos a la deriva
    if (seasonA.weather && skyParticles.length < 70 && Math.random() < 0.9 * dt) {
      skyParticles.push({
        type: seasonA.weather,
        x: rand(-20, W + 20),
        y: -10,
        r: seasonA.weather === "snow" ? rand(1.5, 3) : rand(2.5, 4.5),
        vy: seasonA.weather === "snow" ? rand(0.25, 0.5) : rand(0.45, 0.85),
        sway: rand(0.3, 1.0),
        swayPhase: rand(0, Math.PI * 2),
        rot: rand(0, Math.PI * 2),
        rotSpeed: rand(-1, 1),
        alpha: rand(0.5, 0.9),
        color: seasonA.weatherColor
      });
    }
    for (let i = skyParticles.length - 1; i >= 0; i--) {
      const sp = skyParticles[i];
      sp.swayPhase += dt * 0.05;
      sp.x += Math.sin(sp.swayPhase) * sp.sway;
      sp.y += sp.vy * dt;
      sp.rot += sp.rotSpeed * dt * 0.03;
      if (sp.y > H + 10 || (!seasonA.weather && sp.type !== seasonB.weather)) skyParticles.splice(i, 1);
    }

    creatureGrid.clear();
    for (let c of creatures) creatureGrid.insert(c);

    plantGrid.clear();
    for (let p of plants) plantGrid.insert(p);

    for (let i = creatures.length - 1; i >= 0; i--) {
      const c = creatures[i];
      c.update(dt);

      if (c.energy <= 0 || c.water <= 0 || c.age > c.maxAge || c.health <= 0) {
        let cause = "vejez";
        if (c.energy <= 0) cause = "hambre";
        else if (c.water <= 0) cause = "sed";
        else if (c.health <= 0) cause = "heridas";
        spawnCorpse(c.x, c.y, c.speciesId, c.radius() * 6);
        particles.push({ x: c.x, y: c.y, r: 6, alpha: 0.8, color: "#888888" });
        recordDeath(c, cause);
        removeCreature(c);
      }
    }

    for (let i = carcasses.length - 1; i >= 0; i--) {
      const c = carcasses[i];
      c.decay += 0.02 * dt;
      if (c.meat <= 0 && !c.bones) {
        c.bones = true;
      }
      if (c.decay >= 100 || (c.bones && c.decay >= 40)) {
        spawnFood(c.x, c.y);
        spawnFood(c.x + 8, c.y - 6);
        carcasses.splice(i, 1);
      }
    }

    for (let i = alarmWaves.length - 1; i >= 0; i--) {
      const w = alarmWaves[i];
      w.r += 2.5 * dt;
      w.alpha -= 0.025 * dt;
      if (w.alpha <= 0 || w.r >= w.maxR) alarmWaves.splice(i, 1);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      if (p.vx || p.vy) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.94;
        p.vy *= 0.94;
      }
      p.alpha -= 0.03 * dt;
      if (p.alpha <= 0) particles.splice(i, 1);
    }

    updateCosmicEvents(dt);
    updateAurora(dt);
    updateBioTrails(dt);
    updateSoulBond(dt);
    updateAncientTree(dt);
    updateEclipse(dt);
    updateElementalPowers(dt);
    if (cymaticPulse > 0) cymaticPulse = Math.max(0, cymaticPulse - 0.012 * dt);

    if (options.dreamMode) {
      poemTimer -= dt;
      if (poemTimer <= 0) {
        nextPoemLine();
        poemTimer = rand(340, 520);
      }
    }
  }

  // ==========================================
  // ESTELAS DE FEROMONAS BIOLUMINISCENTES
  // ==========================================
  function spawnBioTrail(c) {
    if (bioTrails.length >= MAX_BIO_TRAILS) bioTrails.shift();
    const colors = {
      herb_agile: "#34d399",
      herb_mega: "#fbbf24",
      carn_pack: "#f87171",
      carn_apex: "#c084fc",
      scavenger: "#38bdf8",
      pollinator: "#fef08a"
    };
    const col = colors[c.speciesId] || "#a7f3d0";
    const rad = c.speciesId === "herb_mega" ? 3.4 : (c.speciesId === "pollinator" ? 1.6 : 2.2);
    bioTrails.push({
      x: c.x,
      y: c.y,
      vx: spread(0.12),
      vy: spread(0.12),
      r: rad,
      alpha: c.legendary ? 0.95 : (options.dreamMode ? 0.85 : 0.65),
      decay: options.dreamMode ? 0.0022 : 0.0055,
      color: col,
      speciesId: c.speciesId,
      legendary: c.legendary
    });
  }

  function updateBioTrails(dt) {
    for (let i = bioTrails.length - 1; i >= 0; i--) {
      const t = bioTrails[i];
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      t.alpha -= t.decay * dt;
      if (t.alpha <= 0.02) bioTrails.splice(i, 1);
    }
  }

  function drawBioTrails(tctx) {
    if (bioTrails.length === 0) return;
    tctx.save();
    const isNight = dayTime > 0.65 && dayTime < 0.95;
    if (isNight || options.dreamMode) {
      tctx.shadowBlur = 6;
    }
    for (let i = 0; i < bioTrails.length; i++) {
      const t = bioTrails[i];
      tctx.globalAlpha = t.alpha;
      tctx.fillStyle = t.color;
      if (isNight || options.dreamMode) tctx.shadowColor = t.color;
      tctx.beginPath();
      tctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
      tctx.fill();
    }
    tctx.restore();
  }

  // ==========================================
  // LA GRAN AURORA BOREAL CÓSMICA
  // ==========================================
  function updateAurora(dt) {
    let target = 0.0;
    const isNight = dayTime > 0.65 && dayTime < 0.95;
    if (isNight) {
      target = 0.5 + 0.35 * Math.sin(simTime * 0.0008);
    } else if (dayTime >= 0.55 && dayTime <= 0.65) {
      target = 0.25;
    }
    if (currentMood.id === "renacer") target = Math.max(target, 0.75);
    if (currentMood.id === "calma") target = Math.max(target, 0.45);
    if (currentMood.id === "duelo") target = Math.max(target, 0.4);

    if (auroraManualTimer > 0) {
      auroraManualTimer -= dt;
      target = 1.0;
    }

    auroraActive += (target - auroraActive) * 0.02 * dt;

    const auroraIconEl = document.getElementById("auroraIcon");
    const auroraLabelEl = document.getElementById("auroraLabel");
    if (auroraIconEl && auroraLabelEl) {
      if (auroraActive > 0.55) {
        auroraIconEl.classList.add("active");
        auroraLabelEl.textContent = auroraActive > 0.85 ? "Tormenta Boreal" : "Ondas Esmeralda";
      } else if (auroraActive > 0.18) {
        auroraIconEl.classList.remove("active");
        auroraLabelEl.textContent = "Velo Tenue";
      } else {
        auroraIconEl.classList.remove("active");
        auroraLabelEl.textContent = "Velo Calmo";
      }
    }
  }

  function drawAurora(actx) {
    if (auroraActive < 0.03) return;
    const t = simTime * 0.0008;
    actx.save();

    // Velo etéreo de fondo
    const skyGlow = actx.createLinearGradient(0, 0, 0, H * 0.55);
    skyGlow.addColorStop(0, `rgba(0, 255, 162, ${0.12 * auroraActive})`);
    skyGlow.addColorStop(0.4, `rgba(168, 85, 247, ${0.09 * auroraActive})`);
    skyGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    actx.fillStyle = skyGlow;
    actx.fillRect(0, 0, W, H * 0.55);

    // Cortinas de luz ondulante
    const bands = [
      { y0: H * 0.06, h: H * 0.32, color1: "rgba(0, 255, 162, ", color2: "rgba(56, 189, 248, ", speed: 1.0, freq: 0.0035 },
      { y0: H * 0.12, h: H * 0.36, color1: "rgba(168, 85, 247, ", color2: "rgba(244, 63, 94, ", speed: -0.8, freq: 0.0042 },
      { y0: H * 0.04, h: H * 0.28, color1: "rgba(56, 189, 248, ", color2: "rgba(0, 255, 162, ", speed: 1.2, freq: 0.005 }
    ];

    actx.globalCompositeOperation = "screen";

    for (let b of bands) {
      const step = 20;
      for (let x = -20; x <= W + 20; x += step) {
        const wave1 = Math.sin(x * b.freq + t * b.speed) * 32;
        const wave2 = Math.cos(x * (b.freq * 1.8) - t * 0.7) * 18;
        const yTop = b.y0 + wave1 + wave2;
        const yBot = yTop + b.h + Math.sin(x * 0.005 + t) * 24;

        const rayGrad = actx.createLinearGradient(x, yTop, x, yBot);
        const alphaPeak = (0.28 + 0.12 * Math.sin(x * 0.02 + t * 2)) * auroraActive;
        rayGrad.addColorStop(0, b.color1 + "0)");
        rayGrad.addColorStop(0.2, b.color1 + alphaPeak + ")");
        rayGrad.addColorStop(0.65, b.color2 + (alphaPeak * 0.8) + ")");
        rayGrad.addColorStop(1, b.color2 + "0)");

        actx.fillStyle = rayGrad;
        actx.fillRect(x - 2, yTop, step + 4, yBot - yTop);
      }
    }

    actx.restore();
  }

  // ==========================================
  // VÍNCULO DEL ALMA / MODO ENCARNACIÓN
  // ==========================================
  const SOUL_THOUGHTS = {
    herb_agile: [
      (c, ctx) => `El viento acaricia mis orejas. Percibo la humedad del pasto a ${ctx.distWater}m, pero el aire huele a peligro.`,
      (c, ctx) => `Mis patas tiemblan de vigor. Un salto en falso y los Cazadores me arrancarán la piel; la manada es mi refugio.`,
      (c, ctx) => `He corrido bajo tres soles. Si el invierno llega pronto, la velocidad de mis músculos será mi única oración.`,
      (c, ctx) => `El follaje espeso me cubre. Mientras no haga ruido, los depredadores pasarán de largo sin ver mis ojos.`
    ],
    herb_mega: [
      (c, ctx) => `El suelo retumba a cada paso. Mis huesos son roca antigua y ningún cazador solitario se atreverá a desafiarme.`,
      (c, ctx) => `Los arbustos de bayas se rinden a mi andar. El terrario es paciente y yo camino al compás de las eras.`,
      (c, ctx) => `He engendrado ${c.kids} crías gigantescas. Cuando mis ojos se apaguen, la llanura seguirá llevando mi memoria.`,
      (c, ctx) => `La corteza de mi lomo detiene espinas y garras. No huyo: solo avanzo hacia donde brota el agua.`
    ],
    carn_pack: [
      (c, ctx) => `El aroma de presa tibia corta la brisa. Mis colmillos reclaman su tributo antes de que caiga la noche.`,
      (c, ctx) => `Somos el enjambre que danza en la sombra. Si la manada rodea a la presa a ${ctx.distPrey}m, la cacería será nuestra.`,
      (c, ctx) => `El hambre me araña el estómago con furia. Un zarpazo veloz devolverá la energía a mis patas cansadas.`,
      (c, ctx) => `He cazado ${c.kills} veces bajo este firmamento. Cada vida arrebatada alimenta el fuego de mi estirpe.`
    ],
    carn_apex: [
      (c, ctx) => `Soy el monarca indiscutido de este terrario. Todos los que pastan en este valle conocen el eco de mi rugido.`,
      (c, ctx) => `No persigo en desespero; escojo el momento preciso. La quietud antes del ataque es mi arte sagrado.`,
      (c, ctx) => `Mis cicatrices cuentan las batallas de esta era. El terrario entero tiembla cuando mis fauces se abren.`,
      (c, ctx) => `La muerte que siembro fertiliza la tierra para los que vendrán después. Soy el engranaje final del destino.`
    ],
    scavenger: [
      (c, ctx) => `Desde las alturas veo el mapa entero de la vida y el fin. Los huesos limpios son el poema que leo desde el cielo.`,
      (c, ctx) => `Desciendo en espiral silenciosa. No cazo, pero heredo los restos de todos los gigantes que cayeron.`,
      (c, ctx) => `El viento ascendente me sostiene sin fatiga. Las osamentas fertilizan las flores de mañana.`,
      (c, ctx) => `Observo a los titanes y cazadores desde arriba. Abajo reina la prisa; en el cielo solo existe la eternidad.`
    ],
    pollinator: [
      (c, ctx) => `Gotas de luz y polen dorado brotan de mis alas. Cada vuelo entre los matorrales siembra nuevo alimento.`,
      (c, ctx) => `La luz solar me llena de dicha. El mundo es un tapiz de colores vivos y néctar que nunca se agota.`,
      (c, ctx) => `Mi cuerpo es diminuto, pero sin mi danza este terrario caería en un desierto estéril.`,
      (c, ctx) => `Vuelo hacia los destellos de las flores cósmicas. La existencia es un zumbido radiante de creación.`
    ]
  };

  function generateSoulThoughts(c) {
    const p = c.findNearestWater();
    const distWater = p ? Math.round(Math.sqrt(distSq(c.x, c.y, p.x, p.y))) : 999;
    let distPrey = 999;
    if (c.speciesId === "carn_pack" || c.speciesId === "carn_apex") {
      const target = creatureGrid.nearest(c.x, c.y, 250, (o) => o.speciesId.startsWith("herb_"));
      if (target) distPrey = Math.round(Math.sqrt(distSq(c.x, c.y, target.x, target.y)));
    }

    if (c.energy < c.maxEnergy * 0.28) {
      return `“El estómago se me cierra en agonía... el hambre nubla mis pupilas. Debo encontrar sustento de inmediato.”`;
    }
    if (c.water < 25) {
      return `“La garganta se me quema en sed pura. El frescor del estanque a ${distWater}m es mi única esperanza.”`;
    }
    if (c.legendary) {
      return `“Un fulgor dorado arde en mi pecho. Soy una leyenda viviente del terrario y el Firmamento canta mi nombre.”`;
    }
    if (auroraActive > 0.6) {
      return `“El manto del firmamento ondea en luces celestiales... una calma cósmica desciende sobre mi respiración.”`;
    }

    const list = SOUL_THOUGHTS[c.speciesId] || SOUL_THOUGHTS.herb_agile;
    const fn = list[Math.floor(Math.random() * list.length)];
    return `“${fn(c, { distWater, distPrey })}”`;
  }

  function possessCreature(c) {
    if (!c || c.health <= 0) return;
    possessedCreature = c;
    followingCreature = c;
    possessionAutopilot = true;
    possessionAbilityCooldown = 0;
    possessionThoughtTimer = 0;

    const hud = document.getElementById("possessionHUD");
    if (hud) hud.classList.add("active");

    Sound.soulBond();
    updatePossessionUI();
    const thoughtsEl = document.getElementById("possThoughts");
    if (thoughtsEl) thoughtsEl.textContent = generateSoulThoughts(c);
    showToast(`👁️ Consciencia fundida en ${c.name} (${c.spec.name})`);
  }

  function releaseSoulBond() {
    if (!possessedCreature) return;
    possessedCreature = null;
    followingCreature = null;

    const hud = document.getElementById("possessionHUD");
    if (hud) hud.classList.remove("active");

    Sound.soulRelease();
    updateUI();
    showToast("✨ Vínculo liberado — regresando a la vista panorámica");
  }

  function updatePossessionUI() {
    if (!possessedCreature) return;
    const c = possessedCreature;
    const avatarMap = {
      herb_agile: "🦌",
      herb_mega: "🦏",
      carn_pack: "🐺",
      carn_apex: "🦖",
      scavenger: "🦅",
      pollinator: "✨"
    };

    const possAvatar = document.getElementById("possAvatar");
    const possName = document.getElementById("possName");
    const possBadge = document.getElementById("possBadge");
    const possMicroStats = document.getElementById("possMicroStats");
    const possAbilityLabel = document.getElementById("possAbilityLabel");
    const possAutopilotLabel = document.getElementById("possAutopilotLabel");
    const btnAbility = document.getElementById("btnPossAbility");

    if (possAvatar) possAvatar.textContent = avatarMap[c.speciesId] || "🐾";
    if (possName) possName.textContent = c.name + (c.legendary ? " ⚔️" : "");
    if (possBadge) {
      possBadge.textContent = c.spec.name;
      possBadge.style.color = c.spec.swatch;
      possBadge.style.borderColor = c.spec.swatch + "66";
    }
    if (possMicroStats) {
      possMicroStats.textContent = `Gen ${c.gen} · ${c.kids} crías · ${c.kills} presas · ${Math.round(c.energy)}/${Math.round(c.maxEnergy)} En`;
    }

    const abilityNames = {
      herb_agile: "Ráfaga de Sigilo",
      herb_mega: "Impacto Sísmico",
      carn_pack: "Acometida Voraz",
      carn_apex: "Rugido Real",
      scavenger: "Ascenso Celestial",
      pollinator: "Eclosión de Polen"
    };

    if (possAbilityLabel) {
      possAbilityLabel.textContent = possessionAbilityCooldown > 0
        ? `Recargando (${Math.ceil(possessionAbilityCooldown / 60)}s)`
        : abilityNames[c.speciesId] || "Instinto Primordial";
    }

    if (btnAbility) {
      btnAbility.classList.toggle("ready", possessionAbilityCooldown <= 0);
    }

    if (possAutopilotLabel) {
      possAutopilotLabel.textContent = possessionAutopilot ? "Auto: ON" : "Manual: WASD";
    }
  }

  function triggerPossessionAbility() {
    if (!possessedCreature || possessionAbilityCooldown > 0) return;
    const c = possessedCreature;
    possessionAbilityCooldown = possessionAbilityMaxCooldown;

    switch (c.speciesId) {
      case "herb_agile": {
        c.camouflageBoost = 260;
        c.stamina = Math.min(c.maxStamina, c.stamina + 45);
        c.setEmote("🍃✨", 70);
        for (let i = 0; i < 20; i++) {
          particles.push({
            x: c.x + spread(16), y: c.y + spread(16),
            r: rand(2, 4.5), alpha: 0.9, color: "#34d399",
            vx: spread(1.5), vy: spread(1.5)
          });
        }
        alarmWaves.push({ x: c.x, y: c.y, r: 10, maxR: 180, alpha: 0.8, color: "#34d399" });
        Sound.whoosh();
        showToast("🌿 ¡Ráfaga de Sigilo! Rastreadores despistados y camuflaje activo");
        break;
      }

      case "herb_mega": {
        alarmWaves.push({ x: c.x, y: c.y, r: 14, maxR: 240, alpha: 1.0, color: "#facc15" });
        for (let i = 0; i < 5; i++) spawnFood(c.x + spread(50), c.y + spread(50));
        const enemies = creatureGrid.queryRadius(c.x, c.y, 220, (o) => o.speciesId.startsWith("carn_"));
        for (let e of enemies) {
          e.steerAway(c.x, c.y, 1.0, 0.4, 2.0);
          e.setEmote("💫😵", 60);
        }
        c.setEmote("💥🦏", 70);
        Sound.thud();
        Sound.boom();
        showToast("🛡️ ¡Impacto Sísmico! Carnívoros repelidos y brotes germinados");
        break;
      }

      case "carn_pack":
      case "carn_apex": {
        const boostSpd = c.speciesId === "carn_apex" ? 3.8 : 3.2;
        c.x += Math.cos(c.heading) * boostSpd * 14;
        c.y += Math.sin(c.heading) * boostSpd * 14;
        c.stamina = Math.min(c.maxStamina, c.stamina + 30);
        alarmWaves.push({ x: c.x, y: c.y, r: 12, maxR: 220, alpha: 1.0, color: "#f87171" });
        const preyList = creatureGrid.queryRadius(c.x, c.y, 240, (o) => o.speciesId.startsWith("herb_"));
        for (let pr of preyList) {
          pr.state = "FLEE";
          pr.setEmote("😱", 60);
          pr.steerAway(c.x, c.y, 1.0, 0.35, 1.5);
        }
        c.setEmote("⚡🐾", 70);
        Sound.roar();
        showToast("⚡ ¡Acometida Voraz! Rugido intimidatorio esparcido por el valle");
        break;
      }

      case "scavenger": {
        c.celestialAscent = 280;
        c.energy = Math.min(c.maxEnergy, c.energy + 25);
        c.setEmote("🦅✨", 70);
        for (let i = 0; i < 16; i++) {
          particles.push({
            x: c.x + spread(12), y: c.y + spread(12),
            r: rand(1.5, 3.5), alpha: 0.9, color: "#38bdf8",
            vx: spread(0.8), vy: -rand(1, 3)
          });
        }
        Sound.whoosh();
        showToast("🦅 ¡Ascenso Celestial! Vuelo elevado con visión panorámica");
        break;
      }

      case "pollinator": {
        for (let i = 0; i < 5; i++) spawnFood(c.x + spread(35), c.y + spread(35));
        for (let b of bushes) {
          if (distSq(c.x, c.y, b.x, b.y) < 180 * 180) b.berries = b.maxBerries;
        }
        for (let i = 0; i < 28; i++) {
          particles.push({
            x: c.x, y: c.y,
            r: rand(2, 4), alpha: 1, color: i % 2 === 0 ? "#fef08a" : "#f472b6",
            vx: Math.cos(i * 0.22) * rand(1, 4), vy: Math.sin(i * 0.22) * rand(1, 4)
          });
        }
        c.setEmote("🌸💖", 70);
        Sound.chime();
        showToast("✨ ¡Eclosión de Polen! Arbustos madurados y semillas esparcidas");
        break;
      }
    }

    updatePossessionUI();
  }

  function handlePossessedDeath(c, cause) {
    Sound.boom();
    const flash = document.getElementById("flashOverlay");
    if (flash) {
      flash.style.background = "radial-gradient(circle, rgba(168, 85, 247, 0.45) 0%, rgba(8, 5, 20, 0.92) 100%)";
      flash.classList.add("boom");
      setTimeout(() => flash.classList.remove("boom"), 700);
    }
    showToast(`🕯️ El alma de ${c.name} ha dejado el cuerpo (${cause})`);
    const thoughtsEl = document.getElementById("possThoughts");
    if (thoughtsEl) {
      thoughtsEl.textContent = `“El latido cesa, pero la memoria de este suelo me acoge. Ahora soy una estrella más en el Firmamento.”`;
    }
    setTimeout(() => {
      releaseSoulBond();
    }, 2800);
  }

  function updateSoulBond(dt) {
    if (!possessedCreature) return;
    const c = possessedCreature;

    if (possessionAbilityCooldown > 0) {
      possessionAbilityCooldown -= dt;
      if (possessionAbilityCooldown <= 0) {
        possessionAbilityCooldown = 0;
        updatePossessionUI();
      }
    }

    // Cálculo dinámico de BPM
    let targetBPM = 72;
    if (c.state === "FLEE" || c.state === "CHASE") targetBPM += 55;
    if (c.isSprinting) targetBPM += 32;
    if (c.energy < c.maxEnergy * 0.3) targetBPM += 22;
    if (c.state === "SLEEP") targetBPM -= 24;
    targetBPM = clamp(targetBPM, 48, 168);
    possessionBPM += (targetBPM - possessionBPM) * 0.05 * dt;

    // Latido cardíaco en audio
    const beatIntervalSim = (60 / possessionBPM) * 60;
    if (simTime - lastHeartbeatAudioSimTime >= beatIntervalSim) {
      lastHeartbeatAudioSimTime = simTime;
      const stressRatio = clamp((possessionBPM - 60) / 75, 0.5, 1.8);
      if (audioEnabled) Sound.heartbeat(possessionBPM, stressRatio);
    }

    // ECG Telemetría
    ecgPhase = (ecgPhase + (possessionBPM / 60) * 0.06 * dt) % 1.0;
    let ecgVal = 16;
    if (ecgPhase > 0.18 && ecgPhase < 0.26) {
      ecgVal = 16 - Math.sin((ecgPhase - 0.18) / 0.08 * Math.PI) * 4;
    } else if (ecgPhase > 0.35 && ecgPhase < 0.39) {
      ecgVal = 16 + 5;
    } else if (ecgPhase >= 0.39 && ecgPhase < 0.44) {
      ecgVal = 16 - 13;
    } else if (ecgPhase >= 0.44 && ecgPhase < 0.48) {
      ecgVal = 16 + 6;
    } else if (ecgPhase > 0.58 && ecgPhase < 0.72) {
      ecgVal = 16 - Math.sin((ecgPhase - 0.58) / 0.14 * Math.PI) * 5;
    }
    ecgHistory.shift();
    ecgHistory.push(ecgVal);
    drawECGWave();

    // Actualización de pensamientos poéticos
    possessionThoughtTimer += dt;
    if (possessionThoughtTimer >= 260) {
      possessionThoughtTimer = 0;
      const thoughtsEl = document.getElementById("possThoughts");
      if (thoughtsEl) {
        thoughtsEl.style.opacity = "0";
        setTimeout(() => {
          thoughtsEl.textContent = generateSoulThoughts(c);
          thoughtsEl.style.opacity = "1";
        }, 300);
      }
    }

    const bpmEl = document.getElementById("possBPM");
    if (bpmEl) bpmEl.textContent = `${Math.round(possessionBPM)} BPM`;

    const heartIcon = document.getElementById("possHeartIcon");
    if (heartIcon) {
      const animDur = (60 / possessionBPM).toFixed(2);
      heartIcon.style.animationDuration = `${animDur}s`;
    }
  }

  function drawECGWave() {
    const ecgCanvas = document.getElementById("ecgCanvas");
    if (!ecgCanvas) return;
    const ectx = ecgCanvas.getContext("2d");
    const w = ecgCanvas.width, h = ecgCanvas.height;
    ectx.clearRect(0, 0, w, h);

    ectx.strokeStyle = "rgba(244, 63, 94, 0.12)";
    ectx.lineWidth = 0.5;
    for (let x = 0; x < w; x += 16) {
      ectx.beginPath(); ectx.moveTo(x, 0); ectx.lineTo(x, h); ectx.stroke();
    }
    for (let y = 0; y < h; y += 8) {
      ectx.beginPath(); ectx.moveTo(0, y); ectx.lineTo(w, y); ectx.stroke();
    }

    ectx.strokeStyle = "#f43f5e";
    ectx.lineWidth = 1.6;
    ectx.shadowColor = "#f43f5e";
    ectx.shadowBlur = 6;
    ectx.beginPath();
    for (let i = 0; i < ecgHistory.length; i++) {
      const x = (i / (ecgHistory.length - 1)) * w;
      const y = ecgHistory[i];
      if (i === 0) ectx.moveTo(x, y);
      else ectx.lineTo(x, y);
    }
    ectx.stroke();
    ectx.shadowBlur = 0;
  }

  function drawSoulBondSensory(sctx, c) {
    const sonarR = ((simTime * 0.08) % 180) + 12;
    sctx.save();
    sctx.strokeStyle = `rgba(167, 139, 250, ${(1 - sonarR / 190) * 0.55})`;
    sctx.lineWidth = 1.4;
    sctx.beginPath();
    sctx.arc(c.x, c.y, sonarR, 0, Math.PI * 2);
    sctx.stroke();

    sctx.translate(c.x, c.y);
    sctx.rotate(simTime * 0.0012);
    sctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    sctx.lineWidth = 1.2;
    const rR = c.radius() + 16;
    for (let a = 0; a < 4; a++) {
      const ang = (a * Math.PI) / 2;
      sctx.beginPath();
      sctx.arc(0, 0, rR, ang - 0.22, ang + 0.22);
      sctx.stroke();
    }
    sctx.restore();

    sctx.save();
    const nearestWater = c.findNearestWater();
    if (nearestWater) {
      const d = Math.sqrt(distSq(c.x, c.y, nearestWater.x, nearestWater.y));
      if (d > 30 && d < 380) {
        sctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
        sctx.setLineDash([4, 6]);
        sctx.beginPath();
        sctx.moveTo(c.x, c.y);
        sctx.lineTo(nearestWater.x, nearestWater.y);
        sctx.stroke();
        sctx.setLineDash([]);
        sctx.font = "10px JetBrains Mono, monospace";
        sctx.fillStyle = "#38bdf8";
        sctx.fillText(`💧 ${Math.round(d)}m`, (c.x + nearestWater.x) * 0.5, (c.y + nearestWater.y) * 0.5 - 6);
      }
    }

    if (c.speciesId.startsWith("herb_")) {
      const pred = creatureGrid.nearest(c.x, c.y, 220, (o) => o.speciesId.startsWith("carn_"));
      if (pred) {
        const d = Math.sqrt(distSq(c.x, c.y, pred.x, pred.y));
        sctx.strokeStyle = "rgba(244, 63, 94, 0.6)";
        sctx.lineWidth = 1.5;
        sctx.beginPath();
        sctx.moveTo(c.x, c.y);
        sctx.lineTo(pred.x, pred.y);
        sctx.stroke();
        sctx.font = "10px JetBrains Mono, monospace";
        sctx.fillStyle = "#f43f5e";
        sctx.fillText(`⚠️ PELIGRO ${Math.round(d)}m`, (c.x + pred.x) * 0.5, (c.y + pred.y) * 0.5 - 6);
      }
    }
    sctx.restore();
  }

  // ==========================================
  // EL ÁRBOL ANCESTRAL (YGGDRASIL DEL TERRARIO)
  // ==========================================
  function initAncientTree() {
    ancientTree = {
      x: W * 0.5,
      y: H * 0.44,
      radius: 38,
      ageCycles: (ancientTree ? ancientTree.ageCycles + 1 : 1),
      soulsAbsorbed: (ancientTree ? ancientTree.soulsAbsorbed : 0),
      fruitsProduced: (ancientTree ? ancientTree.fruitsProduced : 0),
      vitality: 100,
      bloomActive: 0,
      fruits: [],
      roots: []
    };
    buildTreeStructure();
  }

  function buildTreeStructure() {
    if (!ancientTree) return;
    ancientTree.roots = [];
    const numRoots = 10;
    for (let i = 0; i < numRoots; i++) {
      const ang = (i / (numRoots - 1)) * Math.PI * 0.95 + 0.05 * Math.PI;
      const rDist = rand(70, 125);
      const ex = ancientTree.x + Math.cos(ang) * rDist;
      const ey = ancientTree.y + Math.sin(ang) * (rDist * 0.85);
      const midX = (ancientTree.x + ex) / 2 + spread(16);
      const midY = (ancientTree.y + ey) / 2 + spread(12);
      ancientTree.roots.push({
        cx: midX, cy: midY,
        ex, ey,
        width: rand(3.8, 6.5),
        energized: false
      });
    }
  }

  function spawnSoulWisp(fromX, fromY, speciesId) {
    if (!ancientTree) return;
    const colors = {
      herb_agile: "#34d399",
      herb_mega: "#fbbf24",
      carn_pack: "#f87171",
      carn_apex: "#c084fc",
      scavenger: "#38bdf8",
      pollinator: "#fef08a"
    };
    soulWisps.push({
      x: fromX, y: fromY,
      color: colors[speciesId] || "#a7f3d0",
      speed: rand(2.0, 3.4),
      wobble: rand(0, Math.PI * 2)
    });
  }

  function updateSoulWisps(dt) {
    if (!ancientTree) return;
    for (let i = soulWisps.length - 1; i >= 0; i--) {
      const w = soulWisps[i];
      w.wobble += 0.12 * dt;
      const dx = ancientTree.x - w.x;
      const dy = ancientTree.y - w.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 20) {
        ancientTree.soulsAbsorbed++;
        ancientTree.vitality = Math.min(100, ancientTree.vitality + 0.5);
        if (ancientTree.roots.length > 0) {
          const r = ancientTree.roots[Math.floor(Math.random() * ancientTree.roots.length)];
          r.energized = true;
          setTimeout(() => { r.energized = false; }, 600);
        }
        soulWisps.splice(i, 1);
      } else {
        w.x += (dx / dist) * w.speed * dt + Math.cos(w.wobble) * 0.8;
        w.y += (dy / dist) * w.speed * dt + Math.sin(w.wobble) * 0.8;
      }
    }
  }

  function drawSoulWisps(wctx) {
    if (soulWisps.length === 0) return;
    wctx.save();
    for (let w of soulWisps) {
      wctx.fillStyle = w.color;
      wctx.shadowColor = w.color;
      wctx.shadowBlur = 8;
      wctx.beginPath();
      wctx.arc(w.x, w.y, 2.8, 0, Math.PI * 2);
      wctx.fill();
    }
    wctx.restore();
  }

  function updateAncientTree(dt) {
    if (!ancientTree) return;
    const tree = ancientTree;

    if (tree.bloomActive > 0) tree.bloomActive -= dt;

    if (tree.fruits.length < 4 && Math.random() < 0.0016 * dt) {
      const fAng = rand(-0.85 * Math.PI, -0.15 * Math.PI);
      const fDist = rand(22, 42);
      tree.fruits.push({
        x: tree.x + Math.cos(fAng) * fDist,
        y: tree.y + Math.sin(fAng) * fDist,
        fallen: false,
        seed: rand(0, 1000)
      });
    }

    for (let f of tree.fruits) {
      if (!f.fallen && Math.random() < 0.0007 * dt) {
        f.fallen = true;
        f.x = tree.x + spread(55);
        f.y = tree.y + rand(16, 52);
      }
    }

    for (let i = tree.fruits.length - 1; i >= 0; i--) {
      const f = tree.fruits[i];
      if (f.fallen) {
        const eater = creatureGrid.nearest(f.x, f.y, 22);
        if (eater) {
          blessCreature(eater);
          tree.fruitsProduced++;
          tree.fruits.splice(i, 1);
        }
      }
    }

    updateSoulWisps(dt);
  }

  function triggerTreeBloom() {
    if (!ancientTree) return;
    ancientTree.bloomActive = 260;
    treeBloomsWitnessed++;
    cymaticPulse = 1.2;
    Sound.cosmicHarp();

    for (let i = 0; i < 50; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = rand(1.5, 5.0);
      particles.push({
        x: ancientTree.x, y: ancientTree.y - 45,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        r: rand(2.5, 5), alpha: 0.95, color: i % 2 === 0 ? "#fde047" : "#4ade80"
      });
    }

    for (let i = 0; i < 14; i++) {
      spawnFood(ancientTree.x + spread(240), ancientTree.y + spread(190));
    }
    for (let b of bushes) {
      b.berries = b.maxBerries;
    }

    for (let c of creatures) {
      c.health = 100;
      c.stamina = c.maxStamina;
      c.energy = Math.min(c.maxEnergy, c.energy + 25);
      c.setEmote("🌸✨", 70);
    }

    showToast("🌸 ¡Gran Floración Cósmica desatada! El terrario renace en luz");
  }

  function drawAncientTree(tctx) {
    if (!ancientTree) return;
    const tree = ancientTree;
    const t = simTime * 0.001;

    tctx.save();

    // 1. Aura del Santuario Sagrado
    const sancRadius = 135;
    tctx.beginPath();
    tctx.arc(tree.x, tree.y, sancRadius, 0, Math.PI * 2);
    const auraGrad = tctx.createRadialGradient(tree.x, tree.y, 20, tree.x, tree.y, sancRadius);
    auraGrad.addColorStop(0, "rgba(52, 211, 153, 0.07)");
    auraGrad.addColorStop(0.75, "rgba(74, 224, 181, 0.04)");
    auraGrad.addColorStop(1, "rgba(251, 191, 36, 0.0)");
    tctx.fillStyle = auraGrad;
    tctx.fill();

    tctx.strokeStyle = `rgba(74, 224, 181, ${0.18 + 0.08 * Math.sin(t * 1.5)})`;
    tctx.lineWidth = 1.2;
    tctx.setLineDash([4, 6]);
    tctx.stroke();
    tctx.setLineDash([]);

    const numRunes = 8;
    for (let i = 0; i < numRunes; i++) {
      const rAng = (i / numRunes) * Math.PI * 2 + t * 0.2;
      const rx = tree.x + Math.cos(rAng) * sancRadius;
      const ry = tree.y + Math.sin(rAng) * sancRadius;
      tctx.fillStyle = "rgba(74, 224, 181, 0.4)";
      tctx.beginPath();
      tctx.arc(rx, ry, 2, 0, Math.PI * 2);
      tctx.fill();
    }

    // 2. Onda expansiva de floración
    if (tree.bloomActive > 0) {
      const bloomProgress = 1 - (tree.bloomActive / 260);
      const bloomR = bloomProgress * Math.max(W, H) * 0.85;
      tctx.beginPath();
      tctx.arc(tree.x, tree.y, bloomR, 0, Math.PI * 2);
      tctx.strokeStyle = `rgba(251, 191, 36, ${(1 - bloomProgress) * 0.65})`;
      tctx.lineWidth = 3 * (1 - bloomProgress);
      tctx.stroke();
    }

    // 3. Raíces
    for (let i = 0; i < tree.roots.length; i++) {
      const r = tree.roots[i];
      tctx.beginPath();
      tctx.moveTo(tree.x, tree.y);
      tctx.quadraticCurveTo(r.cx, r.cy, r.ex, r.ey);
      tctx.strokeStyle = "rgba(42, 28, 16, 0.85)";
      tctx.lineWidth = r.width;
      tctx.stroke();

      const veinPulse = 0.4 + 0.35 * Math.sin(t * 2 + i * 0.7);
      tctx.beginPath();
      tctx.moveTo(tree.x, tree.y);
      tctx.quadraticCurveTo(r.cx, r.cy, r.ex, r.ey);
      tctx.strokeStyle = `rgba(74, 224, 181, ${veinPulse * (r.energized ? 1.0 : 0.6)})`;
      tctx.lineWidth = Math.max(1, r.width * 0.35);
      tctx.stroke();
    }

    // 4. Tronco
    tctx.fillStyle = "#2e1e12";
    tctx.beginPath();
    tctx.moveTo(tree.x - 22, tree.y + 18);
    tctx.quadraticCurveTo(tree.x - 12, tree.y, tree.x - 14, tree.y - 38);
    tctx.lineTo(tree.x + 14, tree.y - 38);
    tctx.quadraticCurveTo(tree.x + 12, tree.y, tree.x + 22, tree.y + 18);
    tctx.closePath();
    tctx.fill();
    tctx.strokeStyle = "#1a100a";
    tctx.lineWidth = 1.5;
    tctx.stroke();

    const heartPulse = 0.5 + 0.5 * Math.sin(t * 3);
    tctx.fillStyle = `rgba(251, 191, 36, ${0.4 + 0.4 * heartPulse})`;
    tctx.shadowColor = "#fbbf24";
    tctx.shadowBlur = 10;
    tctx.beginPath();
    tctx.ellipse(tree.x, tree.y - 8, 5, 9, 0, 0, Math.PI * 2);
    tctx.fill();
    tctx.shadowBlur = 0;

    // 5. Copa
    const sway = Math.sin(t * 1.2) * 3;
    const lobes = [
      { dx: -24 + sway * 0.6, dy: -48, r: 28, col: "rgba(16, 120, 75, 0.85)" },
      { dx: 24 + sway * 0.6,  dy: -48, r: 28, col: "rgba(22, 138, 88, 0.85)" },
      { dx: 0 + sway,         dy: -62, r: 34, col: "rgba(34, 160, 102, 0.9)" },
      { dx: -14 + sway * 0.8, dy: -68, r: 24, col: "rgba(74, 222, 128, 0.8)" },
      { dx: 14 + sway * 0.8,  dy: -68, r: 24, col: "rgba(52, 211, 153, 0.8)" },
      { dx: 0 + sway,         dy: -78, r: 20, col: "rgba(110, 231, 183, 0.75)" }
    ];

    for (let l of lobes) {
      tctx.beginPath();
      tctx.arc(tree.x + l.dx, tree.y + l.dy, l.r, 0, Math.PI * 2);
      tctx.fillStyle = l.col;
      tctx.fill();
    }

    // 6. Frutos de Ámbar
    for (let f of tree.fruits) {
      tctx.save();
      const fp = 0.7 + 0.3 * Math.sin(t * 4 + f.seed);
      tctx.shadowColor = "#fbbf24";
      tctx.shadowBlur = 8;
      tctx.fillStyle = "#fde047";
      tctx.beginPath();
      tctx.arc(f.x, f.y, f.fallen ? 4.5 : 3.8, 0, Math.PI * 2);
      tctx.fill();

      if (!f.fallen) {
        tctx.strokeStyle = "#2e1e12";
        tctx.lineWidth = 1;
        tctx.beginPath();
        tctx.moveTo(f.x, f.y - 3.8);
        tctx.lineTo(f.x, f.y - 8);
        tctx.stroke();
      } else {
        tctx.strokeStyle = `rgba(251, 191, 36, ${0.4 * fp})`;
        tctx.lineWidth = 1;
        tctx.beginPath();
        tctx.arc(f.x, f.y, 7, 0, Math.PI * 2);
        tctx.stroke();
      }
      tctx.restore();
    }

    tctx.restore();
  }

  function openTreeModal() {
    if (!ancientTree) return;
    const treeOverlay = document.getElementById("treeOverlay");
    document.getElementById("treeAge").textContent = "Ciclo " + ancientTree.ageCycles;
    document.getElementById("treeSouls").textContent = ancientTree.soulsAbsorbed;
    document.getElementById("treeFruits").textContent = ancientTree.fruitsProduced;
    document.getElementById("treeVitality").textContent = Math.round(ancientTree.vitality) + "%";

    const quotes = [
      "«En sus raíces habitan las almas que un día corrieron por este valle; en sus ramas florece la memoria viva de cada era.»",
      "«El tiempo no se pierde en el terrario: se hace savia dorada, corteza paciente y frutos celestiales.»",
      "«Bajo su sombra sagrada, las bestias de sangre y los ciervos de viento comparten la misma tregua de paz.»",
      "«Cada alma recordada enciende una vena luminosa que nutre las hojas contra el olvido del cosmos.»"
    ];
    document.getElementById("treeQuote").textContent = quotes[(ancientTree.ageCycles + ancientTree.soulsAbsorbed) % quotes.length];

    drawTreeRings();
    treeOverlay.classList.add("open");
    Sound.chime(ancientTree.x);
  }

  function drawTreeRings() {
    const ringCanvas = document.getElementById("treeRingCanvas");
    if (!ringCanvas) return;
    const rctx = ringCanvas.getContext("2d");
    const rw = ringCanvas.width, rh = ringCanvas.height;
    const cx = rw / 2, cy = rh / 2;
    rctx.clearRect(0, 0, rw, rh);

    const maxR = cx - 12;
    const totalRings = Math.max(3, Math.min(18, ancientTree.ageCycles + Math.floor(ancientTree.soulsAbsorbed / 4)));

    const bgGrad = rctx.createRadialGradient(cx, cy, 5, cx, cy, maxR);
    bgGrad.addColorStop(0, "rgba(22, 60, 42, 0.9)");
    bgGrad.addColorStop(0.7, "rgba(10, 30, 20, 0.95)");
    bgGrad.addColorStop(1, "rgba(5, 16, 11, 1)");
    rctx.fillStyle = bgGrad;
    rctx.beginPath();
    rctx.arc(cx, cy, maxR, 0, Math.PI * 2);
    rctx.fill();

    for (let r = 1; r <= totalRings; r++) {
      const ringRadius = (r / totalRings) * (maxR - 10) + 10;
      rctx.beginPath();
      const steps = 48;
      for (let s = 0; s <= steps; s++) {
        const ang = (s / steps) * Math.PI * 2;
        const wave = Math.sin(ang * 5 + r * 1.3) * (1.5 + r * 0.15) + Math.cos(ang * 3 - r) * 1.2;
        const rad = ringRadius + wave;
        const rx = cx + Math.cos(ang) * rad;
        const ry = cy + Math.sin(ang) * rad;
        if (s === 0) rctx.moveTo(rx, ry);
        else rctx.lineTo(rx, ry);
      }
      rctx.closePath();
      rctx.strokeStyle = r === totalRings ? "rgba(74, 224, 181, 0.8)" : `rgba(251, 191, 36, ${0.15 + (r / totalRings) * 0.35})`;
      rctx.lineWidth = r === totalRings ? 2 : 1;
      rctx.stroke();
    }

    const soulNodes = Math.min(24, ancientTree.soulsAbsorbed);
    for (let i = 0; i < soulNodes; i++) {
      const nodeAng = (i * 137.5 * Math.PI) / 180;
      const nodeR = 12 + Math.sqrt(i / soulNodes) * (maxR - 22);
      const nx = cx + Math.cos(nodeAng) * nodeR;
      const ny = cy + Math.sin(nodeAng) * nodeR;
      rctx.fillStyle = "#4ade80";
      rctx.shadowColor = "#4ade80";
      rctx.shadowBlur = 6;
      rctx.beginPath();
      rctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
      rctx.fill();
    }
    rctx.shadowBlur = 0;

    rctx.fillStyle = "#fbbf24";
    rctx.shadowColor = "#fbbf24";
    rctx.shadowBlur = 10;
    rctx.beginPath();
    rctx.arc(cx, cy, 6, 0, Math.PI * 2);
    rctx.fill();
    rctx.shadowBlur = 0;
  }

  // ==========================================
  // LA RESONANCIA CIMÁTICA DEL TERRENO
  // ==========================================
  function drawCymatics(cctx) {
    if (!options.showCymatics) return;
    const moodModes = {
      calma:    { n: 3, m: 2, col: "rgba(74, 222, 128, " },
      prospero: { n: 4, m: 3, col: "rgba(251, 191, 36, " },
      tenso:    { n: 6, m: 5, col: "rgba(248, 113, 113, " },
      duelo:    { n: 2, m: 2, col: "rgba(167, 139, 250, " },
      renacer:  { n: 5, m: 4, col: "rgba(56, 189, 248, " },
      hambruna: { n: 5, m: 2, col: "rgba(251, 146, 60, " }
    };
    const mode = moodModes[currentMood.id] || moodModes.calma;
    const t = simTime * 0.0008;
    const alpha = Math.min(0.28, 0.07 + 0.03 * Math.sin(t * 2) + cymaticPulse * 0.22);
    if (alpha <= 0.01) return;

    cctx.save();
    cctx.strokeStyle = mode.col + alpha + ")";
    cctx.lineWidth = 1.2;

    const n = mode.n, m = mode.m;
    const cols = 28, rows = 18;
    const dx = W / cols, dy = H / rows;

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = i * dx;
        const y = j * dy;
        const chladni = Math.cos((n * Math.PI * x) / W + t) * Math.cos((m * Math.PI * y) / H) -
                        Math.cos((m * Math.PI * x) / W) * Math.cos((n * Math.PI * y) / H + t);
        if (Math.abs(chladni) < 0.25) {
          const len = (0.25 - Math.abs(chladni)) * dx * 1.8;
          const ang = Math.atan2(Math.sin((m * Math.PI * y) / H), Math.sin((n * Math.PI * x) / W)) + t * 0.5;
          cctx.beginPath();
          cctx.moveTo(x - Math.cos(ang) * len * 0.5, y - Math.sin(ang) * len * 0.5);
          cctx.lineTo(x + Math.cos(ang) * len * 0.5, y + Math.sin(ang) * len * 0.5);
          cctx.stroke();
        }
      }
    }
    cctx.restore();
  }

  // ==========================================
  // EL GRAN ECLIPSE CÓSMICO
  // ==========================================
  function triggerEclipse() {
    if (eclipseTimer > 0) return;
    eclipseTimer = 1800;
    eclipsesWitnessed++;
    Sound.singingBowl();
    showToast("🌑 ¡El Gran Eclipse Cósmico ha comenzado! La gravedad y el tiempo se desvanecen");
  }

  function updateEclipse(dt) {
    if (eclipseTimer > 0) {
      eclipseTimer -= dt;
      const elapsed = 1800 - eclipseTimer;
      if (elapsed < 300) {
        eclipseActive = elapsed / 300;
      } else if (eclipseTimer < 300) {
        eclipseActive = eclipseTimer / 300;
      } else {
        eclipseActive = 1.0;
      }
    } else {
      eclipseActive = Math.max(0, eclipseActive - 0.02 * dt);
    }

    const ecIcon = document.getElementById("eclipseIcon");
    const ecLabel = document.getElementById("eclipseLabel");
    if (ecIcon && ecLabel) {
      if (eclipseActive > 0.7) {
        ecIcon.classList.add("active");
        ecIcon.textContent = "🌑";
        ecLabel.textContent = "Totalidad";
      } else if (eclipseActive > 0.1) {
        ecIcon.classList.remove("active");
        ecIcon.textContent = "🌘";
        ecLabel.textContent = "Eclipse";
      } else {
        ecIcon.classList.remove("active");
        ecIcon.textContent = "🌑";
        ecLabel.textContent = "Alineación";
      }
    }
  }

  function drawEclipse(ectx) {
    if (eclipseActive < 0.02) return;
    const t = simTime * 0.001;
    const sunX = W * 0.5, sunY = H * 0.20;
    const moonR = 34;

    ectx.save();

    ectx.fillStyle = `rgba(18, 6, 38, ${0.68 * eclipseActive})`;
    ectx.fillRect(0, 0, W, H);

    if (eclipseActive > 0.3) {
      ectx.save();
      const starAlpha = (eclipseActive - 0.3) * 1.4;
      for (let i = 0; i < 40; i++) {
        const sx = (Math.sin(i * 99 + 1) * 0.5 + 0.5) * W;
        const sy = (Math.cos(i * 37 + 2) * 0.5 + 0.5) * H * 0.65;
        const twinkle = 0.5 + 0.5 * Math.sin(t * 3 + i * 2);
        ectx.fillStyle = `rgba(255, 255, 255, ${starAlpha * twinkle * 0.85})`;
        ectx.beginPath();
        ectx.arc(sx, sy, 1.2, 0, Math.PI * 2);
        ectx.fill();
      }
      ectx.restore();
    }

    ectx.save();
    ectx.translate(sunX, sunY);
    ectx.globalCompositeOperation = "screen";

    const numStreamers = 36;
    for (let i = 0; i < numStreamers; i++) {
      const ang = (i / numStreamers) * Math.PI * 2 + t * 0.15;
      const streamerLen = 50 + 45 * Math.sin(ang * 4 + t * 2) + 25 * Math.cos(ang * 7 - t * 3);
      const streamerGrad = ectx.createLinearGradient(0, 0, Math.cos(ang) * streamerLen, Math.sin(ang) * streamerLen);
      const col = i % 2 === 0 ? "rgba(251, 191, 36, " : "rgba(192, 132, 252, ";
      streamerGrad.addColorStop(0, col + (0.45 * eclipseActive) + ")");
      streamerGrad.addColorStop(0.6, "rgba(56, 189, 248, " + (0.25 * eclipseActive) + ")");
      streamerGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

      ectx.strokeStyle = streamerGrad;
      ectx.lineWidth = 4 + 2 * Math.sin(ang * 3 + t);
      ectx.beginPath();
      ectx.moveTo(Math.cos(ang) * (moonR - 2), Math.sin(ang) * (moonR - 2));
      ectx.lineTo(Math.cos(ang) * (moonR + streamerLen), Math.sin(ang) * (moonR + streamerLen));
      ectx.stroke();
    }

    const hazeGrad = ectx.createRadialGradient(0, 0, moonR, 0, 0, moonR * 3.2);
    hazeGrad.addColorStop(0, `rgba(255, 255, 255, ${0.85 * eclipseActive})`);
    hazeGrad.addColorStop(0.2, `rgba(251, 191, 36, ${0.55 * eclipseActive})`);
    hazeGrad.addColorStop(0.6, `rgba(168, 85, 247, ${0.35 * eclipseActive})`);
    hazeGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ectx.fillStyle = hazeGrad;
    ectx.beginPath();
    ectx.arc(0, 0, moonR * 3.2, 0, Math.PI * 2);
    ectx.fill();

    ectx.globalCompositeOperation = "source-over";
    ectx.fillStyle = "#08040d";
    ectx.beginPath();
    ectx.arc(0, 0, moonR, 0, Math.PI * 2);
    ectx.fill();

    if (eclipseActive > 0.15 && eclipseActive < 0.85) {
      const beadAng = (eclipseTimer > 900 ? 0.3 : 3.4);
      const bx = Math.cos(beadAng) * moonR;
      const by = Math.sin(beadAng) * moonR;
      ectx.fillStyle = "#ffffff";
      ectx.shadowColor = "#fde047";
      ectx.shadowBlur = 16;
      ectx.beginPath();
      ectx.arc(bx, by, 4.5, 0, Math.PI * 2);
      ectx.fill();
    }

    ectx.restore();
    ectx.restore();
  }

  // ==========================================
  // PODERES ELEMENTALES DE CREACIÓN
  // ==========================================
  function spawnLightning(targetX, targetY) {
    const startX = targetX + spread(80);
    const startY = 0;
    const segments = [];
    let curX = startX, curY = startY;
    const steps = 9;
    for (let i = 1; i <= steps; i++) {
      const frac = i / steps;
      const nxtX = startX + (targetX - startX) * frac + spread(30 * (1 - frac));
      const nxtY = targetY * frac;
      segments.push({ x1: curX, y1: curY, x2: nxtX, y2: nxtY });
      curX = nxtX; curY = nxtY;
    }
    lightningBolts.push({
      segments,
      targetX, targetY,
      timer: 16,
      maxTimer: 16
    });

    const flashEl = document.getElementById("flashOverlay");
    if (flashEl) {
      flashEl.style.opacity = "0.75";
      setTimeout(() => { flashEl.style.opacity = "0"; }, 70);
    }

    for (let i = 0; i < 24; i++) {
      particles.push({
        x: targetX, y: targetY,
        vx: spread(3.5), vy: spread(3.5),
        r: rand(1.5, 3.5), alpha: 0.9, color: "#38bdf8"
      });
    }

    spawnFood(targetX + spread(12), targetY + spread(12));
    spawnFood(targetX + spread(16), targetY + spread(16));

    const nearby = creatureGrid.queryRadius(targetX, targetY, 90);
    for (let c of nearby) {
      const dx = c.x - targetX, dy = c.y - targetY;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      c.vx = (dx / d) * 3.5;
      c.vy = (dy / d) * 3.5;
    }

    cymaticPulse = Math.min(1.5, cymaticPulse + 0.85);
    Sound.thunder(targetX);
    showToast("⚡ ¡Rayo Celestial! Suelo fertilizado con ceniza estelar");
  }

  function spawnVortex(x, y) {
    vortices.push({
      x, y,
      timer: 240,
      maxTimer: 240,
      radius: 95
    });
    Sound.whoosh(x);
  }

  function blessCreature(c) {
    c.health = 100;
    c.energy = c.maxEnergy;
    c.water = c.maxWater;
    c.stamina = c.maxStamina;
    c.blessed = true;
    c.blessedTimer = 3600;
    c.setEmote("🌟🕊️", 100);
    for (let i = 0; i < 22; i++) {
      particles.push({
        x: c.x, y: c.y,
        vx: spread(2.2), vy: spread(2.2),
        r: rand(2, 4), alpha: 0.95, color: "#fde047"
      });
    }
    Sound.chime(c.x);
    showToast(`🌟 ¡${c.name} ha recibido la Bendición Cósmica!`);
  }

  function updateElementalPowers(dt) {
    for (let i = lightningBolts.length - 1; i >= 0; i--) {
      const b = lightningBolts[i];
      b.timer -= dt;
      if (b.timer <= 0) lightningBolts.splice(i, 1);
    }

    for (let i = vortices.length - 1; i >= 0; i--) {
      const v = vortices[i];
      v.timer -= dt;
      if (v.timer <= 0) {
        vortices.splice(i, 1);
        continue;
      }

      const nearby = creatureGrid.queryRadius(v.x, v.y, v.radius);
      for (let c of nearby) {
        const dx = c.x - v.x, dy = c.y - v.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (1 - d / v.radius) * 1.8 * dt;
        c.x += (-dy / d) * force * 1.4 - (dx / d) * force * 0.4;
        c.y += (dx / d) * force * 1.4 - (dy / d) * force * 0.4;
      }

      if (Math.random() < 0.5 * dt) {
        const pAng = Math.random() * Math.PI * 2;
        const pDist = rand(10, v.radius);
        particles.push({
          x: v.x + Math.cos(pAng) * pDist,
          y: v.y + Math.sin(pAng) * pDist,
          vx: -Math.sin(pAng) * 2,
          vy: Math.cos(pAng) * 2,
          r: rand(1.5, 3),
          alpha: 0.8,
          color: "#34d399"
        });
      }
    }
  }

  function drawElementalPowers(dctx) {
    for (let b of lightningBolts) {
      const alpha = b.timer / b.maxTimer;
      dctx.save();
      dctx.strokeStyle = `rgba(186, 230, 253, ${alpha})`;
      dctx.lineWidth = 2.5;
      dctx.shadowColor = "#38bdf8";
      dctx.shadowBlur = 12;
      for (let s of b.segments) {
        dctx.beginPath();
        dctx.moveTo(s.x1, s.y1);
        dctx.lineTo(s.x2, s.y2);
        dctx.stroke();
      }
      dctx.restore();
    }

    for (let v of vortices) {
      const alpha = (v.timer / v.maxTimer) * 0.45;
      dctx.save();
      dctx.strokeStyle = `rgba(52, 211, 153, ${alpha})`;
      dctx.lineWidth = 1.4;
      dctx.setLineDash([6, 8]);
      const rot = (v.maxTimer - v.timer) * 0.08;
      for (let r = 20; r <= v.radius; r += 25) {
        dctx.beginPath();
        dctx.arc(v.x, v.y, r, rot, rot + Math.PI * 1.6);
        dctx.stroke();
      }
      dctx.restore();
    }
  }

  // ==========================================
  // RENDERIZADO DEL MUNDO
  // ==========================================
  function drawWorld() {
    if (options.dreamMode) {
      ctx.filter = "none";
      ctx.fillStyle = "rgba(10, 4, 24, 0.14)";
      ctx.fillRect(0, 0, W, H);
      ctx.filter = `hue-rotate(${Math.floor(simTime * 0.05) % 360}deg) saturate(1.9) contrast(1.05)`;
    } else {
      ctx.filter = "none";
      ctx.clearRect(0, 0, W, H);
    }

    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(camZoom, camZoom);
    ctx.translate(-camX, -camY);

    drawCymatics(ctx);
    drawCraters(ctx);

    for (let pond of waterBodies) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(pond.x, pond.y, pond.radius, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(pond.x, pond.y, 4, pond.x, pond.y, pond.radius);
      grad.addColorStop(0, "rgba(56, 143, 176, 0.65)");
      grad.addColorStop(0.85, "rgba(38, 114, 143, 0.75)");
      grad.addColorStop(1, "rgba(22, 70, 89, 0.85)");
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Reflejo de la Aurora Boreal en el agua
      if (auroraActive > 0.05) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(pond.x, pond.y, pond.radius, 0, Math.PI * 2);
        ctx.clip();
        const reflGrad = ctx.createLinearGradient(pond.x - pond.radius, pond.y, pond.x + pond.radius, pond.y);
        reflGrad.addColorStop(0, `rgba(0, 255, 162, ${0.28 * auroraActive})`);
        reflGrad.addColorStop(0.5, `rgba(56, 189, 248, ${0.22 * auroraActive})`);
        reflGrad.addColorStop(1, `rgba(168, 85, 247, ${0.25 * auroraActive})`);
        ctx.fillStyle = reflGrad;
        ctx.fillRect(pond.x - pond.radius, pond.y - pond.radius, pond.radius * 2, pond.radius * 2);
        ctx.restore();
      }

      const wave = Math.sin(simTime * 0.003 + pond.seed) * 3;
      ctx.beginPath();
      ctx.arc(pond.x, pond.y, pond.radius * 0.6 + wave, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.stroke();
      ctx.restore();
    }

    for (let b of bushes) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.beginPath();
      ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(48, 96, 48, 0.35)";
      ctx.fill();
      ctx.strokeStyle = "rgba(35, 75, 35, 0.4)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      for (let i = 0; i < b.berries; i++) {
        const ang = (i / b.maxBerries) * Math.PI * 2 + b.seed;
        const dist = b.radius * 0.55;
        ctx.beginPath();
        ctx.arc(Math.cos(ang) * dist, Math.sin(ang) * dist, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#ff4060";
        ctx.fill();
      }
      ctx.restore();
    }

    drawAncientTree(ctx);

    for (let c of carcasses) {
      ctx.save();
      ctx.translate(c.x, c.y);
      if (c.bones) {
        ctx.strokeStyle = "rgba(230, 230, 220, 0.7)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-6, -4); ctx.lineTo(6, 4);
        ctx.moveTo(-6, 4); ctx.lineTo(6, -4);
        ctx.stroke();
      } else {
        ctx.fillStyle = "rgba(160, 50, 40, 0.85)";
        ctx.beginPath();
        ctx.ellipse(0, 0, 7, 4.5, 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    for (let p of plants) {
      const sway = Math.sin(simTime * 0.004 + p.seed) * 1.5;
      ctx.save();
      ctx.translate(p.x + sway, p.y);
      ctx.strokeStyle = "rgba(70, 140, 60, 0.6)";
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-2, -5, 0, -8); ctx.stroke();
      ctx.beginPath();
      ctx.fillStyle = "hsl(42, 90%, 55%)";
      ctx.arc(0, -8, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (let w of alarmWaves) {
      ctx.save();
      ctx.strokeStyle = w.color ? `rgba(142, 43, 136, ${w.alpha})` : `rgba(220, 60, 60, ${w.alpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    drawMutationZones(ctx);
    drawBioTrails(ctx);
    drawSoulWisps(ctx);
    drawElementalPowers(ctx);

    for (let c of creatures) {
      c.draw(ctx);
    }

    for (let p of particles) {
      ctx.save();
      ctx.fillStyle = p.color || "#ffffff";
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (let sp of skyParticles) {
      ctx.save();
      ctx.translate(sp.x, sp.y);
      ctx.rotate(sp.rot);
      ctx.fillStyle = sp.color;
      ctx.globalAlpha = sp.alpha;
      ctx.beginPath();
      if (sp.type === "snow") {
        ctx.arc(0, 0, sp.r, 0, Math.PI * 2);
      } else {
        ctx.ellipse(0, 0, sp.r, sp.r * 0.55, 0, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.restore();
    }

    if (possessedCreature) {
      drawSoulBondSensory(ctx, possessedCreature);
    } else if (followingCreature) {
      ctx.save();
      ctx.strokeStyle = "rgba(74, 224, 181, 0.6)";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(followingCreature.x, followingCreature.y, followingCreature.radius() + 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();

    drawEclipse(ctx);
    drawAurora(ctx);
    drawMoodAura(ctx);
    drawAtmosphere();
    drawMeteors(ctx);
    ctx.filter = "none";
  }

  function drawAtmosphere() {
    let tint = "transparent";
    let icon = "☀️", label = "Día";

    if (dayTime < 0.15) {
      tint = "rgba(255, 160, 80, 0.12)";
      icon = "🌅"; label = "Amanecer";
    } else if (dayTime < 0.45) {
      tint = "transparent";
      icon = "☀️"; label = "Día";
    } else if (dayTime < 0.65) {
      tint = "rgba(220, 100, 50, 0.18)";
      icon = "🌇"; label = "Atardecer";
    } else {
      tint = "rgba(6, 12, 24, 0.45)";
      icon = "🌙"; label = "Noche";
    }

    if (tint !== "transparent") {
      ctx.fillStyle = tint;
      ctx.fillRect(0, 0, W, H);
    }

    // Tinte estacional: crossfade suave entre la estación actual y la siguiente
    const curSeason = SEASONS[seasonIdx];
    const nextSeason = SEASONS[(seasonIdx + 1) % 4];
    ctx.save();
    ctx.globalAlpha = 1 - seasonProgress;
    ctx.fillStyle = curSeason.tint;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = seasonProgress;
    ctx.fillStyle = nextSeason.tint;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    const memoryAlpha = { "Amanecer": 0.3, "Día": 0, "Atardecer": 0.35, "Noche": 1 }[label] || 0;
    if (memoryAlpha > 0) drawMemorialSky(memoryAlpha);

    document.getElementById("todIcon").textContent = icon;
    document.getElementById("todLabel").textContent = label;
    document.getElementById("seasonIcon").textContent = curSeason.icon;
    document.getElementById("seasonLabel").textContent = curSeason.name;
    Sound.updateAtmosphere(label, rainActive > 0, curSeason.name);
  }

  // ==========================================
  // MEMORIA DEL TERRARIO: luciérnagas que marcan dónde murió cada criatura
  // ==========================================
  function drawMemorialSky(alpha) {
    if (deathLedger.length === 0) return;
    ctx.save();
    for (let i = 0; i < deathLedger.length; i++) {
      const d = deathLedger[i];
      const x = d.xf * W, y = d.yf * H;
      const twinkle = 0.5 + 0.5 * Math.sin(simTime * 0.0015 + i * 1.73);
      const spec = SPECIES_BY_ID[d.species];
      const col = spec ? spec.swatch : "#cfd8e8";
      ctx.globalAlpha = alpha * (0.2 + 0.55 * twinkle) * Math.min(1, 0.35 + d.gen * 0.06);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(x, y, 1.3 + Math.min(3, d.gen * 0.25), 0, Math.PI * 2);
      ctx.fill();
    }

    // Constelación tenue entre las últimas almas recordadas
    const recent = deathLedger.slice(-14);
    if (recent.length > 1) {
      ctx.globalAlpha = alpha * 0.28;
      ctx.strokeStyle = "rgba(230, 235, 255, 0.9)";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (let i = 0; i < recent.length; i++) {
        const d = recent[i];
        const x = d.xf * W, y = d.yf * H;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // ==========================================
  // FIRMAMENTO DE LAS ALMAS (constelaciones permanentes de los caídos)
  // ==========================================
  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function seededRand(seed) {
    let s = seed >>> 0;
    return function () {
      s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
      s >>>= 0;
      return s / 4294967296;
    };
  }

  const CAUSE_LABEL = {
    "hambre": "de hambre, buscando un último bocado",
    "sed": "de sed, lejos del agua",
    "heridas": "de sus heridas",
    "vejez": "de vejez, habiendo visto pasar sus estaciones",
    "cazado en manada": "cazado por una manada",
    "cazado por un apex": "cazado por un depredador apex",
    "natural": "en paz, entre la hierba"
  };

  const EPITAPH_TEMPLATES = [
    (n, sp, c) => `${n}, ${sp}, murió ${c}. Su luz sigue aquí.`,
    (n, sp, c) => `Aquí brilla ${n}. Fue ${sp} y se apagó ${c}.`,
    (n, sp, c) => `${n} caminó como ${sp} hasta que murió ${c}. El cielo lo recuerda.`,
    (n, sp, c) => `Se cuenta que ${n}, ${sp} de generación lejana, murió ${c}.`
  ];

  function generateEpitaph(entry) {
    const spec = SPECIES_BY_ID[entry.species];
    const spName = spec ? spec.name.toLowerCase() : "criatura";
    const name = entry.name || "un alma sin nombre";
    const causeText = CAUSE_LABEL[entry.cause] || CAUSE_LABEL.natural;
    const seed = hashStr((entry.name || "") + entry.t + entry.species);
    const tpl = EPITAPH_TEMPLATES[seed % EPITAPH_TEMPLATES.length];
    let line = tpl(name, spName, causeText);
    const extras = [];
    if (entry.gen > 1) extras.push(`generación ${entry.gen}`);
    if (entry.kids > 0) extras.push(`${entry.kids} descendiente${entry.kids === 1 ? "" : "s"}`);
    if (entry.kills > 0) extras.push(`${entry.kills} cacería${entry.kills === 1 ? "" : "s"} a su nombre`);
    if (extras.length) line += ` (${extras.join(", ")})`;
    if (entry.legendary) line = `⭐ ${line} Su saga completa vive en el libro de Sagas.`;
    return line;
  }

  let starField = null; // caché de posiciones estelares, recalculado cuando cambia el número de almas
  function buildStarField(w, h) {
    return deathLedger.map((entry, i) => {
      const rnd = seededRand(hashStr((entry.name || "anon") + entry.t + i));
      return {
        entry, i,
        x: rnd() * w,
        y: rnd() * h,
        r: 1.1 + rnd() * 2.0 + Math.min(2.2, (entry.gen || 1) * 0.18),
        phase: rnd() * Math.PI * 2,
        speed: 0.6 + rnd() * 0.9
      };
    });
  }

  let constellationHover = -1;
  let constellationSelected = -1;

  function drawConstellationSky(cctx, w, h, tsec) {
    if (!starField || starField.length !== deathLedger.length) starField = buildStarField(w, h);
    cctx.clearRect(0, 0, w, h);
    const grad = cctx.createRadialGradient(w * 0.5, h * 0.35, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
    grad.addColorStop(0, "#0d1730");
    grad.addColorStop(1, "#040611");
    cctx.fillStyle = grad;
    cctx.fillRect(0, 0, w, h);

    if (starField.length === 0) {
      cctx.fillStyle = "rgba(220,230,255,0.5)";
      cctx.font = "italic 15px 'Fraunces', serif";
      cctx.textAlign = "center";
      cctx.fillText("Ningún alma ha partido todavía. El cielo está en blanco.", w / 2, h / 2);
      return;
    }

    // Líneas de constelación: conecta cada estrella con la más cercana de su misma especie
    cctx.save();
    cctx.lineWidth = 0.6;
    for (let i = 0; i < starField.length; i++) {
      const s = starField[i];
      let bestJ = -1, bestD = Infinity;
      for (let j = 0; j < starField.length; j++) {
        if (i === j) continue;
        const o = starField[j];
        if (o.entry.species !== s.entry.species) continue;
        const d = distSq(s.x, s.y, o.x, o.y);
        if (d < bestD) { bestD = d; bestJ = j; }
      }
      if (bestJ > i) {
        const o = starField[bestJ];
        const spec = SPECIES_BY_ID[s.entry.species];
        cctx.strokeStyle = (spec ? spec.swatch : "#8fa5c9") + "33";
        cctx.beginPath();
        cctx.moveTo(s.x, s.y);
        cctx.lineTo(o.x, o.y);
        cctx.stroke();
      }
    }
    cctx.restore();

    for (let i = 0; i < starField.length; i++) {
      const s = starField[i];
      const spec = SPECIES_BY_ID[s.entry.species];
      const col = s.entry.legendary ? "#ffd54f" : (spec ? spec.swatch : "#cfd8e8");
      const twinkle = 0.55 + 0.45 * Math.sin(tsec * s.speed + s.phase);
      const isActive = i === constellationHover || i === constellationSelected;
      const rad = (s.entry.legendary ? s.r * 1.8 : s.r) * (isActive ? 1.8 : 1);
      cctx.save();
      cctx.globalAlpha = 0.45 + 0.55 * twinkle;
      cctx.fillStyle = isActive ? "#ffffff" : col;
      cctx.shadowColor = col;
      cctx.shadowBlur = (isActive ? 16 : 6) + (s.entry.legendary ? 10 : 0);
      cctx.beginPath();
      cctx.arc(s.x, s.y, rad, 0, Math.PI * 2);
      cctx.fill();

      if (s.entry.legendary) {
        cctx.strokeStyle = col;
        cctx.lineWidth = 0.8;
        cctx.globalAlpha = (0.35 + 0.35 * twinkle) * (isActive ? 1.3 : 1);
        const spikes = rad * 3.2;
        for (let a = 0; a < 4; a++) {
          const ang = (Math.PI / 4) * a + s.phase * 0.2;
          cctx.beginPath();
          cctx.moveTo(s.x - Math.cos(ang) * spikes, s.y - Math.sin(ang) * spikes);
          cctx.lineTo(s.x + Math.cos(ang) * spikes, s.y + Math.sin(ang) * spikes);
          cctx.stroke();
        }
      }
      cctx.restore();
    }
  }

  function findStarAt(x, y, maxD) {
    if (!starField) return -1;
    let best = -1, bestD = maxD * maxD;
    for (let i = 0; i < starField.length; i++) {
      const s = starField[i];
      const d = distSq(s.x, s.y, x, y);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  // ==========================================
  // GRÁFICO HISTÓRICO DE POBLACIÓN
  // ==========================================
  function updatePopChart() {
    const pw = popCanvas.width, ph = popCanvas.height;
    popCtx.clearRect(0, 0, pw, ph);

    let counts = { herb_agile: 0, herb_mega: 0, carn_pack: 0, carn_apex: 0, food: plants.length };
    for (let c of creatures) {
      if (counts[c.speciesId] !== undefined) counts[c.speciesId]++;
    }

    popHistory.push(counts);
    if (popHistory.length > 80) popHistory.shift();

    const maxCount = 80;
    const stepX = pw / (popHistory.length - 1 || 1);

    const drawLine = (key, color) => {
      popCtx.strokeStyle = color;
      popCtx.lineWidth = 1.5;
      popCtx.beginPath();
      for (let i = 0; i < popHistory.length; i++) {
        const x = i * stepX;
        const y = ph - (popHistory[i][key] / maxCount) * ph;
        if (i === 0) popCtx.moveTo(x, y);
        else popCtx.lineTo(x, y);
      }
      popCtx.stroke();
    };

    drawLine("herb_agile", "#2ca06d");
    drawLine("herb_mega", "#758e38");
    drawLine("carn_pack", "#d24e38");
    drawLine("carn_apex", "#8e2b88");
  }

  // ==========================================
  // PANEL DE ESTADÍSTICAS & INSPECTOR
  // ==========================================
  function updateUI() {
    let counts = { herb_agile: 0, herb_mega: 0, carn_pack: 0, carn_apex: 0, scavenger: 0, pollinator: 0 };
    for (let c of creatures) {
      if (counts[c.speciesId] !== undefined) counts[c.speciesId]++;
    }

    for (let id in counts) {
      const before = prevSpeciesCounts[id];
      if (before > 0 && counts[id] === 0) {
        const spec = SPECIES_BY_ID[id];
        extinctions.push({ species: id, gen: maxGen, at: Math.round(realElapsedMs / 1000) });
        showToast(`☠️ Extinción: ${spec ? spec.name : id} ha desaparecido del terrario`);
      }
    }
    prevSpeciesCounts = counts;

    document.getElementById("stHerbAgile").textContent = counts.herb_agile;
    document.getElementById("stHerbMega").textContent = counts.herb_mega;
    document.getElementById("stCarnPack").textContent = counts.carn_pack;
    document.getElementById("stCarnApex").textContent = counts.carn_apex;
    document.getElementById("stScavenger").textContent = counts.scavenger;
    document.getElementById("stPollinator").textContent = counts.pollinator;
    document.getElementById("stFood").textContent = plants.length;
    document.getElementById("stGen").textContent = maxGen;
    document.getElementById("stBirths").textContent = births;
    document.getElementById("stKills").textContent = totalKills;
    document.getElementById("stMemory").textContent = deathLedger.length;

    const stAuroraEl = document.getElementById("stAurora");
    if (stAuroraEl) {
      stAuroraEl.textContent = auroraActive > 0.65 ? "Tormenta Boreal" : (auroraActive > 0.2 ? "Ondas Esmeralda" : "Inactiva");
    }
    const stTreeEl = document.getElementById("stTree");
    if (stTreeEl && ancientTree) {
      stTreeEl.textContent = `Vigor ${Math.round(ancientTree.vitality)}% · ${ancientTree.soulsAbsorbed} 🕯️`;
    }
    const stEclipseEl = document.getElementById("stEclipse");
    if (stEclipseEl) {
      stEclipseEl.textContent = eclipseActive > 0.65 ? "🌑 Totalidad" : (eclipseActive > 0.1 ? "🌘 Parcial" : "Alineación");
    }
    const stPossEl = document.getElementById("stPossession");
    if (stPossEl) {
      stPossEl.textContent = possessedCreature ? `👁️ ${possessedCreature.name}` : "Libre";
    }

    const secs = Math.floor(realElapsedMs / 1000);
    const m = Math.floor(secs / 60), s2 = secs % 60;
    document.getElementById("timeElapsed").textContent = m + ":" + (s2 < 10 ? "0" : "") + s2;

    const insp = document.getElementById("inspector");
    if (selectedCreature) {
      insp.classList.add("open");
      const c = selectedCreature;
      document.getElementById("inspName").textContent = `${c.name} · ${c.spec.name}`;
      document.getElementById("inspBadge").textContent = `Gen ${c.gen} • ${c.speciesId.toUpperCase()}`;
      document.getElementById("inspBadge").style.color = c.spec.swatch;
      document.getElementById("inspBadge").style.background = c.spec.swatch + "22";

      const btnFollowCam = document.getElementById("btnFollowCam");
      if (btnFollowCam) {
        btnFollowCam.textContent = (followingCreature === selectedCreature ? "🎯 Siguiendo" : "🎯 Centrar");
      }
      const btnPossInsp = document.getElementById("btnPossessInsp");
      if (btnPossInsp) {
        btnPossInsp.textContent = (possessedCreature === selectedCreature ? "✕ Despertar" : "👁️ Encarnar Alma");
      }

      const stateTexts = {
        WANDER: "🧭 Explorando entorno",
        GRAZE: "🌿 Pastando alimento",
        DRINK: "💧 Bebiendo agua fresca",
        STALK: "🎯 Acechando sigilosamente",
        CHASE: "⚡ Acometiendo presa",
        FLEE: "⚠️ Huyendo en pánico",
        COURT: "❤️ Cortejando pareja",
        SLEEP: "💤 Durmiendo / Descansando",
        SCAVENGE: "🥩 Consumiendo carroña",
        DEFEND: "🛡️ Defendiéndose activamente"
      };
      document.getElementById("inspState").textContent = stateTexts[c.state] || c.state;

      document.getElementById("inspEnergy").style.width = Math.floor((c.energy / c.maxEnergy) * 100) + "%";
      document.getElementById("inspWater").style.width = Math.floor((c.water / c.maxWater) * 100) + "%";
      document.getElementById("inspStamina").style.width = Math.floor((c.stamina / c.maxStamina) * 100) + "%";
      document.getElementById("inspHealth").style.width = Math.floor(c.health) + "%";

      document.getElementById("inspGeneSpeed").textContent = c.genes.speed.toFixed(2);
      document.getElementById("inspGeneSense").textContent = Math.floor(c.genes.sense) + "px";
      document.getElementById("inspGeneSize").textContent = c.genes.size.toFixed(1);
      document.getElementById("inspGeneStealth").textContent = Math.floor(c.genes.stealth * 100) + "%";
      document.getElementById("inspGen").textContent = c.gen;
      document.getElementById("inspKids").textContent = c.kids;
      document.getElementById("inspKills").textContent = c.kills;
      document.getElementById("inspAge").textContent = Math.floor(c.age / 60) + "s";
    } else {
      insp.classList.remove("open");
    }
  }

  // ==========================================
  // GENEALOGÍA VIVA — RENDERIZADO DEL ÁRBOL
  // ==========================================
  function renderLineage() {
    if (!selectedCreature) return;
    const chain = buildLineageChain(selectedCreature.id);
    document.getElementById("lineageName").textContent = selectedCreature.name;
    document.getElementById("lineageIntro").textContent =
      chain.length > 1
        ? `${chain.length} generaciones de ascendencia registradas en esta sesión del terrario.`
        : `${selectedCreature.name} no tiene ancestros registrados — es un fundador de su linaje.`;

    const container = document.getElementById("lineageChain");
    container.innerHTML = "";
    chain.forEach((rec, i) => {
      const spec = SPECIES_BY_ID[rec.speciesId];
      const parentRec = i > 0 ? chain[i - 1] : null;
      const drift = parentRec ? traitDrift(parentRec.genes, rec.genes) : null;
      const statusText = rec.alive ? "vivo" : `murió · ${rec.cause || "desconocido"}`;

      const node = document.createElement("div");
      node.className = "lineage-node" + (i === chain.length - 1 ? " current" : "");
      node.innerHTML = `
        <div class="lineage-dot" style="background:${spec ? spec.swatch : "#8fd98a"}; color:${spec ? spec.swatch : "#8fd98a"};"></div>
        <div class="lineage-info">
          <span class="lineage-node-name">${rec.name}</span>
          <span class="lineage-node-meta">${spec ? spec.name : rec.speciesId} · Gen ${rec.gen} · ${statusText} · ${rec.kids} cría${rec.kids === 1 ? "" : "s"}</span>
          ${drift ? `<span class="lineage-drift">${drift}</span>` : ""}
        </div>
      `;
      container.appendChild(node);
    });
  }

  function formatEraText(era, index, totalEras) {
    const eraNumber = totalEras - index;
    const dominant = era.dominant || "una especie olvidada";
    const durMin = Math.floor(era.durationSec / 60);
    const durTxt = durMin > 0 ? `${durMin} min` : `${era.durationSec}s`;
    let text = `Duró ${durTxt}. Nacieron ${era.births} criaturas y se registraron ${era.kills} cacerías. `;
    text += `${dominant} dominó el terrario bajo un cielo de ${era.season.toLowerCase()}. `;
    text += `El linaje más antiguo alcanzó la generación ${era.maxGen}. `;
    if (era.meteorImpacts > 0) {
      text += `El cielo dejó caer ${era.meteorImpacts} meteorito${era.meteorImpacts === 1 ? "" : "s"}, mutando la carne de sus habitantes ${era.mutations} ${era.mutations === 1 ? "vez" : "veces"}. `;
    }
    if (era.eclipses > 0) {
      text += `El Gran Eclipse cubrió de noche sagrada la era en ${era.eclipses} ocasión${era.eclipses === 1 ? "" : "es"}. `;
    }
    if (era.treeBlooms > 0) {
      text += `El Árbol Ancestral desató su Gran Floración ${era.treeBlooms} ${era.treeBlooms === 1 ? "vez" : "veces"}, renovando la vida. `;
    }
    if (era.extinctions && era.extinctions.length > 0) {
      const names = era.extinctions.map((e) => (SPECIES_BY_ID[e.species] ? SPECIES_BY_ID[e.species].name : e.species));
      text += `Se extinguieron para siempre: ${names.join(", ")}. `;
    }
    text += `${era.memorySize} almas quedaron grabadas en la memoria del suelo.`;
    return `<span class="era-title">Era ${eraNumber}</span>${text}`;
  }

  function renderChronicle() {
    const entriesEl = document.getElementById("chronicleEntries");
    const introEl = document.getElementById("chronicleIntro");
    const totalEras = chronicle.length;
    const totalBirths = chronicle.reduce((a, e) => a + e.births, 0) + births;

    introEl.textContent = totalEras > 0
      ? `${totalEras} era${totalEras === 1 ? "" : "s"} registrada${totalEras === 1 ? "" : "s"}. ${totalBirths} vidas han nacido aquí en total, ${deathLedger.length} descansan bajo la tierra.`
      : `Esta es la primera era del terrario. Aún no hay crónicas escritas — pulsa "Reiniciar" para sellar esta era en la historia.`;

    if (totalEras === 0) {
      entriesEl.innerHTML = `<p class="chronicle-empty">El pergamino está en blanco. Cuando pulses "Reiniciar", esta era quedará grabada para siempre.</p>`;
      return;
    }

    let html = "";
    for (let i = totalEras - 1; i >= 0; i--) {
      html += `<div class="chronicle-entry">${formatEraText(chronicle[i], i, totalEras)}</div>`;
    }
    entriesEl.innerHTML = html;
  }

  function renderSagas() {
    const entriesEl = document.getElementById("sagaEntries");
    const introEl = document.getElementById("sagaIntro");
    document.getElementById("sagaCount").textContent = legendLedger.length;

    if (legendLedger.length === 0) {
      introEl.textContent = "Ninguna criatura ha alcanzado aún la leyenda. Se necesita una hazaña: seis cacerías, cinco crías, o sobrevivir seis generaciones de sangre.";
      entriesEl.innerHTML = `<p class="saga-empty">El libro está en blanco. Las leyendas aún caminan por ahí afuera, sin saberlo.</p>`;
      return;
    }

    introEl.textContent = `${legendLedger.length} leyenda${legendLedger.length === 1 ? "" : "s"} escrita${legendLedger.length === 1 ? "" : "s"} para siempre en este libro.`;

    const sorted = legendLedger.slice().sort((a, b) => legendRank(b) - legendRank(a));
    let html = "";
    for (const entry of sorted) {
      const spec = SPECIES_BY_ID[entry.species];
      html += `<div class="saga-entry">
        <span class="saga-name">⭐ ${entry.name || "Sin nombre"} <span class="saga-species">· ${spec ? spec.name : entry.species}</span></span>
        <p class="saga-text">${entry.saga}</p>
        <div class="saga-stats">Gen ${entry.gen} · ${entry.kills} caceria${entry.kills === 1 ? "" : "s"} · ${entry.kids} descendiente${entry.kids === 1 ? "" : "s"}</div>
      </div>`;
    }
    entriesEl.innerHTML = html;
  }

  function showToast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2400);
  }

  // ==========================================
  // BUCLE DE ANIMACIÓN PRINCIPAL
  // ==========================================
  function frame(ts) {
    requestAnimationFrame(frame);
    if (lastTs === null) lastTs = ts;
    let deltaMs = ts - lastTs;
    lastTs = ts;
    if (deltaMs > 250) deltaMs = 250;

    if (running) {
      const dt = (deltaMs / 16.6667) * speedMult;
      tick(dt);
      simTime += deltaMs * speedMult;
      realElapsedMs += deltaMs;
    }

    // Actualización suave de la cámara de seguimiento / encarnación
    if (possessedCreature) {
      targetCamX = possessedCreature.x;
      targetCamY = possessedCreature.y;
      targetCamZoom = 1.34;
    } else if (followingCreature) {
      targetCamX = followingCreature.x;
      targetCamY = followingCreature.y;
      targetCamZoom = 1.25;
    } else {
      targetCamX = W / 2;
      targetCamY = H / 2;
      targetCamZoom = 1.0;
    }

    camX += (targetCamX - camX) * 0.08;
    camY += (targetCamY - camY) * 0.08;
    camZoom += (targetCamZoom - camZoom) * 0.06;

    drawWorld();

    frameCounter++;
    if (frameCounter % 8 === 0) {
      updateUI();
      updatePopChart();
      computeMood();
      if (possessedCreature) updatePossessionUI();
    }
  }

  // ==========================================
  // INTERACCIÓN Y CONTROLES
  // ==========================================
  const toolButtons = document.querySelectorAll(".tool-item");
  toolButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      toolButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      options.activeTool = btn.dataset.tool;
    });
  });

  let pointerActive = false, lastSpawnTs = 0;

  function handlePointer(ev) {
    const screenX = ev.clientX, screenY = ev.clientY;
    const x = (screenX - W / 2) / camZoom + camX;
    const y = (screenY - H / 2) / camZoom + camY;

    if (possessedCreature) {
      possessionAutopilot = false;
      updatePossessionUI();
      possessedCreature.steerToward(x, y, 1.0, 0.28, 1.4);
      particles.push({ x, y, r: 4, alpha: 0.85, color: "#c084fc" });
      return;
    }

    if (ancientTree && distSq(x, y, ancientTree.x, ancientTree.y) < 48 * 48) {
      openTreeModal();
      return;
    }

    const clickedCreature = creatureGrid.nearest(x, y, 25);
    if (clickedCreature && options.activeTool !== "lightning" && options.activeTool !== "vortex" && options.activeTool !== "blessing") {
      selectedCreature = clickedCreature;
      updateUI();
      return;
    }

    const now = performance.now();
    if (now - lastSpawnTs < 90) return;
    lastSpawnTs = now;

    switch (options.activeTool) {
      case "food":
        for (let i = 0; i < 3; i++) spawnFood(x + spread(20), y + spread(20));
        break;
      case "herb_agile":
        creatures.push(new Creature(x, y, "herb_agile"));
        break;
      case "herb_mega":
        creatures.push(new Creature(x, y, "herb_mega"));
        break;
      case "carn_pack":
        creatures.push(new Creature(x, y, "carn_pack"));
        break;
      case "carn_apex":
        creatures.push(new Creature(x, y, "carn_apex"));
        break;
      case "scavenger":
        creatures.push(new Creature(x, y, "scavenger"));
        break;
      case "pollinator":
        creatures.push(new Creature(x, y, "pollinator"));
        break;
      case "water":
        waterBodies.push({ x: x, y: y, radius: rand(45, 75), seed: rand(0, 1000) });
        break;
      case "lightning":
        spawnLightning(x, y);
        break;
      case "vortex":
        spawnVortex(x, y);
        break;
      case "blessing":
        const targetCreature = creatureGrid.nearest(x, y, 45) || clickedCreature;
        if (targetCreature) {
          blessCreature(targetCreature);
        } else {
          for (let i = 0; i < 16; i++) {
            particles.push({
              x: x + spread(25), y: y + spread(25),
              vx: spread(0.5), vy: spread(0.5),
              r: rand(2, 4), alpha: 0.9, color: "#fde047"
            });
          }
          Sound.chime(x);
        }
        break;
    }
  }

  canvas.addEventListener("pointerdown", (ev) => {
    pointerActive = true;
    handlePointer(ev);
    try { canvas.setPointerCapture(ev.pointerId); } catch (e) {}
  });
  canvas.addEventListener("pointermove", (ev) => {
    if (pointerActive) {
      if (possessedCreature) handlePointer(ev);
      else if (options.activeTool === "food" || options.activeTool === "vortex") handlePointer(ev);
    }
  });
  const endPointer = () => { pointerActive = false; };
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);

  document.getElementById("btnPause").addEventListener("click", () => {
    running = !running;
    document.getElementById("btnPause").textContent = running ? "Pausar" : "Reanudar";
  });

  document.getElementById("btnReset").addEventListener("click", seedWorld);

  const chronicleOverlay = document.getElementById("chronicleOverlay");
  document.getElementById("btnChronicle").addEventListener("click", () => {
    renderChronicle();
    chronicleOverlay.classList.add("open");
  });
  document.getElementById("chronicleClose").addEventListener("click", () => {
    chronicleOverlay.classList.remove("open");
  });
  chronicleOverlay.addEventListener("click", (e) => {
    if (e.target === chronicleOverlay) chronicleOverlay.classList.remove("open");
  });

  const sagaOverlay = document.getElementById("sagaOverlay");
  document.getElementById("btnSagas").addEventListener("click", () => {
    renderSagas();
    sagaOverlay.classList.add("open");
  });
  document.getElementById("sagaClose").addEventListener("click", () => {
    sagaOverlay.classList.remove("open");
  });
  sagaOverlay.addEventListener("click", (e) => {
    if (e.target === sagaOverlay) sagaOverlay.classList.remove("open");
  });

  document.getElementById("btnRain").addEventListener("click", () => {
    rainActive = 400;
    showToast("🌧️ Lluvia fértil iniciada — acelerando crecimiento");
  });

  document.getElementById("btnMeteor").addEventListener("click", () => {
    spawnMeteorShower();
    meteorCooldown = rand(2600, 5400);
  });

  const btnAurora = document.getElementById("btnAurora");
  if (btnAurora) {
    btnAurora.addEventListener("click", () => {
      auroraManualTimer = 2200;
      Sound.aurora();
      showToast("✨ ¡Gran Aurora Boreal invocada! El cielo cósmico despierta");
    });
  }

  const btnEclipse = document.getElementById("btnEclipse");
  if (btnEclipse) {
    btnEclipse.addEventListener("click", () => {
      triggerEclipse();
    });
  }

  const btnTree = document.getElementById("btnTree");
  if (btnTree) {
    btnTree.addEventListener("click", openTreeModal);
  }
  const treeClose = document.getElementById("treeClose");
  const treeOverlay = document.getElementById("treeOverlay");
  if (treeClose && treeOverlay) {
    treeClose.addEventListener("click", () => treeOverlay.classList.remove("open"));
    treeOverlay.addEventListener("click", (e) => {
      if (e.target === treeOverlay) treeOverlay.classList.remove("open");
    });
  }
  const btnTreeBloom = document.getElementById("btnTreeBloom");
  if (btnTreeBloom) {
    btnTreeBloom.addEventListener("click", () => {
      triggerTreeBloom();
      if (treeOverlay) treeOverlay.classList.remove("open");
    });
  }

  const btnPossess = document.getElementById("btnPossess");
  if (btnPossess) {
    btnPossess.addEventListener("click", () => {
      if (possessedCreature) {
        releaseSoulBond();
      } else {
        const candidate = selectedCreature || creatures.find(c => c.legendary) || creatures.slice().sort((a, b) => b.age - a.age)[0] || creatures[0];
        if (candidate) possessCreature(candidate);
        else showToast("No hay criaturas vivas en el terrario");
      }
    });
  }

  const togAudioBtn = document.getElementById("togAudio");
  togAudioBtn.addEventListener("click", () => {
    audioEnabled = !audioEnabled;
    togAudioBtn.classList.toggle("active", audioEnabled);
    Sound.setEnabled(audioEnabled);
    if (audioEnabled) showToast("🔊 Paisaje sonoro generativo activado");
  });

  const togDreamBtn = document.getElementById("togDream");
  togDreamBtn.addEventListener("click", () => {
    options.dreamMode = !options.dreamMode;
    togDreamBtn.classList.toggle("active", options.dreamMode);
    document.getElementById("poemLayer").classList.toggle("visible", options.dreamMode);
    Sound.setDream(options.dreamMode);
    if (options.dreamMode) {
      poemTimer = 0;
      showToast("🌀 El terrario empieza a soñar en voz alta");
    } else {
      document.getElementById("poemText").classList.remove("in");
      showToast("El sueño se disuelve");
    }
  });

  document.getElementById("rangeFood").addEventListener("input", (e) => {
    foodRate = e.target.value / 100;
    document.getElementById("lblFood").textContent = e.target.value + "%";
  });

  document.getElementById("rangeSpeed").addEventListener("input", (e) => {
    speedMult = e.target.value / 100;
    document.getElementById("lblSpeed").textContent = speedMult.toFixed(1) + "×";
  });

  document.getElementById("rangeTod").addEventListener("input", (e) => {
    dayTime = e.target.value / 100;
    options.autoDayNight = false;
    document.getElementById("togDayNight").classList.remove("active");
  });

  const setupToggle = (id, key) => {
    const el = document.getElementById(id);
    el.addEventListener("click", () => {
      options[key] = !options[key];
      el.classList.toggle("active", options[key]);
    });
  };
  setupToggle("togVision", "showVision");
  setupToggle("togEmotes", "showEmotes");
  setupToggle("togBars", "showBars");
  setupToggle("togDayNight", "autoDayNight");
  setupToggle("togCymatics", "showCymatics");

  document.getElementById("inspClose").addEventListener("click", () => { selectedCreature = null; updateUI(); });
  document.getElementById("btnFeedSelected").addEventListener("click", () => {
    if (selectedCreature) {
      selectedCreature.energy = selectedCreature.maxEnergy;
      selectedCreature.water = selectedCreature.maxWater;
      selectedCreature.setEmote("✨🍖", 50);
    }
  });

  const btnFollowCam = document.getElementById("btnFollowCam");
  if (btnFollowCam) {
    btnFollowCam.addEventListener("click", () => {
      if (selectedCreature) {
        followingCreature = (followingCreature === selectedCreature ? null : selectedCreature);
        btnFollowCam.textContent = followingCreature ? "🎯 Siguiendo" : "🎯 Centrar";
        showToast(followingCreature ? `🎯 Cámara centrada en ${selectedCreature.name}` : "🎯 Cámara liberada");
      }
    });
  }

  const btnPossessInsp = document.getElementById("btnPossessInsp");
  if (btnPossessInsp) {
    btnPossessInsp.addEventListener("click", () => {
      if (possessedCreature && possessedCreature === selectedCreature) {
        releaseSoulBond();
      } else if (selectedCreature) {
        possessCreature(selectedCreature);
      }
    });
  }

  const btnPossAbility = document.getElementById("btnPossAbility");
  if (btnPossAbility) {
    btnPossAbility.addEventListener("click", triggerPossessionAbility);
  }

  const btnPossAutopilot = document.getElementById("btnPossAutopilot");
  if (btnPossAutopilot) {
    btnPossAutopilot.addEventListener("click", () => {
      possessionAutopilot = !possessionAutopilot;
      updatePossessionUI();
      showToast(possessionAutopilot ? "🤖 Instinto autónomo activado" : "🎮 Control manual activado (WASD/Flechas)");
    });
  }

  const btnPossRelease = document.getElementById("btnPossRelease");
  if (btnPossRelease) {
    btnPossRelease.addEventListener("click", releaseSoulBond);
  }

  window.addEventListener("keydown", (e) => {
    if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight", "ShiftLeft", "ShiftRight"].includes(e.code)) {
      if (possessedCreature) {
        possessionKeys[e.code] = true;
        if (possessionAutopilot && (e.code.startsWith("Key") || e.code.startsWith("Arrow"))) {
          possessionAutopilot = false;
          updatePossessionUI();
        }
      }
    }
    if (e.code === "Space" && possessedCreature) {
      e.preventDefault();
      triggerPossessionAbility();
    }
    if (e.code === "KeyA" && possessedCreature && !e.ctrlKey && !e.metaKey && !possessionKeys.KeyW && !possessionKeys.KeyS) {
      possessionAutopilot = !possessionAutopilot;
      updatePossessionUI();
      showToast(possessionAutopilot ? "🤖 Instinto autónomo activado" : "🎮 Control manual activado");
    }
    if (e.code === "Escape") {
      if (possessedCreature) releaseSoulBond();
    }
    if (e.code === "KeyE" && !e.ctrlKey && !e.metaKey) {
      if (possessedCreature) {
        releaseSoulBond();
      } else if (selectedCreature) {
        possessCreature(selectedCreature);
      }
    }
    if (e.code === "KeyT" && !e.ctrlKey && !e.metaKey && !possessedCreature) {
      openTreeModal();
    }
    if (e.code === "KeyO" && !e.ctrlKey && !e.metaKey && !possessedCreature) {
      triggerEclipse();
    }
  });

  window.addEventListener("keyup", (e) => {
    if (possessionKeys[e.code] !== undefined) {
      possessionKeys[e.code] = false;
    }
  });

  const lineageOverlay = document.getElementById("lineageOverlay");
  document.getElementById("btnLineage").addEventListener("click", () => {
    if (!selectedCreature) return;
    renderLineage();
    lineageOverlay.classList.add("open");
  });
  document.getElementById("lineageClose").addEventListener("click", () => {
    lineageOverlay.classList.remove("open");
  });
  lineageOverlay.addEventListener("click", (e) => {
    if (e.target === lineageOverlay) lineageOverlay.classList.remove("open");
  });

  const oracleOverlay = document.getElementById("oracleOverlay");
  const oracleAnswerEl = document.getElementById("oracleAnswer");
  document.getElementById("btnOracle").addEventListener("click", () => {
    renderOracleHistory();
    oracleAnswerEl.classList.remove("in");
    oracleAnswerEl.textContent = "";
    oracleOverlay.classList.add("open");
    Sound.chime();
    setTimeout(() => document.getElementById("oracleInput").focus(), 200);
  });
  document.getElementById("oracleClose").addEventListener("click", () => {
    oracleOverlay.classList.remove("open");
  });
  oracleOverlay.addEventListener("click", (e) => {
    if (e.target === oracleOverlay) oracleOverlay.classList.remove("open");
  });
  document.getElementById("oracleForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("oracleInput");
    const question = input.value.trim();
    if (!question) return;
    const answer = consultOracle(question);
    oracleAnswerEl.classList.remove("in");
    setTimeout(() => {
      oracleAnswerEl.textContent = answer;
      oracleAnswerEl.classList.add("in");
    }, 200);
    recordProphecy(question, answer);
    renderOracleHistory();
    input.value = "";
    Sound.pluck();
  });

  document.getElementById("btnPostal").addEventListener("click", capturePostcard);

  const constellationOverlay = document.getElementById("constellationOverlay");
  const constellationCanvas = document.getElementById("constellationCanvas");
  const constellationCtx = constellationCanvas.getContext("2d");
  const constellationEpitaph = document.getElementById("constellationEpitaph");
  let constellationRAF = null;

  function sizeConstellationCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const r = constellationCanvas.getBoundingClientRect();
    constellationCanvas.width = r.width * dpr;
    constellationCanvas.height = r.height * dpr;
    constellationCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    starField = null;
  }

  function constellationFrame(ts) {
    const r = constellationCanvas.getBoundingClientRect();
    drawConstellationSky(constellationCtx, r.width, r.height, ts / 1000);
    constellationRAF = requestAnimationFrame(constellationFrame);
  }

  function constellationPos(ev) {
    const r = constellationCanvas.getBoundingClientRect();
    const cx = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left;
    const cy = (ev.touches ? ev.touches[0].clientY : ev.clientY) - r.top;
    return { x: cx, y: cy };
  }

  constellationCanvas.addEventListener("mousemove", (ev) => {
    const p = constellationPos(ev);
    constellationHover = findStarAt(p.x, p.y, 14);
  });
  constellationCanvas.addEventListener("mouseleave", () => { constellationHover = -1; });
  constellationCanvas.addEventListener("click", (ev) => {
    const p = constellationPos(ev);
    const idx = findStarAt(p.x, p.y, 16);
    if (idx >= 0) {
      constellationSelected = idx;
      constellationEpitaph.textContent = generateEpitaph(starField[idx].entry);
      Sound.pluck();
    }
  });

  document.getElementById("btnConstellation").addEventListener("click", () => {
    document.getElementById("constellationCount").textContent = deathLedger.length;
    constellationSelected = -1;
    constellationHover = -1;
    constellationEpitaph.textContent = deathLedger.length
      ? "Elige una estrella entre las constelaciones."
      : "El cielo está vacío. Ninguna alma ha partido todavía.";
    constellationOverlay.classList.add("open");
    requestAnimationFrame(() => {
      sizeConstellationCanvas();
      if (!constellationRAF) constellationRAF = requestAnimationFrame(constellationFrame);
    });
  });
  document.getElementById("constellationClose").addEventListener("click", () => {
    constellationOverlay.classList.remove("open");
    if (constellationRAF) { cancelAnimationFrame(constellationRAF); constellationRAF = null; }
  });
  constellationOverlay.addEventListener("click", (e) => {
    if (e.target === constellationOverlay) {
      constellationOverlay.classList.remove("open");
      if (constellationRAF) { cancelAnimationFrame(constellationRAF); constellationRAF = null; }
    }
  });
  window.addEventListener("resize", () => {
    if (constellationOverlay.classList.contains("open")) sizeConstellationCanvas();
  });

  const panelToggle = document.getElementById("panelToggle");
  const panelEl = document.getElementById("panel");
  panelToggle.addEventListener("click", () => {
    const exp = panelEl.classList.toggle("expanded");
    panelToggle.setAttribute("aria-expanded", exp ? "true" : "false");
  });

  resize();
  loadDeathLedger();
  loadChronicle();
  loadProphecies();
  loadLegendLedger();
  loadPostalCount();
  seedWorld();
  if (deathLedger.length > 0) {
    setTimeout(() => showToast(`🕯️ El terrario recuerda ${deathLedger.length} almas de visitas anteriores`), 1200);
  }
  requestAnimationFrame(frame);
})();
