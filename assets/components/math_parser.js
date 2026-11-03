// Evaluador Matemático de Superficies 3D z = f(x, y, t, r, theta)
window.VLabComponents = window.VLabComponents || {};
window.VLabComponents.MathParser = {
  compile(exprStr) {
    try {
      let clean = String(exprStr || 'A * sin(k * r - w * t) / (1 + 0.35 * r)')
        .trim()
        .replace(/\^/g, '**')
        .replace(/\b(sin|cos|tan|asin|acos|atan|atan2|sinh|cosh|tanh|exp|log|sqrt|abs|floor|ceil|round|min|max)\b/gi, (m) => 'Math.' + m.toLowerCase())
        .replace(/\bpi\b/gi, 'Math.PI');

      const fn = new Function('x', 'y', 't', 'A', 'k', 'w', 'sigma', `
        const r = Math.sqrt(x*x + y*y);
        const theta = Math.atan2(y, x);
        const e = Math.E;
        try {
          const val = (${clean});
          return Number.isFinite(val) ? val : 0;
        } catch(err) { return 0; }
      `);
      // Prueba de validación numérica (debe retornar un número finito y no lanzar excepción)
      const test1 = fn(0.5, 0.5, 0.2, 0.5, 2.5, 3.0, 1.0);
      const test2 = fn(1.2, -0.8, 0.5, 0.5, 2.5, 3.0, 1.0);
      if (!Number.isFinite(test1) || !Number.isFinite(test2)) {
        throw new Error('Non-finite test evaluation');
      }
      return fn;
    } catch (e) {
      return (x, y, t, A = 0.45, k = 2.5, w = 3.0) => {
        const r = Math.sqrt(x * x + y * y);
        return A * Math.sin(k * r - w * t) / (1 + 0.35 * r);
      };
    }
  }
};
