<div align="center">

<img src="docs/media/hero.svg" alt="Editorial Commission Desk — an illustrator's portfolio and commission portal" width="100%">

<p>
  <a href="https://editorial-commission-desk.vercel.app"><img alt="Live" src="https://img.shields.io/badge/live-open%20the%20desk-d9483b?style=for-the-badge&labelColor=0e0d0c"></a>
  <img alt="tRPC" src="https://img.shields.io/badge/tRPC-Hono-2f6fb3?style=for-the-badge&labelColor=0e0d0c">
  <img alt="Drizzle" src="https://img.shields.io/badge/Drizzle-MySQL-e8b04a?style=for-the-badge&labelColor=0e0d0c">
  <img alt="React" src="https://img.shields.io/badge/React-shadcn%2Fui-d9483b?style=for-the-badge&labelColor=0e0d0c">
</p>

<p><em>A portfolio for an editorial illustrator with a built-in commission portal:<br>
clients submit a brief, follow its progress and receive the final files with rights documentation.</em></p>

</div>

<img src="docs/media/divider.svg" width="100%" alt="">

## What it is

The public side shows selected work (editorial illustration, geometric portraiture, identity systems) and explains the process in three steps: submit a brief, refine through sketch rounds and colour studies, receive the final files. Behind a sign-in, clients and the studio share one dashboard for every commission.

| | |
|---|---|
| **Brief form** | Project type, deliverables, deadline, budget, usage rights, visual references and a description. |
| **Status tracking** | Submitted → in review → approved → in progress → delivered → completed (or cancelled). |
| **Dashboard** | Clients see their commissions; admins see and move every brief. |
| **File handling** | References and deliveries stored on S3 with presigned URLs. |
| **Auth** | Cookie sessions with signed tokens and user / admin roles. |
| **Type-safe API** | tRPC routers on a Hono server, shared contracts and Drizzle schema. |

```mermaid
flowchart LR
  C[Client] --> B[Brief form · zod]
  B --> T[tRPC · Hono /api]
  T --> DB[(MySQL · Drizzle)]
  T --> S3[(S3 · references + deliveries)]
  DB --> D[Dashboard<br/>client · admin]
  A[Studio] --> D
```

<img src="docs/media/divider.svg" width="100%" alt="">

## Türkçe özet

**Editorial Commission Desk**, bir editoryal illüstratör için hazırlanmış portfolyo ve sipariş portalı. Ziyaretçiler seçili işleri ve üç adımlı çalışma sürecini görüyor; müşteriler proje türü, teslimatlar, tarih, bütçe ve kullanım haklarıyla brif gönderip siparişin durumunu panelden takip ediyor. Hono üzerinde tRPC, Drizzle ile MySQL ve dosyalar için S3 kullanılıyor.

<img src="docs/media/divider.svg" width="100%" alt="">

## Development

```sh
npm install
cp .env.example .env         # database URL, S3 bucket, session secret
npm run dev                  # Vite frontend
npm run build && npm run build:server
npm start
```

```
src/pages/      home (portfolio), login, dashboard
api/            Hono server, tRPC routers (auth, commission), middleware
db/             Drizzle schema, relations, migrations, seed
contracts/      shared types, constants and errors
```

<div align="center">
<br>
<a href="https://github.com/kutluhangil"><img src="docs/media/signature.svg" width="100%" alt="Built by kutluhangil"></a>
<sub>Good work starts with a good brief.</sub>
</div>
