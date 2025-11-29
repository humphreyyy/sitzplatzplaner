# Outstanding Issues (WIP Save)

The application is currently in a broken state. The following issues need to be resolved:

## Build Status
- `npm run build` fails due to syntax errors.

## src/SeatPlanerDittmann.jsx
- **Syntax Errors**: There are multiple JSX structure errors, specifically around the `renderPropertiesPanel` and `FloorPlan` integration.
- **Lint Errors**:
  - Line 564: "JSX expressions must have one parent element."
  - Line 663: Unexpected token `>`.
  - Line 665: Missing closing tag for JSX fragment.
  - Lines 684-685: Expression expected.
  - Lines 799, 1012: Declaration or statement expected.
- **Structure**: The `editor` view conditional rendering block appears to be malformed or incorrectly nested.
- **Code Duplication**: There may still be remnants of pasted code inside other blocks (e.g., `renderPropertiesPanel` content inside button handlers or other views).

## Next Steps
1. Fix the JSX nesting in `SeatPlanerDittmann.jsx`.
2. Ensure `FloorPlan` is correctly passed all required props.
3. Verify `renderPropertiesPanel` is defined at the component level and not nested inside other renders incorrectly.
4. Run `npm run build` to verify fixes.
