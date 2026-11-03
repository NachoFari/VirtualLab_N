// Componente 3D Reutilizable: Sensor Dinamométrico Digital y Resorte Helicoidal
window.VLabComponents = window.VLabComponents || {};
window.VLabComponents.ForceSensor = {
  create(THREE, opts = {}) {
    const group = new THREE.Group();
    const caseMat = new THREE.MeshStandardMaterial({ color: 0x0f141c, metalness: 0.7, roughness: 0.3 });
    const barMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });

    const box = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 0.08), caseMat);
    group.add(box);

    const indicator = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.09), barMat);
    group.add(indicator);

    return {
      group,
      setForceRatio(r) {
        const clamped = Math.max(0, Math.min(1, r));
        indicator.position.y = 0.08 - clamped * 0.16;
      }
    };
  }
};
