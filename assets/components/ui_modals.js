// VirtualLab - Galería Visual de Prácticas + Modal Instantáneo del Marcador Óptico AR + RoomManager Universal
// Diseño académico minimalista Slate/Zinc (#090a0f, #12151d, borde #262b3a, acento #3b82f6)

window.VLabComponents = window.VLabComponents || {};

/* ==========================================================================
   RoomManager: Gestor Universal de Código de Sala Aleatorio por Clase
   ========================================================================== */
window.VLabComponents.RoomManager = {
  // Caracteres alfanuméricos legibles sin confusión visual (excluye 0, O, 1, I)
  CHARS: '23456789ABCDEFGHJKLMNPQRSTUVWXYZ',

  // Genera un código aleatorio de 4 caracteres alfanuméricos fáciles de dictar
  generateRandomCode() {
    let code = '';
    for (let i = 0; i < 4; i++) {
      const idx = Math.floor(Math.random() * this.CHARS.length);
      code += this.CHARS.charAt(idx);
    }
    return code;
  },

  // Actualiza el parámetro ?sala=XXXX en la URL usando la History API
  _updateUrl(code) {
    try {
      if (window.history && window.history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.set('sala', code);
        window.history.replaceState(null, '', url.toString());
      }
    } catch (e) {
      // Entornos donde URL o history no están disponibles
    }
  },

  /**
   * Obtiene el código de sala según el rol:
   * - Revisa primero ?sala=XXXX en la URL.
   * - Si isTeacher === true y no hay ?sala= ni localStorage, genera código de 4 chars,
   *   lo guarda en localStorage('vlab_teacher_room') y actualiza la URL.
   * - Si isTeacher === false, lee ?sala= de URL o localStorage('vlab_student_room').
   *   Si no hay nada, retorna 'NATEX' por defecto.
   */
  getRoomCode({ isTeacher = false } = {}) {
    let paramCode = null;
    try {
      const params = new URLSearchParams(window.location.search);
      paramCode = params.get('sala');
    } catch (e) {}

    if (paramCode && paramCode.trim().length > 0) {
      const clean = paramCode.toUpperCase().trim();
      try {
        if (isTeacher) {
          localStorage.setItem('vlab_teacher_room', clean);
        } else {
          localStorage.setItem('vlab_student_room', clean);
        }
      } catch (e) {}
      return clean;
    }

    if (isTeacher) {
      let stored = null;
      try {
        stored = localStorage.getItem('vlab_teacher_room');
      } catch (e) {}

      if (stored && stored.trim().length > 0) {
        const clean = stored.toUpperCase().trim();
        this._updateUrl(clean);
        return clean;
      }

      // Generar nuevo código aleatorio de 4 letras para la clase del profesor
      const newCode = this.generateRandomCode();
      try {
        localStorage.setItem('vlab_teacher_room', newCode);
      } catch (e) {}
      this._updateUrl(newCode);
      return newCode;
    } else {
      // Alumno
      let stored = null;
      try {
        stored = localStorage.getItem('vlab_student_room');
      } catch (e) {}

      if (stored && stored.trim().length > 0) {
        const clean = stored.toUpperCase().trim();
        this._updateUrl(clean);
        return clean;
      }

      return 'NATEX';
    }
  },

  // Genera forzosamente un nuevo código aleatorio de 4 caracteres para el profesor
  generateNewRoom() {
    const newCode = this.generateRandomCode();
    try {
      localStorage.setItem('vlab_teacher_room', newCode);
    } catch (e) {}
    this._updateUrl(newCode);
    return newCode;
  },

  // Retorna el topic MQTT universal para la sala
  getTopic(code) {
    const clean = (code || 'NATEX').toString().toUpperCase().trim();
    return 'vlab-n/sala-' + clean;
  },

  // Permite asignar manualmente un código de sala
  setRoomCode(code, { isTeacher = false } = {}) {
    if (!code) return '';
    const clean = code.toString().toUpperCase().trim();
    try {
      if (isTeacher) {
        localStorage.setItem('vlab_teacher_room', clean);
      } else {
        localStorage.setItem('vlab_student_room', clean);
      }
    } catch (e) {}
    this._updateUrl(clean);
    return clean;
  }
};


/* ==========================================================================
   UIModals: Modal Galería + Marcador AR en Pantalla Completa (100vw x 100vh)
   ========================================================================== */
window.VLabComponents.UIModals = {
  _currentMarkerType: 'natex',

  inject(currentSelectCallback) {
    if (document.getElementById('vlab-modals-container')) return;

    const style = document.createElement('style');
    style.id = 'vlab-modals-styles';
    style.textContent = `
      /* MODAL BACKDROP (GALERÍA) */
      .vlab-modal-backdrop {
        position: fixed; inset: 0; background: rgba(9, 10, 15, 0.82);
        backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
        z-index: 99999; display: none; align-items: center; justify-content: center;
        padding: 1rem;
      }
      .vlab-modal-backdrop.open { display: flex; }
      .vlab-modal-card {
        background: #12151d; border: 1px solid #262b3a; border-radius: 12px;
        max-width: 860px; width: 100%; max-height: 88vh; overflow-y: auto;
        padding: 1.5rem; color: #f1f5f9; box-shadow: 0 20px 45px rgba(0,0,0,0.6);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .vlab-modal-header {
        display: flex; justify-content: space-between; align-items: center;
        border-bottom: 1px solid #262b3a; padding-bottom: 0.85rem; margin-bottom: 1rem;
      }
      .vlab-modal-header h3 { font-size: 1.05rem; font-weight: 600; color: #f1f5f9; }
      .vlab-close-btn {
        background: #1a1e29; border: 1px solid #262b3a; color: #94a3b8;
        font-size: 0.78rem; font-weight: 500; padding: 0.35rem 0.75rem; border-radius: 6px;
        cursor: pointer; transition: all 0.15s;
      }
      .vlab-close-btn:hover { color: #fff; border-color: #475569; background: #232838; }

      /* FILTRO Y BUSCADOR DE GALERÍA */
      .vlab-gal-toolbar {
        display: flex; flex-direction: column; gap: 0.65rem; margin-bottom: 1.15rem;
      }
      .vlab-gal-search-input {
        width: 100%; background: #090a0f; border: 1px solid #262b3a;
        color: #f1f5f9; font-size: 0.82rem; padding: 0.55rem 0.85rem;
        border-radius: 7px; outline: none; transition: border-color 0.15s;
        font-family: 'Inter', sans-serif;
      }
      .vlab-gal-search-input:focus { border-color: #3b82f6; }
      .vlab-gal-filters {
        display: flex; gap: 0.35rem; overflow-x: auto; scrollbar-width: none; padding-bottom: 2px;
      }
      .vlab-gal-filters::-webkit-scrollbar { display: none; }
      .vlab-gal-filter-btn {
        background: #1a1e29; border: 1px solid #262b3a; color: #94a3b8;
        font-size: 0.73rem; font-weight: 500; padding: 0.3rem 0.65rem; border-radius: 6px;
        cursor: pointer; white-space: nowrap; transition: all 0.15s;
      }
      .vlab-gal-filter-btn:hover { color: #f1f5f9; border-color: #475569; }
      .vlab-gal-filter-btn.active {
        background: #3b82f6; border-color: #3b82f6; color: #ffffff; font-weight: 600;
      }

      .vlab-gallery-grid {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 0.85rem;
      }
      .vlab-gallery-item {
        background: #1a1e29; border: 1px solid #262b3a; border-radius: 8px;
        padding: 1rem; display: flex; flex-direction: column; justify-content: space-between;
        gap: 0.75rem; cursor: pointer; transition: all 0.15s;
      }
      .vlab-gallery-item:hover { border-color: #3b82f6; background: #202635; transform: translateY(-2px); }
      .vlab-gal-cat { font-family: 'JetBrains Mono', monospace; font-size: 0.68rem; color: #3b82f6; font-weight: 600; }
      .vlab-gal-title { font-size: 0.90rem; font-weight: 600; color: #f1f5f9; margin: 0.25rem 0; line-height: 1.35; }
      .vlab-gal-formula {
        font-family: 'JetBrains Mono', monospace; font-size: 0.70rem; color: #94a3b8;
        background: #090a0f; padding: 0.3rem 0.5rem; border-radius: 4px; border: 1px solid #262b3a;
        word-break: break-all;
      }
      .vlab-gal-desc { font-size: 0.75rem; color: #94a3b8; line-height: 1.4; }
      .vlab-gal-empty {
        grid-column: 1 / -1; text-align: center; color: #64748b; font-size: 0.84rem; padding: 2.5rem 1rem;
      }

      /* MODAL MARCADOR AR - 100% PANTALLA COMPLETA TOTAL (100vw x 100vh, FONDO #FFFFFF) */
      #vlab-modal-marker {
        position: fixed; inset: 0; width: 100vw; height: 100vh;
        background: #ffffff !important; z-index: 999999; display: none;
        align-items: center; justify-content: center; margin: 0; padding: 0;
        overflow: hidden; user-select: none; -webkit-user-select: none;
      }
      #vlab-modal-marker.open { display: flex; }

      .vlab-marker-fs-stage {
        position: absolute; inset: 0; width: 100vw; height: 100vh;
        display: flex; align-items: center; justify-content: center;
        background: #ffffff; cursor: pointer;
      }
      #vlab-modal-marker-img {
        width: min(72vmin, 520px); height: min(72vmin, 520px);
        max-width: 90vw; max-height: 80vh; object-fit: contain;
        image-rendering: pixelated; image-rendering: crisp-edges;
        display: block; margin: auto; pointer-events: auto;
        transition: width 0.08s ease-out, height 0.08s ease-out;
      }

      /* BARRAS FLOTANTES SOBRIAS SLATE/ZINC (#12151d / rgba) */
      .vlab-m-floating-bar {
        position: fixed; left: 50%; transform: translateX(-50%);
        background: rgba(18, 21, 29, 0.92);
        backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        border: 1px solid #262b3a; border-radius: 10px; color: #f1f5f9;
        display: flex; align-items: center; z-index: 1000000;
        box-shadow: 0 10px 32px rgba(0, 0, 0, 0.45);
        max-width: calc(100vw - 2rem); pointer-events: auto;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .vlab-m-bar-top {
        top: 1.1rem; padding: 0.5rem 0.95rem; gap: 0.75rem; justify-content: space-between;
      }
      .vlab-m-bar-bottom {
        bottom: 1.1rem; padding: 0.55rem 1rem; gap: 0.65rem; flex-wrap: wrap; justify-content: center;
      }

      .vlab-m-brand {
        display: inline-flex; align-items: center; gap: 0.45rem;
        font-size: 0.78rem; font-weight: 600; color: #f1f5f9; white-space: nowrap;
      }
      .vlab-m-brand span {
        color: #3b82f6; font-family: 'JetBrains Mono', monospace; font-size: 0.72rem;
        background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.25);
        padding: 0.15rem 0.45rem; border-radius: 4px;
      }

      .vlab-m-tabs {
        background: #090a0f; border: 1px solid #262b3a; border-radius: 7px;
        padding: 3px; display: inline-flex; gap: 3px;
      }
      .vlab-m-tab-btn {
        background: transparent; border: none; color: #94a3b8;
        font-family: inherit; font-size: 0.76rem; font-weight: 500;
        padding: 0.35rem 0.75rem; border-radius: 5px; cursor: pointer;
        transition: all 0.15s ease; white-space: nowrap;
      }
      .vlab-m-tab-btn:hover { color: #f1f5f9; }
      .vlab-m-tab-btn.active {
        background: #3b82f6; color: #ffffff; font-weight: 600;
        box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      }

      .vlab-m-btn {
        background: #1a1e29; border: 1px solid #262b3a; color: #f1f5f9;
        font-family: inherit; font-size: 0.76rem; font-weight: 500;
        padding: 0.42rem 0.78rem; border-radius: 6px; cursor: pointer;
        text-decoration: none; display: inline-flex; align-items: center;
        gap: 0.35rem; transition: all 0.15s ease; white-space: nowrap;
      }
      .vlab-m-btn:hover {
        background: #232838; border-color: #475569; color: #ffffff;
      }
      .vlab-m-btn-accent {
        background: #3b82f6; border-color: #3b82f6; color: #ffffff;
      }
      .vlab-m-btn-accent:hover {
        background: #2563eb; border-color: #2563eb;
      }

      .vlab-m-size-control {
        display: inline-flex; align-items: center; gap: 0.55rem;
        font-size: 0.76rem; color: #94a3b8; white-space: nowrap;
      }
      .vlab-m-size-control input[type="range"] {
        width: 130px; accent-color: #3b82f6; cursor: pointer;
      }
      .vlab-m-size-val {
        font-family: 'JetBrains Mono', monospace; font-size: 0.76rem;
        color: #f1f5f9; min-width: 50px; text-align: right;
      }
      .vlab-m-divider {
        width: 1px; height: 18px; background: #262b3a; margin: 0 0.15rem;
      }

      /* IMPRESIÓN LIMPIA */
      @media print {
        #vlab-modal-marker .vlab-m-floating-bar { display: none !important; }
        #vlab-modal-marker { background: #ffffff !important; }
        #vlab-modal-marker-img {
          width: 150mm !important; height: 150mm !important;
          max-width: none !important; max-height: none !important;
        }
      }

      @media (max-width: 640px) {
        .vlab-m-bar-top, .vlab-m-bar-bottom { padding: 0.45rem 0.65rem; gap: 0.4rem; }
        .vlab-m-size-control input[type="range"] { width: 85px; }
        .vlab-m-brand span { display: none; }
      }
    `;
    document.head.appendChild(style);

    const wrap = document.createElement('div');
    wrap.id = 'vlab-modals-container';
    wrap.innerHTML = `
      <!-- MODAL 1: GALERÍA DE EXPERIMENTOS (11 PRÁCTICAS) -->
      <div class="vlab-modal-backdrop" id="vlab-modal-gallery">
        <div class="vlab-modal-card">
          <div class="vlab-modal-header">
            <h3>Galería de Experimentos del Laboratorio (11 Prácticas)</h3>
            <button class="vlab-close-btn" onclick="window.VLabComponents.UIModals.closeAll()">Cerrar ✕</button>
          </div>

          <div class="vlab-gal-toolbar">
            <input type="text" id="vlab-gal-search" class="vlab-gal-search-input" placeholder="🔍 Buscar por nombre, código o fórmula (ej. Péndulo, Snell, Bohr, PV=nRT)...">
            <div class="vlab-gal-filters" id="vlab-gal-filters">
              <button class="vlab-gal-filter-btn active" data-filter="ALL">Todos (11)</button>
              <button class="vlab-gal-filter-btn" data-filter="MEC">Mecánica</button>
              <button class="vlab-gal-filter-btn" data-filter="OND">Ondas y Acústica</button>
              <button class="vlab-gal-filter-btn" data-filter="OPT">Óptica</button>
              <button class="vlab-gal-filter-btn" data-filter="EM">Electromagnetismo</button>
              <button class="vlab-gal-filter-btn" data-filter="TER">Termodinámica</button>
              <button class="vlab-gal-filter-btn" data-filter="MOD">Física Moderna</button>
              <button class="vlab-gal-filter-btn" data-filter="QC">Cuántica</button>
              <button class="vlab-gal-filter-btn" data-filter="MAT">Matemáticas 3D</button>
            </div>
          </div>

          <div class="vlab-gallery-grid" id="vlab-gallery-items"></div>
        </div>
      </div>

      <!-- MODAL 2: MARCADOR ÓPTICO AR 100% PANTALLA COMPLETA TOTAL -->
      <div id="vlab-modal-marker" role="dialog" aria-label="Marcador Óptico AR">
        <!-- Quiet Zone Infinita (Clic en cualquier parte para alternar pantalla completa) -->
        <div class="vlab-marker-fs-stage" onclick="window.VLabComponents.UIModals.toggleFullscreen(event)" title="Haz clic en cualquier parte para Pantalla Completa">
          <img id="vlab-modal-marker-img" src="marcador.svg?v=rev20" alt="Marcador de Referencia AR" draggable="false">
        </div>

        <!-- Barra Flotante Superior -->
        <header class="vlab-m-floating-bar vlab-m-bar-top" role="toolbar">
          <div class="vlab-m-brand">
            VirtualLab <span>MARCADOR AR</span>
          </div>

          <div class="vlab-m-tabs">
            <button class="vlab-m-tab-btn active" id="vlab-modal-tab-natex" onclick="window.VLabComponents.UIModals.setMarkerType('natex')">
              Patrón N (16×16)
            </button>
            <button class="vlab-m-tab-btn" id="vlab-modal-tab-hiro" onclick="window.VLabComponents.UIModals.setMarkerType('hiro')">
              Patrón Hiro Estándar
            </button>
          </div>

          <button class="vlab-m-btn" onclick="window.VLabComponents.UIModals.closeAll()" title="Cerrar modal del marcador (Escape)">
            Cerrar ✕
          </button>
        </header>

        <!-- Barra Flotante Inferior -->
        <footer class="vlab-m-floating-bar vlab-m-bar-bottom" role="toolbar">
          <div class="vlab-m-size-control">
            <label for="vlab-modal-size-slider">Escala:</label>
            <input type="range" id="vlab-modal-size-slider" min="220" max="650" step="5" value="520" oninput="window.VLabComponents.UIModals.changeSize(this.value)">
            <span id="vlab-modal-size-val" class="vlab-m-size-val">520 px</span>
          </div>

          <div class="vlab-m-divider"></div>

          <a id="vlab-modal-dl-svg" class="vlab-m-btn vlab-m-btn-accent" href="marcador.svg?v=rev20" download="marcador_VirtualLab.svg" title="Descargar archivo vectorial SVG">
            📥 Descargar SVG
          </a>
          <a id="vlab-modal-dl-png" class="vlab-m-btn" href="marcador_natex.png?v=rev20" download="marcador_VirtualLab.png" title="Descargar ráster PNG">
            📥 Descargar PNG
          </a>

          <div class="vlab-m-divider"></div>

          <button class="vlab-m-btn" onclick="window.print()" title="Imprimir directamente o guardar PDF">
            🖨️ Imprimir
          </button>
          <button class="vlab-m-btn" id="vlab-modal-btn-fs" onclick="window.VLabComponents.UIModals.toggleFullscreen(event)" title="Alternar Pantalla Completa (F11)">
            ⛶ Pantalla Completa
          </button>
          <a class="vlab-m-btn" href="marcador.html?v=rev20" target="_blank" title="Abrir en pestaña independiente">
            ↗ Pestaña
          </a>
        </footer>
      </div>
    `;
    document.body.appendChild(wrap);

    // Poblar las tarjetas de la galería (11 Experimentos completos)
    const grid = document.getElementById('vlab-gallery-items');
    const expList = ['MEC-01', 'MEC-02', 'MEC-03', 'OND-01', 'OND-02', 'OPT-01', 'EM-01', 'TER-01', 'MOD-01', 'QC-01', 'MAT-01'];
    
    const cards = [];
    expList.forEach((id, i) => {
      const exp = window.VLabExperiments && window.VLabExperiments[id];
      if (!exp) return;
      const card = document.createElement('div');
      card.className = 'vlab-gallery-item';
      card.dataset.id = id;
      card.dataset.category = exp.category || '';
      card.dataset.prefix = id.split('-')[0];
      card.dataset.title = exp.title || '';
      card.dataset.formula = exp.formula || '';
      card.dataset.description = exp.description || '';

      card.innerHTML = `
        <div>
          <div class="vlab-gal-cat">${exp.id} • ${exp.category}</div>
          <div class="vlab-gal-title">${i + 1}. ${exp.title}</div>
          <div class="vlab-gal-formula">${exp.formula}</div>
        </div>
        <div class="vlab-gal-desc">${(exp.description || '').substring(0, 115)}...</div>
      `;
      card.onclick = () => {
        if (typeof currentSelectCallback === 'function') {
          currentSelectCallback(id);
        }
        this.closeAll();
      };
      grid.appendChild(card);
      cards.push(card);
    });

    // Lógica de Filtrado y Búsqueda Interactiva
    let activeCategory = 'ALL';
    let searchQuery = '';

    const filterCards = () => {
      let visibleCount = 0;
      cards.forEach(card => {
        const id = card.dataset.id || '';
        const prefix = card.dataset.prefix || '';
        const cat = (card.dataset.category || '').toLowerCase();
        const title = (card.dataset.title || '').toLowerCase();
        const formula = (card.dataset.formula || '').toLowerCase();
        const desc = (card.dataset.description || '').toLowerCase();

        const matchCat = (activeCategory === 'ALL') || (prefix === activeCategory);
        const matchSearch = !searchQuery || 
          id.toLowerCase().includes(searchQuery) ||
          title.includes(searchQuery) ||
          formula.includes(searchQuery) ||
          cat.includes(searchQuery) ||
          desc.includes(searchQuery);

        if (matchCat && matchSearch) {
          card.style.display = 'flex';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      let emptyMsg = document.getElementById('vlab-gal-empty-msg');
      if (visibleCount === 0) {
        if (!emptyMsg) {
          emptyMsg = document.createElement('div');
          emptyMsg.id = 'vlab-gal-empty-msg';
          emptyMsg.className = 'vlab-gal-empty';
          emptyMsg.innerText = 'No se encontraron experimentos que coincidan con la búsqueda.';
          grid.appendChild(emptyMsg);
        }
        emptyMsg.style.display = 'block';
      } else if (emptyMsg) {
        emptyMsg.style.display = 'none';
      }
    };

    const searchInput = document.getElementById('vlab-gal-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = (e.target.value || '').trim().toLowerCase();
        filterCards();
      });
    }

    const filterBtns = document.querySelectorAll('.vlab-gal-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategory = btn.dataset.filter || 'ALL';
        filterCards();
      });
    });

    // Cerrar al hacer clic en fondo del modal de galería
    const galModal = document.getElementById('vlab-modal-gallery');
    if (galModal) {
      galModal.addEventListener('click', (e) => {
        if (e.target === galModal) this.closeAll();
      });
    }

    // Cerrar modales con tecla Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAll();
      }
    });

    // Sincronizar etiqueta de pantalla completa
    document.addEventListener('fullscreenchange', () => {
      const btnFs = document.getElementById('vlab-modal-btn-fs');
      if (btnFs) {
        btnFs.innerHTML = document.fullscreenElement ? '🗗 Salir' : '⛶ Pantalla Completa';
      }
    });
  },

  openGallery() {
    const modal = document.getElementById('vlab-modal-gallery');
    if (modal) modal.classList.add('open');
  },

  openMarker() {
    const modal = document.getElementById('vlab-modal-marker');
    if (modal) {
      modal.classList.add('open');

      // Intentar activar pantalla completa al abrir
      try {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch (e) {}

      // Auto-adaptar tamaño del marcador a la pantalla
      const initialPx = Math.min(Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.72), 520);
      const clamped = Math.max(220, Math.min(650, initialPx));
      this.changeSize(clamped);
      const slider = document.getElementById('vlab-modal-size-slider');
      if (slider) slider.value = clamped;
    }
  },

  closeAll() {
    const gal = document.getElementById('vlab-modal-gallery');
    if (gal) gal.classList.remove('open');

    const mark = document.getElementById('vlab-modal-marker');
    if (mark && mark.classList.contains('open')) {
      mark.classList.remove('open');
      // Salir de pantalla completa si estaba activa al cerrar el modal
      if (document.fullscreenElement) {
        try {
          document.exitFullscreen().catch(() => {});
        } catch (e) {}
      }
    }
  },

  setMarkerType(type) {
    this._currentMarkerType = type;
    const img = document.getElementById('vlab-modal-marker-img');
    const tabNatex = document.getElementById('vlab-modal-tab-natex');
    const tabHiro = document.getElementById('vlab-modal-tab-hiro');
    const btnDlSvg = document.getElementById('vlab-modal-dl-svg');
    const btnDlPng = document.getElementById('vlab-modal-dl-png');

    if (!img) return;

    if (type === 'natex') {
      img.src = 'marcador.svg?v=rev20';
      if (tabNatex) tabNatex.classList.add('active');
      if (tabHiro) tabHiro.classList.remove('active');

      if (btnDlSvg) {
        btnDlSvg.href = 'marcador.svg?v=rev20';
        btnDlSvg.download = 'marcador_VirtualLab.svg';
        btnDlSvg.style.display = 'inline-flex';
      }
      if (btnDlPng) {
        btnDlPng.href = 'marcador_natex.png?v=rev20';
        btnDlPng.download = 'marcador_VirtualLab.png';
      }
    } else {
      img.src = 'marcador_hiro.png?v=rev20';
      if (tabHiro) tabHiro.classList.add('active');
      if (tabNatex) tabNatex.classList.remove('active');

      if (btnDlSvg) {
        btnDlSvg.href = 'marcador.svg?v=rev20';
        btnDlSvg.download = 'marcador_VirtualLab.svg';
      }
      if (btnDlPng) {
        btnDlPng.href = 'marcador_hiro.png?v=rev20';
        btnDlPng.download = 'marcador_hiro.png';
      }
    }
  },

  changeSize(val) {
    const img = document.getElementById('vlab-modal-marker-img');
    const valText = document.getElementById('vlab-modal-size-val');
    if (img) {
      img.style.width = val + 'px';
      img.style.height = val + 'px';
    }
    if (valText) {
      valText.innerText = val + ' px';
    }
  },

  toggleFullscreen(e) {
    if (e && e.target && e.target.closest('.vlab-m-floating-bar')) {
      return;
    }
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }
};
