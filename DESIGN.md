# Design principles — rekovr-business

> Guia d'estètica i regles de disseny per al redisseny de rekovr-business.
> Aquest document és el **contracte de disseny**: qualsevol canvi d'UI ha de
> respectar-lo. Si un requisit entra en conflicte amb aquest document,
> atura't i planteja-ho abans d'implementar.

---

## Stack tècnic (no el canviem)

- **React 19** amb **Vite 7**
- **Tailwind CSS v4** — config CSS-first via `@theme` a `src/index.css`
- **JavaScript (JSX)** — cap fitxer `.ts`/`.tsx` nou
- **lucide-react** per a totes les icones (no en barregem d'altres)
- **react-router-dom v7** per a navegació

Regles derivades:
- Si instal·lem un component kit (shadcn/ui, Tremor Raw), ha de funcionar amb
  Vite + Tailwind v4 + JSX. Adaptem els exemples TS a JSX manualment.
- Tots els tokens de disseny viuen a `src/index.css` dins `@theme { ... }`,
  **no** a `tailwind.config.js` (que no existeix en v4).

---

## Inspiració visual

Linear, Stripe Dashboard, Vercel Dashboard, Height.

Estètica objectiu: **sòbria, blanca, generosa en espais, jerarquia per mida i
pes (no per color)**. Res d'animacions decoratives, gradients, neons, glows ni
vidre esmerilat.

---

## Tokens de disseny

A definir a `src/index.css`:

```css
@import "tailwindcss";

@theme {
  /* Colors — escala zinc + un sol accent */
  --color-accent-50:  #fff7ed;
  --color-accent-100: #ffedd5;
  --color-accent-500: #f97316;  /* taronja Rekovr, CTAs primaris */
  --color-accent-600: #ea580c;
  --color-accent-700: #c2410c;

  /* Tipografia */
  --font-sans:    "Manrope", ui-sans-serif, system-ui, sans-serif;
  --font-display: "DM Sans", ui-sans-serif, system-ui, sans-serif;

  /* Radius */
  --radius-md: 0.5rem;   /* default per a inputs i botons */
  --radius-lg: 0.75rem;  /* default per a cards */
  --radius-xl: 1rem;     /* contenidors grans */

  /* Shadows — només una. Res de shadow-lg/xl/2xl. */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.04);
}
```

Zincs: usa els de Tailwind per defecte (`zinc-50` a `zinc-950`). No afegim
altres grisos.

---

## Paleta — regles d'ús

- **Fons d'app**: `bg-white` (claro) — considerem dark mode més endavant.
- **Fons de superfícies secundàries**: `bg-zinc-50`.
- **Bordes**: `border-zinc-200`. Mai més fosc per separar elements.
- **Text primari**: `text-zinc-900`.
- **Text secundari**: `text-zinc-500`.
- **Text terciari / metadata**: `text-zinc-400`.
- **Accent taronja**: **només** per a l'acció primària d'una pantalla, links
  interactius clau i estats "success/active" puntuals. Mai com a fons de card,
  mai per a decoració.
- **Estats**:
  - Success: `text-emerald-600` / `bg-emerald-50`
  - Warning: `text-amber-600` / `bg-amber-50`
  - Danger:  `text-red-600` / `bg-red-50`

---

## Tipografia

- Famílies: **Manrope** (UI general), **DM Sans** (títols grans/display).
- Mides permeses (i prou): `text-xs`, `text-sm`, `text-base`, `text-lg`,
  `text-xl`, `text-2xl`, `text-3xl`. Res de `text-4xl+` a l'app (sí a
  landings).
- Pesos: 400 (default), 500 (UI emphasis), 600 (títols). **Mai bold 700+** a UI.
- Line-height: deixa els defaults de Tailwind; no forcis `leading-*` sense motiu.
- Tracking: `tracking-wide uppercase text-xs` reservat per a headers de taula i
  seccions.

---

## Espais i layout

- Múltiples de 4px (ja és el default de Tailwind).
- Padding de cards: `p-6` (mai menys de `p-4`, mai més de `p-8`).
- Padding horitzontal de pàgina: `px-6` en mòbil, `px-8` en desktop.
- Gap vertical entre seccions: `space-y-8`.
- Gap entre camps de formulari: `space-y-4`.
- Alçada d'inputs i botons: `h-10` (estàndard) o `h-9` (dens, taules).
- Ample màxim de contingut: `max-w-7xl` per a pàgines; `max-w-2xl` per a
  formularis d'una columna.

---

## Components — convencions

### Botons
- **Primari**: `bg-zinc-900 text-white hover:bg-zinc-800` (sobri).
- **Accent** (l'acció més important de la pantalla, 1 per pantalla):
  `bg-accent-500 text-white hover:bg-accent-600`.
- **Secundari**: `bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50`.
- **Ghost**: `text-zinc-600 hover:bg-zinc-100`.
- **Destructiu**: `bg-red-600 text-white hover:bg-red-700` (només per a delete
  irreversibles, dins modals de confirmació).
- Radius: `rounded-md`. Icona a l'esquerra del text, `gap-2`.

### Cards
- `bg-white border border-zinc-200 rounded-lg`. Opcional `shadow-sm`.
- **No** combinar shadow + border forta alhora.

### Inputs
- `bg-white border border-zinc-300 rounded-md h-10 px-3 text-sm`.
- Focus: `focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900`.
- Label a sobre, **mai al costat**. `text-sm font-medium text-zinc-700 mb-1.5`.
- Helper text: `text-xs text-zinc-500 mt-1.5`.
- Error: border `border-red-300`, text `text-red-600`.

### Taules
- Headers: `text-xs uppercase tracking-wide text-zinc-500 font-medium`.
- Files: `border-b border-zinc-100`, padding `py-3 px-4`.
- Hover de fila: `hover:bg-zinc-50`.
- **Sense zebra**. **Sense bordes verticals**.

### Empty states
Sempre amb 3 elements en aquest ordre:
1. Icona lucide (`h-10 w-10 text-zinc-300`)
2. Títol (`text-base font-medium text-zinc-900`) + descripció
   (`text-sm text-zinc-500`)
3. CTA primari

### Badges
- `rounded-md px-2 py-0.5 text-xs font-medium`.
- Colors: `bg-zinc-100 text-zinc-700` per defecte. Colors d'estat (emerald,
  amber, red) només quan representen estat real.

### Modals
- Overlay `bg-zinc-900/40 backdrop-blur-sm`.
- Panel `bg-white rounded-xl shadow-sm max-w-lg`.
- Footer amb accions: secundari a l'esquerra, primari a la dreta.

---

## Regles inviolables

1. **Una sola acció primària (accent taronja) per pantalla.** Si en necessites
   dues, una ha de passar a botó primari zinc.
2. **Mai gradients.** Ni a fons, ni a botons, ni a text.
3. **Mai animacions decoratives.** Les úniques animacions permeses són
   transicions d'estat (`transition-colors`, `transition-opacity`, durada
   150–200ms).
4. **Mai més d'una shadow level** per pantalla. Si tot té shadow, res té shadow.
5. **Jerarquia per mida i pes, no per color.** El títol és més gran, no més
   colorit.
6. **Icones només lucide-react.** Mai emoji a UI. Mida per defecte `h-4 w-4`
   inline amb text, `h-5 w-5` en botons grans.
7. **Empty states sempre treballats.** Una taula buida sense empty state és un
   bug de disseny.
8. **Mobile-first real.** Cada pantalla s'ha de veure bé a 375px.

---

## Què NO incloem (conscientment)

- Dark mode (fase 2, quan el sistema clar sigui sòlid).
- Animacions d'entrada de pàgina / skeleton creatius.
- Il·lustracions custom (només icones lucide i, si cal, diagrames simples).
- Gràfics decoratius (background patterns, blobs, etc.).

---

## Procés per a cada pantalla

1. Obre el fitxer existent a `src/pages/<Pantalla>.jsx`.
2. Adjunta 2-3 screenshots de referència (Linear / Stripe / Vercel).
3. Diu a Claude Code: *"Redissenya aquesta pantalla seguint DESIGN.md. No
   toquis lògica ni crides API. Primer descriu l'estructura en bullets i
   espera'm."*
4. Aprova l'estructura, deixa que generi codi.
5. Revisa al navegador. Itera amb canvis concrets (valors exactes), no vagues.
6. Extreu qualsevol component reutilitzable a `src/components/ui/`.

---

## Kit de components compartit (a construir)

Acabarem extraient a `src/components/ui/`:
- `Button.jsx`
- `Card.jsx`
- `Input.jsx`, `Label.jsx`, `Textarea.jsx`, `Select.jsx`
- `Table.jsx` (amb subcomponents)
- `Badge.jsx`
- `EmptyState.jsx`
- `Modal.jsx`
- `PageHeader.jsx`

Un cop estable, aquest kit es copia a **rekovr** i **rekovr-admin** per
garantir consistència entre les 3 apps.
