# Usage Component Testing Instructions

## Scope
This document covers the automated tests written for the Usage component of the system.

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
Frontend usage tests cover reusable validation rules for the usage form.

Files:
- `frontend/src/tests/usageValidation.test.js`

Current frontend usage coverage:
- meter mode requires both readings
- negative manual usage is rejected
- valid manual usage is accepted
- current reading lower than previous is rejected
- missing usage date is rejected

Run from the `frontend` folder:

```bash
npm test
```

## Backend Unit Tests
Backend usage unit tests cover pure cost-calculation logic in isolation.

Files:
- `backend/tests/unit/usageService.test.js`

Current backend usage unit coverage:
- low-tier tariff calculation within 30 units
- low-tier multi-slab calculation up to 60 units
- high-tier tariff calculation above 60 units
- infinity-slab handling for very high usage

Run from the `backend` folder:

```bash
npm test
```

## Backend Integration Tests
Backend usage integration tests start the real Express server from `src/server.js`, connect to a temporary in-memory MongoDB database, and send HTTP requests to usage endpoints.

Files:
- `backend/tests/integration/usage.routes.test.js`
- `backend/tests/setup/testDb.js`
- `backend/tests/setup/testServer.js`
- `backend/tests/setup/testHelpers.js`

Current backend usage integration coverage:
- health endpoint success
- invalid usage payload rejection
- successful usage creation
- successful usage deletion
- usage history retrieval for a selected household
- usage update for a manual entry

Run from the `backend` folder:

```bash
npm test
```

## Performance Tests
Usage performance testing uses Artillery to apply moderate concurrent load to the most important read-heavy usage endpoints.

Files:
- `backend/tests/performance/usage.performance.yml`

Current usage performance scope:
- usage history retrieval
- monthly summary retrieval
- estimated cost retrieval
- appliance usage breakdown retrieval
- room usage breakdown retrieval

Run from the project root or backend folder after setting environment values:

```bash
$env:USER_TOKEN="your-jwt-token"
$env:HOUSEHOLD_ID="your-household-id"
$env:MONTH="3"
$env:YEAR="2026"
npx artillery run backend/tests/performance/usage.performance.yml
```

Current usage load profile:
- warm-up phase: `15` seconds at `1` new virtual user per second
- steady phase: `30` seconds at `3` new virtual users per second

Recorded usage performance result:
- total requests: `525`
- success rate: `100%`
- failed virtual users: `0`
- mean response time: `603.6 ms`
- median response time: `487.9 ms`
- p95 response time: `925.4 ms`
- p99 response time: `1002.4 ms`

Interpretation:
- the usage API remained stable under the configured moderate load
- no virtual users failed during the run
- the recorded response times show that the usage endpoints stayed responsive while handling repeated concurrent requests

## Notes
- Integration tests do not use the normal development database.
- `mongodb-memory-server` is used so test data is temporary and isolated.
- The current test scope here focuses only on the Usage component.
