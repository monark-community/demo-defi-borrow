# Assets

Every image on the BorrowX site, where it comes from and where it is used. Photos are also credited on `/en/credits` and `/fr/credits` (linked from the footer).

## Photography (Unsplash, free Unsplash License)

All photos are from the free Unsplash library (not Unsplash+), downloaded from their photo pages, resized to 2400px on the long edge and compressed (JPEG, quality 78). They are served with `next/image` from `public/images/`. License: https://unsplash.com/license

| File | Unsplash page | Photographer | Used on |
|-|-|-|-|
| `public/images/lecture-hall.jpg` | https://unsplash.com/photos/TB5HpfJf7mA | Vitaly Gariev (https://unsplash.com/@silverkblack) | Home, "Made for learning" band |
| `public/images/study-table.jpg` | https://unsplash.com/photos/omeaHbEFlN4 | Alexis Brown (https://unsplash.com/@alexisrbrown) | `/how-it-works`, intro |

Both share a warm, natural-light grade (wood, daylight) that sits on the cream and espresso themes. The Splitflow site's photos were deliberately not reused, so the Monark family doesn't repeat itself.

## Monark brand assets (`public/brand/`)

From the monark.io repository (`public/vectors/`) and `lovable-migration/brand-refs/`, used as-is under the brand guidelines:

| File | Use |
|-|-|
| `monark-mark.svg` | Header pairing, wallet prompt, favicon (`src/app/icon.svg`), OG image |
| `monark-horizontal-light.svg`, `monark-horizontal-dark.svg` | Footer Monark band (switches with the theme) |
| `monark-vertical-light.svg`, `monark-vertical-dark.svg` | 404 page |
| `monark-mesh.svg` | Home hero only, large and cropped, ~10% opacity (the one mesh butterfly per site) |
| `socials/*.svg` | Footer social links (recoloured through a CSS mask) |

## Built in code

- **Safety runway** (`src/components/loan/safety-runway.tsx`): price track with liquidation and at-risk thresholds; used in the hero card, home, how-it-works, the borrow wizard and the dashboard.
- **Padlock** (`src/components/loan/padlock.tsx`): line-art collateral lock whose shackle lifts on unlock.
- **Hero loan card** (`src/components/home/hero-loan-card.tsx`): live example loan.
- **Four-step loan path**, **repayment path**, **liquidation breakdown bar**, **loan-life stages**: JSX and CSS, flat orange strokes.
- **Open Graph image** (`src/app/[locale]/opengraph-image.tsx`): generated per locale.

## Icons and type

- Icons: Lucide (`lucide-react`, ISC License).
- Type: Nunito Sans via `next/font/google` (SIL Open Font License).
