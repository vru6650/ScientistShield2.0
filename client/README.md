# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Design Tokens

The client uses Tailwind CSS design tokens defined in `tailwind.config.js` for fonts, spacing, and border radii. Use these tokens instead of numeric utility classes to keep styling consistent.

### Fonts

- `font-heading` – Poppins for headings
- `font-body` – Inter for body text

### Spacing

Spacing tokens are accessed with classes like `p-space-md` or `mt-space-xl`.

| Token       | Value    | Example           |
| ----------- | -------- | ----------------- |
| `space-xs`  | 0.25rem  | `gap-space-xs`    |
| `space-sm`  | 0.5rem   | `p-space-sm`      |
| `space-md`  | 0.75rem  | `px-space-md`     |
| `space-lg`  | 1rem     | `mb-space-lg`     |
| `space-xl`  | 1.5rem   | `mt-space-xl`     |
| `space-2xl` | 2rem     | `lg:px-space-2xl` |
| `space-3xl` | 3rem     | `mt-space-3xl`    |
| `space-4xl` | 4rem     | `p-space-4xl`     |
| `space-5xl` | 6rem     | `py-space-5xl`    |

### Border Radius

Border radii tokens follow `rounded-{token}`.

- `rounded-radius-sm` – 0.125rem
- `rounded-radius-md` – 0.375rem
- `rounded-radius-lg` – 0.5rem
- `rounded-radius-full` – fully rounded elements

Refer to the components for examples of token usage.

## Shared UI Components

Reusable primitives are available in `src/components/ui/`:

- `Button` – standard button with spacing, rounded corners, and variants for primary, secondary, and danger actions.
- `Card` – base container with consistent border, shadow, and background.
- `Modal` – overlay modal for confirmations and dialogs.

Use these components to avoid duplicating common styles across the app.

## Flowbite Theme

Flowbite React components are themed to match our Tailwind tokens via `customFlowbiteTheme` in `src/theme/flowbiteTheme.js`. The provider is applied in `src/components/ThemeProvider.jsx`.

- Primary actions use `professional-blue` hues.
- Inputs and selects use brand-focused rings and rounded radii.
- Modals, tooltips, and badges follow the ink/brand palette in both light and dark modes.

## Environment Variables

Copy `.env.example` to `.env` in the project root to customize how the client connects to the API. The following variable is available:

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_URL` | _(empty)_ | Optional base URL for all API requests. Leave unset to use same-origin relative paths, or set it to an absolute URL such as `http://localhost:3000` when the backend is hosted elsewhere. |

Example `.env` snippet:

```bash
VITE_API_URL=http://localhost:3000
```
