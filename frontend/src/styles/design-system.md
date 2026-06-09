# SecurePay AI Design System

This document outlines the strict visual language used across the platform to ensure a premium, fintech aesthetic.

## Colors

*   **Primary (Purple):** `#7C4DFF` (hsl(257, 100%, 64%))
*   **Dark Background:** `#0B1020` (hsl(226, 49%, 8%)) - Used for landing page hero and phone mockups.
*   **Dashboard Background:** `#F8FAFC` (hsl(210, 40%, 98%))
*   **Text (Foreground):** `#111827` (hsl(222, 84%, 5%))
*   **Success (Green):** `#10b981`

## Typography

*   **Font Family:** Inter (`font-sans`)
*   **Hero Headline:** 72px - 96px (`text-7xl` to `text-8xl` or custom), Font Weight: 800 - 900 (`font-extrabold` or `font-black`), tight tracking (`tracking-tight`), tight line height (`leading-none` or `leading-[1.1]`).
*   **Dashboard Values:** Large, highly legible fonts for metric cards.

## Spacing & Layout

*   **Rhythm:** Luxurious spacing. Do not cramp elements.
*   **Hero Section:** Minimum height of 85-90vh (`min-h-[85vh]`).
*   **Grid Gaps:** Use `gap-6` to `gap-8` for dashboard cards. Use larger gaps (`gap-16` to `gap-24`) between major hero elements.

## Depth & Shadows

*   **Radius:** 16px to 24px+ (`rounded-2xl`, `rounded-[2rem]`) for major cards and UI blocks.
*   **Soft Shadow (Dashboard Cards):** `0 4px 20px -2px rgba(0, 0, 0, 0.05)`
*   **Premium Shadow (Buttons/Hero Elements):** `0 10px 40px -10px rgba(0, 0, 0, 0.08)`
*   **Ambient Glow:** Heavy blur on primary colored backgrounds (`blur-[100px]` to `blur-[120px]`).

## Motion (Framer Motion)

*   **Hover Elevation:** Subtle translate up (`-y-1` or scale `1.02`) on buttons and feature cards.
*   **Entry Animations:** Slow, staggered fade and slide up (`duration: 0.8`, `ease: [0.16, 1, 0.3, 1]`).
*   **Floating Elements:** Continuous, slow Y-axis translation for hero mockups to simulate a 3D float.
