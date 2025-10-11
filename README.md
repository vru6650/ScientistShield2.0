# ScientistShield 2.0

Modern MERN knowledge platform with tutorials, quizzes, problem solving, full‑text search, and safe multi‑language code runners.

## Features
- Tutorials, posts, and pages with rich editor (TipTap) and reading tools
- Quizzes with grading and admin management
- Problems with hints, constraints, and starter code
- Search powered by optional Elasticsearch (MongoDB fallback messaging)
- Safe code execution endpoints: JavaScript, Python, C/C++, Java, C#
- Authentication with JWT and cookies; role‑based routes
- Production build served by Express; Vite dev with API proxy

## Tech Stack
- Backend: Node.js, Express, Mongoose, JWT, Cookie Parser, CORS
- Frontend: React 18, Vite, Redux Toolkit + Persist, React Router, Tailwind CSS
- Editor/UX: TipTap, Lowlight/Highlight.js, Framer Motion, Tippy.js
- Search: Elasticsearch (optional; see env vars) with REST integration

## Directory Structure
- `api/` – Express API (routes, controllers, models, services, utils)
- `client/` – React app (Vite) with pages, components, hooks, and services
- `temp/` – ephemeral workspace for code runners (created at runtime)

## Quick Start
Prerequisites:
- Node.js 18+ and npm
- MongoDB running locally or remotely
- Optional: Elasticsearch (for full search); otherwise set `ELASTICSEARCH_DISABLED=true`

1) Install dependencies
```bash
npm install
npm install --prefix client
```

2) Configure environment
Create `.env` in the project root (an example is already present). Minimum recommended:
```env
JWT_SECRET=change-me
MONGO_URI=mongodb://127.0.0.1:27017/scientistshield
PORT=3000
CORS_ORIGIN=http://localhost:5173

# Client -> API base (leave empty for same-origin/proxy in dev)
VITE_API_URL=http://localhost:3000

# Optional search (disable if not using)
ELASTICSEARCH_DISABLED=true
# Or configure instead:
# ELASTICSEARCH_NODE=http://localhost:9200
# ELASTICSEARCH_USERNAME=your-username
# ELASTICSEARCH_PASSWORD=your-password
# ELASTICSEARCH_API_KEY=your-api-key
# ELASTICSEARCH_INDEX_PREFIX=scientistshield
```

3) Run in development (two terminals)
```bash
# Terminal A – API (Express)
npm run dev

# Terminal B – Client (Vite)
npm run dev --prefix client
```
Vite proxies `/api/*` to `http://localhost:3000` during development.

4) Build and run in production
```bash
npm run build     # builds client
npm start         # starts Express and serves built client
```
The server serves the SPA from `client/dist` and exposes the API under `/api`.

## Environment Variables
- `JWT_SECRET` – required; signs JWTs
- `MONGO_URI` – MongoDB connection string (default `mongodb://0.0.0.0:27017/myappp`)
- `PORT` – API port (default `3000`)
- `CORS_ORIGIN` – allowed origin for cookies/CORS (default `http://localhost:5173`)
- `VITE_API_URL` – client Axios base URL; set to API origin in production; empty uses same origin/proxy
- `ELASTICSEARCH_DISABLED` – set to `true`/`1` to fully disable external search integration
- `ELASTICSEARCH_NODE` – e.g. `http://localhost:9200`
- `ELASTICSEARCH_USERNAME` / `ELASTICSEARCH_PASSWORD` – basic auth credentials
- `ELASTICSEARCH_API_KEY` – alternative to user/pass (takes precedence)
- `ELASTICSEARCH_INDEX_PREFIX` – index name prefix (default `scientistshield`)

## API Highlights
- Content: `/api/post`, `/api/tutorial`, `/api/problems`, `/api/pages`
- Auth: `/api/auth` (signup/signin), `/api/user`
- Search: `/api/search` (uses Elasticsearch when enabled)
- Code execution (POST JSON `{ code: string }`):
  - JavaScript: `/api/code/run-js` (runs in a restricted VM sandbox)
  - Python: `/api/code/run-python` (requires `python3` or `python` on server)
  - C/C++: `/api/code/run-cpp` (requires compiler/runtime)
  - Java: `/api/code/run-java` (requires JDK)
  - C#: `/api/code/run-csharp` (prefers .NET SDK; also supports dotnet‑script/csi/scriptcs)

Notes on runners:
- Runtimes are optional; if missing, endpoints return a helpful message rather than crashing.
- Never expose unrestricted code execution to untrusted users in production.

## Step‑by‑Step Debugger
The in‑app Code Editor includes an interactive, step‑by‑step debugger (Thonny‑style) for Python, C/C++, JavaScript, and Java.

- Open any editor (e.g., Try It page or Interactive Code Block) and click `Debug`.
- Use the controls to step through execution and inspect state:
  - Play/Pause: Continue or pause (`F5`)
  - Step Into: Move into calls (`F11`)
  - Step Over: Skip over calls (`F10`)
  - Step Out: Finish current frame (`Shift+F11`)
  - Next/Prev: Move between recorded steps
  - Run to Cursor: Continue until the cursor line (`Ctrl/Cmd+F10`)
  - Breakpoints: Toggle with gutter click or (`F9`); clear with (`Shift+F9`)
- Visual cues:
  - Current line is highlighted in green; next line in red
  - Breakpoints are shown as pink dots in the gutter
- Data panels show current locals, call stack, heap objects (when available), and stdout.

Notes:
- Python runs locally via a tracing script; other languages use Python Tutor to generate traces.
- If your server cannot reach external services, non‑Python visualization may be unavailable.

## Testing
Run server tests:
```bash
npm test
```
Includes controllers, routes, services, and utilities. Tests use Node’s native runner.

## Troubleshooting
- Cannot connect to MongoDB: verify `MONGO_URI` and that MongoDB is running.
- CORS/auth issues in dev: confirm `CORS_ORIGIN` matches Vite URL and that Vite proxy is active.
- Elasticsearch errors: set `ELASTICSEARCH_DISABLED=true` to suppress integration, or configure node/credentials.
- Missing runtimes (Python/.NET/Java): install language toolchains, or expect graceful messages from code endpoints.

## Contributing
1. Create a feature branch from `main`.
2. Add focused changes and unit tests where practical.
3. Run `npm test` and ensure all tests pass.
4. Open a PR with a clear description and screenshots if UI changes.

---

Versions: ScientistShield_0.1 · ScientistShield0.2 · ScientistShield1.0 · ScientistShield2.0

## WhiteSur Theme
- The client UI adopts a WhiteSur (macOS Big Sur) inspired theme: frosted glass surfaces, rounded corners, and the Blue accent (`#0A84FF`).
- A curated WhiteSur icon pack is available under `client/public/icons/whitesur`. Switch at runtime via:
  - In DevTools: `localStorage.setItem('iconPack', 'whitesur'); location.reload();`
  - Reset: `localStorage.removeItem('iconPack'); location.reload();`
- The header features macOS-style window controls. Glass surfaces use the `glass-effect` utility and adapt to light/dark.
- The PWA manifest `theme_color` is set to `#0A84FF` to match WhiteSur.
