# Tokyo Midnight Design System

### 1. Overview & Creative North Star
**Creative North Star: "The Terminal Aesthete"**

Tokyo Midnight is a high-fidelity design system inspired by professional quantitative environments and neo-noir command-line interfaces. It rejects the "consumer-grade" softness of modern web apps in favor of a precision-engineered, editorial experience. The system leverages intentional density, monospaced-adjacent aesthetics, and a "low-light" palette to reduce cognitive load while emphasizing critical data points through vibrant, neon-inflected accents.

It breaks the standard template by using high-contrast typography scales, ASCII-inspired branding elements, and a focus on "status-driven" layouts where the interface feels like a living organism.

### 2. Colors
The palette is rooted in a deep "Storm Blue" background with a spectrum of high-visibility accents (Sunset Orange, Electric Blue, and Lavender).

- **The "No-Line" Rule:** Sectioning is achieved through background shifts (e.g., `#1a1b26` to `#24283b`) rather than 1px borders. If a boundary must exist, it uses `outline-variant` at 30% opacity, creating a "vapor" effect rather than a hard wall.
- **Surface Hierarchy & Nesting:**
- **Base:** `surface` (#1a1b26) for the main environment.
- **Card/Container:** `surface_container` (#24283b) for discrete modules.
- **Header/Footer:** `surface_container_high` (#1f2335) for persistent structural elements.
- **The "Glass & Gradient" Rule:** Use backdrop blurs for overlay elements and vertical gradients (Surface to Surface Container) to simulate the depth of a CRT monitor.
- **Signature Textures:** Interactive elements and data visualizations utilize 40-60% opacity fills to create "layered light."

### 3. Typography
The system exclusively uses **Space Grotesk** to bridge the gap between technical monospaced fonts and high-end editorial sans-serifs.

**Typographic Rhythm (Extracted Scale):**
- **Display/Headline:** `2.25rem` (36px) - Heavy tracking-tighter, uppercase. This is the primary voice of the brand.
- **Sub-headers:** `1.125rem` (18px) - Used for command inputs and secondary titles.
- **Body Text:** `1rem` (16px) - Standardized for readability.
- **Metadata/Labels:** `0.75rem` (12px) and `0.6875rem` (11px) - Used for system logs, status tags, and secondary metadata.
- **Micro-labels:** `0.65rem` (10.4px) - Used in high-density footers and technical stats.

The hierarchy relies on uppercase transformations and wide tracking for labels (`tracking-widest`) to contrast against tightly packed display headlines.

### 4. Elevation & Depth
Elevation is expressed through tonal shifts and "Light Leaks" rather than physical shadows.

- **The Layering Principle:** Depth is achieved by stacking `surface_container_low` over `surface`.
- **Ambient Shadows:** The system uses a single `shadow-2xl` for the primary terminal container to lift it from the background environment, but internal components remain flat and tonally distinct.
- **Glassmorphism:** Modules (like the Live Liquidity Map) use a `2px` backdrop blur over gradient backgrounds to create an "etched glass" look.
- **The Cursor Blink:** Interaction is signaled through a solid block cursor (primary color) with a 1s step-end animation, reinforcing the terminal aesthetic.

### 5. Components
- **Command Input:** A transparent field with no borders, initiated by a `secondary` color prompt (`>`) and terminated by a blinking block cursor.
- **Status Pills:** Small circular indicators (Error: `#f7768e`, Success: `#9ece6a`, Warning: `#e0af68`) used to signal system health.
- **Data Modules:** Containers with `surface-container` background, often including a "metadata header" in a micro-label font size.
- **Scrollbars:** Ultra-thin (4px) with `surface-container` thumbs to remain unobtrusive.
- **Buttons:** Styled as text-links with bold secondary colors or as filled blocks with sharp (0.125rem) corners.

### 6. Do's and Don'ts
**Do:**
- Use uppercase for all system labels and metadata.
- Lean into asymmetry (e.g., 7-column / 5-column splits).
- Use `opacity-70` on secondary text to create a "dimmed" hierarchy.
- Embrace whitespace in the editorial sections (p-12) to contrast with dense terminal outputs.

**Don't:**
- Use rounded corners exceeding `0.75rem`.
- Use bright white text; always use the muted `on-surface` (#c0caf5) to prevent eye strain.
- Add "glow" or "outer glow" effects; let the flat neon colors provide the vibrance.
- Use traditional "Material Design" cards with white backgrounds.