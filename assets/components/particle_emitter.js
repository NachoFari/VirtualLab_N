// Componente 3D Reutilizable: Emisor de Partículas Optimizado para Gas, Arena o Electrones
window.VLabComponents = window.VLabComponents || {};
window.VLabComponents.ParticleEmitter = {
  create(THREE, count = 100, color = 0x00f2fe, size = 0.025) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.9 });
    const points = new THREE.Points(geo, mat);
    return {
      points,
      positions,
      update() { geo.attributes.position.needsUpdate = true; }
    };
  }
};
