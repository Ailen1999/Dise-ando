# Implementation Plan: Migración de API Java Spring Boot → Go + SQLite

*Date*: 2026-03-03
*Spec*: [go-migration-spec.md](./go-migration-spec.md)

---

## Summary

Migrar la API REST de la mueblería, actualmente en Java Spring Boot con PostgreSQL, a **Go** usando **SQLite** como base de datos y **arquitectura MVC**. El contrato HTTP (rutas, métodos, request/response JSON) debe mantenerse idéntico para que el frontend React existente funcione sin modificaciones. Se usará `database/sql` de la stdlib de Go con el driver `mattn/go-sqlite3` (sin ORM). El nuevo proyecto vivirá en `Ecommerce-Back-Go/` dentro del mismo repositorio.

---

## Technical Context

*Language/Version*: Go 1.22+
*Primary Dependencies*: Gin (HTTP router), golang-jwt/jwt/v5, golang.org/x/crypto/bcrypt, mattn/go-sqlite3
*Storage*: SQLite via `database/sql` + `mattn/go-sqlite3`
*Testing*: `go test` con `testify/suite` para unit tests; cobertura mínima 80% medida con `go test -coverprofile`; Postman / curl para contract tests manuales
*Target Platform*: Linux/Windows server
*Project Type*: Web API (backend único)
*Performance Goals*: Mejor tiempo de respuesta y menor uso de memoria que el stack Java/JVM
*Constraints*: Mismos contratos HTTP que el API Java; CORS habilitado para `http://localhost:3000`
*Scale/Scope*: 20 endpoints, 5 entidades, 1 desarrollador

---

## Project Structure

### Documentation (this feature)

```
muebleria/specs/
├── go-migration-plan.md     # This file
└── go-migration-spec.md     # Feature spec
```

### Source Code (repository root)

```
Ecommerce-Back-Go/
├── main.go                        # Punto de entrada, wire-up
├── go.mod / go.sum
├── config/
│   └── config.go                  # Variables de entorno, JWT secret, puerto
├── database/
│   └── database.go                # Conexión SQLite + creación de tablas (DDL)
├── models/                        # M — structs de dominio con tags sql
│   ├── user.go
│   ├── product.go
│   ├── order.go
│   ├── order_product.go
│   └── address.go
├── repositories/                  # Acceso a datos — queries SQL directas
│   ├── user_repository.go
│   ├── product_repository.go
│   └── order_repository.go
├── services/                      # C — lógica de negocio
│   ├── auth_service.go
│   ├── user_service.go
│   ├── product_service.go
│   ├── order_service.go
│   └── image_service.go
├── controllers/                   # V — handlers HTTP
│   ├── auth_controller.go
│   ├── user_controller.go
│   ├── product_controller.go
│   ├── order_controller.go
│   └── image_controller.go
├── middleware/
│   ├── jwt_middleware.go          # Validación JWT + extracción de claims
│   └── cors_middleware.go         # CORS para el frontend React
├── dto/                           # Structs JSON de request/response
│   ├── auth_dto.go
│   ├── user_dto.go
│   ├── product_dto.go
│   └── order_dto.go
├── router/
│   └── router.go                  # Registro de todas las rutas + middlewares
├── uploads/                       # Directorio local para imágenes subidas
└── tests/
    ├── testhelper/
    │   └── db.go                  # SQLite in-memory DB helper para tests
    ├── services/
    │   ├── auth_service_test.go
    │   ├── user_service_test.go
    │   ├── product_service_test.go
    │   └── order_service_test.go
    └── controllers/
        ├── auth_controller_test.go
        ├── user_controller_test.go
        ├── product_controller_test.go
        └── order_controller_test.go
```

*Structure Decision*: Arquitectura MVC con separación clara en capas. El acceso a datos lo hace `repositories/` usando `database/sql` directamente, sin ORM. Los `services/` contienen la lógica de negocio y los `controllers/` son los handlers HTTP de Gin.

---

## Phase 1: Setup — Inicialización del Proyecto

*Purpose*: Crear la estructura base del proyecto Go con todas las dependencias.

- [ ] T001 Crear directorio `Ecommerce-Back-Go/` y ejecutar `go mod init`
- [ ] T002 Agregar dependencias: `go get github.com/gin-gonic/gin`, `go get github.com/golang-jwt/jwt/v5`, `go get golang.org/x/crypto/bcrypt`, `go get github.com/mattn/go-sqlite3`, `go get github.com/stretchr/testify`
- [ ] T003 Crear estructura de carpetas: `config/`, `database/`, `models/`, `repositories/`, `services/`, `controllers/`, `middleware/`, `dto/`, `router/`, `uploads/`, `tests/testhelper/`, `tests/services/`, `tests/controllers/`
- [ ] T004 Crear `config/config.go` con lectura de env vars (`PORT`, `JWT_SECRET`, `DB_PATH`, `UPLOADS_PATH`)
- [ ] T005 Crear `main.go` con punto de entrada (inicializa config → DB → router → server)

---

## Phase 2: Foundational — Infraestructura Compartida

*Purpose*: Base que DEBE estar completa antes de implementar cualquier user story.

> ⚠️ **CRITICAL**: Ningún user story puede comenzar hasta completar esta fase.

- [ ] T006 Crear `database/database.go`: abrir conexión SQLite, crear tablas con DDL inline (users, addresses, products, product_images, orders, order_products)
- [ ] T007 Crear todos los **models** (`models/user.go`, `product.go`, `order.go`, `order_product.go`, `address.go`) con structs Go + enums `UserRol` y `OrderStatus`
- [ ] T008 Crear `middleware/cors_middleware.go`: headers CORS para permitir `http://localhost:3000`
- [ ] T009 Crear `middleware/jwt_middleware.go`: validar Bearer token, inyectar email y rol en contexto Gin
- [ ] T010 Crear `router/router.go`: estructura base de grupos de rutas con middlewares aplicados por grupo
- [ ] T011 Crear todos los **DTOs** (`dto/auth_dto.go`, `user_dto.go`, `product_dto.go`, `order_dto.go`) con structs y tags JSON que respetan los contratos del spec
- [ ] T011b Crear `tests/testhelper/db.go`: helper que levanta una SQLite en memoria (`:memory:`), aplica el mismo DDL y devuelve un `*sql.DB` limpio por test suite

*Checkpoint*: `go build ./...` compila sin errores. La base de datos SQLite se crea y las tablas existen.

---

## Phase 3: User Story 1 — Autenticación (Priority: P1)

*Goal*: Signup, login con JWT, reset de contraseña.

*Independent Test*: `curl -X POST localhost:8080/api/auth/signup` con body JSON → 201. Luego `curl -X POST localhost:8080/api/auth/login` → JWT válido.

### Tests para User Story 1

- [ ] T012 [P] [US1] Test manual: `POST /api/auth/signup` con datos válidos → 201 + UserDto
- [ ] T013 [P] [US1] Test manual: `POST /api/auth/login` con credenciales correctas → 200 + `{ jwt, userRole, userId }`
- [ ] T014 [P] [US1] Test manual: `POST /api/auth/login` con credenciales incorrectas → 401
- [ ] T015 [P] [US1] Test manual: `POST /api/auth/reset-password?email=...` email existente → 200; email inexistente → 404

### Implementación de User Story 1

- [ ] T016 [US1] Crear `repositories/user_repository.go`: `FindByEmail`, `Create`, `FindById`, `FindAll`, `Update`, `Delete`
- [ ] T017 [US1] Crear `services/auth_service.go`: `Signup` (hash bcrypt + insert), `Login` (verificar hash + generar JWT), `ResetPassword` (placeholder con log — sin envío de email real a menos que se configure)
- [ ] T018 [US1] Crear `controllers/auth_controller.go`: handlers `SignUp`, `Login`, `ResetPassword`
- [ ] T019 [US1] Registrar rutas en `router/router.go`: grupo `/api/auth` sin middleware JWT

### Unit Tests para User Story 1

- [ ] T019b [US1] Crear `tests/services/auth_service_test.go` con `testify/suite`: `TestSignup_Success`, `TestSignup_DuplicateEmail`, `TestLogin_Success`, `TestLogin_WrongPassword`, `TestResetPassword_UserNotFound`
- [ ] T019c [US1] Crear `tests/controllers/auth_controller_test.go` con `httptest`: `TestSignupEndpoint_Created`, `TestLoginEndpoint_200`, `TestLoginEndpoint_401`

*Checkpoint*: Signup + Login funcional. El JWT generado pasa la validación del middleware.

---

## Phase 4: User Story 2 — Gestión de Productos (Priority: P2)

*Goal*: CRUD de productos + búsqueda por nombre + filtro por precio.

*Independent Test*: `GET /api/product` sin token → 200 con lista (puede estar vacía). `POST /api/product` con token ADMIN → 201.

### Tests para User Story 2

- [ ] T020 [P] [US2] Test manual: `GET /api/product` sin token → 200
- [ ] T021 [P] [US2] Test manual: `POST /api/product` con token ADMIN → 201 + ProductDto con id
- [ ] T022 [P] [US2] Test manual: `GET /api/product/{id}` → 200; id inexistente → 404
- [ ] T023 [P] [US2] Test manual: `PUT /api/product` con token ADMIN → 200 con datos actualizados
- [ ] T024 [P] [US2] Test manual: `DELETE /api/product/{id}` → 200
- [ ] T025 [P] [US2] Test manual: `GET /api/product/search?name=silla` con token ADMIN → 200 con lista filtrada
- [ ] T026 [P] [US2] Test manual: `GET /api/product/filter?minPrice=100&maxPrice=500` con token ADMIN → 200

### Implementación de User Story 2

- [ ] T027 [US2] Crear `repositories/product_repository.go`: `Create`, `FindAll`, `FindById`, `Update`, `Delete`, `FindByName`, `FindByPriceRange` (incluyendo manejo de `product_images` como tabla separada)
- [ ] T028 [US2] Crear `services/product_service.go`: delega a repository, mapea entre model y DTO
- [ ] T029 [US2] Crear `controllers/product_controller.go`: handlers para los 7 endpoints de producto
- [ ] T030 [US2] Registrar rutas en `router/router.go`: `GET /api/product` y `GET /api/product/{id}` públicos; resto requieren ADMIN

### Unit Tests para User Story 2

- [ ] T030b [US2] Crear `tests/services/product_service_test.go` con `testify/suite`: `TestCreateProduct`, `TestGetAllProducts_Empty`, `TestGetProductById_NotFound`, `TestUpdateProduct`, `TestDeleteProduct`, `TestSearchByName`, `TestFilterByPriceRange`
- [ ] T030c [US2] Crear `tests/controllers/product_controller_test.go` con `httptest`: `TestGetAllProducts_200`, `TestCreateProduct_201_Admin`, `TestCreateProduct_403_NonAdmin`, `TestGetProductById_404`

*Checkpoint*: Catálogo de productos funcional. Frontend puede listar productos sin token.

---

## Phase 5: User Story 3 — Gestión de Pedidos (Priority: P3)

*Goal*: Crear pedidos, listar/filtrar, actualizar estado y comprobante.

*Independent Test*: Login con usuario → `POST /api/orders` → 201. `GET /api/user/orders` → lista con el pedido creado.

### Tests para User Story 3

- [ ] T031 [P] [US3] Test manual: `POST /api/orders` con token de usuario → 201 + OrderDto
- [ ] T032 [P] [US3] Test manual: `GET /api/orders` con token ADMIN → 200 con todos los pedidos
- [ ] T033 [P] [US3] Test manual: `GET /api/orders/{id}` con token ADMIN → 200; id inexistente → 404
- [ ] T034 [P] [US3] Test manual: `GET /api/user/orders` con token de usuario → 200 con sus pedidos
- [ ] T035 [P] [US3] Test manual: `PUT /api/orders/{id}/status?status=PAID` → 200 con status actualizado
- [ ] T036 [P] [US3] Test manual: `GET /api/orders/date-range?startDate=2026-01-01&endDate=2026-12-31` con token ADMIN → 200
- [ ] T037 [P] [US3] Test manual: `GET /api/orders/status?status=CREATED` con token ADMIN → 200
- [ ] T038 [P] [US3] Test manual: `PUT /api/orders/comprobante-url?comprobanteUrl=https://...` con token → 200
- [ ] T039 [P] [US3] Test manual: `PUT /api/orders/{id}/comprobante-url?comprobanteUrl=https://...` → 200
- [ ] T040 [P] [US3] Test manual: `DELETE /api/orders/{id}` con token ADMIN → 200

### Implementación de User Story 3

- [ ] T041 [US3] Crear `repositories/order_repository.go`: `Create`, `FindAll`, `FindById`, `Delete`, `FindByUserId`, `FindByDateRange`, `FindByStatus`, `UpdateStatus`, `UpdateComprobanteUrl`, `UpdateComprobanteUrlById` (con manejo de `order_products` y `address`)
- [ ] T042 [US3] Crear `services/order_service.go`: lógica de negocio, valida productos, resuelve email del token al userId
- [ ] T043 [US3] Crear `controllers/order_controller.go`: handlers para los 10 endpoints de pedidos
- [ ] T044 [US3] Registrar rutas en `router/router.go`: `POST /api/orders` y `GET /api/user/orders` para cualquier usuario autenticado; resto ADMIN

### Unit Tests para User Story 3

- [ ] T044b [US3] Crear `tests/services/order_service_test.go` con `testify/suite`: `TestCreateOrder_Success`, `TestGetOrderById_NotFound`, `TestUpdateOrderStatus`, `TestGetOrdersByDateRange`, `TestGetOrdersByStatus`, `TestUpdateComprobanteUrl`, `TestDeleteOrder`
- [ ] T044c [US3] Crear `tests/controllers/order_controller_test.go` con `httptest`: `TestCreateOrder_201`, `TestGetAllOrders_403_NonAdmin`, `TestGetUserOrders_200`, `TestUpdateOrderStatus_200`

*Checkpoint*: Flujo completo de pedido funcional. Usuario puede crear y ver sus pedidos; admin puede gestionar todos.

---

## Phase 6: User Story 4 — Gestión de Usuarios (Priority: P4)

*Goal*: CRUD de usuarios, perfil por token, cambio de contraseña.

*Independent Test*: Con token válido, `GET /api/user/user-token` → 200 con datos del usuario logueado.

### Tests para User Story 4

- [ ] T045 [P] [US4] Test manual: `GET /api/user/user-token` con token → 200 con UserDto del usuario
- [ ] T046 [P] [US4] Test manual: `GET /api/user` con token ADMIN → 200 con lista de usuarios
- [ ] T047 [P] [US4] Test manual: `POST /api/user` sin token → 201
- [ ] T048 [P] [US4] Test manual: `PUT /api/user/{id}` con token → 200
- [ ] T049 [P] [US4] Test manual: `DELETE /api/user/{id}` con token → 204
- [ ] T050 [P] [US4] Test manual: `PUT /api/user/change-password` con token → 200; contraseña incorrecta → 400

### Implementación de User Story 4

- [ ] T051 [US4] Crear `services/user_service.go`: `CreateUser`, `GetAllUsers`, `GetByEmail`, `UpdateUser`, `DeleteUser`, `ChangePassword` (verifica contraseña actual con bcrypt)
- [ ] T052 [US4] Crear `controllers/user_controller.go`: handlers para los 6 endpoints de usuario
- [ ] T053 [US4] Registrar rutas en `router/router.go`: `POST /api/user` público; `GET /api/user/user-token` autenticado; resto ADMIN

### Unit Tests para User Story 4

- [ ] T053b [US4] Crear `tests/services/user_service_test.go` con `testify/suite`: `TestCreateUser_Success`, `TestGetAllUsers`, `TestGetByEmail_NotFound`, `TestUpdateUser`, `TestDeleteUser`, `TestChangePassword_Success`, `TestChangePassword_WrongCurrent`
- [ ] T053c [US4] Crear `tests/controllers/user_controller_test.go` con `httptest`: `TestGetUserByToken_200`, `TestGetAllUsers_403_NonAdmin`, `TestChangePassword_400_WrongPassword`

*Checkpoint*: Gestión de usuarios completa. El middleware JWT identifica correctamente al usuario en endpoints `user-token` y `change-password`.

---

## Phase 7: User Story 5 — Subida de Imágenes (Priority: P5)

*Goal*: Recibir imágenes vía multipart, guardarlas en `uploads/` y devolver la URL pública.

*Independent Test*: `curl -X POST localhost:8080/api/images -F "file=@foto.jpg"` → 200 con URL. Acceder a la URL devuelta en el browser → la imagen se descarga.

### Tests para User Story 5

- [ ] T054 [P] [US5] Test manual: `POST /api/images` con archivo imagen → 200 con URL tipo `http://localhost:8080/uploads/filename.jpg`
- [ ] T055 [P] [US5] Test manual: acceder a la URL devuelta en browser → imagen visible

### Implementación de User Story 5

- [ ] T056 [US5] Crear `services/image_service.go`: guardar archivo en `uploads/` con nombre único (UUID), retornar URL completa
- [ ] T057 [US5] Crear `controllers/image_controller.go`: handler `UploadImage` que lee `multipart/form-data` campo `file`
- [ ] T058 [US5] Registrar ruta `POST /api/images` en `router/router.go`
- [ ] T059 [US5] Configurar Gin para servir archivos estáticos desde `uploads/` en `/uploads/`

*Checkpoint*: Las imágenes de productos se pueden subir y visualizar. El frontend puede usar las URLs en `ProductDto`.

---

## Phase 8: Validación End-to-End con el Frontend React

*Goal*: Confirmar que el frontend React existente funciona sin modificaciones contra el backend Go.

- [ ] T060 Levantar backend Go: `cd Ecommerce-Back-Go && go run main.go` (default port 8080)
- [ ] T061 Levantar frontend React: `cd Ecommerce-Front && npm install && npm run dev` (default port 3000)
- [ ] T062 Verificar en browser que el admin puede: Login → Ver productos → Crear producto con imagen → Ver pedidos → Cambiar estado de pedido
- [ ] T063 Verificar en browser que un cliente puede: Registro → Login → Ver catálogo → Crear pedido → Ver mis pedidos
- [ ] T064 Verificar que no hay errores CORS en la consola del browser
- [ ] T065 Verificar que no hay errores 4xx/5xx inesperados en la consola del browser

*Checkpoint*: Frontend React funciona 100% sin modificaciones. Todos los flujos core del negocio operativos.

---

## Phase 9: Polish & Cross-Cutting Concerns

*Purpose*: Mejoras transversales a todos los user stories.

- [ ] T066 Manejo centralizado de errores en Gin (middleware de error handler)
- [ ] T067 Logging de requests (método, path, status, duración) via Gin logger
- [ ] T068 Manejo correcto de `404` para recursos no encontrados (productos, pedidos, usuarios)
- [ ] T069 Crear `README.md` en `Ecommerce-Back-Go/` con instrucciones de setup y ejecución
- [ ] T070 Revisar y asegurar que todos los endpoints respetan el esquema de autorización del spec

### Cobertura de Tests

- [ ] T071 Ejecutar `go test ./... -coverprofile=coverage.out` y verificar cobertura global ≥ 80%
- [ ] T072 Generar reporte HTML con `go tool cover -html=coverage.out -o coverage.html` y revisar paquetes con cobertura < 80%
- [ ] T073 Agregar tests adicionales en los paquetes que no alcancen el 80% hasta cumplir el umbral

> **Convención de test suites** (aplicada en todos los `*_test.go`):
> ```go
> type AuthServiceTestSuite struct {
>     suite.Suite
>     db *sql.DB
> }
> func (s *AuthServiceTestSuite) SetupTest() { s.db = testhelper.NewTestDB(s.T()) }
> func TestAuthServiceSuite(t *testing.T) { suite.Run(t, new(AuthServiceTestSuite)) }
> ```
> Cada suite usa una DB SQLite in-memory aislada por test (`SetupTest` la recrea limpia).

---

## Dependencies & Execution Order

### Phase Dependencies

- *Setup (Phase 1)*: Sin dependencias — puede empezar de inmediato
- *Foundational (Phase 2)*: Depende de Phase 1 — **bloquea todas las user stories**
- *User Stories (Phases 3–7)*: Todas dependen de Phase 2
  - P1 (Auth) → debe completarse antes que el resto (todas las demás necesitan token)
  - P2 (Productos) → puede hacerse en paralelo con P4 y P5 una vez completado P1
  - P3 (Pedidos) → depende de P1 y P2 (necesita usuarios y productos)
  - P4 (Usuarios) → depende de P1; el repository ya existe desde P1
  - P5 (Imágenes) → independiente, puede hacerse en cualquier momento post-Phase 2
- *Validación E2E (Phase 8)*: Depende de que P1–P5 estén completos
- *Polish (Phase 9)*: Puede intercalarse durante la implementación

### Within Each User Story

- Repository → Service → Controller → Router registration
- Implementación antes de tests
- Commit después de cada phase completada

---

## Notes

- `[P]` = test de contrato/humo (manualmente con curl o Postman)
- `[US#]` = traza la tarea a su user story para rastreabilidad
- El label de rol en JWT debe ser exactamente `ADMIN` o `CUSTOMER` para que coincida con el frontend
- El campo `dateCreated` en UserDto se serializa como `"yyyy-MM-dd HH:mm:ss"` (sin zona horaria) — respetar este formato JSON
- El campo `user` en `OrderDto` usa `omitempty` equivalente (`JsonInclude.NON_NULL` en Java)
- Las rutas de imagen servidas estáticamente deben ser accesibles en la misma base URL del API para evitar problemas CORS
