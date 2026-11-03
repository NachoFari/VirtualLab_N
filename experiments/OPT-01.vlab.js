window.VLabExperiments = window.VLabExperiments || {};
window.VLabExperiments['OPT-01'] = {
  id: 'OPT-01',
  title: 'Ley de Snell y Refracción de la Luz',
  block: 'D',
  category: 'Óptica Geométrica',
  formula: 'n₁ · sin(θ₁) = n₂ · sin(θ₂)',
  description: 'Arrastra el emisor láser directamente con el mouse/dedo o usa los controles para observar cómo el haz incidente atraviesa la interfaz hacia el segundo medio (haz refractado) o se refleja totalmente cuando supera el ángulo crítico.',
  isStaticScene: true, // Oculta Pausar e Impulso (es un equilibrio óptico instantáneo)
  params: [
    { key: 'theta1', label: 'Ángulo de Incidencia (θ₁)', unit: '°', min: 0, max: 85, step: 1, default: 40 },
    { key: 'n1', label: 'Índice Medio Superior (n₁)', unit: '', min: 1.0, max: 2.4, step: 0.05, default: 1.00 },
    { key: 'n2', label: 'Índice Medio Inferior (n₂)', unit: '', min: 1.0, max: 2.4, step: 0.05, default: 1.50 },
    { key: 'power', label: 'Intensidad del Haz', unit: 'mW', min: 5, max: 50, step: 1, default: 35 }
  ],
  presets: [
    { label: 'Aire → Vidrio (n₁=1.0, n₂=1.5)', values: { theta1: 40, n1: 1.00, n2: 1.50, power: 35 } },
    { label: 'Aire → Agua (n₁=1.0, n₂=1.33)', values: { theta1: 50, n1: 1.00, n2: 1.33, power: 35 } },
    { label: 'Aire → Diamante (n₁=1.0, n₂=2.4)', values: { theta1: 55, n1: 1.00, n2: 2.40, power: 40 } },
    { label: 'Ángulo Crítico (Vidrio → Aire)', values: { theta1: 41, n1: 1.50, n2: 1.00, power: 40 } },
    { label: 'Reflexión Total Interna (60°)', values: { theta1: 60, n1: 1.50, n2: 1.00, power: 45 } }
  ],
  initState(params) {
    return { t: 0 };
  },
  step(state, params, dt) {
    state.t += dt;
  },
  createScene(THREE, components, params) {
    const group = new THREE.Group();
    const centerY = 0.65;

    // Base sobria de instrumento óptico
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.5, roughness: 0.5 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.04, 0.65), baseMat);
    base.position.set(0, 0.02, 0);
    group.add(base);

    // Disco graduado (Transportador detrás de los bloques en Z = -0.14)
    const ringGeo = new THREE.RingGeometry(0.42, 0.46, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x64748b, side: THREE.DoubleSide, transparent: true, opacity: 0.45 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(0, centerY, -0.14);
    group.add(ring);

    // Línea Normal Vertical (Eje de referencia perpendicular a la interfaz)
    const normalMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.55 });
    const normalLine = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.96, 8), normalMat);
    normalLine.position.set(0, centerY, 0);
    group.add(normalLine);

    // Plano horizontal de separación entre Medio 1 y Medio 2
    const interfaceMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0, side: THREE.DoubleSide, transparent: true, opacity: 0.35 });
    const interfacePlane = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.28), interfaceMat);
    interfacePlane.rotation.x = Math.PI / 2;
    interfacePlane.position.set(0, centerY, 0);
    group.add(interfacePlane);

    // Bloque Dieléctrico Inferior (Medio 2: Vidrio / Agua / Diamante)
    // CRÍTICO: depthWrite: false para que el haz láser refractado en su interior SIEMPRE sea 100% visible!
    const blockGeo = new THREE.BoxGeometry(0.96, 0.44, 0.24);
    const blockMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      roughness: 0.15,
      metalness: 0.05,
      depthWrite: false
    });
    const lowerBlock = new THREE.Mesh(blockGeo, blockMat);
    lowerBlock.position.set(0, centerY - 0.22, 0);
    lowerBlock.renderOrder = 1;
    group.add(lowerBlock);

    // Bordes del bloque inferior para claridad geométrica
    const edgesGeo = new THREE.EdgesGeometry(blockGeo);
    const edgesLine = new THREE.LineSegments(edgesGeo, new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.55 }));
    edgesLine.position.copy(lowerBlock.position);
    group.add(edgesLine);

    // Bloque Superior (Medio 1, muy sutil cuando n1 > 1.0)
    const upperMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.05,
      roughness: 0.2,
      depthWrite: false
    });
    const upperBlock = new THREE.Mesh(blockGeo, upperMat);
    upperBlock.position.set(0, centerY + 0.22, 0);
    upperBlock.renderOrder = 1;
    group.add(upperBlock);

    // Haces Láser de Alta Visibilidad (renderOrder = 2 para verse nítidos dentro del cristal)
    const beamLen = 0.46;
    const makeBeam = (hexColor, radius = 0.011) => {
      const pivot = new THREE.Group();
      pivot.position.set(0, centerY, 0);
      const geo = new THREE.CylinderGeometry(radius, radius, beamLen, 16);
      geo.translate(0, beamLen / 2, 0);
      const mat = new THREE.MeshBasicMaterial({ color: hexColor, transparent: true, opacity: 0.98 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = 2;
      pivot.add(mesh);

      // Punta de flecha para indicar dirección del rayo
      const coneGeo = new THREE.ConeGeometry(radius * 2.1, 0.045, 16);
      coneGeo.translate(0, beamLen * 0.62, 0);
      const cone = new THREE.Mesh(coneGeo, mat);
      cone.renderOrder = 2;
      pivot.add(cone);

      return { pivot, mesh, cone, mat };
    };

    // 1. Haz Incidente (Verde Esmeralda Láser 532nm - apunta hacia el centro)
    const incBeam = makeBeam(0x10b981, 0.011);
    incBeam.cone.rotation.x = Math.PI; // Flecha apuntando hacia el origen (0, centerY, 0)
    incBeam.cone.position.y = beamLen * 0.62;

    // 2. Haz Refractado que ENTRA al material (Cian Brillante / Azul Óptico)
    const refrBeam = makeBeam(0x38bdf8, 0.012);

    // 3. Haz Reflejado Parcial o Total (Ámbar)
    const refBeam = makeBeam(0xf59e0b, 0.008);

    group.add(incBeam.pivot, refrBeam.pivot, refBeam.pivot);

    // Emisor Láser (Interactivo: se puede arrastrar con el mouse)
    const emitterMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.25 });
    const emitter = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.13, 20), emitterMat);
    emitter.userData.isDraggable = true;
    emitter.renderOrder = 3;
    group.add(emitter);

    // Punto de incidencia en la interfaz
    const spot = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    spot.position.set(0, centerY, 0);
    spot.renderOrder = 3;
    group.add(spot);

    return {
      group,
      // Permite que el profesor o alumno arrastre el láser directamente con el mouse
      getInteractiveObjects() {
        return [emitter, incBeam.mesh];
      },
      onDrag(worldPoint, state, p) {
        const dx = worldPoint.x;
        const dy = worldPoint.y - centerY;
        if (dy > 0.02) {
          let angleDeg = Math.atan2(-dx, dy) * (180 / Math.PI);
          angleDeg = Math.max(0, Math.min(85, Math.round(angleDeg)));
          p.theta1 = angleDeg;
          return { paramChanged: 'theta1', value: angleDeg };
        }
        return null;
      },
      update(state, p) {
        const theta1 = p.theta1 !== undefined ? p.theta1 : 40;
        const n1 = p.n1 !== undefined ? p.n1 : 1.0;
        const n2 = p.n2 !== undefined ? p.n2 : 1.5;

        const rad1 = (theta1 * Math.PI) / 180;
        const sinTheta2 = (n1 / n2) * Math.sin(rad1);
        const isTIR = sinTheta2 > 1.0;

        // Opacidad proporcional a la densidad óptica (índice de refracción)
        upperMat.opacity = n1 > 1.02 ? 0.08 + (n1 - 1.0) * 0.14 : 0.02;
        blockMat.opacity = 0.18 + (n2 - 1.0) * 0.18;

        // Haz incidente en el cuadrante superior izquierdo
        incBeam.pivot.rotation.z = rad1;
        const ex = -Math.sin(rad1) * beamLen;
        const ey = centerY + Math.cos(rad1) * beamLen;
        emitter.position.set(ex, ey, 0);
        emitter.rotation.z = rad1;

        // Haz reflejado en el cuadrante superior derecho
        refBeam.pivot.rotation.z = -rad1;

        if (isTIR) {
          // Reflexión Total Interna: no hay rayo refractado, todo se refleja
          refrBeam.pivot.visible = false;
          refBeam.mat.opacity = 0.98;
          refBeam.mat.color.setHex(0x10b981);
        } else {
          // Haz refractado entrando claramente dentro del material inferior (cuadrante inferior derecho)
          refrBeam.pivot.visible = true;
          const rad2 = Math.asin(Math.max(-1, Math.min(1, sinTheta2)));
          // En Three.js, rotation.z = Math.PI + rad2 apunta hacia +X (derecha) y -Y (abajo dentro del bloque)
          refrBeam.pivot.rotation.z = Math.PI + rad2;
          refrBeam.mat.opacity = 0.98;
          refrBeam.mat.color.setHex(0x38bdf8);

          // Haz reflejado secundario tenue (ecuación de Fresnel simplificada)
          const rFresnel = Math.min(0.85, Math.pow((n1 - n2) / (n1 + n2), 2) + 0.18 * Math.pow(sinTheta2, 3));
          refBeam.mat.opacity = Math.max(0.28, rFresnel);
          refBeam.mat.color.setHex(0xf59e0b);
        }
      }
    };
  },
  getMetrics(state, params) {
    const theta1 = params.theta1 !== undefined ? params.theta1 : 40;
    const n1 = params.n1 !== undefined ? params.n1 : 1.0;
    const n2 = params.n2 !== undefined ? params.n2 : 1.5;

    const rad1 = (theta1 * Math.PI) / 180;
    const sinTheta2 = (n1 / n2) * Math.sin(rad1);
    const isTIR = sinTheta2 > 1.0;
    const theta2Str = isTIR ? 'Reflexión Total (Sin Refracción)' : ((Math.asin(sinTheta2) * 180) / Math.PI).toFixed(1) + '°';
    const critStr = n1 > n2 ? ((Math.asin(n2 / n1) * 180) / Math.PI).toFixed(1) + '°' : 'No aplica (n₁ ≤ n₂)';
    const v2 = (300000 / n2).toFixed(0);
    return [
      { label: 'Ángulo Incidente (θ₁)', value: theta1.toFixed(1) + '°' },
      { label: 'Ángulo Refractado (θ₂)', value: theta2Str },
      { label: 'Ángulo Crítico (θc)', value: critStr },
      { label: 'Velocidad Luz Medio 2', value: v2 + ' km/s' }
    ];
  }
};
