# Design Consistency Guide

This document is the single source of truth for all frontend design patterns, components, and styling. All future pages must adhere to these standards to ensure a consistent, Apple-level premium experience across the application.

## 1. Design Principles

- **Consistency over creativity**: Do not invent new patterns for single pages.
- **Reuse before creating**: Always check if a component or style already exists.
- **Predictable interactions**: Similar actions should have similar results and animations.
- **Minimal visual noise**: Use whitespace effectively to separate content.
- **Accessibility first**: Ensure proper contrast, ARIA labels, and keyboard navigation.
- **Mobile-first responsive design**: Layouts must gracefully scale down.
- **Clean enterprise-grade appearance**: Professional and polished.
- **No flashy animations**: Use subtle micro-interactions instead.
- **No unnecessary gradients**: Use solid colors or predefined subtle theme gradients.
- **No AI-generated looking UI**: Ensure layouts feel hand-crafted and deliberate.

---

## 2. Page Layout Standards

### Page Container
- **Max Width**: 1440px
- **Content Width**: 1280px
- **Horizontal Padding**:
  - Mobile: `16px` (`px-4`)
  - Tablet: `24px` (`px-6`)
  - Desktop: `32px` (`px-8`)

*Tailwind Pattern*: `w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`

### Section Spacing
- **Section Gap**: 32px (`gap-8` or `mb-8`)
- **Card Gap**: 24px (`gap-6` or `mb-6`)
- **Form Group Gap**: 20px (`gap-5` or `space-y-5`)
- **Field Gap**: 16px (`gap-4` or `space-y-4`)

**Strict Spacing Scale (Pixels)**:
`4`, `8`, `12`, `16`, `20`, `24`, `32`, `40`, `48`, `64`

*Rule*: No arbitrary spacing values (e.g., `15px`, `18px`, `22px`) allowed.

---

## 3. Typography Standards

We use a consistent typography hierarchy. Always use these exact pairings of size and weight.

### Page Title
- Size: 32px (`text-3xl`)
- Weight: Semibold (`font-semibold`)

### Section Title
- Size: 24px (`text-2xl`)
- Weight: Semibold (`font-semibold`)

### Card Title
- Size: 18px (`text-lg`)
- Weight: Medium (`font-medium`)

### Body Text
- Size: 14px (`text-sm`)
- Weight: Normal (`font-normal`)

### Small Text
- Size: 12px (`text-xs`)
- Weight: Normal (`font-normal`)

### Label Text
- Size: 13px (`text-[13px]`)
- Weight: Medium (`font-medium`)

### Helper Text
- Size: 12px (`text-xs`)
- Weight: Normal (`font-normal`)
- Color: `text-gray-500`

---

## 4. Color System

No hardcoded hex values in components. All colors must use these semantic equivalents.

- **Background**: `bg-gray-50` for app background, or the standard `CloudsBackground`.
- **Surface**: `bg-white` or `bg-white/80 backdrop-blur-md` for glassmorphism.
- **Border**: `border-gray-200` (default) or `border-white/80` (for glass surfaces).
- **Primary**: `text-blue-600`, `bg-blue-600` (hover: `blue-700`).
- **Secondary**: `text-gray-900`, `bg-gray-900` (hover: `black`).
- **Success**: `text-green-700`, `bg-green-100`, `border-green-200`.
- **Warning**: `text-amber-700`, `bg-amber-100`, `border-amber-200`.
- **Error**: `text-red-700`, `bg-red-100`, `border-red-200`.
- **Disabled**: `opacity-60` with `bg-gray-50` or `text-gray-400`.

---

## 5. Form Standards

### Form Width
- **Small**: 320px (`max-w-xs`)
- **Medium**: 480px (`max-w-md`)
- **Large**: 640px (`max-w-2xl`)
- **Full**: 100% (`w-full`)

### Inputs
- **Height**: 48px (`py-3`)
- **Border radius**: 12px (`rounded-xl`)
- **Padding**: 16px horizontal (`px-4`)
- **Border colors**: `border-gray-200`
- **Focus state**: `focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`
- **Error state**: `border-red-500 focus:border-red-500 focus:ring-red-200`
- **Disabled state**: `disabled:opacity-60 disabled:bg-gray-50`

### Labels
- Always placed above the field.
- Consistent spacing: `mb-2`.
- Required indicator: Append `*` in standard text color (do not make it red unless it's an error state).

### Selects
- Must share exact styling (height, borders, focus rings) as text inputs.
- Use native selects unless a searchable combobox is explicitly required.

### Textareas
- **Min height**: 3 rows minimum.
- **Resize behavior**: `resize-none` (prevent random layout breaking).

### Validation
- **When it appears**: On blur or form submission (not aggressively on keystroke unless checking username availability).
- **Error placement**: Always below the input field.
- **Format**: `text-xs text-red-500 mt-1`.

---

## 6. File Upload Standards

Every file upload must look and behave exactly the same.

### Upload Area
- **Border style**: `border-2 border-dashed border-gray-300 rounded-2xl`
- **Background**: `bg-gray-50`
- **Hover/Drag state**: `hover:bg-gray-100 border-blue-400 bg-blue-50`
- **Error state**: `border-red-400 bg-red-50`

### Preview
- **Thumbnail sizes**: `w-24 h-24 rounded-xl object-cover`
- **Remove button**: Absolute top-right, circular, red icon (`text-red-500 bg-white/80 rounded-full`).

### Limits
- Specify limits in helper text below the upload area (e.g., "JPEG, PNG up to 5MB").

---

## 7. Button Standards

### Button Types
- **Primary**: `bg-blue-600 hover:bg-blue-700 text-white shadow-sm`
- **Secondary**: `bg-gray-900 hover:bg-black text-white shadow-sm`
- **Outline**: `bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700`
- **Ghost**: `bg-transparent hover:bg-gray-100 text-gray-700`
- **Destructive**: `bg-red-600 hover:bg-red-700 text-white shadow-sm`

### Button States
- **Disabled state**: `disabled:opacity-70 disabled:cursor-not-allowed`
- **Loading state**: Show left-aligned spinner (`lucide-react/Loader2` with `animate-spin`), disable button, prevent double-clicks.

### Button Sizes
- **Small**: `px-4 py-2 text-sm rounded-lg`
- **Medium**: `px-6 py-2.5 text-base rounded-xl` (Default)
- **Large**: `px-8 py-3 text-lg rounded-xl`

---

## 8. Table Standards

- **Row height**: `h-16` for standard rows, `h-12` for dense tables.
- **Header styling**: `bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold py-3 px-6`.
- **Empty state**: Center-aligned illustration/icon, title, and optional "Create" CTA.
- **Loading state**: Skeleton rows mirroring actual row height.

---

## 9. Card Standards

- **Border radius**: `rounded-3xl`
- **Shadow**: `shadow-[0_8px_30px_rgb(0,0,0,0.02)]` (soft shadow) or `shadow-sm`.
- **Border**: `border border-white/80` or `border-gray-100`.
- **Padding**: `p-6` (mobile/default) or `p-8` (desktop).
- **Header spacing**: `mb-6`.

---

## 10. Modal Standards

- **Overlay**: `bg-black/40 backdrop-blur-sm`.
- **Small**: 400px.
- **Medium**: 600px.
- **Large**: 800px.
- **Fullscreen**: `w-[95vw] max-h-[90vh]`.
- **Behavior**: Close on clicking outside, close on Escape key, trap focus within modal, disable background scrolling.

---

## 11. Drawer / Sheet Standards

- **Width**: 400px (desktop), 100% (mobile).
- **Animation**: 300ms ease-in-out (`transition-transform duration-300`).
- **Overlay**: Same as Modals.

---

## 12. Toast Standards

Global toast system using `sonner`.

- **Position**: Bottom-right (desktop), Top-center (mobile).
- **Duration**: 3000ms.
- **Max stack count**: 3.
- **Icons**:
  - Success: `CheckCircle`
  - Error: `AlertCircle` / `XCircle`
  - Info: `Info`

---

## 13. Loader Standards

Prefer skeletons over full-screen spinners to reduce perceived wait times.

- **Page Loading**: Skeleton layout mimicking the exact page structure.
- **Form Loading**: Skeletons for inputs (`h-12 bg-slate-200 rounded-xl`).
- **Button Loading**: Spinner inside the button text.

---

## 14. Empty States

- **Illustration**: 80px by 80px container, subdued color (e.g., `text-gray-300`).
- **Title**: `text-lg font-bold text-gray-800`.
- **Description**: `text-sm text-gray-500 mt-2 max-w-sm mx-auto`.
- **CTA**: Placed exactly 24px (`mt-6`) below the description.

---

## 15. Search Standards

- **Width**: 100% in mobile, 320px in desktop headers.
- **Debounce**: 300ms standard debounce on all search inputs to prevent API spam.
- **Icon**: Left-aligned search icon (`pl-10`), `text-gray-400`.

---

## 16. Filter Standards

- **Placement**: Above tables/grids or left-sidebar for complex catalogs.
- **Clear behavior**: "Clear All" button appears only when filters are active.
- **Mobile**: Filters collapse into a "Filters" drawer/modal.

---

## 17. Responsive Standards

Standard Tailwind Breakpoints:
- **Mobile**: `< 640px`
- **Tablet**: `sm:` (`>= 640px`)
- **Laptop**: `md:` (`>= 768px`)
- **Desktop**: `lg:` (`>= 1024px`)
- **Wide**: `xl:` (`>= 1280px`)

---

## 18. Accessibility Standards

- **Focus rings**: Visible focus rings on all interactive elements (`focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`).
- **Contrast**: Ensure text passes WCAG AA guidelines (no light gray text on white).
- **ARIA**: Use `aria-label` for icon-only buttons.
- **Keyboard**: Modals and dropdowns must be escapable via `Esc`.

---

## 19. Component Naming Standards

- **Files/Components**: PascalCase (e.g., `UserProfileCard.jsx`).
- **Hooks**: camelCase (e.g., `useVendorData.js`).
- **Structure**: Group by feature or keeping generic UI components in `src/components/ui`.

---

## 20. Theme Consistency Rules

- **No random border radii**: Stick to `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-full`.
- **No random font sizes**: Stick to tailwind defaults (`text-xs` to `text-4xl`).
- **No inline styling**: Use Tailwind utility classes. Use `style={{}}` only for dynamic computed values.
- **Reuse first**: Do not build a custom dropdown if `Select` or `DropdownMenu` exists.

---

## 21. UI Audit: Profile Page vs. Vendor Dashboard

An analysis of `/frontend/src/components/Profile.jsx` and `/frontend/src/components/VendorDashboard.jsx` reveals significant inconsistencies that need remediation.

### What is already consistent
- Both use `CloudsBackground` and a `PageTransition`/Framer motion wrapper.
- Both use glassmorphism effects: `bg-white/70 backdrop-blur-xl`.
- Both utilize standard Lucide icons effectively.
- Toast notifications use the same `sonner` library implementation.

### What is inconsistent
1. **Container Layout**
   - Profile uses `max-w-5xl`.
   - Vendor uses `max-w-6xl`.
2. **Typography**
   - Profile Header: `text-3xl font-bold text-gray-900 mb-2`.
   - Vendor Header: `text-3xl font-extrabold text-gray-900 tracking-tight`.
   - Form Labels: Profile includes `mb-2`, Vendor has no bottom margin.
3. **Buttons**
   - Profile Primary: `bg-gray-900 hover:bg-black font-semibold`.
   - Vendor Primary: `bg-blue-600 hover:bg-blue-700 font-bold`.
4. **Form Inputs**
   - Profile: `bg-white px-4 py-3 border-gray-200 rounded-xl shadow-sm`.
   - Vendor: `bg-white/50 px-4 py-3 border-gray-200 rounded-xl` (missing shadow, different background opacity).
5. **Status Badges**
   - Profile: `rounded-full border border-green-200 font-semibold px-3 py-1`.
   - Vendor: `rounded-lg font-bold px-2.5 py-1` (missing border, different radius and padding).
6. **Card Padding**
   - Profile: `p-8`.
   - Vendor: `p-6 md:p-8` (Responsive padding).
7. **Map Containers**
   - Profile: `h-64` with inline `minHeight: '250px'`.
   - Vendor: `h-[220px]`.
8. **File Uploading**
   - Profile: Custom drag-and-drop HTML layout.
   - Vendor: Uses third-party `@uploadcare/react-uploader`.

### Required fixes
- **Standardize Max Width**: Adopt a single max-width container scale across the app (refer to Section 2).
- **Unify Button Styles**: Implement standardized `Button` component instead of rewriting classes. Vendor and Profile should share identical Primary button styles.
- **Standardize Inputs**: Create standard Input wrappers that enforce `bg-white`, identical borders, shadows, and focus states.
- **Harmonize Badges**: Create a single `<Badge />` component for statuses (e.g., Verified/Pending) so corner radii and borders are identical everywhere.
- **Map Components**: Extract the Leaflet map implementation into a `<LocationPicker />` component to standardize height and logic.
- **Typography Consistency**: Decide between `font-bold` and `font-extrabold` for page titles, and enforce consistent spacing under labels (`mb-2`).

### Components to standardize (To-Do List for Refactoring)
1. `<PageHeader />`
2. `<Card />`
3. `<Button />`
4. `<InputField />` / `<TextAreaField />` / `<SelectField />`
5. `<StatusBadge />`
6. `<LocationPickerMap />`
7. `<FileUploadArea />` (Unified between Uploadcare and native uploads)

---
*End of Document. By following these guidelines, you will contribute to a seamless, high-quality, and unified platform.*
