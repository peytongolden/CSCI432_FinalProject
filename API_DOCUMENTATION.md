# Robert's Rules of Order - API Documentation

## Overview

This document describes all REST API endpoints for the Robert's Rules of Order voting application. The backend is deployed as Netlify Functions with MongoDB as the database.

**Base URL:** `https://your-domain.netlify.app/api` (production) or `http://localhost:8888/api` (local)

---

## Authentication

Most endpoints support optional JWT authentication. Pass the token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are obtained via the `/api/login` endpoint.

---

## Meetings API

### Create Meeting

Creates a new meeting with a unique join code.

| Property | Value |
|----------|-------|
| **Endpoint** | `/api/meetings` |
| **Method** | `POST` |
| **Auth Required** | Optional (recommended) |

**Request Body:**
```json
{
  "name": "Board Meeting",
  "description": "Monthly board meeting",
  "datetime": "2025-12-15T14:00:00Z",
  "committeeIds": ["committee_id_1"]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✓ | Meeting name |
| `description` | string | | Meeting description |
| `datetime` | string | | ISO 8601 datetime |
| `committeeIds` | array | | Associated committee IDs |

**Success Response (201):**
```json
{
  "success": true,
  "meetingId": "675f1234567890abcdef1234",
  "code": "ABC123",
  "creatorParticipantId": "675f1234567890abcdef5678"
}
```

**Error Responses:**
| Code | Description |
|------|-------------|
| 400 | Missing required field (name) |
| 500 | Server error |

---

### Get Meeting by ID

Retrieves full meeting details including participants and motions.

| Property | Value |
|----------|-------|
| **Endpoint** | `/api/meetings/:id` |
| **Method** | `GET` |
| **Auth Required** | No |

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | MongoDB ObjectId of the meeting |

**Success Response (200):**
```json
{
  "success": true,
  "meeting": {
    "_id": "675f1234567890abcdef1234",
    "name": "Board Meeting",
    "code": "ABC123",
    "active": true,
    "participants": [
      {
        "_id": "675f1234567890abcdef5678",
        "name": "John Doe",
        "role": "chair",
        "uid": "user_id_if_authenticated",
        "joinedAt": "2025-12-15T14:00:00Z"
      }
    ],
    "motions": [
      {
        "_id": "675f1234567890abcdefaaaa",
        "id": "675f1234567890abcdefaaaa",
        "title": "Approve Budget",
        "description": "Approve Q1 budget proposal",
        "status": "voting",
        "votes": {
          "yes": [{"participantId": "...", "participantName": "...", "timestamp": "..."}],
          "no": [],
          "abstain": []
        }
      }
    ],
    "presidingParticipantId": "675f1234567890abcdef5678",
    "createdBy": "user_id",
    "createdAt": "2025-12-15T14:00:00Z"
  }
}
```

**Error Responses:**
| Code | Description |
|------|-------------|
| 400 | Invalid meeting ID format |
| 404 | Meeting not found |
| 500 | Server error |

---

### Get Meeting by Code

Looks up a meeting by its join code.

| Property | Value |
|----------|-------|
| **Endpoint** | `/api/meetings/code/:code` |
| **Method** | `GET` |
| **Auth Required** | No |

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `code` | string | 6-character meeting code (e.g., "ABC123") |

**Success Response (200):**
```json
{
  "success": true,
  "meeting": { /* same structure as Get Meeting by ID */ }
}
```

**Error Responses:**
| Code | Description |
|------|-------------|
| 400 | Missing code |
| 404 | Meeting not found or inactive |
| 500 | Server error |

---

### Update Meeting (Change Chair)

Updates meeting metadata, primarily used for assigning a new presiding officer.

| Property | Value |
|----------|-------|
| **Endpoint** | `/api/meetings/:id` |
| **Method** | `PATCH` |
| **Auth Required** | Optional |

**Request Body:**
```json
{
  "presidingParticipantId": "participant_object_id"
}
```

**Success Response (200):**
```json
{
  "success": true
}
```

**Permissions:**
- Currently any participant can reassign the chair
- Future: Only current chair or meeting creator should be able to reassign

**Error Responses:**
| Code | Description |
|------|-------------|
| 400 | Invalid meeting ID or missing presidingParticipantId |
| 404 | Meeting not found |
| 500 | Server error |

---

### Join Meeting

Adds a participant to an existing meeting.

| Property | Value |
|----------|-------|
| **Endpoint** | `/api/meetings/:id/join` |
| **Method** | `POST` |
| **Auth Required** | Optional |

**Request Body:**
```json
{
  "displayName": "Jane Smith"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "participantId": "675f1234567890abcdef9999",
  "meetingId": "675f1234567890abcdef1234"
}
```

**Permissions:**
- Anyone with the meeting ID can join
- If authenticated, the `uid` field will be set on the participant

**Error Responses:**
| Code | Description |
|------|-------------|
| 400 | Invalid meeting ID or missing displayName |
| 500 | Failed to add participant |

---

### Leave Meeting

Removes a participant from a meeting.

| Property | Value |
|----------|-------|
| **Endpoint** | `/api/meetings/:id/leave` |
| **Method** | `POST` |
| **Auth Required** | Optional |

**Request Body:**
```json
{
  "participantId": "675f1234567890abcdef9999"
}
```
OR
```json
{
  "uid": "authenticated_user_id"
}
```

**Success Response (200):**
```json
{
  "success": true
}
```

**Notes:**
- If the leaving participant was the presiding officer, the `presidingParticipantId` is cleared
- Either `participantId` or `uid` must be provided

**Error Responses:**
| Code | Description |
|------|-------------|
| 400 | Invalid meeting ID or missing participantId/uid |
| 404 | Participant not found or already removed |
| 500 | Server error |

---

## Motions API

### Create Motion

Creates a new motion for a meeting and opens voting.

| Property | Value |
|----------|-------|
| **Endpoint** | `/api/motions` |
| **Method** | `POST` |
| **Auth Required** | Optional |

**Request Body:**
```json
{
  "meetingId": "675f1234567890abcdef1234",
  "title": "Approve Budget",
  "description": "Approve the Q1 budget proposal of $50,000",
  "type": "main",
  "votingThreshold": "simple",
  "isAnonymous": false,
  "parentMotionId": null
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `meetingId` | string | ✓ | Meeting ObjectId |
| `title` | string | ✓ | Motion title |
| `description` | string | | Detailed description |
| `type` | string | | `main`, `procedural`, `amendment`, `postpone`, `special`, `overturn` (default: `main`) |
| `votingThreshold` | string | | `simple` (>50%), `twoThirds` (≥67%), `unanimous` (100%) - Auto-set based on type if not provided |
| `isAnonymous` | boolean | | Hide individual votes (default: `false`) |
| `parentMotionId` | string | | For amendments/overturn - references parent motion |

**Success Response (201):**
```json
{
  "success": true,
  "motion": {
    "_id": "675f1234567890abcdefaaaa",
    "id": "675f1234567890abcdefaaaa",
    "title": "Approve Budget",
    "description": "...",
    "type": "main",
    "status": "voting",
    "votingThreshold": "simple",
    "isAnonymous": false,
    "parentMotionId": null,
    "votes": { "yes": [], "no": [], "abstain": [] },
    "discussion": [],
    "result": null,
    "chairSummary": "",
    "pros": [],
    "cons": [],
    "createdAt": "2025-12-15T14:30:00Z",
    "createdBy": "user_id"
  }
}
```

**Permissions:**
- Currently any participant can create motions
- Future: Could be restricted to chair or floor member

**Error Responses:**
| Code | Description |
|------|-------------|
| 400 | Missing meetingId or title |
| 404 | Meeting not found |
| 500 | Server error |

---

### Cast Vote

Records or updates a participant's vote on a motion.

| Property | Value |
|----------|-------|
| **Endpoint** | `/api/motions/:motionId/vote` |
| **Method** | `POST` |
| **Auth Required** | Optional |

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `motionId` | string | Motion ObjectId or string ID |

**Request Body:**
```json
{
  "meetingId": "675f1234567890abcdef1234",
  "participantId": "675f1234567890abcdef5678",
  "participantName": "John Doe",
  "vote": "yes"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `meetingId` | string | ✓ | |
| `participantId` | string | ✓ | |
| `participantName` | string | | Display name for records |
| `vote` | string | ✓ | `yes`, `no`, `abstain` |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Vote recorded"
}
```

**Behavior:**
- If the participant has already voted, their previous vote is automatically removed
- Vote change is seamless - just call this endpoint again with a new vote value

**Permissions:**
- Participants can only vote for themselves (based on participantId)
- Voting is only allowed while motion status is `voting`

**Error Responses:**
| Code | Description |
|------|-------------|
| 400 | Missing required fields or invalid vote value |
| 404 | Meeting or motion not found |
| 500 | Server error |

---

### Add Discussion Comment

Adds a comment to the motion's discussion thread.

| Property | Value |
|----------|-------|
| **Endpoint** | `/api/motions/:motionId/discuss` |
| **Method** | `POST` |
| **Auth Required** | Optional |

**Request Body:**
```json
{
  "meetingId": "675f1234567890abcdef1234",
  "participantId": "675f1234567890abcdef5678",
  "participantName": "John Doe",
  "comment": "I support this motion because...",
  "stance": "pro"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `meetingId` | string | ✓ | |
| `participantId` | string | ✓ | |
| `participantName` | string | | Display name |
| `comment` | string | ✓ | The discussion content |
| `stance` | string | | `pro`, `con`, `neutral` (default: `neutral`) |

**Success Response (201):**
```json
{
  "success": true,
  "discussionEntry": {
    "_id": "675f1234567890abcdefbbbb",
    "participantId": "675f1234567890abcdef5678",
    "participantName": "John Doe",
    "comment": "I support this motion because...",
    "stance": "pro",
    "timestamp": "2025-12-15T14:35:00Z"
  }
}
```

**Error Responses:**
| Code | Description |
|------|-------------|
| 400 | Missing required fields |
| 404 | Meeting or motion not found |
| 500 | Server error |

---

### Update Motion (End Voting)

Updates motion status and/or records the result.

| Property | Value |
|----------|-------|
| **Endpoint** | `/api/motions/:motionId` |
| **Method** | `PATCH` |
| **Auth Required** | Optional |

**Request Body:**
```json
{
  "meetingId": "675f1234567890abcdef1234",
  "status": "completed",
  "result": "passed",
  "chairSummary": "Motion passed with strong support. Budget allocation approved for Q1.",
  "pros": [
    "Adequate funding for expansion",
    "Competitive with industry standards"
  ],
  "cons": [
    "Higher than last quarter",
    "Limited flexibility for changes"
  ]
}
```

| Field | Type | Values |
|-------|------|--------|
| `meetingId` | string | Required |
| `status` | string | `voting`, `completed`, `postponed`, `amended` |
| `result` | string | `passed`, `failed`, `tied`, `postponed` |
| `chairSummary` | string | Chair's summary/reasoning for the decision |
| `pros` | array | List of arguments in favor (optional) |
| `cons` | array | List of arguments against (optional) |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Motion updated"
}
```

**Permissions:**
- Currently any participant can end voting
- Future: Should be restricted to chair only

**Error Responses:**
| Code | Description |
|------|-------------|
| 400 | Missing meetingId or no fields to update |
| 404 | Meeting or motion not found |
| 500 | Server error |

---

### Get Motions for Meeting

Retrieves all motions for a specific meeting.

| Property | Value |
|----------|-------|
| **Endpoint** | `/api/motions/:meetingId` |
| **Method** | `GET` |
| **Auth Required** | No |

**Success Response (200):**
```json
{
  "success": true,
  "motions": [
    {
      "_id": "675f1234567890abcdefaaaa",
      "id": "675f1234567890abcdefaaaa",
      "title": "Approve Budget",
      "description": "...",
      "status": "completed",
      "result": "passed",
      "votes": { "yes": [...], "no": [], "abstain": [] }
    }
  ]
}
```

**Error Responses:**
| Code | Description |
|------|-------------|
| 400 | Invalid meetingId |
| 404 | Meeting not found |
| 500 | Server error |

---

## User/Auth API

### Login

Authenticates a user and returns a JWT token.

| Property | Value |
|----------|-------|
| **Endpoint** | `/api/login` |
| **Method** | `POST` |
| **Auth Required** | No |

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

---

### Register

Creates a new user account.

| Property | Value |
|----------|-------|
| **Endpoint** | `/api/register` |
| **Method** | `POST` |
| **Auth Required** | No |

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123"
}
```

---

### Get Current User

Retrieves the authenticated user's profile.

| Property | Value |
|----------|-------|
| **Endpoint** | `/api/user/me` |
| **Method** | `GET` |
| **Auth Required** | Yes |

---

## Permission Matrix

| Action | Chair | Member | Guest |
|--------|-------|--------|-------|
| Create Meeting | ✓ | ✓ | ✗ |
| Join Meeting | ✓ | ✓ | ✓ |
| Leave Meeting | ✓ | ✓ | ✓ |
| Create Motion | ✓* | ✗ | ✗ |
| Cast Vote | ✓ | ✓ | ✓ |
| Change Own Vote | ✓ | ✓ | ✓ |
| End Voting | ✓* | ✗ | ✗ |
| Add Discussion | ✓ | ✓ | ✓ |
| Assign Chair | ✓* | ✗ | ✗ |

*Future: These actions should be restricted to chair only. Currently all participants have access.

---

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

## Rate Limits

Netlify Functions free tier limits:
- **Polling:** Recommended interval of 5-10 seconds
- **Concurrent executions:** Limited on free tier
- **Timeout:** 10 seconds per function

---

## Polling Strategy

The frontend polls the `/api/meetings/:id` endpoint every 5 seconds to sync:
- Participant list changes (joins/leaves)
- New motions created
- Vote count updates
- Motion status changes

For production with many users, consider:
- WebSocket implementation for real-time updates
- Longer polling intervals (10+ seconds)
- Server-sent events (SSE)

---

## Data Models

### Meeting
```typescript
{
  _id: ObjectId,
  name: string,
  description: string,
  datetime: Date | null,
  code: string,           // 6-char join code
  active: boolean,
  participants: Participant[],
  motions: Motion[],
  presidingParticipantId: ObjectId | null,
  createdBy: string | null,
  createdAt: Date
}
```

### Participant
```typescript
{
  _id: ObjectId,
  name: string,
  role: 'chair' | 'member' | 'floor',
  uid: string | null,     // Authenticated user ID
  joinedAt: Date
}
```

### Motion
```typescript
{
  _id: ObjectId,
  id: string,             // String version for frontend
  title: string,
  description: string,
  type: 'main' | 'procedural' | 'amendment' | 'postpone',
  status: 'voting' | 'completed' | 'postponed' | 'amended',
  votes: {
    yes: VoteEntry[],
    no: VoteEntry[],
    abstain: VoteEntry[]
  },
  discussion: DiscussionEntry[],
  result: 'passed' | 'failed' | 'tied' | 'postponed' | null,
  chairSummary: string,
  requiredMajority: number,
  createdAt: Date,
  createdBy: string | null
}
```

### VoteEntry
```typescript
{
  participantId: string,
  participantName: string,
  timestamp: Date
}
```

### DiscussionEntry
```typescript
{
  _id: ObjectId,
  participantId: string,
  participantName: string,
  comment: string,
  stance: 'pro' | 'con' | 'neutral',
  timestamp: Date
}
```

---

## Local Development

```bash
# Install dependencies
npm install

# Start Netlify dev server (includes functions)
npx netlify dev

# API will be available at http://localhost:8888/api/*
```

**Required Environment Variables:**
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
```

