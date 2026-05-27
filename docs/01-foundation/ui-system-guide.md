# UI System — Developer Guide

## What is the UI system?
AlalAI uses **shadcn/ui** — a collection of accessible, composable React components built on Base UI. Components are copied directly into `src/components/ui/` so you can customize them freely. They're styled with **Tailwind CSS v4** and use CSS variables for theming.

## Color Palette
The AlalAI brand uses a medical-inspired color scheme:

| Token | Color | Usage |
|---|---|---|
| `primary` | Sky blue (oklch 0.6 0.17 230) | Buttons, links, highlights, focus rings |
| `secondary` | Teal (oklch 0.55 0.12 190) | Secondary actions, doctor-side accents |
| `accent` | Soft blue | Hover states, subtle backgrounds |
| `destructive` | Red | Errors, cancel actions, delete buttons |
| `muted` | Light grey | Placeholder text, disabled states |
| `background` | Near-white | Page background |
| `card` | White | Card surfaces |
| `sidebar` | Dark navy | Navigation sidebar background |

These are defined as CSS variables in `src/app/globals.css` and work in both light and dark mode.

## Available shadcn Components
Located in `src/components/ui/`:

| Component | Usage |
|---|---|
| `button.tsx` | All interactive buttons (uses Base UI `render` prop instead of `asChild`) |
| `card.tsx` | Content containers with header/content/footer slots |
| `badge.tsx` | Status labels, specialization tags |
| `input.tsx` | Text input fields |
| `label.tsx` | Form labels |
| `avatar.tsx` | User profile pictures |
| `dialog.tsx` | Modal dialogs |
| `dropdown-menu.tsx` | Context menus, dropdowns |
| `form.tsx` | Form wrapper with react-hook-form integration |
| `skeleton.tsx` | Loading placeholders |
| `separator.tsx` | Horizontal/vertical dividers |
| `tabs.tsx` | Tabbed navigation |
| `select.tsx` | Dropdown selects |
| `popover.tsx` | Floating content (used by calendar) |
| `calendar.tsx` | Date picker |
| `sonner.tsx` | Toast notifications |

## How to Add New shadcn Components
```bash
npx shadcn@latest add <component-name>
```
For example: `npx shadcn@latest add alert-dialog`

## How to Use the Button (Important!)
This version uses Base UI. The `asChild` prop is replaced with `render`:

```tsx
// ✅ Correct — render as a Next.js Link
<Button render={<Link href="/login" />}>Sign in</Button>

// ❌ Wrong — asChild is not supported in this version
<Button asChild><Link href="/login">Sign in</Link></Button>
```

## Landing Page
The landing page (`src/app/page.tsx`) shows:
- Navigation bar with Sign in / Get Started buttons
- Hero section with two CTA buttons (patient / doctor)
- Feature cards for each role
- Footer

This is a public page — no authentication required.
