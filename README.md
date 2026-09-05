# URL Shortener

A full-stack URL shortening service built with Express, TypeScript, Prisma, and PostgreSQL. The application accepts a valid destination URL, generates a unique short code, and redirects visitors while recording usage data.

> **Work in progress:** This is an actively developed portfolio project. The API, interface, and deployment configuration may continue to evolve.

## Project Highlights

- Type-safe HTTP server built with Express 5 and TypeScript
- PostgreSQL persistence managed through Prisma migrations
- Server-side URL validation for HTTP and HTTPS destinations
- Unique short-code generation with collision checks
- Click tracking and automatic 30-day link expiration
- Rate limiting for link creation and redirects
- Security headers provided by Helmet
- Browser interface served from the same application origin

## Technology

- **Backend:** Node.js, Express 5, TypeScript
- **Database:** PostgreSQL, Prisma 7
- **Frontend:** HTML, CSS, and vanilla JavaScript
- **Validation and security:** express-validator, express-rate-limit, Helmet

## Architecture

The application uses a small, focused service structure:

- `src/server.ts` contains the Express server, validation, redirect flow, and persistence logic.
- `public/` contains the browser interface and static assets.
- `prisma/` contains the database schema and migrations.
- `api/` contains deployment-oriented route modules.

The server exposes a JSON endpoint for creating links and a redirect endpoint for resolving short codes. Expired records are removed during startup and periodically while the server is running.

## Getting Started

### Prerequisites

- Node.js
- PostgreSQL

### Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root:

   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/url_shortener"
   ```

3. Apply the database migrations:

   ```bash
   npx prisma migrate dev
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

The application runs at `http://localhost:3000`.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the TypeScript server in watch mode |
| `npm run build` | Compiles the server to `dist/` |
| `npm start` | Starts the compiled server |

## API

### Create a short link

`POST /shorten`

Request body:

```json
{
  "url": "https://example.com"
}
```

Successful responses return the generated short code:

```json
{
  "shortCode": "example-code-1234"
}
```

Invalid URLs return `400 Bad Request`. Link creation is rate limited to help prevent abuse.

### Resolve a short link

`GET /:shortCode`

Redirects to the original destination when the short code exists and has not expired. The request increments the link's click count. Unknown codes return `404 Not Found`, and expired links return `410 Gone`.

## Roadmap

- Add automated unit and integration tests
- Add link history and management features
- Improve observability and structured error responses
- Document production deployment and environment configuration
- Continue refining the frontend experience

## Project Status

The core shortening and redirect flows are implemented. Testing, production hardening, and additional link-management features are planned as the project progresses.
