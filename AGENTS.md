# Repository Guidelines

ScientistShield 2.0 stays predictable when every contributor follows these guardrails.

## Project Structure & Module Organization
- `api/`: Express API containing controllers, routes, services, models, utils, and colocated `.test.js`.
- `client/src/`: Vite + React features (`pages/`, `components/`, `redux/`, `hooks/`); Tailwind tokens in `theme/` and `index.css`.
- `uploads/`: persistent artifacts—purge sensitive data post-test. `temp/`: throwaway runner scratch space.
- Root `package.json`: shared scripts and lockfiles; assume commands run at the repo root.

## Build, Test, and Development Commands
- `npm install` (root) and `npm install --prefix client` keep server and client dependencies aligned.
- `npm run dev` restarts the API with Nodemon; `npm run dev --prefix client` serves the React app via Vite.
- `npm run build` installs client deps and writes the production bundle to `client/dist`.
- `npm start` serves the Express API and built SPA for realistic smoke tests.

## Coding Style & Naming Conventions
- Write ES modules with 4-space indentation across JS/TS/JSX; prefer single quotes.
- Order Tailwind utilities by layout → spacing → color/state to stay readable.
- Use PascalCase for React components (`CreateProblem.jsx`), kebab-case for routes, and consolidate shared logic in `api/services/` or `client/src/utils/`.
- Run Prettier or your IDE formatter before staging changes.

## Testing Guidelines
- Use Node’s native test runner with `*.test.js` beside their modules.
- Run `npm test` from the root; cover success, validation, authorization, and failure paths for every new route or service.
- Name suites and cases descriptively (`describe('POST /quizzes')`, `should reject unauthenticated quiz creation`).

## Commit & Pull Request Guidelines
- Adopt conventional commit prefixes (`feat:`, `fix:`, `chore:`) and keep messages ≤72 characters; squash throwaway WIP commits.
- PRs must explain intent, note impacted endpoints/pages, flag risky migrations/seeding, attach screenshots or logs, and confirm `npm test`, `npm run dev`, and `npm run dev --prefix client` pass locally; always link related issues.

## Security & Configuration Tips
- Keep secrets in `.env`; refresh `.env.example` whenever new config keys appear and never commit tokens or private keys.
- Contain runner experiments within `temp/`, sanitize `uploads/` after handling sensitive files, and review dependency bumps for security or license risk before merging.
