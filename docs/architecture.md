# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Use React 19 components under `octofit-tracker/frontend/src/components` and the shared API client in `src/api/client.ts`. Each capability will expose loading, empty, success, and accessible error states through `/activities`, `/teams`, `/leaderboard`, and `/workouts` routes.
- Logic tier decision: Keep HTTP concerns in Express routes and validation, aggregation, points, and recommendation behavior in explicit functions in `octofit-tracker/backend/src/services/octofitService.ts`. Return 400-series errors for client or missing-resource failures instead of allowing Mongoose cast errors to become 500 responses.
- Data tier decision: Use Mongoose schemas with required fields and sensible defaults, stable seed records with upserts, and MongoDB references for users, teams, activities, and workouts. Seeding must preserve unrelated records and reconcile seeded demo users' team memberships.
- Activity tracking approach: Validate `userId`, `teamId`, `type`, and `minutes` before database writes; confirm both references exist and are valid ObjectIds; store the submitted user/team/type/minutes plus computed positive points and an `occurredAt` timestamp. List activities without exposing implementation details.
- Team management approach: Validate required `name` and `mascot` data in the service or schema, default `members` to an empty array, and preserve submitted team and member IDs in create and list responses.
- Leaderboard approach: Aggregate activity `points` by team, sort totals highest first, and attach a sequential 1-based rank to every team entry. Only teams that have activities need not be excluded if the contract calls for their no-score behavior; the seeded or tested data determines output coverage.
- Workout suggestions approach: Resolve the URL-decoded user email, reject unknown users with a 404, and rank workout suggestions from recent activity types and the user's fitness goal. Put an explicit focus and reason on the first suggestion.

## Test plan

Run the narrow contract for each tier before expanding scope, so failures identify the owning layer.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` - A failure indicates missing schema validation/defaults, broken seed relationships, or non-idempotent seeding.
- API command: `npm run test:api --prefix octofit-tracker/backend` - A failure indicates route forwarding, service validation, reference handling, aggregation, or recommendation behavior is incomplete.
- Frontend command: `npm test --prefix octofit-tracker/frontend` - A failure indicates missing API integration, incorrect rendering, inaccessible states, or an incorrect workout email request.
- Backend build command: `npm run build --prefix octofit-tracker/backend` - A failure indicates TypeScript errors or configuration issues in the backend implementation.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` - A failure indicates TypeScript, React, routing, or Vite build issues.
- Exercise validation command: `node .github/scripts/validate-exercise.mjs && node --test tests/exercise-validation.test.mjs` - Failures indicate unsafe metadata, workflow, protected-contract, or scaffold changes.
