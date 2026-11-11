# Deploying the backend: GitHub → Render + Neon

The API runs as a **Render Web Service on the native Node runtime** (no Docker). The database is **Neon PostgreSQL** with the `pgvector` extension. The frontend will live on Vercel and calls this API through CORS.

Each start runs the database migrations first (`npm run start:prod`). Nothing is ever seeded automatically: you run the seed scripts once yourself, from your laptop (step 5).

## 1. Push the code to a new GitHub repository

The local repository's `origin` still points to the old ERP repository, so add the new one under its own name.

1. On GitHub, create a new **empty private** repository: no README, .gitignore or licence. For example `school-platform-backend`.
2. In this folder:
   ```bash
   git status                      # must be clean; .env is ignored and never pushed
   git remote add platform https://github.com/<you>/school-platform-backend.git
   git push -u platform refactor/phase-1-school-platform:main
   ```
   This pushes the current branch as `main` of the new repository. To make the new repository the default remote, run `git remote rename origin erp`, then `git remote rename platform origin`.
3. On GitHub, check that `.env` is **not** in the repository and that `content/`, `src/`, `package-lock.json` and `.nvmrc` are.

## 2. Create the Neon database

1. At <https://console.neon.tech>, create a project:
   - Postgres 17;
   - region close to the Render region you will pick, for example AWS Frankfurt (`eu-central-1`) with Render Frankfurt;
   - database name, for example `school_platform`.
2. Turn on pgvector. Open **SQL Editor** and run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
   The first migration runs this too, but running it here confirms that the extension is available.
3. Open **Connect**, turn **Connection pooling off** (the direct connection) and copy the connection string. It looks like `postgresql://<user>:<password>@<endpoint>.<region>.aws.neon.tech/school_platform?sslmode=require`. This is `DATABASE_URL`. Keep it secret.

## 3. Create the Render Web Service

1. At <https://dashboard.render.com>, choose **New → Web Service** and connect the GitHub repository from step 1, branch `main`.
2. Settings:

   | Setting | Value |
   |---|---|
   | Language / Runtime | **Node** |
   | Root Directory | empty (the repository root is this backend) |
   | Build Command | `npm ci --include=dev && npm run build` |
   | Start Command | `npm run start:prod` |
   | Region | the same as Neon (e.g. Frankfurt) |
   | Health Check Path | `/api/health` (Advanced settings) |
   | Auto-Deploy | On commit (default) |

   - **Node version:** `.nvmrc` says `24`, and `package.json` `engines` says `24.x`. Render picks it up from these, and the build log shows which version it used.
   - **Why `--include=dev`:** the build needs the Nest CLI and TypeScript, which are dev dependencies. If you set `NODE_ENV=production`, a plain `npm ci` would skip them and the build would fail.
   - **ffmpeg:** comes from the `ffmpeg-static` package. Its install step downloads a Linux ffmpeg binary during `npm ci`. Render's native runtime has no system ffmpeg, so if that download ever fails, voice answers fail with a 400 "recording could not be read"; then set `FFMPEG_PATH` to an ffmpeg binary.
3. Add the environment variables below under **Environment**, then deploy.

### Environment variables (names only)

Legend:
- **Required:** without it the service fails or a core feature breaks.
- **New for prod:** generate a fresh value for production. Never reuse the local one.
- **Render:** set it on Render, or only on your laptop for the one-time seed scripts.

| Variable | Required | New for prod | Render | Value / note |
|---|---|---|---|---|
| `NODE_ENV` | yes | – | yes | `production` |
| `DATABASE_URL` | yes | **yes** | yes | Neon direct connection string with `sslmode=require` (step 2); secret |
| `CORS_ORIGINS` | yes | – | yes | the Vercel URL(s), comma-separated (step 6) |
| `JWT_ACCESS_SECRET` | yes | **yes** | yes | long random string, different from the refresh secret |
| `JWT_REFRESH_SECRET` | yes | **yes** | yes | long random string |
| `JWT_ACCESS_TTL` | yes | – | yes | e.g. `15m` (no default; login fails without it) |
| `JWT_REFRESH_TTL` | yes | – | yes | e.g. `7d` (no default) |
| `AI_API_KEY` | yes | recommended | yes | Anthropic key (chat, judging, question generation); a separate production key makes its cost easy to see |
| `AI_EMBEDDING_API_KEY` | yes | recommended | yes | Voyage key |
| `STT_API_KEY` | yes | recommended | yes | OpenAI key (speech-to-text) |
| `SWAGGER_USER` | yes | **yes** | yes | Swagger login; without both Swagger variables `/api/docs` is off in production |
| `SWAGGER_PASSWORD` | yes | **yes** | yes | Swagger password |
| `DEMO_MODE` | for the demo | – | yes | `true` enables `POST /api/demo/finish-lesson/:id` and `demo:reset`; default `false` |
| `AI_MODEL` | optional | – | yes | default `claude-haiku-5-5`; local development used `claude-sonnet-5-5` |
| `AI_PROVIDER` | optional | – | yes | default `anthropic` |
| `AI_EMBEDDING_MODEL` | optional | – | yes | default `voyage-4` |
| `AI_TIMEOUT_MS` | optional | – | yes | default `60000` |
| `STT_PROVIDER` | optional | – | yes | default `openai` |
| `STT_MODEL` | optional | – | yes | default `gpt-transcribe` |
| `STT_TIMEOUT_MS` | optional | – | yes | default `60000` |
| `TTS_VOICE` | optional | – | yes | default `uz-UZ-SardorNeural` |
| `FFMPEG_PATH` | optional | – | yes | default: the `ffmpeg-static` binary |
| `APP_TIMEZONE` | optional | – | yes | default `Asia/Tashkent` |
| `QUIZ_DEADLINE_TIME` | optional | – | yes | default `22:00` |
| `UPLOADS_DIR` | optional | – | yes | default `./uploads` (see "What is lost on restart") |
| `LOG_TO_FILE` | optional | – | yes | default `false` when `NODE_ENV=production` |
| `PORT` | – | – | **no** | Render sets it |
| `PG_SSL` | optional | – | yes | only for the `PG_*` style; a Neon URL with `sslmode=require` needs nothing |
| `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DB` | optional | – | no | alternative to `DATABASE_URL`, which wins when set |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` | optional | – | no | nothing sends mail yet |
| `SEED_ADMIN_PHONE` | for `seed:admin` | your choice | **no** | the first super admin's phone (laptop only) |
| `SEED_ADMIN_PASSWORD` | for `seed:admin` | **yes** | **no** | at least 8 characters (laptop only) |
| `SEED_ADMIN_FIRST_NAME`, `SEED_ADMIN_LAST_NAME` | optional | – | **no** | laptop only |
| `SEED_DEMO_PASSWORD` | for `seed:mvp` | **yes** | **no** | password of all demo users in production (laptop only) |

Generate a secret with `openssl rand -hex 32` (or `-base64 24` for a password). Keep production values in a password manager, never in a file inside this repository.

### Check the deploy

1. The deploy log should show `migration:run` (the first deploy runs all 9 migrations), then `Nest application successfully started`.
2. Check the health endpoint:
   ```bash
   curl https://<service>.onrender.com/api/health
   # {"status":"ok","database":true,"vector":true}
   ```
   503 means the database is unreachable (`database: false`) or pgvector is missing (`vector: false`).

## 4. Swagger credentials

Set `SWAGGER_USER` and `SWAGGER_PASSWORD` on Render. The docs are then at `https://<service>.onrender.com/api/docs` behind a browser login prompt. With `NODE_ENV=production` and either variable missing, `/api/docs` is switched off; the log says so at startup. `docs/openapi.json` in the repository is the same document and can go to the frontend team directly.

## 5. Load content and demo data once (from your laptop)

The scripts read `DATABASE_URL` first, so prefixing it points them at Neon. Everything else, such as the AI keys, still comes from your local `.env`. **Double-check the URL before running:** these scripts write to whatever database it names.

Do this after the first successful deploy, because the deploy ran the migrations. Alternatively, run `npm run migration:run` the same way first.

```bash
export DATABASE_URL='postgresql://...neon.tech/school_platform?sslmode=require'

# 1. The first super admin. Set SEED_ADMIN_PHONE / SEED_ADMIN_PASSWORD in .env first; use a new strong password.
npm run seed:admin

# 2. The Grade 7 algebra textbook: topics, chunks, embeddings (Voyage) and topic summaries (Claude).
#    Safe to run again; it only writes changes.
npm run content:load

# 3. The demo school, class, timetable and users, plus AI-generated questions.
#    About $0.80 of Claude calls on claude-sonnet-5-5 for the 6 topics.
#    DEMO_MODE=true approves the generated questions.
#    Use a new SEED_DEMO_PASSWORD, not your local one.
DEMO_MODE=true SEED_DEMO_PASSWORD='<new demo password>' npm run seed:mvp

unset DATABASE_URL
```

Run each step once. Running them again is safe: they update and don't duplicate. Seeding never runs automatically, not even on deploy.

### Re-running the demo (e.g. before recording a video)

```bash
DEMO_MODE=true npm run demo:reset                        # local database
DATABASE_URL='postgresql://...neon.tech/...' DEMO_MODE=true npm run demo:reset   # production
```

This resets the demo student (`+998901001001`, or pass another phone after `--`):
- **deleted:** their attempts, the practice quizzes they created, checkpoint tries, mastery, chat sessions and the `needs_help` notifications about them;
- **reopened:** this week's lessons of their class, with quiz deadlines back to `QUIZ_DEADLINE_TIME`;
- **kept:** generated questions, confirmation questions and the textbook.

It refuses to run unless `DEMO_MODE=true`, and prints only the database name.

## 6. CORS for the Vercel frontend

Set `CORS_ORIGINS` on Render to the exact frontend origin(s), comma-separated, with no path and no trailing slash:

```
CORS_ORIGINS=https://school-platform.vercel.app,https://www.your-domain.uz
```

- **Vercel preview URLs:** each preview deployment has its own URL (`https://<project>-<hash>-<team>.vercel.app`). Add the ones you need, or test previews against a local backend.
- **Applying a change:** changing an environment variable makes Render redeploy, which takes about a minute.
- **When unset:** every origin is allowed and a warning is logged at startup. Fine locally, never in production.

## What is lost on restart (no persistent disk)

A Render web service without a disk (the free tier has none) starts every deploy and restart with a clean filesystem:

| Data | On restart |
|---|---|
| Uploaded files (`/uploads`: media files, avatars) | **lost**. The database rows still point to them, so they become broken links |
| Sardor's voice cache (`/uploads/tts`) | rebuilt automatically on the next request, taking about 2 s per line |
| Student recordings | never stored: deleted right after transcription |
| `logs/*.log` | not written in production; Render keeps the stdout logs |
| Rate-limit counters | reset (they are in memory and per instance) |

To keep uploads, add a Render Disk (paid instance) mounted at, for example, `/var/data`, and set `UPLOADS_DIR=/var/data/uploads`. Or move uploads to object storage later. Keep **one instance**: the rate limits and the voice cache are per instance.

## Free-tier notes

- **Render free:** the service sleeps after about 15 minutes without requests. The first request after that takes about a minute while it boots and runs the (empty) migrations. Open `/api/health` before a demo to wake it.
- **Neon free:** the database also suspends when idle and wakes on the first query, in about a second.
