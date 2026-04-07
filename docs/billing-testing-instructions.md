# Billing and Cost Analysis Component Testing Instructions

## Scope
This document covers the automated tests written for the Billing component of the system.

## Testing Tools
- Frontend: `Vitest`
- Backend: `Vitest`
- Backend integration environment: `mongodb-memory-server`

## Frontend Unit Tests
Frontend billing tests cover reusable validation rules for the billing form.

Files:
- `frontend/src/tests/billingValidation.test.js`

Current frontend billing coverage:
- invalid month rejection
- paid bill requires paid date
- valid readings-based bill is accepted
- units mode requires total units
- unpaid bill should not keep a paid date

Run from the `frontend` folder:

```bash
npm test
```

## Backend Unit Tests
Backend billing unit tests cover bill-service logic in isolation.

Files:
- `backend/tests/unit/billService.test.js`

Current backend billing unit coverage:
- bill field generation from meter readings
- invalid reading rejection when current is lower than previous
- bill comparison percentage calculation
- no-current-bill comparison message

Run from the `backend` folder:

```bash
npm test
```

## Backend Integration Tests
Backend billing integration tests use the real Express server with the in-memory MongoDB database and call billing routes end-to-end.

Files:
- `backend/tests/integration/bill.routes.test.js`
- `backend/tests/setup/testDb.js`
- `backend/tests/setup/testServer.js`
- `backend/tests/setup/testHelpers.js`

Current backend billing integration coverage:
- unauthorized bill creation rejection
- invalid bill payload rejection
- successful bill creation and history retrieval
- bill comparison across months
- tariff-from-database billing verification
- bill regeneration after usage changes

Run from the `backend` folder:

```bash
npm test
```

## Notes
- Integration tests do not use the normal development database.
- `mongodb-memory-server` is used so test data is temporary and isolated.
- The current test scope here focuses only on the Billing component.
