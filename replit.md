# Household Hub

Household Hub is a responsive household coordination app for shared tasks, members, and home projects.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/household-hub run dev` — run the web app
- `pnpm run typecheck` — full workspace typecheck
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API clients after OpenAPI changes
- `pnpm --filter @workspace/db run push` — push development schema changes

## Stack

- React + Vite + TypeScript + Tailwind CSS
- Express API with OpenAPI-generated clients and Zod validators
- PostgreSQL + Drizzle ORM
- Replit-managed Clerk authentication

## Where things live

- `artifacts/household-hub` — responsive web application
- `artifacts/api-server/src/routes/households.ts` — authenticated household API
- `lib/api-spec/openapi.yaml` — API contract
- `lib/db/src/schema/household.ts` — database schema

## Architecture decisions

- Every household read or write checks the signed-in user's membership on the server.
- Tasks have a `household_id` and optional `project_id`; project tasks remain visible in household-wide task views.
- Multiple assignees are modeled through `task_assignees`.
- Clerk owns authentication; the local `users` table stores application profile data keyed by Clerk user ID.

## Product

- Create or join a household with a join code
- View household members
- Create and complete assigned tasks with due dates
- Create projects and manage their tasks

## Deferred

Do not add vendors, contractor comparison, attachments, comments, activity events, notifications, calendar integration, AI features, or payments unless requested.