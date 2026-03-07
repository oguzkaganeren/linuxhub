## 2024-03-03 - TitleBar Accessibility Overhaul
**Learning:** Found a consistent pattern where critical system interaction buttons (minimize, maximize, close, settings, theme toggle) in the main TitleBar component were entirely icon-based without any accessible names, making the application difficult to navigate for screen reader users. The application relies heavily on `lucide-react` icons for navigation and actions.
**Action:** When adding or reviewing new icon-only buttons globally across the application, ensure `aria-label` or equivalent accessible text is included as a mandatory requirement, especially for window management and high-level navigation controls.

## 2024-03-24 - Missing Required Field Indicators in Forms
**Learning:** Custom input rendering functions (`renderInput` in `AddPrinterModal`) lacked visual indicators (`*`) and programmatic indicators (`aria-required`) for required fields, reducing both visual and screen reader accessibility. Also, icon-only buttons lacked ARIA labels.
**Action:** Always ensure that custom form input abstractions explicitly pass and render visual and ARIA attributes for required fields, and that icon-only interactive elements have clear `aria-label`s.
