# ServeUp — Full Rebuild

A complete recreation of serveup.co.in: front-end + Express backend + SQLite database.
This is a fresh rebuild based on the live site's content — not a restore of your
original source files (those weren't recoverable). Treat it as a working starting
point, not a byte-for-byte match of what you had before.

## What's included

```
serveup/
├── server.js            # Express app entrypoint
├── package.json
├── .env                  # JWT secret + port (edit before deploying)
├── db/
│   ├── schema.sql        # Table definitions
│   └── init.js           # Creates + seeds the SQLite DB on first run
├── middleware/
│   └── auth.js           # JWT auth middleware
├── routes/
│   ├── auth.js           # register / login / me
│   ├── players.js        # search, profile, stats, plan change
│   ├── slots.js           # publish / browse open slots
│   ├── bookings.js       # request / confirm / decline bookings
│   ├── messages.js       # threads + conversation + send
│   └── reviews.js        # list + submit reviews
└── public/
    ├── index.html
    ├── style.css
    └── script.js         # wires the UI to the API above
```

## Run it locally

Requires Node.js 18+.

```bash
cd serveup
npm install
npm start        # or: node server.js
```

Visit **http://localhost:3000**. The SQLite database (`db/serveup.db`) is created
and seeded automatically on first run with 5 demo players, a few open slots, and
sample reviews. Demo login for any seeded player (e.g. `rahul@example.com`):

```
password: password123
```

Delete `db/serveup.db` (and the `-wal`/`-shm` files next to it) any time to reset
to a clean seeded database.

## Environment variables (`.env`)

```
JWT_SECRET=replace-this-with-a-long-random-string
PORT=3000
```

**Change `JWT_SECRET` before deploying anywhere real** — the one in this package
is a placeholder.

## Deploying to serveup.co.in

This is a plain Node/Express app with a file-based SQLite database, so it runs on
any Node host. A few options, roughly easiest to most control:

1. **Railway / Render / Fly.io** — connect a git repo (push this folder to GitHub
   first), set `JWT_SECRET` in the dashboard's environment variables, deploy. These
   platforms give you a URL immediately; point your domain's DNS (A/CNAME record)
   at it afterward.
2. **A VPS you already control** (DigitalOcean, EC2, etc.) — `git clone` or `scp`
   this folder up, `npm install`, run it behind a process manager like `pm2`
   (`pm2 start server.js --name serveup`), and reverse-proxy it with Nginx on
   port 80/443 pointing at Node's port 3000. Get a free TLS cert with `certbot`.
3. **Your existing hosting for serveup.co.in** — if it's shared/static hosting,
   it likely can't run Node directly; you'd need to move to one of the options
   above, or a Node-capable host, and update the domain's DNS to point there.

SQLite is fine for low-to-moderate traffic. If you outgrow it, swap `better-sqlite3`
for a hosted Postgres/MySQL client — the `db/schema.sql` maps over almost directly.

## Known gaps / things to build out before this is production-ready

- **Payments**: the "Charge for Sessions" / Pro / Coach plan upgrades are stubbed
  (they just flip a `plan` field) — no real payment processor (Razorpay/Stripe)
  is wired in yet.
- **Real-time chat**: messaging works via REST + polling-on-open, not WebSockets —
  fine for a v1, but messages won't appear live without a refresh.
- **Email verification / password reset**: not implemented.
- **File uploads** (profile photos): not implemented — avatars are initials only.
- **Rate limiting / input validation hardening**: basic checks only; add something
  like `express-validator` and a rate limiter before going live publicly.
