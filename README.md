# Library proxy — deploy guide

This is a tiny Cloudflare Worker that sits between your site and jsonbin.io.
It holds your `MASTER_KEY` as a server-side secret so it's never shipped to
the browser. Your `index.html` already points at it — you just need to
deploy it and paste in the real URL.

## 1. Install Wrangler (Cloudflare's CLI)

```
npm install -g wrangler
```

## 2. Log in

```
wrangler login
```

This opens a browser window to authorize Wrangler against your Cloudflare
account (free tier is fine).

## 3. Set your secrets

From inside the `worker/` folder:

```
wrangler secret put BIN_ID
```
Paste your jsonbin.io bin ID when prompted (`6a8bb04dda38895dfe08ba02` — the
value that used to be the `BIN_ID` constant in index.html).

```
wrangler secret put MASTER_KEY
```
Paste your jsonbin.io master key when prompted (the value that used to be
the `MASTER_KEY` constant in index.html).

Secrets are encrypted at rest and never appear in your code or in
`wrangler.toml`.

## 4. Deploy

```
wrangler deploy
```

Wrangler will print a URL that looks like:

```
https://library-proxy.YOUR-SUBDOMAIN.workers.dev
```

## 5. Point your site at it

In `index.html`, update:

```js
const API_URL = 'https://library-proxy.YOUR-SUBDOMAIN.workers.dev/b';
```

with the URL Wrangler gave you (keep the trailing `/b`).

## 6. (Recommended) Lock down CORS

Right now the Worker allows requests from any origin (`*`), which is fine to
get started. Once your site has a real domain, uncomment the `[vars]` block
in `wrangler.toml`, set `ALLOWED_ORIGIN` to your actual site URL, and run
`wrangler deploy` again — this stops other sites from calling your proxy
directly.

## Rotating the old key

Since the old master key was exposed in public HTML, treat it as
compromised: in your jsonbin.io dashboard, generate a **new** master key (or
a scoped access key for just this bin) and use that when you run
`wrangler secret put MASTER_KEY` above. Don't reuse the leaked one.
