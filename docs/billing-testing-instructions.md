# Billing and Cost Analysis Component Testing Instructions

## Scope
This document covers the automated tests written for the Billing component of the system.

## Testing Tools
- Frontend: `Vitest`
- Backend: `Vitest`
- Backend integration environment: `mongodb-memory-server`

## Environment Configuration
- frontend unit tests run inside the `frontend` project with the local Vitest configuration
- backend unit and integration tests run inside the `backend` project with the local Vitest configuration
- backend integration tests use `mongodb-memory-server`, so they do not use the normal development database
- performance tests require the backend server to be running and the following PowerShell environment values to be set before execution:
  - `USER_TOKEN`
  - `HOUSEHOLD_ID`
  - `MONTH`
  - `YEAR`

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

## Performance Tests
Billing performance testing uses Artillery to apply moderate concurrent load to the main bill history and comparison endpoints.

Files:
- `backend/tests/performance/billing.performance.yml`

Current billing performance scope:
- bill history retrieval
- month-over-month bill comparison
- tariff retrieval

Run from the project root or backend folder after setting environment values:

```bash
$env:USER_TOKEN="your-jwt-token"
$env:HOUSEHOLD_ID="your-household-id"
$env:MONTH="3"
$env:YEAR="2026"
npx artillery run backend/tests/performance/billing.performance.yml
```

Current billing load profile:
- warm-up phase: `15` seconds at `1` new virtual user per second
- steady phase: `30` seconds at `3` new virtual users per second

Recorded billing performance result:
- total requests: `315`
- success rate: `100%`
- failed virtual users: `0`
- mean response time: `412 ms`
- median response time: `459.5 ms`
- p95 response time: `645.6 ms`
- p99 response time: `757.6 ms`

Interpretation:
- the billing API remained stable under the configured moderate load
- no virtual users failed during the run
- the recorded response times show that the billing history, comparison, and tariff endpoints handled concurrent traffic efficiently

## Notes
- Integration tests do not use the normal development database.
- `mongodb-memory-server` is used so test data is temporary and isolated.
- The current test scope here focuses only on the Billing component.
