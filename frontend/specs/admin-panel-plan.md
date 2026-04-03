# Implementation Plan: Admin Panel — Panel de Ventas y Configuración

*Date*: 2026-03-04  
*Spec*: [admin-panel-spec.md](./admin-panel-spec.md)

---

## Summary

Agregar al panel de administración existente dos nuevas secciones accesibles desde el navbar admin:

1. **Panel de Ventas** — formulario para cargar ventas manuales (buscar productos, asignar cantidades, confirmar), descuento de stock via API Go, historial de ventas y emisión de comprobante PDF descargable (generado en cliente con `jsPDF`).
2. **Configuración** — subida de logo con vista previa, edición del número de WhatsApp (prefijo `+549` fijo). Persiste en `localStorage` y se refleja en todo el storefront.

No se toca MercadoPago ni el diseño de las páginas públicas ya redesignadas.

---

## Technical Context

*Language/Version*: React 18 (frontend) + Go 1.21 (backend)  
*Primary Dependencies*: React Router v6, Tailwind CSS, Axios, jsPDF (nueva), Bootstrap 5 (coexiste)  
*Storage*: SQLite (backend Go via `database/sql`) + `localStorage` (configuración y ventas en cliente)  
*Testing*: Tests backend: `go test ./tests/services/...`; Tests frontend: manual via browser  
*Target Platform*: Web (Chrome/Firefox desktop)  
*Performance Goals*: PDF generado en < 3 segundos; cambios de configuración reflejados sin reload  
*Constraints*: No romper funcionalidades existentes (ABM productos, órdenes WhatsApp). No usar MercadoPago.

---

## Project Structure

```
Ecommerce-Back-Go/
├── models/
│   ├── product.go              (existente — Quantity se descuenta)
│   └── sale.go                 [NUEVO] — modelo Sale e SaleItem
├── dto/
│   └── sale_dto.go             [NUEVO] — SaleDTO, SaleItemDTO, CreateSaleRequest
├── repositories/
│   └── sale_repository.go      [NUEVO]
├── services/
│   └── sale_service.go         [NUEVO]
├── controllers/
│   └── sale_controller.go      [NUEVO]
├── router/
│   └── router.go               [MODIFICAR] — agregar rutas /api/sales
└── tests/services/
    └── sale_service_test.go    [NUEVO]

Ecommerce-Front/ecommerce/src/
├── context/
│   ├── settingsContext.js      [NUEVO] — logo + whatsapp persistido en localStorage
│   └── salesContext.js         [NUEVO] — historial de ventas en localStorage
├── pages/admin/
│   ├── sales/
│   │   ├── SalesPage.js        [NUEVO] — formulario de nueva venta + historial
│   │   └── SaleReceipt.js      [NUEVO] — lógica de generación PDF con jsPDF
│   └── settings/
│       └── SettingsPage.js     [NUEVO] — subida de logo + edición WA
├── components/
│   └── AdminNavbar.js          [NUEVO o MODIFICAR] — navbar con las nuevas secciones
└── App.js                      [MODIFICAR] — agregar rutas /admin/sales y /admin/settings
```

---

## Phase 1: Setup

*Purpose*: Instalar dependencias y preparar la estructura de archivos.

- [ ] T001 Instalar `jsPDF` en el frontend: `npm install jspdf`
- [ ] T002 Crear las carpetas `src/pages/admin/sales/` y `src/pages/admin/settings/`
- [ ] T003 Crear archivos vacíos: `SalesPage.js`, `SaleReceipt.js`, `SettingsPage.js`, `settingsContext.js`, `salesContext.js`

---

## Phase 2: Foundational — Backend Sales API

*Purpose*: Endpoints Go necesarios para registrar ventas y descontar stock. Bloquea la US1.

- [ ] T004 [US1] Crear `models/sale.go` con structs `Sale` y `SaleItem`:
  - `Sale`: id, fecha, clienteNombre, clienteTelefono, total, items []SaleItem
  - `SaleItem`: productoId, nombreProducto, cantidad, precioUnitario, subtotal
- [ ] T005 [US1] Crear tabla `sales` y `sale_items` en la base de datos SQLite (migration inline en `database/database.go`)
- [ ] T006 [US1] Crear `dto/sale_dto.go` con `CreateSaleRequest` y `SaleDTO`
- [ ] T007 [US1] Crear `repositories/sale_repository.go` con métodos: `Create`, `GetAll`, `GetByID`
- [ ] T008 [US1] Crear `services/sale_service.go`:
  - Valida stock disponible por producto antes de confirmar
  - Descuenta stock via `productRepo.UpdateQuantity`
  - Persiste la venta
- [ ] T009 [US1] Crear `controllers/sale_controller.go`: `CreateSale`, `GetAllSales`, `GetSaleByID`
- [ ] T010 [US1] Agregar rutas en `router/router.go`:
  - `POST /api/sales` (admin JWT)
  - `GET /api/sales` (admin JWT)
  - `GET /api/sales/:id` (admin JWT)

*Checkpoint*: `curl -X POST /api/sales` con token admin debe crear una venta y descontar stock.

---

## Phase 3: User Story 1 — Panel de Ventas (P1)

*Goal*: El admin puede cargar una venta manual, ver el stock, confirmarla y descargar el comprobante PDF.

*Independent Test*: Cargar una venta con 1 producto → verificar que el stock bajó en el panel de productos → descargar el PDF.

### Tests Backend para US1

- [ ] T011 [US1] Escribir `tests/services/sale_service_test.go`:
  - Test: venta válida descuenta stock correctamente
  - Test: venta con stock insuficiente retorna error
  - Test: venta con producto inexistente retorna error
  - Ejecutar con: `cd Ecommerce-Back-Go && go test ./tests/services/ -run TestSale -v`

### Implementación Frontend US1

- [ ] T012 [US1] Crear `salesContext.js`:
  - Estado: `sales` (array en localStorage)
  - Acciones: `addSale(sale)`, `getSales()`, `getSaleById(id)`
  - Persiste PDF como base64 string junto a cada venta
- [ ] T013 [US1] Crear `SalesPage.js`:
  - Input de búsqueda de productos (llama a `GET /api/product` y filtra por nombre)
  - Muestra stock disponible junto a cada resultado
  - Si stock = 0 → ítem deshabilitado con badge "Sin stock"
  - Tabla de ítems de la venta nueva (producto, cantidad editable, subtotal)
  - Validación: no permitir cantidad > stock
  - Campos opcionales: nombre cliente, teléfono cliente
  - Botón "Confirmar Venta" → llama a `POST /api/sales`
  - Sección historial: lista de ventas anteriores con botón "Descargar PDF"
- [ ] T014 [US1] Crear `SaleReceipt.js`:
  - Recibe objeto `venta` y genera PDF con `jsPDF`
  - Encabezado: logo (de `settingsContext`), nombre tienda, número WA
  - Número de comprobante autoincremental
  - Tabla: producto | cantidad | precio unit. | subtotal
  - Total
  - Datos cliente (si existen) o "Consumidor Final"
  - Leyenda "Gracias por su compra"
  - Guarda el PDF como base64 en `salesContext` para re-descarga futura
- [ ] T015 [US1] Integrar `SalesPage` en `App.js`: ruta `/admin/sales` protegida con `PrivateRoute`
- [ ] T016 [US1] Agregar "Panel de Ventas" al navbar admin (en `Header.js` o `AdminNavbar.js`)

*Checkpoint*: El admin puede acceder a `/admin/sales`, cargar una venta, confirmarla, descargar el PDF y ver el historial.

---

## Phase 4: User Story 2 — Comprobante PDF (P1)

> **Nota**: Esta US está co-implementada con T014 en Phase 3. Esta fase cubre los tests específicos del PDF.

*Goal*: El PDF generado contiene todos los campos requeridos, incluye el logo actual y queda guardado para re-descarga.

### Tests de Verificación del PDF

- [ ] T017 [US2] Test manual del PDF:
  1. Ir a `/admin/sales`
  2. Cargar una venta con al menos 2 productos distintos
  3. Confirmar la venta
  4. Verificar que se descarga automáticamente el PDF
  5. Abrir el PDF y verificar: logo, nombre tienda, número comprobante, tabla de ítems, total, "Gracias por su compra"
  6. Recargar la página → ir al historial → descargar el PDF nuevamente → verificar que es idéntico

- [ ] T018 [US2] Verificar re-descarga desde historial:
  1. Confirmar venta
  2. Cerrar y reabrir el browser
  3. Ir a `/admin/sales` → historial
  4. Hacer clic en "Descargar PDF" de la venta anterior → debe descargarse el mismo PDF guardado

*Checkpoint*: El PDF es correcto y se puede re-descargar desde el historial.

---

## Phase 5: User Story 3 — Configuración (P2)

*Goal*: El admin puede cambiar el logo (con preview) y el número de WhatsApp. Los cambios se reflejan en tiempo real.

*Independent Test*: Subir un nuevo logo → ver preview → confirmar → recargar la home → logo debe aparecer actualizado.

### Implementación Frontend US3

- [ ] T019 [US3] Crear `settingsContext.js`:
  - Estado: `logoUrl` (string, default `/logo-muebleria.png`), `whatsappNumber` (string)
  - Persiste en `localStorage`
  - Provee `updateLogo(url)`, `updateWhatsapp(number)`
  - Envuelve la app en `App.js` para que Header, footer y PDF lean de este contexto
- [ ] T020 [US3] Crear `SettingsPage.js`:
  - **Sección Logo:**
    - Input tipo `file` (acepta `image/jpeg, image/png`)
    - Valida tamaño ≤ 5 MB; si supera → mensaje de error, no continúa
    - Muestra vista previa (`<img>`) del logo seleccionado antes de confirmar
    - Botón "Guardar Logo" → sube via `POST /api/images` ya existente → guarda URL en `settingsContext`
  - **Sección WhatsApp:**
    - Input con prefijo fijo `+549` (no editable)
    - Campo para el resto del número (solo dígitos, validación de longitud mínima 10 dígitos)
    - Mensaje de error inline si está incompleto
    - Botón "Guardar" → actualiza `settingsContext`
- [ ] T021 [US3] Actualizar `Header.js` para leer logo y whatsapp de `settingsContext` en lugar de hardcode
- [ ] T022 [US3] Actualizar `Home.js` y `DetailProduct.js` para leer whatsappNumber de `settingsContext`
- [ ] T023 [US3] Integrar `SettingsPage` en `App.js`: ruta `/admin/settings` protegida
- [ ] T024 [US3] Agregar "Configuración" al navbar admin

### Tests de Verificación US3

- [ ] T025 [US3] Test manual logo:
  1. Ir a `/admin/settings`
  2. Seleccionar una imagen JPG
  3. Verificar que aparece la vista previa antes de guardar
  4. Guardar → ir a la home → verificar que el logo cambió en el header y footer
  5. Recargar el browser → el logo sigue siendo el nuevo (persistencia localStorage)

- [ ] T026 [US3] Test manual WhatsApp:
  1. Ir a `/admin/settings`
  2. Cambiar el número (ej. `1112345678`)
  3. Guardar → ir a la home → hacer clic en "Comprar por WhatsApp" en cualquier producto → verificar que el enlace usa el nuevo número
  4. Intentar guardar con número incompleto → verificar que aparece el error inline

*Checkpoint*: Logo y WhatsApp actualizados y persistentes tras recarga.

---

## Phase 6: Polish

- [ ] T027 Verificar que el navbar admin muestra correctamente las tres secciones: Productos | Ventas | Configuración
- [ ] T028 Verificar que todas las rutas admin están protegidas por `PrivateRoute` (solo rol ADMIN)
- [ ] T029 Estilar `SalesPage.js` y `SettingsPage.js` con la paleta wood (#8B5A2B, #F4ECE1, Playfair Display + Lato) consistente con el redesign
- [ ] T030 Ejecutar build de producción y verificar que no hay errores: `npm run build`
- [ ] T031 Ejecutar tests backend completos: `cd Ecommerce-Back-Go && go test ./tests/services/ -v`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sin dependencias — puede empezar de inmediato
- **Phase 2 (Backend)**: Depende de Phase 1 — bloqueante para Phase 3
- **Phase 3 (US1 Ventas)**: Depende de Phase 2
- **Phase 4 (US2 PDF)**: Co-implementada con Phase 3, tests independientes
- **Phase 5 (US3 Config)**: Puede implementarse en paralelo con Phase 3 una vez Phase 2 lista
- **Phase 6 (Polish)**: Depende de Phases 3, 4 y 5

### User Story Dependencies

- **US1 (Cargar Venta)**: Requiere Phase 2 (backend) completo
- **US2 (PDF)**: Co-implementada con US1, misma fase
- **US3 (Configuración)**: Independiente del backend de ventas, solo requiere `settingsContext`

### Notas

- El diseño HTML del admin lo proveerá el usuario antes de implementar Phases 3 y 5
- El PDF se genera 100% en cliente con `jsPDF` — sin dependencias de servidor adicionales
- La configuración (logo, WA) se guarda en `localStorage`; no requiere endpoint backend nuevo
- El endpoint `POST /api/images` ya existente se reutiliza para subir el logo de tienda
