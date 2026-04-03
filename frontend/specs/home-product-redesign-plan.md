# Implementation Plan: Rediseño de Home y Detalle de Producto

*Date*: 2026-03-03  
*Spec*: [home-product-redesign-spec.md](./home-product-redesign-spec.md)

## Summary

Rediseño visual de las páginas `Home.js` y `DetailProduct.js` del frontend React, convirtiendo el HTML provisto por el usuario a JSX y conectándolo con la lógica existente (contexto de productos, paginación, búsqueda, carrito, WhatsApp). No hay cambios en el backend ni en el modelo de datos.

## Technical Context

*Language/Version*: JavaScript (React 18)  
*Primary Dependencies*: React, React Router v6, Bootstrap 5, Axios  
*Storage*: N/A (solo frontend)  
*Testing*: Manual visual + verificación de flujos en browser  
*Target Platform*: Web (Chrome/Firefox/mobile)  
*Performance Goals*: Carga de home < 2s; sin regresiones en funcionalidad existente  
*Constraints*: No modificar el backend ni los contratos de API. Preservar todos los contextos existentes (`productContext`, `cartContext`, `authContext`).  
*Scale/Scope*: 3 archivos React modificados, 0 cambios de backend

## Project Structure

```
Ecommerce-Front/ecommerce/src/
├── pages/
│   ├── Home.js                    ← MODIFICAR (rediseño completo)
│   └── DetailProduct.js           ← MODIFICAR (rediseño completo)
├── components/
│   └── ProductCard.js             ← MODIFICAR si el diseño HTML incluye nuevo card
└── index.css / App.css            ← MODIFICAR si el HTML provisto incluye estilos custom
```

---

## Phase 1: Setup

*Purpose*: Preparar el terreno antes de recibir el HTML del diseño.

- [x] T001 Leer spec `home-product-redesign-spec.md` y entender los acceptance scenarios
- [x] T002 Auditar `Home.js`, `DetailProduct.js` y `ProductCard.js` actuales para mapear lógica a preservar
- [ ] T003 Documentar la lógica a preservar de cada archivo (ver tabla abajo)

**Lógica crítica a preservar:**

| Archivo | Lógica a preservar |
|---|---|
| `Home.js` | Paginación (8 items/página), `filteredProducts` de `productContext`, `setCurrentPage` |
| `DetailProduct.js` | `fetchProduct(id)`, `selectedImage`, `handleImageClick`, `handleAddToCart`, WhatsApp `wa.me` link, modal post-agregar, `goToCart`, `goToHome` |
| `ProductCard.js` | `navigate('/product/:id')`, imagen con fallback, precio formateado |

---

## Phase 2: Foundational

*Purpose*: Recibir y analizar el HTML del diseño. **Bloquea la implementación.**

> ⚠️ **BLOQUEADO**: Esta fase comienza cuando el usuario entregue el HTML del diseño.

- [ ] T004 Recibir HTML de la Home de parte del usuario
- [ ] T005 Recibir HTML del Detalle de Producto de parte del usuario
- [ ] T006 Identificar qué estilos CSS del HTML son nuevos vs. ya cubiertos por Bootstrap 5
- [ ] T007 Identificar si el HTML usa fuentes externas (Google Fonts, Font Awesome, etc.) y agregarlas al proyecto si es necesario

*Checkpoint*: HTML analizado, estilos mapeados, dependencias externas identificadas → listo para implementar.

---

## Phase 3: User Story 1 — Nueva Home (Priority: P1)

*Goal*: Reemplazar `Home.js` y `ProductCard.js` con el nuevo diseño visual manteniendo toda la funcionalidad existente.

*Independent Test*: Navegar a `http://localhost:3000/` y verificar: hero visible, grilla de productos renderiza, paginación funciona, buscador filtra en tiempo real.

### Implementación US1

- [ ] T008 [US1] Agregar estilos CSS del diseño al proyecto (`index.css` o archivo nuevo)
- [ ] T009 [US1] Reescribir `Home.js` convirtiendo el HTML del hero a JSX y conectando datos reales
- [ ] T010 [US1] Reescribir `ProductCard.js` con el nuevo diseño del card, manteniendo `navigate('/product/:id')`
- [ ] T011 [US1] Conectar la grilla de productos al `filteredProducts` de `productContext`
- [ ] T012 [US1] Reconectar paginación (8 productos por página, botones anterior/siguiente)
- [ ] T013 [US1] Verificar responsividad: 4 col desktop / 2 tablet / 1 mobile

### Verificación US1

- [ ] T014 [US1] Test manual: abrir `http://localhost:3000/`, verificar que el hero se muestra
- [ ] T015 [US1] Test manual: verificar que los productos cargan y se muestran con el nuevo diseño
- [ ] T016 [US1] Test manual: hacer click en un producto y verificar que navega al detalle
- [ ] T017 [US1] Test manual: usar el buscador y verificar filtrado en tiempo real
- [ ] T018 [US1] Test manual: verificar paginación con más de 8 productos
- [ ] T019 [US1] Test responsivo: redimensionar ventana a 375px (mobile) y verificar 1 columna

*Checkpoint*: Home con nuevo diseño funcional. El resto de la app (carrito, login, admin) sin regresiones.

---

## Phase 4: User Story 2 — Nuevo Detalle de Producto (Priority: P2)

*Goal*: Reemplazar `DetailProduct.js` con el nuevo diseño de galería y detalle manteniendo WhatsApp, selector de cantidad y navegación.

*Independent Test*: Navegar a `http://localhost:3000/product/1` y verificar: galería funciona, precio/stock visible, botón WhatsApp abre mensaje correcto.

### Implementación US2

- [ ] T020 [US2] Reescribir `DetailProduct.js` convirtiendo el HTML de la galería a JSX
- [ ] T021 [US2] Conectar `selectedImage` y `handleImageClick` a las miniaturas del nuevo diseño
- [ ] T022 [US2] Conectar precio, stock y descripción a los datos del producto de la API
- [ ] T023 [US2] Reconectar selector de cantidad con validación de stock máximo
- [ ] T024 [US2] Reconectar botón "Comprar" → `wa.me` con mensaje pre-cargado
- [ ] T025 [US2] Implementar estado "Sin stock" (botón deshabilitado) cuando `quantity === 0`
- [ ] T026 [US2] Agregar imagen placeholder si `mainImage` está vacío
- [ ] T027 [US2] Agregar botón/link "Volver" que navega con `navigate(-1)`

### Verificación US2

- [ ] T028 [US2] Test manual: abrir `/product/1`, verificar galería y thumbnail clickeable
- [ ] T029 [US2] Test manual: hacer click en miniatura y verificar que la imagen principal cambia
- [ ] T030 [US2] Test manual: verificar precio, stock y descripción con saltos de línea
- [ ] T031 [US2] Test manual: seleccionar cantidad y presionar "Comprar" → WhatsApp debe abrir con mensaje correcto
- [ ] T032 [US2] Test manual: simular producto sin stock (editar stock a 0 en admin) → botón deshabilitado
- [ ] T033 [US2] Test manual: verificar botón "Volver" regresa a la home

*Checkpoint*: Home + Detalle con nuevo diseño funcional y sin regresiones.

---

## Phase 5: Polish & Responsividad

*Purpose*: Ajustes finales cross-cutting.

- [ ] T034 Revisar consistencia visual entre Home y Detalle (paleta de colores, tipografía, espaciado)
- [ ] T035 Test en mobile (375px) y tablet (768px) de ambas páginas
- [ ] T036 Verificar que imágenes rotas muestran placeholder y no rompen el layout
- [ ] T037 Verificar que el header/navbar y footer (si existe) no tienen conflictos con los nuevos estilos
- [ ] T038 Limpieza de estilos CSS muertos del diseño anterior

---

## Dependencies & Execution Order

### Phase Dependencies

- *Phase 1 (Setup)*: ✅ Puede empezar ya — sin dependencias
- *Phase 2 (Foundational)*: ⛔ **BLOQUEADA** hasta recibir HTML del usuario
- *Phase 3 (US1)*: Depende de Phase 2 completada
- *Phase 4 (US2)*: Depende de Phase 2. Puede hacerse en paralelo con Phase 3 o después.
- *Phase 5 (Polish)*: Depende de Phases 3 y 4 completadas

### Within Each Phase

- Estilos CSS antes que JSX
- JSX estático antes de conectar datos dinámicos
- Datos conectados antes de verificar responsividad

## Notes

- Todo el trabajo es **frontend únicamente** — el backend Go no se toca.
- Los contextos React existentes (`productContext`, `cartContext`, `authContext`, `spinnerContext`) se usan sin modificación.
- El servidor de desarrollo se levanta con `npm start` en `Ecommerce-Front/ecommerce/`.
- Si el diseño HTML usa librerías no instaladas (e.g., Swiper.js, AOS.js), se instalan via `npm install`.
- La conversión HTML → JSX requiere: `class` → `className`, `for` → `htmlFor`, eventos `onclick` → `onClick`, self-closing tags.
