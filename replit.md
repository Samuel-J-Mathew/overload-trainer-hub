# Overload Fitness Coach Dashboard

## Overview

This is a full-stack fitness coaching platform built with React frontend and Express.js backend. The application allows fitness coaches to manage clients, track their progress, create training programs, and handle nutrition plans. It uses Firebase for authentication and data storage, with plans to migrate to a PostgreSQL database using Drizzle ORM.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state, React Context for authentication
- **UI Components**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom design tokens
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: Currently using Firebase Firestore, with planned migration to PostgreSQL
- **ORM**: Drizzle ORM (configured but not yet implemented)
- **Authentication**: Firebase Auth
- **Session Management**: Planned implementation with connect-pg-simple

### Data Storage Strategy
- **Current**: Firebase Firestore for all data persistence
- **Planned**: PostgreSQL with Drizzle ORM for structured data
- **File Storage**: Firebase Storage for images and documents

## Key Components

### Authentication System
- Firebase Authentication for user management
- React Context provider for auth state management
- Protected routes with loading states
- Email/password authentication flow

### Client Management
- Client profiles with personal information and goals
- Check-in tracking with metrics and progress photos
- Client-specific data organization in Firebase subcollections

### Form System
- Dynamic questionnaire builder
- Global form templates for onboarding
- Check-in forms with various input types (text, scales, ratings)
- Form validation using React Hook Form and Zod

### Training Module
- Program creation and management
- Workout templates and exercises
- Client-specific training assignments

### Nutrition Module
- Meal planning and nutrition tracking
- Food database management
- Calorie and macronutrient monitoring

### Task Management
- Coach task tracking and organization
- Due date management and completion tracking

## Data Flow

### Client Data Structure
```
coaches/{coachId}/clients/{clientId}
├── profile data
├── checkins/{checkinId}
├── workouts/{workoutId}
├── nutrition/{nutritionLogId}
├── metrics/{metricId}
└── photos/{photoId}
```

### Authentication Flow
1. User logs in via Firebase Auth
2. Auth state stored in React Context
3. Protected routes check authentication status
4. User data accessed via Firebase Firestore

### Data Synchronization
- Real-time updates using Firebase onSnapshot listeners
- Optimistic updates for better user experience
- Error handling and retry mechanisms

## External Dependencies

### Firebase Services
- **Authentication**: User management and security
- **Firestore**: NoSQL database for current data storage
- **Storage**: File uploads and media management

### UI and Styling
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling framework
- **Lucide React**: Icon library

### Development Tools
- **TypeScript**: Type safety and developer experience
- **Vite**: Fast development server and build tool
- **React Hook Form**: Form state management
- **Zod**: Schema validation

## Deployment Strategy

### Development Environment
- Replit-based development with live reload
- Environment variables for Firebase configuration
- Development server on port 5000

### Production Build
- Vite build process for optimized frontend assets
- Express server compilation with esbuild
- Static file serving for production

### Database Migration Plan
- Phase 1: Current Firebase Firestore implementation
- Phase 2: Dual-write to both Firebase and PostgreSQL
- Phase 3: Read from PostgreSQL, write to both
- Phase 4: Full migration to PostgreSQL with Drizzle ORM

## Recent Changes
- June 20, 2025: Enhanced Forms system with functional Preview and Schedule features
  - Removed "Reposition" button from Check-ins and Questionnaires builders
  - Implemented interactive preview modals showing form appearance to clients
  - Added scheduling functionality with frequency, days, time, and date range options
  - Created Check-in Templates system with "Weekly Check-In" and "Daily Check-In" templates
  - Updated button colors throughout platform to black for consistent dark theme
  - Added Templates button to Check-ins tab (similar to Questionnaires)
- January 20, 2025: Built comprehensive Training page with Programs, Workouts, and Exercises tabs
  - Implemented drag-and-drop workout builder with exercise library
  - Added Firebase integration for training data under coach accounts
  - Created program builder with workout days and exercise management
  - Fixed timestamp handling for newly created programs
- June 20, 2025: Initial setup with Firebase authentication and client management

## User Preferences

Preferred communication style: Simple, everyday language.