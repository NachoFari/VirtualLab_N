# 🌌 VirtualLab_N: Laboratorio de Física en Realidad Aumentada & Escritorio
> **Plataforma Educativa de Código Abierto • $0 USD Costo Permanente • Estilo Natex**  
> Desarrollado por **[NachoFari](https://github.com/NachoFari)**

---

## 🚀 ¿Qué es VirtualLab_N?
**VirtualLab_N** es una suite interactiva de laboratorios de física inspirada en PhET, diseñada para proyectar experimentos tridimensionales directamente sobre la mesa del aula escolar mediante **Realidad Aumentada Web (WebAR sin instalación)**, con control maestro para el docente en tiempo real, quizzes en vivo y exportación de calificaciones a Excel.

---

## 📦 Estructura del Núcleo (Core Piloto)
```
VirtualLab_N/
├── index.html        <-- Portal principal (Estilo Natex) para Docentes y Alumnos
├── profesor.html     <-- Panel maestro con sliders, sincronización en vivo y Excel
├── alumno.html       <-- Cámara WebAR para teléfonos móviles (Android e iOS)
├── marcador.svg      <-- Diana de calibración geométrica de 4 esquinas para imprimir
├── ROADMAP.md        <-- Plan maestro de 35 experimentos, Visor de Funciones 3D y Prompts IA
└── README.md         <-- Documentación oficial
```

---

## ⚡ Cómo Activar GitHub Pages en 2 Clics ($0 Costo)

1. Sube este repositorio a tu cuenta de GitHub (`github.com/NachoFari/VirtualLab_N`).
2. En tu repositorio, haz clic en **Settings** (Configuración) ➔ **Pages** (en el menú lateral izquierdo).
3. En **Branch**, selecciona `main` y la carpeta `/ (root)`. Haz clic en **Save**.
4. ¡Listo! En 1 minuto tendrás tu enlace seguro HTTPS público permanente:
   ```
   https://NachoFari.github.io/VirtualLab_N/
   ```

---

## 🖨️ Cómo Usarlo en Clase

1. **Imprimir el Marcador:** Descarga e imprime el archivo `marcador.svg` en una hoja A4 normal en blanco y negro.
2. **El Docente:** Abre `profesor.html` en su laptop o proyector.
3. **Los Alumnos:** Abren `alumno.html` en sus teléfonos (Chrome o Safari) y apuntan la cámara a la hoja impresa sobre su banco.
4. **En Acción:** Cuando el profesor mueve los sliders de gravedad o longitud en su pantalla, **todos los teléfonos de la clase actualizan el péndulo 3D al instante**.

---

## 📜 Licencia y Autoría
Creado por **NachoFari** bajo licencia de código abierto **MIT**.  
Libre para uso pedagógico, científico y comunitario en colegios y universidades de todo el mundo.
