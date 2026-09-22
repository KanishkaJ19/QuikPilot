# QuikSplit

A shared expense splitter. Add what people spent; get back who owes whom.

Built as the pilot application for QuikPilot — small enough to read in one
sitting, real enough that its bugs are the kind people actually file.

## Running it

```bash
npm install
npm start          # http://localhost:3300
npm test           # vitest
```

## Design notes

**Money is integer minor units everywhere.** Floating point is never used for a
balance: `0.1 + 0.2 !== 0.3` is not an acceptable property for a ledger, and
every bug of that shape arrives as a rounding complaint rather than a bug report.

**Splits distribute their remainder** rather than dropping it. `splitEvenly`
hands out the odd unit to the earliest participants, so parts always sum to the
total — a split that does not sum to its total is a ledger that never balances.

**`assertBalanced` exists rather than a comment.** Every unit one person is owed
is a unit another owes, so balances must sum to zero. A non-zero sum means money
was created or destroyed.

## Layout

```
src/money.js        parsing, rendering, splitting — integer minor units
src/validation.js   incoming expense validation, per-field errors
src/ledger.js       balances and settle-up
src/store.js        in-memory groups (one process, one dataset)
src/server.js       HTTP API + static UI
public/index.html   the UI
```
