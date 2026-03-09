# API Guide (Backend Base)

Base URL: `/api/v1`

## Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`

## Permissions
- `POST /permissions/grant` (STREAMER/ADMIN)
- `DELETE /permissions/:operatorId` (STREAMER/ADMIN)

## Sessions
- `POST /sessions/request` (OPERATOR/ADMIN)
- `PATCH /sessions/:sessionId/approve` (STREAMER/ADMIN)
- `PATCH /sessions/:sessionId/reject` (STREAMER/ADMIN)
- `PATCH /sessions/:sessionId/close` (OPERATOR/ADMIN)
- `PATCH /sessions/:sessionId/emergency-stop` (STREAMER/ADMIN)

## Commands
- `POST /commands` (OPERATOR/ADMIN)

## Agent
- `POST /agent/heartbeat`
- `POST /agent/command-result`

All protected endpoints require `Authorization: Bearer <access-token>`.
