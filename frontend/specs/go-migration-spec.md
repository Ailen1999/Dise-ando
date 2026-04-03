# Feature Specification: Migración de API Java (Spring Boot) a Go + SQLite

*Created*: 2026-03-03

## Contexto y Objetivo

La API actual está desarrollada en **Java Spring Boot** con PostgreSQL. El objetivo es migrarla a **Go** usando **SQLite** como base de datos, manteniendo exactamente los mismos contratos HTTP (rutas, métodos, request/response bodies) para que el **frontend React existente** continúe funcionando sin modificaciones.

El nuevo backend se empaquetará usando la arquitectura **MVC**:
- **Model**: structs de datos + acceso a SQLite
- **View**: respuestas JSON (handlers)
- **Controller**: lógica de negocio / servicios

**No se migran datos**: la base de datos SQLite parte vacía.

---

## User Scenarios & Testing (mandatory)

### User Story 1 - Autenticación y Registro (Priority: P1)

Un usuario puede registrarse con sus datos personales, luego iniciar sesión con email y contraseña. El sistema devuelve un JWT que el frontend usa en todas las peticiones subsiguientes. Un admin puede solicitar reset de contraseña por email.

*Why this priority*: Todos los demás flujos dependen de tener un token JWT válido. Sin autenticación nada funciona.

*Independent Test*: Se puede verificar completamente haciendo POST `/api/auth/signup`, luego POST `/api/auth/login` y confirmando que se recibe un JWT con el rol del usuario.

*Acceptance Scenarios*:

1. *Given* un email no registrado, *When* se hace POST `/api/auth/signup` con datos válidos, *Then* se devuelve `201 Created` con el `UserDto` creado.
2. *Given* un usuario registrado, *When* se hace POST `/api/auth/login` con credenciales correctas, *Then* se devuelve `200 OK` con `{ jwt, userRole, userId }`.
3. *Given* credenciales incorrectas, *When* se hace POST `/api/auth/login`, *Then* se devuelve `401 Unauthorized`.
4. *Given* un email registrado, *When* se hace POST `/api/auth/reset-password?email=...`, *Then* se devuelve `200 OK`.
5. *Given* un email no registrado, *When* se hace POST `/api/auth/reset-password?email=...`, *Then* se devuelve `404 Not Found`.

---

### User Story 2 - Gestión de Productos (Priority: P2)

Un administrador puede crear, actualizar, eliminar y buscar productos. Cualquier usuario (incluso sin login) puede listar y ver productos individuales.

*Why this priority*: El catálogo de productos es el corazón de la tienda. Sin productos no hay pedidos.

*Independent Test*: Se puede verificar haciendo GET `/api/product` sin token y confirmando la lista. Para crear, se necesita token de admin.

*Acceptance Scenarios*:

1. *Given* un token de ADMIN, *When* se hace POST `/api/product` con un `ProductDto`, *Then* se devuelve `201 Created` con el producto creado e id asignado.
2. *Given* cualquier cliente (sin token), *When* se hace GET `/api/product`, *Then* se devuelve `200 OK` con la lista de productos.
3. *Given* un id de producto existente, *When* se hace GET `/api/product/{id}`, *Then* se devuelve `200 OK` con el `ProductDto`.
4. *Given* un token de ADMIN, *When* se hace PUT `/api/product` con datos actualizados, *Then* se devuelve `200 OK` con el producto actualizado.
5. *Given* un id de producto existente, *When* se hace DELETE `/api/product/{id}`, *Then* se devuelve `200 OK`.
6. *Given* un token de ADMIN, *When* se hace GET `/api/product/search?name=silla`, *Then* se devuelve `200 OK` con productos cuyo nombre contiene "silla".
7. *Given* un token de ADMIN, *When* se hace GET `/api/product/filter?minPrice=100&maxPrice=500`, *Then* se devuelve `200 OK` con productos en ese rango de precio.

---

### User Story 3 - Gestión de Pedidos (Priority: P3)

Un usuario autenticado puede crear un pedido. Un administrador puede ver todos los pedidos, filtrarlos por fecha o estado, y actualizar el estado de un pedido. El usuario puede ver sus propios pedidos.

*Why this priority*: El flujo de pedidos es el núcleo del negocio. Requiere que autenticación y productos estén funcionando.

*Independent Test*: Crear un usuario, loguearse, crear un pedido con POST `/api/orders`, luego verificar con GET `/api/user/orders`.

*Acceptance Scenarios*:

1. *Given* un usuario autenticado, *When* se hace POST `/api/orders` con un `OrderDto`, *Then* se devuelve `201 Created` con el pedido creado.
2. *Given* un token de ADMIN, *When* se hace GET `/api/orders`, *Then* se devuelve `200 OK` con todos los pedidos.
3. *Given* un token de ADMIN y un id de pedido válido, *When* se hace GET `/api/orders/{id}`, *Then* se devuelve el `OrderDto`.
4. *Given* un token de ADMIN, *When* se hace DELETE `/api/orders/{id}`, *Then* se devuelve `200 OK`.
5. *Given* un token de ADMIN, *When* se hace GET `/api/orders/date-range?startDate=...&endDate=...`, *Then* se devuelve la lista filtrada.
6. *Given* un token de ADMIN, *When* se hace GET `/api/orders/status?status=PAID`, *Then* se devuelve la lista filtrada.
7. *Given* un usuario autenticado, *When* se hace GET `/api/user/orders`, *Then* se devuelven solo sus propios pedidos.
8. *Given* un id de pedido válido, *When* se hace PUT `/api/orders/{id}/status?status=PAID`, *Then* se devuelve el pedido actualizado.
9. *Given* un usuario autenticado, *When* se hace PUT `/api/orders/comprobante-url?comprobanteUrl=...`, *Then* se actualiza el último pedido del usuario.
10. *Given* un id de pedido válido, *When* se hace PUT `/api/orders/{id}/comprobante-url?comprobanteUrl=...`, *Then* se actualiza el comprobante de ese pedido.

---

### User Story 4 - Gestión de Usuarios (Priority: P4)

Un usuario autenticado puede ver su perfil y cambiar su contraseña. Un administrador puede listar todos los usuarios, crear y eliminar usuarios.

*Why this priority*: Funcionalidad de soporte, importante pero no bloquea las funciones core del negocio.

*Independent Test*: Con token válido, hacer GET `/api/user/user-token` para verificar el perfil propio.

*Acceptance Scenarios*:

1. *Given* cualquier usuario autenticado, *When* se hace GET `/api/user/user-token`, *Then* se devuelve el `UserDto` del usuario logueado.
2. *Given* un token de ADMIN, *When* se hace GET `/api/user`, *Then* se devuelve la lista completa de usuarios.
3. *Given* datos válidos, *When* se hace POST `/api/user`, *Then* se devuelve `201 Created`.
4. *Given* un token de ADMIN y un id válido, *When* se hace PUT `/api/user/{id}` con datos actualizados, *Then* se devuelve `200 OK`.
5. *Given* un token de ADMIN y un id válido, *When* se hace DELETE `/api/user/{id}`, *Then* se devuelve `204 No Content`.
6. *Given* un usuario autenticado, *When* se hace PUT `/api/user/change-password` con contraseña actual y nueva, *Then* se devuelve `200 OK`.

---

### User Story 5 - Subida de Imágenes (Priority: P5)

El sistema permite subir imágenes de productos. En la versión Go, las imágenes se almacenarán localmente en el servidor (reemplazando MinIO).

*Why this priority*: Necesario para crear productos con imágenes, pero los productos pueden existir sin imagen.

*Independent Test*: Hacer POST `/api/images` con un archivo multipart y verificar que se devuelve la URL de acceso.

*Acceptance Scenarios*:

1. *Given* un archivo de imagen válido, *When* se hace POST `/api/images` con multipart/form-data, *Then* se devuelve `200 OK` con la URL pública de la imagen.
2. *Given* que la imagen fue subida, *When* se accede a la URL devuelta, *Then* se puede descargar la imagen.

---


### Edge Cases

- ¿Qué pasa si se intenta crear un pedido con un producto que no existe? → `404 Not Found`
- ¿Qué pasa si el token JWT expiró o es inválido? → `401 Unauthorized`
- ¿Qué pasa si un usuario sin rol ADMIN intenta acceder a un endpoint protegido? → `403 Forbidden`
- ¿Qué pasa si se sube un archivo que no es imagen? → `500 Internal Server Error` con mensaje descriptivo

---

## Requirements (mandatory)

### Functional Requirements

- *FR-001*: El sistema DEBE replicar exactamente todos los endpoints del API Java manteniendo los mismos path, método HTTP, estructura de request y response.
- *FR-002*: El sistema DEBE implementar autenticación JWT con el mismo mecanismo (token en header `Authorization: Bearer <token>`).
- *FR-003*: El sistema DEBE implementar autorización por roles: `ADMIN` y `CUSTOMER` (equivalente a USER en el sistema actual).
- *FR-004*: El sistema DEBE persistir datos en SQLite.
- *FR-005*: El sistema DEBE servir imágenes estáticas subidas mediante el endpoint `/api/images`.
- *FR-006*: El sistema DEBE responder con los mismos Content-Types (`application/json`) que el sistema Java.
- *FR-007*: El sistema DEBE habilitar CORS para permitir peticiones del frontend React (por defecto `http://localhost:3000`).
- *FR-008*: El nuevo proyecto Go DEBE estructurarse con arquitectura MVC.
- *FR-009*: El sistema DEBE soportar los mismos estados de `OrderStatus`: `CREATED`, `IN_REVIEW`, `PAID`, `FINISHED`.
- *FR-010*: El sistema DEBE usar contraseñas hasheadas con bcrypt (igual que el sistema Java).

### API Endpoints Completos (contratos a replicar)

#### Auth — `/api/auth`
| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | Público | Registro de nuevo usuario |
| POST | `/api/auth/login` | Público | Login, devuelve JWT + rol + userId |
| POST | `/api/auth/reset-password?email=` | Público | Reset de contraseña por email |

#### Products — `/api`
| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/product` | ADMIN | Crear producto |
| GET | `/api/product` | Público | Listar todos los productos |
| GET | `/api/product/{id}` | Público | Obtener producto por ID |
| PUT | `/api/product` | ADMIN | Actualizar producto |
| DELETE | `/api/product/{id}` | Cualquier auth. | Eliminar producto |
| GET | `/api/product/search?name=` | ADMIN | Buscar productos por nombre |
| GET | `/api/product/filter?minPrice=&maxPrice=` | ADMIN | Filtrar por rango de precio |

#### Orders — `/api`
| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/orders` | Autenticado | Crear pedido |
| GET | `/api/orders` | ADMIN | Listar todos los pedidos |
| GET | `/api/orders/{id}` | ADMIN | Obtener pedido por ID |
| DELETE | `/api/orders/{id}` | ADMIN | Eliminar pedido |
| GET | `/api/orders/date-range?startDate=&endDate=` | ADMIN | Filtrar por rango de fechas |
| GET | `/api/orders/status?status=` | ADMIN | Filtrar por estado |
| GET | `/api/user/orders` | Autenticado | Pedidos del usuario logueado |
| PUT | `/api/orders/{id}/status?status=` | Cualquier auth. | Actualizar estado del pedido |
| PUT | `/api/orders/comprobante-url?comprobanteUrl=` | Autenticado | Actualizar URL comprobante (último pedido del usuario) |
| PUT | `/api/orders/{id}/comprobante-url?comprobanteUrl=` | Cualquier auth. | Actualizar URL comprobante por ID |

#### Users — `/api/user`
| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/user` | Público | Crear usuario |
| GET | `/api/user` | ADMIN | Listar todos los usuarios |
| GET | `/api/user/user-token` | Autenticado | Obtener perfil del usuario logueado |
| PUT | `/api/user/{id}` | Autenticado | Actualizar usuario |
| DELETE | `/api/user/{id}` | Autenticado | Eliminar usuario |
| PUT | `/api/user/change-password` | Autenticado | Cambiar contraseña |

#### Images — `/api/images`
| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/images` | Cualquier auth. | Subir imagen (multipart/form-data, campo `file`) |

---

### Key Entities

#### User
| Campo | Tipo | Notas |
|-------|------|-------|
| id | int64 | PK autoincrement |
| firstName | string | |
| lastName | string | |
| email | string | único |
| password | string | bcrypt hash |
| dateCreated | datetime | se setea al crear |
| documentNumber | int | |
| phone | int | |
| rol | enum | `ADMIN` \| `CUSTOMER` |

#### Product
| Campo | Tipo | Notas |
|-------|------|-------|
| id | int64 | PK autoincrement |
| name | string | max 500 chars |
| description | string | max 500 chars |
| quantity | int | |
| price | float64 | |
| mainImage | string | URL |
| images | []string | tabla separada `product_images` |

#### Order
| Campo | Tipo | Notas |
|-------|------|-------|
| id | int64 | PK autoincrement |
| amount | float64 | |
| addressId | int64 | FK a Address |
| status | enum | `CREATED` \| `IN_REVIEW` \| `PAID` \| `FINISHED` |
| dateCreated | datetime | |
| userId | int64 | FK a User |
| comprobanteUrl | string | nullable |
| pickup | bool | nullable |

#### OrderProduct (tabla intermedia)
| Campo | Tipo | Notas |
|-------|------|-------|
| id | int64 | PK autoincrement |
| orderId | int64 | FK a Order |
| productId | int64 | FK a Product |
| quantity | int | cantidad en el pedido |
| priceAtPurchase | float64 | precio al momento de compra |

#### Address
| Campo | Tipo | Notas |
|-------|------|-------|
| id | int64 | PK autoincrement |
| street | string | |
| number | int | |
| zipCode | int | |
| city | string | |
| state | string | |

---

## DTOs de Request/Response

### AuthenticationRequest (POST `/api/auth/login`)
```json
{ "email": "user@example.com", "password": "secret" }
```

### AuthenticationResponse
```json
{ "jwt": "eyJ...", "userRole": "ADMIN", "userId": 1 }
```

### SignupRequest (POST `/api/auth/signup`)
```json
{
  "name": "Juan",
  "lastName": "Perez",
  "email": "juan@example.com",
  "password": "secret",
  "documentNumber": 12345678,
  "phone": 1122334455,
  "address": { "street": "Av. Corrientes", "number": 1234, "zipCode": 1043, "city": "CABA", "state": "Buenos Aires" }
}
```

### ProductDto
```json
{
  "id": 1,
  "name": "Silla Gamer",
  "description": "Silla ergonómica",
  "quantity": 10,
  "price": 299.99,
  "mainImage": "https://...",
  "images": ["https://...", "https://..."]
}
```

### OrderDto
```json
{
  "id": 1,
  "amount": 599.98,
  "address": { "id": 1, "street": "...", "number": 123, "zipCode": 1000, "city": "...", "state": "..." },
  "products": [ { "id": 1, "name": "Silla Gamer", "price": 299.99, "quantity": 2 } ],
  "status": "CREATED",
  "dateCreated": "2026-03-03T20:00:00",
  "user": null,
  "comprobanteUrl": null,
  "pickup": false
}
```

### UserDto
```json
{
  "id": 1,
  "firstName": "Juan",
  "lastName": "Perez",
  "email": "juan@example.com",
  "dateCreated": "2026-03-03 20:00:00",
  "documentNumber": 12345678,
  "phone": 1122334455,
  "rol": "CUSTOMER",
  "orders": [],
  "addresses": []
}
```

### ChangePasswordRequest (PUT `/api/user/change-password`)
```json
{ "currentPassword": "oldSecret", "newPassword": "newSecret" }
```

---

## Estructura del Proyecto Go (MVC)

```
Ecommerce-Back-Go/
├── main.go                    # Punto de entrada, inicialización
├── go.mod / go.sum
├── config/
│   └── config.go              # Variables de entorno, configuración JWT
├── database/
│   └── database.go            # Conexión SQLite + migraciones
├── models/                    # M — structs de dominio + GORM/SQL tags
│   ├── user.go
│   ├── product.go
│   ├── order.go
│   ├── order_product.go
│   └── address.go
├── repositories/              # Acceso a datos (CRUD SQLite)
│   ├── user_repository.go
│   ├── product_repository.go
│   └── order_repository.go
├── services/                  # C — lógica de negocio
│   ├── auth_service.go
│   ├── user_service.go
│   ├── product_service.go
│   ├── order_service.go
│   └── image_service.go
├── controllers/               # V — handlers HTTP (C en MVC web)
│   ├── auth_controller.go
│   ├── user_controller.go
│   ├── product_controller.go
│   ├── order_controller.go
│   └── image_controller.go
├── middleware/
│   ├── jwt_middleware.go      # Validación JWT en cada request
│   └── cors_middleware.go     # CORS para el frontend React
├── dto/                       # Structs de request/response JSON
│   ├── auth_dto.go
│   ├── user_dto.go
│   ├── product_dto.go
│   └── order_dto.go
├── router/
│   └── router.go              # Definición de todas las rutas
└── uploads/                   # Directorio local para imágenes subidas
```

**Stack tecnológico**:
- **Go 1.22+**
- **Gin** como router HTTP
- **database/sql** (stdlib de Go) con driver `mattn/go-sqlite3` — sin ORM, queries SQL directas
- **golang-jwt/jwt** para JWT
- **golang.org/x/crypto/bcrypt** para hash de contraseñas

---

## Success Criteria (mandatory)

### Measurable Outcomes

- *SC-001*: Los 21 endpoints del API Java existen en el API Go con los mismos paths, métodos HTTP y estructuras JSON.
- *SC-002*: El frontend React sirve correctamente al conectarse al backend Go sin ninguna modificación en el código del frontend.
- *SC-003*: Un admin puede completar el flujo completo: Login → Ver productos → Crear producto → Ver pedidos → Cambiar estado de pedido.
- *SC-004*: Un cliente puede completar el flujo completo: Registro → Login → Ver catálogo → Crear pedido → Ver sus pedidos.
- *SC-005*: Un archivo de imagen subido vía POST `/api/images` es accesible públicamente vía la URL devuelta.
- *SC-006*: El tiempo de respuesta del API Go es menor o igual al del API Java bajo carga equivalente (mejora de performance).
- *SC-007*: El consumo de memoria del proceso Go es significativamente menor al del proceso Java (JVM overhead eliminado).
- *SC-008*: No existe ninguna dependencia de MercadoPago en el nuevo backend Go.

### Plan de Validación

1. **Levantar backend Go** en `localhost:8080` (o el puerto configurado).
2. **Levantar frontend React** en `localhost:3000` apuntando al backend Go.
3. **Navegar el frontend** y verificar que todas las secciones cargan sin errores de consola.
4. **Test de humo** con `curl` o Postman contra cada endpoint listado en la tabla de contratos.
5. **Flujo completo de admin**: Login admin → Crear producto → Subir imagen → Ver pedidos.
6. **Flujo completo de cliente**: Registro → Login → Ver productos → Crear pedido → Ver mis pedidos.
