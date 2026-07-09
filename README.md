# DomotiCore — Frontend

Aplicación web en **Angular 21** para gestión de domótica, seguridad, automatización e integraciones. Ofrece dos experiencias según el tipo de cuenta:

- **Hogar Inteligente** — panel residencial (dashboard, seguridad, dispositivos, automatización, historial).
- **Pequeño Negocio** — panel empresarial (hub operativo, dispositivos, reportes, integraciones, automatización, equipo).

---

## Despliegues en vivo

| Servicio | URL |
| --- | --- |
| **Frontend (Vercel)** | [https://veltrix-domoti-core-front-end-omega.vercel.app](https://veltrix-domoti-core-front-end-omega.vercel.app) |
| **API REST (Render)** | [https://domoticore-api.onrender.com/api/v1](https://domoticore-api.onrender.com/api/v1) |
| **Swagger UI (Render)** | [https://domoticore-api.onrender.com/swagger-ui/index.html](https://domoticore-api.onrender.com/swagger-ui/index.html) |
| **OpenAPI JSON** | [https://domoticore-api.onrender.com/v3/api-docs](https://domoticore-api.onrender.com/v3/api-docs) |

El frontend en Vercel consume la API de Render (`NG_APP_API_URL`). Para probar en local, usa `npm start` en `http://localhost:4200`.

---

## Inicio rápido

```bash
git clone <url-del-repositorio>
cd Veltrix-DomotiCore-Front-End
npm install
npm start
```

Abre **http://localhost:4200** e inicia sesión con una de las cuentas de abajo.

> **Contraseña para todas las cuentas demo:** `SecurePass123`

---

## Cuentas de demostración

Usa estas credenciales para probar cada perfil. Los datos están en `public/mock-data/users.json` y también funcionan contra el backend en Render si las cuentas existen allí.

| Perfil | Email | Rol | Segmento | Para qué sirve |
| --- | --- | --- | --- | --- |
| **Administrador** | `admin@domoticore.local` | Admin | **Ambos** (conmutador Hogar ↔ Negocio) | Acceso total: ambos segmentos, equipo, perfil de negocio, ajustes de sistema, exportación, integraciones y vista global de actividad |
| **Usuario hogar** | `home@domoticore.local` | User | Hogar Inteligente | Experiencia residencial completa; **no** accede a rutas de Pequeño Negocio ni gestión de equipo |
| **Usuario negocio** | `business@domoticore.local` | User | Pequeño Negocio | Panel SME operativo; **no** gestiona equipo ni configuración avanzada |
| **Moderador / Gerente** | `mod@domoticore.local` | Moderator | Pequeño Negocio | Gestión de equipo (invitar, editar), integraciones y exportación; **no** elimina miembros ni edita perfil de negocio |

### Qué puede hacer cada rol

#### Administrador (`admin@domoticore.local`)

- Cambiar entre **Hogar Inteligente** y **Pequeño Negocio** desde el conmutador superior.
- Ver **toda** la actividad en Flujos de Actividad (acciones de todos los usuarios).
- Gestionar equipo: agregar, editar, archivar y **eliminar** miembros.
- Acceder a **Perfil de negocio**, **Integraciones**, **Ajustes → Privacidad (sistema)** y **Usuarios autorizados**.
- Registrar mantenimiento, gestionar gateways, exportar datos y eliminar dispositivos.

#### Moderador / Gerente (`mod@domoticore.local`)

- Panel de **Pequeño Negocio** completo (hub, dispositivos, reportes, automatización).
- **Usuarios → Gestión de equipo**: invitar miembros, editar, archivar y reenviar invitaciones.
- Integraciones, exportación de reportes, gateways y mantenimiento.
- **No puede:** eliminar miembros del equipo, editar perfil de negocio ni acceder a ajustes de sistema (privacidad).

#### Usuario estándar — Hogar (`home@domoticore.local`)

- Dashboard, seguridad, dispositivos, automatización e historial del hogar.
- Flujos de actividad: **solo ve sus propias acciones** (por ejemplo, al agregar un dispositivo en Inteligencia Energética).
- Configuración personal (idioma, tema, notificaciones).
- **No puede:** cambiar a Pequeño Negocio, gestionar equipo ni ver actividad de otros usuarios.

#### Usuario estándar — Negocio (`business@domoticore.local`)

- Hub operativo, dispositivos, reportes, automatización e integraciones de lectura.
- Recibe **notificaciones de invitación** si un admin/moderador lo agrega al equipo.
- **No puede:** abrir `/app/users/team` (redirige a acceso denegado), editar perfil corporativo ni exportar en áreas restringidas.

### Registro de cuentas nuevas

También puedes registrarte en `/auth/register`. Tras el primer acceso, el **asistente de onboarding** define si tu cuenta es Hogar Inteligente o Pequeño Negocio. Las cuentas nuevas reciben rol **User** por defecto.

---

## Novedades recientes del proyecto

| Área | Mejora |
| --- | --- |
| **IAM y roles** | Permisos por rol (Admin / Moderator / User), pantalla de acceso denegado y guards en rutas sensibles |
| **Segmentos** | Conmutador Hogar ↔ Negocio solo para Admin; usuarios normales quedan en su segmento |
| **Flujos de actividad** | Registro por usuario; Admin ve actividad global; usuarios solo la propia |
| **Automatización (negocio)** | Línea de tiempo de reglas sincronizada al crear/editar; horario en modal de nueva regla; protocolo de cierre editable |
| **Automatización (hogar)** | Apagado por inactividad configurable; escenas y eventos programados mejorados |
| **Gestión de equipo** | Invitar desde usuarios registrados; notificación in-app según rol asignado (administrator / manager / viewer) |
| **Gateway IoT** | Configuración de gateway y nodos en `/app/devices/gateway` |
| **Dashboard hogar** | PICO interactivo, sidebar de seguridad dinámico, próximos eventos y consumo total |
| **Pequeño negocio** | KPIs con iconos Material, selector de periodo en pills, tarjetas enriquecidas en alertas e integraciones |
| **Energía e historial** | Inteligencia energética, optimización automática, sugerencias de ahorro y anomalías de consumo |
| **UI / i18n** | Español e inglés; tema claro/oscuro; Angular Material 21 con layouts custom |

---

## Características por segmento

### Hogar Inteligente

| Módulo | Funcionalidad |
| --- | --- |
| Dashboard | Resumen del hogar, PICO, encendido masivo, clima y consumo |
| Seguridad | Cámaras, cerraduras, usuarios autorizados, registro de accesos |
| Dispositivos | Panel por habitaciones, detalle, gateway IoT |
| Automatización | Escenas, eventos programados, apagado por inactividad, constructor de reglas |
| Historial | Notificaciones, flujos de actividad, inteligencia energética |
| Configuración | Idioma, tema, notificaciones, usuarios autorizados |

### Pequeño Negocio

| Módulo | Funcionalidad |
| --- | --- |
| Hub operativo | KPIs, mapa de instalación, sostenibilidad, selector de periodo |
| Dispositivos | Gestión empresarial, explorador, gateway, mantenimiento |
| Reportes | Comparativos, análisis de costos, historial de alertas |
| Integraciones | Servicios conectados, sincronización, identidad corporativa y API |
| Automatización | Timeline de reglas, protocolo de cierre, horarios por grupo |
| Usuarios | Gestión de equipo, invitaciones, perfil de negocio (Admin) |
| Configuración | Ajustes compartidos con controles según rol |

---

## Conexión con el backend

La app usa un modelo **híbrido**: intenta la API primero y, si falla, usa mock estático + caché en el navegador.

| Entorno | URL API |
| --- | --- |
| Desarrollo (por defecto) | `https://domoticore-api.onrender.com/api/v1` |
| Backend local | `http://localhost:8080/api/v1` |
| Solo mock (sin backend) | `apiUrl: ''` en `src/environments/environment.ts` |

```typescript
// src/environments/environment.ts
apiUrl: 'https://domoticore-api.onrender.com/api/v1',
```

- Login y registro pueden ir al **Spring Boot** en Render (token JWT en peticiones).
- Flujos de actividad, equipo e invitaciones combinan API + **caché compartida** en `localStorage` para demos fluidas.
- Si cambias de modo mock a API real, **cierra sesión** o limpia `localStorage` para evitar sesiones incompatibles.

Los datos de prueba viven en `data/db.json` y se exportan a `public/mock-data/` con:

```bash
npm run export-mock-data
```

---

## Arquitectura

El proyecto sigue **Bounded Contexts** con capas `domain`, `application`, `infrastructure` y `presentation`:

```
src/
├── iam/                    # Autenticación, onboarding, roles y shells
├── dashboard/              # Panel principal (Hogar)
├── security/               # Seguridad y accesos
├── device-control/         # Dispositivos (hogar y negocio)
├── gateway-management/     # Gateway y nodos IoT
├── automation/             # Reglas, zonas y builder
├── history/                # Notificaciones, actividad, energía y reportes
├── smart-integrations/     # Integraciones y perfil API (negocio)
├── sme-operations-hub/     # Hub operativo (negocio)
├── team-management/        # Equipo, invitaciones y perfil empresarial
├── settings/               # Configuración global
└── shared/                 # Servicios, componentes, Material, utilidades
```

| Contexto | Responsabilidad |
| --- | --- |
| IAM | Login, registro, onboarding, permisos y protección de rutas |
| Dashboard | Resumen y estadísticas del hogar |
| Security | Cámaras, cerraduras, usuarios autorizados |
| Device Control | Control y exploración de dispositivos |
| Gateway Management | Vinculación de gateway y registro de nodos |
| Automation | Centro de automatización, zonas y builder |
| History | Notificaciones, actividad, energía y reportes |
| Smart Integrations | Integraciones, servicios y API corporativa |
| SME Operations Hub | Panel operativo para pequeños negocios |
| Team Management | Equipo, invitaciones y perfil de negocio |
| Settings | Preferencias, idioma y tema |

---

## Tecnologías

| Tecnología | Uso |
| --- | --- |
| Angular 21 | Standalone components, signals, lazy loading |
| TypeScript 5.9 | Dominio, stores e infraestructura tipados |
| Angular Material 21 | Formularios, tablas, snackbar, sidenav, chips |
| Material Design 3 | Tema `#3455d1`, modo claro/oscuro |
| @ngx-translate | Internacionalización (es / en) |
| RxJS 7 | Flujos asíncronos en servicios y stores |
| Vitest | Pruebas unitarias |

---

## Scripts disponibles

| Script | Descripción |
| --- | --- |
| `npm start` | Servidor de desarrollo (`ng serve`) |
| `npm run build` | Build de producción |
| `npm run build:vercel` | Env + mock data + build para Vercel |
| `npm run export-mock-data` | Exporta `data/db.json` → `public/mock-data/` |
| `npm test` | Pruebas con Vitest |
| `npm run watch` | Build en modo watch |

### Prerrequisitos

- Node.js 18+
- npm 10+ (el proyecto fija `npm@10.9.3`)

---

## Rutas principales

### Autenticación

| Ruta | Descripción |
| --- | --- |
| `/auth/login` | Inicio de sesión |
| `/auth/register` | Registro |
| `/auth/onboarding` | Elección de segmento (post-login) |

### Hogar Inteligente (`/app/...`)

| Ruta | Descripción |
| --- | --- |
| `/app/dashboard` | Panel principal |
| `/app/security` | Seguridad y accesos |
| `/app/devices` | Dispositivos por habitación |
| `/app/devices/gateway` | Configuración de gateway IoT |
| `/app/devices/:roomId/:deviceId` | Detalle de dispositivo |
| `/app/automation/center` | Centro de automatización |
| `/app/automation/zones` | Configuración de zonas |
| `/app/automation/builder` | Constructor de reglas |
| `/app/history/notifications` | Centro de notificaciones |
| `/app/history/activity` | Flujos de actividad |
| `/app/history/energy` | Inteligencia energética |
| `/app/settings` | Configuración |
| `/app/access-denied` | Acceso denegado (rol o segmento) |

### Pequeño Negocio (`/app/...`)

| Ruta | Descripción |
| --- | --- |
| `/app/operations-hub` | Hub operativo |
| `/app/devices/management` | Gestión de dispositivos |
| `/app/devices/explorer` | Explorador de dispositivos |
| `/app/devices/gateway` | Gateway IoT |
| `/app/reports/comparative` | Reportes comparativos |
| `/app/reports/cost-analysis` | Análisis de costos |
| `/app/reports/alerts-history` | Historial de alertas |
| `/app/smart-integrations/integrations` | Integraciones |
| `/app/smart-integrations/connected-services` | Servicios conectados |
| `/app/smart-integrations/sync-status` | Estado de sincronización |
| `/app/smart-integrations/business-profile-api-settings` | Perfil y API |
| `/app/automation/center` | Centro de automatización |
| `/app/automation/zones` | Configuración de zonas |
| `/app/users/team` | Gestión de equipo *(Admin / Moderator)* |
| `/app/users/business-profile` | Perfil de negocio *(solo Admin)* |
| `/app/settings` | Configuración |

Tras el login, la app redirige a `/app/dashboard` (hogar) o `/app/operations-hub` (negocio) según el tipo de cuenta.

---

## Despliegue en Vercel

1. Importa el repositorio en [Vercel](https://vercel.com).
2. **Root Directory:** raíz del repo (`Veltrix-DomotiCore-Front-End`).
3. **Build Command:** `npm run build:vercel`
4. **Output Directory:** `dist/domoticore/browser`

Variable de entorno opcional:

```
NG_APP_API_URL=https://domoticore-api.onrender.com/api/v1
```

---

## Internacionalización

Traducciones en `src/assets/i18n/es.json` y `en.json`. Idioma por defecto: **español**. Cambio manual desde Configuración o detección del navegador.

---

## Convenciones de código

- Componentes standalone con imports explícitos (`MATERIAL_IMPORTS` donde aplique).
- Stores en `application/`; servicios API en `infrastructure/`.
- Lazy loading de rutas y bounded contexts.
- En tarjetas con layout custom, preferir `matRipple` sobre `mat-stroked-button`.
- Formularios con `mat-form-field appearance="outline"`.

---

## Contribución

1. `git checkout -b feature/nueva-funcionalidad`
2. Realiza cambios y commits
3. `git push origin feature/nueva-funcionalidad`
4. Abre un Pull Request

---

## Recursos

- [Angular CLI](https://angular.dev/tools/cli)
- [Angular Material](https://material.angular.dev/)
- [Material Design 3](https://m3.material.io/)

> La landing page pública puede vivir en un repositorio separado. Este repo contiene la **aplicación autenticada** (panel DomotiCore).
