// Motor de Gráficos Científicos 2D en Tiempo Real para Explicación Docente y Estudio
window.VLabComponents = window.VLabComponents || {};
window.VLabComponents.SciPlotter = {
  create(canvasEl) {
    const ctx = canvasEl.getContext('2d');
    const historyA = [];
    const historyB = [];
    const maxPoints = 180;

    return {
      reset() {
        historyA.length = 0;
        historyB.length = 0;
      },
      pushSample(a, b) {
        historyA.push(a);
        historyB.push(b);
        if (historyA.length > maxPoints) historyA.shift();
        if (historyB.length > maxPoints) historyB.shift();
      },
      render(expId, state, params) {
        const w = canvasEl.width;
        const h = canvasEl.height;
        ctx.clearRect(0, 0, w, h);

        // Fondo y grilla técnica
        ctx.fillStyle = '#0d1017';
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = '#1e2534';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
          const gy = (h / 4) * i;
          ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
        }
        for (let i = 1; i < 6; i++) {
          const gx = (w / 6) * i;
          ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
        }

        // Eje horizontal central
        const midY = h * 0.54;
        ctx.strokeStyle = '#334155';
        ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(w, midY); ctx.stroke();

        ctx.font = '500 11px Inter, sans-serif';

        // 1. PÉNDULO SIMPLE: θ(t) y ω(t) + Barras de Energía Cinética vs Potencial
        if (expId === 'MEC-01') {
          const deg = ((state.theta || 0) * 180) / Math.PI;
          const om = (state.omega || 0) * 15;
          this.pushSample(deg, om);

          // Dibujar serie θ(t) en Azul (#3b82f6) y ω(t) en Verde (#10b981)
          const plotW = w - 68;
          this.drawSeries(ctx, historyA, plotW, midY, (h * 0.38) / 80, '#3b82f6');
          this.drawSeries(ctx, historyB, plotW, midY, (h * 0.38) / 80, '#10b981');

          // Barras de energía a la derecha
          const L = Math.max(0.25, params.length || 0.75);
          const g = params.gravity !== undefined ? params.gravity : 9.8;
          const m = params.mass || 1.0;
          const Ek = 0.5 * m * Math.pow(L * (state.omega || 0), 2);
          const Ep = m * g * L * (1 - Math.cos(state.theta || 0));
          const Etot = Math.max(0.01, Ek + Ep);

          const barBase = h - 18;
          const maxBarH = h - 42;
          const hEk = Math.min(maxBarH, (Ek / Math.max(2.5, Etot)) * maxBarH);
          const hEp = Math.min(maxBarH, (Ep / Math.max(2.5, Etot)) * maxBarH);

          ctx.fillStyle = '#10b981';
          ctx.fillRect(w - 52, barBase - hEk, 16, hEk);
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(w - 28, barBase - hEp, 16, hEp);

          ctx.fillStyle = '#94a3b8';
          ctx.fillText('Ek', w - 51, h - 5);
          ctx.fillText('Ep', w - 27, h - 5);

          this.drawLegend(ctx, [
            { color: '#3b82f6', text: 'θ(t) Ángulo' },
            { color: '#10b981', text: 'ω(t) Velocidad' }
          ]);
        }

        // 2. MASA-RESORTE: Elongación y(t) y Fuerza F(t) + Barras de Energía
        else if (expId === 'MEC-02') {
          const yCm = (state.y || 0) * 100;
          const vScaled = (state.v || 0) * 25;
          this.pushSample(yCm, vScaled);

          const plotW = w - 68;
          this.drawSeries(ctx, historyA, plotW, midY, (h * 0.38) / 38, '#3b82f6');
          this.drawSeries(ctx, historyB, plotW, midY, (h * 0.38) / 38, '#f59e0b');

          const k = params.k || 22;
          const m = Math.max(0.1, params.mass || 1.2);
          const Ek = 0.5 * m * Math.pow(state.v || 0, 2);
          const Ee = 0.5 * k * Math.pow(state.y || 0, 2);
          const Etot = Math.max(0.01, Ek + Ee);

          const barBase = h - 18;
          const maxBarH = h - 42;
          const hEk = Math.min(maxBarH, (Ek / Math.max(1.2, Etot)) * maxBarH);
          const hEe = Math.min(maxBarH, (Ee / Math.max(1.2, Etot)) * maxBarH);

          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(w - 52, barBase - hEk, 16, hEk);
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(w - 28, barBase - hEe, 16, hEe);

          ctx.fillStyle = '#94a3b8';
          ctx.fillText('Ek', w - 51, h - 5);
          ctx.fillText('Ee', w - 27, h - 5);

          this.drawLegend(ctx, [
            { color: '#3b82f6', text: 'y(t) Posición' },
            { color: '#f59e0b', text: 'v(t) Velocidad' }
          ]);
        }

        // 3. TIRO PARABÓLICO: Trayectoria y(x) en Azul + Punto Actual + Barras Ek vs Ep
        else if (expId === 'MEC-03') {
          const v0 = Math.max(1, params.v0 || 8.0);
          const thetaDeg = params.angle !== undefined ? params.angle : 45;
          const thetaRad = (thetaDeg * Math.PI) / 180;
          const g = Math.max(0.5, params.gravity !== undefined ? params.gravity : 9.8);
          const y0 = Math.max(0, params.y0 || 0);

          const v0x = v0 * Math.cos(thetaRad);
          const v0y = v0 * Math.sin(thetaRad);
          const disc = v0y * v0y + 2 * g * y0;
          const tImpact = (v0y + Math.sqrt(Math.max(0, disc))) / g;
          const xMax = Math.max(0.5, v0x * tImpact);
          const yMax = Math.max(0.5, y0 + (v0y * v0y) / (2 * g));

          const padL = 34, padR = 64, padT = 24, padB = 22;
          const pw = w - padL - padR;
          const ph = h - padT - padB;

          // Ejes de coordenadas
          ctx.strokeStyle = '#334155';
          ctx.beginPath();
          ctx.moveTo(padL, padT + ph); ctx.lineTo(padL + pw, padT + ph);
          ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + ph);
          ctx.stroke();

          // Curva de trayectoria analítica y(x) en Azul Cobalto (#3b82f6)
          const scaleX = pw / (xMax * 1.05);
          const scaleY = ph / (yMax * 1.18);

          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.beginPath();
          const steps = 60;
          for (let i = 0; i <= steps; i++) {
            const xi = (i / steps) * xMax;
            const yi = y0 + xi * Math.tan(thetaRad) - (g * xi * xi) / (2 * v0 * v0 * Math.cos(thetaRad) * Math.cos(thetaRad));
            const px = padL + xi * scaleX;
            const py = padT + ph - Math.max(0, yi) * scaleY;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();

          // Posición actual del proyectil (state.x, state.y)
          const curX = state.x !== undefined ? state.x : 0;
          const curY = state.y !== undefined ? state.y : y0;
          const curPx = padL + curX * scaleX;
          const curPy = padT + ph - curY * scaleY;

          ctx.fillStyle = '#10b981';
          ctx.beginPath(); ctx.arc(curPx, curPy, 4.5, 0, Math.PI * 2); ctx.fill();

          // Marcador de Altura Máxima
          const xApex = (v0 * v0 * Math.sin(2 * thetaRad)) / (2 * g);
          const pxApex = padL + xApex * scaleX;
          const pyApex = padT + ph - yMax * scaleY;
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath(); ctx.arc(pxApex, pyApex, 3, 0, Math.PI * 2); ctx.fill();

          // Barras de energía cinética Ek y potencial Ep en tiempo real a la derecha
          const m = 1.0;
          const curVx = state.vx !== undefined ? state.vx : v0x;
          const curVy = state.vy !== undefined ? state.vy : v0y;
          const Ek = 0.5 * m * (curVx * curVx + curVy * curVy);
          const Ep = m * g * curY;
          const Etot = Math.max(0.1, Ek + Ep);

          const barBase = h - 18;
          const maxBarH = h - 42;
          const hEk = Math.min(maxBarH, (Ek / Etot) * maxBarH);
          const hEp = Math.min(maxBarH, (Ep / Etot) * maxBarH);

          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(w - 52, barBase - hEk, 16, hEk);
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(w - 28, barBase - hEp, 16, hEp);

          ctx.fillStyle = '#94a3b8';
          ctx.fillText('Ek', w - 50, h - 5);
          ctx.fillText('Ep', w - 26, h - 5);
          ctx.fillText(`R=${xMax.toFixed(1)}m`, padL + pw - 46, h - 6);
          ctx.fillText(`H=${yMax.toFixed(1)}m`, padL + 4, padT + 12);

          this.drawLegend(ctx, [
            { color: '#3b82f6', text: 'Trayectoria y(x)' },
            { color: '#10b981', text: 'Esfera (x,y)' }
          ]);
        }

        // 4. ONDAS EN CUERDA (MELDE): Perfil instantáneo y(x,t) + Envolvente de nodos/antinodos
        else if (expId === 'OND-01') {
          const n = Math.max(1, Math.min(6, Math.round(params.harmonic || 2)));
          const A = Math.max(0.04, params.amp || 0.14);
          const phase = state.phase !== undefined ? state.phase : 0;
          const boost = state.boost || 1.0;

          const L = 1.30;
          const T = Math.max(5, params.tension || 40);
          const muKg = Math.max(0.0001, (params.mu || 2.0) * 1e-3);
          const vWave = Math.sqrt(T / muKg);
          const fFund = vWave / (2 * L);
          const fn = n * fFund;
          const fOsc = Math.max(5, params.freq !== undefined ? params.freq : 60);

          let resonance = state.resonance;
          if (resonance === undefined) {
            const df = Math.abs(fOsc - fn);
            const halfG = Math.max(3.5, fn * 0.045);
            resonance = (halfG * halfG) / (df * df + halfG * halfG);
          }
          const resFactor = 0.30 + 0.70 * resonance;

          const padL = 28, padR = 20, padT = 24, padB = 20;
          const pw = w - padL - padR;
          const ph = h - padT - padB;
          const cY = padT + ph / 2;
          const maxAmpPx = ph * 0.42 * resFactor;

          // Eje central de equilibrio
          ctx.strokeStyle = '#334155';
          ctx.beginPath(); ctx.moveTo(padL, cY); ctx.lineTo(padL + pw, cY); ctx.stroke();

          // Envolvente teórica de antinodos (±A·|sin(n·π·x/L)|)
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.40)';
          ctx.setLineDash([3, 3]);
          ctx.lineWidth = 1.2;

          ctx.beginPath();
          for (let i = 0; i <= 100; i++) {
            const u = i / 100;
            const env = Math.abs(Math.sin(n * Math.PI * u)) * maxAmpPx;
            const px = padL + u * pw;
            const py = cY - env;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.stroke();

          ctx.beginPath();
          for (let i = 0; i <= 100; i++) {
            const u = i / 100;
            const env = Math.abs(Math.sin(n * Math.PI * u)) * maxAmpPx;
            const px = padL + u * pw;
            const py = cY + env;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.stroke();
          ctx.setLineDash([]);

          // Perfil instantáneo de la cuerda y(x,t) en Azul Cobalto (#3b82f6)
          ctx.strokeStyle = resonance > 0.85 ? '#3b82f6' : (resonance > 0.50 ? '#60a5fa' : '#64748b');
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          for (let i = 0; i <= 100; i++) {
            const u = i / 100;
            const yNorm = Math.sin(n * Math.PI * u) * Math.cos(phase) * boost;
            const px = padL + u * pw;
            const py = cY - yNorm * maxAmpPx;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.stroke();

          // Nodos inmóviles (y = 0) marcados en Ámbar (#f59e0b)
          for (let k = 0; k <= n; k++) {
            const nodePx = padL + (k / n) * pw;
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath(); ctx.arc(nodePx, cY, 3.5, 0, Math.PI * 2); ctx.fill();
          }

          // Antinodos (vientres)
          for (let k = 0; k < n; k++) {
            const antiPx = padL + ((k + 0.5) / n) * pw;
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath(); ctx.arc(antiPx, cY, 2, 0, Math.PI * 2); ctx.fill();
          }

          // Métricas en el canvas
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(`Armónico n = ${n} | f_osc = ${fOsc.toFixed(0)} Hz (fₙ = ${fn.toFixed(0)} Hz)`, padL + 4, padT + 12);
          const resPct = (resonance * 100).toFixed(0);
          ctx.fillStyle = resonance > 0.85 ? '#3b82f6' : (resonance > 0.50 ? '#f59e0b' : '#94a3b8');
          ctx.fillText(`Resonancia: ${resPct}%`, padL + pw - 90, padT + 12);

          this.drawLegend(ctx, [
            { color: '#3b82f6', text: 'y(x,t) Perfil' },
            { color: '#94a3b8', text: 'Envolvente ±A' },
            { color: '#f59e0b', text: 'Nodos' }
          ]);
        }

        // 5. PLACA DE CHLADNI: Espectro de Resonancia Acústica A(f) 80..2400 Hz (Kirchhoff-Love + Rayleigh)
        else if (expId === 'OND-02') {
          const curF = params.freq !== undefined ? params.freq : 189;
          const L = params.plateSize !== undefined ? params.plateSize : 28;
          const matKey = Math.max(1, Math.min(4, Math.round(params.material || 2)));
          const matProps = {
            1: { name: 'Acero Inox 304', cp: 5132, nu: 0.29 },
            2: { name: 'Latón C260', cp: 3833, nu: 0.35 },
            3: { name: 'Aluminio 6061', cp: 5351, nu: 0.33 },
            4: { name: 'Vidrio Templado', cp: 5424, nu: 0.22 }
          };
          const mat = matProps[matKey] || matProps[2];
          const damp = Math.max(0.015, params.damping !== undefined ? params.damping : 0.05);

          const u0 = Math.max(-0.85, Math.min(0.85, params.driveX || 0.0));
          const v0 = Math.max(-0.85, Math.min(0.85, params.driveY || 0.0));
          const xi0 = (u0 + 1.0) / 2.0;
          const eta0 = (v0 + 1.0) / 2.0;

          // Relación de dispersión Kirchhoff-Love con factor Rayleigh-Ritz
          const L_m = Math.max(0.12, L / 100);
          const hPlate = 0.0015;
          const f_disp = (Math.PI * hPlate) / (4 * Math.sqrt(3) * L_m * L_m);
          const baseFactor = f_disp * mat.cp * 1.42;
          const nu_split = 0.12 * mat.nu;

          const padL = 32, padR = 20, padT = 24, padB = 22;
          const pw = w - padL - padR;
          const ph = h - padT - padB;

          const fMin = 80;
          const fMax = 2400;

          // Precalcular modos en rango con desdoblamiento de Rayleigh Ψₙₘ⁺ y Ψₙₘ⁻
          const modesList = [];
          for (let n = 0; n <= 6; n++) {
            for (let m = n; m <= 6; m++) {
              if (n === 0 && m <= 1) continue;

              if (n === m) {
                const fnn = baseFactor * (2 * n * n);
                if (fnn >= 70 && fnn <= 2600) {
                  const c = Math.cos(n * Math.PI * xi0) * Math.cos(n * Math.PI * eta0);
                  const gamma = Math.max(8, fnn * damp * 1.25);
                  modesList.push({ n, m, label: `(${n},${n})`, fnm: fnn, gamma, coup: Math.abs(c) });
                }
              } else {
                const fnm_plus = baseFactor * (n * n + m * m + nu_split * n * m);
                const fnm_minus = baseFactor * (n * n + m * m - nu_split * n * m);

                const c1 = Math.cos(n * Math.PI * xi0) * Math.cos(m * Math.PI * eta0);
                const c2 = Math.cos(m * Math.PI * xi0) * Math.cos(n * Math.PI * eta0);
                const c_plus = c1 + c2;
                const c_minus = c1 - c2;

                const gamma_p = Math.max(8, fnm_plus * damp * 1.25);
                const gamma_m = Math.max(8, fnm_minus * damp * 1.25);

                if (fnm_plus >= 70 && fnm_plus <= 2600 && Math.abs(c_plus) > 0.02) {
                  modesList.push({ n, m, label: `(${n},${m})⁺`, fnm: fnm_plus, gamma: gamma_p, coup: Math.abs(c_plus) });
                }
                if (fnm_minus >= 70 && fnm_minus <= 2600 && Math.abs(c_minus) > 0.02) {
                  modesList.push({ n, m, label: `(${n},${m})⁻`, fnm: fnm_minus, gamma: gamma_m, coup: Math.abs(c_minus) });
                }
              }
            }
          }

          // Función de respuesta modal Lorentziana acumulada A(f)
          const evalAmp = (f) => {
            let sum = 0;
            for (let i = 0; i < modesList.length; i++) {
              const md = modesList[i];
              const df = f - md.fnm;
              const hG = md.gamma * 0.5;
              const lorentz = (hG * hG) / (df * df + hG * hG);
              sum += lorentz * md.coup;
            }
            return sum;
          };

          // Ejes cartesianos
          ctx.strokeStyle = '#334155';
          ctx.strokeRect(padL, padT, pw, ph);

          // Curva del espectro A(f)
          ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          const numSamples = 90;
          for (let i = 0; i <= numSamples; i++) {
            const f = fMin + (i / numSamples) * (fMax - fMin);
            const a = Math.min(1.4, evalAmp(f));
            const px = padL + (i / numSamples) * pw;
            const py = padT + ph - (a / 1.45) * ph;
            if (i === 0) { ctx.moveTo(px, padT + ph); ctx.lineTo(px, py); }
            else ctx.lineTo(px, py);
          }
          ctx.lineTo(padL + pw, padT + ph);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#3b82f6';
          ctx.beginPath();
          for (let i = 0; i <= numSamples; i++) {
            const f = fMin + (i / numSamples) * (fMax - fMin);
            const a = Math.min(1.4, evalAmp(f));
            const px = padL + (i / numSamples) * pw;
            const py = padT + ph - (a / 1.45) * ph;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.stroke();

          // Picos modales con etiquetas breves
          ctx.fillStyle = '#64748b';
          ctx.font = '9px JetBrains Mono, monospace';
          modesList.slice(0, 7).forEach(m => {
            if (m.fnm >= fMin && m.fnm <= fMax) {
              const mx = padL + ((m.fnm - fMin) / (fMax - fMin)) * pw;
              ctx.fillText(m.label, mx - 12, padT + 12);
            }
          });

          // Línea vertical verde en la frecuencia activa params.freq
          const curClamped = Math.max(fMin, Math.min(fMax, curF));
          const curPx = padL + ((curClamped - fMin) / (fMax - fMin)) * pw;
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(curPx, padT); ctx.lineTo(curPx, padT + ph);
          ctx.stroke();

          // Punto activo y etiqueta
          const curA = Math.min(1.4, evalAmp(curClamped));
          const curPy = padT + ph - (curA / 1.45) * ph;
          ctx.fillStyle = '#10b981';
          ctx.beginPath(); ctx.arc(curPx, curPy, 4.5, 0, Math.PI * 2); ctx.fill();

          ctx.font = '500 10px JetBrains Mono, monospace';
          ctx.fillText(`f=${Math.round(curF)} Hz`, Math.min(w - 75, Math.max(padL + 2, curPx - 24)), padT + ph - 8);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '500 11px Inter, sans-serif';
          ctx.fillText('80 Hz', padL, h - 5);
          ctx.fillText('2400 Hz', padL + pw - 42, h - 5);

          this.drawLegend(ctx, [
            { color: '#3b82f6', text: 'Espectro A(f)' },
            { color: '#10b981', text: 'Frecuencia Activa' }
          ]);
        }

        // 3. LEY DE SNELL: Curva θ₂ vs θ₁ (0°..90°) + Punto Operativo + Asíntota de Ángulo Crítico
        else if (expId === 'OPT-01') {
          const n1 = params.n1 || 1.0;
          const n2 = params.n2 || 1.5;
          const curTheta1 = params.theta1 !== undefined ? params.theta1 : 40;

          const padL = 32, padR = 16, padT = 26, padB = 22;
          const pw = w - padL - padR;
          const ph = h - padT - padB;

          // Ejes 0..90°
          ctx.strokeStyle = '#475569';
          ctx.strokeRect(padL, padT, pw, ph);

          // Si hay ángulo crítico (n1 > n2), dibujar zona sombreada de Reflexión Total Interna
          if (n1 > n2) {
            const thetaC = (Math.asin(n2 / n1) * 180) / Math.PI;
            const xc = padL + (thetaC / 90) * pw;
            ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
            ctx.fillRect(xc, padT, padL + pw - xc, ph);
            ctx.strokeStyle = '#f59e0b';
            ctx.setLineDash([4, 3]);
            ctx.beginPath(); ctx.moveTo(xc, padT); ctx.lineTo(xc, padT + ph); ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#f59e0b';
            ctx.fillText(`θc=${thetaC.toFixed(0)}°`, Math.min(w - 52, xc + 4), padT + 14);
          }

          // Curva teórica θ₂(θ₁)
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          let started = false;
          for (let deg = 0; deg <= 90; deg += 1) {
            const s2 = (n1 / n2) * Math.sin((deg * Math.PI) / 180);
            if (s2 <= 1.0) {
              const t2 = (Math.asin(s2) * 180) / Math.PI;
              const px = padL + (deg / 90) * pw;
              const py = padT + ph - (t2 / 90) * ph;
              if (!started) { ctx.moveTo(px, py); started = true; }
              else ctx.lineTo(px, py);
            }
          }
          ctx.stroke();

          // Punto actual de trabajo
          const sCur = (n1 / n2) * Math.sin((curTheta1 * Math.PI) / 180);
          const pxCur = padL + (curTheta1 / 90) * pw;
          const pyCur = sCur <= 1.0
            ? padT + ph - (((Math.asin(sCur) * 180) / Math.PI) / 90) * ph
            : padT;

          ctx.fillStyle = sCur <= 1.0 ? '#10b981' : '#f59e0b';
          ctx.beginPath(); ctx.arc(pxCur, pyCur, 5, 0, Math.PI * 2); ctx.fill();

          ctx.fillStyle = '#94a3b8';
          ctx.fillText('θ₁ (0°→90°)', padL + pw / 2 - 28, h - 5);
          ctx.fillText('90°', 6, padT + 10);
          ctx.fillText('0°', 12, padT + ph);

          this.drawLegend(ctx, [
            { color: '#38bdf8', text: 'Curva θ₂ vs θ₁' },
            { color: '#10b981', text: 'Punto Actual' }
          ]);
        }

        // 7. FUERZA DE LORENTZ: Proyección Orbital (x, z) del Radio de Larmor R = mv/(qB) y variación con B
        else if (expId === 'EM-01') {
          const B = Math.max(0.2, params.B || 2.0);
          const v0 = Math.max(0.5, params.v0 || 4.0);
          const qSign = params.qSign < 0 ? -1 : 1;
          const pitchDeg = params.pitch !== undefined ? params.pitch : 10;
          const pitchRad = (pitchDeg * Math.PI) / 180;
          const phi = state.phi !== undefined ? state.phi : 0;

          const padL = 20, padT = 24, padB = 20;
          const cx = (w - 75) * 0.48;
          const cy = padT + (h - padT - padB) * 0.5;
          const maxRpx = (h - padT - padB) * 0.44;

          // Ejes de coordenadas ortogonales (X, Z)
          ctx.strokeStyle = '#262b3a';
          ctx.beginPath();
          ctx.moveTo(cx - maxRpx * 1.15, cy); ctx.lineTo(cx + maxRpx * 1.15, cy);
          ctx.moveTo(cx, cy - maxRpx * 1.15); ctx.lineTo(cx, cy + maxRpx * 1.15);
          ctx.stroke();

          // Círculos concéntricos de referencia según B (para mostrar cómo varía con B)
          const bRefs = [1.0, 2.0, 4.0];
          ctx.strokeStyle = '#334155';
          ctx.setLineDash([2, 3]);
          bRefs.forEach(bVal => {
            const rPxRef = maxRpx * Math.min(1.0, (4.0 * Math.cos(pitchRad)) / (bVal * 2.2));
            ctx.beginPath(); ctx.arc(cx, cy, rPxRef, 0, Math.PI * 2); ctx.stroke();
          });
          ctx.setLineDash([]);

          // Radio de Larmor actual R = (m·v·cos(pitch)) / (|q|·B)
          const rCurPx = Math.max(12, Math.min(maxRpx, maxRpx * ((v0 * Math.cos(pitchRad)) / (B * 2.1))));

          // Círculo orbital actual en Azul Cobalto (#3b82f6)
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(cx, cy, rCurPx, 0, Math.PI * 2); ctx.stroke();

          // Partícula cargada en órbita (x(t), z(t))
          const px = cx + rCurPx * Math.cos(phi);
          const pz = cy + rCurPx * Math.sin(phi);

          ctx.fillStyle = qSign > 0 ? '#3b82f6' : '#ef4444';
          ctx.beginPath(); ctx.arc(px, pz, 5, 0, Math.PI * 2); ctx.fill();

          // Vector Velocidad Tangente v (Cian) y Fuerza FB centrípeta (Ámbar)
          const vLen = 18;
          const fLen = 14;
          const vx = -Math.sin(phi) * qSign * vLen;
          const vz = Math.cos(phi) * qSign * vLen;

          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.8;
          ctx.beginPath(); ctx.moveTo(px, pz); ctx.lineTo(px + vx, pz + vz); ctx.stroke();

          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.8;
          const fx = (cx - px) * (fLen / rCurPx);
          const fz = (cy - pz) * (fLen / rCurPx);
          ctx.beginPath(); ctx.moveTo(px, pz); ctx.lineTo(px + fx, pz + fz); ctx.stroke();

          // Panel técnico lateral derecho
          const rPhysMm = ((1.042 * v0 * Math.cos(pitchRad)) / B).toFixed(1);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '500 10px JetBrains Mono, monospace';
          ctx.fillText(`R = ${rPhysMm} mm`, w - 74, cy - 20);
          ctx.fillText(`B = ${B.toFixed(1)} T`, w - 74, cy - 4);
          ctx.fillText(`v⊥= ${(v0 * Math.cos(pitchRad)).toFixed(1)} Mm/s`, w - 74, cy + 12);
          ctx.fillText(`q = ${qSign > 0 ? '+1e' : '-1e'}`, w - 74, cy + 28);

          ctx.font = '500 11px Inter, sans-serif';
          this.drawLegend(ctx, [
            { color: '#3b82f6', text: 'Órbita Larmor' },
            { color: '#38bdf8', text: 'v Tangente' },
            { color: '#f59e0b', text: 'FB Centrípeta' }
          ]);
        }

        // 8. GAS IDEAL: Isoterma en Diagrama P-V + Punto Operativo (V, P) en Verde Esmeralda
        else if (expId === 'TER-01') {
          const T = Math.max(50, params.temp || 300);
          const curV = Math.max(0.25, Math.min(1.0, params.volume || 0.65));
          const n = Math.max(0.5, params.nMoles || 1.0);
          const R = 8.314;

          const padL = 36, padR = 24, padT = 24, padB = 22;
          const pw = w - padL - padR;
          const ph = h - padT - padB;

          // Rangos: V de 0.20 a 1.05 L; P de 0 a 140 kPa
          const vMin = 0.20, vMax = 1.05;
          const pMax = 130;

          // Ejes P-V
          ctx.strokeStyle = '#475569';
          ctx.strokeRect(padL, padT, pw, ph);

          // Isotermas de referencia punteadas (T = 150K y T = 550K)
          [150, 550].forEach(tRef => {
            ctx.strokeStyle = '#334155';
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            for (let i = 0; i <= 50; i++) {
              const vi = vMin + (i / 50) * (vMax - vMin);
              const pi = (n * R * tRef) / (vi * 10);
              const px = padL + ((vi - vMin) / (vMax - vMin)) * pw;
              const py = padT + ph - Math.min(1.0, pi / pMax) * ph;
              if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.stroke();
          });
          ctx.setLineDash([]);

          // Isoterma actual a temperatura T en Azul Cobalto (#3b82f6)
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          for (let i = 0; i <= 60; i++) {
            const vi = vMin + (i / 60) * (vMax - vMin);
            const pi = (n * R * T) / (vi * 10);
            const px = padL + ((vi - vMin) / (vMax - vMin)) * pw;
            const py = padT + ph - Math.min(1.0, pi / pMax) * ph;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.stroke();

          // Punto operativo actual (V, P) en Verde Esmeralda (#10b981)
          const curP = (n * R * T) / (curV * 10);
          const curPx = padL + ((curV - vMin) / (vMax - vMin)) * pw;
          const curPy = padT + ph - Math.min(1.0, curP / pMax) * ph;

          // Líneas de proyección a los ejes
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(padL, curPy); ctx.lineTo(curPx, curPy); ctx.lineTo(curPx, padT + ph);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#10b981';
          ctx.beginPath(); ctx.arc(curPx, curPy, 5.5, 0, Math.PI * 2); ctx.fill();

          ctx.fillStyle = '#94a3b8';
          ctx.fillText('P (kPa)', padL + 4, padT + 12);
          ctx.fillText('V (L)', padL + pw - 26, padT + ph - 6);
          ctx.fillText(`P=${curP.toFixed(0)} kPa`, Math.min(w - 75, curPx + 8), curPy - 4);

          this.drawLegend(ctx, [
            { color: '#3b82f6', text: `Isoterma ${Math.round(T)} K` },
            { color: '#10b981', text: 'Punto (V, P)' }
          ]);
        }

        // 9. ÁTOMO DE BOHR: Diagrama de Niveles de Energía Cuánticos En + Salto y λ
        else if (expId === 'MOD-01') {
          let ni = Math.max(2, Math.min(5, Math.round(params.nInit || 3)));
          let nf = Math.max(1, Math.min(4, Math.round(params.nFinal || 2)));
          if (nf >= ni) nf = ni - 1;

          const padL = 36, padR = 24, padT = 26, padB = 22;
          const pw = w - padL - padR;
          const ph = h - padT - padB;

          // Niveles de energía En = -13.6 / n^2 eV
          const levelMap = {
            1: { n: 1, E: -13.60, yNorm: 0.94 },
            2: { n: 2, E: -3.40,  yNorm: 0.56 },
            3: { n: 3, E: -1.51,  yNorm: 0.35 },
            4: { n: 4, E: -0.85,  yNorm: 0.22 },
            5: { n: 5, E: -0.54,  yNorm: 0.12 }
          };

          // Eje de energía eV
          ctx.strokeStyle = '#334155';
          ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + ph); ctx.stroke();

          // Dibujar líneas horizontales de cada nivel cuántico n=1..5
          for (let n = 1; n <= 5; n++) {
            const lv = levelMap[n];
            const yLv = padT + lv.yNorm * ph;
            const isSelected = (n === ni || n === nf);

            ctx.strokeStyle = isSelected ? '#3b82f6' : '#262b3a';
            ctx.lineWidth = isSelected ? 2 : 1;
            ctx.beginPath(); ctx.moveTo(padL, yLv); ctx.lineTo(padL + pw * 0.65, yLv); ctx.stroke();

            ctx.fillStyle = isSelected ? '#f1f5f9' : '#64748b';
            ctx.font = '500 10px JetBrains Mono, monospace';
            ctx.fillText(`n=${n} (${lv.E.toFixed(2)} eV)`, padL + 4, yLv - 4);
          }

          // Salto cuántico vertical (flecha descendente entre ni y nf)
          const arrowX = padL + pw * 0.42;
          const yStart = padT + levelMap[ni].yNorm * ph;
          const yEnd = padT + levelMap[nf].yNorm * ph;

          const deltaE = 13.6 * (1 / (nf * nf) - 1 / (ni * ni));
          const lambdaNm = Math.round(1239.84 / deltaE);

          // Color espectral según longitud de onda
          let photonColor = '#38bdf8';
          let seriesName = 'Balmer';
          if (nf === 1) { photonColor = '#a855f7'; seriesName = 'Lyman (UV)'; }
          else if (nf === 2) {
            seriesName = 'Balmer';
            if (ni === 3) photonColor = '#ef4444'; // H-α Rojo (656 nm)
            else if (ni === 4) photonColor = '#06b6d4'; // H-β Cian (486 nm)
            else photonColor = '#8b5cf6'; // H-γ Violeta (434 nm)
          } else if (nf === 3) { photonColor = '#f97316'; seriesName = 'Paschen (IR)'; }

          // Flecha vertical
          ctx.strokeStyle = photonColor;
          ctx.fillStyle = photonColor;
          ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(arrowX, yStart); ctx.lineTo(arrowX, yEnd); ctx.stroke();

          // Punta de flecha hacia abajo
          ctx.beginPath();
          ctx.moveTo(arrowX, yEnd);
          ctx.lineTo(arrowX - 4, yEnd - 8);
          ctx.lineTo(arrowX + 4, yEnd - 8);
          ctx.closePath();
          ctx.fill();

          // Texto descriptivo del fotón emitido a la derecha
          ctx.fillStyle = photonColor;
          ctx.font = '600 11px Inter, sans-serif';
          ctx.fillText(`ΔE = ${deltaE.toFixed(2)} eV`, arrowX + 12, (yStart + yEnd) / 2 - 8);
          ctx.font = '500 10px JetBrains Mono, monospace';
          ctx.fillText(`λ = ${lambdaNm} nm`, arrowX + 12, (yStart + yEnd) / 2 + 7);
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(seriesName, arrowX + 12, (yStart + yEnd) / 2 + 21);

          ctx.font = '500 11px Inter, sans-serif';
          this.drawLegend(ctx, [
            { color: '#3b82f6', text: 'Niveles Bohr En' },
            { color: photonColor, text: `Salto n=${ni}→${nf}` }
          ]);
        }

        // 4. ESTADOS DE BELL: Curva de Correlación Cuántica E(Δθ) vs Límite Clásico
        else if (expId === 'QC-01') {
          const bState = Math.round(params.bellState || 1);
          const p = params.coherence !== undefined ? params.coherence : 1.0;
          const alpha = params.alpha || 0;
          const beta = params.beta || 45;
          const padL = 28, padR = 14, padT = 26, padB = 20;
          const pw = w - padL - padR;
          const ph = h - padT - padB;
          const cy = padT + ph / 2;

          // Curva clásica triangular (variables ocultas locales)
          ctx.strokeStyle = '#64748b';
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(padL, padT);
          ctx.lineTo(padL + pw, padT + ph);
          ctx.stroke();
          ctx.setLineDash([]);

          // Curva cuántica sinusoidal E(θ)
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let deg = 0; deg <= 180; deg += 2) {
            const rad = (deg * Math.PI) / 180;
            const sign = (bState === 3 || bState === 4) ? -1 : 1;
            const val = sign * p * Math.cos(rad);
            const px = padL + (deg / 180) * pw;
            const py = cy - val * (ph * 0.44);
            if (deg === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();

          // Punto actual |α - β|
          const diff = Math.min(180, Math.abs(alpha - beta));
          const sign = (bState === 3 || bState === 4) ? -1 : 1;
          const curE = sign * p * Math.cos((diff * Math.PI) / 180);
          const px = padL + (diff / 180) * pw;
          const py = cy - curE * (ph * 0.44);
          ctx.fillStyle = '#10b981';
          ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();

          ctx.fillStyle = '#94a3b8';
          ctx.fillText('+1', 4, padT + 10);
          ctx.fillText('-1', 6, padT + ph);
          ctx.fillText('Δθ (0°→180°)', padL + pw / 2 - 34, h - 4);

          this.drawLegend(ctx, [
            { color: '#3b82f6', text: 'Cuántica E(Δθ)' },
            { color: '#64748b', text: 'Cota Clásica' }
          ]);
        }

        // 5. SUPERFICIES 3D: Corte Transversal 2D en vivo z = f(x, 0, t)
        else if (expId === 'MAT-01') {
          const evalFn = state.compiledFn;
          const A = params.A !== undefined ? params.A : 0.50;
          const k = params.k !== undefined ? params.k : 2.8;
          const wParam = params.w !== undefined ? params.w : 3.0;
          const dom = params.domain !== undefined ? params.domain : 3.5;

          if (evalFn) {
            // Corte en Y = 0 (Azul) y Corte en X = 0 (Verde)
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i <= 100; i++) {
              const u = (i / 100) * 2 - 1;
              const x = u * dom;
              const z = evalFn(x, 0, state.t || 0, A, k, wParam, 1.0);
              const px = 12 + (i / 100) * (w - 24);
              const py = midY - Math.max(-0.5, Math.min(0.5, z)) * (h * 0.78);
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.stroke();

            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let i = 0; i <= 100; i++) {
              const u = (i / 100) * 2 - 1;
              const y = u * dom;
              const z = evalFn(0, y, state.t || 0, A, k, wParam, 1.0);
              const px = 12 + (i / 100) * (w - 24);
              const py = midY - Math.max(-0.5, Math.min(0.5, z)) * (h * 0.78);
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.stroke();
          }

          this.drawLegend(ctx, [
            { color: '#3b82f6', text: 'Perfil X: z(x, 0, t)' },
            { color: '#10b981', text: 'Perfil Y: z(0, y, t)' }
          ]);
        }
      },
      drawSeries(ctx, arr, width, midY, scaleY, color) {
        if (arr.length < 2) return;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        for (let i = 0; i < arr.length; i++) {
          const px = (i / (maxPoints - 1)) * width;
          const py = midY - arr[i] * scaleY;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      },
      drawLegend(ctx, items) {
        let x = 10;
        items.forEach(it => {
          ctx.fillStyle = it.color;
          ctx.fillRect(x, 8, 10, 10);
          ctx.fillStyle = '#cbd5e1';
          ctx.fillText(it.text, x + 14, 17);
          x += ctx.measureText(it.text).width + 28;
        });
      }
    };
  }
};
