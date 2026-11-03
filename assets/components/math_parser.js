// Componente Reutilizable: Evaluador Procedural Seguro de Expresiones Matemáticas f(x, y, t, r, theta)
window.VLabComponents = window.VLabComponents || {};
window.VLabComponents.MathParser = {
  compile(exprStr) {
    try {
      let clean = String(exprStr || 'sin(r - 3*t) / (r + 0.3)')
        .toLowerCase()
        .replace(/\^/g, '**')
        .replace(/\b(sin|cos|tan|asin|acos|atan|atan2|sinh|cosh|tanh|exp|log|sqrt|abs|floor|ceil|round|min|max)\b/g, 'Math.$1')
        .replace(/\bpi\b/g, 'Math.PI');
      // Compilación controlada con variables x, y, t, r, theta, A, k, w, sigma
      const fn = new Function('x', 'y', 't', 'A', 'k', 'w', 'sigma', `
        const r = Math.sqrt(x*x + y*y);
        const theta = Math.atan2(y, x);
        const e = Math.E;
        try {
          const val = (${clean});
          return Number.isFinite(val) ? val : 0;
        } catch(err) { return 0; }
      `);
      // Test run
      fn(0.1, 0.1, 0, 1, 1, 1, 1);
      return fn;
    } catch (e) {
      return (x, y, t, A = 0.4, k = 3, w = 2) => {
        const r = Math.sqrt(x * x + y * y);
        return A * Math.sin(k * r - w * t) / (r + 0.3);
      };
    }
  }
};
