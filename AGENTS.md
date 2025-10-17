# Repository Guidelines

Contributors should mirror these practices to keep ScientistShield 2.0 stable and predictable.

## Project Structure & Module Organization
The monorepo hosts the Express API under `api/` (controllers, routes, services, models, utils). The Vite + React client lives in `client/src/` with feature folders (`pages/`, `components/`, `redux/`, `hooks/`) and Tailwind-driven styling in `theme/` and `index.css`. Upload artifacts persist under `uploads/`; transient code-runner scratch space is in `temp/` and can be deleted. Shared scripts and npm metadata are rooted in `package.json`.

## Build, Test, and Development Commands
Run `npm install` once at the root; use `npm install --prefix client` after client-specific dependency changes. `npm run dev` launches the API with Nodemon, while `npm run dev --prefix client` starts the Vite dev server. `npm run build` installs dependencies and compiles the client bundle into `client/dist` before production. Use `npm start` to serve the Express API plus the built SPA.

## Coding Style & Naming Conventions
Write modern ES modules (`import`/`export`) and keep indentation at 4 spaces for JS/TS and JSX. Prefer single quotes in JavaScript, PascalCase component files (e.g., `CreateProblem.jsx`), and kebab-case route slugs. Centralize shared logic inside `api/services/` or `client/src/utils/` before duplicating code. Run a formatter (Prettier or IDE equivalent) before opening a PR; keep Tailwind classes ordered by relevance rather than alphabetical noise.

## Testing Guidelines
The backend uses Node’s native test runner with `.test.js` files co-located in `api/**`. Execute `npm test` from the root; it traverses `api/**/*.test.js`. Cover new routes, services, and edge cases (validation, RBAC, error paths). Structure describe blocks around the route or service name and favor descriptive test names (`should reject unauthenticated quiz creation`).

## Commit & Pull Request Guidelines
Adopt conventional prefixes (`feat:`, `fix:`, `chore:`) for concise commit messages, capped at 72 characters. Squash noisy WIP commits before sharing. Pull requests must explain intent, list impacted endpoints/pages, and call out risky migrations or seeding steps. Link related issues and attach screenshots or terminal output for UI or CLI changes. Confirm `npm test` and both dev servers start cleanly before requesting review.

## Security & Configuration Tips
Keep secrets in `.env`; never commit credentials or generated JWTs. Update the sample env when adding configuration knobs. Validate that code-runner changes cannot escape `temp/`, and reset uploaded artifacts if testing with sensitive files.
