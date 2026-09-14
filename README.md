# ChatPulse

ChatPulse is a React/NestJS collaboration app with realtime chat, friendships,
posts, comments, profiles, and media uploads.

## Repository layout

```text
ChatPulse/
├── api-chatpulse/        NestJS API, Socket.IO, MongoDB, Cloudinary
├── chatpulse/            React application
└── ARCH_FLOWS.md         End-to-end system and data-flow reference
```

Backend code is organized by domain under `src/modules`. A module owns its
controllers, application services, DTOs, schemas, and public types. Shared auth
guards, decorators, and pagination contracts live under `src/shared`.

Frontend code is organized by feature. Each feature keeps its UI, context,
hooks, and API services together. Cross-feature API models live in `src/types`,
while transport adapters and transformers are kept out of components.

## Local development

1. Copy `api-chatpulse/.env.example` to `api-chatpulse/.env` and fill in the
   required values.
2. Start the backend with `npm run dev` from `api-chatpulse`.
3. Start the frontend with `npm run dev` from `chatpulse`.

The frontend defaults to `http://localhost:3001/api` for REST and
`http://localhost:3001` for Socket.IO. Override them with `VITE_API_URL` and
`VITE_WS_URL` when needed.

Use `GET /api/health` for container and load-balancer health checks.

## Verification

```bash
cd api-chatpulse
npm test -- --runInBand
npm run build

cd ../chatpulse
npm run lint
npm run build
```

## Where to start

- Authentication: `api-chatpulse/src/modules/auth` and
  `chatpulse/src/features/auth`
- Realtime chat: `api-chatpulse/src/modules/chat/chat.gateway.ts`, then
  `chatpulse/src/features/chat/services/socket.service.ts`
- Chat state: `chatpulse/src/features/chat/useChat.ts`; session setup is in
  `useChatSession.ts`
- Friend state: `chatpulse/src/features/friends/useFriends.ts`; pure mapping
  logic is in `friendState.ts`
- API-to-UI conversion: `chatpulse/src/utils/transformers.ts`

See [ARCH_FLOWS.md](./ARCH_FLOWS.md) for request sequences, socket events,
authorization rules, and current product limitations.
