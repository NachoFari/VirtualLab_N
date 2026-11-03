// Componente 3D Reutilizable: Regla Milimétrica y Transportador de Ángulos 3D
window.VLabComponents = window.VLabComponents || {};
window.VLabComponents.RulerProtractor = {
  create(THREE, opts = {}) {
    const group = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0x00f2fe, wireframe: true, transparent: true, opacity: 0.35 });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.25, 0.3, 24, 1, Math.PI, Math.PI), mat);
    group.add(ring);
    return { group };
  }
};
