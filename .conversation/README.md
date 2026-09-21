# Household Hub

A responsive household coordination app built with Next.js, TypeScript, Tailwind CSS, PostgreSQL, Drizzle ORM, and Clerk.

## Included

- Google and email authentication through Clerk
- Household creation and join-code membership
- Household member list
- Shared tasks with due dates, status, and multiple assignees
- Projects with project-specific tasks
- Server-side membership checks for all household reads and writes

## Intentionally deferred

Vendors, project vendors, attachments, comments, activity events, notifications, calendar integrations, AI features, and payments.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add Clerk publishable and secret keys.
3. Add a PostgreSQL `DATABASE_URL`.
4. In Clerk, enable Google and email sign-in.
5. Install packages with `npm install`.
6. Create the database schema with `npm run db:push`.
7. Start the app with `npm run dev`.

## Security model

`requireHouseholdMember(householdId)` verifies the signed-in Clerk user has a matching `household_members` row before household data is read. Mutations also include the household ID in their update conditions and verify that referenced projects and assignees belong to the same household.

Clerk owns credentials and authentication. The local `users` table stores only the application profile linked by `clerk_user_id`.