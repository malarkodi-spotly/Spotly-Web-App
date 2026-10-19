# Workspace Rules for Spotly Web App

## Responsive & Layout Guidelines
- **Strict Mobile Preservation**: Never modify, break, or alter the existing mobile UI views (`splash-Mobile.tsx`, mobile layouts, screen styles under mobile breakpoints `< 768px` / `< sm/md`). The user is fully satisfied with the mobile appearance.
- **Desktop & Tablet Focus**: All new UI work, layout adjustments, and responsiveness enhancements must focus on desktop (`md:`, `lg:`, `xl:` standard Tailwind/CSS breakpoints or desktop-specific views like `splash-web.tsx`).
- **Component Isolation**: Use responsive conditional rendering or media query overrides (e.g., `hidden md:block` / `block md:hidden` or CSS `@media (min-width: 768px)`) so mobile screens remain completely untouched.
