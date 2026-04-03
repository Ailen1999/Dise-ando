# Feature Specification: Portfolio Admin Panel — Panel de Administración del Portafolio

*Created*: 2026-03-11

---

## Contexto

Actualmente, la galería de diseños (`/designs`) y los proyectos del portafolio están hard-codeados en archivos `.tsx` (`app/designs/page.tsx`). Cualquier cambio requiere modificar código fuente manualmente.

Este spec define un **Panel de Administración** que permitirá al dueño del portafolio:

1. **Gestionar Categorías** — crear, editar y eliminar categorías de diseños.
2. **Gestionar Diseños** — agregar nuevos diseños con su HTML, imagen de portada y categoría.
3. **Gestionar Proyectos** — agregar y editar los proyectos del portafolio principal (`/projects`).
4. **Subir HTMLs** — cargar archivos HTML vía drag-and-drop o editor de código inline.

La data actualmente en `CATEGORIES` dentro de `designs/page.tsx` pasará a ser dinámica, leyendo desde un JSON persistido en el servidor (o `localStorage` como MVP inicial).

---

## User Scenarios & Testing (mandatory)

### User Story 1 — Agregar un Nuevo Diseño HTML (Priority: P1)

El administrador recibe un nuevo HTML de diseño y quiere subirlo a la galería para que se vea en el portafolio sin tocar código.

**Flujo esperado:**
- Ingresa al panel admin en `/admin`.
- Va a "Diseños" y hace clic en "Nuevo Diseño".
- Completa: título, año, categoría (dropdown), imagen de portada (URL o upload).
- Sube el archivo HTML mediante drag-and-drop o pega el código HTML directamente en el editor.
- Hace clic en "Guardar".
- El diseño aparece inmediatamente en `/designs` bajo la categoría elegida.

*Why this priority*: Es el caso de uso principal. Sin esto, el admin panel no tiene razón de ser.

*Independent Test*: Puede probarse completamente subiendo un nuevo diseño y verificando que aparece en `/designs` sin reiniciar la app.

*Acceptance Scenarios*:

1. *Given* el admin en "/admin/designs/new", *When* completa el formulario y sube un HTML válido, *Then* el diseño aparece en `/designs` bajo la categoría seleccionada.
2. *Given* el admin sube un HTML, *When* hace clic en "Vista Previa", *Then* se abre una pestaña mostrando el HTML renderizado.
3. *Given* el admin guarda un diseño, *When* accede a `/designs` en modo público, *Then* el diseño muestra la imagen de portada y al clickearlo abre el HTML en nueva pestaña.
4. *Given* el admin no completa el título, *When* intenta guardar, *Then* ve un error de validación y el formulario no se envía.

---

### User Story 2 — Gestionar Categorías (Priority: P1)

El admin quiere crear una nueva categoría "Tecnología" para organizar futuros diseños.

**Flujo esperado:**
- Ingresa a "Categorías" en el panel admin.
- Hace clic en "Nueva Categoría".
- Completa: nombre, descripción, imagen de portada.
- Guarda y la categoría aparece en `/designs`.

*Why this priority*: Las categorías son el contenedor de los diseños. Sin poder crearlas dinámicamente, el panel queda limitado.

*Independent Test*: Crear una categoría, verificar que aparece en `/designs`, luego asignarle un diseño existente.

*Acceptance Scenarios*:

1. *Given* el admin crea una categoría "Tecnología", *When* va a `/designs`, *Then* ve la nueva categoría en el grid.
2. *Given* una categoría tiene 0 proyectos, *When* el admin la elimina, *Then* desaparece del grid público.
3. *Given* una categoría tiene proyectos asignados, *When* el admin intenta eliminarla, *Then* recibe una advertencia de que tiene N diseños y debe confirmar.
4. *Given* el admin edita la imagen de una categoría, *When* guarda, *Then* la nueva imagen aparece en la card de la categoría en `/designs`.

---

### User Story 3 — Editar y Eliminar Diseños (Priority: P2)

El admin quiere actualizar el HTML de un diseño existente porque el cliente envió una versión mejorada.

**Flujo esperado:**
- Ingresa a "Diseños" en el panel admin.
- Busca el diseño "Belletny Home".
- Hace clic en "Editar".
- Reemplaza el HTML con el nuevo contenido.
- Guarda. El diseño actualizado se refleja inmediatamente al abrir el link.

*Why this priority*: Editar diseños ya existentes es esencial para el mantenimiento del portafolio.

*Independent Test*: Editar el HTML de un diseño existente, guardarlo, y verificar que el cambio se refleja al abrir el diseño.

*Acceptance Scenarios*:

1. *Given* el admin edita el HTML de "Belletny Home", *When* guarda, *Then* el HTML actualizado se sirve al abrir el diseño desde `/designs`.
2. *Given* el admin elimina un diseño, *When* confirma la eliminación, *Then* el diseño no aparece más en la categoría correspondiente.
3. *Given* el admin edita la imagen de portada de un diseño, *When* guarda, *Then* la nueva imagen aparece en la card dentro de la galería.

---

### User Story 4 — Gestionar Proyectos del Portafolio (Priority: P2)

El admin quiere agregar un nuevo proyecto a la sección "Proyectos" del portafolio principal.

**Flujo esperado:**
- Va a "Proyectos" en el panel admin.
- Completa: título, descripción, tecnologías usadas, imagen, link externo (opcional).
- Guarda. El proyecto aparece en `/projects`.

*Why this priority*: Los proyectos son la segunda sección de contenido del portafolio. Es independiente de los diseños.

*Independent Test*: Agregar un proyecto nuevo y verificar que aparece en `/projects`.

*Acceptance Scenarios*:

1. *Given* el admin agrega un nuevo proyecto con imagen y descripción, *When* va a `/projects`, *Then* el proyecto aparece en el listado.
2. *Given* el admin reordena los proyectos arrastrándolos, *When* guarda el orden, *Then* `/projects` muestra el nuevo orden.

---

### User Story 5 — Autenticación del Admin (Priority: P1)

El panel admin debe estar protegido con una contraseña o PIN para que no sea accesible públicamente.

**Flujo esperado:**
- El admin navega a `/admin`.
- Ve una pantalla de login con campo de contraseña.
- Ingresa la contraseña correcta.
- Accede al panel.
- La sesión persiste en `localStorage` hasta que haga logout o expire (24h).

*Why this priority*: Sin autenticación, cualquier persona que conozca la URL puede modificar el portafolio.

*Independent Test*: Intentar acceder a `/admin` sin login → redirige a `/admin/login`. Login con credenciales correctas → accede al panel.

*Acceptance Scenarios*:

1. *Given* el admin no está autenticado, *When* navega a `/admin`, *Then* es redirigido a `/admin/login`.
2. *Given* el admin ingresa la contraseña correcta, *When* hace submit, *Then* accede al panel y la sesión se guarda por 24h.
3. *Given* el admin ingresa contraseña incorrecta, *When* hace submit, *Then* ve un error y permanece en `/admin/login`.
4. *Given* el admin está autenticado, *When* hace clic en "Cerrar Sesión", *Then* es redirigido a `/admin/login` y la sesión se invalida.

---

### Edge Cases

- **HTML con scripts maliciosos:** El HTML subido se sirve como archivo estático dentro de un iframe o nueva pestaña. No se ejecuta en el contexto de la app.
- **Archivo HTML mayor a 5MB:** Se muestra error de validación y no se permite guardar.
- **Categoría con nombre duplicado:** El sistema valida y muestra error inline.
- **Imagen de portada inaccesible (URL rota):** Se muestra un placeholder con ícono de imagen rota en la card, tanto en admin como en la galería pública.
- **Sesión expirada:** Si el token de sesión venció, al intentar guardar cualquier cosa el sistema redirige a `/admin/login` con mensaje "Tu sesión expiró. Volvé a iniciar sesión."
- **Pérdida de conectividad al subir HTML:** El formulario guarda un borrador en `localStorage` para no perder el trabajo.

---

## Requirements (mandatory)

### Functional Requirements

**Autenticación:**
- *FR-001*: El sistema DEBE requerir una contraseña para acceder a `/admin` y todas sus sub-rutas.
- *FR-002*: La sesión autenticada DEBE persistir durante 24 horas sin requerir nuevo login.
- *FR-003*: El sistema DEBE permitir cerrar sesión manualmente.

**Diseños:**
- *FR-004*: El admin DEBE poder crear un diseño con: título, año, categoría, imagen de portada (URL), y contenido HTML.
- *FR-005*: El contenido HTML DEBE poder cargarse mediante: (a) drag-and-drop de un archivo `.html`, o (b) un editor de texto con syntax highlighting.
- *FR-006*: El sistema DEBE guardar el HTML como archivo estático en `/public/designs/[slug].html`.
- *FR-007*: El admin DEBE poder ver una vista previa del HTML en una nueva pestaña antes de confirmar.
- *FR-008*: El admin DEBE poder editar todos los campos de un diseño existente, incluyendo reemplazar el HTML completo.
- *FR-009*: El admin DEBE poder eliminar un diseño (con confirmación).
- *FR-010*: Los cambios en diseños DEBEN reflejarse en `/designs` sin necesidad de reiniciar la app.

**Categorías:**
- *FR-011*: El admin DEBE poder crear, editar y eliminar categorías con: nombre, descripción e imagen de portada.
- *FR-012*: Al eliminar una categoría con diseños, DEBE mostrarse una advertencia de confirmación.
- *FR-013*: Las categorías DEBEN poder reordenarse mediante drag-and-drop.

**Proyectos:**
- *FR-014*: El admin DEBE poder agregar proyectos con: título, descripción, tecnologías, imagen y link externo opcional.
- *FR-015*: Los proyectos DEBEN poder reordenarse.

**Persistencia:**
- *FR-016*: Todos los datos (categorías, diseños, proyectos) DEBEN persistir en una base de datos **SQLite** gestionada por el backend Go.
- *FR-017*: El frontend (galería pública) DEBE consumir los mismos endpoints REST del backend Go que utiliza el admin panel (ej. `GET /api/categories`, `GET /api/designs`).
- *FR-018*: Los archivos `.html` de los diseños DEBEN almacenarse en el filesystem del servidor (`/public/designs/`) y su ruta registrada en SQLite.
- *FR-019*: El admin DEBE autenticarse con un JWT firmado por el backend Go antes de poder usar cualquier endpoint de escritura.

### Key Entities

- *Categoría*: `id` (autoincrement), `title` (TEXT), `description` (TEXT), `image_url` (TEXT), `sort_order` (INTEGER), `created_at` (DATETIME).
- *Diseño*: `id` (autoincrement), `title` (TEXT), `year` (TEXT), `category_id` (FK → Categoría), `image_url` (TEXT), `html_path` (TEXT — ruta relativa a `/public/designs/`), `slug` (TEXT UNIQUE), `created_at` (DATETIME).
- *Proyecto*: `id` (autoincrement), `title` (TEXT), `description` (TEXT), `technologies` (TEXT — JSON array serializado), `image_url` (TEXT), `external_url` (TEXT nullable), `sort_order` (INTEGER).
- *Token de Admin*: JWT firmado con secret del servidor, expiración 24h. No se persiste en DB — stateless.

### Constraints Técnicos

- **Frontend**: Next.js 14, React 18, Tailwind CSS — misma stack del proyecto.
- **Persistencia**: **SQLite via el backend Go existente** (`database/sql` + `mattn/go-sqlite3`). Los datos de categorías, diseños y proyectos se persisten en la base de datos SQLite del servidor.
- **Archivos HTML**: Los HTMLs se guardan como archivos estáticos en `/public/designs/[slug].html` mediante un endpoint Go (`POST /api/admin/designs/upload`). La DB almacena la ruta del archivo, no el contenido completo.
- **API Go**: Se agregan nuevas rutas protegidas bajo `/api/admin/` al router Go existente.
- **Autenticación**: Password único configurado en variables de entorno del servidor Go. El frontend recibe un JWT con expiración de 24h.
- **Seguridad HTML**: Los HTMLs se sirven como archivos estáticos independientes, nunca se inyectan en el DOM de la app.

---

## Success Criteria (mandatory)

### Measurable Outcomes

- *SC-001*: El admin puede subir un nuevo diseño HTML completo (desde menú → formulario → guardar) en menos de 3 minutos.
- *SC-002*: El diseño aparece en `/designs` en menos de 5 segundos después de guardarlo.
- *SC-003*: El HTML del diseño se renderiza correctamente al abrirlo desde la galería (mismo resultado que abrir el `.html` localmente).
- *SC-004*: Un usuario sin autenticación NO puede acceder a ninguna ruta bajo `/admin`.
- *SC-005*: El admin puede crear una nueva categoría y asignarle un diseño en menos de 2 minutos en total.
- *SC-006*: Al agregar, editar o eliminar contenido, la galería pública (`/designs`) refleja el cambio sin necesitar reload manual de la página.
