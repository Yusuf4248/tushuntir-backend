# Deploying the backend on a VPS (Ubuntu 24.04, no Docker)

The API and PostgreSQL run on the same server. The app runs under pm2 and listens on `127.0.0.1:4004`. Caddy sits in front of it, with automatic HTTPS. The frontend is on Vercel and calls the API through CORS.

**Names used below.** Replace them with your own:

| Name | Meaning |
|---|---|
| `SERVER_IP` | the server's public IP, e.g. `203.0.113.10` |
| `tushuntir` | the Linux user that runs the app |
| `/home/tushuntir/app` | the app directory (the clone) |
| `<you>/<repo>` | the private GitHub repository |
| `API_HOST` | `203-0-113-10.sslip.io` until the domain exists, later `api.<your-domain>.uz` |
| `<your-site>.vercel.app` | the frontend |

Each start runs the database migrations first (`npm run start:prod`). Nothing is ever seeded automatically; you run the seed scripts once yourself (step 11).

---

## 1. A user for the app, and SSH keys only

From your laptop, as root, the first time. Contabo emails the root password.

```bash
ssh root@SERVER_IP
adduser tushuntir                 # choose a password (needed for sudo)
usermod -aG sudo tushuntir
timedatectl set-timezone Asia/Tashkent   # cron times below are in school time
apt update && apt -y upgrade
exit
```

Copy your laptop's SSH key to the new user. If you have no key yet, create one with `ssh-keygen -t ed25519`.

```bash
ssh-copy-id tushuntir@SERVER_IP
ssh tushuntir@SERVER_IP           # must log in without a password prompt
```

Then switch off root login and passwords. **Keep this session open** and test a new login before closing it:

```bash
sudo tee /etc/ssh/sshd_config.d/90-hardening.conf >/dev/null <<'EOF'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
EOF
sudo sshd -t && sudo systemctl reload ssh
# in a second terminal on the laptop: ssh tushuntir@SERVER_IP  (must work)
```

## 2. Firewall: only 22, 80 and 443

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH            # 22
sudo ufw allow 80/tcp             # HTTP (certificate checks, redirect to HTTPS)
sudo ufw allow 443                # HTTPS (tcp, and udp for HTTP/3)
sudo ufw enable
sudo ufw status verbose
```

PostgreSQL (5432) and the app (4004) stay closed. They listen on localhost only anyway.

## 3. PostgreSQL 17 with pgvector (official PostgreSQL apt repository)

```bash
sudo apt install -y postgresql-common
sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh   # adds apt.postgresql.org; press Enter
sudo apt install -y postgresql-17 postgresql-17-pgvector
psql --version                    # psql (PostgreSQL) 17.x
```

Check that it listens on localhost only. That is the default for this package:

```bash
sudo -u postgres psql -c "SHOW listen_addresses;"   # localhost
sudo ss -ltnp | grep 5432                           # 127.0.0.1:5432 (and [::1]:5432), nothing else
```

## 4. Database user, database and the vector extension

Generate a password and keep it in your password manager. Hex needs no escaping in a URL.

```bash
openssl rand -hex 24
```

Create the user (paste the password at the prompt), the database, and the extension. The extension must be created by `postgres`, a superuser; the app user cannot.

```bash
sudo -u postgres createuser --pwprompt tushuntir
sudo -u postgres createdb --owner tushuntir tushuntir
sudo -u postgres psql -d tushuntir -c "CREATE EXTENSION IF NOT EXISTS vector;"
sudo -u postgres psql -d tushuntir -c "\dx vector"          # vector | 0.8.x
psql "postgresql://tushuntir:<password>@127.0.0.1:5432/tushuntir" -c "SELECT 1;"   # the app user can log in
```

## 5. Node.js 24 and pm2

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs git
node -v                           # v24.x
sudo npm install -g pm2
pm2 install pm2-logrotate         # rotates ~/app/logs and pm2's own logs
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

Make pm2 start at boot for this user. `pm2 startup` prints one `sudo env PATH=… pm2 startup systemd -u tushuntir --hp /home/tushuntir` line; run that line.

```bash
pm2 startup systemd -u tushuntir --hp /home/tushuntir
```

## 6. Caddy

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo chmod o+r /usr/share/keyrings/caddy-stable-archive-keyring.gpg /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

It is configured in step 12, once the app is running.

## 7. Folders outside the app

```bash
sudo mkdir -p /var/lib/tushuntir/uploads /var/backups/tushuntir
sudo chown -R tushuntir:tushuntir /var/lib/tushuntir /var/backups/tushuntir
sudo chmod 750 /var/lib/tushuntir /var/backups/tushuntir
```

`/var/lib/tushuntir/uploads` holds everything the app stores:
- uploaded files;
- private homework submissions, in `private/`;
- Sardor's voice cache, in `tts/`.

It is the default with `NODE_ENV=production`, and deploys never touch it.

## 8. Clone with a read-only deploy key

```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -N "" -C "tushuntir@server"
cat ~/.ssh/github_deploy.pub
```

On GitHub, open the repository's **Settings → Deploy keys → Add deploy key**. Paste the key and leave **Allow write access** unchecked. Then:

```bash
cat >> ~/.ssh/config <<'EOF'
Host github.com
  IdentityFile ~/.ssh/github_deploy
  IdentitiesOnly yes
EOF
ssh -T git@github.com             # "Hi <you>/<repo>! You've successfully authenticated…"
git clone git@github.com:<you>/<repo>.git ~/app
cd ~/app && git log --oneline -1
```

## 9. `.env`

Create `~/app/.env` and make it readable only by you:

```bash
cd ~/app && cp .env.example .env && chmod 600 .env && nano .env
```

Legend:
- **Required:** without it the app fails or a core feature breaks.
- **New:** a value made for this server, never the one from your laptop.
- Variables marked *optional* have the default shown.

| Variable | Required | New | Value on the server |
|---|---|---|---|
| `NODE_ENV` | yes | – | `production`. Set it here too, so the scripts use the same defaults as the app |
| `HOST` | yes | – | `127.0.0.1`: only Caddy can reach the app |
| `PORT` | yes | – | `4004` (the port in the Caddyfile) |
| `DATABASE_URL` | yes | **yes** | `postgresql://tushuntir:<password>@127.0.0.1:5432/tushuntir` (no SSL needed on localhost) |
| `CORS_ORIGINS` | yes | – | `https://<your-site>.vercel.app` (comma-separated, no trailing slash) |
| `JWT_ACCESS_SECRET` | yes | **yes** | `openssl rand -hex 32`. Also signs the private file links, so changing it logs everyone out and expires every link |
| `JWT_REFRESH_SECRET` | yes | **yes** | `openssl rand -hex 32`, different from the access secret |
| `JWT_ACCESS_TTL` | yes | – | `15m` |
| `JWT_REFRESH_TTL` | yes | – | `7d` |
| `AI_API_KEY` | yes | recommended | Anthropic key |
| `AI_MODEL` | recommended | – | `claude-sonnet-5-5` (what everything was tested with; default `claude-haiku-5-5`) |
| `AI_EMBEDDING_API_KEY` | yes | recommended | Voyage key |
| `STT_API_KEY` | yes | recommended | OpenAI key (speech-to-text) |
| `SWAGGER_USER`, `SWAGGER_PASSWORD` | yes | **yes** | Swagger login. Without both, `/api/docs` is off in production |
| `DEMO_MODE` | for the demo | – | `true`: enables `finish-lesson`, `demo:reset` and the daily demo-week job |
| `APP_TIMEZONE` | optional | – | `Asia/Tashkent` |
| `QUIZ_DEADLINE_TIME` | optional | – | `22:00` |
| `UPLOADS_DIR` | optional | – | default `/var/lib/tushuntir/uploads` |
| `LOG_TO_FILE` | optional | – | default `false` in production (pm2 writes `~/app/logs`) |
| `AI_PROVIDER`, `AI_EMBEDDING_MODEL`, `AI_TIMEOUT_MS` | optional | – | `anthropic`, `voyage-4`, `60000` |
| `STT_PROVIDER`, `STT_MODEL`, `STT_TIMEOUT_MS` | optional | – | `openai`, `gpt-transcribe`, `60000` |
| `TTS_VOICE` | optional | – | `uz-UZ-SardorNeural` |
| `TTS_VOICE_RU`, `TTS_VOICE_EN` | optional | – | `ru-RU-DmitryNeural`, `en-US-BrianNeural`: Sardor's voice when the app language is Russian or English |
| `FFMPEG_PATH` | optional | – | default: the binary from the `ffmpeg-static` package |
| `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DB`, `PG_SSL` | optional | – | alternative to `DATABASE_URL` (which wins); leave empty |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` | optional | – | nothing sends mail yet |
| `SEED_ADMIN_PHONE` | for `seed:admin` | your choice | the super admin's phone |
| `SEED_ADMIN_PASSWORD` | for `seed:admin` | **yes** | at least 8 characters |
| `SEED_ADMIN_FIRST_NAME`, `SEED_ADMIN_LAST_NAME` | optional | – | |
| `SEED_DEMO_PASSWORD` | for `seed:mvp` | **yes** | password of all demo users |

After step 11 you can delete the two seed passwords from `.env`. They are only read by the seed scripts.

## 10. Build and start

```bash
cd ~/app
npm ci --include=dev              # dev dependencies are needed for the build; ffmpeg-static downloads ffmpeg here
npm run build
mkdir -p logs
pm2 start ecosystem.config.cjs    # runs the migrations (all 11), then the app
pm2 save                          # remembered after a reboot
pm2 logs tushuntir-api --lines 40 # "migrations … executed", "Uploads folder: /var/lib/tushuntir/uploads",
                                  # "Nest application successfully started"
curl -s http://127.0.0.1:4004/api/health   # {"status":"ok","database":true,"vector":true}
```

`ecosystem.config.cjs` runs one process with `NODE_ENV=production`. pm2 restarts it on a crash (backing off) or above 1.5 GB of memory, and gives running requests 20 s to finish on a reload.

## 11. Load content and demo data (once, on the server)

These are the compiled versions; they need no ts-node.

```bash
cd ~/app
npm run seed:admin:prod      # the first super admin (SEED_ADMIN_* in .env); does nothing if it exists
npm run content:load:prod    # the Grade 7 algebra textbook: topics, chunks, embeddings (Voyage),
                             # topic summaries (Claude); safe to run again
npm run seed:mvp:prod        # demo school 21-maktab, class 7-A, 6 weeks of history, homework,
                             # this week's lessons and AI questions (about $0.80 the first time)
```

Run them in this order. Running any of them again is safe: they update and don't duplicate.

With `DEMO_MODE=true`, the app also keeps the demo week filled. Every day at 00:10 Tashkent time, and at every start, it creates the current week's missing lessons and lesson quizzes, with no AI calls. Running `seed:mvp:prod` each week is not needed.

## 12. Caddy and HTTPS (first with an sslip.io name)

Until your domain exists, the API's name is the server IP written with dashes plus `.sslip.io`. For `203.0.113.10` that is `203-0-113-10.sslip.io`. It resolves to the server, and Caddy gets a real certificate for it.

```bash
sudo cp ~/app/deploy/Caddyfile.example /etc/caddy/Caddyfile
sudo sed -i 's/^API_DOMAIN {/203-0-113-10.sslip.io {/' /etc/caddy/Caddyfile   # your IP with dashes
sudo nano /etc/caddy/Caddyfile    # set the email line (or delete it)
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
curl -s https://203-0-113-10.sslip.io/api/health
```

In the frontend (Vercel), set the API base URL to `https://203-0-113-10.sslip.io/api`. `CORS_ORIGINS` in `.env` must list the Vercel origin.

Swagger is at `https://203-0-113-10.sslip.io/api/docs` and asks for `SWAGGER_USER` and `SWAGGER_PASSWORD`.

## 13. Switching to the real domain

1. At your domain registrar, add an **A record** for `api.<your-domain>.uz` pointing to `SERVER_IP`. Wait until `dig +short api.<your-domain>.uz` prints the IP.
2. In `/etc/caddy/Caddyfile`, list both names for the change-over, so old links keep working:
   ```
   api.<your-domain>.uz, 203-0-113-10.sslip.io {
   ```
   Then run `sudo caddy validate --config /etc/caddy/Caddyfile && sudo systemctl reload caddy`. Caddy fetches the new certificate within a minute.
3. Change the frontend's API base URL to `https://api.<your-domain>.uz/api` and redeploy it on Vercel.
4. If the frontend also moves to your domain, add it to `CORS_ORIGINS` and run `pm2 reload tushuntir-api --update-env`.
5. Later, remove the sslip.io name from the Caddyfile and reload Caddy.

## 14. Updating

```bash
~/app/deploy/deploy.sh
```

It runs `git pull --ff-only`, `npm ci`, the build, the migrations, `pm2 reload` and a health check. If install, build or the migrations fail, it restores the previous commit and its build. The running app is never left on a half-built version.

## 15. Logs

| What | Where |
|---|---|
| App (live) | `pm2 logs tushuntir-api` |
| App (files) | `~/app/logs/out.log`, `~/app/logs/error.log` (rotated by pm2-logrotate) |
| App status, memory, restarts | `pm2 status`, `pm2 show tushuntir-api` |
| HTTP access | `/var/log/caddy/tushuntir-api.log` |
| Caddy itself (certificates) | `journalctl -u caddy --since today` |
| PostgreSQL | `/var/log/postgresql/postgresql-17-main.log` |

## 16. Backups

`deploy/backup.sh` writes two files to `/var/backups/tushuntir` and keeps the newest 7 of each:
- **database:** `tushuntir-db-<time>.dump`, a `pg_dump` in custom format, compressed;
- **uploads:** `tushuntir-uploads-<time>.tar.gz`, without the voice cache, which rebuilds itself.

Set it up with a test run, then the daily cron:

```bash
~/app/deploy/backup.sh                     # test once
ls -lh /var/backups/tushuntir
crontab -e                                 # add the line below (03:30 Tashkent time, see step 1)
30 3 * * * /home/tushuntir/app/deploy/backup.sh >> /home/tushuntir/app/logs/backup.log 2>&1
```

### Copy the latest backup to your laptop

Do this before the demo, so you have a copy off the server. On the laptop:

```bash
mkdir -p ~/tushuntir-backups
for kind in db uploads; do
  latest=$(ssh tushuntir@SERVER_IP "ls -1t /var/backups/tushuntir/tushuntir-$kind-* | head -1")
  scp "tushuntir@SERVER_IP:$latest" ~/tushuntir-backups/
done
ls -lh ~/tushuntir-backups
```

### Restore

```bash
pm2 stop tushuntir-api
# Database (asks for the tushuntir database password):
pg_restore --clean --if-exists --no-owner -h 127.0.0.1 -U tushuntir -d tushuntir \
  /var/backups/tushuntir/tushuntir-db-<time>.dump
# Uploads (replaces /var/lib/tushuntir/uploads):
tar -xzf /var/backups/tushuntir/tushuntir-uploads-<time>.tar.gz -C /var/lib/tushuntir
pm2 start tushuntir-api
curl -s http://127.0.0.1:4004/api/health
```

The dump leaves out the `vector` extension itself. That way the app user can restore without superuser rights.

To restore into a **new, empty** database (for example on a new server), first run step 4: create the user, the database, and `CREATE EXTENSION vector` as `postgres`. Then run the `pg_restore` above.

## 17. Rollback

A deploy that fails before the reload rolls itself back (step 14). To go back after a successful deploy:

```bash
cd ~/app
git log --oneline -10                      # find the last good commit
git reset --hard <commit>
npm ci --include=dev && npm run build
pm2 reload ecosystem.config.cjs --update-env
curl -s http://127.0.0.1:4004/api/health
```

- **Migrations:** they are additive (new tables and nullable columns), so older code runs on the newer schema. Undoing one is rarely needed; if it is, `npx typeorm migration:revert -d dist/database/data-source.js` undoes the newest one, and you run it again for each further one.
- **Returning to the latest version:** the next `deploy/deploy.sh` fast-forwards from the reset commit to the newest one.
- **If the data is broken:** restore the latest backup (step 16).

## Re-running the demo

```bash
cd ~/app && npm run demo:reset:prod        # needs DEMO_MODE=true
```

This resets the demo student (`+998901001001`, or pass another phone after `--`):
- **deleted:**
  - their attempts and the practice quizzes they created;
  - checkpoint tries, mastery and chat sessions;
  - the `needs_help` notifications about them;
  - their homework submissions from this week, with their files;
  - their notifications from the last 30 days. The app rebuilds the relevant ones, unread, on the next read.
- **restored:** the 4 demo homework items (new, submitted, checked, late), dated relative to today;
- **today's lesson:** on any day, weekends included, an ended Algebra lesson on the student's next unmastered topic, with its quiz open until 22:00 (at least 2 more hours), so the dashboard shows "Bugungi vazifa" with "Boshlash".
  - Saturday gets an Algebra period after its last lesson (10:45–11:30). Sunday's lesson uses the 08:00–08:45 times.
  - On other days the lesson shows as finished from its start time onwards.
- **progress:**
  - the earlier Algebra quizzes are submitted with scores (70–100%) and quiz grades; at most one is left overdue;
  - the first 2 of 6 topics are mastered (quiz and passed checkpoint), so today's topic is unlocked and its checkpoint can follow the quiz;
- **reopened:** this week's lessons of the class, with quiz deadlines back to `QUIZ_DEADLINE_TIME`;
- **kept:** attendance, grades and other history, generated questions and the textbook.

## Good to know

- **One process only.** The rate limits, the voice cache and the daily demo job live in the process. Don't raise `instances` in `ecosystem.config.cjs`.
- **Private files.** Homework submission files are private. They are stored in `uploads/private/`, never served under `/uploads`, and reached only through `/api/files/:id` or the signed links in API responses.
- **Request size limit.** Caddy accepts requests up to 32 MB, enough for a homework submission with 3 files of 10 MB. The app checks the limit of each file itself.
- **Security updates.** Ubuntu installs them automatically (`unattended-upgrades`, on by default). Reboot now and then: `sudo reboot`. pm2 and Caddy start again on their own.
