// Componente 3D Reutilizable: Emisor de Haz Láser Volumétrico Colimado
window.VLabComponents = window.VLabComponents || {};
window.VLabComponents.LaserSource = {
  create(THREE, opts = {}) {
    const color = opts.color || 0x00f2fe;
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0f141c, metalness: 0.8, roughness: 0.2 });
    const glowMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });

    const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.18, 16), bodyMat);
    housing.rotation.z = Math.PI / 2;
    group.add(housing);

    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.0, 12), glowMat);
    beam.rotation.z = Math.PI / 2;
    beam.position.set(0.59, 0, 0);
    group.add(beam);

    return {
      group,
      beam,
      setColor(hex) { glowMat.color.setHex(hex); }
    };
  }
};
