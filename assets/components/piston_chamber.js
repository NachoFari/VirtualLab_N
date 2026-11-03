// Componente 3D Reutilizable: Cámara Cilíndrica Transparente con Émbolo Móvil
window.VLabComponents = window.VLabComponents || {};
window.VLabComponents.PistonChamber = {
  create(THREE, opts = {}) {
    const radius = opts.radius || 0.25;
    const maxHeight = opts.height || 0.9;
    const group = new THREE.Group();

    const glassMat = new THREE.MeshStandardMaterial({ color: 0x4facfe, transparent: true, opacity: 0.22, roughness: 0.1, side: THREE.DoubleSide });
    const pistonMat = new THREE.MeshStandardMaterial({ color: 0x00f2fe, metalness: 0.8, roughness: 0.2 });

    const wall = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, maxHeight, 24, 1, true), glassMat);
    wall.position.y = maxHeight / 2;
    group.add(wall);

    const piston = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.96, radius * 0.96, 0.05, 24), pistonMat);
    piston.position.y = maxHeight * 0.6;
    group.add(piston);

    return {
      group,
      piston,
      setPistonHeight(h) { piston.position.y = Math.max(0.15, Math.min(maxHeight - 0.05, h)); }
    };
  }
};
