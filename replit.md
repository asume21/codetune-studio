# Overview

CodeTune Studio is a revolutionary web application that bridges the gap between coding and music creation. The platform offers an integrated development environment where developers can translate code between programming languages, generate musical compositions from code structures, create beats and melodies, scan code for security vulnerabilities, and write lyrics - all powered by AI assistance. The application combines a modern React frontend with an Express.js backend, featuring real-time audio processing, comprehensive AI integrations, and a studio-grade interface designed for both developers and musicians.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side is built with React 18 using TypeScript and follows a component-based architecture. The application uses Vite as the build tool for fast development and optimized production builds. State management is handled through React hooks and context, with TanStack Query for server state management and caching. The UI is built with shadcn/ui components and Radix UI primitives, styled with Tailwind CSS using a custom dark theme optimized for studio environments.

The audio system is implemented using the Web Audio API with a custom AudioEngine class that handles real-time audio synthesis, note playback, and drum sound generation. The routing is managed by Wouter for lightweight client-side navigation.

## Backend Architecture
The server follows a RESTful API design built on Express.js with TypeScript. The architecture separates concerns through dedicated service layers for OpenAI integrations, audio processing, and data storage. The server implements middleware for request logging, error handling, and JSON parsing.

The storage layer uses an interface-based design (IStorage) to abstract database operations, supporting user management, project storage, code translations, beat patterns, melodies, vulnerability scans, and lyrics. This allows for flexible database implementations while maintaining consistent API contracts.

## Database Design
The application uses PostgreSQL with Drizzle ORM for type-safe database operations. The schema includes tables for users, projects, code translations, beat patterns, melodies, vulnerability scans, and lyrics. Each entity supports UUID primary keys and includes proper foreign key relationships for data integrity.

The database is configured to work with Neon Database through environment variables, with automatic migration support through Drizzle Kit.

## AI Integration Architecture
The system integrates OpenAI's GPT-4o model for multiple AI-powered features including code translation between programming languages, beat pattern generation, melody composition, security vulnerability scanning, lyrics generation, and intelligent assistant functionality. All AI interactions are server-side only for security, with the client making API requests to backend endpoints that proxy to OpenAI.

## Audio Processing Pipeline
The audio engine supports real-time synthesis with oscillator-based note generation, drum sample playback, and mixer functionality with volume controls, panning, and basic EQ. The system includes transport controls for play/pause/stop functionality and supports multiple audio tracks with individual channel controls.

## Development Workflow
The application supports both development and production modes with Vite's development server providing hot module replacement. The build process uses esbuild for server bundling and Vite for client bundling, with separate output directories for clean deployment.

# External Dependencies

## Core Frameworks
- React 18 with TypeScript for the frontend application framework
- Express.js for the backend REST API server
- Vite for frontend build tooling and development server

## Database Integration
- PostgreSQL as the primary database (configured for Neon Database)
- Drizzle ORM for type-safe database operations and migrations
- @neondatabase/serverless for serverless PostgreSQL connections

## AI Services
- OpenAI API (GPT-4o model) for code translation, music generation, security scanning, and chat assistance
- Configured to use environment variables for API key management

## UI Component Libraries
- shadcn/ui component library for consistent design system
- Radix UI primitives for accessible component foundations
- Tailwind CSS for utility-first styling with custom studio theme

## Audio Processing
- Web Audio API (browser native) for real-time audio synthesis and processing
- Custom audio engine implementation for studio-grade audio controls

## State Management
- TanStack Query for server state management and caching
- React hooks and context for client-side state management

## File Upload (Configured)
- Google Cloud Storage integration for file handling
- Uppy file upload components for drag-and-drop functionality

## Development Tools
- TypeScript for type safety across the full stack
- ESLint and Prettier for code quality and formatting
- Replit-specific development plugins for enhanced development experience

## Additional Utilities
- Wouter for lightweight client-side routing
- class-variance-authority and clsx for conditional styling
- Zod for runtime type validation and schema definition
- Lucide React for consistent icon library