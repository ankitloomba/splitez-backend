# SplitEZ / Splitezy — Backend API

NestJS + PostgreSQL backend for the SplitEZ / Splitezy expense splitting & tracking app.

> **Principle:** the backend is the single source of truth for all financial
> calculations (splits, balances, settlements). Client-side calculations are for
> display only and are always re-validated server-side. Source: Product Project
> Blueprint V0.2.

## Stack

| Layer      | Technology                     |
| ---------- | ------------------------------ |
| Runtime    | Node.js 22                     |
| Framework  | NestJS 10                      |
| Database   | PostgreSQL (via Prisma ORM)    |
| Auth       | JWT access/refresh (OTP login) |
| API docs   | OpenAPI / Swagger              |
| Hosting    | Railway (Docker)               |

## Repository roles

| Repo                  | Responsibility                                             |
| --------------------- | --------------------------------------------------------- |
| `splitez-backend`     | This repo — REST API, business/financial engine, DB       |
| `splitez-apis`        | OpenAPI/Swagger contract + shared types                   |
| `splitez-webservices` | Integration workers (OTP, FCM push, storage, ads/webhook) |
| `splitezapp-ios`      | Native iOS app (Swift/SwiftUI)                             |
| `splitez-android`     | Native Android app (Kotlin/Jetpack Compose)               |

## Local development

```bash
npm install
cp .env.example .env          # then edit DATABASE_URL etc.
npx prisma migrate dev        # create/apply local migrations
npm run start:dev             # http://localhost:3000/api/v1
```

- Health check: `GET /api/v1/health`
- Swagger UI: `GET /api/v1/docs`

## Money handling

All monetary amounts are stored and computed in **integer minor units**
(paise/cents) to avoid floating-point rounding errors. Each expense's split
shares are guaranteed to sum exactly to the expense total.

## Deploy (Railway)

The service builds from the `Dockerfile`. Railway injects `DATABASE_URL` from an
attached PostgreSQL plugin. On boot the container runs `prisma migrate deploy`
then starts the API. Set the JWT secrets and OTP config as Railway variables.

## Data model

See `prisma/schema.prisma` — models the full V1 entity set from Blueprint §30.

