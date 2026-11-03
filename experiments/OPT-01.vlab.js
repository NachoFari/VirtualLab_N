window.VLabExperiments = window.VLabExperiments || {};
window.VLabExperiments['OPT-01'] = {
  id: 'OPT-01',
  title: 'Ley de Snell y Reflexión Total Interna',
  block: 'D',
  category: 'Óptica Geométrica',
  formula: 'n₁ · sin(θ₁) = n₂ · sin(θ₂)',
  description: 'Estudio de la refracción y reflexión de un haz láser al incidir en la interfaz entre dos medios dieléctricos, incluyendo el ángulo crítico y la reflexión total interna.',
  params: [
    { key: 'theta1', label: 'Ángulo de Incidencia (θ₁)', unit: '°', min: 0, max: 85, step: 1, default: 35 },
    { key: 'n1', label: 'Índice Medio Superior (n₁)', unit: '', min: 1.0, max: 2.4, step: 0.05, default: 1.0 },
    { key: 'n2', label: 'Índice Medio Inferior (n₂)', unit: '', min: 1.0, max: 2.4, step: 0.05, default: 1.5 },
    { key: 'power', label: 'Potencia del Láser (P)', unit: 'mW', min: 1, max: 50, step: 1, default: 20 }
  ],
  presets: [
    { label: 'Aire a Vidrio (35°)', values: { theta1: 35, n1: 1.0, n2: 1.5, power: 20 } },
    { label: 'Agua a Diamante (45°)', values: { theta1: 45, n1: 1.33, n2: 2.4, power: 30 } },
    { label: 'Ángulo Crítico Vidrio-Aire', values: { theta1: 42, n1: 1.5, n2: 1.0, power: 25 } },
    { label: 'Reflexión Total Interna', values: { theta1: 60, n1: 1.5, n2: 1.0, power: 35 } }
  ],
  initState(params) {
    return { t: 0, pulsePhase: 0 };
  },
  step(state, params, dt) {
    state.t += dt;
    state.pulsePhase = (state.pulsePhase + dt * 4) % (Math.PI * 2);
  },
  createScene(THREE, components, params) {
    const group = new THREE.Group();

    // Base platform
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x0f141c, metalness: 0.6, roughness: 0.4 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 0.7), baseMat);
    base.position.set(0, 0.025, 0);
    group.add(base);

    // Protractor ring
    const ringGeo = new THREE.RingGeometry(0.38, 0.42, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x4facfe, side: THREE.DoubleSide, transparent: true, opacity: 0.35 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(0, 0.75, -0.05);
    group.add(ring);

    // Normal dashed line (represented by thin vertical cylinder)
    const normalMat = new THREE.MeshBasicMaterial({ color: 0x4facfe, transparent: true, opacity: 0.4 });
    const normalLine = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.9, 8), normalMat);
    normalLine.position.set(0, 0.75, 0);
    group.add(normalLine);

    // Lower dielectric block (Medium 2)
    const blockGeo = new THREE.BoxGeometry(0.9, 0.42, 0.4);
    const blockMat = new THREE.MeshPhysicalMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.32,
      roughness: 0.1,
      metalness: 0.1
    });
    const block = new THREE.Mesh(blockGeo, blockMat);
    block.position.set(0, 0.54, 0);
    group.add(block);

    // Upper dielectric block (Medium 1, subtle tint)
    const upperGeo = new THREE.BoxGeometry(0.9, 0.42, 0.4);
    const upperMat = new THREE.MeshPhysicalMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.12,
      roughness: 0.1
    });
    const upperBlock = new THREE.Mesh(upperGeo, upperMat);
    upperBlock.position.set(0, 0.96, 0);
    group.add(upperBlock);

    // Interface plane
    const planeMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe, side: THREE.DoubleSide, transparent: true, opacity: 0.25 });
    const interfacePlane = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.4), planeMat);
    interfacePlane.rotation.x = Math.PI / 2;
    interfacePlane.position.set(0, 0.75, 0);
    group.add(interfacePlane);

    // Laser emitter housing
    const emitterMat = new THREE.MeshStandardMaterial({ color: 0x0f141c, emissive: 0x00f2fe, emissiveIntensity: 0.2, metalness: 0.8 });
    const emitter = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 16), emitterMat);
    group.add(emitter);

    // Beams (pivot at interface center y = 0.75)
    const beamLen = 0.45;
    const makeBeam = (color) => {
      const pivot = new THREE.Group();
      pivot.position.set(0, 0.75, 0);
      const geo = new THREE.CylinderGeometry(0.008, 0.008, beamLen, 12);
      geo.translate(0, beamLen / 2, 0);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
      const mesh = new THREE.Mesh(geo, mat);
      pivot.add(mesh);
      return { pivot, mesh, mat };
    };

    const incBeam = makeBeam(0x10b981);
    const refBeam = makeBeam(0xf59e0b);
    const refrBeam = makeBeam(0x00f2fe);
    group.add(incBeam.pivot, refBeam.pivot, refrBeam.pivot);

    // Impact glow spot at origin
    const spotMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
    const spot = new THREE.Mesh(new THREE.SphereGeometry(0.02, 16, 16), spotMat);
    spot.position.set(0, 0.75, 0);
    group.add(spot);

    return {
      group,
      update(state, p) {
        const rad1 = (p.theta1 * Math.PI) / 180;
        const sinTheta2 = (p.n1 / p.n2) * Math.sin(rad1);
        const isTIR = sinTheta2 > 1.0;

        // Opacity of dielectric blocks scales with refractive index
        upperMat.opacity = 0.05 + (p.n1 - 1.0) * 0.18;
        blockMat.opacity = 0.15 + (p.n2 - 1.0) * 0.25;

        // Incident beam in top-left quadrant pointing to origin
        incBeam.pivot.rotation.z = rad1;
        const ex = -Math.sin(rad1) * beamLen;
        const ey = 0.75 + Math.cos(rad1) * beamLen;
        emitter.position.set(ex, ey, 0);
        emitter.rotation.z = rad1;

        // Reflected beam in top-right quadrant
        refBeam.pivot.rotation.z = -rad1;

        const scalePulse = 1 + 0.1 * Math.sin(state.pulsePhase) * (p.power / 50);
        spot.scale.setScalar(scalePulse);

        if (isTIR) {
          refrBeam.pivot.visible = false;
          refBeam.mat.opacity = 1.0;
          refBeam.mat.color.setHex(0x10b981);
          spotMat.color.setHex(0xf59e0b);
        } else {
          refrBeam.pivot.visible = true;
          const rad2 = Math.asin(Math.min(1, sinTheta2));
          refrBeam.pivot.rotation.z = Math.PI + rad2;
          // Fresnel-like approximation for visual intensity
          const rRatio = Math.min(0.9, Math.pow((p.n1 - p.n2) / (p.n1 + p.n2), 2) + 0.15 * Math.pow(sinTheta2, 4));
          refBeam.mat.opacity = Math.max(0.25, rRatio);
          refBeam.mat.color.setHex(0xf59e0b);
          refrBeam.mat.opacity = Math.max(0.4, 1.0 - rRatio * 0.5);
          spotMat.color.setHex(0x00f2fe);
        }
      }
    };
  },
  getMetrics(state, params) {
    const rad1 = (params.theta1 * Math.PI) / 180;
    const sinTheta2 = (params.n1 / params.n2) * Math.sin(rad1);
    const isTIR = sinTheta2 > 1.0;
    const theta2Str = isTIR ? 'RTI (Sin Refracción)' : ((Math.asin(sinTheta2) * 180) / Math.PI).toFixed(1) + '°';
    const critStr = params.n1 > params.n2 ? ((Math.asin(params.n2 / params.n1) * 180) / Math.PI).toFixed(1) + '°' : 'No aplica (n₁ ≤ n₂)';
    const v2 = (300000 / params.n2).toFixed(0);
    return [
      { label: 'Ángulo Refractado (θ₂)', value: theta2Str },
      { label: 'Ángulo Reflejado (θᵣ)', value: params.theta1.toFixed(1) + '°' },
      { label: 'Ángulo Crítico (θc)', value: critStr },
      { label: 'Velocidad en Medio 2', value: v2 + ' km/s' }
    ];
  },
  questions: [
    {
      q: '¿Qué establece la Ley de Snell para la refracción de la luz?',
      options: [
        'A) n₁ · cos(θ₁) = n₂ · cos(θ₂)',
        'B) n₁ · sin(θ₁) = n₂ · sin(θ₂)',
        'C) n₁ / sin(θ₁) = n₂ / sin(θ₂)',
        'D) θ₁ + θ₂ = 90° siempre'
      ],
      answer: 1
    },
    {
      q: 'Cuando un rayo de luz pasa del aire (n=1.0) al vidrio (n=1.5) con incidencia oblicua, el rayo refractado:',
      options: [
        'A) Se aleja de la normal',
        'B) Se acerca a la normal',
        'C) No cambia de dirección',
        'D) Sufre reflexión total interna'
      ],
      answer: 1
    },
    {
      q: '¿Qué condición es indispensable para que pueda ocurrir la Reflexión Total Interna (RTI)?',
      options: [
        'A) Que la luz viaje de un medio de menor índice a uno de mayor índice (n₁ < n₂)',
        'B) Que la luz viaje de un medio de mayor índice a uno de menor índice (n₁ > n₂)',
        'C) Que el ángulo de incidencia sea exactamente 0°',
        'D) Que ambos medios tengan el mismo índice de refracción'
      ],
      answer: 1
    },
    {
      q: '¿Cómo se define el ángulo crítico (θc) cuando n₁ > n₂?',
      options: [
        'A) El ángulo de incidencia para el cual el ángulo de refracción es 90°',
        'B) El ángulo para el cual no hay reflexión',
        'C) El ángulo donde θ₁ = θ₂',
        'D) El ángulo de incidencia igual a 45°'
      ],
      answer: 0
    },
    {
      q: 'Si n₁ = 1.50 y n₂ = 1.00, ¿cuál es aproximadamente el valor del seno del ángulo crítico sin(θc)?',
      options: [
        'A) 1.50',
        'B) 0.67',
        'C) 0.50',
        'D) 1.00'
      ],
      answer: 1
    },
    {
      q: '¿Qué ocurre con la velocidad de propagación de la luz al entrar en un medio con mayor índice de refracción?',
      options: [
        'A) Aumenta proporcionalmente a n',
        'B) Disminuye según v = c / n',
        'C) Permanece igual a c en todo medio',
        'D) Se vuelve cero en la interfaz'
      ],
      answer: 1
    },
    {
      q: 'Al pasar un haz láser de un medio n₁ a otro medio n₂, ¿qué magnitud física de la onda permanece constante?',
      options: [
        'A) La velocidad de fase',
        'B) La longitud de onda',
        'C) La frecuencia de la luz',
        'D) La dirección de propagación'
      ],
      answer: 2
    },
    {
      q: 'Si un rayo incide perpendicularmente a la superficie de separación (θ₁ = 0°), ¿cuánto vale el ángulo de refracción θ₂?',
      options: [
        'A) 90°',
        'B) 45°',
        'C) 0°',
        'D) Depende del cociente n₁/n₂'
      ],
      answer: 2
    },
    {
      q: '¿Cuál de las siguientes tecnologías basa su funcionamiento directamente en la Reflexión Total Interna?',
      options: [
        'A) Los espejos planos domésticos',
        'B) Las fibras ópticas de telecomunicaciones',
        'C) Los filtros polarizadores',
        'D) Las redes de difracción'
      ],
      answer: 1
    },
    {
      q: 'Según la ley de la reflexión, si el ángulo de incidencia es θ₁ = 37°, el ángulo de reflexión respecto a la normal es:',
      options: [
        'A) 53°',
        'B) 37°',
        'C) 0°',
        'D) Depende del índice de refracción n₂'
      ],
      answer: 1
    }
  ]
};
