# Project Memory: SeatPlaner Dittmann

## Overview
**SeatPlaner Dittmann** is a React-based web application designed to manage seat assignments for students or employees in an office environment. It allows for visual planning of rooms and seats, management of student attendance, and automatic assignment of seats based on availability.

## Key Features
1.  **Floor Plan Editor**:
    -   Drag-and-drop interface for positioning rooms and seats.
    -   Configurable room properties (name, seat count).
    -   Configurable seat properties (features like dual monitors, window seat, standing desk).
2.  **Student Management**:
    -   Add/Remove students.
    -   Define attendance days (Mo-Fr) for each student.
3.  **Planning & Assignment**:
    -   Weekly view with date navigation.
    -   **Auto-Assignment**: Algorithm to automatically assign seats to present students, respecting existing assignments.
    -   Manual assignment override.
    -   Visual indicators for occupied/free seats and conflicts.
4.  **Export**:
    -   Print-optimized view for generating PDF reports of the daily seating plan.

## Technical Architecture
-   **Framework**: React (Functional Component).
-   **Styling**: Tailwind CSS.
-   **Icons**: `lucide-react`.
-   **State Management**: Custom Hooks (`useSeatPlan`, `useStudents`, `useSelection`).
-   **Persistence**: `localStorage` (Key: `dittmann_seatplaner_v2`) via `apiService`.

## Project Structure
-   `src/SeatPlanerDittmann.jsx`: Main application entry point and layout.
-   `src/components/`: UI Components.
    -   `FloorPlan.jsx`: Canvas for rooms and seats.
    -   `Room.jsx`: Individual room component.
    -   `Seat.jsx`: Individual seat component.
    -   `PropertiesPanel.jsx`: Sidebar for editing properties.
    -   `StudentManager.jsx`: Student list and attendance management.
    -   `WeekView.jsx`: Weekly overview.
    -   `PrintView.jsx`: Print-optimized view.
-   `src/hooks/`: Custom React Hooks.
    -   `useSeatPlan.js`: Manages rooms, seats, assignments logic.
    -   `useStudents.js`: Manages student data.
    -   `useSelection.js`: Manages selection state.
-   `src/utils/helpers.js`: Helper functions (`generateId`, `formatDate`, etc.).
-   `src/constants/index.js`: Constants (`COLORS`, `WEEKDAYS`, etc.).

## Data Model

### Rooms
```javascript
{
  id: string,
  x: number,      // X coordinate on canvas
  y: number,      // Y coordinate on canvas
  w: number,      // Width
  h: number,      // Height
  name: string,   // Room label
  seatCount: number
}
```

### Seats
```javascript
{
  id: string,
  x: number,
  y: number,
  roomId: string, // Linked room ID
  features: string[] // e.g., ['dual_monitor', 'window']
}
```

### Students
```javascript
{
  id: string,
  name: string,
  days: string[] // e.g., ['Mo', 'Mi']
}
```

### Assignments
```javascript
{
  [dateISOString]: {
    [seatId]: studentId
  }
}
```

## Key Algorithms
-   **`autoAssignSeats`**: Iterates through present students for the current day. If not already assigned, finds the first available free seat and assigns it. Alerts if students are left without seats.
-   **`handleRoomUpdate`**: When seat count changes, automatically adds or removes seats in a grid layout within the room.
