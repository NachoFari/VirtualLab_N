window.VLabExperiments = window.VLabExperiments || {};
window.VLabExperiments['MEC-02'] = {
  id: 'MEC-02',
  title: 'Oscilador Masa-Resorte (Ley de Hooke)',
  block: 'A',
  category: 'Mecánica Clásica',
  formula: 'F = -k·y - b·v  ;  T = 2π √(m / k)',
  description: 'Puedes arrastrar el bloque verticalmente con el mouse/dedo para estirar o comprimir el resorte y soltarlo, o ajustar la constante elástica k, la masa m y el amortiguamiento b.',
  hasImpulse: true,
  params: [
    { key: 'k', label: 'Constante Elástica (k)', unit: 'N/m', min: 5, max: 60, step: 1, default: 22 },
    { key: 'mass', label: 'Masa Suspendida (m)', unit: 'kg', min: 0.2, max: 5.0, step: 0.1, default: 1.2 },
    { key: 'damping', label: 'Amortiguamiento (b)', unit: 'N·s/m', min: 0.0, max: 2.0, step: 0.05, default: 0.08 },
    { key: 'amp0', label: 'Elongación Inicial (y₀)', unit: 'm', min: 0.05, max: 0.35, step: 0.01, default: 0.22 }
  ],
  presets: [
    { label: 'Subamortiguado Estándar', values: { k: 22, mass: 1.2, damping: 0.08, amp0: 0.22 } },
    { label: 'Resorte Rígido (Alta Frecuencia)', values: { k: 55, mass: 0.6, damping: 0.04, amp0: 0.18 } },
    { label: 'Armónico Ideal (Sin Roce)', values: { k: 25, mass: 1.0, damping: 0.0, amp0: 0.25 } },
    { label: 'Amortiguamiento Fuerte', values: { k: 18, mass: 1.5, damping: 1.6, amp0: 0.28 } }
  ],
  initState(params) {
    return { y: params.amp0 || 0.22, v: 0.0, t: 0, isDraggingObject: false };
  },
  step(state, params, dt) {
    if (state.isDraggingObject) return;
    state.t += dt;
    const m = Math.max(0.1, params.mass || 1.2);
    const k = params.k || 22;
    const b = params.damping !== undefined ? params.damping : 0.08;

    const f1 = (y, v) => v;
    const f2 = (y, v) => (-k * y - b * v) / m;

    const k1_y = f1(state.y, state.v);
    const k1_v = f2(state.y, state.v);

    const k2_y = f1(state.y + 0.5 * dt * k1_y, state.v + 0.5 * dt * k1_v);
    const k2_v = f2(state.y + 0.5 * dt * k1_y, state.v + 0.5 * dt * k1_v);

    const k3_y = f1(state.y + 0.5 * dt * k2_y, state.v + 0.5 * dt * k2_v);
    const k3_v = f2(state.y + 0.5 * dt * k2_y, state.v + 0.5 * dt * k2_v);

    const k4_y = f1(state.y + dt * k3_y, state.v + dt * k3_v);
    const k4_v = f2(state.y + dt * k3_y, state.v + dt * k3_v);

    state.y += (dt / 6) * (k1_y + 2 * k2_y + 2 * k3_y + k4_y);
    state.v += (dt / 6) * (k1_v + 2 * k2_v + 2 * k3_v + k4_v);
  },
  onPush(state, params) {
    state.v += (state.v >= 0 ? 1 : -1) * 0.85;
    if (Math.abs(state.y) < 0.03 && Math.abs(state.v) < 0.2) {
      state.y = params.amp0 || 0.24;
    }
  },
  createScene(THREE, components, params) {
    const group = new THREE.Group();

    const matBase = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.6, roughness: 0.4 });
    const matSteel = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 });
    const matBlock = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.35, roughness: 0.25 });
    const matRef = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.7 });

    // Base
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.5), matBase);
    base.position.set(0, 0.02, 0);
    group.add(base);

    // Pórtico Metálico
    const H_top = 1.25;
    const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, H_top, 16), matSteel);
    postL.position.set(-0.28, H_top / 2, 0);
    const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, H_top, 16), matSteel);
    postR.position.set(0.28, H_top / 2, 0);
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.05, 0.08), matBase);
    topBar.position.set(0, H_top, 0);
    group.add(postL, postR, topBar);

    // Línea de Equilibrio (yEq = 0.62)
    const yEq = 0.62;
    const eqLine = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.54, 8), matRef);
    eqLine.rotation.z = Math.PI / 2;
    eqLine.position.set(0, yEq, 0);
    group.add(eqLine);

    // Resorte Helicoidal
    const springContainer = new THREE.Group();
    springContainer.position.set(0, H_top - 0.025, 0);
    group.add(springContainer);

    const numCoils = 14;
    for (let i = 0; i < numCoils; i++) {
      const coil = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.008, 10, 24), matSteel);
      coil.rotation.x = Math.PI / 2 + 0.14;
      coil.position.y = -((i + 0.5) / numCoils);
      springContainer.add(coil);
    }

    // Bloque de Masa (Interactivo: arrastrable con el mouse)
    const massGroup = new THREE.Group();
    group.add(massGroup);

    const cube = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.17, 0.19), matBlock);
    cube.userData.isDraggable = true;
    massGroup.add(cube);

    return {
      group,
      getInteractiveObjects() {
        return [cube];
      },
      onDrag(worldPoint, state, p) {
        const disp = Math.max(-0.34, Math.min(0.34, yEq - worldPoint.y));
        state.y = disp;
        state.v = 0;
        return { stateChanged: true };
      },
      update(state, p) {
        const disp = Math.max(-0.36, Math.min(0.36, state.y || 0));
        const currentY = yEq - disp;
        const springLen = Math.max(0.15, (H_top - 0.025) - (currentY + 0.085));

        springContainer.scale.set(1, springLen, 1);

        const mScale = 0.8 + 0.15 * Math.cbrt(p.mass || 1.2);
        massGroup.scale.setScalar(mScale);
        massGroup.position.set(0, currentY, 0);
      }
    };
  },
  getMetrics(state, params) {
    const k = params.k || 22;
    const m = Math.max(0.1, params.mass || 1.2);
    const y = state.y || 0;
    const v = state.v || 0;
    const omega0 = Math.sqrt(k / m);
    const period = (2 * Math.PI) / omega0;
    const force = -k * y;
    const E = 0.5 * k * y * y + 0.5 * m * v * v;

    return [
      { label: 'Elongación (y)', value: (y * 100).toFixed(1) + ' cm' },
      { label: 'Fuerza Elástica (F)', value: force.toFixed(2) + ' N' },
      { label: 'Período Propio (T)', value: period.toFixed(2) + ' s' },
      { label: 'Energía Mecánica (E)', value: E.toFixed(2) + ' J' }
    ];
  }
};
