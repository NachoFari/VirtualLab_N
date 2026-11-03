window.VLabExperiments = window.VLabExperiments || {};
window.VLabExperiments['MAT-01'] = {
  id: 'MAT-01',
  title: 'Graficador de Superficies 3D z = f(x,y,t)',
  block: 'K',
  category: 'Cálculo Multivariable',
  formula: 'z = f(x, y, t)   [r = √(x² + y²)]',
  description: 'Selecciona una función del catálogo académico o escribe cualquier expresión matemática en términos de (x, y, t, r) para visualizar la superficie tridimensional en tiempo real.',
  hasCustomFormulaInput: true,
  hasImpulse: false, // Oculta el botón de Impulso (no aplica a superficies matemáticas)
  defaultFormula: 'A * sin(k * r - w * t) / (1 + 0.35 * r)',
  exampleFunctions: [
    {
      name: '1. Onda Circular Amortiguada (Sinc Radial)',
      expr: 'A * sin(k * r - w * t) / (1 + 0.35 * r)',
      params: { A: 0.50, k: 2.8, w: 3.0, domain: 3.5 }
    },
    {
      name: '2. Paraboloide Hiperbólico (Silla de Montar)',
      expr: '0.12 * A * (x^2 - y^2) * cos(0.5 * w * t)',
      params: { A: 0.65, k: 2.0, w: 2.0, domain: 3.0 }
    },
    {
      name: '3. Paraboloide Elíptico (Cuenco 3D)',
      expr: '0.12 * A * (x^2 + y^2) - 0.35',
      params: { A: 0.60, k: 2.0, w: 0.0, domain: 3.0 }
    },
    {
      name: '4. Campana de Gauss Bidimensional',
      expr: 'A * exp(-0.4 * (x^2 + y^2)) * cos(w * t)',
      params: { A: 0.55, k: 2.0, w: 2.5, domain: 3.0 }
    },
    {
      name: '5. Interferencia de Dos Fuentes Coherentes',
      expr: '0.5 * A * (sin(k * sqrt((x-1.2)^2 + y^2) - w*t) + sin(k * sqrt((x+1.2)^2 + y^2) - w*t))',
      params: { A: 0.45, k: 3.0, w: 3.0, domain: 3.5 }
    },
    {
      name: '6. Modo Normal de Membrana Cuadrada ( Ondas Estacionarias )',
      expr: 'A * sin(0.8 * k * x) * cos(0.8 * k * y) * cos(w * t)',
      params: { A: 0.45, k: 1.5, w: 2.5, domain: 3.0 }
    },
    {
      name: '7. Dipolo / Gradiente de Campana (x · exp(-r²))',
      expr: '1.2 * A * x * exp(-0.45 * (x^2 + y^2)) * cos(0.6 * w * t)',
      params: { A: 0.55, k: 2.0, w: 2.0, domain: 3.0 }
    },
    {
      name: '8. Superficie Espiral / Fase Helicoidal',
      expr: '0.35 * A * sin(2 * atan2(y, x) + k * r - w * t)',
      params: { A: 0.55, k: 2.2, w: 2.8, domain: 3.2 }
    }
  ],
  params: [
    { key: 'A', label: 'Escala Vertical / Amplitud (A)', unit: '', min: 0.1, max: 1.0, step: 0.05, default: 0.50 },
    { key: 'k', label: 'Frecuencia Espacial (k)', unit: 'rad/u', min: 0.5, max: 5.0, step: 0.25, default: 2.8 },
    { key: 'w', label: 'Velocidad Temporal (ω)', unit: 'rad/s', min: 0.0, max: 6.0, step: 0.5, default: 3.0 },
    { key: 'domain', label: 'Dominio de Graficación (±X, ±Y)', unit: 'u', min: 1.5, max: 5.0, step: 0.5, default: 3.5 }
  ],
  presets: [
    {
      label: 'Onda Circular Sinc',
      formula: 'A * sin(k * r - w * t) / (1 + 0.35 * r)',
      values: { A: 0.50, k: 2.8, w: 3.0, domain: 3.5 }
    },
    {
      label: 'Silla de Montar (x² - y²)',
      formula: '0.12 * A * (x^2 - y^2) * cos(0.5 * w * t)',
      values: { A: 0.65, k: 2.0, w: 2.0, domain: 3.0 }
    },
    {
      label: 'Interferencia Doble',
      formula: '0.5 * A * (sin(k * sqrt((x-1.2)^2 + y^2) - w*t) + sin(k * sqrt((x+1.2)^2 + y^2) - w*t))',
      values: { A: 0.45, k: 3.0, w: 3.0, domain: 3.5 }
    },
    {
      label: 'Campana de Gauss',
      formula: 'A * exp(-0.4 * (x^2 + y^2)) * cos(w * t)',
      values: { A: 0.55, k: 2.0, w: 2.5, domain: 3.0 }
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
  createScene(THREE, components, params) {
    const group = new THREE.Group();

    const matBase = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.5, roughness: 0.5 });

    // Marco base sobrio
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.04, 1.18), matBase);
    base.position.set(0, 0.02, 0);
    group.add(base);

    // Ejes Coordenados (X: Rojo tenue, Y: Azul tenue, Z: Verde tenue vertical)
    const axisY = 0.56;
    const xAxis = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 1.18, 8), new THREE.MeshBasicMaterial({ color: 0xf87171 }));
    xAxis.rotation.z = Math.PI / 2;
    xAxis.position.set(0, axisY, 0);
    group.add(xAxis);

    const yAxis = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 1.18, 8), new THREE.MeshBasicMaterial({ color: 0x60a5fa }));
    yAxis.rotation.x = Math.PI / 2;
    yAxis.position.set(0, axisY, 0);
    group.add(yAxis);

    const zAxis = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.96, 8), new THREE.MeshBasicMaterial({ color: 0x34d399 }));
    zAxis.position.set(0, axisY, 0);
    group.add(zAxis);

    // Malla Paramétrica de Alta Resolución (48x48)
    const res = 48;
    const size = 1.12;
    const geo = new THREE.PlaneGeometry(size, size, res, res);
    geo.rotateX(-Math.PI / 2);

    const count = geo.attributes.position.count;
    const colors = new Float32Array(count * 3);
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const surfMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.35,
      metalness: 0.15
    });
    const surfMesh = new THREE.Mesh(geo, surfMat);
    surfMesh.position.y = axisY;
    group.add(surfMesh);

    const wireMat = new THREE.MeshBasicMaterial({ color: 0x1e293b, wireframe: true, transparent: true, opacity: 0.28 });
    const wireMesh = new THREE.Mesh(geo, wireMat);
    wireMesh.position.y = axisY + 0.0015;
    group.add(wireMesh);

    return {
      group,
      update(state, p) {
        const exprStr = (p.formulaExpr && p.formulaExpr.trim()) ? p.formulaExpr : (state.expr || 'A * sin(k * r - w * t) / (1 + 0.35 * r)');
        if (state.lastExpr !== exprStr || !state.compiledFn) {
          state.lastExpr = exprStr;
          state.compiledFn = components.MathParser.compile(exprStr);
        }

        const evalFn = state.compiledFn;
        const A = p.A !== undefined ? p.A : 0.50;
        const k = p.k !== undefined ? p.k : 2.8;
        const w = p.w !== undefined ? p.w : 3.0;
        const dom = p.domain !== undefined ? p.domain : 3.5;

        const pos = geo.attributes.position;
        const col = geo.attributes.color;
        let zMin = Infinity, zMax = -Infinity;

        for (let i = 0; i < pos.count; i++) {
          const vx = pos.getX(i);
          const vz = pos.getZ(i);
          const x = (vx / (size / 2)) * dom;
          const y = (vz / (size / 2)) * dom;
          let z = evalFn(x, y, state.t || 0, A, k, w, 1.0);
          z = Math.max(-0.48, Math.min(0.48, z));
          pos.setY(i, z);

          if (z < zMin) zMin = z;
          if (z > zMax) zMax = z;

          // Mapa de calor científico tipo Viridis/Académico (Índigo -> Azul -> Verde Esmeralda -> Ámbar suave)
          const norm = Math.max(0, Math.min(1, (z + 0.40) / 0.80));
          if (norm < 0.5) {
            const u = norm * 2;
            col.setXYZ(i, 0.22 * (1 - u) + 0.12 * u, 0.25 * (1 - u) + 0.58 * u, 0.65 * (1 - u) + 0.85 * u);
          } else {
            const u = (norm - 0.5) * 2;
            col.setXYZ(i, 0.12 * (1 - u) + 0.20 * u, 0.58 * (1 - u) + 0.82 * u, 0.85 * (1 - u) + 0.55 * u);
          }
        }
        pos.needsUpdate = true;
        col.needsUpdate = true;
        geo.computeVertexNormals();

        state.zMin = zMin;
        state.zMax = zMax;
        state.zOrigin = evalFn(0, 0, state.t || 0, A, k, w, 1.0);
      }
    };
  },
  getMetrics(state, params) {
    const exprStr = params.formulaExpr || state.expr || this.defaultFormula;
    const z0 = state.zOrigin !== undefined ? state.zOrigin.toFixed(3) : '0.000';
    const zMax = state.zMax !== undefined ? state.zMax.toFixed(3) : '0.450';
    const zMin = state.zMin !== undefined ? state.zMin.toFixed(3) : '-0.450';
    return [
      { label: 'Expresión Activa', value: exprStr.length > 24 ? exprStr.substring(0, 24) + '…' : exprStr },
      { label: 'Valor en f(0, 0, t)', value: z0 },
      { label: 'Máximo / Mínimo Z', value: `${zMax} / ${zMin}` },
      { label: 'Dominio XY', value: `[-${params.domain || 3.5}, +${params.domain || 3.5}]` }
    ];
  }
};
