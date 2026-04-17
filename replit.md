# Xenon Code (Trinket)

## Overview
A browser-based Python learning environment for GCSE students. Users can write, run, and save Python code directly in the browser. Includes guided activities like Parsons Problems and a class management system for teachers and students.

## Tech Stack
- **Frontend:** React 19 + Vite 8
- **Styling:** Tailwind CSS + Framer Motion
- **Editor:** Monaco Editor (@monaco-editor/react)
- **Python Execution:** Pyodide (WebAssembly-based Python runtime)
- **Backend/Auth/DB:** Supabase
- **State Management:** Zustand
- **Routing:** React Router DOM

## Project Structure
```
src/
  components/   # React UI components (AuthGate, ClassDashboard, XenonIDE, ParsonsProblem, etc.)
  lib/          # Utilities (pyodide.js, supabase.js, gcseQuestions.js)
  store/        # Zustand store (useAppStore.js)
  App.jsx       # Main app layout and routing
  main.jsx      # React entry point
database/
  schema.sql    # Supabase PostgreSQL schema
public/         # Static assets
```

## Environment Variables Required
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

## Running the App
- `npm run dev` - Start development server on port 5000
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Replit Setup
- Vite dev server configured to run on `0.0.0.0:5000`
- `allowedHosts: true` set for proxy compatibility
- Workflow: "Start application" runs `npm run dev`
