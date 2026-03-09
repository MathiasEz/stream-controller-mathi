# Stream Controller Mathi

Plataforma para control remoto autorizado de streams (OBS) con permisos granulares, sesiones auditables y botón de emergencia.

## Estado actual
Se implementó una base de backend con NestJS + Prisma + PostgreSQL que cubre:
- Autenticación (registro/login/refresh).
- Permisos streamer -> operador.
- Ciclo de sesiones remotas.
- Encolado lógico de comandos.
- Heartbeats/resultados del agente.
- Auditoría y eventos de tiempo real base.

## Instalación
```bash
cd backend
npm install
```

## Variables de entorno
Crear `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stream_controller
JWT_ACCESS_SECRET=replace_access_secret
JWT_REFRESH_SECRET=replace_refresh_secret
PORT=3000
```

## Ejecutar
```bash
cd backend
npx prisma generate
npx prisma db push
npm run start:dev
```

## Documentación
- Arquitectura: `docs/architecture.md`
- API base: `docs/api.md`
- Modelo de amenazas inicial: `docs/threat-model.md`
