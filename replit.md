# Life RPG

## Overview
A gamified daily quest application built with Next.js 16, React 19, and Tailwind CSS. The app features a "Quest Board" where users can generate daily quests, earn XP, and unlock achievements that are saved to a PostgreSQL database.

## Project Structure
- `app/` - Next.js App Router pages and components
  - `page.tsx` - Main quest board page
  - `actions.ts` - Server actions for AI quest generation
  - `achievement-actions.ts` - Server actions for database achievements
  - `layout.tsx` - Root layout
  - `types.ts` - TypeScript type definitions
  - `globals.css` - Global styles with Tailwind
- `lib/` - Shared library code
  - `db.ts` - Database connection
  - `schema.ts` - Drizzle ORM schema
- `public/` - Static assets
- `next.config.ts` - Next.js configuration
- `drizzle.config.ts` - Drizzle ORM configuration

## Tech Stack
- Next.js 16 with App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Google Generative AI SDK
- PostgreSQL database
- Drizzle ORM

## Database
The app uses PostgreSQL for persistent storage of achievements. Schema is managed with Drizzle ORM.

To push schema changes:
```bash
npx drizzle-kit push
```

## Development
Run the development server:
```bash
npm run dev -- -p 5000 -H 0.0.0.0
```

## Build & Deploy
```bash
npm run build
npm run start -- -p 5000 -H 0.0.0.0
```

## Configuration
- The app is configured to run on port 5000
- Host set to 0.0.0.0 for Replit compatibility
- Next.js configured to allow all dev origins for proxy support
- Database connection via DATABASE_URL environment variable

## Running with Docker (outside Replit)

To run this project locally with Docker:

1. Copy `.env.example` to `.env` and add your Google API key:
   ```bash
   cp .env.example .env
   ```

2. Start the database and app:
   ```bash
   docker-compose up -d
   ```

3. Push the database schema:
   ```bash
   docker-compose exec app npx drizzle-kit push
   ```

4. Access the app at http://localhost:5000

To stop:
```bash
docker-compose down
```

To stop and remove data:
```bash
docker-compose down -v
```
