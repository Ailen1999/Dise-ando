# Implementation Plan: Portfolio Admin Panel

*Date*: 2026-03-11  
*Spec*: [portfolio-admin-spec.md](./portfolio-admin-spec.md)

---

## Summary

Construir un panel de administración para el portafolio que permita gestionar categorías, diseños HTML y proyectos de forma dinámica, sin editar código fuente. Los datos se persisten en **SQLite** gestionado por el **backend Go** existente. El frontend Next.js consume endpoints REST para mostrar la galería pública en `/designs` y el panel admin en `/admin`.

El principal desafío de diseño es el manejo de archivos HTML: los HTMLs se suben al servidor Go, que los guarda en disco bajo `/frontend/public/designs/[slug].html`, y registra la ruta en SQLite. La galería pública los sirve directamente como archivos estáticos.

---

## Technical Context

*Language/Version*: Go 1.21 (backend) + TypeScript / Next.js 14 (frontend)  
*Primary Dependencies*: `net/http`, `mattn/go-sqlite3`, `golang-jwt/jwt` (Go) | `framer-motion`, `lucide-react`, Tailwind CSS (Next.js)  
*Storage*: SQLite via `mattn/go-sqlite3` — mismo driver ya en uso por el proyecto  
*Testing*: Tests backend: `go test ./...`; Tests frontend: manual en browser  
*Target Platform*: Web desktop (Chrome/Firefox)  
*Performance Goals*: Carga de galería pública < 500ms; upload de HTML < 5s  
*Constraints*: No romper la galería pública existente. El frontend debe funcionar sin panel admin (fallback a datos hard-codeados si la API no responde).  
*Scale/Scope*: ~50 diseños, ~20 proyectos, 1 administrador

---

## Project Structure

```
portafolio/
├── backend/                          ← Backend Go (actualmente vacío)
│   ├── main.go                       [NUEVO]
│   ├── go.mod                        [NUEVO]
│   ├── database/
│   │   └── database.go               [NUEVO] — init SQLite, migraciones
│   ├── models/
│   │   ├── category.go               [NUEVO]
│   │   ├── design.go                 [NUEVO]
│   │   └── project.go                [NUEVO]
│   ├── repositories/
│   │   ├── category_repository.go    [NUEVO]
│   │   ├── design_repository.go      [NUEVO]
│   │   └── project_repository.go     [NUEVO]
│   ├── services/
│   │   ├── category_service.go       [NUEVO]
│   │   ├── design_service.go         [NUEVO]
│   │   └── project_service.go        [NUEVO]
│   ├── controllers/
│   │   ├── auth_controller.go        [NUEVO]
│   │   ├── category_controller.go    [NUEVO]
│   │   ├── design_controller.go      [NUEVO]
│   │   └── project_controller.go     [NUEVO]
│   ├── middleware/
│   │   └── auth_middleware.go        [NUEVO] — validación JWT
│   └── router/
│       └── router.go                 [NUEVO]
│
└── frontend/
    ├── app/
    │   ├── designs/
    │   │   └── page.tsx              [MODIFICAR] — leer desde API en vez de hard-code
    │   ├── projects/
    │   │   └── page.tsx              [MODIFICAR] — leer desde API
    │   └── admin/
    │       ├── layout.tsx            [NUEVO] — layout admin con sidebar
    │       ├── page.tsx              [NUEVO] — dashboard
    │       ├── login/
    │       │   └── page.tsx          [NUEVO] — pantalla de login
    │       ├── categories/
    │       │   ├── page.tsx          [NUEVO] — listado de categorías
    │       │   └── [id]/page.tsx     [NUEVO] — crear/editar categoría
    │       ├── designs/
    │       │   ├── page.tsx          [NUEVO] — listado de diseños
    │       │   └── [id]/page.tsx     [NUEVO] — crear/editar diseño + upload HTML
    │       └── projects/
    │           ├── page.tsx          [NUEVO] — listado de proyectos
    │           └── [id]/page.tsx     [NUEVO] — crear/editar proyecto
    ├── lib/
    │   └── api.ts                    [NUEVO] — cliente HTTP para el backend Go
    └── public/
        └── designs/                  ← Archivos HTML servidos estáticamente (ya existe)
```

*Structure Decision*: Backend Go en `/backend/` con arquitectura en capas (models → repositories → services → controllers). Frontend Next.js mantiene su estructura actual bajo `/frontend/app/`, agregando rutas admin en `/admin/*`.

---

## Phase 1: Setup (Shared Infrastructure)

*Purpose*: Inicializar el proyecto Go, instalar dependencias y preparar la base de datos SQLite.

- [ ] T001 `[SETUP]` Inicializar módulo Go en `/backend/`: `go mod init portafolio-backend`
- [ ] T002 `[SETUP]` Instalar dependencias Go:
  - `go get github.com/mattn/go-sqlite3`
  - `go get github.com/golang-jwt/jwt/v5`
  - `go get github.com/rs/cors`
- [ ] T003 `[SETUP]` Crear `backend/main.go` con servidor HTTP básico en puerto `:8080`
- [ ] T004 `[SETUP]` Crear `backend/database/database.go`: inicializa la conexión SQLite y crea el archivo `portafolio.db`
- [ ] T005 `[SETUP]` Crear las migraciones inline en `database.go` con las tablas: `categories`, `designs`, `projects`

```sql
-- categories
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- designs
CREATE TABLE IF NOT EXISTS designs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  year TEXT,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  image_url TEXT,
  html_path TEXT,
  slug TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- projects
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  technologies TEXT,
  image_url TEXT,
  external_url TEXT,
  sort_order INTEGER DEFAULT 0
);
```

- [ ] T006 `[SETUP]` Crear `backend/router/router.go` con estructura de rutas vacías (públicas y protegidas)
- [ ] T007 `[SETUP]` Crear `backend/middleware/auth_middleware.go` con validación JWT básica
- [ ] T008 `[SETUP]` Crear variable de entorno `ADMIN_PASSWORD` leída desde `.env` para el secret JWT
- [ ] T009 `[SETUP]` Verificar que el servidor arranca y responde `GET /health → 200 OK`

*Checkpoint*: `curl http://localhost:8080/health` devuelve `{"status":"ok"}`. Base de datos creada con las 3 tablas.

---

## Phase 2: Foundational (Blocking Prerequisites)

*Purpose*: Implementar autenticación JWT y poblar la DB con los datos actuales del portafolio (seed). Esto desbloquea todas las historias de usuario.

*⚠️ CRITICAL*: Nada del panel admin funciona hasta que esta fase esté completa.

- [ ] T010 `[AUTH]` Implementar `POST /api/admin/login` en `auth_controller.go`:
  - Recibe `{"password": "..."}`, compara con `ADMIN_PASSWORD`
  - Si coincide → devuelve JWT con expiración 24h
  - Si no → devuelve `401 Unauthorized`
- [ ] T011 `[AUTH]` Proteger todas las rutas `/api/admin/*` con `auth_middleware.go`
- [ ] T012 `[SEED]` Crear script de seed `database/seed.go` con todos los datos actuales hard-codeados en `designs/page.tsx` convertidos a registros SQLite (categorías: Gastronomía, E-commerce, Maquillaje, Branding; + diseños existentes)
- [ ] T013 `[FRONTEND]` Crear `frontend/lib/api.ts` — cliente HTTP centralizado:
  - `getCategories()`, `getDesigns(categoryId?)`, `getProjects()`
  - `adminLogin(password)`, `adminCreateDesign(...)`, etc.
  - Gestión del JWT en `localStorage`

*Checkpoint*: `POST /api/admin/login` con password correcto devuelve JWT. Con ese JWT se puede llamar a rutas protegidas.

---

## Phase 3: User Story 5 — Autenticación Admin (Priority: P1)

*Goal*: El panel `/admin` está protegido. Sin login válido, redirige a `/admin/login`.

*Independent Test*: Navegar a `/admin` sin autenticar → redirige a `/admin/login`. Login correcto → accede al dashboard.

### Implementación US5

- [ ] T014 `[US5]` Crear `frontend/app/admin/login/page.tsx`:
  - Formulario con campo de contraseña
  - Llama a `POST /api/admin/login` via `api.ts`
  - Si éxito → guarda JWT en `localStorage` + redirige a `/admin`
  - Si falla → muestra error "Contraseña incorrecta"
- [ ] T015 `[US5]` Crear `frontend/app/admin/layout.tsx`:
  - Verifica JWT en `localStorage` al montar
  - Si no hay JWT válido → redirige a `/admin/login`
  - Si hay JWT → renderiza el sidebar de navegación admin + `{children}`
- [ ] T016 `[US5]` Crear `frontend/app/admin/page.tsx` — dashboard básico con tarjetas de conteo (N categorías, N diseños, N proyectos)
- [ ] T017 `[US5]` Agregar botón "Cerrar Sesión" en el sidebar que limpia el JWT y redirige a `/admin/login`

### Tests US5

- [ ] T018 `[US5]` Test manual: navegar a `/admin` sin JWT → verificar redirección a `/admin/login`
- [ ] T019 `[US5]` Test manual: login con password correcto → accede → logout → vuelve a `/admin/login`

*Checkpoint*: El panel admin está completamente protegido. Login y logout funcionan.

---

## Phase 4: User Story 2 — Gestionar Categorías (Priority: P1)

*Goal*: El admin puede crear, editar y eliminar categorías desde el panel. La galería pública `/designs` las lee desde la API.

*Independent Test*: Crear una categoría "Test" → ir a `/designs` → aparece en el grid.

### Backend US2

- [ ] T020 `[US2]` Crear `models/category.go` con struct `Category`
- [ ] T021 `[US2]` Crear `repositories/category_repository.go`: `GetAll`, `GetByID`, `Create`, `Update`, `Delete`
- [ ] T022 `[US2]` Crear `services/category_service.go`: lógica de validación (título requerido, advertencia si tiene diseños al eliminar)
- [ ] T023 `[US2]` Crear `controllers/category_controller.go` con handlers:
  - `GET /api/categories` — público
  - `POST /api/admin/categories` — protegido
  - `PUT /api/admin/categories/:id` — protegido
  - `DELETE /api/admin/categories/:id` — protegido (devuelve 409 si tiene diseños, a menos que se fuerce con `?force=true`)
- [ ] T024 `[US2]` Registrar rutas en `router.go`

### Frontend US2

- [ ] T025 `[US2]` Modificar `frontend/app/designs/page.tsx`: reemplazar el array `CATEGORIES` hard-codeado por una llamada a `api.getCategories()` con `useEffect` + estado local (o `fetch` en Server Component)
- [ ] T026 `[US2]` Crear `frontend/app/admin/categories/page.tsx`: tabla con las categorías existentes, botón "Nueva Categoría", botón "Editar" y "Eliminar" por fila
- [ ] T027 `[US2]` Crear `frontend/app/admin/categories/[id]/page.tsx`: formulario con campos título, descripción, imagen (URL). Soporta tanto creación (`new`) como edición (`[id]`)

### Tests US2

- [ ] T028 `[US2]` Test manual: crear categoría "Tecnología" → ir a `/designs` → aparece en el grid
- [ ] T029 `[US2]` Test manual: intentar eliminar categoría con diseños → ver advertencia → confirmar → desaparece

*Checkpoint*: Categorías CRUD operativo. La galería pública es dinámica.

---

## Phase 5: User Story 1 — Agregar Diseño HTML (Priority: P1)

*Goal*: El admin sube un HTML + metadatos → el diseño aparece en `/designs` y abre el HTML en nueva pestaña.

*Independent Test*: Subir un `.html` nuevo → ir a `/designs` → abrir el diseño → se renderiza correctamente.

### Backend US1

- [ ] T030 `[US1]` Crear `models/design.go` con struct `Design`
- [ ] T031 `[US1]` Crear `repositories/design_repository.go`: `GetAll`, `GetByCategory`, `GetByID`, `Create`, `Update`, `Delete`
- [ ] T032 `[US1]` Crear `services/design_service.go`:
  - Genera `slug` único a partir del título (ej. "Belletny Home" → `belletny-home`)
  - Valida que el slug no exista ya en DB
  - Guarda el archivo HTML en `../frontend/public/designs/[slug].html` (ruta relativa al binario Go)
- [ ] T033 `[US1]` Crear `controllers/design_controller.go` con handlers:
  - `GET /api/designs?categoryId=X` — público
  - `POST /api/admin/designs` — protegido, acepta multipart (metadata + archivo HTML)
  - `PUT /api/admin/designs/:id` — protegido
  - `DELETE /api/admin/designs/:id` — protegido (elimina de DB y del filesystem)
- [ ] T034 `[US1]` Registrar rutas en `router.go`

### Frontend US1

- [ ] T035 `[US1]` Adaptar `frontend/app/designs/page.tsx`: al seleccionar una categoría, cargar los diseños via `api.getDesigns(categoryId)`
- [ ] T036 `[US1]` Crear `frontend/app/admin/designs/page.tsx`: tabla con diseños, categoría, año — botones editar/eliminar
- [ ] T037 `[US1]` Crear `frontend/app/admin/designs/[id]/page.tsx`:
  - Campos: título, año, categoría (dropdown con categorías de la API), imagen (URL)
  - **Zona de upload HTML**: área drag-and-drop para soltar un `.html` + fallback con `<textarea>` para pegar código
  - Botón "Vista Previa" → abre el HTML en nueva pestaña usando `URL.createObjectURL()`
  - Validación: archivo ≤ 5MB, extensión `.html`
  - Al guardar → llama a `POST /api/admin/designs` con `FormData`

### Tests US1

- [ ] T038 `[US1]` Test manual: subir un HTML nuevo con todas las categorías → verificar que aparece en `/designs`
- [ ] T039 `[US1]` Test manual: hacer clic en el diseño desde la galería → HTML se abre en nueva pestaña y se renderiza
- [ ] T040 `[US1]` Test manual: intentar subir archivo > 5MB → ver error de validación

*Checkpoint*: El flujo completo de carga de diseños HTML funciona de principio a fin.

---

## Phase 6: User Story 3 — Editar y Eliminar Diseños (Priority: P2)

*Goal*: El admin puede reemplazar el HTML de un diseño existente y ver el cambio reflejado inmediatamente.

*Independent Test*: Editar el HTML de "Belletny Home", guardarlo, abrir el diseño → se muestra el HTML actualizado.

### Implementación US3

- [ ] T041 `[US3]` Actualizar `design_service.go`: al editar un diseño con nuevo HTML, sobrescribir el archivo `.html` existente en disco
- [ ] T042 `[US3]` Verificar que `PUT /api/admin/designs/:id` soporta actualización parcial (sin HTML si el admin no lo reemplaza)
- [ ] T043 `[US3]` El formulario en `designs/[id]/page.tsx` (ya creado en T037) carga los datos actuales del diseño al editar — asegurar que funciona tanto para create como para edit

### Tests US3

- [ ] T044 `[US3]` Test manual: editar "Belletny Home" con nuevo HTML → verificar que el link existente sirve el HTML actualizado
- [ ] T045 `[US3]` Test manual: eliminar un diseño → verificar que desaparece de `/designs` y el `.html` se elimina del disco

*Checkpoint*: User Stories 1, 2 y 3 son todas funcionales e independientemente verificables.

---

## Phase 7: User Story 4 — Gestionar Proyectos (Priority: P2)

*Goal*: El admin gestiona los proyectos del portafolio desde el panel. La página `/projects` los lee dinámicamente.

*Independent Test*: Agregar un proyecto nuevo → ir a `/projects` → aparece en la lista.

### Backend US4

- [ ] T046 `[US4]` Crear `models/project.go`, `repositories/project_repository.go`, `services/project_service.go`
- [ ] T047 `[US4]` Crear `controllers/project_controller.go`:
  - `GET /api/projects` — público
  - `POST /api/admin/projects` — protegido
  - `PUT /api/admin/projects/:id` — protegido
  - `DELETE /api/admin/projects/:id` — protegido
- [ ] T048 `[US4]` Registrar rutas en `router.go`

### Frontend US4

- [ ] T049 `[US4]` Modificar `frontend/app/projects/page.tsx`: leer proyectos dinámicamente desde `api.getProjects()`
- [ ] T050 `[US4]` Crear `frontend/app/admin/projects/page.tsx`: tabla con proyectos, botones editar/eliminar
- [ ] T051 `[US4]` Crear `frontend/app/admin/projects/[id]/page.tsx`: formulario con campos título, descripción, tecnologías (tags input), imagen URL, link externo (opcional)

### Tests US4

- [ ] T052 `[US4]` Test manual: agregar proyecto → ir a `/projects` → aparece

*Checkpoint*: Todos los contenidos del portafolio son administrables desde el panel.

---

## Phase 8: Polish & Cross-Cutting

*Purpose*: UX del panel admin, seguridad y robustez general.

- [ ] T053 Diseño del sidebar admin — navegación entre Categorías, Diseños, Proyectos con indicador de sección activa. Estilo consistente con el portafolio (fondo oscuro, acento blanco)
- [ ] T054 Añadir confirmación antes de eliminar cualquier entidad (modal o dialog nativo)
- [ ] T055 Toast notifications para feedback de acciones (guardado exitoso, error, etc.)
- [ ] T056 Configurar CORS en el backend Go para permitir requests del frontend Next.js en desarrollo (`localhost:3000`) y producción
- [ ] T057 Agregar fallback en la galería pública: si la API Go no responde, mostrar los datos de `CATEGORIES` hard-codeados existentes para no romper el sitio
- [ ] T058 Ejecutar seed completo con todos los diseños existentes para que la DB refleje el estado actual del portafolio
- [ ] T059 Documentar en `README.md` del backend cómo levantar el servidor Go y la variable `ADMIN_PASSWORD`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sin dependencias — empezar aquí
- **Phase 2 (Foundational)**: Depende de Phase 1 — bloquea todo el resto
- **Phase 3 (Auth)**: Depende de Phase 2 — bloquea el acceso al panel
- **Phase 4 (Categorías)**: Depende de Phase 2 y 3
- **Phase 5 (Diseños Upload)**: Depende de Phase 4 (necesita categorías para asignar)
- **Phase 6 (Editar Diseños)**: Co-implementada con Phase 5, tests independientes
- **Phase 7 (Proyectos)**: Puede correr en paralelo con Phase 5 una vez Phase 2 y 3 estén listas
- **Phase 8 (Polish)**: Depende de Phases 3-7

### User Story Dependencies

- **US5 (Auth)**: Requiere Phase 2 completa — bloquea interfaz admin
- **US2 (Categorías)**: Requiere US5 — bloquea US1
- **US1 (Diseños Upload)**: Requiere US2 (para el dropdown de categorías)
- **US3 (Editar Diseños)**: Co-implementada con US1
- **US4 (Proyectos)**: Independiente de US1/US2/US3

### Orden de desarrollo recomendado

```
Phase 1 → Phase 2 → Phase 3 (Auth) → Phase 4 (Categorías) → Phase 5 (Diseños) → Phase 6 + Phase 7 (paralelo) → Phase 8
```

## Notes

- El backend Go debe servir también los archivos estáticos de `/frontend/public/designs/` o configurar CORS correctamente para que Next.js los sirva
- Los labels `[US1]`–`[US5]` mapean cada tarea a su user story para trazabilidad
- Cada phase está diseñada para ser un checkpoint independiente verificable
- Seedear la DB (T012) antes de retirarse de la Phase 2 para evitar galería pública vacía
