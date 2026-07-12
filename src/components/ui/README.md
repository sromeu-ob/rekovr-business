# `src/components/ui/` — Rekovr UI kit

Components base compartits entre les 3 apps Rekovr (`rekovr-business`,
`rekovr-admin`, `rekovr`). Implementació segueix el contracte de
[`DESIGN.md`](../../../DESIGN.md).

## Ús

```jsx
import { Button, Card, PageHeader, Input, Label, Badge } from '../components/ui';
```

## Components

| Component    | Props principals                                              |
|--------------|---------------------------------------------------------------|
| `Alert`      | `variant` (error/warning/success/info), `title`, `icon`       |
| `Badge`      | `variant` (neutral/success/warning/danger/info/muted), `size`, `icon` |
| `Button`     | `variant` (accent/primary/secondary/ghost/destructive/confirm), `size` (sm/md/lg), `leftIcon`, `rightIcon`, `loading`, `fullWidth` |
| `Card`       | `padding` (none/sm/md/lg), `shadow`                            |
| `EmptyState` | `icon`, `title`, `description`, `action`                       |
| `Input`      | `error`, i qualsevol prop nativa d'`<input>`                   |
| `Label`      | `variant` (uppercase/sentence), `required`, `htmlFor`          |
| `Modal`      | `open`, `onClose`, `title`, `size` (sm/md/lg/xl/2xl), `footer`, `closable` |
| `PageHeader` | `title`, `subtitle`, `actions`                                 |
| `Select`     | `error`, i qualsevol prop nativa de `<select>`                 |
| `Spinner`    | `size` (sm/md/lg)                                              |
| `Tabs`       | `tabs` (array `{ key, label, icon?, count? }`), `value`, `onChange` |
| `Textarea`   | `error`, `rows`, i qualsevol prop nativa de `<textarea>`       |

## Variants de `Button`

- **`accent`** — `btn-brand` gradient teal. Reservat al CTA principal. **1 per pantalla.**
- **`primary`** — `bg-slate-900` sòbri. Per a segones accions rellevants.
- **`secondary`** — border `slate-200`. Default.
- **`ghost`** — sense borde, hover `slate-100`.
- **`destructive`** — vermell. Només per a delete irreversibles dins modals de confirmació.
- **`confirm`** — verd (emerald). Per a confirmacions positives irreversibles (ex: validar pickup).

## Regla important

Aquests components **es mantenen sincronitzats entre les 3 apps**. Si afegeixes
o modifiques un component aquí, actualitza també els repos `rekovr-admin` i
`rekovr` i documenta el canvi a `DESIGN.md`.
