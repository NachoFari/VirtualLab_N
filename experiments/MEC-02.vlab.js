window.VLabExperiments = window.VLabExperiments || {};
window.VLabExperiments['MEC-02'] = {
  id: 'MEC-02',
  title: 'Oscilador Masa-Resorte (Ley de Hooke)',
  block: 'A',
  category: 'Mecánica y Oscilaciones',
  formula: 'F = -k·y - b·v  ;  T = 2π √(m / k)',
  description: 'Resorte helicoidal 3D deformable en tiempo real que sostiene un bloque calibrado. Permite comprobar la Ley de Hooke, la resonancia y la amortiguación viscosa.',
  params: [
    { key: 'k', label: 'Constante Elástica (k)', unit: 'N/m', min: 5, max: 60, step: 1, default: 20 },
    { key: 'mass', label: 'Masa Suspendida (m)', unit: 'kg', min: 0.2, max: 5.0, step: 0.1, default: 1.2 },
    { key: 'damping', label: 'Amortiguamiento (b)', unit: 'N·s/m', min: 0.0, max: 2.0, step: 0.05, default: 0.10 },
    { key: 'amp0', label: 'Elongación Inicial (y₀)', unit: 'm', min: 0.05, max: 0.35, step: 0.01, default: 0.22 }
  ],
  presets: [
    { label: ' Subamortiguado Estándar', values: { k: 20, mass: 1.2, damping: 0.08, amp0: 0.22 } },
    { label: 'Resorte Rígido (Alta Frecuencia)', values: { k: 55, mass: 0.6, damping: 0.05, amp0: 0.18 } },
    { label: 'Armónico Ideal (Sin Roce)', values: { k: 25, mass: 1.0, damping: 0.0, amp0: 0.25 } },
    { label: 'Amortiguamiento Crítico', values: { k: 15, mass: 1.5, damping: 1.8, amp0: 0.30 } }
  ],
  initState(params) {
    return { y: params.amp0 || 0.22, v: 0.0, t: 0 };
  },
  step(state, params, dt) {
    state.t += dt;
    const m = Math.max(0.1, params.mass || 1.2);
    const k = params.k || 20;
    const b = params.damping !== undefined ? params.damping : 0.1;

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

    const matBase = new THREE.MeshStandardMaterial({ color: 0x0f141c, metalness: 0.8, roughness: 0.2 });
    const matCyan = new THREE.MeshStandardMaterial({ color: 0x00f2fe, emissive: 0x00f2fe, emissiveIntensity: 0.65, metalness: 0.3, roughness: 0.2 });
    const matBlue = new THREE.MeshStandardMaterial({ color: 0x4facfe, emissive: 0x4facfe, emissiveIntensity: 0.45, metalness: 0.5, roughness: 0.2 });
    const matSteel = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.15 });
    const matGreen = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.5 });

    // Base
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.5), matBase);
    base.position.set(0, 0.025, 0);
    group.add(base);

    const trim = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.015, 0.52), matCyan);
    trim.position.set(0, 0.052, 0);
    group.add(trim);

    // Gantry Frame (Marco Doble)
    const H_top = 1.25;
    const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, H_top, 16), matSteel);
    postL.position.set(-0.28, H_top / 2, 0);
    const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, H_top, 16), matSteel);
    postR.position.set(0.28, H_top / 2, 0);
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.06, 0.08), matBase);
    topBar.position.set(0, H_top, 0);
    group.add(postL, postR, topBar);

    // Equilibrium Laser Line (y_eq = 0.62)
    const yEq = 0.62;
    const eqLine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 0.54, 8),
      new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.65 })
    );
    eqLine.rotation.z = Math.PI / 2;
    eqLine.position.set(0, yEq, 0);
    group.add(eqLine);

    // Helical Spring made of 16 Torus Coils stacked inside a scalable container
    const springContainer = new THREE.Group();
    springContainer.position.set(0, H_top - 0.03, 0);
    group.add(springContainer);

    const numCoils = 14;
    for (let i = 0; i < numCoils; i++) {
      const coil = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.009, 10, 24), i % 2 === 0 ? matCyan : matBlue);
      coil.rotation.x = Math.PI / 2 + 0.14;
      coil.position.y = -((i + 0.5) / numCoils); // Normalized from 0 to -1
      springContainer.add(coil);
    }

    // Mass Block
    const massGroup = new THREE.Group();
    group.add(massGroup);

    const cube = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.18, 0.20), matCyan);
    massGroup.add(cube);

    const pointer = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.08, 12), matGreen);
    pointer.rotation.z = Math.PI / 2;
    pointer.position.set(-0.14, 0, 0);
    massGroup.add(pointer);

    return {
      group,
      update(state, p) {
        const disp = Math.max(-0.38, Math.min(0.38, state.y || 0));
        const currentY = yEq - disp; // Positive elongation downwards
        const springLen = Math.max(0.15, (H_top - 0.03) - (currentY + 0.09));

        springContainer.scale.set(1, springLen, 1);

        const mScale = 0.8 + 0.15 * Math.cbrt(p.mass || 1.2);
        massGroup.scale.setScalar(mScale);
        massGroup.position.set(0, currentY, 0);
      }
    };
  },
  getMetrics(state, params) {
    const k = params.k || 20;
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
      { label: 'Energía Total (E)', value: E.toFixed(2) + ' J' }
    ];
  },
  questions: [
    {
      q: 'Según la Ley de Hooke (F = -k·y), ¿qué indica el signo negativo en la ecuación?',
      options: [
        'A) Que la masa siempre disminuye',
        'B) Que la fuerza elástica es restauradora y apunta siempre hacia la posición de equilibrio',
        'C) Que la energía potencial es negativa',
        'D) Que la constante k es menor que cero'
      ],
      answer: 1
    },
    {
      q: 'Si cuadruplicamos la constante elástica k del resorte manteniendo la misma masa m, ¿qué ocurre con el período T?',
      options: [
        'A) Se duplica (2T)',
        'B) Se reduce a la mitad (T/2)',
        'C) No varía',
        'D) Aumenta cuatro veces'
      ],
      answer: 1
    }
  ]
};
