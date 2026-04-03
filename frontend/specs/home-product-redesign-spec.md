# Feature Specification: Rediseño de Home y Detalle de Producto

*Created*: 2026-03-03

## User Scenarios & Testing (mandatory)

### User Story 1 - Nueva Home con Hero y Grilla de Productos (Priority: P1)

Un visitante llega al sitio, ve un banner principal atractivo que comunica la propuesta de valor de la mueblería, y debajo encuentra el catálogo de productos en una grilla visual moderna con filtro de búsqueda integrado. Puede navegar entre páginas de productos sin recargar la página.

*Why this priority*: Es la primera impresión del usuario. Una home clara y atractiva aumenta el tiempo en el sitio y la tasa de conversión.

*Independent Test*: Se puede testear cargando la ruta `/` y verificando que el hero se muestra, los productos cargan desde la API y la paginación funciona.

*Acceptance Scenarios*:

1. *Given* el usuario ingresa a la home, *When* la página carga, *Then* se muestra un hero banner con imagen de fondo, título y botón de llamada a la acción que lleva al catálogo.
2. *Given* la sección de productos carga, *When* hay productos disponibles, *Then* se muestran en una grilla responsiva de 4 columnas en desktop, 2 en tablet y 1 en mobile.
3. *Given* hay más de 8 productos, *When* el usuario hace click en paginación, *Then* se muestra el siguiente grupo de productos sin recargar la página.
4. *Given* el usuario escribe en el buscador de la home, *When* escribe texto, *Then* los productos se filtran visualmente en tiempo real.
5. *Given* no hay productos, *When* se carga la home, *Then* se muestra un mensaje vacío amigable.

---

### User Story 2 - Nuevo Detalle de Producto (Priority: P2)

Un usuario hace click en un producto de la home y llega a una página de detalle con una galería de imágenes interactiva, información clara del precio, stock y descripción, y un botón prominente para contactar por WhatsApp.

*Why this priority*: Es el último paso antes de la conversión — aquí el usuario decide si compra o no. Un diseño claro y confiable reduce la fricción.

*Independent Test*: Se puede testear navegando a `/product/:id` y verificando que la galería, precio, stock y botón de WhatsApp funcionan correctamente.

*Acceptance Scenarios*:

1. *Given* el usuario navega a un producto, *When* la página carga, *Then* se muestra la imagen principal grande y las imágenes secundarias como miniaturas clickeables debajo o al costado.
2. *Given* el usuario hace click en una miniatura, *When* la selecciona, *Then* la imagen principal cambia a la seleccionada con una transición suave.
3. *Given* el producto tiene stock, *When* el usuario ve el detalle, *Then* se muestra el precio, el stock disponible y el selector de cantidad.
4. *Given* el producto está agotado, *When* el usuario ve el detalle, *Then* el botón de compra está deshabilitado y muestra "Sin stock".
5. *Given* el usuario selecciona cantidad y hace click en "Comprar", *When* se presiona el botón, *Then* se abre WhatsApp con un mensaje pre-cargado con el nombre del producto y la cantidad.
6. *Given* el usuario está en la página de detalle, *When* hace click en "Volver", *Then* regresa a la home manteniendo el scroll anterior.

---

### Edge Cases

- ¿Qué pasa si `mainImage` del producto está vacío? → Mostrar imagen placeholder.
- ¿Qué pasa si `images` (galería) está vacía? → Ocultar el carrusel de miniaturas, solo mostrar la imagen principal.
- ¿Qué pasa si el producto del `/product/:id` no existe en la API? → Mostrar una pantalla de "Producto no encontrado" con botón para volver a la home.
- ¿Qué pasa si el HTML de diseño usa fuentes o íconos externos (Google Fonts, Font Awesome)? → Importarlos correctamente en el proyecto React.
- ¿Qué pasa si la descripción tiene saltos de línea (`\n`)? → Renderizarlos correctamente (ya existe lógica con `replace`).

---

## Requirements (mandatory)

### Functional Requirements

- *FR-001*: La Home DEBE incluir un **hero section** con imagen de fondo, título, subtítulo y botón CTA configurable.
- *FR-002*: La Home DEBE mostrar todos los productos en una **grilla responsiva** (4 col desktop / 2 tablet / 1 mobile).
- *FR-003*: La Home DEBE mantener la **paginación existente** de 8 productos por página.
- *FR-004*: La Home DEBE mantener el **filtro de búsqueda** en tiempo real que ya existe via `productContext`.
- *FR-005*: El nuevo diseño se implementará **reemplazando** `Home.js` y `DetailProduct.js` con el HTML provisto por el usuario, adaptado a React (JSX).
- *FR-006*: El **ProductCard** puede ser actualizado si el diseño HTML provisto incluye un diseño de card diferente al actual.
- *FR-007*: La página de detalle DEBE incluir una **galería de imágenes** con imagen principal grande y miniaturas clickeables.
- *FR-008*: La página de detalle DEBE mostrar: nombre del producto, precio formateado, stock, descripción y cantidad seleccionable.
- *FR-009*: El botón "Comprar" DEBE usar la integración de **WhatsApp existente** (`REACT_APP_WHATSAPP_NUMBER`).
- *FR-010*: La página de detalle DEBE mostrar el estado **"Sin stock"** cuando `quantity === 0`, deshabilitando el botón de compra.
- *FR-011*: Todos los **estilos** del diseño HTML provisto (CSS, clases, variables) serán adaptados al sistema de estilos del proyecto React.
- *FR-012*: El diseño DEBE ser **totalmente responsivo** (mobile-first).

### Key Entities (include if feature involves data)

- *Product*: `id`, `name`, `description`, `price`, `quantity` (stock), `mainImage`, `images[]` — sin cambios en el modelo.
- *ProductCard*: Componente React que representa un producto en la grilla de la home. Puede ser rediseñado para responder al nuevo visual.

## Implementation Notes

> **Pendiente**: El usuario entregará los archivos HTML del diseño. Una vez recibidos se procederá a:
> 1. Extraer el HTML/CSS del hero, grilla y product card para `Home.js`.
> 2. Extraer el HTML/CSS de la galería y detalle para `DetailProduct.js`.
> 3. Convertir HTML → JSX (clases, atributos, eventos, etc.).
> 4. Conectar los datos reales del contexto/API existentes.
> 5. Preservar toda la lógica de negocio existente (carrito, WhatsApp, paginación, búsqueda).

## Success Criteria (mandatory)

### Measurable Outcomes

- *SC-001*: La home carga y muestra productos en menos de 2 segundos en conexión normal.
- *SC-002*: El diseño visual del HTML provisto es reproducido fielmente en React (sin diferencias visuales significativas).
- *SC-003*: La paginación, búsqueda y navegación al detalle de producto siguen funcionando correctamente tras el rediseño.
- *SC-004*: La página de detalle permite seleccionar cantidad y abrir WhatsApp con el mensaje correcto en un click.
- *SC-005*: El diseño es completamente responsivo en mobile (< 768px), tablet (768–1024px) y desktop (> 1024px).
- *SC-006*: No hay regresiones en el resto de la aplicación (carrito, login, panel admin) tras el rediseño.
