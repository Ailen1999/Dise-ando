# Feature Specification: Admin Panel — Panel de Ventas y Configuración

*Created*: 2026-03-04

---

## Contexto

El panel de administración ya cuenta con gestión de productos (ABM) y órdenes. Esta especificación agrega dos nuevas secciones al navbar de admin:

1. **Panel de Ventas** — registro manual de ventas con descuento de stock y emisión de comprobante PDF.
2. **Configuración** — personalización del logo y número de WhatsApp de la tienda.

---

## User Scenarios & Testing

### User Story 1 — Cargar una Venta (Priority: P1)

El administrador realizó una venta presencial o telefónica. Quiere registrarla en el sistema para descontar el stock y entregar un comprobante al cliente.

**Flujo esperado:**
- Ingresa al Panel de Ventas desde el navbar.
- Agrega productos a la venta buscando por nombre o seleccionando del catálogo.
- Asigna cantidad a cada ítem.
- Completa datos opcionales del cliente (nombre, teléfono).
- Confirma la venta.
- El sistema descuenta el stock de cada producto vendido.
- Se habilita la opción de generar el comprobante PDF.

*Why this priority*: Es el núcleo del panel. Sin ventas no hay nada más que mostrar.

*Independent Test*: Puede probarse completamente creando una venta con 1 producto y verificando que el stock bajó y el PDF se generó.

*Acceptance Scenarios*:

1. *Given* un producto con stock 10, *When* el admin carga una venta de 3 unidades, *Then* el stock queda en 7 y la venta queda registrada.
2. *Given* una venta confirmada, *When* el admin hace clic en "Emitir Comprobante", *Then* se descarga un PDF con los detalles de la venta.
3. *Given* un producto con stock 2, *When* el admin intenta cargar 5 unidades, *Then* el sistema muestra un error de stock insuficiente y no permite continuar.
4. *Given* una venta con múltiples productos, *When* se confirma, *Then* el stock de cada producto se descuenta correctamente.

---

### User Story 2 — Emitir Comprobante de Venta en PDF (Priority: P1)

Después de confirmar una venta el administrador necesita imprimir un comprobante simple para dárselo al cliente como constancia.

**Contenido del comprobante:**
- Logo de la tienda
- Nombre de la tienda y número de WhatsApp
- Fecha y número de comprobante (autoincremental)
- Tabla con: producto, cantidad, precio unitario, subtotal
- Total de la venta
- Datos del cliente (si se completaron)
- Leyenda: "Gracias por su compra"

*Why this priority*: El PDF es la salida tangible de la venta. Lo necesita el admin para el circuito presencial completo.

*Independent Test*: Puede probarse generando el PDF de una venta ya registrada y verificando que contiene todos los campos requeridos.

*Acceptance Scenarios*:

1. *Given* una venta confirmada, *When* se hace clic en "Emitir Comprobante PDF", *Then* el navegador descarga o abre en una nueva pestaña el comprobante listo para imprimir.
2. *Given* una venta con logo personalizado activo, *When* se emite el comprobante, *Then* el logo de la tienda aparece en el encabezado del PDF.
3. *Given* una venta sin datos de cliente, *When* se emite el comprobante, *Then* el campo cliente dice "Consumidor Final".

---

### User Story 3 — Configuración: Logo y WhatsApp (Priority: P2)

El administrador quiere personalizar la identidad visual y el contacto de la tienda desde un panel sencillo, sin tocar código.

**Flujo esperado:**
- Ingresa a la sección "Configuración" desde el navbar de admin.
- Puede subir un nuevo logo (imagen JPG/PNG).
- Puede editar el número de WhatsApp de contacto.
- Guarda los cambios.
- El logo y número actualizados se reflejan de inmediato en el Header, footer y comprobantes PDF.

*Why this priority*: El logo y el WhatsApp son datos de marca que deben poder modificarse sin un deploy. Es secundario a la venta pero esencial para la operación real.

*Independent Test*: Puede probarse subiendo un logo nuevo, recargando la home y verificando que el logo cambió en el header.

*Acceptance Scenarios*:

1. *Given* el admin sube una imagen de logo, *When* guarda, *Then* el logo nuevo aparece en el header del storefront.
2. *Given* el admin cambia el número de WhatsApp, *When* guarda, *Then* los botones "Comprar por WhatsApp" usan el nuevo número.
3. *Given* se sube un archivo que no es imagen (.pdf, .exe, etc.), *When* el admin intenta guardar, *Then* se muestra un error de validación de formato.

---

### Edge Cases

- **Venta con producto sin stock (0 unidades):** Se le avisará al administrador que ese producto no tiene stock y no podrá agregar ese ítem a la venta.
- **Producto eliminado durante la carga:** El producto no aparecerá en el listado de búsqueda. Si el admin intenta buscarlo, verá "Producto inexistente"; deberá cargarlo de nuevo desde el ABM de productos.
- **Logo de tamaño excesivo:** Se mostrará una vista previa del logo antes de confirmar. El admin puede ver cómo quedará antes de guardar; se bloqueará si supera 5 MB mostrando un mensaje de error.
- **Número de WhatsApp con formato inválido:** El input tendrá precargado `+549`. El admin solo completa el resto. Si queda incompleto o tiene caracteres inválidos, se mostrará error de validación inline y no se permitirá guardar.
- **PDF que falla:** El PDF generado queda guardado junto a la venta (en `localStorage` como blob/URL). El admin puede descargarlo nuevamente desde el historial de ventas en cualquier momento.

---

## Requirements

### Functional Requirements

**Panel de Ventas:**

- *FR-001*: El sistema DEBE permitir al admin agregar productos a una venta buscándolos por nombre.
- *FR-002*: El sistema DEBE mostrar el stock disponible de cada producto al agregarlo.
- *FR-003*: El sistema NO DEBE permitir cargar más unidades de las disponibles en stock.
- *FR-004*: Al confirmar la venta, el sistema DEBE descontar el stock de cada producto vendido mediante la API del backend Go.
- *FR-005*: El sistema DEBE registrar la venta con: fecha, productos (nombre, cantidad, precio), total y datos del cliente (opcionales).
- *FR-006*: El sistema DEBE generar un PDF descargable del comprobante de venta.
- *FR-007*: Cada comprobante DEBE tener un número único autoincremental.
- *FR-008*: El admin DEBE poder ver el historial de ventas registradas (listado simple).

**Configuración:**

- *FR-009*: El admin DEBE poder subir un nuevo logo en formato JPG o PNG (máx. 5 MB).
- *FR-010*: El logo guardado DEBE reflejarse en el header, footer y en los comprobantes PDF.
- *FR-011*: El admin DEBE poder editar el número de WhatsApp con validación de formato.
- *FR-012*: Los cambios de configuración DEBEN persistir entre sesiones (no resetearse al recargar).

### Key Entities

- *Venta*: Fecha, número de comprobante, lista de ítems (productoId, nombre, cantidad, precioUnitario), total, nombre del cliente (opcional), teléfono del cliente (opcional).
- *ÍtemVenta*: ProductoId, nombre del producto (snapshot al momento de la venta), cantidad, precioUnitario, subtotal.
- *Configuración de Tienda*: URL del logo, número de WhatsApp. Persiste en `localStorage` y/o backend según implementación.

### Constraints técnicos

- Frontend: React 18, Tailwind CSS, misma paleta wood que el redesign (`#8B5A2B`, etc.)
- Generación de PDF: biblioteca `jsPDF` o `react-pdf` en cliente (sin dependencia de servidor).
- Backend: API Go existente. Se agregarán endpoints para ventas y configuración.
- El descuento de stock debe llamar al endpoint Go existente de actualización de producto. Si no existe un endpoint POST `/api/sales` se deberá crear.

---

## Success Criteria

### Measurable Outcomes

- *SC-001*: El admin puede registrar una venta completa (buscar producto → asignar cantidad → confirmar) en menos de 2 minutos.
- *SC-002*: El PDF del comprobante se genera y descarga en menos de 3 segundos.
- *SC-003*: El stock se refleja correctamente en el panel de productos después de cada venta (sin requerir recarga manual).
- *SC-004*: El cambio de logo y WhatsApp se ve reflejado en el storefront sin necesitar un redeploy.
- *SC-005*: El 100% de las ventas registradas descuentan stock correctamente (sin desincronización).
