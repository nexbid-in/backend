# Nexbid Backend

A TypeScript-based backend service for the Nexbid platform. The project follows a layered architecture with domain, application, infrastructure, and interface modules, and is built around Express, Prisma, PostgreSQL, and Redis.

## Overview

This backend provides the user authentication and registration flow for the application, including:

- Start registration
- OTP verification
- Resend OTP
- Complete registration

It is structured for maintainability using a clean architecture approach and includes validation, logging, database access, and error handling middleware.

## Tech Stack

- TypeScript
- Node.js
- Express
- Prisma ORM
- PostgreSQL
- Redis
- Zod validation
- bcrypt
- JWT
- Nodemailer
- Pino logging

## Project Structure

```text
.
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── application/
│   │   ├── dto/
│   │   ├── interface/
│   │   ├── mapper/
│   │   └── use-cases/
│   │       └── user/
│   │           └── auth/
│   ├── domain/
│   │   ├── entities/
│   │   ├── errors/
│   │   ├── repositories/
│   │   └── value-objects/
│   ├── infrastructure/
│   │   ├── config/
│   │   ├── database/
│   │   ├── logging/
│   │   ├── middlewares/
│   │   ├── redis/
│   │   ├── repositories/
│   │   ├── services/
│   │   └── generated/
│   ├── interfaces/
│   │   └── http/
│   │       ├── constants/
│   │       ├── controllers/
│   │       ├── middlewares/
│   │       ├── routes/
│   │       └── app.ts
│   ├── shared/
│   ├── index.ts
│   └── ...
├── .gitignore
├── eslint.config.mjs
├── package.json
├── prisma.config.ts
├── tsconfig.json
└── package-lock.json
```

## API Endpoints

The application exposes the following authentication endpoints under the `/api` prefix:

- `POST /api/auth/register/start`
- `POST /api/auth/register/verify-otp`
- `POST /api/auth/register/resend-otp`
- `POST /api/auth/register/complete`

These endpoints are registered in the HTTP routes layer and validated using request schemas.

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis

### Installation

```bash
npm install
```

### Environment Configuration

Create a `.env` file in the project root and configure the required environment variables for:

- PostgreSQL connection
- Redis connection
- JWT secret or related auth config
- Mail/OTP service settings if used

### Database Setup

```bash
npx prisma generate
npx prisma migrate dev
```

### Run in Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

### Start Production Server

```bash
npm run start
```

## Available Scripts

```json
{
  "dev": "ts-node-dev src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "lint": "eslint .",
  "lint:fix": "eslint . --fix"
}
```

## Notes

- The project currently includes user registration and authentication flows.
- There is no dedicated automated test suite configured in the current `package.json`.
- The application starts by connecting to Prisma and Redis before listening on the configured port.

## License

This project is licensed under the ISC License.
