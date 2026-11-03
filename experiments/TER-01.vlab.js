/**
 * VirtualLab_N - Experimento TER-01
 * Teoría Cinética de Gases Ideales (PV = nRT)
 * Diseño académico minimalista - Slate / Zinc / Cobalt / Amber
 */

window.VLabExperiments = window.VLabExperiments || {};
window.VLabExperiments['TER-01'] = {
  id: 'TER-01',
  title: 'Teoría Cinética de Gases Ideales (PV = nRT)',
  block: 'C',
  category: 'Termodinámica',
  formula: 'P · V = n · R · T   ;   ⟨Eₖ⟩ = (3/2) · k_B · T',
  description: 'Cilindro térmico transparente con pistón hermético móvil, manómetro de Bourdon y placa calefactora basal. Modela 35 partículas en colisión elástica continua 3D cuya velocidad media escala con √(T) y determina la presión P. Arrastra el pistón verticalmente con el mouse para variar el volumen V.',
  hasImpulse: true,
  params: [
    { key: 'temp', label: 'Temperatura (T)', unit: 'K', min: 100, max: 600, step: 10, default: 300 },
    { key: 'volume', label: 'Volumen Cámara (V)', unit: 'L', min: 0.30, max: 1.00, step: 0.05, default: 0.65 },
    { key: 'nMoles', label: 'Cantidad de Gas (n)', unit: 'mol', min: 0.5, max: 3.0, step: 0.25, default: 1.0 }
  ],
  presets: [
    { label: 'Estado Estándar (300 K, 0.65 L)', values: { temp: 300, volume: 0.65, nMoles: 1.0 } },
    { label: 'Expansión Isobárica Charles (500 K, 0.90 L)', values: { temp: 500, volume: 0.90, nMoles: 1.0 } },
    { label: 'Compresión Isotérmica Boyle (300 K, 0.35 L)', values: { temp: 300, volume: 0.35, nMoles: 1.0 } },
    { label: 'Gas Enfriado Criogénico (120 K, 0.50 L)', values: { temp: 120, volume: 0.50, nMoles: 1.0 } },
    { label: 'Alta Densidad y Presión (550 K, 0.35 L)', values: { temp: 550, volume: 0.35, nMoles: 2.5 } }
  ],

  initState(params) {
    const NUM_PARTICLES = 35;
    const particles = [];
    const R_CYL = 0.20;
    const Y_BOTTOM = 0.14;
    const initH = (params.volume || 0.65) * 0.64;

    for (let i = 0; i < NUM_PARTICLES; i++) {
      const r = Math.sqrt(Math.random()) * (R_CYL - 0.02);
      const theta = Math.random() * Math.PI * 2;
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);
      const y = Y_BOTTOM + 0.03 + Math.random() * (initH - 0.06);

      // Velocidad inicial isotrópica
      const u = Math.random() * 2 - 1;
      const phi = Math.random() * Math.PI * 2;
      const speed = 0.55;
      const vx = speed * Math.sqrt(1 - u * u) * Math.cos(phi);
      const vy = speed * u;
      const vz = speed * Math.sqrt(1 - u * u) * Math.sin(phi);

      particles.push({ x, y, z, vx, vy, vz });
    }

    return {
      t: 0,
      particles,
      boostTimer: 0,
      isDraggingObject: false
    };
  },

  step(state, params, dt) {
    state.t += dt;

    const T = Math.max(50, params.temp || 300);
    const V = Math.max(0.25, Math.min(1.0, params.volume || 0.65));
    const R_CYL = 0.20;
    const RP = 0.013;
    const Y_BOTTOM = 0.14;
    const Y_PISTON = Y_BOTTOM + V * 0.64;

    if (state.boostTimer > 0) {
      state.boostTimer = Math.max(0, state.boostTimer - dt);
    }
    const boostMult = state.boostTimer > 0 ? 1.5 : 1.0;

    // Velocidad térmica media proporcional a sqrt(T)
    const targetSpeed = 0.55 * Math.sqrt(T / 300) * boostMult;

    const parts = state.particles || [];
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;

      // Colisión con paredes cilíndricas radiales
      const r = Math.sqrt(p.x * p.x + p.z * p.z);
      const maxR = R_CYL - RP;
      if (r > maxR) {
        const nx = p.x / r;
        const nz = p.z / r;
        const dot = p.vx * nx + p.vz * nz;
        p.vx -= 2 * dot * nx;
        p.vz -= 2 * dot * nz;
        p.x = nx * maxR;
        p.z = nz * maxR;
      }

      // Colisión con fondo inferior
      if (p.y < Y_BOTTOM + RP) {
        p.y = Y_BOTTOM + RP;
        p.vy = Math.abs(p.vy);
      }

      // Colisión con cara inferior del pistón
      if (p.y > Y_PISTON - RP) {
        p.y = Y_PISTON - RP;
        p.vy = -Math.abs(p.vy);
      }

      // Termalización suave de la rapidez
      const curSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy + p.vz * p.vz);
      if (curSpeed > 1e-4) {
        const factor = (targetSpeed / curSpeed) * 0.08 + 0.92;
        p.vx *= factor;
        p.vy *= factor;
        p.vz *= factor;
      }
    }
  },

  onPush(state) {
    state.boostTimer = 0.5;
  },

  createScene(THREE, components, params) {
    const group = new THREE.Group();
    const R_CYL = 0.22;
    const Y_BOTTOM = 0.14;
    const MAX_H = 0.66;

    // Materiales sobrios de laboratorio
    const matBase = new THREE.MeshStandardMaterial({ color: 0x12151d, metalness: 0.6, roughness: 0.4 });
    const matSteel = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.22 });
    const matDarkAlu = new THREE.MeshStandardMaterial({ color: 0x1e2433, metalness: 0.65, roughness: 0.35 });
    const matBrass = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.65, roughness: 0.25 });
    const matPistonFace = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
    const matCobalt = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.5, roughness: 0.25 });
    const matEmerald = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const matAmber = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    // 1. Base y Placa Calefactora
    const basePlate = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.04, 0.65), matBase);
    basePlate.position.set(0, 0.02, 0);
    group.add(basePlate);

    // Bloque térmico basal
    const heaterBlock = new THREE.Mesh(new THREE.CylinderGeometry(R_CYL + 0.03, R_CYL + 0.04, 0.08, 36), matDarkAlu);
    heaterBlock.position.set(0, 0.08, 0);
    group.add(heaterBlock);

    // Anillo resistivo calefactor con emisión térmica variable
    const coilMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      emissive: 0x000000,
      roughness: 0.4
    });
    const heaterCoil = new THREE.Mesh(new THREE.TorusGeometry(R_CYL - 0.04, 0.009, 12, 32), coilMat);
    heaterCoil.rotation.x = Math.PI / 2;
    heaterCoil.position.set(0, 0.12, 0);
    group.add(heaterCoil);

    // 2. Cilindro Transparente de Vidrio (borosilicato con depthWrite: false)
    const glassGeo = new THREE.CylinderGeometry(R_CYL, R_CYL, MAX_H, 48, 1, true);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.16,
      roughness: 0.1,
      metalness: 0.05,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const glassCylinder = new THREE.Mesh(glassGeo, glassMat);
    glassCylinder.position.set(0, Y_BOTTOM + MAX_H / 2, 0);
    glassCylinder.renderOrder = 1;
    group.add(glassCylinder);

    // Anillo superior de retención del cilindro
    const topRing = new THREE.Mesh(new THREE.TorusGeometry(R_CYL, 0.012, 12, 48), matDarkAlu);
    topRing.rotation.x = Math.PI / 2;
    topRing.position.set(0, Y_BOTTOM + MAX_H, 0);
    group.add(topRing);

    // Líneas de escala volumétrica en el cilindro (0.3L, 0.5L, 0.7L, 1.0L)
    const scaleGroup = new THREE.Group();
    group.add(scaleGroup);
    [0.3, 0.5, 0.7, 1.0].forEach(volVal => {
      const yVal = Y_BOTTOM + volVal * 0.64;
      const sRing = new THREE.Mesh(
        new THREE.RingGeometry(R_CYL + 0.002, R_CYL + 0.008, 36),
        new THREE.MeshBasicMaterial({ color: 0x64748b, side: THREE.DoubleSide })
      );
      sRing.rotation.x = Math.PI / 2;
      sRing.position.set(0, yVal, 0);
      scaleGroup.add(sRing);
    });

    // 3. Pistón Móvil Superior (Interactivo: arrastrable verticalmente)
    const pistonAssembly = new THREE.Group();
    group.add(pistonAssembly);

    const pistonHead = new THREE.Mesh(new THREE.CylinderGeometry(R_CYL - 0.003, R_CYL - 0.003, 0.04, 36), matPistonFace);
    pistonHead.position.y = -0.02;
    pistonHead.userData.isDraggable = true;
    pistonAssembly.add(pistonHead);

    // Junta tórica de estanqueidad (O-ring)
    const oring = new THREE.Mesh(new THREE.TorusGeometry(R_CYL - 0.003, 0.006, 12, 36), matAmber);
    oring.rotation.x = Math.PI / 2;
    oring.position.y = -0.02;
    pistonAssembly.add(oring);

    // Vástago vertical del pistón
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.42, 16), matSteel);
    rod.position.y = 0.20;
    rod.userData.isDraggable = true;
    pistonAssembly.add(rod);

    // Manillar T superior de tracción
    const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 16), matDarkAlu);
    handleBar.rotation.z = Math.PI / 2;
    handleBar.position.y = 0.41;
    handleBar.userData.isDraggable = true;
    pistonAssembly.add(handleBar);

    // 4. Manómetro de Bourdon lateral
    const manometerGroup = new THREE.Group();
    manometerGroup.position.set(R_CYL + 0.08, 0.32, 0);
    group.add(manometerGroup);

    // Tubo conector de latón
    const connPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.09, 12), matBrass);
    connPipe.rotation.z = Math.PI / 2;
    connPipe.position.set(-0.045, 0, 0);
    manometerGroup.add(connPipe);

    // Caja cilíndrica del manómetro
    const gaugeBody = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.025, 32), matDarkAlu);
    gaugeBody.rotation.x = Math.PI / 2;
    manometerGroup.add(gaugeBody);

    // Esfera blanca del reloj graduado
    const gaugeFace = new THREE.Mesh(new THREE.CircleGeometry(0.058, 32), new THREE.MeshBasicMaterial({ color: 0xf1f5f9 }));
    gaugeFace.position.z = 0.013;
    manometerGroup.add(gaugeFace);

    // Aguja indicadora de presión
    const needlePivot = new THREE.Group();
    needlePivot.position.z = 0.015;
    manometerGroup.add(needlePivot);

    const needle = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.046, 0.002), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    needle.position.y = 0.023;
    needlePivot.add(needle);

    // 5. Partículas Esféricas de Gas
    const MAX_PARTS = 35;
    const particleMeshes = [];
    const partGeo = new THREE.SphereGeometry(0.013, 16, 16);

    for (let i = 0; i < MAX_PARTS; i++) {
      const pMat = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        metalness: 0.5,
        roughness: 0.25
      });
      const pMesh = new THREE.Mesh(partGeo, pMat);
      pMesh.renderOrder = 2;
      group.add(pMesh);
      particleMeshes.push(pMesh);
    }

    return {
      group,
      getInteractiveObjects() {
        return [pistonHead, rod, handleBar];
      },
      onDrag(worldPoint, state, p) {
        // Arrastrar el pistón verticalmente altera el volumen V
        const newH = worldPoint.y - Y_BOTTOM;
        let newV = newH / 0.64;
        newV = Math.max(0.30, Math.min(1.00, newV));
        newV = Number(newV.toFixed(2));
        p.volume = newV;

        // Reposicionar partículas que queden sobre el pistón comprimido
        const maxYP = Y_BOTTOM + newV * 0.64 - 0.015;
        (state.particles || []).forEach(pt => {
          if (pt.y > maxYP) {
            pt.y = maxYP - Math.random() * 0.04;
            pt.vy = -Math.abs(pt.vy);
          }
        });

        return { paramChanged: 'volume', value: newV };
      },
      update(state, p) {
        const T = Math.max(50, p.temp || 300);
        const V = Math.max(0.25, Math.min(1.0, p.volume || 0.65));
        const nMoles = Math.max(0.2, p.nMoles || 1.0);

        // Posición del pistón
        const yPiston = Y_BOTTOM + V * 0.64;
        pistonAssembly.position.set(0, yPiston, 0);

        // Color térmico de la placa calefactora
        const tFrac = Math.max(0, Math.min(1, (T - 100) / 500));
        coilMat.emissive.setRGB(tFrac * 0.85, tFrac * 0.25, 0.0);

        // Número de partículas activas en proporción a nMoles
        const activeCount = Math.min(MAX_PARTS, Math.max(10, Math.round(10 + (nMoles / 3.0) * 25)));

        // Actualizar posiciones de las partículas
        const parts = state.particles || [];
        for (let i = 0; i < MAX_PARTS; i++) {
          const mesh = particleMeshes[i];
          if (i < activeCount && i < parts.length) {
            mesh.visible = true;
            mesh.position.set(parts[i].x, parts[i].y, parts[i].z);

            // Tinte de velocidad/temperatura en las esferas
            if (tFrac > 0.5) {
              mesh.material.color.setHex(0xf59e0b); // Ambarino para alta agitación térmica
            } else {
              mesh.material.color.setHex(0x3b82f6); // Azul cobalto estándar
            }
          } else {
            mesh.visible = false;
          }
        }

        // Rotación de la aguja del manómetro proporcional a P = nRT/V
        // P_norm relativo a 1 mol, 300 K, 0.65 L (presión base = 37.8 atm)
        const pressAtm = (nMoles * 0.08206 * T) / V;
        const maxGaugePress = 120; // atm
        const needleAngle = -Math.PI * 0.75 + (pressAtm / maxGaugePress) * (Math.PI * 1.5);
        needlePivot.rotation.z = -Math.max(-Math.PI * 0.85, Math.min(Math.PI * 0.85, needleAngle));
      }
    };
  },

  getMetrics(state, params) {
    const T = Math.max(50, params.temp || 300); // K
    const V = Math.max(0.25, Math.min(1.0, params.volume || 0.65)); // L
    const n = Math.max(0.2, params.nMoles || 1.0); // mol

    // Ley de los Gases Ideales P = nRT / V
    const R_GAS = 0.082057; // L·atm / (mol·K)
    const pressAtm = (n * R_GAS * T) / V;
    const pressKPa = pressAtm * 101.325;

    // Velocidad cuadrática media para Nitrógeno molecular N2 (M = 28 g/mol)
    const M_N2 = 0.028; // kg/mol
    const R_SI = 8.314; // J/(mol·K)
    const vRMS = Math.sqrt((3 * R_SI * T) / M_N2);

    // Energía cinética media por molécula <Ek> = 3/2 * kB * T
    const KB = 1.3806e-23; // J/K
    const ekMean = 1.5 * KB * T;

    const molarDensity = n / V;

    return [
      { label: 'Presión Gas (P)', value: `${pressAtm.toFixed(1)} atm (${(pressKPa / 1000).toFixed(2)} MPa)` },
      { label: 'Velocidad RMS (v_rms)', value: vRMS.toFixed(0) + ' m/s' },
      { label: 'Energía Cinética ⟨Ek⟩', value: (ekMean * 1e21).toFixed(2) + ' zJ' },
      { label: 'Densidad Molar (n/V)', value: molarDensity.toFixed(2) + ' mol/L' }
    ];
  }
};
