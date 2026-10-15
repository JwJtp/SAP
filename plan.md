# SAP Scrap Sales Management — Next Generation

## Implementation approach

Build a frontend-only React + TypeScript application in demonstration mode, with a clear service boundary for later authenticated SAP API/OData integration. The UI owns temporary form state, validation, derived totals, tab selection, toast/dialog feedback, and notes persistence. A small `services/` layer exposes mock catalog lookups and simulated draft/validation/create operations so real SAP adapters can replace them without rewriting the UI.

The main route is the Create Scrap Sales workspace. The application shell separates layout concerns into Sidebar, Topbar, page header, reusable Card/Field/Button/Badge components, CustomerOrderForm, SalesOrganizationCard, SalesTabs, MaterialsTable, OrderSummary, StatusTracker, QuickActions, NotesCard, ToastStack, ConfirmDialog, and FooterActions. Calculation and validation logic lives in pure functions under `src/lib/`.

No backend credentials or APIs were supplied. The interface must explicitly display Demonstration Mode and never claim that an SAP order was created. Customer/material lookups and order actions are simulated with realistic loading states. Pricing and tax are illustrative only; the UI explains that production pricing, tax, authorization and order creation must be sourced from SAP services.

## Project structure

- `src/main.tsx` — React entrypoint.
- `src/App.tsx` — application shell, state orchestration, navigation and page composition.
- `src/components/` — reusable UI and feature components.
- `src/data/demoData.ts` — illustrative customer, material, organizational and tab data.
- `src/lib/calculations.ts` — currency formatting, line amount, totals and validation helpers.
- `src/services/sapAdapter.ts` — typed mock adapter boundary for future SAP API/OData integration.
- `src/styles.css` — design tokens, responsive layout, component styling and motion.
- `public/manus-routes.json` — complete route manifest for the single-page workspace.
- `README.md` — setup, demonstration-mode behavior and SAP integration handoff notes.
- `TODO.md` — acceptance outcomes and progress tracking.

## Design direction

### Alternate styles considered

- Carbon Fiori Atelier (0.06): restrained SAP enterprise surfaces with strong blue structure and green operational accents.
- Aurora Control Room (0.04): brighter gradient-led operations UI with translucent panels and heavier dashboard energy.
- Utility Ledger Pro (0.08): dense accounting-style tables with minimal decoration and compact monochrome controls.

### Chosen style: Carbon Fiori Atelier

- **Design Movement:** Modern SAP Fiori enterprise utility, softened with premium editorial spacing and subtle glassy gradients.
- **Core Principles:** operational clarity, visible system state, deliberate density, and progressive disclosure.
- **Color Philosophy:** deep navy anchors trust and navigation; electric blue marks action and current context; mint/green signals recycling and successful progression; lavender/cyan highlight secondary tools without competing with primary actions; the page background stays cool and pale so dense business data remains legible.
- **Layout Paradigm:** a persistent left rail plus a flexible two-column workspace, with the materials table as the visual anchor and a sticky summary rail that preserves financial context while scrolling.
- **Signature Elements:** recycling-loop mark, blue gradient action rail, and small status dots/stepper that make workflow progression visible without noise.
- **Interaction Philosophy:** every meaningful state change is acknowledged through inline validation, loading treatment, toast feedback, or an explicit confirmation; demo limitations are stated at the point of action.
- **Animation:** short 160–220ms ease-out transitions for hover, focus and disclosure; subtle row highlight on edits; no looping motion except a brief loading spinner.
- **Typography System:** Inter/system sans for operational readability; compact uppercase micro-labels for codes and status; strong numeric hierarchy for INR totals; minimum 14px body text on desktop and 15px on mobile.
- **Brand Essence:** a confident, traceable workspace for teams turning scrap inventory into compliant sales orders. Personality: precise, progressive, grounded.
- **Brand Voice:** headlines are direct and operational; CTAs are explicit about state. Example lines: “Build the order, then validate the handoff.” and “Demo mode keeps this workspace safe to explore.”
- **Wordmark & Logo:** a compact six-node recycling mark paired with a two-line `SCRAPFLOW / SAP SALES` lockup.
- **Signature Brand Color:** `#2F80ED`, an electric operational blue used for selected navigation and primary actions.

## Functional scope

- Responsive application shell with sidebar collapse behavior and mobile navigation.
- Working navigation labels with current-page state; only Create Scrap Sales is fully implemented, while other destinations show a clear demonstration message.
- Searchable customer fields with suggestions and keyboard-friendly selection.
- Required-field validation for sold-to, ship-to, PO/date and material rows.
- Date inputs, currency selector, sales organization card with illustrative codes/descriptions.
- Working Sales, Item Overview, Item Detail, Ordering Party and Procurement tabs.
- Editable material rows, add/remove, quantity/unit/price editing, line amount calculation, selection controls and dynamic INR totals.
- Summary panel with subtotal, discount, illustrative tax note, total net value and item count.
- Status transitions Draft → Validated → Created; Completed remains visibly unavailable until a real backend confirms the operation.
- Demo-safe quick actions, notes save/clear feedback, save-draft/validate/create-order flows, loading treatment, confirmation dialog and duplicate-submit protection.
- Accessible labels, focus states, semantic buttons/inputs, responsive table-to-card behavior and reduced-motion support.

## Serving and build workflow

- Use a minimal Vite React toolchain with a pinned pnpm package manager and explicit lifecycle policy.
- Run the dev server on the managed project port `3000` bound to `0.0.0.0` for Preview.
- Keep `public/manus-routes.json` synchronized with the single `/` route.
- Validate through TypeScript diagnostics, production build and Preview inspection when needed.
- Save the finished source to the canonical managed `main` checkpoint. Publication is separate; report Preview unless publication is explicitly completed.

## Integration boundary and known unknowns

The following must be confirmed before real SAP integration: SAP system/tenant, supported OData or authenticated API endpoints, authentication and token lifecycle, customer/material search services, pricing/tax service, authorization model, draft persistence, order creation endpoint, and the exact meaning of the Completed lifecycle state. The prototype deliberately does not invent those company-specific rules.
