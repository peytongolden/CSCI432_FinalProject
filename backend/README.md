# Backend for Meetings (Express + SQLite + JWT)

Quick local backend for create/join meeting flow with JWT authentication.

## Prerequisites
- Node.js

## Install

```
cd backend
npm install
```

## Run

```
npm start
```

Server runs on http://localhost:4000

## API Endpoints

### Auth

- **POST /api/auth/register**
  - Request: `{ email, password, name? }`
  - Response: `{ success: true, token, user }`

- **POST /api/auth/login**
  - Request: `{ email, password }`
  - Response: `{ success: true, token, user }`

### Meetings (protected — requires `Authorization: Bearer <token>`)

- **POST /api/meetings**
  - Request: `{ name, date?, time?, description? }`
  - Response: `{ meeting }`

- **POST /api/meetings/join**
  - Request: `{ code, name }`
  - Response: `{ meeting }`

- **GET /api/meetings/:code**
  - Response: `{ meeting: { ...meeting, attendees } }`

## Testing

```
npm test
```

## Environment Variables

- `JWT_SECRET` — JWT signing secret (default: 'your-super-secret-key-change-in-production')
- `PORT` — Server port (default: 4000)

For production, set JWT_SECRET to a strong random string and keep it secure.
