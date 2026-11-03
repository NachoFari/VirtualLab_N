// Componente 3D Reutilizable: Banco Óptico Graduado con Jinetillos Móviles
window.VLabComponents = window.VLabComponents || {};
window.VLabComponents.OpticalBench = {
  create(THREE, opts = {}) {
    const length = opts.length || 1.2;
    const group = new THREE.Group();

    const railMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.2 });
    const cyanMat = new THREE.MeshStandardMaterial({ color: 0x00f2fe, emissive: 0x00f2fe, emissiveIntensity: 0.5 });

    const rail = new THREE.Mesh(new THREE.BoxGeometry(length, 0.05, 0.16), railMat);
    rail.position.set(0, 0.04, 0);
    group.add(rail);

    const line = new THREE.Mesh(new THREE.BoxGeometry(length, 0.01, 0.015), cyanMat);
    line.position.set(0, 0.068, 0.07);
    group.add(line);

    return { group };
  }
};
