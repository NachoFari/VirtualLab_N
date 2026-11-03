window.VLabExperiments = window.VLabExperiments || {};
window.VLabExperiments['QC-01'] = {
  id: 'QC-01',
  title: 'Entrelazamiento Cuántico y Estados de Bell',
  block: 'G',
  category: 'Computación Cuántica',
  formula: '|Φ⁺⟩ = (|00⟩ + |11⟩)/√2  ;  E(α,β) = ±cos(α ± β)  ;  |S| ≤ 2√2',
  description: 'Dos qubits entrelazados visualizados como esferas de Bloch 3D. Rota los ángulos de medición α y β de Alice y Bob y verifica la violación cuántica de la desigualdad de Bell-CHSH (|S| = 2√2 ≈ 2.828 > 2).',
  hasImpulse: false,
  params: [
    { key: 'bellState', label: 'Estado de Bell (1:Φ⁺, 2:Φ⁻, 3:Ψ⁺, 4:Ψ⁻)', unit: '', min: 1, max: 4, step: 1, default: 1 },
    { key: 'alpha', label: 'Ángulo Detector Alice (α)', unit: '°', min: 0, max: 180, step: 5, default: 0 },
    { key: 'beta', label: 'Ángulo Detector Bob (β)', unit: '°', min: 0, max: 180, step: 5, default: 45 },
    { key: 'coherence', label: 'Pureza / Coherencia (p)', unit: '', min: 0, max: 1, step: 0.05, default: 1.0 }
  ],
  presets: [
    { label: 'Violación Máxima CHSH (Φ⁺, 45°)', values: { bellState: 1, alpha: 0, beta: 45, coherence: 1.0 } },
    { label: 'Correlación Perfecta (Φ⁺, α=β=0°)', values: { bellState: 1, alpha: 0, beta: 0, coherence: 1.0 } },
    { label: 'Singlete Antisimétrico (Ψ⁻)', values: { bellState: 4, alpha: 30, beta: 30, coherence: 1.0 } },
    { label: 'Estado de Werner Clásico (p=0.5)', values: { bellState: 1, alpha: 0, beta: 45, coherence: 0.5 } }
  ],
  initState(params) {
    return { t: 0, phase: 0 };
  },
  step(state, params, dt) {
    state.t += dt;
    state.phase += dt * (2.5 + params.coherence * 3.0);
  },
  createScene(THREE, components, params) {
    const group = new THREE.Group();

    const matBase = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.6, roughness: 0.4 });
    const matCyan = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.35, roughness: 0.25 });
    const matBlue = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.4, roughness: 0.3 });
    const matPurple = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, metalness: 0.4, roughness: 0.3 });
    const matAmber = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.35, roughness: 0.25 });
    const matGreen = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.35, roughness: 0.25 });

    // Base sobria de laboratorio
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.04, 0.68), matBase);
    base.position.set(0, 0.02, 0);
    group.add(base);

    // Pedestales para Qubit A (Alice) y Qubit B (Bob)
    function createBlochStation(xPos, accentMat) {
      const station = new THREE.Group();
      station.position.set(xPos, 0.06, 0);

      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.44, 20), matBase);
      pillar.position.y = 0.22;
      station.add(pillar);

      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 12, 24), accentMat);
      collar.rotation.x = Math.PI / 2;
      collar.position.y = 0.44;
      station.add(collar);

      const sphereCenterY = 0.68;
      const radius = 0.19;

      // Esfera de Bloch translúcida
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x4facfe,
        transparent: true,
        opacity: 0.16,
        roughness: 0.1,
        metalness: 0.1
      });
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 28, 28), glassMat);
      sphere.position.y = sphereCenterY;
      station.add(sphere);

      // Meridianos de la esfera de Bloch
      const eqRing = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.004, 10, 48), matBlue);
      eqRing.rotation.x = Math.PI / 2;
      eqRing.position.y = sphereCenterY;
      station.add(eqRing);

      const merRing1 = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.003, 10, 48), matBlue);
      merRing1.position.y = sphereCenterY;
      station.add(merRing1);

      const merRing2 = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.003, 10, 48), matBlue);
      merRing2.rotation.y = Math.PI / 2;
      merRing2.position.y = sphereCenterY;
      station.add(merRing2);

      // Polos |0> y |1>
      const pole0 = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 12), matCyan);
      pole0.position.set(0, sphereCenterY + radius, 0);
      station.add(pole0);

      const pole1 = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 12), matPurple);
      pole1.position.set(0, sphereCenterY - radius, 0);
      station.add(pole1);

      // Anillo detector giratorio (ángulo α o β)
      const detectorRing = new THREE.Group();
      detectorRing.position.y = sphereCenterY;
      const detArc = new THREE.Mesh(new THREE.TorusGeometry(radius + 0.032, 0.007, 12, 48), accentMat);
      detectorRing.add(detArc);

      // Vector de estado / espín medido dentro de la esfera
      const arrowGroup = new THREE.Group();
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, radius * 1.4, 12), accentMat);
      shaft.position.y = radius * 0.35;
      arrowGroup.add(shaft);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.055, 16), accentMat);
      tip.position.y = radius * 1.05;
      arrowGroup.add(tip);
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.025, 16, 16), matCyan);
      arrowGroup.add(core);

      detectorRing.add(arrowGroup);
      station.add(detectorRing);

      return { station, detectorRing, arrowGroup, sphereCenterY };
    }

    const alice = createBlochStation(-0.34, matCyan);
    const bob = createBlochStation(0.34, matAmber);
    group.add(alice.station);
    group.add(bob.station);

    // Puente de Entrelazamiento Cuántico entre ambas esferas
    const beamGroup = new THREE.Group();
    beamGroup.position.set(0, 0.74, 0);
    group.add(beamGroup);

    const coreBeamMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.75
    });
    const coreBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.68, 16), coreBeamMat);
    coreBeam.rotation.z = Math.PI / 2;
    beamGroup.add(coreBeam);

    // Anillos de fase cuántica a lo largo del canal de entrelazamiento
    const waveRings = [];
    const numRings = 9;
    for (let i = 0; i < numRings; i++) {
      const rMat = i % 2 === 0 ? matCyan : matPurple;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.005, 10, 24), rMat);
      ring.rotation.y = Math.PI / 2;
      const frac = (i / (numRings - 1)) - 0.5;
      ring.position.x = frac * 0.52;
      beamGroup.add(ring);
      waveRings.push({ mesh: ring, baseFrac: frac });
    }

    // Indicador central de correlación CHSH (Torre de Bell)
    const chshTower = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 0.14), matBase);
    chshTower.position.set(0, 0.20, -0.18);
    group.add(chshTower);

    const chshCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.065, 0), matGreen);
    chshCrystal.position.set(0, 0.42, -0.18);
    group.add(chshCrystal);

    return {
      group,
      update(state, params) {
        const bState = Math.round(params.bellState || 1);
        const alphaRad = ((params.alpha || 0) * Math.PI) / 180;
        const betaRad = ((params.beta || 0) * Math.PI) / 180;
        const p = params.coherence !== undefined ? params.coherence : 1.0;

        // Orientación de los detectores de Alice y Bob
        alice.detectorRing.rotation.z = -alphaRad;
        bob.detectorRing.rotation.z = -betaRad;

        // En estados Ψ⁺ (3) y Ψ⁻ (4) los espines están antiparalelos en Z
        const bobFlip = (bState === 3 || bState === 4) ? Math.PI : 0;
        // Oscilación cuántica de superposición
        const wobble = Math.sin(state.phase) * 0.18 * p;
        alice.arrowGroup.rotation.x = wobble;
        bob.arrowGroup.rotation.x = (bState === 2 || bState === 4) ? -wobble : wobble;
        bob.arrowGroup.rotation.z = bobFlip;

        // Animación de los anillos de entrelazamiento
        for (let i = 0; i < waveRings.length; i++) {
          const wr = waveRings[i];
          const s = 0.4 + 0.6 * p * (1 + 0.35 * Math.sin(state.phase * 1.4 + i * 0.7));
          wr.mesh.scale.set(s, s, 1);
          wr.mesh.rotation.z = state.t * (bState % 2 === 0 ? -2.0 : 2.0) + i * 0.4;
        }

        coreBeam.scale.set(0.3 + 0.7 * p, 1, 0.3 + 0.7 * p);
        coreBeamMat.opacity = 0.2 + 0.75 * p;

        // Cristal CHSH brilla en verde esmeralda si viola el límite clásico |S| > 2
        const sVal = 2 * Math.SQRT2 * p;
        chshCrystal.rotation.y = state.t * 1.8;
        chshCrystal.position.y = 0.42 + Math.sin(state.t * 3) * 0.015;
        if (sVal > 2.0) {
          chshCrystal.material = matGreen;
          const sc = 1.0 + 0.15 * Math.sin(state.phase * 2);
          chshCrystal.scale.set(sc, sc, sc);
        } else {
          chshCrystal.material = matAmber;
          chshCrystal.scale.set(0.85, 0.85, 0.85);
        }
      }
    };
  },
  getMetrics(state, params) {
    const bState = Math.round(params.bellState || 1);
    const names = { 1: '|Φ⁺⟩ = (|00⟩+|11⟩)/√2', 2: '|Φ⁻⟩ = (|00⟩-|11⟩)/√2', 3: '|Ψ⁺⟩ = (|01⟩+|10⟩)/√2', 4: '|Ψ⁻⟩ = (|01⟩-|10⟩)/√2' };
    const aRad = ((params.alpha || 0) * Math.PI) / 180;
    const bRad = ((params.beta || 0) * Math.PI) / 180;
    const p = params.coherence !== undefined ? params.coherence : 1.0;

    let rawCorr = Math.cos(aRad - bRad);
    if (bState === 2) rawCorr = Math.cos(aRad + bRad);
    if (bState === 3) rawCorr = -Math.cos(aRad + bRad);
    if (bState === 4) rawCorr = -Math.cos(aRad - bRad);

    const E = p * rawCorr;
    const P_same = 0.5 * (1 + E);
    const S_chsh = 2 * Math.SQRT2 * p;

    return [
      { label: 'Estado de Bell', value: names[bState] || names[1] },
      { label: 'Correlación E(α,β)', value: E.toFixed(3) },
      { label: 'Prob. Coincidencia P(=)', value: (P_same * 100).toFixed(1) + ' %' },
      { label: 'Parámetro CHSH |S|', value: S_chsh.toFixed(3) + (S_chsh > 2 ? ' (Cuántico >2)' : ' (Clásico ≤2)') }
    ];
  },
  questions: [
    {
      q: '¿Cuál es la expresión matemática del estado de Bell máximamente entrelazado |Φ⁺⟩?',
      options: [
        'A) (|00⟩ + |11⟩) / √2',
        'B) (|00⟩ + |01⟩) / 2',
        'C) |00⟩ × |11⟩',
        'D) (|01⟩ - |10⟩) / 2'
      ],
      answer: 0
    },
    {
      q: 'En la desigualdad de Bell-CHSH, ¿cuál es el límite superior para cualquier teoría de variables ocultas locales (física clásica)?',
      options: [
        'A) |S| ≤ 1',
        'B) |S| ≤ 2',
        'C) |S| ≤ 2√2 ≈ 2.828',
        'D) |S| ≤ 4'
      ],
      answer: 1
    },
    {
      q: '¿Cuál es el valor máximo del parámetro |S| (cota de Tsirelson) predicho por la mecánica cuántica y confirmado experimentalmente?',
      options: [
        'A) 2.000',
        'B) 2√2 ≈ 2.828',
        'C) 3.1416',
        'D) √2 ≈ 1.414'
      ],
      answer: 1
    },
    {
      q: 'Si dos qubits están en el estado |Φ⁺⟩ y Alice mide su qubit en la base computacional obteniendo |0⟩, ¿qué obtendrá Bob al medir en la misma base (con coherencia p = 1)?',
      options: [
        'A) |1⟩ con 100% de probabilidad',
        'B) |0⟩ con 100% de probabilidad',
        'C) |0⟩ o |1⟩ con 50% de probabilidad cada uno',
        'D) El qubit de Bob se destruye sin resultado'
      ],
      answer: 1
    },
    {
      q: '¿Cuál de los cuatro estados de Bell es el estado singlete antisimétrico que conserva correlación negativa independientemente de la base de medición?',
      options: [
        'A) |Φ⁺⟩ = (|00⟩ + |11⟩)/√2',
        'B) |Φ⁻⟩ = (|00⟩ - |11⟩)/√2',
        'C) |Ψ⁺⟩ = (|01⟩ + |10⟩)/√2',
        'D) |Ψ⁻⟩ = (|01⟩ - |10⟩)/√2'
      ],
      answer: 3
    },
    {
      q: 'En un circuito cuántico estándar, ¿qué secuencia de compuertas genera el estado |Φ⁺⟩ a partir del estado inicial |00⟩?',
      options: [
        'A) Compuerta Pauli-X seguida de Pauli-Z',
        'B) Compuerta Hadamard (H) en el primer qubit seguida de CNOT',
        'C) Dos compuertas CNOT consecutivas',
        'D) Compuerta de fase T en ambos qubits'
      ],
      answer: 1
    },
    {
      q: '¿Permite el entrelazamiento cuántico transmitir información o mensajes más rápido que la velocidad de la luz (violando la relatividad)?',
      options: [
        'A) Sí, permite enviar bits instantáneamente sin canal clásico',
        'B) No, porque los resultados locales de cada medición individual siguen siendo aleatorios (50%/50%) sin un canal clásico',
        'C) Sólo cuando se usa el estado |Ψ⁻⟩',
        'D) Sí, pero únicamente a distancias menores a 1 kilómetro'
      ],
      answer: 1
    },
    {
      q: 'Si la pureza o coherencia p de un estado de Werner disminuye debido al ruido ambiental (decoherencia), ¿a partir de qué umbral p deja de violarse la desigualdad CHSH (|S| ≤ 2)?',
      options: [
        'A) p ≤ 1 / √2 ≈ 0.707',
        'B) p ≤ 0.95',
        'C) p ≤ 0.25',
        'D) Nunca deja de violarse'
      ],
      answer: 0
    },
    {
      q: 'En la esfera de Bloch de un qubit individual, ¿dónde se ubican los estados de la base computacional |0⟩ y |1⟩?',
      options: [
        'A) Ambos en el centro de la esfera',
        'B) En los polos norte (+Z) y sur (-Z) respectivamente',
        'C) En el mismo punto del ecuador (+X)',
        'D) Fuera de la superficie de la esfera'
      ],
      answer: 1
    },
    {
      q: '¿Qué demostraron los experimentos de Aspect, Clauser y Zeilinger (Premio Nobel de Física 2022) mediante pruebas de Bell con fotones entrelazados?',
      options: [
        'A) Que la mecánica cuántica es incorrecta a nivel microscópico',
        'B) La violación experimental de las desigualdades de Bell, descartando las teorías de realismo local',
        'C) Que los fotones tienen masa en reposo positiva',
        'D) Que las esferas de Bloch son objetos macroscópicos visibles'
      ],
      answer: 1
    }
  ]
};
