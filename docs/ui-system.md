# BigMarket UI Design System

## Overview

BigMarket uses a **monorepo-based design system** built on:

- **SvelteKit (Svelte 5)**
- **Tailwind CSS**
- A shared component library: `@bigmarket/bm-ui`

The goal is to maintain:

- consistency across apps
- fast iteration
- low coupling between UI and business logic

---

## Architecture

### 1. UI Package (`packages/bm-ui`)

This is the **design system layer**.

Location:

```
packages/bm-ui/src/lib/components/
```

Structure:

```
ui/
  accordion/
  badge/
  button/
  card/
  input/
  modal/
  select/
  ...
```

### Rules

- Components are **presentation only**
- No business logic (no DAO, API, or app state)
- No direct store access
- No network calls
- Components are reusable and generic

---

### 2. Application Layer (`apps/frontend-c1`)

This is where:

- UI components are composed
- business logic lives
- stores are used
- SDK/client calls are made

Example:

```
apps/frontend-c1/src/lib/components/dao/DepositForm.svelte
```

---

## Styling

### Tailwind CSS

- Tailwind is configured **only in the app**
- Location:

```
apps/frontend-c1/tailwind.config.ts
```

### Content paths MUST include:

```
./src/**/*.{html,js,svelte,ts}
../../packages/bm-ui/src/**/*.{html,js,svelte,ts}
```

This ensures Tailwind picks up classes from `bm-ui`.

---

### Styling Rules

- Use Tailwind utility classes
- Prefer simple, composable styles
- Avoid inline styles
- Avoid complex CSS unless necessary

---

## Component Design Principles

### 1. Composability

Components should be:

- small
- reusable
- composable

Example:

- `Button`
- `Input`
- `Card`
- `Badge`

---

### 2. Variants via props

Use simple props for styling variations:

```ts
variant: "primary" | "secondary" | "ghost";
```

Avoid:

- deeply nested variants
- complex style logic

---

### 3. Slots for flexibility

Use slots to allow composition:

```svelte
<Card>
  <h2>Title</h2>
  <p>Content</p>
</Card>
```

---

### 4. No domain knowledge

❌ Avoid:

- `DepositButton`
- `VotePanel`
- `DaoCard`

✅ Instead:

- `Button`
- `Card`
- `Dialog`

Domain-specific components belong in the app.

---

## State & Reactivity

- Use **Svelte 5 runes**
  - `$state`
  - `$props`
  - `$effect`

- UI components should:
  - accept props
  - emit events (if needed)
  - not manage global state

---

## Naming Conventions

- PascalCase for components:
  - `Button.svelte`
  - `FormField.svelte`

- Folder per component:

```
ui/button/Button.svelte
```

---

## Example Usage

```svelte
<script lang="ts">
  import { Button } from '@bigmarket/bm-ui';
</script>

<Button variant="primary">
  Deposit
</Button>
```

---

## Do's and Don'ts

### ✅ Do

- Keep components simple
- Reuse primitives
- Use Tailwind classes
- Build UI in layers

---

### ❌ Don’t

- Put business logic in `bm-ui`
- Access stores inside `bm-ui`
- Hardcode API or DAO logic
- Create tightly coupled components

---

## Future Extensions

The system may expand to include:

- design tokens (colors, spacing)
- theming (dark/light mode)
- shared layout primitives
- animation patterns

---

## Guiding Principle

> If a component knows about DAO, API, or business logic — it does NOT belong in `bm-ui`.

---

## Summary

- `bm-ui` = reusable UI primitives
- `frontend-c1` = composition + logic
- Tailwind = built at app level
- Components = simple, composable, stateless

This system prioritizes **speed, clarity, and scalability** over rigid frameworks.
