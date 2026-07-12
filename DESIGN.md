# Design System — Rekovr

> Guia d'estètica i regles de disseny compartides per les tres apps Rekovr:
> **rekovr-business** (font de veritat, validada), **rekovr-admin** i **rekovr**.
>
> Aquest document és el **contracte de disseny**: reflecteix la
> implementació real de rekovr-business, que ha estat validada visualment.
> Qualsevol canvi d'UI a qualsevol de les tres apps ha de respectar-lo. Si un
> requisit entra en conflicte amb aquest document, atura't i planteja-ho abans
> d'implementar.
>
> **Origen**: aquest contracte es va derivar inicialment d'un DESIGN.md
> aspiracional (zinc + taronja) que no coincidia amb el codi finalment
> implementat. Després de validar rekovr-business en local, es va acordar que
> la realitat (slate + teal) és la bona.

---

## Stack tècnic (no el canviem)

- **React 19** amb **Vite 7**
- **Tailwind CSS v4** — config CSS-first via `@import "tailwindcss"` a
  `src/index.css` (NO hi ha `tailwind.config.js`)
- **JavaScript (JSX)** — cap fitxer `.ts`/`.tsx` nou
- **lucide-react** per a totes les icones (mai no en barregem d'altres)
- **react-router-dom v7** per a navegació

Regles derivades:
- Si instal·lem un component kit, ha de funcionar amb Vite + Tailwind v4 +
  JSX. Adaptem els exemples TS a JSX manualment.
- Si cal afegir tokens globals, es defineixen com a classes CSS custom o
  `@theme` dins `src/index.css` — mai a un `tailwind.config.js`.

---

## Inspiració visual

Linear, Stripe Dashboard, Vercel Dashboard, Height.

Estètica: **sòbria, jerarquia per mida i pes, generosa en espais, sidebar
fosca + content clar**. Res d'animacions decoratives, neons, glows ni vidre
esmerilat.

---

## Paleta de colors

### Neutres — escala `slate-*` de Tailwind

Usem **slate** (no zinc, no gray). No afegim altres escales neutres.

| Ús                                   | Classe                                  |
|--------------------------------------|-----------------------------------------|
| Fons d'app (content)                 | `bg-slate-50`                           |
| Fons de superfícies elevades (cards) | `bg-white`                              |
| Fons de sidebar (fosc)               | `bg-slate-950`                          |
| Fons de superfícies inline grises    | `bg-slate-100`                          |
| Borde principal                      | `border-slate-200`                      |
| Borde separador subtle               | `border-slate-100`                      |
| Borde sidebar fosc                   | `border-slate-800`                      |
| Text primari                         | `text-slate-900`                        |
| Text secundari                       | `text-slate-500` (o `-600` sobre clar)  |
| Text terciari / metadata             | `text-slate-400`                        |
| Text sobre sidebar fosca             | `text-white` / `text-slate-400`         |

### Accent — `teal-*` (brand Rekovr)

Color de marca: **teal** `#0D9488` (teal-600) a `#14B8A6` (teal-500).

| Ús                                      | Valor                                          |
|-----------------------------------------|------------------------------------------------|
| Logo (punt final)                       | `#14B8A6`                                      |
| Logo (meitat dreta de la "k")           | `#0D9488`                                      |
| Gradient CTA primari (`.btn-brand`)     | `linear-gradient(135deg, #0D9488, #0891B2)`    |
| Gradient CTA primari hover              | `linear-gradient(135deg, #0F766E, #0E7490)`    |
| Focus ring d'inputs                     | `focus:border-teal-500`                        |
| Nav actiu a sidebar fosca               | `bg-teal-900/40 text-teal-300`                 |

> **Excepció al "no gradients"**: el CTA primari (`btn-brand`) SÍ usa un
> gradient teal → cyan. És l'única gradient permesa i identifica l'acció
> principal. No s'usa en cap altre lloc.

### Estats

| Estat    | Fons            | Text              | Borde                     |
|----------|-----------------|-------------------|---------------------------|
| Success  | `bg-emerald-50` | `text-emerald-700`| `border-emerald-100`      |
| Warning  | `bg-amber-50`   | `text-amber-700`  | `border-amber-100`        |
| Danger   | `bg-red-50`     | `text-red-600/700`| `border-red-100`          |
| Info/neutre | `bg-slate-100` | `text-slate-700` | —                         |

---

## Tipografia

- **Manrope** — única família. `font-weight: 800` només al logotip. La resta
  de la UI usa els pesos del sistema via Tailwind.
- Carregada via Google Fonts:
  `@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@800&display=swap');`
- Mides permeses: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`,
  `text-2xl`, `text-3xl`. Res de `text-4xl+` a l'app.
- Pesos: 400 (default), 500 (UI emphasis), 600 (títols, botons), 700 només en
  casos puntuals de molta èmfasi.
- Uppercase + tracking: `uppercase tracking-wide text-xs font-medium` per a
  labels de formulari i headers de seccions.

### Títols de pàgina

```jsx
<h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
<p className="text-sm text-slate-500 mt-1">{subtitle}</p>
```

---

## Espais i layout

- Múltiples de 4px (default Tailwind).
- Padding de cards: `p-6` (estàndard), `p-4`/`p-5` (cards petites/densos),
  `p-8` (cards hero).
- Padding horitzontal de pàgina: `px-6` en mòbil, `px-8` en desktop
  (`px-6 py-6 pt-18 lg:px-8 lg:py-8` quan hi ha topbar mòbil).
- Gap vertical entre seccions principals: `mb-8` o `space-y-8`.
- Gap entre camps de formulari: `space-y-4`.
- Alçada d'inputs i botons: `h-10` / `py-2.5` (estàndard), `py-3` (CTAs grans).
- Ample màxim de contingut: `max-w-7xl` per a pàgines amplada plena;
  `max-w-2xl` / `max-w-md` per a formularis i pàgines de detall.
- Sidebar: `w-56` a desktop (`w-60` a mòbil overlay).

---

## Sidebar (layout d'aplicació)

Totes les apps Rekovr amb sessió autenticada comparteixen aquest patró:

- Desktop: sidebar fixa `w-56 bg-slate-950`, content amb `lg:ml-56`.
- Mòbil: topbar de `h-12` amb botó hamburguesa; sidebar en overlay `w-60`.
- Estructura interna de sidebar (de dalt a baix):
  1. **Brand**: logo "re**k**ovr**.**" amb la "k" mig-teal i un punt teal al
     final, + subtítol en majúscula petit (`text-xs tracking-wide text-slate-500`).
  2. **Context d'organització / usuari** (icona quadrada `w-7 h-7 rounded-md
     bg-slate-800`).
  3. **Navegació**: links amb icona lucide 15px + label. Actiu:
     `bg-teal-900/40 text-teal-300`. Inactiu: `text-slate-400 hover:bg-slate-800
     hover:text-white`.
  4. **Footer**: usuari + botó logout, separats per `border-slate-800`.

---

## Components — convencions

### Botons

| Variant       | Classes principals                                                              |
|---------------|----------------------------------------------------------------------------------|
| **Primari** (accent, 1 per pantalla) | `btn-brand text-white rounded-md` (definida a `index.css`) |
| **Neutre primari** (dark) | `bg-slate-900 text-white hover:bg-slate-800 rounded-md`              |
| **Secundari** | `bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-md`   |
| **Ghost**     | `text-slate-600 hover:bg-slate-100 rounded-md`                                   |
| **Destructiu**| `bg-red-600 text-white hover:bg-red-700 rounded-md`                              |
| **Confirm positiu** | `bg-emerald-600 text-white hover:bg-emerald-700 rounded-md`                |

- Alçada estàndard: `py-2.5` (h-10) o `py-3` per a CTAs grans.
- Padding horizontal: `px-4` / `px-5`.
- Mides de text: `text-sm font-medium`.
- Icona a l'esquerra del text, `gap-2`. Mida icona: `size={14-16}` inline,
  `size={18-20}` en CTAs grans.
- Disabled: `disabled:opacity-40 disabled:cursor-not-allowed`.

### Cards

```jsx
<div className="bg-white rounded-lg border border-slate-200 p-6">
```

- `rounded-lg` per defecte, `rounded-xl` només per a modals/hero.
- `shadow-sm` opcional quan cal separar visualment d'una altra card damunt
  `bg-slate-50`. **No** combinar `shadow-*` fort amb border.

### Inputs

```jsx
<input
  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-md
             bg-slate-50 focus:bg-white focus:border-teal-500 focus:outline-none"
/>
```

- Fons `bg-slate-50` en estat repòs, `bg-white` en focus. Això dona "pes
  visual" als camps pendents i els fa sentir més editables en hover.
- Label a sobre, en majúscula petita:
  `block text-xs font-medium uppercase tracking-wide text-slate-500 mb-1.5`.
- Helper text: `text-xs text-slate-500 mt-1.5`.
- Error: `border-red-300`, text `text-red-600`.

### Labels de formulari

Dos estils admesos:
- **Uppercase metadata** (el més usat): `block text-xs font-medium uppercase
  tracking-wide text-slate-500 mb-1.5` — per a camps de formulari i labels de
  seccions dins cards.
- **Sentence-case normal**: `text-sm font-medium text-slate-700 mb-1.5` — per
  a formularis més llargs o conversacionals.

### Taules

- Headers: `text-xs uppercase tracking-wide text-slate-500 font-medium`.
- Files: `border-b border-slate-100`, padding `py-3 px-4`.
- Hover de fila: `hover:bg-slate-50`.
- **Sense zebra**. **Sense bordes verticals**.

### Badges / Pills

```jsx
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                 text-xs font-medium bg-slate-100 text-slate-700">
  {label}
</span>
```

- Padding estàndard: `px-2 py-0.5`. Una mica més gran amb icona: `px-2.5 py-1`.
- Colors per estat (usa els de la secció "Estats" de dalt).

### Empty states

```jsx
<div className="flex flex-col items-center text-center py-12">
  <Icon size={32} className="text-slate-300 mb-3" strokeWidth={1.5} />
  <p className="text-sm font-medium text-slate-900">{title}</p>
  <p className="text-sm text-slate-500 mt-1 max-w-xs">{description}</p>
  {cta && <div className="mt-4">{cta}</div>}
</div>
```

Sempre amb icona lucide `text-slate-300` + títol + descripció + (opcional) CTA.

### Modals

- Overlay: `bg-slate-900/50` (sense blur, o `backdrop-blur-sm` si convé).
- Panel: `bg-white rounded-lg` o `rounded-xl`, `max-w-lg`/`max-w-md`.
- Footer amb accions: secundari a l'esquerra, primari a la dreta.

### Alertes inline

```jsx
{/* Error */}
<div className="p-3 rounded-md bg-red-50 border border-red-100 flex items-start gap-2">
  <AlertCircle size={14} className="text-red-600 mt-0.5" />
  <p className="text-sm text-red-700">{message}</p>
</div>

{/* Warning */}
<div className="p-3 rounded-md bg-amber-50/60 border border-amber-100">…</div>

{/* Success — icona en cercle per a pàgines d'èxit */}
<div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
  <Check className="text-emerald-600" />
</div>
```

### Tabs / Pills de filtre

```jsx
<div className="flex gap-1 bg-slate-100 rounded-md p-0.5 w-fit">
  <button className={active
    ? 'bg-white text-slate-900 shadow-sm px-4 py-1.5 rounded-md'
    : 'text-slate-500 hover:text-slate-700 px-4 py-1.5 rounded-md'}>
    {label}
  </button>
</div>
```

### Delta chips (evidència objectiva de match)

Per comparar la reclamació amb l'objecte trobat (Δtemps, Δdistància, mateixa
categoria). Helpers a `src/lib/deltas.js` (`timeDelta`, `distanceDelta`) que
retornen `{ label, tone }`; el to mapeja a estats del contracte:

| Tone      | Classes                        |
|-----------|--------------------------------|
| `ok`      | `bg-teal-50 text-teal-700`     |
| `warn`    | `bg-amber-50 text-amber-700`   |
| `neutral` | `bg-slate-100 text-slate-600`  |

```jsx
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md
                 text-xs font-medium tabular-nums {tone}">
  <Icon size={11} /> Δ 3 h
</span>
```

### Sidebar — seccions i comptadors

La nav s'agrupa en seccions amb header
`text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-600`:
**Operativa** (Safata, Objectes, Matches, Recollides, Esdeveniments),
**Anàlisi** (Informes), **Organització** (Equip, Subscripció, Configuració).
Els ítems de cua porten comptador en viu
(`rounded-full text-[10px] font-bold tabular-nums`): urgent
`bg-orange-900/60 text-orange-300`, normal `bg-teal-900/60 text-teal-300`.
Cap comptador quan és 0.

### Spinner

```jsx
<div className="w-5 h-5 border-2 border-slate-200 border-t-slate-900
                rounded-full animate-spin" />
```

### Avatar d'inicial

```jsx
<div className="w-6 h-6 rounded-full bg-slate-700 flex items-center
                justify-center text-white text-xs font-medium">
  {name.charAt(0).toUpperCase()}
</div>
```

---

## Regles inviolables

1. **Una sola acció primària (`btn-brand` gradient) per pantalla.** Si en
   necessites dues, una ha de passar a botó neutre (`bg-slate-900`) o
   secundari.
2. **Mai gradients, excepte `.btn-brand`.** Aquest és l'únic lloc on es
   permet un gradient, i serveix per identificar el CTA principal.
3. **Mai animacions decoratives.** Només transicions d'estat
   (`transition-colors`, `transition-opacity`), durada 150–200ms.
4. **Mai més d'una shadow level** per pantalla. Si tot té shadow, res té
   shadow.
5. **Jerarquia per mida i pes, no per color.** El títol és més gran, no més
   colorit.
6. **Icones només lucide-react.** Mai emoji a UI. Mida per defecte `size={14-16}`
   inline, `size={18-20}` en botons grans. `strokeWidth={1.5}` quan es vol un
   aire més lleuger.
7. **Empty states sempre treballats.** Una taula buida sense empty state és
   un bug de disseny.
8. **Mobile-first real.** Cada pantalla s'ha de veure bé a 375px. El
   sidebar passa a overlay amb un topbar fosc.
9. **Colors d'estat només quan signifiquen estat real.** No decoris amb
   emerald/amber/red si no expresses un estat.

---

## Què NO incloem (conscientment)

- Dark mode (fase 2, quan el sistema clar sigui sòlid a les 3 apps).
- Animacions d'entrada de pàgina / skeleton creatius.
- Il·lustracions custom (només icones lucide i, si cal, diagrames simples).
- Gràfics decoratius (background patterns, blobs, etc.).
- Escales neutres alternatives (zinc, gray, stone, neutral). Només slate.
- Accents alternatius (taronja, blau, violeta). Només teal.

---

## Kit de components compartit

A `src/components/ui/` vivim els components base reutilitzables:

- `Button.jsx` (amb variants `accent`, `primary`, `secondary`, `ghost`,
  `destructive`, `confirm`)
- `ScoreRing.jsx` — anell de score 0–100 (`score` en 0–1, `size` px, `muted`).
  Colors per llindar: ≥75 teal, ≥50 amber, resta slate. Substitueix qualsevol
  barra de progrés per a scores de match.
- `Card.jsx`
- `Input.jsx`, `Label.jsx`, `Textarea.jsx`, `Select.jsx`
- `Badge.jsx` (amb variants d'estat)
- `EmptyState.jsx`
- `Modal.jsx`
- `Alert.jsx` (error / warning / success / info)
- `PageHeader.jsx`
- `Spinner.jsx`
- `Tabs.jsx`

Aquest kit + `index.css` + `Layout.jsx` s'han de mantenir **sincronitzats
entre les 3 apps** (rekovr-business, rekovr-admin, rekovr). Avui es
replica manualment; si el sistema es consolida, s'extraurà a un paquet npm
privat `@rekovr/ui`.

---

## Procés per a cada pantalla

1. Obre el fitxer existent a `src/pages/<Pantalla>.jsx`.
2. Revisa la pantalla equivalent a **rekovr-business** com a referència
   visual.
3. Redissenya seguint aquest DESIGN.md, reutilitzant components de
   `src/components/ui/`. No toquis lògica ni crides API si no és estrictament
   necessari.
4. Primer descriu l'estructura en bullets i espera confirmació abans
   d'implementar.
5. Revisa al navegador. Itera amb canvis concrets (valors exactes), no
   vagues.
6. Si trobes un patró reutilitzable que falta al kit, afegeix-lo a
   `src/components/ui/` **i** documenta'l aquí.
