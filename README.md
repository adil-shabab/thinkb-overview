# ThinkB Web Ops

Static dashboard (and installable PWA) for the web development department: websites, pending work, who's doing what, and domain/server/SSL renewals, with a popup when payments are due this week.

## Run locally

```bash
python3 -m http.server 5173
# open http://localhost:5173
```

Opening `index.html` directly also works, but the PWA (install + offline) only works when served over http(s).

## Edit things

| What | File |
|---|---|
| Username, password, your name, currency, alert window | `js/config.js` |
| Team, websites, tasks, updates, renewals, extra payments | `js/data.js` |

Save and refresh. Dates are `YYYY-MM-DD`.

- Any `domain.expiry`, `server.expiry` or `ssl.expiry` automatically shows in **Renewals** and in the **Payments due this week** popup.
- Use `payments` in `data.js` for anything else (shared servers, subscriptions, invoices).
- "Mark paid" and "Remind me later" are saved in that browser only. When you renew something, update its expiry date in `data.js`.

## Security note

This is a static site, so the login only keeps casual visitors out: anyone can read `js/config.js`. Don't use a password you use anywhere else. For real protection, host it behind your hosting provider's password protection (e.g. Netlify/Vercel/Cloudflare Access).

## Deploy

Upload the folder to any static host (Netlify drop, Vercel, GitHub Pages, cPanel). When you add new files, bump `CACHE` in `sw.js`.
