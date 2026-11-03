// Bundle Unificado de Componentes 3D Reutilizables de VirtualLab_N (Cero Latencia de Red)
(function() {
  window.VLabComponents = window.VLabComponents || {};

  // Evaluador Matemático Seguro
  window.VLabComponents.MathParser = {
    compile(exprStr) {
      try {
        let clean = String(exprStr || 'A * sin(k*r - w*t) / (r + 0.35)')
          .toLowerCase()
          .replace(/\^/g, '**')
          .replace(/\b(sin|cos|tan|asin|acos|atan|atan2|sinh|cosh|tanh|exp|log|sqrt|abs|floor|ceil|round|min|max)\b/g, 'Math.$1')
          .replace(/\bpi\b/g, 'Math.PI');
        const fn = new Function('x', 'y', 't', 'A', 'k', 'w', 'sigma', `
          const r = Math.sqrt(x*x + y*y);
          const theta = Math.atan2(y, x);
          const e = Math.E;
          try {
            const val = (${clean});
            return Number.isFinite(val) ? val : 0;
          } catch(err) { return 0; }
        `);
        fn(0.1, 0.1, 0, 1, 1, 1, 1);
        return fn;
      } catch (e) {
        return (x, y, t, A = 0.4, k = 3, w = 2) => {
          const r = Math.sqrt(x * x + y * y);
          return A * Math.sin(k * r - w * t) / (r + 0.35);
        };
      }
    }
  };

  // Malla 3D Paramétrica para Funciones z = f(x, y, t)
  window.VLabComponents.SurfaceGrid = {
    create(THREE, res = 42, size = 1.1) {
      const group = new THREE.Group();
      const geo = new THREE.PlaneGeometry(size, size, res, res);
      geo.rotateX(-Math.PI / 2);

      const count = geo.attributes.position.count;
      const colors = new Float32Array(count * 3);
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const mat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        roughness: 0.25,
        metalness: 0.3
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = 0.55;
      group.add(mesh);

      const wireMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe, wireframe: true, transparent: true, opacity: 0.22 });
      const wireMesh = new THREE.Mesh(geo, wireMat);
      wireMesh.position.y = 0.551;
      group.add(wireMesh);

      return {
        group,
        mesh,
        wireMesh,
        geo,
        updateSurface(evalFn, t, A, k, w, sigma, domainScale = 2.5) {
          const pos = geo.attributes.position;
          const col = geo.attributes.color;
          for (let i = 0; i < pos.count; i++) {
            const vx = pos.getX(i);
            const vz = pos.getZ(i);
            const x = (vx / (size / 2)) * domainScale;
            const y = (vz / (size / 2)) * domainScale;
            let z = evalFn(x, y, t, A, k, w, sigma);
            z = Math.max(-0.5, Math.min(0.5, z));
            pos.setY(i, z);

            const norm = Math.max(0, Math.min(1, (z + 0.4) / 0.8));
            if (norm < 0.5) {
              const u = norm * 2;
              col.setXYZ(i, 0.4 * (1 - u), 0.15 * (1 - u) + 0.65 * u, 0.85 * (1 - u) + 1.0 * u);
            } else {
              const u = (norm - 0.5) * 2;
              col.setXYZ(i, 0.4 * u, 0.65 * (1 - u) + 1.0 * u, 1.0);
            }
          }
          pos.needsUpdate = true;
          col.needsUpdate = true;
          geo.computeVertexNormals();
        }
      };
    }
  };
})();
