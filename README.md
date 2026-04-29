# EditorialCommissionDesk

This repository is prepared for deployment to Vercel. It contains a Vite + React frontend and a Hono-based Node server routed under `/api`.

Quick setup

1. Copy environment variables from `.env.example` into Vercel project settings (or create a `.env` locally for development).
2. Connect this GitHub repository to Vercel (https://vercel.com/new) and ensure the following settings:
   - Build Command: `npm run build`
   - Output Directory: `dist/public`
3. Add required Environment Variables in Vercel (see `.env.example`).

Local build & preview

```bash
npm install
npm run build
npm run preview
```

Notes

## CI / Auto Deploy

- This repository includes a GitHub Actions workflow at `.github/workflows/vercel-deploy.yml` which builds and deploys to Vercel on pushes to `main`.
- Before the workflow can deploy, set the following repository secrets in GitHub (Repository -> Settings -> Secrets):
  - `VERCEL_TOKEN` — a Vercel personal token with Deploy permissions.
  - `VERCEL_ORG_ID` — your Vercel organization ID.
  - `VERCEL_PROJECT_ID` — the Vercel project ID for this repository.
- You can obtain `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` from the Vercel dashboard for your project, or by using the Vercel CLI.

- The server-side Hono app is served via `api/[[...all]].ts` for Vercel compatibility.
- If you need to bundle the server locally, run `npm run build:server` which uses `esbuild` to produce `dist/boot.js`.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
