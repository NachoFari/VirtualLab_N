window.VLabExperiments = window.VLabExperiments || {};

/**
 * Experimento OND-02: Placa de Chladni y Patrones Nodales 2D
 * Simulación de ondas estacionarias en placas elásticas bidimensionales (Ecuación de Kirchhoff-Love / Método de Chladni-Ritz)
 * y dinámica browniana/inercial de 4,500 granos de arena hacia las líneas nodales z(x,y)=0.
 */
window.VLabExperiments['OND-02'] = {
  id: 'OND-02',
  title: 'Placa de Chladni y Patrones Nodales 2D',
  block: 'C',
  category: 'Acústica y Vibraciones',
  formula: 'z(x,y) = a·cos(nπx/L)·cos(mπy/L) + b·cos(mπx/L)·cos(nπy/L) = 0  ;  fₙₘ ∝ (c_mat / L²)·(n² + m²)',
  description: 'Placa elástica excitada por un transductor acústico. Modifica la frecuencia (Hz), el tamaño de la placa (L), el material (Acero, Latón, Aluminio, Vidrio) y arrastra directamente con el mouse el punto de excitación (x₀, y₀) para ver cómo miles de granos de arena migran hacia las líneas nodales de Chladni.',
  hasImpulse: true,

  params: [
    { key: 'freq', label: 'Frecuencia de Excitación (f)', unit: 'Hz', min: 80, max: 2400, step: 5, default: 440 },
    { key: 'plateSize', label: 'Tamaño de la Placa (L)', unit: 'cm', min: 18, max: 45, step: 1, default: 28 },
    { key: 'material', label: 'Material (1:Acero, 2:Latón, 3:Alum, 4:Vidrio)', unit: '', min: 1, max: 4, step: 1, default: 2 },
    { key: 'driveX', label: 'Punto Excitación X (x₀)', unit: '', min: -0.85, max: 0.85, step: 0.05, default: 0.0 },
    { key: 'driveY', label: 'Punto Excitación Y (y₀)', unit: '', min: -0.85, max: 0.85, step: 0.05, default: 0.0 },
    { key: 'damping', label: 'Amortiguamiento / Q Inverso', unit: '', min: 0.02, max: 0.30, step: 0.01, default: 0.06 }
  ],

  presets: [
    { label: 'Cruz Diagonal (Baja Frecuencia)', values: { freq: 185, plateSize: 28, material: 2, driveX: 0.0, driveY: 0.0, damping: 0.05 } },
    { label: 'Estrella de Chladni (Modo 3,2)', values: { freq: 520, plateSize: 28, material: 2, driveX: 0.25, driveY: 0.0, damping: 0.05 } },
    { label: 'Roseta Acústica en Acero (Alta f)', values: { freq: 1280, plateSize: 26, material: 1, driveX: 0.35, driveY: 0.20, damping: 0.04 } },
    { label: 'Malla Cuántica Compleja (Modo 5,4)', values: { freq: 1950, plateSize: 30, material: 3, driveX: -0.40, driveY: 0.30, damping: 0.05 } }
  ],

  // Propiedades acústicas y visuales de los materiales
  MATERIALS_INFO: {
    1: { name: 'Acero Inoxidable', c_mat: 1.35, color: 0x334155, metalness: 0.75, roughness: 0.25, waveSpeed: 5100 },
    2: { name: 'Latón Acústico', c_mat: 0.92, color: 0x423525, metalness: 0.55, roughness: 0.35, waveSpeed: 3450 },
    3: { name: 'Aluminio Estructural', c_mat: 1.25, color: 0x3f4756, metalness: 0.65, roughness: 0.30, waveSpeed: 4900 },
    4: { name: 'Vidrio Templado', c_mat: 1.10, color: 0x1e293b, metalness: 0.25, roughness: 0.15, waveSpeed: 4200 }
  },

  NUM_PARTICLES: 4500,

  initState(params) {
    const N = this.NUM_PARTICLES;
    const px = new Float32Array(N);
    const py = new Float32Array(N);
    const hop = new Float32Array(N);

    // Distribución pseudo-aleatoria uniforme sobre la superficie cuadrada
    for (let i = 0; i < N; i++) {
      px[i] = (Math.random() * 2 - 1) * 0.88;
      py[i] = (Math.random() * 2 - 1) * 0.88;
      hop[i] = 0.0;
    }

    return {
      t: 0,
      px,
      py,
      hop,
      activeModes: [],
      dominantMode: { n: 1, m: 2, fnm: 193.2, H: 0.5 },
      maxAmp: 0.0,
      isDraggingObject: false
    };
  },

  // Dispersa instantáneamente la arena de forma aleatoria (botón Impulso)
  onPush(state, params) {
    const N = this.NUM_PARTICLES;
    for (let i = 0; i < N; i++) {
      state.px[i] = (Math.random() * 2 - 1) * 0.88;
      state.py[i] = (Math.random() * 2 - 1) * 0.88;
      state.hop[i] = 0.0;
    }
  },

  /**
   * Cálculo analítico del conjunto de modos y respuesta Lorentziana
   */
  getActiveModes(params) {
    const f = params.freq !== undefined ? params.freq : 440;
    const L = params.plateSize !== undefined ? params.plateSize : 28;
    const matKey = Math.max(1, Math.min(4, Math.round(params.material || 2)));
    const mat = this.MATERIALS_INFO[matKey] || this.MATERIALS_INFO[2];
    const c_mat = mat.c_mat;
    const damp = Math.max(0.015, params.damping !== undefined ? params.damping : 0.06);

    const u0 = Math.max(-0.85, Math.min(0.85, params.driveX || 0.0));
    const v0 = Math.max(-0.85, Math.min(0.85, params.driveY || 0.0));

    const scaleL = Math.pow(28 / L, 2);
    const baseFactor = 42 * c_mat * scaleL;

    const modes = [];
    let dominant = null;
    let maxLorentz = -1;

    for (let n = 1; n <= 7; n++) {
      for (let m = n; m <= 7; m++) {
        const fnm = baseFactor * (n * n + m * m);
        const gamma = Math.max(10, fnm * damp * 1.35);
        const df = f - fnm;
        const halfG = gamma * 0.5;
        const H = (halfG * halfG) / (df * df + halfG * halfG);

        if (H > maxLorentz) {
          maxLorentz = H;
          dominant = { n, m, fnm, H };
        }

        // Filtro de corte: sólo modos con respuesta Lorentziana significativa
        if (H > 0.02) {
          let a, b;
          if (n === m) {
            a = H * Math.cos((n * Math.PI * u0) / 2) * Math.cos((n * Math.PI * v0) / 2);
            b = 0;
          } else {
            // Acoplamiento por punto de excitación (Green function modal projection)
            const c1 = Math.cos((n * Math.PI * u0) / 2) * Math.cos((m * Math.PI * v0) / 2);
            const c2 = Math.cos((m * Math.PI * u0) / 2) * Math.cos((n * Math.PI * v0) / 2);
            a = H * c1;
            b = -H * c2;
          }
          modes.push({ n, m, fnm, H, a, b });
        }
      }
    }

    return { modes, dominant: dominant || { n: 1, m: 2, fnm: 193.2, H: 0.1 } };
  },

  step(state, params, dt) {
    state.t += dt;

    const { modes, dominant } = this.getActiveModes(params);
    state.activeModes = modes;
    state.dominantMode = dominant;

    const N = this.NUM_PARTICLES;
    const px = state.px;
    const py = state.py;
    const hop = state.hop;

    const numModes = modes.length;
    if (numModes === 0) {
      // Fuera de resonancia: vibración casi imperceptible
      for (let i = 0; i < N; i++) {
        hop[i] *= 0.92;
      }
      return;
    }

    // Normalización de amplitud total
    let normScale = 0;
    for (let k = 0; k < numModes; k++) {
      normScale += Math.abs(modes[k].a) + Math.abs(modes[k].b);
    }
    const ampMult = normScale > 0.001 ? 1.4 / normScale : 1.0;

    const alpha = 0.0125; // Tasa de migración al gradiente descendente de W²
    const beta = 0.0160;  // Agitación estocástica en zonas de vientre/antinodo

    // Simulación de transporte de partículas
    for (let i = 0; i < N; i++) {
      let u = px[i];
      let v = py[i];

      let W = 0.0;
      let dW_du = 0.0;
      let dW_dv = 0.0;

      for (let k = 0; k < numModes; k++) {
        const mDef = modes[k];
        const n = mDef.n;
        const m = mDef.m;
        const a = mDef.a * ampMult;
        const b = mDef.b * ampMult;

        const kn = (n * Math.PI) / 2;
        const km = (m * Math.PI) / 2;

        const c_nu = Math.cos(kn * u);
        const s_nu = Math.sin(kn * u);
        const c_mu = Math.cos(km * u);
        const s_mu = Math.sin(km * u);

        const c_nv = Math.cos(kn * v);
        const s_nv = Math.sin(kn * v);
        const c_mv = Math.cos(km * v);
        const s_mv = Math.sin(km * v);

        // z = a·cos(mπu/2)·cos(nπv/2) + b·cos(nπu/2)·cos(mπv/2)
        const t1 = a * c_mu * c_nv;
        const t2 = b * c_nu * c_mv;
        W += t1 + t2;

        // Derivadas espaciales analíticas
        dW_du += -a * km * s_mu * c_nv - b * kn * s_nu * c_mv;
        dW_dv += -a * kn * c_mu * s_nv - b * km * c_nu * s_mv;
      }

      const absW = Math.abs(W);
      // Gradiente de la energía cuadrática de vibración: ∇(W²) = 2·W·∇W
      const gradU = 2.0 * W * dW_du;
      const gradV = 2.0 * W * dW_dv;

      // Desplazamiento browniano + arrastre hacia nodos W = 0
      const kickX = (Math.random() - 0.5) * beta * absW;
      const kickY = (Math.random() - 0.5) * beta * absW;

      u -= alpha * gradU + kickX;
      v -= alpha * gradV + kickY;

      // Fronteras físicas de la placa
      if (u > 0.88) u = 0.88;
      else if (u < -0.88) u = -0.88;

      if (v > 0.88) v = 0.88;
      else if (v < -0.88) v = -0.88;

      px[i] = u;
      py[i] = v;

      // Salto vertical en antinodos (en nodos absW ≈ 0, reposo plano)
      hop[i] = 0.015 * absW * Math.abs(Math.sin(38 * state.t + i * 0.7));
    }
  },

  createScene(THREE, components, params) {
    const group = new THREE.Group();
    const plateY = 0.55;

    // 1. Base robusta de hierro fundido / granito de laboratorio
    const matBase = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.55, roughness: 0.45 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.04, 1.18), matBase);
    base.position.set(0, 0.02, 0);
    group.add(base);

    // Patas aislantes antivibración
    const matFeet = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.8, roughness: 0.2 });
    [[-0.52, -0.52], [0.52, -0.52], [-0.52, 0.52], [0.52, 0.52]].forEach(([fx, fz]) => {
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.025, 20), matFeet);
      foot.position.set(fx, 0.012, fz);
      group.add(foot);
    });

    // 2. Transductor Electrodinámico Central (Wave Driver acústico)
    const matDriverBody = new THREE.MeshStandardMaterial({ color: 0x20242c, metalness: 0.7, roughness: 0.35 });
    const driverHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.44, 32), matDriverBody);
    driverHousing.position.set(0, 0.24, 0);
    group.add(driverHousing);

    // Collarín cromado superior
    const matChrome = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.9, roughness: 0.15 });
    const chromeCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.122, 0.122, 0.02, 32), matChrome);
    chromeCollar.position.set(0, 0.46, 0);
    group.add(chromeCollar);

    // Vástago central de fijación / excitación
    const centerStinger = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.11, 20), matChrome);
    centerStinger.position.set(0, 0.505, 0);
    group.add(centerStinger);

    // 3. Placa Resonante de Chladni (Cuadrada, centrada en Y = plateY)
    const plateGroup = new THREE.Group();
    plateGroup.position.set(0, plateY, 0);
    group.add(plateGroup);

    const plateGeo = new THREE.BoxGeometry(0.80, 0.012, 0.80);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x423525,
      metalness: 0.55,
      roughness: 0.35
    });
    const plateMesh = new THREE.Mesh(plateGeo, plateMat);
    plateMesh.position.set(0, 0, 0);
    plateGroup.add(plateMesh);

    // Borde biselado sutil para definir los márgenes de la placa
    const edgeGeo = new THREE.EdgesGeometry(plateGeo);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.55 });
    const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
    plateGroup.add(edgeLines);

    // Tuerca moleteada de fijación central
    const centerNut = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.022, 20), matChrome);
    centerNut.position.set(0, 0.013, 0);
    plateGroup.add(centerNut);

    // 4. Capa de 4,500 Partículas de Arena de Cuarzo (THREE.Points)
    const N = this.NUM_PARTICLES;
    const sandPositions = new Float32Array(N * 3);
    const sandGeo = new THREE.BufferGeometry();
    sandGeo.setAttribute('position', new THREE.BufferAttribute(sandPositions, 3));

    const sandMat = new THREE.PointsMaterial({
      color: 0xf8fafc,
      size: 0.012,
      transparent: true,
      opacity: 0.95
    });
    const sandPoints = new THREE.Points(sandGeo, sandMat);
    group.add(sandPoints);

    // 5. Marcador 3D del Transductor / Punto de Excitación (driverCone interactivo)
    const driverMarkerGroup = new THREE.Group();
    driverMarkerGroup.position.set(0, plateY + 0.006, 0);
    group.add(driverMarkerGroup);

    // Halo circular en el plano de la placa
    const ringGeo = new THREE.RingGeometry(0.022, 0.036, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    const driverRing = new THREE.Mesh(ringGeo, ringMat);
    driverRing.rotation.x = -Math.PI / 2;
    driverRing.position.set(0, 0.003, 0);
    driverMarkerGroup.add(driverRing);

    // Contacto táctil / cono de acoplamiento del transductor
    const contactMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.35,
      metalness: 0.5,
      roughness: 0.2
    });
    const driverCone = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.052, 20), contactMat);
    driverCone.position.set(0, 0.028, 0);
    driverCone.userData.isDraggable = true;
    driverMarkerGroup.add(driverCone);

    const driverCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.015, 20), matChrome);
    driverCyl.position.set(0, 0.006, 0);
    driverCyl.userData.isDraggable = true;
    driverMarkerGroup.add(driverCyl);

    // Brazo articulado inferior que vincula el transductor base con el punto de excitación
    const linkGeo = new THREE.CylinderGeometry(0.008, 0.008, 1.0, 12);
    const linkArm = new THREE.Mesh(linkGeo, matChrome);
    linkArm.position.set(0, 0.49, 0);
    group.add(linkArm);

    // Plano de interacción horizontal para drag en el visor
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -plateY);

    return {
      group,
      dragPlane,

      getInteractiveObjects() {
        return [driverCone, driverCyl, driverRing];
      },

      onDrag(worldPoint, state, p) {
        const L = p.plateSize !== undefined ? p.plateSize : 28;
        const visualHalf = (0.80 * (L / 28)) * 0.5;

        // Soporte bidireccional: intersección en plano XZ horizontal o XY vertical
        const isXZ = Math.abs(worldPoint.y - plateY) < 0.25;
        let u, v;

        if (isXZ) {
          u = worldPoint.x / visualHalf;
          v = worldPoint.z / visualHalf;
        } else {
          u = worldPoint.x / visualHalf;
          v = (worldPoint.y - plateY) / visualHalf;
        }

        u = Math.max(-0.85, Math.min(0.85, Math.round(u / 0.05) * 0.05));
        v = Math.max(-0.85, Math.min(0.85, Math.round(v / 0.05) * 0.05));

        p.driveX = Number(u.toFixed(2));
        p.driveY = Number(v.toFixed(2));

        return {
          paramChanged: 'driveX',
          value: p.driveX,
          paramChanges: [
            { key: 'driveX', value: p.driveX },
            { key: 'driveY', value: p.driveY }
          ]
        };
      },

      update(state, p) {
        const L = p.plateSize !== undefined ? p.plateSize : 28;
        const scaleFactor = L / 28;
        const visualWidth = 0.80 * scaleFactor;
        const visualHalf = visualWidth * 0.5;

        // Escala física de la placa según L
        plateGroup.scale.set(scaleFactor, 1.0, scaleFactor);

        // Actualizar material de la placa según el selector
        const matKey = Math.max(1, Math.min(4, Math.round(p.material || 2)));
        const matInfo = window.VLabExperiments['OND-02'].MATERIALS_INFO[matKey] || window.VLabExperiments['OND-02'].MATERIALS_INFO[2];
        plateMat.color.setHex(matInfo.color);
        plateMat.metalness = matInfo.metalness;
        plateMat.roughness = matInfo.roughness;

        // Posicionar marcador interactivo del transductor (x₀, y₀)
        const u0 = p.driveX !== undefined ? p.driveX : 0.0;
        const v0 = p.driveY !== undefined ? p.driveY : 0.0;
        const markerX = u0 * visualHalf;
        const markerZ = v0 * visualHalf;
        driverMarkerGroup.position.set(markerX, plateY + 0.006, markerZ);

        // Vástago de conexión inferior hacia el transductor
        const p1 = new THREE.Vector3(0, 0.44, 0);
        const p2 = new THREE.Vector3(markerX, plateY - 0.006, markerZ);
        const dist = p1.distanceTo(p2);
        linkArm.scale.set(1, dist, 1);
        linkArm.position.copy(p1).add(p2).multiplyScalar(0.5);
        linkArm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());

        // Actualizar posiciones de las 4,500 partículas de arena en el Buffer
        const px = state.px;
        const py = state.py;
        const hop = state.hop;
        const posAttr = sandGeo.attributes.position;
        const arr = posAttr.array;

        for (let i = 0; i < N; i++) {
          const idx = i * 3;
          arr[idx] = px[i] * visualHalf;
          arr[idx + 1] = plateY + 0.007 + hop[i];
          arr[idx + 2] = py[i] * visualHalf;
        }
        posAttr.needsUpdate = true;
      }
    };
  },

  getMetrics(state, params) {
    const f = params.freq !== undefined ? params.freq : 440;
    const L = params.plateSize !== undefined ? params.plateSize : 28;
    const matKey = Math.max(1, Math.min(4, Math.round(params.material || 2)));
    const mat = this.MATERIALS_INFO[matKey] || this.MATERIALS_INFO[2];
    const damp = Math.max(0.015, params.damping !== undefined ? params.damping : 0.06);

    const dominant = state.dominantMode || { n: 1, m: 2, fnm: 193.2, H: 0.1 };
    const df = Math.abs(f - dominant.fnm);
    const Q = 1.0 / damp;
    const couplingPct = Math.round(dominant.H * 100);

    const u0 = params.driveX !== undefined ? params.driveX : 0.0;
    const v0 = params.driveY !== undefined ? params.driveY : 0.0;

    let modeDesc;
    if (dominant.H > 0.35) {
      modeDesc = `(${dominant.n}, ${dominant.m}) [Resonancia]`;
    } else if (dominant.H > 0.10) {
      modeDesc = `(${dominant.n}, ${dominant.m}) [Parcial]`;
    } else {
      modeDesc = 'Fuera de Banda Resonante';
    }

    return [
      { label: 'Modo Predominante', value: modeDesc },
      { label: 'Frecuencia Propia (fₙₘ)', value: `${dominant.fnm.toFixed(1)} Hz (Δf: ${df > 0 ? '+' : ''}${(f - dominant.fnm).toFixed(1)} Hz)` },
      { label: 'Acoplamiento / Q', value: `Q ≈ ${Q.toFixed(0)} (${couplingPct}%)` },
      { label: 'Material de la Placa', value: `${mat.name} (${mat.waveSpeed} m/s)` },
      { label: 'Punto Excitación (x₀, y₀)', value: `(${u0.toFixed(2)}, ${v0.toFixed(2)})` }
    ];
  }
};
