# Project Overview: SeatPlaner Dittmann

## Purpose
**SeatPlaner Dittmann** is an interactive tool for seat management and weekly planning for Dittmann+Ingenieure. It allows for visual planning of rooms and seats, management of student attendance, and automatic assignment of seats.

## Tech Stack
- **Frontend Framework**: React (Vite)
- **Styling**: Tailwind CSS
- **Icons**: lucide-react
- **Desktop Wrapper**: Electron
- **Language**: JavaScript/JSX

## Key Features
- **Floor Plan Editor**: Drag-and-drop interface for rooms and seats.
- **Student Management**: Manage students and their attendance days.
- **Weekly Planning**: Auto-assignment of seats, manual overrides, conflict detection.
- **Export**: PDF export and print view.

## Architecture
- **Entry Point**: `src/SeatPlanerDittmann.jsx` (and `electron/main.cjs` for Electron)
- **State Management**: Custom React Hooks (`useSeatPlan`, `useStudents`, `useSelection`)
- **Persistence**: `localStorage` (Key: `dittmann_seatplaner_v2`) via `apiService` (implied)
