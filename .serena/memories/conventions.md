# Code Style and Conventions

## General
- **Framework**: React Functional Components with Hooks.
- **Language**: JavaScript (JSX).
- **Styling**: Tailwind CSS for utility-first styling.
- **Icons**: `lucide-react` for UI icons.

## Naming Conventions
- **Components**: PascalCase (e.g., `FloorPlan.jsx`, `Seat.jsx`).
- **Hooks**: camelCase, prefixed with `use` (e.g., `useSeatPlan.js`).
- **Functions/Variables**: camelCase.
- **Constants**: UPPER_SNAKE_CASE (e.g., `COLORS`, `WEEKDAYS`).

## Structure
- Components are located in `src/components/`.
- Custom hooks are in `src/hooks/`.
- Helper functions in `src/utils/`.
- Constants in `src/constants/`.

## State Management
- Prefer custom hooks for complex logic and state encapsulation.
- Use `localStorage` for data persistence.

## Best Practices
- Use semantic HTML where possible.
- Keep components focused and reusable.
- Ensure responsive design using Tailwind's responsive prefixes.
