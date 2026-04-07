# Usage Component Testing Instructions

## Scope
This document covers the automated tests written for the Usage component of the system.

## Testing Tools
- Frontend: `Vitest`
- Backend: `Vitest`
- Backend integration environment: `mongodb-memory-server`

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

## Notes
- Integration tests do not use the normal development database.
- `mongodb-memory-server` is used so test data is temporary and isolated.
- The current test scope here focuses only on the Usage component.
