# Arquitectura técnica — Stream Remote Controller

## 1) Stack tecnológico recomendado
- **Frontend:** Next.js 14 + TypeScript + TanStack Query + Zustand — SSR para panel inicial rápido y estado cliente predecible para control en tiempo real.
- **Backend API:** NestJS + TypeScript — arquitectura modular, DI fuerte y buena base para dominios con reglas de autorización complejas.
- **Tiempo real:** WebSocket Gateway (NestJS) + Redis Pub/Sub — latencia baja para comandos/estados y escalado horizontal entre nodos.
- **Base de datos:** PostgreSQL 15 + Prisma — consistencia transaccional y modelado relacional fuerte para auditoría/permisos.
- **Cache/colas:** Redis + BullMQ — desacople de comandos, reintentos controlados y protección ante picos de carga.
- **Agente local:** Tauri (Rust core + TS UI opcional) + OBS WebSocket v5 — menor superficie de ataque y footprint reducido comparado con Electron.
- **Autenticación/autorización:** JWT access (corto) + refresh rotativo + RBAC + ABAC por acción — equilibrio entre UX, seguridad y granularidad.
- **Infraestructura:** Docker + Kubernetes (EKS/GKE) + NGINX Ingress + Cloudflare — despliegues reproducibles y protección perimetral.
- **Monitoreo/observabilidad:** OpenTelemetry + Prometheus + Grafana + Loki + Sentry — trazabilidad de extremo a extremo y alertado accionable.

## 2) Estructura de carpetas del proyecto
```text
stream-controller/
├─ docs/
│  ├─ architecture.md
│  ├─ api.md
│  └─ threat-model.md
├─ backend/
│  ├─ prisma/
│  │  ├─ schema.prisma
│  │  └─ migrations/
│  ├─ src/
│  │  ├─ app.module.ts
│  │  ├─ main.ts
│  │  ├─ auth/
│  │  ├─ users/
│  │  ├─ permissions/
│  │  ├─ sessions/
│  │  ├─ commands/
│  │  ├─ realtime/
│  │  ├─ agent/
│  │  ├─ audit/
│  │  ├─ stream-state/
│  │  ├─ common/
│  │  └─ prisma/
│  ├─ test/
│  └─ package.json
├─ frontend/
│  ├─ src/
│  │  ├─ app/
│  │  ├─ features/
│  │  ├─ components/
│  │  ├─ lib/
│  │  └─ hooks/
│  └─ package.json
├─ agent/
│  ├─ src-tauri/
│  ├─ src/
│  └─ package.json
├─ infra/
│  ├─ docker/
│  ├─ k8s/
│  └─ terraform/
└─ README.md
```

## 3) Modelo de datos

### Entidades principales
- **User:** identidad del sistema (email, hash, rol global).
- **StreamerProfile:** configuración extendida del streamer (timezone, parámetros de emergencia).
- **OperatorPermission:** matriz de permisos `streamer -> operador` con acciones permitidas, expiración y revocación.
- **RemoteSession:** ciclo de vida operativo (solicitud, aprobación, activa, cierre, corte de emergencia).
- **CommandLog:** bitácora de cada comando con payload, estado y error.
- **AuditEvent:** eventos de seguridad/negocio inmutables (quién hizo qué, cuándo y contexto).
- **StreamStateSnapshot:** snapshots de estado de stream/OBS para dashboard y diagnóstico.
- **AgentConnection:** presencia del agente local (online/offline, heartbeat, versión).
- **RefreshToken:** sesión de autenticación con revocación.

### Relaciones
- `User (streamer) 1—1 StreamerProfile`
- `User (streamer) 1—N OperatorPermission`
- `User (operator) 1—N OperatorPermission`
- `RemoteSession N—1 streamer(User)` y `N—1 operator(User)`
- `RemoteSession 1—N CommandLog`
- `RemoteSession 1—N AuditEvent`
- `StreamerProfile 1—N AgentConnection`
- `StreamerProfile 1—N StreamStateSnapshot`
- `User 1—N RefreshToken`

### Estados críticos de dominio
- **RemoteSessionStatus:** `REQUESTED | ACTIVE | REJECTED | CLOSED | EMERGENCY_STOPPED`
- **CommandStatus:** `QUEUED | EXECUTED | FAILED`
- **AgentStatus:** `ONLINE | OFFLINE`

## 4) Flujo principal de usuario
Registro streamer -> Creación de StreamerProfile -> Instalación y pairing del agente local -> Operador solicita acceso -> Streamer concede permisos granulares -> Operador crea solicitud de sesión -> Streamer aprueba -> Sesión pasa a ACTIVA -> Operador envía comandos -> Backend valida rol + permiso + sesión + agente online -> Agente ejecuta en OBS y responde resultado -> Backend persiste CommandLog/AuditEvent + emite estado en tiempo real -> Streamer puede presionar botón de emergencia -> sesión pasa a EMERGENCY_STOPPED y se bloquean comandos pendientes.

## 5) Decisiones de diseño clave
1. **OBS nunca expuesto a internet:** solo agente local inicia conexión saliente TLS al backend; reduce drásticamente superficie de ataque.
2. **Permisos por acción y por streamer (ABAC):** evita autorizaciones globales peligrosas y permite delegación mínima necesaria.
3. **Comandos asíncronos con cola y ack:** tolera caídas temporales y evita bloquear HTTP/WebSocket en ejecución local.
4. **Auditoría inmutable de alto detalle:** requisito legal/operativo para trazabilidad y postmortem de incidentes.
5. **Emergency stop en backend y agente:** doble enforcement para cortar acceso incluso si un canal falla.

## 6) Riesgos técnicos y mitigación
- **Riesgo: secuestro de sesión por refresh token robado.** Mitigación: rotación por uso, revocación server-side, expiración corta de access token y huella de dispositivo.
- **Riesgo: latencia alta en eventos pico.** Mitigación: Redis Pub/Sub, colas BullMQ, partición por streamer y rate limits por operador.
- **Riesgo: comandos fuera de orden.** Mitigación: secuenciador por sesión + idempotency key + versionado de estado.
- **Riesgo: agente comprometido localmente.** Mitigación: firma/verificación de binarios, mTLS opcional, allowlist de comandos y sandbox de ejecución.
- **Riesgo: inconsistencias de permisos en caliente.** Mitigación: revalidación de permiso en cada comando y cache de corta vida con invalidación por evento.

## 7) MVP recomendado (realista)
- Auth completa: registro/login/refresh, RBAC base.
- Permisos granulares streamer->operador con expiración/revocación.
- Sesión remota: request, approve/reject, active, close, emergency stop.
- Envío de comandos a agente con validaciones + logs persistidos.
- Agente local mínimo: connect, heartbeat, recibir comando, ejecutar en OBS, devolver resultado.
- Dashboard básico: estado de agente/sesión + historial de comandos.
- Auditoría mínima: eventos de login, grant/revoke, approve, command, emergency stop.
