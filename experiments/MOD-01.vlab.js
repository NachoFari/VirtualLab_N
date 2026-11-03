/**
 * VirtualLab_N - Experimento MOD-01
 * Átomo de Bohr y Transiciones Espectrales
 * Diseño académico minimalista - Slate / Zinc / Cobalt / Emerald / Ruby
 */

window.VLabExperiments = window.VLabExperiments || {};
window.VLabExperiments['MOD-01'] = {
  id: 'MOD-01',
  title: 'Átomo de Bohr y Transiciones Espectrales',
  block: 'D',
  category: 'Física Moderna y Cuántica',
  formula: 'Eₙ = -13.6 eV / n²   ;   ΔE = h·c / λ',
  description: 'Modelo cuántico 3D de Bohr con cuantización orbital L = n·ℏ y ondas de materia de De Broglie (n·λ = 2π·rₙ). Muestra los orbitales discretos n = 1 a 5, el electrón orbital y la emisión radiativa de un fotón con el color real del espectro electromagnético (Lyman, Balmer, Paschen). Pulsa Impulso para inducir el salto cuántico.',
  hasImpulse: true,
  params: [
    { key: 'nInit', label: 'Nivel Superior (nᵢ)', unit: '', min: 2, max: 5, step: 1, default: 3 },
    { key: 'nFinal', label: 'Nivel Inferior (n_f)', unit: '', min: 1, max: 4, step: 1, default: 2 },
    { key: 'showDeBroglie', label: 'Onda De Broglie (0/1)', unit: '', min: 0, max: 1, step: 1, default: 1 }
  ],
  presets: [
    { label: 'Balmer H-α Rojo (n=3 → n=2, 656.3 nm)', values: { nInit: 3, nFinal: 2, showDeBroglie: 1 } },
    { label: 'Balmer H-β Cian (n=4 → n=2, 486.1 nm)', values: { nInit: 4, nFinal: 2, showDeBroglie: 1 } },
    { label: 'Balmer H-γ Violeta (n=5 → n=2, 434.0 nm)', values: { nInit: 5, nFinal: 2, showDeBroglie: 1 } },
    { label: 'Serie Lyman UV (n=2 → n=1, 121.6 nm)', values: { nInit: 2, nFinal: 1, showDeBroglie: 1 } },
    { label: 'Serie Paschen IR (n=4 → n=3, 1875 nm)', values: { nInit: 4, nFinal: 3, showDeBroglie: 1 } }
  ],

  initState(params) {
    return {
      t: 0,
      electronAngle: 0,
      activeRadius: 0.51, // Para n=3
      targetRadius: 0.51,
      isEmitting: false,
      photonProgress: 0,
      photonAngle: 0,
      isDraggingObject: false
    };
  },

  step(state, params, dt) {
    state.t += dt;

    let ni = Math.max(2, Math.min(5, Math.round(params.nInit || 3)));
    let nf = Math.max(1, Math.min(4, Math.round(params.nFinal || 2)));
    if (nf >= ni) nf = ni - 1; // n_final siempre estrictamente menor que n_init para emisión radiativa

    const getRadius = (n) => 0.12 + 0.13 * n;

    // Velocidad orbital del electrón (disminuye con n según mecánica cuántica)
    const omega = 2.4 / (state.isEmitting ? nf : ni);
    state.electronAngle += omega * dt;

    // Progresión de la emisión del fotón
    if (state.isEmitting) {
      state.photonProgress += dt * 1.8;

      // Descenso del electrón al nivel final
      const rTarget = getRadius(nf);
      state.activeRadius += (rTarget - state.activeRadius) * Math.min(1.0, dt * 10);

      if (state.photonProgress > 2.2) {
        state.isEmitting = false;
        state.photonProgress = 0;
        state.activeRadius = getRadius(ni); // Recargar orbital para permitir nuevos saltos
      }
    } else {
      const rTarget = getRadius(ni);
      state.activeRadius += (rTarget - state.activeRadius) * Math.min(1.0, dt * 8);
    }
  },

  onPush(state, params) {
    state.isEmitting = true;
    state.photonProgress = 0;
    state.photonAngle = state.electronAngle;
  },

  createScene(THREE, components, params) {
    const group = new THREE.Group();
    const Y_CENTER = 0.58;

    // Función auxiliar de radio orbital
    const getRadius = (n) => 0.12 + 0.13 * n;

    // Materiales de laboratorio sobrio
    const matBase = new THREE.MeshStandardMaterial({ color: 0x12151d, metalness: 0.6, roughness: 0.4 });
    const matSteel = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.22 });
    const matDarkAlu = new THREE.MeshStandardMaterial({ color: 0x1e2433, metalness: 0.7, roughness: 0.3 });
    const matProton = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.6, roughness: 0.25 });
    const matNeutron = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7, roughness: 0.3 });
    const matElectron = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.3, roughness: 0.2 });

    // 1. Pedestal y Espectrómetro de Base
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.58, 0.04, 48), matBase);
    pedestal.position.set(0, 0.02, 0);
    group.add(pedestal);

    // Disco de referencia con graduación angular
    const diskBack = new THREE.Mesh(
      new THREE.RingGeometry(0.18, 0.82, 64),
      new THREE.MeshBasicMaterial({ color: 0x181e2b, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
    );
    diskBack.position.set(0, Y_CENTER, -0.015);
    group.add(diskBack);

    // 2. Núcleo Atómico Central (Clúster compacto de nucleones)
    const nucleusGroup = new THREE.Group();
    nucleusGroup.position.set(0, Y_CENTER, 0);
    group.add(nucleusGroup);

    const nucleonPositions = [
      [0, 0, 0],
      [0.018, 0.012, 0.008],
      [-0.016, -0.010, 0.012],
      [0.010, -0.018, -0.014],
      [-0.012, 0.016, -0.008],
      [0.002, 0.022, 0.014]
    ];

    nucleonPositions.forEach((pos, idx) => {
      const nMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.018, 16, 16),
        idx % 2 === 0 ? matProton : matNeutron
      );
      nMesh.position.set(pos[0], pos[1], pos[2]);
      nucleusGroup.add(nMesh);
    });

    // 3. Órbitas Cuantizadas Circulares (n = 1 a 5)
    const orbitMeshes = [];
    const orbitGroup = new THREE.Group();
    orbitGroup.position.set(0, Y_CENTER, 0);
    group.add(orbitGroup);

    for (let n = 1; n <= 5; n++) {
      const r = getRadius(n);
      const ringGeo = new THREE.RingGeometry(r - 0.002, r + 0.002, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x475569,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45
      });
      const oMesh = new THREE.Mesh(ringGeo, ringMat);
      oMesh.userData.isDraggable = true;
      oMesh.userData.orbitLevel = n;
      orbitGroup.add(oMesh);
      orbitMeshes.push(oMesh);
    }

    // 4. Onda Estacionaria de De Broglie (n crestas y valles cuantizados)
    const DE_BROGLIE_PTS = 120;
    const deBrogliePositions = new Float32Array((DE_BROGLIE_PTS + 1) * 3);
    const deBroglieGeo = new THREE.BufferGeometry();
    deBroglieGeo.setAttribute('position', new THREE.BufferAttribute(deBrogliePositions, 3));
    const deBroglieMat = new THREE.LineBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.85,
      linewidth: 2
    });
    const deBroglieLine = new THREE.Line(deBroglieGeo, deBroglieMat);
    deBroglieLine.position.set(0, Y_CENTER, 0.002);
    group.add(deBroglieLine);

    // 5. Electrón Orbital
    const electron = new THREE.Mesh(new THREE.SphereGeometry(0.020, 20, 20), matElectron);
    electron.renderOrder = 3;
    group.add(electron);

    // Halo sutil del electrón
    const electronGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.032, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 })
    );
    electron.add(electronGlow);

    // 6. Paquete de Onda (Fotón Emitido)
    const photonGroup = new THREE.Group();
    photonGroup.visible = false;
    group.add(photonGroup);

    const PHOTON_PTS = 40;
    const photonPositions = new Float32Array(PHOTON_PTS * 3);
    const photonGeo = new THREE.BufferGeometry();
    photonGeo.setAttribute('position', new THREE.BufferAttribute(photonPositions, 3));
    const photonMat = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 2 });
    const photonLine = new THREE.Line(photonGeo, photonMat);
    photonGroup.add(photonLine);

    // Cabeza de flecha del fotón
    const photonHead = new THREE.Mesh(
      new THREE.ConeGeometry(0.016, 0.04, 12),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    photonHead.rotation.z = -Math.PI / 2;
    photonGroup.add(photonHead);

    // Función auxiliar para color espectral real del fotón según longitud de onda en nm
    const getWavelengthColor = (lambdaNm) => {
      if (lambdaNm < 380) return 0x818cf8; // UV: Violeta claro
      if (lambdaNm < 440) return 0x7c3aed; // Violeta
      if (lambdaNm < 490) return 0x06b6d4; // Cian (H-beta 486.1 nm)
      if (lambdaNm < 560) return 0x10b981; // Verde
      if (lambdaNm < 600) return 0xf59e0b; // Amarillo / Ámbar
      if (lambdaNm < 720) return 0xef4444; // Rojo (H-alpha 656.3 nm)
      return 0x991b1b; // Infrarrojo: Rojo oscuro
    };

    return {
      group,
      getInteractiveObjects() {
        return orbitMeshes;
      },
      onDrag(worldPoint, state, p) {
        // Seleccionar nivel inicial al hacer clic / arrastrar sobre las órbitas
        const dx = worldPoint.x;
        const dy = worldPoint.y - Y_CENTER;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let bestN = 3;
        let minDiff = 999;
        for (let n = 2; n <= 5; n++) {
          const diff = Math.abs(dist - getRadius(n));
          if (diff < minDiff) {
            minDiff = diff;
            bestN = n;
          }
        }

        p.nInit = bestN;
        if (p.nFinal >= bestN) p.nFinal = bestN - 1;

        return { paramChanged: 'nInit', value: bestN };
      },
      update(state, p) {
        let ni = Math.max(2, Math.min(5, Math.round(p.nInit || 3)));
        let nf = Math.max(1, Math.min(4, Math.round(p.nFinal || 2)));
        if (nf >= ni) nf = ni - 1;

        const showDeBroglie = p.showDeBroglie !== undefined ? p.showDeBroglie : 1;

        // Cálculos cuánticos de energía y longitud de onda
        const eInitial = -13.606 / (ni * ni);
        const eFinal = -13.606 / (nf * nf);
        const deltaE = Math.abs(eInitial - eFinal);
        const lambdaNm = 1239.84 / Math.max(0.01, deltaE);
        const photonHex = getWavelengthColor(lambdaNm);

        // Resaltar órbitas concéntricas: azul para inicial, verde para final
        orbitMeshes.forEach((mesh, idx) => {
          const n = idx + 1;
          if (n === ni) {
            mesh.material.color.setHex(0x3b82f6);
            mesh.material.opacity = 0.95;
          } else if (n === nf) {
            mesh.material.color.setHex(0x10b981);
            mesh.material.opacity = 0.85;
          } else {
            mesh.material.color.setHex(0x475569);
            mesh.material.opacity = 0.35;
          }
        });

        // Posición del electrón
        const rCur = state.activeRadius || getRadius(ni);
        const ang = state.electronAngle || 0;
        const elX = rCur * Math.cos(ang);
        const elY = Y_CENTER + rCur * Math.sin(ang);
        electron.position.set(elX, elY, 0.005);

        // Onda Estacionaria de De Broglie
        const activeN = state.isEmitting ? nf : ni;
        if (showDeBroglie > 0.5) {
          deBroglieLine.visible = true;
          const posAttr = deBroglieGeo.attributes.position;
          const ampDb = 0.022;

          for (let i = 0; i <= DE_BROGLIE_PTS; i++) {
            const frac = i / DE_BROGLIE_PTS;
            const theta = frac * Math.PI * 2;
            const waveOffset = ampDb * Math.sin(activeN * theta - ang);
            const rWave = rCur + waveOffset;

            posAttr.setXYZ(i, rWave * Math.cos(theta), rWave * Math.sin(theta), 0.002);
          }
          posAttr.needsUpdate = true;
        } else {
          deBroglieLine.visible = false;
        }

        // Animación del Fotón Emitido
        if (state.isEmitting && state.photonProgress > 0) {
          photonGroup.visible = true;
          photonMat.color.setHex(photonHex);
          photonHead.material.color.setHex(photonHex);

          const baseRad = getRadius(nf);
          const distTravel = baseRad + state.photonProgress * 0.38;
          const pAngle = state.photonAngle || 0;

          // Posición de la cabeza del fotón
          const hX = distTravel * Math.cos(pAngle);
          const hY = Y_CENTER + distTravel * Math.sin(pAngle);
          photonHead.position.set(hX, hY, 0.005);
          photonHead.rotation.z = pAngle;

          // Perfil sinusoidal del paquete de onda
          const posPh = photonGeo.attributes.position;
          const waveLenVis = 0.07;
          const packetLen = 0.18;

          for (let k = 0; k < PHOTON_PTS; k++) {
            const s = (k / (PHOTON_PTS - 1)) * packetLen;
            const rPt = distTravel - s;
            const lateral = 0.014 * Math.sin((s / waveLenVis) * Math.PI * 2) * (1 - s / packetLen);

            const px = rPt * Math.cos(pAngle) - lateral * Math.sin(pAngle);
            const py = Y_CENTER + rPt * Math.sin(pAngle) + lateral * Math.cos(pAngle);
            posPh.setXYZ(k, px, py, 0.005);
          }
          posPh.needsUpdate = true;
        } else {
          photonGroup.visible = false;
        }
      }
    };
  },

  getMetrics(state, params) {
    let ni = Math.max(2, Math.min(5, Math.round(params.nInit || 3)));
    let nf = Math.max(1, Math.min(4, Math.round(params.nFinal || 2)));
    if (nf >= ni) nf = ni - 1;

    const eInitial = -13.606 / (ni * ni);
    const eFinal = -13.606 / (nf * nf);
    const deltaE = Math.abs(eInitial - eFinal);
    const lambdaNm = 1239.84 / Math.max(0.01, deltaE);

    let seriesName = 'Serie de Balmer';
    let region = 'Visible';
    if (nf === 1) {
      seriesName = 'Serie de Lyman';
      region = 'Ultravioleta (UV)';
    } else if (nf === 2) {
      seriesName = 'Serie de Balmer';
      if (ni === 3) region = 'Visible (Rojo H-α)';
      else if (ni === 4) region = 'Visible (Cian H-β)';
      else if (ni === 5) region = 'Visible (Violeta H-γ)';
      else region = 'Visible';
    } else if (nf === 3) {
      seriesName = 'Serie de Paschen';
      region = 'Infrarrojo (IR)';
    } else {
      seriesName = 'Serie de Brackett';
      region = 'Infrarrojo Lejano';
    }

    return [
      { label: 'Transición Cuántica', value: `nᵢ = ${ni} → n_f = ${nf}` },
      { label: 'Energía Fotón (ΔE)', value: deltaE.toFixed(2) + ' eV' },
      { label: 'Longitud Onda (λ)', value: lambdaNm.toFixed(1) + ' nm' },
      { label: 'Espectro y Serie', value: `${seriesName} · ${region}` }
    ];
  }
};
