/**
 * VirtualLab_N - Experimento EM-01
 * Fuerza de Lorentz: Carga en Campo Magnético Uniforme
 * Diseño académico minimalista - Slate / Zinc / Cobalt / Emerald / Amber
 */

window.VLabExperiments = window.VLabExperiments || {};
window.VLabExperiments['EM-01'] = {
  id: 'EM-01',
  title: 'Fuerza de Lorentz: Carga en Campo Magnético Uniforme',
  block: 'C',
  category: 'Electromagnetismo',
  formula: 'F = q·(v × B)   ;   R = (m·v) / (|q|·B)',
  description: 'Cámara de vacío de Helmholtz con bobinas circulares coaxiales y campo magnético homogéneo vertical B. Una partícula cargada describe una órbita circular o helicoidal tridimensional, visualizando su estela de ciclotrón, los vectores velocidad v, inducción B y la fuerza magnética centrípeta FB. Pulsa Impulso para reiniciar la inyección.',
  hasImpulse: true,
  params: [
    { key: 'B', label: 'Campo Magnético (B)', unit: 'T', min: 0.5, max: 5.0, step: 0.1, default: 2.0 },
    { key: 'v0', label: 'Velocidad de Inyección (v₀)', unit: 'Mm/s', min: 1.0, max: 10.0, step: 0.5, default: 4.0 },
    { key: 'qSign', label: 'Signo de Carga (q)', unit: 'e', min: -1, max: 1, step: 2, default: 1 },
    { key: 'pitch', label: 'Ángulo Helicoidal (Pitch)', unit: '°', min: 0, max: 45, step: 1, default: 10 }
  ],
  presets: [
    { label: 'Protón en Órbita Circular (q=+1, Pitch=0°)', values: { B: 2.0, v0: 4.0, qSign: 1, pitch: 0 } },
    { label: 'Electrón Sentido Inverso (q=-1, Pitch=0°)', values: { B: 2.0, v0: 4.0, qSign: -1, pitch: 0 } },
    { label: 'Ciclotrón Helicoidal (q=+1, Pitch=15°)', values: { B: 2.5, v0: 4.0, qSign: 1, pitch: 15 } },
    { label: 'Campo Intenso / Radio Compacto', values: { B: 4.5, v0: 3.5, qSign: 1, pitch: 8 } },
    { label: 'Haz Alta Velocidad (v₀=8.5 Mm/s)', values: { B: 1.8, v0: 8.5, qSign: 1, pitch: 12 } }
  ],

  initState(params) {
    return {
      t: 0,
      phi: 0,
      yDrift: 0,
      trailCount: 0,
      isDraggingObject: false
    };
  },

  step(state, params, dt) {
    if (state.isDraggingObject) return;
    state.t += dt;

    const B = Math.max(0.2, params.B || 2.0);
    const v0 = Math.max(0.5, params.v0 || 4.0);
    const qSign = params.qSign < 0 ? -1 : 1;
    const pitchRad = ((params.pitch || 0) * Math.PI) / 180;

    // Frecuencia angular visual de ciclotrón
    const omegaVis = 2.8 * (B / 2.0) * qSign;
    state.phi += omegaVis * dt;

    // Deriva vertical helicoidal
    const vyVis = 0.10 * Math.sin(pitchRad) * (v0 / 4.0);
    state.yDrift += vyVis * dt;

    // Reciclar suavemente en la cámara de vacío
    if (state.yDrift > 0.19) state.yDrift = -0.19;
    if (state.yDrift < -0.19) state.yDrift = 0.19;
  },

  onPush(state) {
    state.phi = 0;
    state.yDrift = 0;
    state.trailCount = 0;
  },

  createScene(THREE, components, params) {
    const group = new THREE.Group();
    const Y_CENTER = 0.56;
    const R_COIL = 0.38;
    const COIL_SPACING = 0.38; // Condición ideal de Helmholtz d = R

    // Materiales de instrumentación
    const matBase = new THREE.MeshStandardMaterial({ color: 0x12151d, metalness: 0.6, roughness: 0.4 });
    const matSteel = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.22 });
    const matDarkAlu = new THREE.MeshStandardMaterial({ color: 0x1e2433, metalness: 0.7, roughness: 0.3 });
    const matCopper = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.75, roughness: 0.28 });
    const matBrass = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.65, roughness: 0.25 });
    const matCobalt = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.5, roughness: 0.2 });
    const matEmerald = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const matAmber = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    // 1. Base sobria de laboratorio
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.04, 0.75), matBase);
    base.position.set(0, 0.02, 0);
    group.add(base);

    // 2. Columnas de soporte de las bobinas de Helmholtz
    const colAngles = [-Math.PI * 0.75, -Math.PI * 0.25, Math.PI * 0.25, Math.PI * 0.75];
    colAngles.forEach(ang => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.62, 16), matSteel);
      col.position.set(Math.cos(ang) * (R_COIL + 0.04), Y_CENTER, Math.sin(ang) * (R_COIL + 0.04));
      group.add(col);
    });

    // 3. Dos Bobinas de Helmholtz (Inferior y Superior)
    const makeCoil = (yPos) => {
      const coilGroup = new THREE.Group();
      coilGroup.position.set(0, yPos, 0);

      // Núcleo bobinado de cobre
      const winding = new THREE.Mesh(new THREE.TorusGeometry(R_COIL, 0.028, 16, 48), matCopper);
      winding.rotation.x = Math.PI / 2;
      coilGroup.add(winding);

      // Bridas de fijación de aluminio oscuro
      const flangeIn = new THREE.Mesh(new THREE.TorusGeometry(R_COIL - 0.024, 0.008, 12, 48), matDarkAlu);
      const flangeOut = new THREE.Mesh(new THREE.TorusGeometry(R_COIL + 0.024, 0.008, 12, 48), matDarkAlu);
      flangeIn.rotation.x = Math.PI / 2;
      flangeOut.rotation.x = Math.PI / 2;
      coilGroup.add(flangeIn, flangeOut);

      group.add(coilGroup);
      return coilGroup;
    };

    const lowerCoil = makeCoil(Y_CENTER - COIL_SPACING / 2);
    const upperCoil = makeCoil(Y_CENTER + COIL_SPACING / 2);

    // 4. Cámara de Vacío Cilíndrica de Vidrio Borosilicato
    // Importante: depthWrite: false para que la órbita y vectores en su interior sean 100% nítidos
    const chamberGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.50, 48, 1, true);
    const chamberMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.12,
      roughness: 0.1,
      metalness: 0.1,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const chamber = new THREE.Mesh(chamberGeo, chamberMat);
    chamber.position.set(0, Y_CENTER, 0);
    chamber.renderOrder = 1;
    group.add(chamber);

    // Tapas / bridas selladas de la cámara
    const capBottom = new THREE.Mesh(new THREE.CylinderGeometry(0.335, 0.335, 0.02, 36), matDarkAlu);
    capBottom.position.set(0, Y_CENTER - 0.25, 0);
    const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.335, 0.335, 0.02, 36), matDarkAlu);
    capTop.position.set(0, Y_CENTER + 0.25, 0);
    group.add(capBottom, capTop);

    // Inyector lateral de partículas (cañón de electrones / protones)
    const injector = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.12, 16), matBrass);
    injector.rotation.z = Math.PI / 2;
    injector.position.set(-0.33, Y_CENTER, 0);
    injector.userData.isDraggable = true;
    group.add(injector);

    // 5. Líneas de Campo Magnético B (Verticales, esmeralda)
    const bFieldGroup = new THREE.Group();
    group.add(bFieldGroup);

    const bPositions = [
      [0, 0],
      [0.15, 0.12],
      [-0.15, 0.12],
      [0.15, -0.12],
      [-0.15, -0.12]
    ];

    bPositions.forEach(pos => {
      const bLine = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0018, 0.44, 8), matEmerald);
      bLine.position.set(pos[0], Y_CENTER, pos[1]);

      const bCone = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.024, 10), matEmerald);
      bCone.position.set(pos[0], Y_CENTER + 0.20, pos[1]);
      bFieldGroup.add(bLine, bCone);
    });

    // 6. Estela 3D de la trayectoria (Trail)
    const TRAIL_LEN = 160;
    const trailPositions = new Float32Array(TRAIL_LEN * 3);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    const trailMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
      linewidth: 2
    });
    const trailLine = new THREE.Line(trailGeo, trailMat);
    trailLine.renderOrder = 2;
    group.add(trailLine);

    // 7. Partícula Cargada
    const particleMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.6, roughness: 0.2 });
    const particle = new THREE.Mesh(new THREE.SphereGeometry(0.020, 24, 24), particleMat);
    particle.renderOrder = 3;
    group.add(particle);

    // 8. Flechas de Vectores: v (azul cobalto) y FB (ámbar centrípeta)
    const makeVectorArrow = (hexColor) => {
      const vGroup = new THREE.Group();
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.08, 8), new THREE.MeshBasicMaterial({ color: hexColor }));
      shaft.position.y = 0.04;
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.010, 0.028, 10), new THREE.MeshBasicMaterial({ color: hexColor }));
      head.position.y = 0.08;
      vGroup.add(shaft, head);
      vGroup.renderOrder = 4;
      group.add(vGroup);
      return { vGroup, shaft, head };
    };

    const arrowVel = makeVectorArrow(0x3b82f6);   // Velocidad v
    const arrowForce = makeVectorArrow(0xf59e0b); // Fuerza de Lorentz FB

    // Historial para la estela
    const history = [];

    return {
      group,
      getInteractiveObjects() {
        return [injector, particle];
      },
      onDrag(worldPoint, state, p) {
        // Arrastrar el inyector o partícula modifica v0 o B
        const dist = Math.sqrt(worldPoint.x * worldPoint.x + (worldPoint.y - Y_CENTER) * (worldPoint.y - Y_CENTER));
        let newV0 = Math.max(1.0, Math.min(10.0, dist * 22.0));
        newV0 = Number(newV0.toFixed(1));
        p.v0 = newV0;
        return { paramChanged: 'v0', value: newV0 };
      },
      update(state, p) {
        const B = Math.max(0.2, p.B || 2.0);
        const v0 = Math.max(0.5, p.v0 || 4.0);
        const qSign = p.qSign < 0 ? -1 : 1;
        const pitchDeg = p.pitch !== undefined ? p.pitch : 10;
        const pitchRad = (pitchDeg * Math.PI) / 180;

        // Color de la partícula según el signo de la carga
        if (qSign > 0) {
          particleMat.color.setHex(0x3b82f6); // Protón / catión: azul cobalto
        } else {
          particleMat.color.setHex(0xef4444); // Electrón / anión: rojo carmesí
        }

        // Radio de Larmor visual proporcional al físico
        const rPhys = (0.01042 * v0 * Math.cos(pitchRad)) / B; // m
        const rVis = Math.max(0.06, Math.min(0.27, 0.15 * (v0 * Math.cos(pitchRad) / (B / 2.0))));

        const phi = state.phi || 0;
        const curX = rVis * Math.cos(phi);
        const curZ = rVis * Math.sin(phi);
        const curY = Y_CENTER + (state.yDrift || 0);

        particle.position.set(curX, curY, curZ);

        // Actualizar estela 3D
        history.unshift({ x: curX, y: curY, z: curZ });
        if (history.length > TRAIL_LEN) history.pop();

        const posAttr = trailGeo.attributes.position;
        for (let i = 0; i < TRAIL_LEN; i++) {
          const pt = history[i] || history[history.length - 1] || { x: curX, y: curY, z: curZ };
          posAttr.setXYZ(i, pt.x, pt.y, pt.z);
        }
        posAttr.needsUpdate = true;

        // Vector Velocidad Tangente v
        // v = (-R*sin(phi)*omega, vy, R*cos(phi)*omega)
        const omegaSign = qSign;
        const vx = -Math.sin(phi) * omegaSign;
        const vz = Math.cos(phi) * omegaSign;
        const vy = Math.tan(pitchRad);

        const vVec = new THREE.Vector3(vx, vy, vz).normalize();
        arrowVel.vGroup.position.set(curX, curY, curZ);
        arrowVel.vGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vVec);

        // Vector Fuerza Centrípeta FB = q*(v x B)
        // Con B = (0, 1, 0), v x B = (vz, 0, -vx) apuntando hacia el centro instantáneo
        const fVec = new THREE.Vector3(-curX, 0, -curZ).normalize();
        arrowForce.vGroup.position.set(curX, curY, curZ);
        arrowForce.vGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), fVec);
      }
    };
  },

  getMetrics(state, params) {
    const B = Math.max(0.2, params.B || 2.0);
    const v0 = Math.max(0.5, params.v0 || 4.0);
    const qSign = params.qSign < 0 ? -1 : 1;
    const pitchRad = ((params.pitch || 0) * Math.PI) / 180;

    // Constantes físicas del protón
    const mP = 1.6726e-27; // kg
    const qE = 1.6022e-19; // C
    const vPhys = v0 * 1e6; // m/s
    const vPerp = vPhys * Math.cos(pitchRad);

    const rLarmor = (mP * vPerp) / (qE * B); // m
    const fCyclotron = (qE * B) / (2 * Math.PI * mP); // Hz
    const period = 1 / fCyclotron; // s
    const forceLorentz = qE * vPerp * B; // N

    return [
      { label: 'Radio Larmor (R)', value: (rLarmor * 100).toFixed(2) + ' cm' },
      { label: 'Frec. Ciclotrón (fc)', value: (fCyclotron * 1e-6).toFixed(2) + ' MHz' },
      { label: 'Período Giro (Tc)', value: (period * 1e9).toFixed(2) + ' ns' },
      { label: 'Fuerza Lorentz (FB)', value: (forceLorentz * 1e12).toFixed(2) + ' pN' }
    ];
  }
};
