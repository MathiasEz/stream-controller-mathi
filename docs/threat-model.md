# Threat Model (initial)

## Assets críticos
- Control de escenas/overlays/audio en vivo.
- Credenciales y tokens.
- Historial de acciones (auditoría).

## Amenazas prioritarias
1. Robo de token y toma de control remota.
2. Abuso de permisos por operador autorizado.
3. Intercepción o falsificación de comandos entre backend y agente.
4. Borrado/manipulación de logs.

## Controles aplicados en la base
- JWT corto + refresh rotativo y revocable.
- Permisos granulares por acción y validación por comando.
- Sesiones con estado explícito y corte de emergencia.
- `AuditEvent` persistente para trazabilidad.

## Controles recomendados siguientes
- mTLS backend-agente.
- Firma de comandos (HMAC por sesión).
- Encriptación de payload sensible en reposo.
- Alertas en tiempo real ante anomalías (rate, geo, horario).
