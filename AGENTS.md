# Repository Guidelines

## Project Structure & Module Organization
- `api/`: Express logic with controllers, routes, services, models, and colocated `*.test.js`. Keep reusable business rules in `api/services/`.
- `client/src/`: Vite + React app organized under `pages/`, `components/`, `redux/`, `hooks/`, and shared Tailwind tokens in `theme/` and `index.css`.
- `uploads/`: Persisted artifacts for manual testing; scrub sensitive data after use. `temp/` is disposable scratch space.
- Root scripts apply to both API and client. Assume commands run from the repository root unless noted.

## Build, Test, and Development Commands
- `npm install` and `npm install --prefix client`: sync server and client dependencies.
- `npm run dev`: start the Express API with Nodemon for hot reload.
- `npm run dev --prefix client`: launch the Vite dev server for the SPA.
- `npm run build`: install client deps and emit the production bundle to `client/dist`.
- `npm start`: serve the API plus the built SPA for an end-to-end smoke test.
- `npm test`: execute colocated Node test suites; expect green before pushing.

## Coding Style & Naming Conventions
- Use ES modules with 4-space indentation and single quotes across JS/TS/JSX.
- Order Tailwind utilities by layout → spacing → color/state to stay scannable.
- Name React components in PascalCase (`CreateProblem.jsx`), API routes in kebab-case, and consolidate shared helpers in `api/services/` or `client/src/utils/`.
- Run Prettier or your IDE formatter prior to staging.

## Testing Guidelines
- Keep `*.test.js` beside their modules; use Node’s native test runner.
- Cover success, validation, authz, and failure paths for every new route or service.
- Name suites clearly (`describe('POST /quizzes')`) and keep assertions targeted.
- Run `npm test` locally before opening PRs; add fixtures under `temp/` when needed.

## Commit & Pull Request Guidelines
- Follow conventional commits (`feat:`, `fix:`, `chore:`) with ≤72 characters.
- Squash WIP commits; ensure messages explain impact and intent.
- PRs must outline scope, list impacted endpoints/pages, attach screenshots or logs when UI changes, link related issues, and confirm `npm test`, `npm run dev`, and `npm run dev --prefix client` succeed locally.
- Note risky migrations or seeding steps explicitly.

## Security & Configuration Tips
- Keep secrets in `.env`; update `.env.example` whenever new keys are introduced.
- Review dependency bumps for security or licensing implications before merge.
- Limit experiments to `temp/` and sanitize `uploads/` after handling sensitive data.
