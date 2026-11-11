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

**Required in production**

| Variable | Value / note |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Neon connection string (step 2) |
| `CORS_ORIGINS` | the Vercel URL(s), see step 6 |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | two different long random strings (e.g. `openssl rand -hex 32`) |
| `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL` | e.g. `15m` and `7d`; there is no default, and login fails without them |
| `AI_API_KEY` | Anthropic key (chat, judging, question generation) |
| `AI_EMBEDDING_API_KEY` | Voyage key (embeddings) |
| `STT_API_KEY` | OpenAI key (speech-to-text) |
| `SWAGGER_USER`, `SWAGGER_PASSWORD` | Swagger UI login; without both the docs are switched off in production |

**Usually set**

| Variable | Default when unset |
|---|---|
| `AI_MODEL` | `claude-haiku-5-5` (local development used `claude-sonnet-5-5`) |
| `DEMO_MODE` | `false`. Set `true` for the demo: it enables `POST /api/demo/finish-lesson/:id` |
| `APP_TIMEZONE` | `Asia/Tashkent` |
| `QUIZ_DEADLINE_TIME` | `22:00` |
| `STT_PROVIDER` / `STT_MODEL` | `openai` / `gpt-transcribe` |

**Optional**

| Variable | Default when unset |
|---|---|
| `PORT` | set by Render; do not set it yourself |
| `AI_PROVIDER`, `AI_EMBEDDING_MODEL`, `AI_TIMEOUT_MS` | `anthropic`, `voyage-4`, `60000` |
| `STT_TIMEOUT_MS`, `TTS_VOICE` | `60000`, `uz-UZ-SardorNeural` |
| `FFMPEG_PATH` | the `ffmpeg-static` binary |
| `UPLOADS_DIR` | `./uploads` (see "What is lost on restart") |
| `LOG_TO_FILE` | `false` when `NODE_ENV=production`; Render shows the logs from stdout |
| `PG_SSL` | only for the `PG_*` style; not needed with a Neon URL that has `sslmode=require` |
| `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DB` | alternative to `DATABASE_URL`; ignored when it is set |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` | mail settings; nothing sends mail yet, so they can stay empty |

**Never on Render (laptop only, for the seed scripts):** `SEED_ADMIN_PHONE`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_FIRST_NAME`, `SEED_ADMIN_LAST_NAME`, `SEED_DEMO_PASSWORD`.

### Check the deploy

1. The deploy log should show `migration:run` (the first deploy runs all 8 migrations), then `Nest application successfully started`.
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
