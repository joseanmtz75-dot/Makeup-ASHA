# Makeup ASHA — Plataforma de Ventas y Dinámicas

Plataforma web (no app) para el negocio de venta de maquillaje económico de las socias de ASHA. Incluye CRM interno para administrar productos, dinámicas, clientas y pedidos + página pública con catálogo y dinámicas activas para que las clientas participen. Single-tenant: una sola org (ASHA), pensada para escalar a más operadoras bajo la misma marca, NO como SaaS multi-tenant.

**Dominio de produccion**: por definir
**Negocio**: Makeup ASHA (2 socias)
**Cobertura**: Tonalá, Zapopan, Guadalajara, Tlaquepaque (Jalisco, México)

---

## 1. Modelo de negocio

### Qué es
Página web donde se manejan dinámicas de boletos para venta de maquillaje económico, catálogo de productos, fidelización por puntos y comunidad. Reemplaza el caos actual de WhatsApp/Facebook con una caja registradora ordenada, sin perder el lado emocional y adictivo del modelo (urgencia, sorpresa, comunidad).

### Quiénes son las dueñas
- Dos socias que recién comenzaron el negocio.
- Inventario actual: ~$2,000–$3,000 MXN en producto.
- Proveedor con buen precio ya conseguido.
- 2 dinámicas completas y entregadas hasta hoy.
- Pagos por transferencia y efectivo.
- Trabajo bajo pedido posible.
- Red de contactos: 100–200 mujeres alcanzables vía WhatsApp.
- Velocidad probada: 2 dinámicas de 36 boletos llenas en 2 semanas.

### Mercado objetivo
- Mujeres de NSE medio y medio-bajo.
- Edad: 16–45 años.
- Ticket promedio bajo: $50–$300 MXN.
- Alta interacción en Facebook, WhatsApp y TikTok.
- Buscan: ofertas, emoción (dinámicas/juegos), comunidad.
- Baja tolerancia a fricción digital.

### Núcleo del negocio
La clienta entra desde un link, ve las dinámicas activas, elige su número, sube su comprobante de pago y queda registrada automáticamente. La página elige a la ganadora sola, de forma transparente, y queda en un historial público. Aparte hay catálogo normal de productos para venta directa.

### Dinámicas que se manejan
- **Dinámicas clásicas** (boletos limitados, ej. 36 a $35).
- **Dinámicas express** (se llenan en minutos, solo para clientas fieles).
- **Dinámicas VIP** (acceso solo para niveles altos).
- **Subastas en vivo.**
- **Ofertas flash** (tiempo limitado).
- **Combos sorpresa.**
- **Cajas sorpresa / loot boxes.**
- **Apartados con anticipo.**
- **Descuentos por referidos.**
- **Retos semanales** (ej. "compra 3 veces esta semana y gana X").

### Sistema de fidelización
- **Puntos** por comprar, participar y referir amigas.
- **Niveles**: Bronce, Plata, Oro.
- **Beneficios**: acceso anticipado a dinámicas, descuentos exclusivos, regalos sorpresa.
- Puntos canjeables por productos o descuentos.

### Relación con WhatsApp
WhatsApp **no desaparece**. Sigue siendo el canal de plática y soporte. La página tiene botón directo a WhatsApp en cualquier momento. **La página complementa a WhatsApp, no lo reemplaza**: WhatsApp es la conversación, la página es la caja registradora ordenada.

---

## 2. Por qué página web (no app)

- Cero fricción: las clientas no descargan nada, entran desde un link como Facebook.
- Sin riesgo de perder clientas que no quieran instalar otra app.
- No pasa por Google Play / App Store: evita filtros sobre apps de "gambling".
- Un solo desarrollo funciona en todos los dispositivos.
- **Decisión confirmada**: solo página web accesible desde navegador, sin instalación obligatoria.

---

## 3. Posicionamiento legal (zona gris)

El negocio opera en zona gris frente a la Ley Federal de Juegos y Sorteos (SEGOB). Mientras la operación sea pequeña y discreta, se mantiene bajo el radar. Reglas innegociables:

- **NUNCA usar** las palabras "rifa", "sorteo" ni "lotería" en UI pública, base de datos, código, ni endpoints.
- Términos permitidos: **"dinámica"**, **"dinámica de boletos"**, **"participación con número de la suerte"**, **"promoción con número asignado"**, **"concurso de participación"**.
- Framing: la clienta compra "una participación en la dinámica", no "un boleto de rifa".
- Evitar publicidad masiva pagada al inicio.
- Disclaimer "uso para mayores de 18 años" en footer y al participar.
- Mecánica de selección **demostrablemente justa y verificable** (semilla pública + hash auditable).
- Cuando el negocio escale a marketplace o facture $50k+ MXN al mes, resolver permiso formal.

---

## 4. Stack

- **Framework**: Next.js 14+ (App Router, TypeScript)
- **DB**: PostgreSQL en Supabase, schema `public`
- **ORM**: Prisma
- **Auth**: Supabase Auth
  - Admin/operadoras: email + password
  - Clientas: link mágico por WhatsApp (passwordless)
- **Storage**: Supabase Storage (fotos de productos, comprobantes de pago en bucket privado)
- **UI**: Tailwind CSS + Radix UI + shadcn/ui + Lucide icons
- **Animaciones**: Framer Motion
- **Hosting**: Vercel
- **i18n**: solo español MX por ahora
- **Validación**: Zod
- **Sanitización**: isomorphic-dompurify

### Razones del stack
- Gratuito o barato hasta volúmenes medios ($0/mes hasta tener tráfico real).
- Rapidez de desarrollo con Claude Code.
- No depende de stores ni de procesos de revisión.
- Escalable cuando crezca el negocio.
- Mismo stack que Cuanty, conocido por el desarrollador.

---

## 5. Arquitectura de carpetas

```
app/
  (public)/              Página pública: home, catálogo, dinámicas, detalle, perfil de clienta
  (dashboard)/           CRM admin: productos, dinámicas, clientas, comprobantes, métricas, configuración
  (auth)/                Login admin/operadora + flujo de link mágico de clientas
  api/                   REST API (todos los endpoints filtrados por rol)

lib/
  auth/                  getUserContext.ts, checkRole.ts, checkPermission.ts
  supabase/              Clientes: client.ts (browser), server.ts (SSR), admin.ts (service role)
  constants/             estatusDinamica.ts, niveles.ts, municipios.ts
  validations/           Schemas Zod (producto.ts, dinamica.ts, clienta.ts, comprobante.ts)
  hooks/                 useUser.ts, useRole.ts
  utils/                 dineroMxn.ts, formatearMensajeWP.ts, slugify.ts, sortearGanadora.ts
  prisma.ts              Singleton con proxy lazy
  whatsapp.ts            Genera links wa.me/52{telefono} y envía link mágico
  rate-limit.ts          Rate limiting en memoria por IP
  csrf.ts                Verifica header X-Requested-With

components/
  ui/                    Primitivos shadcn (button, card, dialog, etc.)
  layout/                Sidebar.tsx, Header.tsx
  productos/             ProductoCard, GaleriaFotos, FormularioProducto
  dinamicas/             DinamicaCard, ProgresoBoletos, SelectorNumero, HistorialGanadoras, AnimacionSorteo
  clientas/              PerfilClienta, BadgeNivel, ContadorPuntos
  comprobantes/          UploaderComprobante, ValidadorComprobante (admin)
  publico/               Hero, FeedDinamicas, BotonWhatsApp, BannerPromocion

scripts/                 Scripts manuales (seed, crear-admin, sortear-ganadora-manual)
prisma/                  schema.prisma + migraciones
```

---

## 6. Modelos Prisma

Single-tenant: todas las tablas pertenecen a ASHA implícitamente, no hay `organizationId`. IDs son CUID. Timestamps: `creadoEn` / `actualizadoEn`.

### Catálogo
- **Producto** — Producto de maquillaje. `nombre`, `descripcion`, `precio`, `stock`, `categoria` (enum), `activo`, `sku` opcional. Relación con `ImagenProducto[]`.
- **ImagenProducto** — Foto del producto. `url`, `orden`. Cascade delete con Producto.

### Dinámicas (núcleo)
- **Dinamica** — Una dinámica de boletos. `nombre`, `descripcion`, `tipo` (enum), `precioBoleto`, `totalBoletos`, `productoPremio` (relación opcional con Producto), `premioCustom` (string si no es del catálogo), `estatus` (enum), `inicioEn`, `cierreEn` (opcional, para express/flash), `seedGanadora` (string, semilla pública usada para sortear), `hashSeed` (hash SHA256 de la seed publicado al iniciar), `boletoGanador` (int, nullable hasta sortear), `clientaGanadoraId` (relación con Clienta, nullable). Relaciones: `Boleto[]`, `HistorialDinamica[]`.
- **Boleto** — Un número dentro de una dinámica. `dinamicaId`, `numero` (int), `clientaId` (nullable hasta confirmar), `estatus` (enum: disponible/reservado/pendiente_validacion/confirmado/cancelado), `reservadoEn`, `confirmadoEn`, `comprobanteId` (nullable). **Compound unique `[dinamicaId, numero]`** — un número no puede repetirse en la misma dinámica.
- **Comprobante** — Comprobante de pago subido. `imagenUrl` (storage privado), `monto`, `metodoPago` (enum: transferencia/efectivo/oxxo), `referenciaPago` opcional, `estatus` (enum: pendiente/aprobado/rechazado), `validadoPor` (userId admin), `validadoEn`, `notas`. Relación con `Boleto`.
- **HistorialDinamica** — Auditoría de cambios de estatus de la dinámica (estatusAnterior, estatusNuevo, userId, fecha).

### Clientas
- **Clienta** — La usuaria final. `telefono` (unique, único requisito), `nombre`, `email` opcional, `direccion` opcional, `municipio` (enum), `puntos` (int), `nivelActual` (enum: BRONCE/PLATA/ORO), `referidaPor` (Clienta opcional), `userId` Supabase opcional (solo si decidió crear perfil con link mágico), `creadaEn`, `ultimaCompraEn`. Relación con `Boleto[]`, `Compra[]`, `Notificacion[]`.
- **Compra** — Venta directa de productos del catálogo (no dinámicas). `clientaId`, `productoId`, `cantidad`, `precioUnitario`, `total`, `estatus` (enum: pendiente/pagado/entregado/cancelado), `comprobanteId` opcional, `direccionEntrega`.

### Cancelaciones
- **SolicitudCancelacion** — Solicitud de cancelación de boleto o compra. `tipoOrigen` (enum: boleto/compra), `boletoId` (nullable), `compraId` (nullable), `clientaId`, `motivo` (texto), `estatus` (enum: pendiente/aprobada/rechazada), `revisadaPor` (userId admin, nullable), `revisadaEn` (nullable), `notasAdmin` (texto opcional), `montoDevolucion` (float, lo registra admin al aprobar), `metodoDevolucion` (enum: transferencia/efectivo/saldo_puntos, lo elige admin). Auditoría completa de devoluciones.

### Fidelización (Fase 2)
- **MovimientoPuntos** — Auditoría de puntos: `clientaId`, `tipo` (gano/canjeo), `cantidad`, `motivo` (string), `referenciaTipo` (compra/dinamica/referido/manual), `referenciaId`.
- **Reto** — Reto semanal. `nombre`, `descripcion`, `condicion` (json con la regla), `recompensaPuntos`, `inicioEn`, `cierreEn`, `activo`.
- **ProgresoReto** — `clientaId`, `retoId`, `progreso` (int), `completado`, `completadoEn`.

### Sistema
- **Notificacion** — Notificación interna a la clienta o admin. `destinatarioTipo` (clienta/admin), `destinatarioId`, `titulo`, `mensaje`, `tipo` (info/exito/warning/urgente), `leida`, `enlace` opcional.
- **ConfiguracionSitio** — Configuración global del sitio (1 sola fila). Logo, colores primario/secundario, hero text, WhatsApp principal, info de contacto, secciones visibles. Editable por admin desde dashboard.

### Enums
- **CategoriaProducto**: LABIALES, BASES, OJOS, RUBORES, BROCHAS, KITS, OTROS
- **TipoDinamica**: CLASICA, EXPRESS, VIP, FLASH, COMBO_SORPRESA, CAJA_SORPRESA, SUBASTA
- **EstatusDinamica**: BORRADOR, ACTIVA, LLENA, GANADORA_SELECCIONADA, ENTREGADA, CANCELADA
- **EstatusBoleto**: DISPONIBLE, RESERVADO, PENDIENTE_VALIDACION, CONFIRMADO, CANCELACION_SOLICITADA, CANCELADO
- **EstatusSolicitudCancelacion**: PENDIENTE, APROBADA, RECHAZADA
- **TipoOrigenCancelacion**: BOLETO, COMPRA
- **MetodoDevolucion**: TRANSFERENCIA, EFECTIVO, SALDO_PUNTOS
- **EstatusComprobante**: PENDIENTE, APROBADO, RECHAZADO
- **MetodoPago**: TRANSFERENCIA, EFECTIVO, OXXO
- **EstatusCompra**: PENDIENTE, PAGADO, ENTREGADO, CANCELADO
- **Municipio**: TONALA, ZAPOPAN, GUADALAJARA, TLAQUEPAQUE, OTRO
- **NivelClienta**: BRONCE, PLATA, ORO
- **TipoMovimientoPuntos**: GANO, CANJEO

---

## 7. Sistema de roles

Los roles se almacenan en `auth.users.user_metadata.role` de Supabase. **No hay multi-tenant**, todos los datos pertenecen a ASHA implícitamente.

| Rol | Acceso | Restricciones |
|-----|--------|---------------|
| **admin** | Todo el dashboard: productos, dinámicas, clientas, validar comprobantes, métricas, configuración del sitio | Las 2 socias |
| **operadora** | Dashboard limitado: validar comprobantes, ver clientas, atender pedidos | Sin acceso a métricas financieras, configuración del sitio, ni eliminación de productos. Para futuras ayudantes |
| **clienta** | Solo su perfil (`/mi-perfil`): historial, puntos, nivel, dinámicas activas | Acceso opcional via link mágico WhatsApp. Puede comprar SIN registrarse |

### Flujo de autenticación clientas (Opción 2: anónima + perfil opcional)
1. La clienta entra a la página y puede ver todo sin autenticarse.
2. Compra su boleto sin registrarse: escribe nombre + teléfono + dirección + sube comprobante. Listo.
3. Después del checkout aparece un mensaje: "¿Quieres guardar tu compra y ganar puntos? Te mandamos un link por WhatsApp para entrar".
4. Si dice sí, se le manda un link mágico a su WhatsApp con el `wa.me/` link.
5. Al hacer clic, queda logueada y su `Clienta` queda vinculada a un `userId` de Supabase.
6. A partir de ahí acumula puntos y puede entrar a su perfil cuando quiera.

### Flujo de autenticación admin/operadora
- Login tradicional con email + password en `/login`.
- Cuentas creadas por script o por otro admin desde `/dashboard/usuarios`.

### Middleware
1. Rutas públicas: home, catálogo, dinámicas, detalle de dinámica, mi-perfil (con verificación de link mágico), checkout.
2. Rutas admin: requieren rol admin u operadora.
3. Rutas solo admin: configuración del sitio, métricas financieras, gestión de usuarios.
4. APIs públicas POST: rate limit + CSRF + DOMPurify.

---

## 8. Rutas API

### Públicas (sin auth)
- `GET /api/dinamicas` — Lista de dinámicas activas (campos públicos, sin datos sensibles)
- `GET /api/dinamicas/[id]` — Detalle de dinámica con boletos disponibles (números libres/ocupados, sin datos de clientas)
- `GET /api/productos` — Catálogo público
- `GET /api/productos/[id]` — Detalle de producto
- `GET /api/historial-ganadoras` — Lista pública de dinámicas cerradas con ganadoras (nombre o alias, fecha, premio, hash de seed para verificación)
- `POST /api/clientas` — Registro o lookup de clienta por teléfono (rate limit 10/h, CSRF, DOMPurify)
- `POST /api/boletos/reservar` — Reservar uno o varios números en dinámica (rate limit 20/h, CSRF, valida disponibilidad). Acepta array de números.
- `POST /api/comprobantes` — Subir comprobante de pago (rate limit 10/h, CSRF, valida tamaño y tipo de imagen)
- `POST /api/solicitudes-cancelacion` — Clienta solicita cancelación de boleto o compra (rate limit 5/h, CSRF, requiere motivo)
- `POST /api/auth/magic-link` — Solicitar link mágico por WhatsApp para acceder a perfil (rate limit 5/h)
- `POST /api/contacto` — Mensaje de contacto desde la página (rate limit 5/h)

### Clienta autenticada
- `GET /api/mi-perfil` — Datos de la clienta logueada
- `GET /api/mis-boletos` — Boletos activos e históricos
- `GET /api/mis-puntos` — Puntos actuales y movimientos
- `GET /api/mis-compras` — Historial de compras directas

### Admin / Operadora
- `GET/POST /api/admin/productos`, `PUT/DELETE /api/admin/productos/[id]`
- `GET/POST /api/admin/dinamicas`, `PUT/DELETE /api/admin/dinamicas/[id]`
- `POST /api/admin/dinamicas/[id]/sortear` — Ejecuta el algoritmo de selección (admin only, valida que esté llena)
- `POST /api/admin/dinamicas/[id]/marcar-entregada` — Marca como entregada al dar el premio
- `GET /api/admin/comprobantes?estatus=pendiente` — Cola de validación
- `PUT /api/admin/comprobantes/[id]` — Aprobar o rechazar comprobante (admin u operadora)
- `GET /api/admin/solicitudes-cancelacion?estatus=pendiente` — Cola de cancelaciones por revisar
- `PUT /api/admin/solicitudes-cancelacion/[id]` — Aprobar o rechazar (admin u operadora). Si aprueba, registra monto y método de devolución
- `GET /api/admin/clientas` — Lista de clientas con filtros
- `GET /api/admin/clientas/[id]` — Detalle de clienta con historial completo
- `GET /api/admin/metricas` — KPIs (admin only)
- `GET/PUT /api/admin/configuracion` — Configuración del sitio (admin only)
- `GET/POST /api/admin/usuarios` — Gestión de operadoras (admin only)

---

## 9. Variables de entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# PostgreSQL
DATABASE_URL=postgresql://...@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://...@db.[ref].supabase.co:5432/postgres

# WhatsApp (link mágico)
WHATSAPP_NUMERO_PRINCIPAL=523312345678  # Número de las socias

# App
NEXT_PUBLIC_APP_URL=https://makeup-asha.vercel.app
NEXT_PUBLIC_APP_NAME=ASHA
```

---

## 10. Reglas de negocio críticas (NUNCA romper)

1. **Lenguaje legal**: Cero uso de "rifa", "sorteo", "lotería" en UI, código, BD, endpoints, comentarios. Siempre "dinámica" / "participación" / "boleto" / "número".

2. **Boleto único por dinámica**: Compound unique `[dinamicaId, numero]`. Dos clientas no pueden tener el mismo número. La reserva debe ser atómica (transacción Prisma). **Una misma clienta SÍ puede comprar múltiples números en la misma dinámica** — solo le da más oportunidades de ganar.

3. **Reserva con timeout**: Cuando una clienta reserva un número y aún no sube comprobante, el boleto queda en `RESERVADO` por 30 minutos. Si no sube comprobante en ese tiempo, vuelve a `DISPONIBLE` automáticamente (cron o check on-read).

4. **Comprobante validado antes de confirmar**: Un boleto pasa de `PENDIENTE_VALIDACION` a `CONFIRMADO` SOLO cuando una admin u operadora aprueba el comprobante manualmente. Sin excepciones, sin OCR.

5. **Dinámica no se sortea sin todos los boletos confirmados**: El endpoint `/api/admin/dinamicas/[id]/sortear` valida que `boletosConfirmados === totalBoletos` antes de ejecutar.

6. **Algoritmo de selección de ganadora reproducible y auditable**:
   - Al crear la dinámica se genera una `seed` aleatoria (UUID).
   - El `hashSeed` (SHA256 de la seed) se guarda y muestra públicamente desde el día 1.
   - Al sortear: `numeroGanador = (sha256(seed + dinamicaId + timestampSorteo) % totalBoletos) + 1`.
   - Al cerrar, la `seed` original se publica para que cualquiera pueda verificar el hash y recalcular el número.
   - El historial público muestra: hash inicial, seed final, número ganador, clienta ganadora.

7. **Comprobantes de pago en bucket privado**: Las imágenes de comprobantes JAMÁS son accesibles públicamente. Solo via signed URL con expiración corta (5 min) generada por endpoint admin autenticado.

8. **Datos personales protegidos**: Teléfono y dirección de clientas solo visibles para admin/operadora. La API pública NUNCA devuelve teléfono completo (puede mostrar nombre + iniciales del teléfono "Karla M. — 33 ** ** 89").

9. **Historial público de ganadoras es un derecho de la clienta**: Cualquiera puede ver `/historial` sin autenticarse. Es la base de la confianza del modelo. Solo se muestra: alias o nombre + apellido inicial, fecha, dinámica, premio, hash inicial, seed final, número ganador.

10. **Transiciones de estatus de dinámica**: Solo válidas en este orden:
    ```
    BORRADOR → ACTIVA → LLENA → GANADORA_SELECCIONADA → ENTREGADA
    ```
    `CANCELADA` puede ocurrir desde cualquier estado anterior a `GANADORA_SELECCIONADA`. No se permiten saltos.

11. **Sanitización XSS**: Todos los inputs públicos (nombres, mensajes, comentarios) se sanitizan con DOMPurify antes de almacenar.

12. **Compra anónima permitida**: La clienta puede completar la compra de un boleto SIN crearse cuenta. Solo se le pide nombre + teléfono + dirección + comprobante. El registro con link mágico es opcional.

13. **Cero contraseñas para clientas**: Las clientas NUNCA crean contraseña. Auth solo via link mágico WhatsApp.

14. **Stock de productos**: Cuando se confirma una compra directa de catálogo, el stock baja automáticamente. Si el stock llega a 0, el producto se marca como agotado pero NO se borra.

15. **Cobertura geográfica**: La página solo permite seleccionar municipios de Jalisco soportados (Tonalá, Zapopan, Guadalajara, Tlaquepaque) en el campo de entrega. "Otro" requiere coordinación manual por WhatsApp.

16. **Cancelaciones siempre con aprobación de admin**: Una clienta NUNCA puede cancelar un boleto o compra directamente. Crea una `SolicitudCancelacion` con motivo, queda en estatus `PENDIENTE` y aparece en la cola de revisión del admin. La admin decide aprobar o rechazar, registra el monto y método de devolución. Solo cuando la solicitud queda `APROBADA` el boleto pasa a `CANCELADO` y vuelve a `DISPONIBLE` en la dinámica. Si se rechaza, el boleto vuelve a `CONFIRMADO`. Toda cancelación queda auditada con userId, fecha y notas.

---

## 11. Convenciones

### Código
- Componentes: PascalCase. Archivos de componente: PascalCase.tsx
- Utilidades y hooks: camelCase
- Rutas API: kebab-case (`/api/admin/dinamicas/[id]/sortear`)
- DB fields: snake_case via `@map()`, TypeScript fields: camelCase
- IDs: CUID via `@default(cuid())`
- Monetarios: `Float` en Prisma, formateado con `Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" })`

### UI
- Estilo visual: pendiente de definir con las socias (colores, logo, tipografía).
- Mientras tanto: paleta neutral cálida (rosa palo / nude / dorado suave) hasta confirmar.
- Botones grandes, contraste alto.
- Tipografía legible en móvil (mínimo 16px en body).
- Pocos pasos para comprar (máximo 3 clicks de catálogo a comprobante).
- Lenguaje coloquial, emocional.
- Enfoque en dopamina: contadores de urgencia, animaciones de progreso, badges de nivel visibles.
- Mobile-first: 90%+ del tráfico será móvil.

### APIs
- Auth check: `const user = await getUserContext(); if (!user || !["admin","operadora"].includes(user.role)) return 401;`
- Errores: 401 (no auth), 403 (no autorizado), 404 (no encontrado), 400 (validación). Nunca devolver `error.message` ni stack traces al cliente.
- Respuestas exitosas: JSON del objeto creado/actualizado.
- CSRF: `checkCsrf(request)` en todos los POST/PUT/DELETE públicos.
- Rate limiting: `checkRateLimit(key, max, windowMs)` en endpoints públicos.
- Sanitización: `DOMPurify.sanitize(input)` en todos los inputs de texto públicos.

### Prisma
- `npx prisma db push` para desarrollo.
- `DATABASE_URL` (pooled via Supavisor) para runtime.
- `DIRECT_URL` para migraciones y scripts.
- Lazy singleton via Proxy en `lib/prisma.ts`.

---

## 12. Seguridad

### A implementar desde día 1
- **Role checks** en todos los endpoints admin (`getUserContext()` + validación de rol).
- **IDOR protegido**: la clienta solo ve sus propios datos vía `userId`. Endpoints `mi-*` filtran por `userId` siempre.
- **XSS**: DOMPurify en inputs públicos.
- **CSRF**: `X-Requested-With` header check en mutaciones.
- **Rate limiting**: en memoria por IP en endpoints públicos.
- **Comprobantes en bucket privado**: signed URLs con expiración corta para admin.
- **Passwords**: bcrypt via Supabase Auth (admin/operadora). Clientas no tienen password.
- **Error handling**: mensajes genéricos al cliente, stack traces solo server-side.
- **Headers**: HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy.
- **Validaciones server-side**: jamás confiar en validación de cliente. Zod en todos los endpoints.

### A revisar conforme crezca
- CSP header.
- Rate limit distribuido (Redis) si Vercel pasa a multi-instancia.
- CSRF tokens criptográficos en lugar de header check.

---

## 13. Servicios externos

| Servicio | Uso | Configuración |
|----------|-----|---------------|
| **Supabase Auth** | Autenticación admin/operadora (email+pass), magic links de clientas | Anon key (cliente) + Service role key (admin) |
| **Supabase PostgreSQL** | Base de datos principal | Pooled (runtime) + Direct (migraciones) |
| **Supabase Storage** | Fotos de productos (bucket público), comprobantes de pago (bucket privado) | 2 buckets: `productos-publico`, `comprobantes-privado` |
| **WhatsApp** | Soporte, envío de links mágicos a clientas, notificación a socias de comprobantes nuevos | Links wa.me, código país +52 (México) |
| **Vercel** | Hosting + analytics | @vercel/analytics |

### A evaluar conforme crezca
- Twilio/Whapi para mandar links mágicos automáticos sin abrir WhatsApp Web manual.
- Servicio de SMS de respaldo si WhatsApp falla.
- Servicio de notificaciones push web (OneSignal o nativo Web Push API).
- Cloudinary si las imágenes empiezan a pesar mucho y Supabase Storage se queda corto.

---

## 14. Plan de fases

### Fase 0 — Setup ✅ COMPLETADA
- ✅ Next.js 16.2.3 + React 19 + TypeScript + App Router
- ✅ Tailwind 4 + shadcn/ui (Base UI) + 9 componentes base
- ✅ Prisma 6.19 conectado a Supabase Postgres
- ✅ Schema con 6 tablas + 6 enums (Producto, ImagenProducto, Clienta, Compra, Comprobante, ConfiguracionSitio)
- ✅ Helpers: lib/prisma.ts, lib/supabase/{client,server,admin}.ts, lib/auth/getUserContext.ts, lib/csrf.ts, lib/rate-limit.ts, lib/whatsapp.ts, lib/utils/dineroMxn.ts
- ✅ Constantes: municipios, categorías
- ✅ Layout público (Header + Footer + Home), layout dashboard (Sidebar + Home), layout auth con /login placeholder
- ✅ Endpoint /api/health validando conexión Supabase end-to-end
- ✅ proxy.ts con headers de seguridad + protección de rutas /dashboard por rol
- ✅ Build de producción sin errores ni warnings
- ⏳ GitHub remote + Vercel deploy (requiere acción manual del usuario, no bloquea Fase 1)

**Notas técnicas de la ejecución:**
- Prisma 7 introdujo breaking changes (config movió a `prisma.config.ts` con driver adapters). Se bajó a Prisma 6 estable.
- Tailwind 4 usa config CSS-based, no archivo JS.
- shadcn/ui ahora usa Base UI en lugar de Radix. `asChild` ya no aplica — usar `buttonVariants()` con `Link` directamente.
- Next.js 16 deprecó `middleware.ts`. Ahora se usa `proxy.ts` con función `proxy()`.

### Fase 1 — Catálogo y administración base ✅ COMPLETADA
Lo más importante para que las socias puedan ordenar su negocio actual. **Sin dinámicas todavía**.

1. ✅ **Auth admin/operadora** — Login email+password con Supabase Auth, middleware de roles via proxy.ts, logout, script `crear-admin.ts` para alta manual.
2. ✅ **CRUD de productos** — Crear/editar/eliminar/listar productos, upload múltiple a Supabase Storage (`productos-publico`), categorías, stock, activo/inactivo, destacado, soft-delete si tiene compras asociadas.
3. ✅ **Catálogo público** — `/catalogo` con grid responsive, filtros por categoría, búsqueda, badges (destacado, agotado, stock bajo). `/catalogo/[id]` con galería interactiva.
4. ✅ **CRUD de clientas** — Lista con búsqueda, alta manual, edición, vista de detalle con compras, total gastado, puntos, niveles.
5. ✅ **Compras directas (checkout)** — Diálogo de 3 pasos: datos → pago/comprobante → confirmación. Lookup por teléfono, sin registro obligatorio. Crea Clienta+Compra+Comprobante en una transacción.
6. ✅ **Cola de validación de comprobantes** — Lista de pendientes con preview via signed URL (10min), aprobar/rechazar con notas, baja stock automática al aprobar, validación de stock antes de aprobar.
7. ✅ **Gestión de pedidos** — Lista por estatus con tabs y conteos, cambio de estatus con transiciones validadas, devolución automática de stock al cancelar, link directo a WhatsApp con mensaje pre-armado.
8. ✅ **Dashboard básico** — KPIs reales: ventas del mes, productos activos, clientas, comprobantes pendientes. Acciones requeridas con links contextuales. Lista de productos con stock bajo.
9. ✅ **Configuración del sitio** — Solo admin (operadora bloqueada). Marca, colores con color picker, hero, contacto, redes sociales, texto legal. Cambios reflejados en frontend público.

**Endpoints totales**: 28 rutas (16 públicas + 12 admin). Todos los admin con `requireRole`, todos los públicos con CSRF + rate limit + DOMPurify.

**Buckets Storage**:
- `productos-publico` (público, 5MB max, JPG/PNG/WebP/GIF)
- `comprobantes-privado` (privado, 5MB max, JPG/PNG/WebP, signed URLs 10min)

### Fase 2 — Dinámicas de boletos
Una vez que catálogo y administración estén operando bien:
1. **CRUD de dinámicas** (admin) — Crear, definir total de boletos, precio, premio (del catálogo o custom).
2. **Página pública de dinámica** — Grid de números, disponibles vs ocupados, contador de progreso, urgencia.
3. **Checkout de boletos** — Clienta elige uno o varios números, mismo flujo de checkout que catálogo.
4. **Algoritmo de sorteo verificable** — Seed pública desde el inicio, hash SHA256, ejecutado por admin cuando esté llena.
5. **Historial público de ganadoras** — Página pública con verificación criptográfica.
6. **Sistema de cancelaciones** — Cola de solicitudes, aprobación con monto y método de devolución.

### Fase 3 — Retención
- Registro de clientas con link mágico WhatsApp.
- Perfil de clienta con historial y puntos.
- Sistema de puntos (ganar al confirmar compra/boleto, ganar al referir).
- Niveles Bronce/Plata/Oro y beneficios visibles.
- Notificaciones por WhatsApp manuales (admin envía a quien quiera).

### Fase 4 — Crecimiento
- Retos semanales.
- Cajas sorpresa.
- Ofertas flash.
- Feed social ligero (publicaciones de las socias, antes/después, testimonios).
- Notificaciones push web.

### Fase 5 — Escala (solo si el negocio lo justifica)
- Sistema de operadoras con permisos granulares.
- Métricas avanzadas (cohort retention, LTV, embudos).
- Posible migración a multi-tenant si surgen vendedoras independientes con su propia marca (NO planeado por ahora).

---

## 15. Decisiones tomadas

- ✅ Página web (no app instalable).
- ✅ Stack: Next.js + Supabase + Vercel + Claude Code.
- ✅ **Single-tenant con roles** (admin/operadora/clienta), NO multi-tenant.
- ✅ Cobertura inicial: Tonalá, Zapopan, Guadalajara, Tlaquepaque.
- ✅ Pagos: transferencia y efectivo, con subida de comprobante.
- ✅ Validación de comprobantes 100% manual (sin OCR).
- ✅ Supabase Storage (no Cloudinary).
- ✅ WhatsApp como canal de soporte permanente.
- ✅ Operar en zona gris legal con lenguaje cuidado.
- ✅ Auth de clientas: Opción 2 (compra anónima + perfil opcional con link mágico WhatsApp).
- ✅ Auth de admin/operadora: email + password tradicional.
- ✅ Algoritmo de sorteo verificable con seed pública + hash.
- ✅ Desarrollo por fases. **Fase 1 = catálogo + administración**, dinámicas en Fase 2.
- ✅ Una clienta puede comprar múltiples boletos en la misma dinámica (más oportunidades de ganar).
- ✅ Cancelaciones siempre con aprobación de admin (cola de revisión, registro de devolución).
- ✅ Nombre comercial y dominio NO bloquean el desarrollo. Se definen al final con find/replace + variable de entorno.

---

## 16. Decisiones pendientes

Ninguna de estas bloquea el desarrollo del backend. Se resuelven en paralelo o al final.

- ⏳ Nombre comercial definitivo (¿"Makeup ASHA", "ASHA", otro?). **No bloquea**.
- ⏳ Logo y paleta de colores. **No bloquea backend**, sí bloquea diseño visual final.
- ⏳ Dominio definitivo. **No bloquea**, se configura en Vercel al final.
- ⏳ Confirmación de las socias sobre el plan de fases.
- ⏳ Cómo se manejarán las entregas en los 4 municipios (personal vs. mensajero por defecto).
- ⏳ Quién valida los comprobantes al inicio (¿una socia o ambas? ¿turnos?).
- ⏳ Frase de marca / slogan.
- ⏳ Qué pasa si una clienta no recoge su premio (timeout, segunda oportunidad, etc.). **Decisión para Fase 2**.

---

## 17. Riesgos identificados

- **Fricción de adopción**: clientas acostumbradas a WhatsApp pueden resistirse a usar la página. Mitigación: simplicidad extrema y convivencia con WhatsApp.
- **Canibalización del canal actual**: forzar migración mata clientas. Mitigación: la página complementa, no reemplaza.
- **Página fantasma**: 200 contactos no garantizan 200 usuarias activas. Realista: 30–50 usuarias el primer mes.
- **Falla operativa en una dinámica** (boleto duplicado, ganadora mal elegida) destruye confianza ganada en meses. La página debe ser **conservadoramente confiable, no innovadora**.
- **Comprobantes falsos**: alguien podría subir un screenshot editado. Mitigación: validación humana + WhatsApp para confirmar con la clienta en caso de duda.
- **Carga de validación manual**: si el negocio crece rápido, las socias pueden saturarse validando comprobantes. Plan: cuando saturen, contratar operadora.
- **Cold start del feed social**: una red social vacía mata la página. El feed debe arrancar con contenido sembrado por las socias.
- **Pérdida de seed antes de publicar**: si la seed se pierde antes del sorteo, la verificación se rompe. Mitigación: la seed se guarda al crear la dinámica y nunca se modifica.
- **Riesgo legal latente**: si el negocio crece y llama atención, SEGOB puede actuar. Plan: tener un colchón legal antes de superar $50k MXN/mes.

---

## 18. Notas de estilo y tono

- **Comunicación con el desarrollador**: informal, breve, sin formalidades innecesarias, hay confianza.
- **Comunicación con las socias**: lenguaje claro, sin tecnicismos, ejemplos concretos, sin jerga de programación.
- **UI de cara a la clienta**: lenguaje coloquial, emocional, colorido. Botones grandes, pocos pasos. Enfoque en dopamina (urgencia + recompensa). Mobile-first.
- **UI del dashboard admin**: limpia, eficiente, datos arriba, acciones a un clic. No necesita ser bonita, necesita ser rápida y clara.

---

## 19. Referencia: proyecto Cuanty

Este proyecto sigue el mismo patrón estructural que Cuanty Capital Homes (`c:/Users/PC/Documents/CUANTY-CAPITAL-HOMES/`), pero adaptado a single-tenant. Cuando haya dudas de convenciones de código, helpers de auth, manejo de Supabase, patrones de API o estructura de carpetas, revisar Cuanty como referencia. La diferencia clave: ASHA NO es multi-tenant, no tiene `organizationId` en las tablas, no tiene subdominios, no tiene panel de superadmin, no tiene planes ni trial.
