# Life RPG

## Overview
A gamified daily quest application built with Next.js 16, React 19, and Tailwind CSS. The app features a "Quest Board" where users can generate daily quests and earn XP.

## Project Structure
- `app/` - Next.js App Router pages and components
  - `page.tsx` - Main quest board page
  - `actions.ts` - Server actions
  - `layout.tsx` - Root layout
  - `types.ts` - TypeScript type definitions
  - `globals.css` - Global styles with Tailwind
- `public/` - Static assets
- `next.config.ts` - Next.js configuration

## Tech Stack
- Next.js 16 with App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Google Generative AI SDK

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
