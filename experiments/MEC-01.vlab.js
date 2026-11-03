window.VLabExperiments = window.VLabExperiments || {};
window.VLabExperiments['MEC-01'] = {
  id: 'MEC-01',
  title: 'Péndulo Simple y Conservación de Energía',
  block: 'A',
  category: 'Mecánica Clásica',
  formula: 'T = 2π √(L / g)  ;  θ̈ + γ·θ̇ + (g/L)·sin(θ) = 0',
  description: 'Puedes arrastrar la esfera directamente con el mouse/dedo para soltarla desde cualquier ángulo inicial, o ajustar la longitud L, masa m y gravedad g.',
  hasImpulse: true,
  params: [
    { key: 'length', label: 'Longitud de Cuerda (L)', unit: 'm', min: 0.25, max: 1.8, step: 0.05, default: 0.75 },
    { key: 'mass', label: 'Masa de la Esfera (m)', unit: 'kg', min: 0.2, max: 5.0, step: 0.1, default: 1.0 },
    { key: 'gravity', label: 'Gravedad (g)', unit: 'm/s²', min: 0.0, max: 25.0, step: 0.1, default: 9.8 },
    { key: 'friction', label: 'Amortiguamiento (γ)', unit: 's⁻¹', min: 0.0, max: 0.4, step: 0.01, default: 0.02 }
  ],
  presets: [
    { label: 'Tierra (9.8 m/s²)', values: { length: 0.75, mass: 1.0, gravity: 9.8, friction: 0.02 } },
    { label: 'Luna (1.62 m/s²)', values: { length: 0.75, mass: 1.0, gravity: 1.62, friction: 0.0 } },
    { label: 'Júpiter (24.79 m/s²)', values: { length: 0.75, mass: 1.5, gravity: 24.79, friction: 0.04 } },
    { label: 'Cuerda Larga Ideal', values: { length: 1.40, mass: 2.0, gravity: 9.8, friction: 0.0 } }
  ],
  initState(params) {
    return { theta: Math.PI / 4.5, omega: 0.0, t: 0, isDraggingObject: false };
  },
  step(state, params, dt) {
    if (state.isDraggingObject) return;
    state.t += dt;
    const L = Math.max(0.2, params.length || 0.75);
    const g = params.gravity !== undefined ? params.gravity : 9.8;
    const gamma = params.friction !== undefined ? params.friction : 0.02;

    const f1 = (th, om) => om;
    const f2 = (th, om) => -(g / L) * Math.sin(th) - gamma * om;

    const k1_th = f1(state.theta, state.omega);
    const k1_om = f2(state.theta, state.omega);

    const k2_th = f1(state.theta + 0.5 * dt * k1_th, state.omega + 0.5 * dt * k1_om);
    const k2_om = f2(state.theta + 0.5 * dt * k1_th, state.omega + 0.5 * dt * k1_om);

    const k3_th = f1(state.theta + 0.5 * dt * k2_th, state.omega + 0.5 * dt * k2_om);
    const k3_om = f2(state.theta + 0.5 * dt * k2_th, state.omega + 0.5 * dt * k2_om);

    const k4_th = f1(state.theta + dt * k3_th, state.omega + dt * k3_om);
    const k4_om = f2(state.theta + dt * k3_th, state.omega + dt * k3_om);

    state.theta += (dt / 6) * (k1_th + 2 * k2_th + 2 * k3_th + k4_th);
    state.omega += (dt / 6) * (k1_om + 2 * k2_om + 2 * k3_om + k4_om);
  },
  onPush(state) {
    if (Math.abs(state.theta) < 0.08 && Math.abs(state.omega) < 0.08) {
      state.theta = Math.PI / 4;
      state.omega = 1.4;
    } else {
      const dir = state.omega >= 0 ? 1 : -1;
      state.omega += dir * 2.0;
    }
  },
  createScene(THREE, components, params) {
    const group = new THREE.Group();

    const matBase = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.6, roughness: 0.4 });
    const matSteel = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.25 });
    const matBrass = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.4, roughness: 0.2 });
    const matCord = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });

    // Base Plate
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.04, 0.45), matBase);
    base.position.set(0, 0.02, 0);
    group.add(base);

    // Telescopic Mast at the back (Z = -0.18)
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 20), matSteel);
    group.add(mast);

    // Clamp & Horizontal Arm towards Z = 0
    const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.065, 0.065), matBase);
    group.add(clamp);

    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.20, 16), matSteel);
    arm.rotation.x = Math.PI / 2;
    group.add(arm);

    // Pendulum Pivot
    const pivot = new THREE.Group();
    group.add(pivot);

    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1.0, 12), matCord);
    pivot.add(rod);

    const bob = new THREE.Mesh(new THREE.SphereGeometry(0.105, 32, 32), matBrass);
    bob.userData.isDraggable = true;
    pivot.add(bob);

    // Equilibrium reference mark on base
    const eqRing = new THREE.Mesh(
      new THREE.RingGeometry(0.04, 0.055, 32),
      new THREE.MeshBasicMaterial({ color: 0x64748b, side: THREE.DoubleSide })
    );
    eqRing.rotation.x = -Math.PI / 2;
    eqRing.position.set(0, 0.042, 0);
    group.add(eqRing);

    return {
      group,
      // Permite que el profesor o alumno tome la esfera con el mouse y la arrastre al ángulo deseado
      getInteractiveObjects() {
        return [bob, rod];
      },
      onDrag(worldPoint, state, p) {
        const len = Math.max(0.25, p.length || 0.75);
        const H = len + 0.35;
        const dx = worldPoint.x;
        const dy = worldPoint.y - H;
        let angle = Math.atan2(dx, -dy);
        angle = Math.max(-1.45, Math.min(1.45, angle));
        state.theta = angle;
        state.omega = 0;
        return { stateChanged: true };
      },
      update(state, p) {
        const len = Math.max(0.25, p.length || 0.75);
        const H = len + 0.35;

        mast.scale.set(1, H, 1);
        mast.position.set(0, H / 2, -0.18);

        clamp.position.set(0, H, -0.18);
        arm.position.set(0, H, -0.09);

        pivot.position.set(0, H, 0);
        pivot.rotation.z = state.theta || 0;

        rod.scale.set(1, len, 1);
        rod.position.set(0, -len / 2, 0);

        const mScale = Math.cbrt(Math.max(0.2, p.mass || 1.0));
        bob.scale.setScalar(mScale);
        bob.position.set(0, -len, 0);
      }
    };
  },
  getMetrics(state, params) {
    const len = Math.max(0.25, params.length || 0.75);
    const g = params.gravity !== undefined ? params.gravity : 9.8;
    const m = params.mass || 1.0;
    const deg = ((state.theta || 0) * 180) / Math.PI;
    const omega = state.omega || 0;
    const period = g > 0.01 ? (2 * Math.PI * Math.sqrt(len / g)).toFixed(2) + ' s' : '∞';
    const Ek = 0.5 * m * Math.pow(len * omega, 2);
    const Ep = m * g * len * (1 - Math.cos(state.theta || 0));
    return [
      { label: 'Ángulo (θ)', value: deg.toFixed(1) + '°' },
      { label: 'Vel. Angular (ω)', value: omega.toFixed(2) + ' rad/s' },
      { label: 'Período Teórico (T)', value: period },
      { label: 'Energía Mecánica (E)', value: (Ek + Ep).toFixed(2) + ' J' }
    ];
  }
};
