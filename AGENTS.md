# Project guidance

## Stack

- Node.js with CommonJS modules.
- Express 4 serves the static browser UI and JSON API routes.
- The UI is plain HTML, CSS, and browser JavaScript in `public/`.
- Persistent application data is stored in `data/db.json` through synchronous file reads and writes in `lib/store.js`.
- Runtime dependencies are `express` and `body-parser`, as listed in `package.json`.

## Module map

- `server.js` — creates the Express app, mounts the routers, serves `public/`, and renders the HTML invoice route.
- `routes/orders.js` — order listing, lookup, creation, and cancellation endpoints.
- `routes/products.js` — product catalog and active coupon endpoints.
- `routes/customers.js` — customer listing and Khata settlement endpoint.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/orders.js` — order records, filtering, and cancellation behavior.
- `lib/pricing.js`, `lib/tax.js`, `lib/coupons.js` — subtotal, discount, GST, and coupon calculations.
- `lib/inventory.js` — product lookup, sellable stock checks, stock adjustment, and inventory summary.
- `lib/ledger.js` — customer balances, Khata billing/reversal, and settlements.
- `lib/invoice.js` — invoice calculations and printable HTML.
- `lib/reports.js` — dashboard totals and invoice-to-ledger reconciliation.
- `lib/dates.js` — date formatting, date-key normalization, and fiscal year helper.
- `lib/store.js` — reads and writes `data/db.json` and appends audit entries.
- `config.js` — port, shop information, tax slabs, inventory defaults, coupons, and admin key.
- `public/index.html`, `public/js/app.js`, `public/css/style.css` — browser UI.

## Commands

- `npm start` — start the server (`node server.js`), using port 3000 unless `PORT` is set.
- `node server.js` — start the server directly.
- `npm test` — currently exits with `Error: no test specified`; no test suite is configured in `package.json`.

## Change rules

- Write characterization tests before changing behaviour.
- Change only the module the ticket is about.
- Tests must never read or write `data/db.json`.
- Add no dependencies.
