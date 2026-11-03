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
  formula: 'z(ξ,η) = A·cos(nπξ)·cos(mπη) + B·cos(mπξ)·cos(nπη) = 0   ;   fₙₘ ∝ (cₚ·h / L²)·(n² + m² ± ν·n·m)',
  description: 'Placa elástica de borde libre excitada por un transductor acústico (ecuación de Kirchhoff-Love con autofunciones de Rayleigh-Ritz). Modifica la frecuencia (Hz), el tamaño L, el material y arrastra con el cursor el punto de excitación (x₀, y₀) para ver la migración browniana de 4,500 partículas de arena hacia las curvas nodales z = 0.',
  hasImpulse: true,

  params: [
    { key: 'freq', label: 'Frecuencia de Excitación (f)', unit: 'Hz', min: 80, max: 2400, step: 1, default: 189 },
    { key: 'plateSize', label: 'Tamaño de la Placa (L)', unit: 'cm', min: 18, max: 45, step: 1, default: 28 },
    { key: 'material', label: 'Material (1:Acero, 2:Latón, 3:Alum, 4:Vidrio)', unit: '', min: 1, max: 4, step: 1, default: 2 },
    { key: 'driveX', label: 'Punto Excitación X (x₀)', unit: '', min: -0.85, max: 0.85, step: 0.05, default: 0.0 },
    { key: 'driveY', label: 'Punto Excitación Y (y₀)', unit: '', min: -0.85, max: 0.85, step: 0.05, default: 0.0 },
    { key: 'damping', label: 'Amortiguamiento / Q Inverso', unit: '', min: 0.02, max: 0.30, step: 0.01, default: 0.05 }
  ],

  presets: [
    { label: 'Cruz Diagonal (Modo 1, 1)', values: { freq: 95, plateSize: 28, material: 2, driveX: 0.0, driveY: 0.0, damping: 0.05 } },
    { label: 'Anillo / Cruz Chladni (Modo 0, 2)', values: { freq: 189, plateSize: 28, material: 2, driveX: 0.0, driveY: 0.0, damping: 0.05 } },
    { label: 'Estrella de Chladni (Modo 1, 2)⁺', values: { freq: 240, plateSize: 28, material: 2, driveX: 0.35, driveY: 0.0, damping: 0.04 } },
    { label: 'Roseta Acústica Compleja (Modo 2, 3)⁺', values: { freq: 625, plateSize: 28, material: 2, driveX: 0.25, driveY: 0.25, damping: 0.04 } }
  ],

  // Propiedades mecánicas y elásticas reales (Kirchhoff-Love, espesor h = 1.5 mm)
  MATERIALS_INFO: {
    1: { name: 'Acero Inoxidable 304', E: 193e9, rho: 8000, nu: 0.29, cp: 5132, D: 59.3, color: 0x334155, metalness: 0.75, roughness: 0.25 },
    2: { name: 'Latón Acústico C260', E: 110e9, rho: 8530, nu: 0.35, cp: 3833, D: 35.2, color: 0x423525, metalness: 0.55, roughness: 0.35 },
    3: { name: 'Aluminio 6061-T6', E: 68.9e9, rho: 2700, nu: 0.33, cp: 5351, D: 21.7, color: 0x3f4756, metalness: 0.65, roughness: 0.30 },
    4: { name: 'Vidrio Templado', E: 70.0e9, rho: 2500, nu: 0.22, cp: 5424, D: 20.7, color: 0x1e293b, metalness: 0.25, roughness: 0.15 }
  },

  NUM_PARTICLES: 4500,

  getBaseFrequency(L_cm, mat) {
    const L_m = Math.max(0.12, (L_cm || 28) / 100);
    const h = 0.0015;
    const f_disp = (Math.PI * h) / (4 * Math.sqrt(3) * L_m * L_m);
    return f_disp * mat.cp * 1.42;
  },

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
      dominantMode: { n: 0, m: 2, branch: '⁺', fnm: 189.0, H: 0.5 },
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
   * Cálculo analítico riguroso del conjunto de modos y autofunciones Ψₙₘ⁺ y Ψₙₘ⁻
   * con desdoblamiento de Rayleigh por Poisson ν y acoplamiento por función de Green
   */
  getActiveModes(params) {
    const f = params.freq !== undefined ? params.freq : 189;
    const L = params.plateSize !== undefined ? params.plateSize : 28;
    const matKey = Math.max(1, Math.min(4, Math.round(params.material || 2)));
    const mat = this.MATERIALS_INFO[matKey] || this.MATERIALS_INFO[2];
    const damp = Math.max(0.015, params.damping !== undefined ? params.damping : 0.05);

    const u0 = Math.max(-0.85, Math.min(0.85, params.driveX || 0.0));
    const v0 = Math.max(-0.85, Math.min(0.85, params.driveY || 0.0));

    // Coordenadas normalizadas de borde libre ξ₀, η₀ ∈ [0, 1]
    const xi0 = (u0 + 1.0) / 2.0;
    const eta0 = (v0 + 1.0) / 2.0;

    const baseFactor = this.getBaseFrequency(L, mat);
    const nu_split = 0.12 * mat.nu;

    const modes = [];
    let dominant = null;
    let maxLorentz = -1;

    // Iteración modal completa n ∈ [0..6], m ∈ [n..6], descartando (0,0) y (0,1)
    for (let n = 0; n <= 6; n++) {
      for (let m = n; m <= 6; m++) {
        if (n === 0 && m <= 1) continue; // Modos de cuerpo rígido sin deformación flexural

        if (n === m) {
          // Autofunción degenerada única Ψₙₙ(ξ, η) = cos(nπξ)·cos(nπη)
          const fnn = baseFactor * (2 * n * n);
          const gamma = Math.max(8, fnn * damp * 1.25);
          const df = f - fnn;
          const halfG = gamma * 0.5;
          const H = (halfG * halfG) / (df * df + halfG * halfG);

          const c = Math.cos(n * Math.PI * xi0) * Math.cos(n * Math.PI * eta0);

          if (H > maxLorentz) {
            maxLorentz = H;
            dominant = { n, m, branch: '', fnm: fnn, H };
          }

          if (H * Math.abs(c) > 0.015) {
            modes.push({ n, m, fnm: fnn, H, a: H * c, b: 0 });
          }
        } else {
          // Desdoblamiento de Rayleigh en modos simétricos (+) y antisimétricos (-)
          const fnm_plus = baseFactor * (n * n + m * m + nu_split * n * m);
          const fnm_minus = baseFactor * (n * n + m * m - nu_split * n * m);

          const gamma_p = Math.max(8, fnm_plus * damp * 1.25);
          const gamma_m = Math.max(8, fnm_minus * damp * 1.25);

          const df_p = f - fnm_plus;
          const df_m = f - fnm_minus;

          const hG_p = gamma_p * 0.5;
          const hG_m = gamma_m * 0.5;

          const H_p = (hG_p * hG_p) / (df_p * df_p + hG_p * hG_p);
          const H_m = (hG_m * hG_m) / (df_m * df_m + hG_m * hG_m);

          // Proyección de Green: Ψₙₘ⁺(ξ₀, η₀) y Ψₙₘ⁻(ξ₀, η₀)
          const c1 = Math.cos(n * Math.PI * xi0) * Math.cos(m * Math.PI * eta0);
          const c2 = Math.cos(m * Math.PI * xi0) * Math.cos(n * Math.PI * eta0);
          const c_plus = c1 + c2;
          const c_minus = c1 - c2;

          if (H_p > maxLorentz) {
            maxLorentz = H_p;
            dominant = { n, m, branch: '⁺', fnm: fnm_plus, H: H_p };
          }
          if (H_m > maxLorentz) {
            maxLorentz = H_m;
            dominant = { n, m, branch: '⁻', fnm: fnm_minus, H: H_m };
          }

          // Combinación modal sobre la base desacoplada {cos(nπξ)cos(mπη), cos(mπξ)cos(nπη)}
          const A = H_p * c_plus + H_m * c_minus;
          const B = H_p * c_plus - H_m * c_minus;

          if (Math.abs(A) > 0.015 || Math.abs(B) > 0.015) {
            modes.push({
              n,
              m,
              fnm: H_p >= H_m ? fnm_plus : fnm_minus,
              H: Math.max(H_p, H_m),
              a: A,
              b: B
            });
          }
        }
      }
    }

    return { modes, dominant: dominant || { n: 0, m: 2, branch: '⁺', fnm: 189.0, H: 0.1 } };
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

    // Umbral físico de aceleración gravitatoria (Criterio de fluidización de Faraday/Chladni: a = ω²·W ≥ g)
    // En la física real, si la frecuencia no coincide con un modo propio (fuera de resonancia), la amplitud
    // cae drásticamente y la aceleración es menor que la gravedad (a < g): los granos NO despegan ni migran a ningún nodo.
    const maxLorentz = dominant ? dominant.H : 0.0;
    const resonanceFactor = Math.max(0, (maxLorentz - 0.26) / 0.74);
    const isAboveFaradayThreshold = resonanceFactor > 0.03;

    // Amplitud física modulada por la curva de resonancia lorentziana real (sin forzado artificial)
    const ampMult = Math.pow(resonanceFactor, 1.25) * 1.55;
    const alpha = isAboveFaradayThreshold ? 0.0135 * resonanceFactor : 0.0; // Migración a nodos nula si a < g
    const beta = isAboveFaradayThreshold ? 0.0170 * resonanceFactor : 0.0006; // Pequeña vibración térmica o nula

    if (!isAboveFaradayThreshold) {
      // Fuera de resonancia: la arena se mantiene en su estado previo disperso/desordenado
      for (let i = 0; i < N; i++) {
        hop[i] *= 0.88;
      }
      return;
    }

    // Simulación de transporte de partículas sobre la placa libre [0, 1] × [0, 1]
    for (let i = 0; i < N; i++) {
      let u = px[i];
      let v = py[i];

      // Mapeo riguroso a coordenadas de placa libre ξ, η ∈ [0, 1]
      const xi = (u + 1.0) / 2.0;
      const eta = (v + 1.0) / 2.0;

      let W = 0.0;
      let dW_dxi = 0.0;
      let dW_deta = 0.0;

      for (let k = 0; k < numModes; k++) {
        const mDef = modes[k];
        const n = mDef.n;
        const m = mDef.m;
        const a = mDef.a * ampMult;
        const b = mDef.b * ampMult;

        const cn_xi = Math.cos(n * Math.PI * xi);
        const sn_xi = Math.sin(n * Math.PI * xi);
        const cm_xi = Math.cos(m * Math.PI * xi);
        const sm_xi = Math.sin(m * Math.PI * xi);

        const cn_eta = Math.cos(n * Math.PI * eta);
        const sn_eta = Math.sin(n * Math.PI * eta);
        const cm_eta = Math.cos(m * Math.PI * eta);
        const sm_eta = Math.sin(m * Math.PI * eta);

        // W(ξ, η) = A·cos(nπξ)cos(mπη) + B·cos(mπξ)cos(nπη)
        W += a * cn_xi * cm_eta + b * cm_xi * cn_eta;

        // Derivadas espaciales exactas dW/dξ y dW/dη
        dW_dxi += Math.PI * (-n * a * sn_xi * cm_eta - m * b * sm_xi * cn_eta);
        dW_deta += Math.PI * (-m * a * cn_xi * sm_eta - n * b * cm_xi * sn_eta);
      }

      // Derivadas respecto a u, v (dξ/du = 1/2, dη/dv = 1/2)
      const dW_du = dW_dxi * 0.5;
      const dW_dv = dW_deta * 0.5;

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
    const f = params.freq !== undefined ? params.freq : 189;
    const L = params.plateSize !== undefined ? params.plateSize : 28;
    const matKey = Math.max(1, Math.min(4, Math.round(params.material || 2)));
    const mat = this.MATERIALS_INFO[matKey] || this.MATERIALS_INFO[2];
    const damp = Math.max(0.015, params.damping !== undefined ? params.damping : 0.05);

    const dominant = state.dominantMode || { n: 0, m: 2, branch: '⁺', fnm: 189.0, H: 0.1 };
    const df = Math.abs(f - dominant.fnm);
    const Q = 1.0 / damp;
    const couplingPct = Math.round(dominant.H * 100);

    const u0 = params.driveX !== undefined ? params.driveX : 0.0;
    const v0 = params.driveY !== undefined ? params.driveY : 0.0;

    let modeDesc;
    let estadoAcustico;
    if (dominant.H >= 0.40) {
      modeDesc = `(${dominant.n}, ${dominant.m})${dominant.branch || ''} [Resonancia Nodal Nítida]`;
      estadoAcustico = `Figura Nodal Activa (a > g, ${couplingPct}%)`;
    } else if (dominant.H >= 0.26) {
      modeDesc = `(${dominant.n}, ${dominant.m})${dominant.branch || ''} [Aproximación]`;
      estadoAcustico = `Patrón Débil / En Formación (${couplingPct}%)`;
    } else {
      modeDesc = 'Fuera de Resonancia';
      estadoAcustico = `Sub-umbral Faraday (a < g, sin figura)`;
    }

    return [
      { label: 'Estado Acústico', value: estadoAcustico },
      { label: 'Modo Próximo', value: modeDesc },
      { label: 'Frecuencia Propia (fₙₘ)', value: `${dominant.fnm.toFixed(1)} Hz (Δf: ${df > 0 ? '+' : ''}${(f - dominant.fnm).toFixed(1)} Hz)` },
      { label: 'Velocidad Onda (cₚ)', value: `${mat.cp.toFixed(0)} m/s` },
      { label: 'Rigidez Flexural (D)', value: `${mat.D.toFixed(1)} N·m` },
      { label: 'Respuesta Lorentz (Q)', value: `Q ≈ ${Q.toFixed(0)} (${couplingPct}%)` },
      { label: 'Material Placa', value: `${mat.name} (ν = ${mat.nu})` },
      { label: 'Punto Excitación (x₀, y₀)', value: `(${u0.toFixed(2)}, ${v0.toFixed(2)})` }
    ];
  }
};
