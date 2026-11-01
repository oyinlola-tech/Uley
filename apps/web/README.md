# Uley web client

The first frontend surface is a student-first landing page for discovering verified off-campus housing. It is built with Next.js, React, TypeScript, and Tailwind CSS.

## Run the web app

```bash
cd apps/web
npm install
npm run dev
```

Open `http://localhost:3000` to view the landing page. `npm run build` creates a production build, and `npm start` serves it.

## Account pages

The onboarding pages at `/onboarding`, `/onboarding/student`, and `/onboarding/landlord`, plus `/login`, use the Fastify authentication API. The web app proxies `/api/v1/*` to the API server so browser requests and its secure refresh cookie stay same-origin. Set `UELEY_API_ORIGIN` to the API server origin when it is not `http://localhost:3001`; for local development, run the API on port `3001` and the web app on port `3000`. Copy `.env.example` to `.env.local`. `NEXT_PUBLIC_UELEY_API_ORIGIN` supplies the API origin for WebSocket connections; set it to the externally reachable API origin in production, and configure the TLS ingress to forward WebSocket upgrades.

## Product and privacy pages

The `/how-it-works` page documents the current pilot journey, data flow, and features still in development. The `/privacy`, `/cookies`, and `/terms` pages explain current platform practices and limitations. The privacy notice flags operator identity, privacy contact, provider list, and retention schedule as pre-launch items because those are not defined in this repository. The cookie notice records a necessary-only choice in browser local storage; optional analytics and advertising cookies are not active.

## Use the design.md toolkit

`DESIGN.md` is the visual source of truth for Uley. Its prose explains the design intent; its YAML defines colors, typography, spacing, shapes, and component tokens. The toolkit is a CLI and token format, not a component library: it validates the brief and exports tokens, while the frontend components implement the actual interface.

The CLI is installed as a development dependency in this app. These scripts are available:

```bash
npm run design:lint
npm run design:tokens
```

`design:lint` checks the file structure, token references, and contrast pairs. `design:tokens` exports the YAML tokens to Tailwind CSS v4 theme variables in `src/app/theme.css`. The app imports that file from `globals.css`, so the palette and typography tokens are available to the page styles.

To add the toolkit to another npm project, run `npm install --save-dev @google/design.md`, then use `npx @google/design.md lint DESIGN.md` and `npx @google/design.md export --format css-tailwind DESIGN.md`.
