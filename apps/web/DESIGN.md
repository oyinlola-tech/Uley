---
name: Uley Campus Field Guide
description: A clear, student-first guide to verified off-campus housing.
colors:
  primary: "#2949D8"
  on-primary: "#FFFFFF"
  ink: "#17243B"
  muted-ink: "#526179"
  paper: "#F5F7FB"
  surface: "#FFFFFF"
  line: "#DCE3EF"
  citrus: "#F4CE54"
  trust-green: "#286B56"
  illustration-board: "#E9EFF9"
  illustration-cream: "#FFF8DF"
  illustration-sand: "#FFE6A1"
  illustration-window: "#9FB2F8"
  illustration-terracotta: "#D27A4E"
  illustration-ground: "#C9E1C7"
  illustration-leaf: "#5F9A72"
  illustration-route: "#D29D55"
  illustration-wood: "#80553B"
  illustration-reject: "#775900"
  illustration-stone: "#A5B4CA"
typography:
  display:
    fontFamily: Manrope
    fontSize: 64px
    fontWeight: 750
    lineHeight: 1.02
    letterSpacing: -0.055em
  heading:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.035em
  body:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: IBM Plex Mono
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0.08em
rounded:
  small: 8px
  medium: 16px
  large: 28px
  pill: 999px
spacing:
  unit: 8px
  content-width: 1200px
  section: 104px
  page-gutter: 28px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: 14px
  button-primary-hover:
    backgroundColor: "#1D39B9"
    textColor: "{colors.on-primary}"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.large}"
    padding: 24px
  trust-badge:
    backgroundColor: "{colors.trust-green}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
    padding: 8px
  body-copy:
    textColor: "{colors.muted-ink}"
    typography: "{typography.body}"
  page-section:
    backgroundColor: "{colors.paper}"
  divider:
    backgroundColor: "{colors.line}"
  wayfinding-marker:
    backgroundColor: "{colors.citrus}"
  illustration-board:
    backgroundColor: "{colors.illustration-board}"
  illustration-building-cream:
    backgroundColor: "{colors.illustration-cream}"
  illustration-building-sand:
    backgroundColor: "{colors.illustration-sand}"
  illustration-window:
    backgroundColor: "{colors.illustration-window}"
  illustration-terracotta:
    backgroundColor: "{colors.illustration-terracotta}"
  illustration-ground:
    backgroundColor: "{colors.illustration-ground}"
  illustration-leaf:
    backgroundColor: "{colors.illustration-leaf}"
  illustration-route:
    backgroundColor: "{colors.illustration-route}"
  illustration-wood:
    backgroundColor: "{colors.illustration-wood}"
  illustration-reject:
    backgroundColor: "{colors.illustration-reject}"
  illustration-stone:
    backgroundColor: "{colors.illustration-stone}"
  headline:
    textColor: "{colors.ink}"
    typography: "{typography.display}"
---

## Overview

Uley is an off-campus housing field guide for students and families. It makes the route from searching to inspection easier to understand, while the school provides a visible accountability layer. The page should feel like a well-made campus orientation booklet translated into a lively digital map: practical, optimistic, specific, and calm under pressure.

The signature device is a **verification receipt**: a compact, checklist-like card that explains which checks happen before a listing is published. It communicates trust as a process with named steps, never as a vague badge or a promise that every home is perfect. The Uley mark pairs a simple roofline and open doorway with a small wayfinding sun, set inside a cobalt tile on light surfaces and a citrus tile on dark surfaces.

## Colors

Use cobalt as the wayfinding color for actions and links. Ink carries headlines and body text. Paper is a cool, near-white canvas that keeps the interface crisp. Citrus marks a single important point in the journey; do not use it for small text. Trust green is reserved for completed verification states and positive outcomes.

The interface supports light and dark appearance. Follow the device preference on first visit, and let the user select a persistent override from the sun/moon control. In dark appearance, use deep blue-black page and panel surfaces with softened light text, preserve cobalt for primary actions, and keep citrus accents paired with dark ink for contrast. Illustrations, borders, focus rings, form feedback, and navigation must use the active theme colors rather than fixed light-mode values.

## Typography

Manrope gives headlines a confident, human shape. Use it for display and section headings, with tight tracking only at large sizes. Inter is the quiet, highly readable voice for paragraphs and controls. IBM Plex Mono is the field-note voice for short labels, evidence steps, and status metadata; keep it out of long copy.

## Layout

The desktop landing page opens like a campus field guide: a small editorial index, one confident search promise, and a distinct neighborhood discovery scene. Keep the verification receipt attached to that scene as a practical note, not a floating dashboard. The first screen should feel composed and legible before any motion begins. Below it, move from trust principles into a visible three-step route, then a calm landlord invitation. On phones, stack the illustration after the primary message, preserve its small field-note labels, keep controls full-width, and preserve generous touch targets.

## Illustrations

Use the footer's campus neighborhood as the brand origin: cobalt routes, small citrus wayfinding points, geometric rooflines, and quiet field-note labels. Keep that complete neighborhood scene in the footer. Create a separate, purpose-specific illustration for each product context: neighborhood discovery, browsing, room inspection, landlord and property review, property setup, the landlord desk, account access, and recovery. Reuse the visual language and palette, not the same complete drawing. Illustrations should explain the action or state beside them and use named design tokens for color.

The content grid is centered at 1200px with 28px desktop gutters and 20px mobile gutters. Sections use generous vertical separation, but related facts stay close together. Navigation and pricing facts should remain plain and scannable.

## Elevation & Depth

Surfaces are mostly flat. Use hairline blue-gray borders to define cards and only a restrained shadow under the verification receipt so it feels like a physical guide card. Signed-in navigation is the one floating functional layer: use a restrained adaptive glass treatment for the sticky header and mobile tab bar, with the content scrolling beneath it. Keep listing cards, forms, dashboards, and other content surfaces opaque and calm. Do not stack glass elements or place one glass surface inside another. Use a high-opacity surface fallback when reduced transparency is enabled, and preserve strong contrast in both themes.

## Motion

Use Motion for React in small client-side leaves. The landing hero may arrive with a short opacity and vertical-settle transition; keep the headline and illustration slightly out of sync so they read as one composition. Use simple CSS transitions for hover and the mobile route panel. Avoid continuous loops, scroll-jacking, parallax, and motion on every card. Honor reduced-motion preferences by removing travel and delay while leaving all content visible and usable.

## Shapes

Use rounded pills for primary actions and small status chips. Property and process panels have medium radii. The verification receipt has a larger radius and a squared label tab, giving the page one recognizable shape without rounding every element equally.

## Components

The primary button is cobalt with white text and a clear hover darkening. Focus rings are visible and high contrast. Trust labels use green only when they describe an actual completed check. The verification receipt lists the landlord check, property review, and inspection-before-application policy as separate steps.

## Reference-led patterns

Use these specific gallery directions and adapt them to Uley's campus field-guide language and real product flows:

- [Footer Design: Illustrative and Grid](https://www.footer.design/styles/illustrative): use a drawn campus neighborhood as the closing image, then keep useful destinations in a separate, compact link grid.
- [Navbar Gallery: Full Screen](https://www.navbar.gallery/): on phones, open an immersive route chooser with large labels and one clear action; on desktop, keep the links flat and quiet.
- [CTA Gallery: Bannerbear](https://www.cta.gallery/cta/bannerbear-new): use a direct, high-contrast button with a distinct arrow tile; apply this to the student guide and verification actions.
- [404s: ROVE](https://www.404s.design/sites/rove): use playful, colorful illustration and a visible recovery route for the not-found page.

## Do's and Don'ts

- Do explain what a verification step means in plain words.
- Do show important housing information before asking students to apply.
- Do keep the platform's role distinct from school-owned hostels.
- Don't invent listings, rent prices, verification counts, or school partnerships.
- Don't make a decorative badge look like proof of a completed check.
- Don't use glassmorphism, generic property-card grids, or oversized gradients.
