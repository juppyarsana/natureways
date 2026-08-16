# Deploying NatureWays to a VPS

Target: Ubuntu/Debian VPS, Strapi (`cms/`) + Express (`frontend/`) both running under pm2, Nginx reverse-proxying, TLS via a **Cloudflare Origin Certificate** (this domain's DNS is proxied through Cloudflare — see Phase 1 — which is why we use an Origin Certificate here instead of Let's Encrypt/certbot). Two hostnames: `natureways.id` (public site) and `cms.natureways.id` (Strapi admin, so it's never mixed into the public site's routing).

Run every command below yourself on the VPS (over SSH) or locally as noted — nothing here is executed automatically.

---

## Phase 1 — DNS

At your domain registrar / DNS provider for `natureways.id`, add:

| Type | Host | Value |
|------|------|-------|
| A | `@` | your VPS's public IPv4 |
| A | `www` | your VPS's public IPv4 |
| A | `cms` | your VPS's public IPv4 |

DNS propagation can take a few minutes to a few hours. You can move on to Phase 2 while waiting, but Phase 8 (TLS) needs propagation to have finished.

---

## Phase 2 — Initial server setup

SSH into the VPS as root (or your existing sudo user):

```bash
ssh root@YOUR_VPS_IP
```

Update packages and create a non-root deploy user if you don't already have one:

```bash
apt update && apt upgrade -y
adduser deploy
usermod -aG sudo deploy
```

Basic firewall — only allow SSH, HTTP, HTTPS:

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

From here on, run commands as `deploy` (switch with `su - deploy`, or re-SSH as that user).

---

## Phase 3 — Install Node.js, Nginx, pm2, git

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx git
node -v   # should print v20.x — matches local dev
sudo npm install -g pm2
```

---

## Phase 4 — Get the code onto the server

```bash
sudo mkdir -p /var/www/natureways
sudo chown $USER:$USER /var/www/natureways
git clone https://github.com/juppyarsana/natureways.git /var/www/natureways
cd /var/www/natureways
```

### Configure `cms/.env` (production secrets — do NOT reuse the local dev ones)

```bash
cd /var/www/natureways/cms
cp .env.example .env
```

Edit `.env` and fill in real random values (run `openssl rand -base64 32` once per line to generate each):

```
HOST=0.0.0.0
PORT=1337
APP_KEYS=<openssl rand -base64 32>,<openssl rand -base64 32>
API_TOKEN_SALT=<openssl rand -base64 32>
ADMIN_JWT_SECRET=<openssl rand -base64 32>
TRANSFER_TOKEN_SALT=<openssl rand -base64 32>
JWT_SECRET=<openssl rand -base64 32>
ENCRYPTION_KEY=<openssl rand -base64 32>
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
```

(`APP_KEYS` takes two comma-separated values; run the `openssl rand -base64 32` command twice for those.)

### Configure `frontend/.env`

```bash
cd /var/www/natureways/frontend
cp .env.example .env
```

Edit to:
```
PORT=3000
STRAPI_URL=http://localhost:1337
STRAPI_PUBLIC_URL=https://cms.natureways.id
STRAPI_API_TOKEN=
```
(We'll fill in `STRAPI_API_TOKEN` in Phase 6 after Strapi is running — locking the frontend to a scoped read-only token instead of relying on the public role, same idea we used locally but worth tightening for production.)

`STRAPI_URL` is the internal address the Express server uses to fetch data from Strapi (server-to-server, over localhost — fine since Nginx puts both apps on the same box). `STRAPI_PUBLIC_URL` is different: it's used to build `<img src="...">` URLs that get sent to visitors' browsers, so it must be the public CMS domain — if left as `localhost`, every visitor's browser will try to fetch images from `localhost` on their own machine (broken images, and Chrome will prompt for "Local Network Access" permission).

---

## Phase 5 — Install dependencies and build the CMS admin panel

```bash
cd /var/www/natureways/cms
npm install
npm run build      # builds the Strapi admin UI — `strapi start` (production) serves this pre-built version, unlike `strapi develop`

cd /var/www/natureways/frontend
npm install
```

---

## Phase 6 — First boot: create admin user, let it seed, start with pm2

```bash
cd /var/www/natureways/cms
npx strapi admin:create-user -e "your-email@example.com" -p "A-Strong-New-Password1!" -f "NatureWays" -l "Admin"
```

This also runs the bootstrap (permissions + content seed) the first time, same as it did locally — check the output for `[bootstrap] Seeding complete.`

Now start both apps under pm2:

```bash
cd /var/www/natureways
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup    # prints a command — copy/paste and run it so pm2 survives a reboot
```

Verify both are up:
```bash
pm2 status
curl -I http://localhost:3000
curl -I http://localhost:1337/api/homepage
```

**Now** generate the frontend's API token: log into `http://YOUR_VPS_IP:1337/admin` (or wait until Phase 7 and use the real domain), go to Settings → API Tokens → create a **Read-only** token, paste it into `frontend/.env` as `STRAPI_API_TOKEN`, then `pm2 restart natureways-frontend`.

---

## Phase 7 — TLS: Cloudflare Origin Certificate, then Nginx

**7a. Set Cloudflare's encryption mode.** In the Cloudflare dashboard for `natureways.id`: **SSL/TLS → Overview** → set mode to **Full (strict)**. This means Cloudflare will only talk to your VPS over HTTPS with a valid cert — which is exactly what the Origin Certificate below provides.

**7b. Generate the Origin Certificate.** Still in Cloudflare: **SSL/TLS → Origin Server → Create Certificate**. Accept the defaults (let Cloudflare generate the private key, RSA 2048, 15-year validity), hostnames `natureways.id` and `*.natureways.id`. Cloudflare shows you two blocks of text — the certificate (`-----BEGIN CERTIFICATE-----`) and the private key (`-----BEGIN PRIVATE KEY-----`). Keep that browser tab open, you need both in the next step.

**7c. Install the cert on the VPS:**

```bash
sudo mkdir -p /etc/ssl/cloudflare
sudo nano /etc/ssl/cloudflare/natureways.id.pem   # paste the CERTIFICATE block, save, exit
sudo nano /etc/ssl/cloudflare/natureways.id.key   # paste the PRIVATE KEY block, save, exit
sudo chmod 600 /etc/ssl/cloudflare/natureways.id.key
```

**7d. Install and enable the Nginx site:**

```bash
sudo cp /var/www/natureways/deploy/nginx-natureways.conf /etc/nginx/sites-available/natureways.id
sudo ln -s /etc/nginx/sites-available/natureways.id /etc/nginx/sites-enabled/
sudo nginx -t       # should say "syntax is ok" / "test is successful"
sudo systemctl reload nginx
```

The config already includes both the port-80→443 redirect and the two HTTPS server blocks (site + CMS admin), referencing the cert files from 7c — no certbot needed.

---

## Phase 8 — Verify

- `https://natureways.id` — public site loads, matches what you saw locally.
- `https://cms.natureways.id/admin` — Strapi admin login works with the account from Phase 6.
- Edit something in the CMS, refresh the public site, confirm it updates (same live-edit check we did locally).
- `pm2 status` shows both processes `online`.

## Redeploying future changes

This VPS has only ~960MB RAM, so building Strapi's admin panel in place is slow and OOM-prone. Build **in a tmux session with a memory bump**, and — critically — **do not restart/start `natureways-cms` in pm2 until the build has fully finished**. Starting it against a half-written `cms/build/` is exactly what serves a broken "Not Found" admin panel (happened on 2026-08-17; cost real time to diagnose).

```bash
cd /var/www/natureways
git pull

# stop the CMS before building (frees a little RAM, and avoids any chance
# of it serving mid-build files)
pm2 stop natureways-cms

cd cms
tmux new -s build
# --- inside tmux ---
npm install
NODE_OPTIONS="--max-old-space-size=3072" npm run build
# ctrl+b then d to detach once it's running — this step alone can take
# 20-30+ minutes on this box (swap thrashing at ~960MB RAM is normal,
# not a hang — confirm it's alive via `ps aux | grep strapi` and check
# the CPU time column is still climbing between checks)
```

**Wait for the build to fully exit** — reattach with `tmux attach -t build` and confirm you see a shell prompt back (not a spinner), AND `ps aux | grep strapi` shows no `strapi build` process left. Only then:

```bash
cd ../frontend && npm install

pm2 start natureways-cms   # or: pm2 restart all
```

Give Strapi ~1 minute to cold-boot, then confirm before checking the site:
```bash
pm2 logs natureways-cms --lines 30 --nostream   # look for "Strapi started successfully"
curl -I http://localhost:1337/api/homepage       # expect 200
curl -I http://localhost:3000                    # expect 200
```

## Notes / things worth doing next, not required to launch

- **Backups**: `cms/.tmp/data.db` (SQLite) and `cms/public/uploads/` are the two things to back up regularly — they hold all real content and media once the client starts editing.
- **Strapi admin hardening**: consider restricting `cms.natureways.id` to known IPs at the Nginx level, or at minimum keep the admin password strong and unique (not the local-dev one from earlier in this project).
- **Origin lockdown**: since DNS is Cloudflare-proxied, visitors never hit the VPS IP directly — but the IP is still discoverable (e.g. it's in your SSH history/this DNS record). Optionally restrict Nginx/ufw to only accept port 80/443 traffic from [Cloudflare's published IP ranges](https://www.cloudflare.com/ips/) so the origin can't be hit by bypassing Cloudflare entirely.
- **Payment gateway**: when ready, this is where the `POST /webhooks/midtrans` (or Xendit) route gets added to `frontend/src/routes/`, per the architecture note in `CLAUDE.md`.
