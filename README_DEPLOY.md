# Deployment guide

This document explains how to deploy the project frontend and backend using Netlify (frontend and serverless functions) and Render (backend web service). It also documents the repository secrets used by the GitHub Actions workflow.

Environment variables required (set these in Netlify site settings for functions and in Render's service environment):

- `MONGODB_URI` — MongoDB connection string (e.g. `mongodb+srv://user:pass@cluster0.mongodb.net/?retryWrites=true&w=majority`)
- `JWT_SECRET` — secret string used to sign JWT tokens (use a secure random value)
- `PORT` — optional for local runs

Netlify (Frontend + Functions)
- Add `MONGODB_URI` and `JWT_SECRET` to the Netlify site environment variables (Site Settings -> Build & Deploy -> Environment).
- Ensure `netlify.toml` exists in repo (it does) and that `functions` points to `netlify/functions`.
- Deploy the site by connecting the GitHub repo in Netlify. Netlify will build with `npm run build` and publish `dist`.

Render (Backend - optional)
- If you prefer a long-running Express backend, create a new Web Service on Render.
- You can use the included `render.yaml` as a starting manifest (update `repo` or configure via the Render dashboard).
- Set environment variables `MONGODB_URI` and `JWT_SECRET` in Render's service settings.
- Start command: `npm run server` (the root package.json contains `server` script that runs `db/server.js`).

Switching the frontend to point to Render backend
- The frontend can use the Vite environment variable `VITE_API_BASE` to switch API base URL.
  - Example for Netlify (keep default serverless functions): leave `VITE_API_BASE` empty.
  - Example for Render backend: set `VITE_API_BASE` to `https://your-backend.onrender.com` (no trailing slash).

Local development
- Create a `.env` file at project root with:

```
MONGODB_URI=your-mongo-uri
JWT_SECRET=your-jwt-secret
PORT=4000
VITE_API_BASE=
```

- Run Express backend locally:

```powershell
npm run server
```

- Run Netlify functions and frontend locally (requires Netlify CLI):

```powershell
npm run dev:netlify
```

GitHub Actions
- The workflow `.github/workflows/deploy.yml` builds the frontend and deploys to Netlify using `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` secrets, then triggers a Render deploy using `RENDER_API_KEY` and `RENDER_SERVICE_ID`.
- Add these repository secrets in GitHub (Settings -> Secrets):
  - `NETLIFY_AUTH_TOKEN` — Netlify personal access token
  - `NETLIFY_SITE_ID` — Netlify site id
  - `RENDER_API_KEY` — Render API key (service/integration token)
  - `RENDER_SERVICE_ID` — Render service id for your backend service

If you'd like, I can also:
- Add a small UI toggle that shows the active API base at runtime, or
- Add automated secret validations and a script that prints recommended env var formats.
# Deployment Guide — Netlify (frontend) and Render (backend)

This short guide explains how to deploy the project so the frontend is served by Netlify and the backend (Express) runs on Render, or how to use Netlify Functions only.

---

## What changed in the codebase
- Passwords are hashed with `bcrypt` and stored in MongoDB as `password_hash`.
- `db/server.js` was updated to remove `password_hash` before returning user details and to return IDs as strings for consistent API responses.
- Netlify Functions are present for auth and meetings — these use the same hashed-password approach and talk to MongoDB.

---

## Environment variables (required)
- `MONGODB_URI` — MongoDB connection string (example: `mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority`)
- `JWT_SECRET` — secret used to sign JSON Web Tokens (use a strong random string)
- `PORT` — optional for local runs (Render provides this automatically in its environment)

---

## Option A — Frontend on Netlify, Serverless API on Netlify Functions
1. In Netlify site settings, set environment variables: `MONGODB_URI` and `JWT_SECRET`.
2. Netlify will build the frontend with `npm run build` and publish the `dist` folder. The `netlify.toml` contains redirects from `/api/*` to `/.netlify/functions/*`.
3. The repository already contains Netlify Functions under `netlify/functions` for `register`, `login`, `user-me`, meetings and committee endpoints. No additional code changes required.

Local testing:
- Install Netlify CLI: `npm i -g netlify-cli`.
- Run: `npm run dev:netlify`.
- Ensure `.env` contains the environment vars for local testing.

---

## Option B — Frontend on Netlify, Express backend on Render
1. Create a new Web Service on Render (https://render.com).
2. Connect the repository and choose the `main` branch.
3. Set the Start Command to: `npm run server` (root `package.json` includes `server` which runs `nodemon -r dotenv/config ./db/server.js`) or `node db/server.js`.
4. Add environment variables in Render: `MONGODB_URI`, `JWT_SECRET`.
5. Once Render is deployed, update frontend configuration so API calls point to `https://<your-render-service>.onrender.com/api/...` instead of `/api/...` (or keep proxying via Netlify redirects if you prefer).

Notes:
- Render will provide the `PORT` env variable automatically.
- Ensure `type: module` is supported by the Node version on Render (Node 18+ recommended).

---

## Endpoints (use either Netlify Functions or Render backend)
- POST `/api/register` — body: `{ name, email, password }` (returns `user.id` as string).
- POST `/api/login` — body: `{ email, password }` (returns `token`).
- GET `/api/user/me` — requires `Authorization: Bearer <token>`.
- POST `/api/meetings` — create meeting (requires token if using the Express function that verifies token).
- GET `/api/meetings/code/:code` — fetch meeting by code.
- POST `/api/meetings/:id/join` — join meeting by id.

---

## Next steps I can take for you
- Add a `README_DEPLOY.md` (done). I can also:
  - Add a `render.yaml` or Render deploy settings file.
  - Update frontend config to allow easy swapping between Netlify Functions and a Render URL (environment variable `REACT_APP_API_BASE`).
  - Add CI to auto-deploy to Netlify and Render on push.

If you want any of those, tell me which and I will implement it.
