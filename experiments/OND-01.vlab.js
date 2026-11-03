/**
 * VirtualLab_N - Experimento OND-01
 * Ondas Estacionarias en una Cuerda (Armónicos)
 * Diseño académico minimalista - Slate / Zinc / Cobalt / Amber
 */

window.VLabExperiments = window.VLabExperiments || {};
window.VLabExperiments['OND-01'] = {
  id: 'OND-01',
  title: 'Ondas Estacionarias en una Cuerda (Armónicos)',
  block: 'B',
  category: 'Ondas y Acústica',
  formula: 'y(x,t) = 2A · sin(n·π·x / L) · cos(ω·t)   ;   fₙ = (n / 2L)·√(T / μ)',
  description: 'Generador Melde de ondas estacionarias en una cuerda tensada entre dos soportes mecánicos. Visualiza los modos armónicos n = 1 a 6 con nodos inmóviles marcados con esferas ámbar, antinodos vibratorios (vientres) y envolventes teóricas de máxima elongación. Puedes arrastrar verticalmente los antinodos para variar la amplitud A o pulsar Impulso.',
  hasImpulse: true,
  params: [
    { key: 'freq', label: 'Frecuencia del Oscilador (f)', unit: 'Hz', min: 10, max: 240, step: 1, default: 60 },
    { key: 'harmonic', label: 'Modo Armónico (n)', unit: '', min: 1, max: 6, step: 1, default: 2 },
    { key: 'tension', label: 'Tensión de Cuerda (T)', unit: 'N', min: 10, max: 100, step: 5, default: 40 },
    { key: 'amp', label: 'Amplitud de Onda (A)', unit: 'm', min: 0.05, max: 0.25, step: 0.01, default: 0.14 },
    { key: 'mu', label: 'Densidad Lineal (μ)', unit: 'g/m', min: 1.0, max: 10.0, step: 0.5, default: 2.0 }
  ],
  presets: [
    { label: 'Modo Fundamental (n=1, f=54 Hz)', values: { freq: 54, harmonic: 1, tension: 40, amp: 0.16, mu: 2.0 } },
    { label: 'Segundo Armónico (n=2, f=109 Hz)', values: { freq: 109, harmonic: 2, tension: 40, amp: 0.14, mu: 2.0 } },
    { label: 'Tercer Armónico (n=3, f=163 Hz)', values: { freq: 163, harmonic: 3, tension: 45, amp: 0.13, mu: 2.0 } },
    { label: 'Cuarto Armónico (n=4, f=218 Hz)', values: { freq: 218, harmonic: 4, tension: 50, amp: 0.11, mu: 2.0 } },
    { label: 'Cuerda Densa / Tensión Alta (n=2)', values: { freq: 65, harmonic: 2, tension: 85, amp: 0.15, mu: 6.0 } }
  ],

  initState(params) {
    return {
      t: 0,
      phase: 0,
      boost: 1.0,
      resonance: 1.0,
      activeN: 2,
      fn: 109.0,
      isDraggingObject: false
    };
  },

  step(state, params, dt) {
    if (state.isDraggingObject) return;
    state.t += dt;

    const L = 1.30;
    const T = Math.max(5, params.tension || 40);
    const muKg = Math.max(0.0001, (params.mu || 2.0) * 1e-3);
    const vWave = Math.sqrt(T / muKg);
    const fFund = vWave / (2 * L);

    const fOsc = Math.max(5, params.freq || 60);
    const nFromF = Math.max(1, Math.min(6, Math.round(fOsc / fFund)));
    const n = params.harmonic !== undefined ? Math.max(1, Math.min(6, Math.round(params.harmonic))) : nFromF;

    const fn = n * fFund;
    const df = Math.abs(fOsc - fn);
    const halfG = Math.max(3.5, fn * 0.045);
    const resonance = (halfG * halfG) / (df * df + halfG * halfG);

    state.activeN = n;
    state.fn = fn;
    state.resonance = resonance;

    // Frecuencia visual didáctica continua
    const speedRatio = Math.sqrt(T / (muKg * 20000));
    const omegaVis = 3.6 * Math.sqrt(n) * speedRatio * (fOsc / Math.max(10, fn));

    state.phase += omegaVis * dt;

    if (state.boost > 1.0) {
      state.boost = Math.max(1.0, state.boost - dt * 1.5);
    }
  },

  onPush(state) {
    state.boost = 1.6;
    state.phase = 0;
  },

  createScene(THREE, components, params) {
    const group = new THREE.Group();

    // Materiales sobrios de laboratorio
    const matBase = new THREE.MeshStandardMaterial({ color: 0x12151d, metalness: 0.6, roughness: 0.4 });
    const matSteel = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.22 });
    const matDarkAlu = new THREE.MeshStandardMaterial({ color: 0x1e2433, metalness: 0.65, roughness: 0.35 });
    const matBrass = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.6, roughness: 0.3 });
    const matNodeAmber = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.5, roughness: 0.2 });
    const matAntinodeCobalt = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.4, roughness: 0.3 });
    const matString = new THREE.MeshBasicMaterial({ color: 0xf8fafc });

    const L = 1.30; // Longitud entre anclajes en X [-0.65, +0.65]
    const Y_CENTER = 0.55;
    const NUM_SEGMENTS = 120;

    // 1. Banco óptico inferior
    const bench = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.04, 0.44), matBase);
    bench.position.set(0, 0.02, 0);
    group.add(bench);

    const rail = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.015, 0.09), matDarkAlu);
    rail.position.set(0, 0.0475, 0);
    group.add(rail);

    // 2. Soporte izquierdo: Generador de Melde (excitador de vibración)
    const exciterBase = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.16), matDarkAlu);
    exciterBase.position.set(-L / 2, 0.10, 0);
    group.add(exciterBase);

    const exciterPole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, Y_CENTER - 0.10, 16), matSteel);
    exciterPole.position.set(-L / 2, (Y_CENTER + 0.10) / 2, 0);
    group.add(exciterPole);

    const exciterPin = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.05, 12), matBrass);
    exciterPin.rotation.x = Math.PI / 2;
    exciterPin.position.set(-L / 2, Y_CENTER, 0);
    group.add(exciterPin);

    // 3. Soporte derecho: Polea y Portapesas tensor
    const pulleyPost = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, Y_CENTER - 0.04, 16), matSteel);
    pulleyPost.position.set(L / 2, (Y_CENTER + 0.04) / 2, 0);
    group.add(pulleyPost);

    const pulleyFork = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.06), matDarkAlu);
    pulleyFork.position.set(L / 2, Y_CENTER, 0);
    group.add(pulleyFork);

    // Rueda de la polea
    const pulleyWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.018, 24), matBrass);
    pulleyWheel.rotation.x = Math.PI / 2;
    pulleyWheel.position.set(L / 2, Y_CENTER, 0);
    group.add(pulleyWheel);

    // Cuerda que cae verticalmente desde la polea con pesas
    const hangingCord = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.35, 8), matString);
    hangingCord.position.set(L / 2 + 0.038, Y_CENTER - 0.175, 0);
    group.add(hangingCord);

    // Portapesas cilíndrico ranurado (representa tensión T)
    const weightStack = new THREE.Group();
    weightStack.position.set(L / 2 + 0.038, Y_CENTER - 0.35, 0);
    group.add(weightStack);

    const weightRod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.16, 12), matSteel);
    const weightBase = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 20), matBrass);
    weightBase.position.y = -0.07;
    weightStack.add(weightRod, weightBase);

    // Discos de masa ranurados
    const diskGroup = new THREE.Group();
    weightStack.add(diskGroup);
    for (let d = 0; d < 4; d++) {
      const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.018, 20), matSteel);
      disk.position.y = -0.05 + d * 0.022;
      diskGroup.add(disk);
    }

    // 4. Cuerda vibrante dinámica
    const stringPositions = new Float32Array((NUM_SEGMENTS + 1) * 3);
    const stringGeo = new THREE.BufferGeometry();
    stringGeo.setAttribute('position', new THREE.BufferAttribute(stringPositions, 3));
    const stringLine = new THREE.Line(stringGeo, new THREE.LineBasicMaterial({ color: 0xf8fafc, linewidth: 2 }));
    group.add(stringLine);

    // Envolventes teóricas superior e inferior
    const envUpperPositions = new Float32Array((NUM_SEGMENTS + 1) * 3);
    const envLowerPositions = new Float32Array((NUM_SEGMENTS + 1) * 3);
    const envGeoUp = new THREE.BufferGeometry();
    const envGeoDown = new THREE.BufferGeometry();
    envGeoUp.setAttribute('position', new THREE.BufferAttribute(envUpperPositions, 3));
    envGeoDown.setAttribute('position', new THREE.BufferAttribute(envLowerPositions, 3));

    const envMat = new THREE.LineDashedMaterial({
      color: 0x3b82f6,
      dashSize: 0.02,
      gapSize: 0.015,
      transparent: true,
      opacity: 0.55
    });

    const envLineUp = new THREE.Line(envGeoUp, envMat);
    const envLineDown = new THREE.Line(envGeoDown, envMat);
    group.add(envLineUp, envLineDown);

    // Eje de equilibrio horizontal
    const eqLine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0015, 0.0015, L, 8),
      new THREE.MeshBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.4 })
    );
    eqLine.rotation.z = Math.PI / 2;
    eqLine.position.set(0, Y_CENTER, 0);
    group.add(eqLine);

    // 5. Marcadores de Nodos (esferas ámbar inmóviles con anillos)
    const MAX_NODES = 7;
    const nodeMeshes = [];
    const nodeGroup = new THREE.Group();
    group.add(nodeGroup);

    for (let k = 0; k < MAX_NODES; k++) {
      const nodeNode = new THREE.Group();
      const nodeSphere = new THREE.Mesh(new THREE.SphereGeometry(0.016, 20, 20), matNodeAmber);
      const nodeRing = new THREE.Mesh(
        new THREE.RingGeometry(0.022, 0.027, 24),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide })
      );
      nodeNode.add(nodeSphere, nodeRing);
      nodeGroup.add(nodeNode);
      nodeMeshes.push(nodeNode);
    }

    // 6. Marcadores interactivos de Antinodos (vientres oscilantes)
    const MAX_ANTINODES = 6;
    const antinodeHandles = [];
    const antinodeGroup = new THREE.Group();
    group.add(antinodeGroup);

    for (let j = 0; j < MAX_ANTINODES; j++) {
      const hMesh = new THREE.Mesh(new THREE.SphereGeometry(0.024, 20, 20), matAntinodeCobalt);
      hMesh.userData.isDraggable = true;
      hMesh.userData.antiIndex = j;
      antinodeGroup.add(hMesh);
      antinodeHandles.push(hMesh);
    }

    return {
      group,
      getInteractiveObjects() {
        return antinodeHandles.filter(h => h.visible);
      },
      onDrag(worldPoint, state, p) {
        // Arrastrar el vientre cambia la amplitud A
        const dy = Math.abs(worldPoint.y - Y_CENTER);
        let newAmp = Math.max(0.05, Math.min(0.25, dy));
        newAmp = Number(newAmp.toFixed(2));
        p.amp = newAmp;
        return { paramChanged: 'amp', value: newAmp };
      },
      update(state, p) {
        const n = state.activeN || Math.max(1, Math.min(6, Math.round(p.harmonic || 2)));
        const tension = Math.max(10, p.tension || 40);
        const resFactor = (0.30 + 0.70 * (state.resonance !== undefined ? state.resonance : 1.0));
        const amp = (p.amp || 0.14) * (state.boost || 1.0) * resFactor;
        const phase = state.phase || 0;

        // Escalar la pila de pesas según la tensión T
        const numDisksVisible = Math.max(1, Math.min(4, Math.round((tension / 100) * 4)));
        diskGroup.children.forEach((c, idx) => {
          c.visible = idx < numDisksVisible;
        });

        // Actualizar geometría de la cuerda
        const strPos = stringGeo.attributes.position;
        const upPos = envGeoUp.attributes.position;
        const downPos = envGeoDown.attributes.position;

        const cosVal = Math.cos(phase);

        for (let i = 0; i <= NUM_SEGMENTS; i++) {
          const frac = i / NUM_SEGMENTS;
          const x = -L / 2 + frac * L;
          const kx = (n * Math.PI * frac);
          const spatialShape = Math.sin(kx);

          const yInstant = Y_CENTER + amp * spatialShape * cosVal;
          const yUp = Y_CENTER + amp * Math.abs(spatialShape);
          const yDown = Y_CENTER - amp * Math.abs(spatialShape);

          strPos.setXYZ(i, x, yInstant, 0);
          upPos.setXYZ(i, x, yUp, 0);
          downPos.setXYZ(i, x, yDown, 0);
        }

        strPos.needsUpdate = true;
        upPos.needsUpdate = true;
        downPos.needsUpdate = true;
        envLineUp.computeLineDistances();
        envLineDown.computeLineDistances();

        // Actualizar Nodos (k = 1 a n - 1 interiores)
        nodeMeshes.forEach(nm => { nm.visible = false; });
        for (let k = 1; k < n; k++) {
          const fracNode = k / n;
          const xNode = -L / 2 + fracNode * L;
          const nm = nodeMeshes[k - 1];
          if (nm) {
            nm.visible = true;
            nm.position.set(xNode, Y_CENTER, 0);
          }
        }

        // Actualizar Antinodos (j = 0 a n - 1)
        antinodeHandles.forEach(ah => { ah.visible = false; });
        for (let j = 0; j < n; j++) {
          const fracAnti = (j + 0.5) / n;
          const xAnti = -L / 2 + fracAnti * L;
          const spatialAnti = Math.sin(n * Math.PI * fracAnti);
          const yAnti = Y_CENTER + amp * spatialAnti * cosVal;

          const ah = antinodeHandles[j];
          if (ah) {
            ah.visible = true;
            ah.position.set(xAnti, yAnti, 0);
          }
        }
      }
    };
  },

  getMetrics(state, params) {
    const L = 1.30; // m
    const T = Math.max(10, params.tension || 40);
    const muVal = params.mu || 2.0; // g/m
    const muKg = muVal * 1e-3; // kg/m
    const vWave = Math.sqrt(T / muKg);
    const fOsc = Math.max(5, params.freq || 60);

    const n = state.activeN || Math.max(1, Math.min(6, Math.round(params.harmonic || 2)));
    const fn = state.fn || (n / (2 * L)) * vWave;
    const lambda = (2 * L) / n;
    const numNodes = n - 1;
    const resPct = Math.round((state.resonance !== undefined ? state.resonance : 1.0) * 100);

    return [
      { label: 'Frecuencia Oscilador (f)', value: `${fOsc.toFixed(0)} Hz` },
      { label: 'Modo Armónico (n)', value: `${n} (${numNodes} nodo${numNodes !== 1 ? 's' : ''} int.)` },
      { label: 'Frecuencia Resonancia (fₙ)', value: `${fn.toFixed(1)} Hz (Δf: ${(fOsc - fn).toFixed(1)} Hz)` },
      { label: 'Sintonía / Resonancia', value: `${resPct}%` },
      { label: 'Longitud de Onda (λ)', value: `${lambda.toFixed(3)} m` },
      { label: 'Velocidad de Fase (v)', value: `${vWave.toFixed(1)} m/s` }
    ];
  }
};
