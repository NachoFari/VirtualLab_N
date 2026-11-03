/**
 * VirtualLab_N - Experimento MEC-03
 * Tiro Parabólico y Balística 2D/3D
 * Diseño académico minimalista - Slate / Cobalt / Emerald
 */

window.VLabExperiments = window.VLabExperiments || {};
window.VLabExperiments['MEC-03'] = {
  id: 'MEC-03',
  title: 'Tiro Parabólico y Balística 2D/3D',
  block: 'A',
  category: 'Cinemática y Dinámica',
  formula: 'y(x) = x·tan(θ) - (g·x²) / (2·v₀²·cos²(θ))',
  description: 'Cañón balístico de laboratorio con goniómetro de arco graduado. Muestra en tiempo real la trayectoria analítica con marcadores de altura máxima (H_max) y alcance horizontal (R), la esfera proyectil en vuelo y los vectores cinemáticos v, vx y vy(t). Puedes arrastrar el cañón para cambiar el ángulo de elevación θ o pulsar Impulso para disparar.',
  hasImpulse: true,
  params: [
    { key: 'v0', label: 'Velocidad Inicial (v₀)', unit: 'm/s', min: 3, max: 15, step: 0.5, default: 8.0 },
    { key: 'angle', label: 'Ángulo de Elevación (θ)', unit: '°', min: 10, max: 85, step: 1, default: 45 },
    { key: 'gravity', label: 'Aceleración Gravedad (g)', unit: 'm/s²', min: 1.6, max: 25.0, step: 0.1, default: 9.8 },
    { key: 'y0', label: 'Altura Plataforma (y₀)', unit: 'm', min: 0.0, max: 0.5, step: 0.05, default: 0.0 }
  ],
  presets: [
    { label: 'Tierra Estándar (45°, 8 m/s)', values: { v0: 8.0, angle: 45, gravity: 9.8, y0: 0.0 } },
    { label: 'Alcance Máximo (45°, 12 m/s)', values: { v0: 12.0, angle: 45, gravity: 9.8, y0: 0.0 } },
    { label: 'Gravedad Lunar (Luna 1.62 m/s²)', values: { v0: 6.0, angle: 45, gravity: 1.62, y0: 0.0 } },
    { label: 'Tiro Rasante (25°, 14 m/s)', values: { v0: 14.0, angle: 25, gravity: 9.8, y0: 0.0 } },
    { label: 'Disparo Elevado con Desnivel (60°)', values: { v0: 9.0, angle: 60, gravity: 9.8, y0: 0.35 } }
  ],

  initState(params) {
    return {
      t: 0,
      tFlight: 0,
      isFlying: true,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      isDraggingObject: false
    };
  },

  step(state, params, dt) {
    if (state.isDraggingObject) return;
    state.t += dt;

    const v0 = Math.max(1, params.v0 || 8.0);
    const thetaRad = ((params.angle || 45) * Math.PI) / 180;
    const g = Math.max(0.5, params.gravity !== undefined ? params.gravity : 9.8);
    const y0 = Math.max(0, params.y0 || 0);

    const v0x = v0 * Math.cos(thetaRad);
    const v0y = v0 * Math.sin(thetaRad);

    // Tiempo total de vuelo hasta impactar el suelo y = 0
    // 0 = y0 + v0y*t - 0.5*g*t^2 => 0.5*g*t^2 - v0y*t - y0 = 0
    const disc = v0y * v0y + 2 * g * y0;
    const tImpact = (v0y + Math.sqrt(Math.max(0, disc))) / g;

    state.tFlight += dt;

    // Ciclo de disparo continuo para observación didáctica
    if (state.tFlight > tImpact + 0.65) {
      state.tFlight = 0;
    }

    const tCur = Math.min(state.tFlight, tImpact);
    state.x = v0x * tCur;
    state.y = Math.max(0, y0 + v0y * tCur - 0.5 * g * tCur * tCur);
    state.vx = v0x;
    state.vy = v0y - g * tCur;
  },

  onPush(state) {
    state.tFlight = 0;
    state.isFlying = true;
  },

  createScene(THREE, components, params) {
    const group = new THREE.Group();

    // Materiales sobrios de instrumental científico
    const matBase = new THREE.MeshStandardMaterial({ color: 0x12151d, metalness: 0.55, roughness: 0.45 });
    const matSteel = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.22 });
    const matDarkAlu = new THREE.MeshStandardMaterial({ color: 0x272e3f, metalness: 0.6, roughness: 0.35 });
    const matBrass = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.65, roughness: 0.25 });
    const matCobalt = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.45, roughness: 0.25 });
    const matEmerald = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const matAmber = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const matWhite = new THREE.MeshBasicMaterial({ color: 0xf1f5f9 });

    // Factores de escala visual
    const X_PIVOT = -0.72;
    const Y_FLOOR = 0.04;
    const VIS_SCALE = 0.095; // 1 m físico = 0.095 m en viewport 3D
    const BARREL_LEN = 0.22;

    // 1. Banco Óptico / Mesa de Laboratorio con regla milimetrada
    const tableMesh = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.04, 0.54), matBase);
    tableMesh.position.set(0.12, Y_FLOOR / 2, 0);
    group.add(tableMesh);

    // Riel graduado con marcas equidistantes
    const railMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
    const rail = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.012, 0.08), railMat);
    rail.position.set(0.12, Y_FLOOR + 0.006, 0);
    group.add(rail);

    // Marcas de escala sobre el riel
    const rulerGroup = new THREE.Group();
    group.add(rulerGroup);
    for (let m = 0; m <= 16; m++) {
      const xVis = X_PIVOT + m * VIS_SCALE;
      if (xVis <= 0.95) {
        const tickGeo = new THREE.BoxGeometry(0.003, 0.002, m % 5 === 0 ? 0.06 : 0.035);
        const tick = new THREE.Mesh(tickGeo, m % 5 === 0 ? matWhite : matSteel);
        tick.position.set(xVis, Y_FLOOR + 0.013, 0);
        rulerGroup.add(tick);
      }
    }

    // 2. Columna elevadora del cañón (para variar y0)
    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.028, 0.5, 20), matSteel);
    group.add(column);

    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.05, 20), matDarkAlu);
    group.add(collar);

    // 3. Conjunto del Cañón y Goniómetro
    const cannonMount = new THREE.Group();
    group.add(cannonMount);

    // Disco de goniómetro (transportador de ángulos) detrás del pivote
    const protractorGeo = new THREE.RingGeometry(0.07, 0.11, 48, 1, 0, Math.PI);
    const protractorMat = new THREE.MeshBasicMaterial({ color: 0x475569, side: THREE.DoubleSide, transparent: true, opacity: 0.65 });
    const protractor = new THREE.Mesh(protractorGeo, protractorMat);
    protractor.position.set(0, 0, -0.04);
    cannonMount.add(protractor);

    // Marcas radiales del goniómetro cada 15°
    for (let deg = 0; deg <= 90; deg += 15) {
      const rad = (deg * Math.PI) / 180;
      const tick = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.003, 0.002), matWhite);
      tick.position.set(Math.cos(rad) * 0.09, Math.sin(rad) * 0.09, -0.038);
      tick.rotation.z = rad;
      cannonMount.add(tick);
    }

    // Tubo del cañón (pivotado en el centro del eje)
    const barrelPivot = new THREE.Group();
    cannonMount.add(barrelPivot);

    const barrelGeo = new THREE.CylinderGeometry(0.022, 0.026, BARREL_LEN, 24);
    barrelGeo.rotateZ(-Math.PI / 2);
    barrelGeo.translate(BARREL_LEN / 2, 0, 0);
    const barrel = new THREE.Mesh(barrelGeo, matDarkAlu);
    barrel.userData.isDraggable = true;
    barrelPivot.add(barrel);

    // Anillo exterior decorativo de boca del cañón
    const muzzleRing = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.005, 12, 24), matBrass);
    muzzleRing.rotation.y = Math.PI / 2;
    muzzleRing.position.set(BARREL_LEN, 0, 0);
    barrelPivot.add(muzzleRing);

    // Perno central del pivote
    const pivotPin = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.09, 16), matBrass);
    pivotPin.rotation.x = Math.PI / 2;
    cannonMount.add(pivotPin);

    // 4. Trayectoria teórica punteada previa
    const TRAJ_SAMPLES = 80;
    const trajPositions = new Float32Array(TRAJ_SAMPLES * 3);
    const trajGeo = new THREE.BufferGeometry();
    trajGeo.setAttribute('position', new THREE.BufferAttribute(trajPositions, 3));
    const trajMat = new THREE.LineDashedMaterial({
      color: 0x3b82f6,
      dashSize: 0.025,
      gapSize: 0.018,
      transparent: true,
      opacity: 0.85
    });
    const trajLine = new THREE.Line(trajGeo, trajMat);
    trajLine.computeLineDistances();
    group.add(trajLine);

    // Marcador de Altura Máxima (Hmax)
    const hMaxGroup = new THREE.Group();
    group.add(hMaxGroup);

    const hMaxLine = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 1.0, 8), matAmber);
    hMaxGroup.add(hMaxLine);

    const hMaxMark = new THREE.Mesh(new THREE.OctahedronGeometry(0.018), matAmber);
    hMaxGroup.add(hMaxMark);

    // Marcador de Impacto / Alcance (R)
    const impactTarget = new THREE.Group();
    group.add(impactTarget);

    const ringTarget = new THREE.Mesh(new THREE.RingGeometry(0.02, 0.045, 24), matEmerald);
    ringTarget.rotation.x = -Math.PI / 2;
    ringTarget.position.y = Y_FLOOR + 0.015;
    impactTarget.add(ringTarget);

    // 5. Esfera Proyectil en Vuelo
    const projectileMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.9, roughness: 0.15 });
    const projectile = new THREE.Mesh(new THREE.SphereGeometry(0.022, 24, 24), projectileMat);
    group.add(projectile);

    // Sombra suave proyectada sobre la mesa
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x090a0f, transparent: true, opacity: 0.45 });
    const shadowMesh = new THREE.Mesh(new THREE.CircleGeometry(0.025, 20), shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = Y_FLOOR + 0.014;
    group.add(shadowMesh);

    // 6. Flechas de Vectores Cinematográficos
    const makeArrow = (hexColor) => {
      const arrowGroup = new THREE.Group();
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.1, 10), new THREE.MeshBasicMaterial({ color: hexColor }));
      shaft.rotation.z = -Math.PI / 2;
      shaft.position.x = 0.05;
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.032, 12), new THREE.MeshBasicMaterial({ color: hexColor }));
      head.rotation.z = -Math.PI / 2;
      head.position.x = 0.1;
      arrowGroup.add(shaft, head);
      group.add(arrowGroup);
      return { arrowGroup, shaft, head };
    };

    const arrowV = makeArrow(0x3b82f6);  // Vector v total (azul cobalto)
    const arrowVx = makeArrow(0x10b981); // Componente vx (verde)
    const arrowVy = makeArrow(0xf59e0b); // Componente vy (ámbar)

    return {
      group,
      getInteractiveObjects() {
        return [barrel, muzzleRing];
      },
      onDrag(worldPoint, state, p) {
        const y0Phys = p.y0 || 0;
        const curPivotY = Y_FLOOR + 0.14 + y0Phys * VIS_SCALE;
        const dx = worldPoint.x - X_PIVOT;
        const dy = worldPoint.y - curPivotY;

        if (dx > 0.02) {
          let deg = Math.round(Math.atan2(dy, dx) * (180 / Math.PI));
          deg = Math.max(10, Math.min(85, deg));
          p.angle = deg;
          return { paramChanged: 'angle', value: deg };
        }
        return null;
      },
      update(state, p) {
        const v0 = Math.max(1, p.v0 || 8.0);
        const thetaDeg = p.angle !== undefined ? p.angle : 45;
        const thetaRad = (thetaDeg * Math.PI) / 180;
        const g = Math.max(0.5, p.gravity !== undefined ? p.gravity : 9.8);
        const y0Phys = Math.max(0, p.y0 || 0);

        const v0x = v0 * Math.cos(thetaRad);
        const v0y = v0 * Math.sin(thetaRad);

        // Altura del pivote del cañón
        const pivotY = Y_FLOOR + 0.14 + y0Phys * VIS_SCALE;
        cannonMount.position.set(X_PIVOT, pivotY, 0);
        barrelPivot.rotation.z = thetaRad;

        // Ajuste de la columna telescópica
        const colHeight = pivotY - Y_FLOOR;
        column.scale.set(1, colHeight, 1);
        column.position.set(X_PIVOT, Y_FLOOR + colHeight / 2, 0);
        collar.position.set(X_PIVOT, pivotY - 0.02, 0);

        // Posición de la boca del cañón
        const muzzleX = X_PIVOT + Math.cos(thetaRad) * BARREL_LEN;
        const muzzleY = pivotY + Math.sin(thetaRad) * BARREL_LEN;

        // Cálculos cinemáticos analíticos
        const disc = v0y * v0y + 2 * g * y0Phys;
        const tImpact = (v0y + Math.sqrt(Math.max(0, disc))) / g;
        const tApex = Math.max(0, v0y / g);
        const rPhys = v0x * tImpact;
        const hMaxPhys = y0Phys + (v0y * v0y) / (2 * g);

        // Actualizar curva de trayectoria parabólica completa
        const posAttr = trajGeo.attributes.position;
        for (let i = 0; i < TRAJ_SAMPLES; i++) {
          const frac = i / (TRAJ_SAMPLES - 1);
          const tSample = frac * tImpact;
          const xPhysSample = v0x * tSample;
          const yPhysSample = Math.max(0, y0Phys + v0y * tSample - 0.5 * g * tSample * tSample);

          const xVis = muzzleX + xPhysSample * VIS_SCALE;
          const yVis = Y_FLOOR + 0.015 + yPhysSample * VIS_SCALE;
          posAttr.setXYZ(i, xVis, yVis, 0);
        }
        posAttr.needsUpdate = true;
        trajLine.computeLineDistances();

        // Marcador de Altura Máxima
        const xApexVis = muzzleX + (v0x * tApex) * VIS_SCALE;
        const yApexVis = Y_FLOOR + 0.015 + hMaxPhys * VIS_SCALE;
        hMaxGroup.position.set(xApexVis, (Y_FLOOR + yApexVis) / 2, 0);
        hMaxLine.scale.set(1, Math.max(0.01, yApexVis - Y_FLOOR), 1);
        hMaxMark.position.set(0, (yApexVis - Y_FLOOR) / 2, 0);

        // Marcador de Impacto Horizontal
        const xImpactVis = muzzleX + rPhys * VIS_SCALE;
        impactTarget.position.set(xImpactVis, 0, 0);

        // Posición del proyectil animado
        const curX = muzzleX + (state.x || 0) * VIS_SCALE;
        const curY = Y_FLOOR + 0.022 + (state.y || 0) * VIS_SCALE;
        projectile.position.set(curX, curY, 0);
        shadowMesh.position.set(curX, Y_FLOOR + 0.014, 0);

        // Vectores de Velocidad
        const vx = state.vx !== undefined ? state.vx : v0x;
        const vy = state.vy !== undefined ? state.vy : v0y;
        const vMag = Math.sqrt(vx * vx + vy * vy);

        const vScale = 0.018; // Escala visual de las flechas

        // 1. Vector velocidad total v
        arrowV.arrowGroup.position.set(curX, curY, 0);
        arrowV.arrowGroup.rotation.z = Math.atan2(vy, vx);
        const lenV = Math.max(0.03, vMag * vScale);
        arrowV.shaft.scale.set(1, lenV / 0.1, 1);
        arrowV.shaft.position.x = lenV / 2;
        arrowV.head.position.x = lenV;

        // 2. Vector horizontal vx
        arrowVx.arrowGroup.position.set(curX, curY, 0);
        arrowVx.arrowGroup.rotation.z = 0;
        const lenVx = Math.max(0.02, vx * vScale);
        arrowVx.shaft.scale.set(1, lenVx / 0.1, 1);
        arrowVx.shaft.position.x = lenVx / 2;
        arrowVx.head.position.x = lenVx;

        // 3. Vector vertical vy
        arrowVy.arrowGroup.position.set(curX, curY, 0);
        arrowVy.arrowGroup.rotation.z = vy >= 0 ? Math.PI / 2 : -Math.PI / 2;
        const lenVy = Math.max(0.02, Math.abs(vy) * vScale);
        arrowVy.shaft.scale.set(1, lenVy / 0.1, 1);
        arrowVy.shaft.position.x = lenVy / 2;
        arrowVy.head.position.x = lenVy;
      }
    };
  },

  getMetrics(state, params) {
    const v0 = Math.max(1, params.v0 || 8.0);
    const thetaDeg = params.angle !== undefined ? params.angle : 45;
    const thetaRad = (thetaDeg * Math.PI) / 180;
    const g = Math.max(0.5, params.gravity !== undefined ? params.gravity : 9.8);
    const y0 = Math.max(0, params.y0 || 0);

    const v0x = v0 * Math.cos(thetaRad);
    const v0y = v0 * Math.sin(thetaRad);

    const disc = v0y * v0y + 2 * g * y0;
    const tImpact = (v0y + Math.sqrt(Math.max(0, disc))) / g;
    const rPhys = v0x * tImpact;
    const hMaxPhys = y0 + (v0y * v0y) / (2 * g);

    const curVx = state.vx !== undefined ? state.vx : v0x;
    const curVy = state.vy !== undefined ? state.vy : v0y;
    const curV = Math.sqrt(curVx * curVx + curVy * curVy);

    return [
      { label: 'Alcance Horizontal (R)', value: rPhys.toFixed(2) + ' m' },
      { label: 'Altura Máxima (Hmax)', value: hMaxPhys.toFixed(2) + ' m' },
      { label: 'Tiempo de Vuelo (tf)', value: tImpact.toFixed(2) + ' s' },
      { label: 'Velocidad Actual (v)', value: curV.toFixed(2) + ' m/s' }
    ];
  }
};
