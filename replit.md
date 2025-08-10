# Overview

CodedSwitch is a revolutionary AI-powered web application that embodies the triple entendre of its name - representing code development, state switching, and adaptive communication. The platform bridges the gap between coding and music creation. The platform offers an integrated development environment where developers can translate code between programming languages, generate musical compositions from code structures, create beats and melodies, scan code for security vulnerabilities, write lyrics, upload and analyze existing songs, and intelligently layer complementary instruments - all powered by AI assistance. The application combines a modern React frontend with an Express.js backend, featuring advanced multi-layered audio synthesis for realistic instrument sounds, comprehensive AI integrations, dynamic instrument layering, song upload capabilities, and a studio-grade interface designed for both developers and musicians.

## Recent Changes (January 2025)
- **Audio Engine Overhaul**: Completely redesigned audio synthesis for professional-quality drum and instrument sounds
- **Enhanced Drum Synthesis**: Multi-oscillator kick drums (1.2s), layered snare with rattle simulation (0.4s), realistic clap bursts, shimmer hi-hats, and fuller tom sounds (0.8s)
- **Professional Drum Volume Enhancement** (January 9, 2025): Boosted all drum volumes to professional studio levels - kick 1.8x, snare 1.4x, hihat 1.2x, tom 1.4x, clap 1.3x, bass 2.0x, matching crash cymbal quality
- **Drum Sound Quality Fixes** (January 9, 2025): Fixed crash cymbal from "UFO" oscillators to realistic filtered noise, extended bass drum duration to 1.2s, improved clap with dual filtering
- **Improved Guitar Synthesis**: Harmonics, attack transients, and body resonance for authentic plucked string sounds
- **Pattern Stability**: Fixed beat maker pattern mapping issues and added robust error handling
- **Interface Improvements**: Resolved audio engine initialization and playback consistency
- **Complete Interface Redesign**: Added comprehensive labeling, instructions, and user guidance throughout Beat Maker
- **Navigation Enhancement**: Expanded sidebar with clear tool names, descriptions, and current tool indicator
- **Scrolling Implementation**: Fixed layout constraints and added smooth scrolling with custom dark theme scrollbars
- **User Experience**: Added step-by-step instructions, tooltips, and visual guides for all controls
- **AI-Powered Dynamic Instrument Layering** (NEW): Intelligent instrument layering system that analyzes current arrangements and adds complementary instrumental parts using AI (January 8, 2025)
- **Song Upload & Analysis** (NEW): Upload existing audio files (MP3, WAV, M4A, OGG) for AI analysis and integration with other studio tools (January 8, 2025)
- **Real-Time Beat Editing** (FIXED): Beat Maker now supports live pattern editing during playback with instant audio feedback and visual timing indicators (January 8, 2025)
- **Piano Sound Refinement** (January 9, 2025): Fixed piano low notes with frequency-specific filtering and wave types - high notes now sound "way closer" to realistic
- **Organ Complete Redesign** (SUCCESS - January 9, 2025): Completely replaced buzzy electronic organ with authentic Hammond drawbar system using pure sine waves, proper harmonic ratios, and cathedral reverb - user confirmed "you nailed the organ"
- **Piano Roll Note Editing** (NEW - January 9, 2025): Added drag-to-resize functionality for note length editing with visual resize handles and snap-to-grid behavior
- **Complete Sustain Implementation** (SUCCESS - January 9, 2025): Added proper ADSR envelopes with strong sustain to ALL instruments (piano, violin, guitar, organ, bass) - all instruments now maintain proper sustained notes with attack, decay, sustain, and release phases
- **Sustain Control Toggle** (NEW - January 9, 2025): Added user-controlled sustain toggle in Melody Composer allowing musicians to switch between sustained notes (piano 75%, guitar 65%) and percussive notes (piano 20%, guitar 15%) for creative flexibility
- **Click-and-Hold Note Playback** (COMPLETED - January 9, 2025): Implemented immediate note playback on mousedown with intelligent sustain - quick clicks play without sustain, holding for 150ms+ triggers sustained playback with user's sustain settings - NOW WORKS ON ALL PIANO KEYS AND PIANO ROLL
- **Universal Mousedown System** (NEW - January 9, 2025): All piano keys (white and black) now respond to mousedown with hold-for-sustain behavior - quick clicks are percussive, held clicks (150ms+) add sustain - includes onMouseLeave handling for edge cases
- **Component Isolation Architecture** (PROGRESS - January 9, 2025): Drum sounds completely isolated with unique variables in audio engine - beat maker and melody composer now have separate interaction handlers to prevent interference
- **AI Melody Format Fix** (NEW - January 9, 2025): Fixed AI melody generation to separate note names from octaves (C, D, E instead of C4, D4, E4) and added octave variations (3, 4, 5) for more interesting AI-generated melodies
- **Multi-Track AI Generation** (COMPLETED - January 9, 2025): AI now has access to ALL instruments simultaneously through multi-track generation system - creates orchestral compositions across piano, guitar, violin, flute, trumpet, bass, and organ instead of single instrument limitation
- **Universal Realistic Audio Support** (COMPLETED - January 9, 2025): Expanded realistic soundfont system to support ALL instruments with dedicated General MIDI mappings - piano, guitar, violin, flute, trumpet, bass, organ, and comprehensive instrument fallback logic
- **MIDI Controller Support** (NEW - January 9, 2025): Added Web MIDI API integration for real-time hardware input from physical MIDI pads and keyboards - supports note on/off, velocity sensitivity, channel-based instrument mapping, and live performance capabilities

# User Preferences

Preferred communication style: Simple, everyday language.

**CRITICAL: BUILD PROTECTION PROTOCOL**
- SUCCESSFUL BUILD ACHIEVED - Protect at all costs
- package.json, vite.config.prod.ts, server/index.prod.ts, render.yaml are LOCKED
- Only modify source files: client/src/*, server/routes.ts, server/services/*, shared/schema.ts
- Always test locally before GitHub push: npm run build && npm start
- Use git tags for working state backups before major changes
- Never edit production configuration files without explicit permission
- Follow DEPLOYMENT_BEST_PRACTICES.md for all future changes

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
The audio engine features advanced multi-layered synthesis for realistic instrument and drum sounds. Each drum sound uses multiple oscillators and noise layers with natural decay envelopes: kick drums (1.2s sustain), snare (0.4s with rattle simulation), enhanced clap with burst layers, improved hi-hats with shimmer, and fuller tom sounds (0.8s). Guitar synthesis includes harmonics, attack transients, and body resonance for authentic plucked string sounds. The system supports real-time playback with live pattern editing, visual timing indicators, mixer functionality with volume controls, and transport controls for comprehensive beat sequencing.

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