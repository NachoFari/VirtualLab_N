// Componente 3D Reutilizable: Malla Paramétrica GPU Deformable con Gradiente Cromático Natex
window.VLabComponents = window.VLabComponents || {};
window.VLabComponents.SurfaceGrid = {
  create(THREE, res = 40, size = 1.1) {
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
      metalness: 0.3,
      wireframe: false
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
          z = Math.max(-0.55, Math.min(0.55, z));
          pos.setY(i, z);

          // Natex gradient: Purple (-0.4) -> Electric Blue (0) -> Cyan Glow (+0.25) -> White/Green (+0.45)
          const norm = Math.max(0, Math.min(1, (z + 0.4) / 0.8));
          if (norm < 0.5) {
            const u = norm * 2;
            col.setXYZ(i, 0.35 * (1 - u) + 0.0 * u, 0.15 * (1 - u) + 0.65 * u, 0.85 * (1 - u) + 1.0 * u);
          } else {
            const u = (norm - 0.5) * 2;
            col.setXYZ(i, 0.0 * (1 - u) + 0.4 * u, 0.65 * (1 - u) + 1.0 * u, 1.0);
          }
        }
        pos.needsUpdate = true;
        col.needsUpdate = true;
        geo.computeVertexNormals();
      }
    };
  }
};
