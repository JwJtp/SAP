# ScrapFlow — SAP Scrap Sales Management

ScrapFlow is a responsive React + TypeScript frontend prototype for the SAP `Create Scrap Sales` workflow. It modernizes the visual language into a premium Fiori-inspired workspace while keeping the existing business concepts visible: customer and partner data, sales organization, header tabs, editable scrap materials, pricing context, order status, notes, and footer actions.

## Run locally

```bash
pnpm install
pnpm run dev
```

The development server listens on `0.0.0.0:3000`. Create a production build with:

```bash
pnpm run build
```

## What works in demonstration mode

The interface includes working sidebar navigation, responsive layout, customer search suggestions, date pickers, currency selection, dynamic Net Value, working Sales / Item Overview / Item Detail / Ordering Party / Procurement tabs, editable material rows, add and delete actions, unit selection, quantity and unit-price editing, line-item and order-total recalculation, field validation, save-draft feedback, validation feedback, create-order confirmation, duplicate-submit protection through busy states, toast notifications, quick actions, notes persistence in local browser storage, and the status tracker.

The sample customer and material records are clearly illustrative. Save, Validate, and Create Order call a mock adapter that simulates realistic latency. A mock order reference may be displayed, but the UI never represents it as a real SAP order. The Completed status is intentionally reserved for a real SAP confirmation and is not automatically reached.

Tax is explicitly labeled illustrative and uses a demo-only 18% calculation. Production pricing and tax must come from SAP pricing services rather than this frontend.

## SAP integration boundary

`src/services/sapAdapter.ts` is the replacement point for authenticated SAP API/OData calls. Before integration, confirm:

- SAP system or tenant and API base URL.
- Authentication method, token lifecycle, user roles, and authorization model.
- Customer and material master search services.
- Sales-area and partner-determination behavior.
- Pricing procedure, conditions, tax service, currency rules, and rounding.
- Draft persistence, order validation, order creation, and the exact meaning of `Completed`.
- Error contracts and idempotency behavior for duplicate create requests.

The frontend should send the draft to existing SAP business logic and preserve SAP validations instead of duplicating them. Sensitive customer data should not be persisted in insecure browser storage; the prototype only stores generic internal notes locally.

## Project map

- `src/App.tsx` — shell, UI composition, state and workflow actions.
- `src/components` — feature components can be extracted here as the product grows; the prototype keeps cohesive presentational pieces together for fast handoff.
- `src/data/demoData.ts` — illustrative customer, material and organizational fixtures.
- `src/lib/calculations.ts` — pure amounts, totals, currency formatting and required-field validation.
- `src/services/sapAdapter.ts` — typed integration seam for future authenticated SAP services.
- `src/styles.css` — design tokens, responsive behavior, table layout, feedback and motion.
- `public/manus-routes.json` — managed preview route declaration.
