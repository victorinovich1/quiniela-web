# Quiniela Mundial 2026

Web privada para que un grupo de amigos pronostiquen los partidos del Mundial 2026 y compitan en un ranking.

## Capacidades

- Login email + contraseña, registro con código de invitación.
- Cada usuario crea N "jugadas" (entries) con alias distintos. Cada jugada compite por separado y paga su cuota.
- Pronósticos: 72 partidos de fase de grupos, 32 partidos de eliminatorias (32avos → Final), predicciones especiales (campeón, goleador, MVP, etc.).
- Tabla de posiciones por grupo calculada en vivo conforme metes marcadores.
- Ranking automático con sistema de puntos configurable.
- Bloqueo automático al iniciar el primer partido del torneo.
- Panel admin para gestionar equipos, partidos, invitaciones y participantes.
- Diseño dark estilo FIFA, responsivo, banderas reales (flagcdn.com).
- Multi-zona horaria: cada usuario ve los partidos en su hora local automáticamente.

## Stack

- **Frontend:** Next.js 14 App Router, TypeScript, Tailwind CSS
- **Backend / DB:** Supabase (Postgres 17 + Auth + RLS)
- **Hospedaje:** Vercel (plan free)
- **Emails:** Resend (SMTP custom para Supabase Auth)
- **Banderas:** flagcdn.com (CDN público de banderas)

## Estructura del proyecto

```
quiniela-web/
├── CLAUDE.md                      ← Reglas para agentes IA
├── README.md                      ← Este archivo
├── docs/                          ← Documentación técnica
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── DEPLOYMENT.md
│   ├── STYLE_GUIDE.md
│   └── KNOWN_ISSUES.md
├── migrations/                    ← Migraciones SQL aplicadas (orden numérico)
│   ├── 001_core_schema.sql
│   ├── 002_rls_policies.sql
│   └── ...
├── app/                           ← Páginas Next.js (App Router)
│   ├── layout.tsx                 ← Layout root con Navbar + BottomNav
│   ├── globals.css                ← Theme dark + componentes Tailwind
│   ├── page.tsx                   ← Landing
│   ├── login/, signup/, forgot-password/, reset-password/
│   ├── auth/callback/, auth/finish/
│   ├── predictions/               ← Pronósticos (server + client)
│   ├── leaderboard/
│   ├── entries/                   ← Mis jugadas
│   └── admin/                     ← Panel admin (server + client)
├── components/
│   ├── Navbar.tsx
│   ├── BottomNav.tsx              ← Solo móvil
│   └── Flag.tsx                   ← Bandera + TeamPill
├── lib/
│   ├── types.ts                   ← Types TS de toda la BD
│   ├── standings.ts               ← Cálculo de posiciones por grupo
│   └── supabase/
│       ├── client.ts              ← Browser client
│       ├── server.ts              ← Server client (SSR)
│       └── middleware.ts          ← Session refresh
├── middleware.ts                  ← Auth guard (predictions, admin, etc.)
├── package.json
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## Quickstart para devs

1. Clonar el proyecto y `cd quiniela-web`
2. `npm install`
3. Crear `.env.local` con:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-aqui
   ```
4. `npm run dev` — abre http://localhost:3000

## Deploy

`npx vercel --prod` desde la carpeta del proyecto. Variables de entorno se configuran en el dashboard de Vercel. Detalle completo: `docs/DEPLOYMENT.md`.

## Para agentes IA

Lee `CLAUDE.md` antes de hacer cualquier cambio. Contiene las convenciones, reglas estrictas y el contexto que necesitas para no romper cosas.
