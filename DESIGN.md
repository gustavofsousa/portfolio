# DESIGN — Gustavo F Sousa portfolio

Surface mode: **experience**. The visitor enjoys the artifact itself, so motion may lead here.
Project type: `pessoal` (no constitution file). Colors, type and spacing live in `css/tokens.css`.

## Motion

Temperament: **elastic**, because this is a portfolio (experience surface) and the owner asked for
the most juice. Frequency tiers cap it: the nav, the page change and the menu are used often, so
they run on the `firm` spring. A change that the system starts (scroll reveal, language swap, page
enter) never overshoots: it uses the `firm` spring. Only a change that a touch starts (press release,
theme toggle, language toggle) may bounce.

| Token | Value | Use |
|---|---|---|
| duration-press | 100ms | press feedback |
| ease-out | cubic-bezier(0.16, 1, 0.3, 1) | arrivals, fades, hover |
| spring | var(--spring-elastic) in `css/juice.css` | releases that a touch starts |
| spring-duration | 745ms | settle time of spring |
| spring-layout | var(--spring-firm) in `css/juice.css` | nav, page change, menu, reveal, layout |
| spring-layout-duration | 297ms | settle time of spring-layout |

Named patterns (use only these):

- `lift` — hover on a card: `transform: translateY(-3px)`, one shadow level up, ease-out. Pointer devices only.
- `press` — active on a control: `scale` sinks to the temperament press scale (0.95 elastic, 0.97 in the firm nav), releases on the spring. The rule lives in `css/components.css`.
- `reveal` — a block enters on scroll: opacity 0→1 and `translate` 28px→0, firm spring, 55ms stagger per sibling that enters in the same frame.
- `page-enter` — a route enters: fade and a 16px rise on the firm spring.
- `grow` — the mobile menu opens from the hamburger (`.juice-grow`).
- `pop` — the theme switch is one view transition: the new theme grows as a circle from the toggle and the icon turns in on the elastic spring. The language button bumps once per tap, evenly (text never squashes).
- `scroll-rail` — the reading progress bar (with a speed glow on the firm spring) and the Now rail follow the scroll 1:1, no spring between the wheel and the part. Each Now dot lands once.
- `reading-mode` — the nav slides out on scroll down and back on scroll up, firm spring. It stays with the menu open or focus inside.
- `depth` — the hero recedes (up to 90px, opacity down to 0.35) and the about photo drifts 7% slower than the page. 1:1 with the scroll.
- `hero-enter` — the heading, then the description 140ms later, rise 28px on the firm spring each time the home page shows.
- `nav-indicator` — one underline on two springs (leading edge pace 0.8, trailing 1.25). Firm.

Rules that hold everywhere: move only `opacity`, `translate`, `scale`, `rotate` and `transform`;
gate hover with `(hover: hover) and (pointer: fine)`; never put motion on a keyboard action;
`prefers-reduced-motion` keeps the state and drops the trip.
