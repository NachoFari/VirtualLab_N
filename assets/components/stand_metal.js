// Componente 3D Reutilizable: Soporte Universal de Hierro Fundido con Mástil Telescópico
window.VLabComponents = window.VLabComponents || {};
window.VLabComponents.StandMetal = {
  create(THREE, opts = {}) {
    const height = opts.height || 1.2;
    const width = opts.width || 0.7;
    const depth = opts.depth || 0.4;
    const group = new THREE.Group();

    const baseMat = new THREE.MeshStandardMaterial({ color: 0x0f141c, metalness: 0.8, roughness: 0.2 });
    const cyanMat = new THREE.MeshStandardMaterial({ color: 0x00f2fe, emissive: 0x00f2fe, emissiveIntensity: 0.6 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.15 });

    const base = new THREE.Mesh(new THREE.BoxGeometry(width, 0.06, depth), baseMat);
    base.position.set(0, 0.03, 0);
    group.add(base);

    const trim = new THREE.Mesh(new THREE.BoxGeometry(width + 0.02, 0.015, depth + 0.02), cyanMat);
    trim.position.set(0, 0.03, 0);
    group.add(trim);

    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1, 16), steelMat);
    mast.scale.set(1, height, 1);
    mast.position.set(0, height / 2, -0.2);
    group.add(mast);

    const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), cyanMat);
    clamp.position.set(0, height, -0.2);
    group.add(clamp);

    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.22, 12), steelMat);
    arm.rotation.x = Math.PI / 2;
    arm.position.set(0, height, -0.1);
    group.add(arm);

    return {
      group,
      setHeight(newH) {
        mast.scale.set(1, newH, 1);
        mast.position.set(0, newH / 2, -0.2);
        clamp.position.set(0, newH, -0.2);
        arm.position.set(0, newH, -0.1);
      }
    };
  }
};
