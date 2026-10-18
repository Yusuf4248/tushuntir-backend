# School Platform

School learning platform API (NestJS, TypeORM, PostgreSQL).

## Run locally

```bash
npm install
npm run start:dev   # API on http://localhost:${PORT:-3030}/api, Swagger at /api/docs
npm run build       # compile to dist/
```

Database connection is read from `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD` and `PG_DB` in `.env`.
