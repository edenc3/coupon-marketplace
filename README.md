# Coupon Marketplace API

![CI](https://github.com/edenc3/coupon-marketplace/actions/workflows/ci.yml/badge.svg)

A REST API for managing and selling coupon products, with separate admin and reseller interfaces.

## Tech Stack

- **Runtime**: Node.js + Express 5
- **Database**: PostgreSQL via Prisma ORM
- **Containerization**: Docker + Docker Compose

## Getting Started

### With Docker (recommended)

```bash
cp .env.example .env   # edit values as needed
docker-compose up --build
```

The API will be available at `http://localhost:3001`.

### Local Development

```bash
cp .env.example .env   # set DATABASE_URL to your local Postgres instance
npm install
npx prisma migrate deploy
npm run dev
```

### Running Tests

Requires a running PostgreSQL instance with migrations applied.

```bash
npm test
```

## Environment Variables

| Variable        | Description                        |
| --------------- | ---------------------------------- |
| `DATABASE_URL`  | PostgreSQL connection string       |
| `DB_PASSWORD`   | Postgres password (used by Docker) |
| `ADMIN_TOKEN`   | Bearer token for admin routes      |
| `PORT`          | Port the server listens on         |

## API Overview

### Public / Reseller (`/api/v1`)

| Method | Endpoint                               | Auth     | Description              |
| ------ | -------------------------------------- | -------- | ------------------------ |
| GET    | `/api/v1/products`                     | None     | List available products  |
| GET    | `/api/v1/products/:id`                 | None     | Get a single product     |
| POST   | `/api/v1/products/:id/purchase`        | Reseller | Purchase a coupon        |
| POST   | `/api/v1/products/:id/purchase/direct` | None     | Direct customer purchase |

> Reseller purchase supports idempotent retries via the `Idempotency-Key: <unique-key>` request header.

### Admin (`/api/admin`)

All admin routes require `Authorization: Bearer <ADMIN_TOKEN>`.

| Method | Endpoint                  | Description            |
| ------ | ------------------------- | ---------------------- |
| GET    | `/api/admin/products`     | List all products      |
| GET    | `/api/admin/products/:id` | Get a product          |
| POST   | `/api/admin/products`     | Create a product       |
| PATCH  | `/api/admin/products/:id` | Update a product       |
| DELETE | `/api/admin/products/:id` | Delete a product       |
| POST   | `/api/admin/resellers`    | Create a reseller      |

> `POST /api/admin/resellers` returns the plain token **once** in the response — it is never stored. Body: `{ "name": "Acme Corp" }`

## Frontend

Static pages are served from `/public`:

- `/` — Customer storefront
- `/admin.html` — Admin dashboard
