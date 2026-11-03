window.VLabExperiments = window.VLabExperiments || {};
window.VLabExperiments['MAT-01'] = {
  id: 'MAT-01',
  title: 'Visor Holográfico de Funciones 3D z = f(x,y,t)',
  block: 'K',
  category: 'Matemáticas y Campos 3D',
  formula: 'z(x, y, t) = A · f(k·x, k·y, ω·t)   [r = √(x² + y²)]',
  description: 'Graficador holográfico multivariable en tiempo real. El docente puede escribir cualquier expresión matemática f(x, y, t, r, theta) o elegir un preset y toda la clase verá la malla 3D deformarse en vivo a 60 FPS.',
  hasCustomFormulaInput: true,
  defaultFormula: 'A * sin(k * r - w * t) / (1 + 0.35 * r)',
  params: [
    { key: 'A', label: 'Amplitud Escalar (A)', unit: '', min: 0.1, max: 1.0, step: 0.05, default: 0.45 },
    { key: 'k', label: 'Frecuencia Espacial (k)', unit: 'rad/m', min: 0.5, max: 6.0, step: 0.25, default: 2.5 },
    { key: 'w', label: 'Velocidad Temporal (ω)', unit: 'rad/s', min: 0.0, max: 8.0, step: 0.5, default: 3.0 },
    { key: 'domain', label: 'Rango del Dominio (±X, ±Y)', unit: 'u', min: 1.5, max: 6.0, step: 0.5, default: 3.0 }
  ],
  presets: [
    {
      label: '🌊 Onda Esférica Sinc',
      formula: 'A * sin(k * r - w * t) / (1 + 0.35 * r)',
      values: { A: 0.48, k: 2.8, w: 3.5, domain: 3.5 }
    },
    {
      label: '🐎 Silla de Montar Hiperbólica',
      formula: '0.08 * A * (x^2 - y^2) * cos(w * t * 0.5)',
      values: { A: 0.65, k: 2.0, w: 2.5, domain: 3.0 }
    },
    {
      label: '⚛️ Interferencia de 2 Fuentes',
      formula: '0.5 * A * (sin(k * sqrt((x-1.2)^2 + y^2) - w*t) + sin(k * sqrt((x+1.2)^2 + y^2) - w*t))',
      values: { A: 0.42, k: 3.2, w: 3.5, domain: 3.5 }
    },
    {
      label: '🔔 Campana de Gauss Pulsante',
      formula: 'A * exp(-0.35 * (x^2 + y^2)) * cos(w * t)',
      values: { A: 0.52, k: 2.0, w: 3.0, domain: 3.0 }
    }
  ],
  initState(params) {
    return {
      t: 0,
      expr: this.defaultFormula,
      compiledFn: null,
      lastExpr: ''
    };
  },
  step(state, params, dt) {
    state.t += dt;
  },
  onPush(state) {
    state.t += 0.8;
  },
  createScene(THREE, components, params) {
    const group = new THREE.Group();

    const matBase = new THREE.MeshStandardMaterial({ color: 0x0f141c, metalness: 0.8, roughness: 0.2 });
    const matCyan = new THREE.MeshStandardMaterial({ color: 0x00f2fe, emissive: 0x00f2fe, emissiveIntensity: 0.6 });

    // Base Frame
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.05, 1.18), matBase);
    base.position.set(0, 0.025, 0);
    group.add(base);

    const trim = new THREE.Mesh(new THREE.BoxGeometry(1.20, 0.015, 1.20), matCyan);
    trim.position.set(0, 0.052, 0);
    group.add(trim);

    // Coordinate Axes (X: Cyan, Y: Blue, Z: Green vertical)
    const axisY = 0.58;
    const xAxis = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 1.15, 8), new THREE.MeshBasicMaterial({ color: 0x00f2fe }));
    xAxis.rotation.z = Math.PI / 2;
    xAxis.position.set(0, axisY, 0);
    group.add(xAxis);

    const yAxis = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 1.15, 8), new THREE.MeshBasicMaterial({ color: 0x4facfe }));
    yAxis.rotation.x = Math.PI / 2;
    yAxis.position.set(0, axisY, 0);
    group.add(yAxis);

    const zAxis = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.95, 8), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
    zAxis.position.set(0, axisY, 0);
    group.add(zAxis);

    // Parametric Surface Grid (44x44 vertices)
    const res = 44;
    const size = 1.08;
    const geo = new THREE.PlaneGeometry(size, size, res, res);
    geo.rotateX(-Math.PI / 2);

    const count = geo.attributes.position.count;
    const colors = new Float32Array(count * 3);
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const surfMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.22,
      metalness: 0.25
    });
    const surfMesh = new THREE.Mesh(geo, surfMat);
    surfMesh.position.y = axisY;
    group.add(surfMesh);

    const wireMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe, wireframe: true, transparent: true, opacity: 0.24 });
    const wireMesh = new THREE.Mesh(geo, wireMat);
    wireMesh.position.y = axisY + 0.002;
    group.add(wireMesh);

    return {
      group,
      update(state, p) {
        const exprStr = p.formulaExpr || state.expr || 'A * sin(k * r - w * t) / (1 + 0.35 * r)';
        if (state.lastExpr !== exprStr || !state.compiledFn) {
          state.lastExpr = exprStr;
          state.compiledFn = components.MathParser.compile(exprStr);
        }

        const evalFn = state.compiledFn;
        const A = p.A !== undefined ? p.A : 0.45;
        const k = p.k !== undefined ? p.k : 2.5;
        const w = p.w !== undefined ? p.w : 3.0;
        const dom = p.domain !== undefined ? p.domain : 3.0;

        const pos = geo.attributes.position;
        const col = geo.attributes.color;
        let zMin = Infinity, zMax = -Infinity;

        for (let i = 0; i < pos.count; i++) {
          const vx = pos.getX(i);
          const vz = pos.getZ(i);
          const x = (vx / (size / 2)) * dom;
          const y = (vz / (size / 2)) * dom;
          let z = evalFn(x, y, state.t, A, k, w, 1.0);
          z = Math.max(-0.48, Math.min(0.48, z));
          pos.setY(i, z);

          if (z < zMin) zMin = z;
          if (z > zMax) zMax = z;

          const norm = Math.max(0, Math.min(1, (z + 0.42) / 0.84));
          if (norm < 0.5) {
            const u = norm * 2;
            col.setXYZ(i, 0.42 * (1 - u), 0.15 * (1 - u) + 0.68 * u, 0.88 * (1 - u) + 1.0 * u);
          } else {
            const u = (norm - 0.5) * 2;
            col.setXYZ(i, 0.1 * u, 0.68 * (1 - u) + 1.0 * u, 1.0 * (1 - u) + 0.65 * u);
          }
        }
        pos.needsUpdate = true;
        col.needsUpdate = true;
        geo.computeVertexNormals();

        state.zMin = zMin;
        state.zMax = zMax;
        state.zOrigin = evalFn(0, 0, state.t, A, k, w, 1.0);
      }
    };
  },
  getMetrics(state, params) {
    const exprStr = params.formulaExpr || state.expr || this.defaultFormula;
    const z0 = state.zOrigin !== undefined ? state.zOrigin.toFixed(3) : '0.000';
    const zMax = state.zMax !== undefined ? state.zMax.toFixed(3) : '0.450';
    const zMin = state.zMin !== undefined ? state.zMin.toFixed(3) : '-0.450';
    return [
      { label: 'Función Activa', value: exprStr.length > 22 ? exprStr.substring(0, 22) + '…' : exprStr },
      { label: 'Valor en Origen f(0,0,t)', value: z0 },
      { label: 'Cota Máxima / Mínima', value: `${zMax} / ${zMin}` },
      { label: 'Malla GPU Activa', value: '45×45 (2,025 vértices)' }
    ];
  },
  questions: [
    {
      q: 'En una onda circular bidimensional z = A·sin(k·r - ω·t), ¿qué representa la coordenada radial r?',
      options: [
        'A) La distancia al origen en el plano XY: r = √(x² + y²)',
        'B) La derivada parcial respecto al tiempo',
        'C) El producto x · y',
        'D) La altura fija del eje Z'
      ],
      answer: 0
    },
    {
      q: '¿Qué tipo de superficie cuádrica describe la ecuación z = x² - y² en el origen (0,0)?',
      options: [
        'A) Una esfera cerrada',
        'B) Un paraboloide hiperbólico con punto de silla (Silla de Montar)',
        'C) Un plano horizontal constante',
        'D) Un cilindro circular recto'
      ],
      answer: 1
    }
  ]
};
