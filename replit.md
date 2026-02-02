# Replit Agent Configuration

## Overview

A calorie and nutrition tracking mobile-first web application targeting Arabic-speaking users in Saudi Arabia. The app allows users to log meals, track macronutrients (calories, protein, carbs, fats), monitor water intake, and browse nutritional information from popular Saudi restaurant chains. Features AI-powered meal estimation using OpenAI integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui components (New York style)
- **Animations**: Framer Motion for smooth transitions
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Design**: REST endpoints defined in shared routes contract (`shared/routes.ts`)
- **Authentication**: Replit Auth (OpenID Connect) with Passport.js
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple

### Data Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Drizzle Kit with `db:push` command

### Key Design Patterns
- **Shared Types**: Schema and route definitions in `shared/` directory used by both client and server
- **API Contract**: Strongly-typed route definitions with Zod schemas for input validation and response types
- **Storage Interface**: Abstract `IStorage` interface in `server/storage.ts` for data access
- **Component Structure**: Reusable UI components in `client/src/components/ui/`, feature components organized by domain

### RTL Support
The application is designed for Arabic (RTL) layout with `dir="rtl"` on root elements and Arabic locale support via date-fns.

## External Dependencies

### Database
- **PostgreSQL**: Primary data store accessed via `DATABASE_URL` environment variable
- Tables: users, sessions, goals, meals, water_intake, restaurants, menu_items, conversations, messages

### AI Services
- **OpenAI API**: Used for meal calorie estimation via AI Integrations
  - Configured through `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL`
  - Supports text chat, image generation, and voice processing

### Authentication
- **Replit Auth**: OAuth/OIDC authentication
  - Requires `ISSUER_URL`, `REPL_ID`, and `SESSION_SECRET` environment variables
  - User sessions stored in PostgreSQL `sessions` table

### Third-Party UI Libraries
- Radix UI primitives for accessible components
- Lucide React for iconography
- Recharts for data visualization
- Embla Carousel for carousel components