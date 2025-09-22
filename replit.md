# Financial Runway Forecasting Application

## Overview

This is a comprehensive financial runway forecasting web application designed specifically for pre-seed startups. The application helps startups track their financial health, forecast cash runway scenarios, and make data-driven decisions about their financial future. It provides real-time financial insights through bank account integration, transaction categorization, budget management, and advanced forecasting models with multiple scenario planning capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library with Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with CSS variables for theming and dark mode support
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Charts**: Chart.js for financial data visualization and interactive dashboards

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API server
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy using bcrypt for password hashing
- **Session Management**: Express sessions for user authentication state
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon serverless PostgreSQL with connection pooling

### Data Storage
- **Primary Database**: PostgreSQL hosted on Neon with the following schema:
  - Users table for authentication
  - Companies table for startup profile information
  - Accounts table for linked bank accounts with Plaid integration support
  - Transactions table for financial transaction data with categorization
  - Budgets table for spending limits and alerts
  - Forecasts table for scenario planning data
  - Reports table for generated financial reports
- **ORM**: Drizzle with migrations support for schema versioning
- **Connection**: Neon serverless driver with WebSocket support for real-time connections

### Authentication & Authorization
- **Strategy**: Local authentication with username/email and password
- **Password Security**: Bcrypt hashing with salt rounds
- **Session Storage**: Express sessions (can be configured with Redis for production)
- **User Management**: Complete registration, login, and logout flow with form validation

### External Service Integrations
- **Banking Data**: Plaid API integration for secure bank account connection and transaction fetching
- **Payment Processing**: Stripe integration for subscription billing and payment handling
- **File Storage**: Prepared for document and report storage (implementation ready)
- **Email Services**: Ready for notification and alert systems

### Key Architectural Decisions

**Monorepo Structure**: The application uses a single repository with shared TypeScript types between client and server, enabling type safety across the full stack and reducing code duplication.

**Server-Side Rendering Preparation**: While currently client-side rendered, the Vite configuration and routing setup allow for easy migration to SSR when needed for SEO or performance improvements.

**Component-Driven Development**: Shadcn/ui provides a robust component system that's customizable and accessible, with Tailwind CSS enabling consistent design patterns and easy theming.

**Database-First Approach**: Drizzle ORM with PostgreSQL provides type-safe database operations while maintaining flexibility for complex financial queries and reporting.

**Real-Time Capability**: The architecture supports real-time updates through WebSocket connections for live financial data updates and collaborative features.

**Scalability Considerations**: The serverless database approach with Neon and modular component architecture allows for easy scaling as the user base grows.

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL driver for database connectivity
- **drizzle-orm**: Type-safe ORM for database operations and query building
- **express**: Web framework for REST API server
- **passport**: Authentication middleware with local strategy support
- **bcrypt**: Password hashing and security
- **@tanstack/react-query**: Server state management and caching

### UI & Styling
- **@radix-ui/***: Accessible UI primitives for form controls and interactive elements
- **tailwindcss**: Utility-first CSS framework with custom design system
- **class-variance-authority**: Type-safe styling variants
- **chart.js**: Data visualization for financial charts and analytics

### Development & Build Tools
- **vite**: Fast build tool with HMR and TypeScript support
- **tsx**: TypeScript execution for development server
- **esbuild**: Fast bundler for production builds
- **drizzle-kit**: Database migration and schema management tools

### Planned Integrations
- **Plaid API**: Bank account connection and transaction data (tokens prepared in schema)
- **Stripe API**: Payment processing and subscription management (SDK included)
- **Redis**: Session storage and caching for production scaling
- **WebSocket**: Real-time data updates and collaborative features

### Development Environment
- **Replit Integration**: Custom plugins for development banner and error handling
- **TypeScript**: Full type safety across frontend, backend, and shared code
- **ESLint/Prettier**: Code quality and formatting (configuration ready)
- **Testing Framework**: Prepared for Jest/Vitest integration for comprehensive testing