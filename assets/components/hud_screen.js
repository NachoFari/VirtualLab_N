// Componente 3D Reutilizable: Pantalla Holográfica Flotante 3D Estilo Natex
window.VLabComponents = window.VLabComponents || {};
window.VLabComponents.HudScreen = {
  create(THREE, opts = {}) {
    const w = opts.width || 0.5;
    const h = opts.height || 0.3;
    const group = new THREE.Group();

    const glassMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe, transparent: true, opacity: 0.12, side: THREE.DoubleSide });
    const borderMat = new THREE.LineBasicMaterial({ color: 0x00f2fe });

    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassMat);
    group.add(plane);

    const edges = new THREE.EdgesGeometry(new THREE.PlaneGeometry(w, h));
    group.add(new THREE.LineSegments(edges, borderMat));

    return { group };
  }
};
