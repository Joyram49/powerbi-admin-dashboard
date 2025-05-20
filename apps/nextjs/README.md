# JOC Analytics - User Activity Tracking System

## Overview

This application includes a comprehensive user activity tracking system that monitors user engagement, session duration, and interaction patterns. The system is fully automated and tied to authentication state, requiring zero manual integration with login/logout flows.

## How It Works

### Core Components

1. **Activity Detection (`useActivity` hook)**

   - Tracks mouse movements, clicks, keyboard input, scrolling, etc.
   - Calculates active and inactive time
   - Formats time data for display

2. **Session Management (`useSessionActivity` hook)**

   - Detects Supabase authentication tokens in cookies
   - Automatically creates/updates sessions based on token presence
   - Syncs activity data with the server

3. **Server Integration**
   - Stores session data in PostgreSQL via tRPC endpoints
   - Uses the Beacon API for reliable data delivery when browser closes
   - Handles authentication state changes automatically

### Workflow Diagram

```
┌────────────────┐     ┌───────────────────┐     ┌──────────────────┐
│                │     │                   │     │                  │
│  User Actions  │────▶│ Activity Tracking │────▶│ Session Creation │
│                │     │                   │     │                  │
└────────────────┘     └───────────────────┘     └──────────────────┘
                                                           │
                                                           ▼
┌────────────────┐     ┌───────────────────┐     ┌──────────────────┐
│                │     │                   │     │                  │
│ Token Deletion │◀────│    User Logout    │◀────│  Data Syncing    │
│                │     │                   │     │                  │
└────────────────┘     └───────────────────┘     └──────────────────┘
        │
        ▼
┌────────────────┐
│                │
│ Session Closed │
│                │
└────────────────┘
```

## Technical Implementation

### Authentication-Based Activation

The entire system activates and deactivates automatically based on the presence of Supabase session tokens:

1. **When user logs in:**

   - Supabase creates `sb-` prefixed cookies
   - Our system detects these cookies
   - A new session is automatically created

2. **During active usage:**

   - Activity is monitored and time is accumulated
   - Data is synced to the server every 30 seconds
   - Session stays active as long as token exists

3. **When user logs out:**

   - Supabase removes the session cookies
   - Our system detects this and closes the session
   - Final activity data is sent to the server

4. **Edge cases:**
   - Browser crashes: Handled via Beacon API on beforeunload
   - Session expiration: Detected when token disappears
   - Tab switching: Activity pauses when tab isn't visible

### Cookie Detection

The system polls for Supabase auth cookies every 5 seconds and on tab focus:

```typescript
const checkSessionToken = useCallback(() => {
  if (typeof document !== "undefined") {
    const hasToken = document.cookie
      .split(";")
      .some((cookie) => cookie.trim().startsWith("sb-"));

    setHasSessionToken(hasToken);
    return hasToken;
  }
  return false;
}, []);
```

### Syncing with Server

Activity data is synchronized with the server:

1. **Periodic updates:**

   - Every 30 seconds during normal usage
   - When page visibility changes
   - When token state changes

2. **Final update:**
   - On logout (token removal)
   - On page close via Beacon API

```typescript
// Example: Using Beacon API for reliable delivery on page close
const handleBeforeUnload = () => {
  try {
    const formData = new FormData();
    formData.append("sessionId", sessionId);
    formData.append("totalActiveTime", totalActiveTime.toString());
    navigator.sendBeacon("/api/sync-session", formData);
  } catch (error) {
    console.error("Failed to send beacon:", error);
    updateSessionMutation.mutate({
      sessionId,
      totalActiveTime,
    });
  }
};
```

## Database Schema

Sessions are stored in the database with these key fields:

- `id`: Unique session identifier
- `userId`: User ID from authentication
- `startTime`: When session began
- `endTime`: When session ended (null while active)
- `totalActiveTime`: Accumulated active time in seconds
- `totalInactiveTime`: Accumulated inactive time in seconds

## Benefits

1. **Zero manual integration**

   - No need to call session functions in login/logout flows
   - Works automatically with authentication state

2. **Accurate timing**

   - Only counts time when users are actively engaged
   - Pauses tracking when tab isn't visible

3. **Resilient to edge cases**

   - Handles unexpected browser closes
   - Manages session token expiration
   - Works across multiple tabs/windows

4. **Privacy-focused**
   - Only tracks authenticated users
   - Stops tracking immediately on logout

## File Structure

- `hooks/useActivity.ts` - Core activity tracking
- `hooks/useSessionActivity.ts` - Session management
- `components/ActivityProvider.tsx` - Application wrapper
- `app/api/sync-session/route.ts` - Beacon API endpoint
- `packages/db/src/schema/userSessions.ts` - Database schema

## Usage

The system is already integrated into the application layout and requires no additional configuration or manual integration.

## Session Tracking System Fixes

The session tracking system has been updated to fix several issues:

1. **Made reportId Optional**: Modified the userSessions schema to make the reportId field optional, which resolves the 500 error that occurred during session creation.

2. **Updated Session Router**: Simplified the session creation process by not requiring a reportId when creating a new session.

3. **Enhanced Error Handling**: Added better error logging in the session router to aid in debugging.

These changes ensure that the user activity tracking system works reliably without requiring a report to be associated with each session.

### How to test the fix

1. Make sure you've applied the schema updates:

```bash
cd packages/db
npm run push
```

2. Check that users can log in without encountering 500 errors during session creation

3. Verify that session tracking continues to work properly by monitoring the console logs for [Session] prefixed messages

sample result to test:

```
getAllCompanies:
[
   {
      "id": "b50588f2-cd84-48f3-8727-26ed22d28f57",
      "companyName": "q&himpex",
      "address": "gg",
      "phone": "000000",
      "email": "technologiesdevcore@gmail.com",
      "dateJoined": "2025-05-06T10:42:49.265Z",
      "status": "active",
      "lastActivity": "2025-05-10T09:22:52.635Z",
      "modifiedBy": "raselhossen052@gmail.com",
      "employeeCount": 0,
      "reportCount": 2,
      "admin": {
      "id": "e65f43aa-305f-4fb0-aa5e-918b5109508d",
      "email": "rinors@gmail.com",
      "userName": "rinors"
      }
   }
]


getAllActiveCompanies:
[
   {
    "id": "b50588f2-cd84-48f3-8727-26ed22d28f57",
    "companyName": "q&himpex",
    "address": "gg",
    "phone": "000000",
    "email": "technologiesdevcore@gmail.com",
    "dateJoined": "2025-05-06T10:42:49.265Z",
    "status": "active",
    "lastActivity": "2025-05-10T09:22:52.635Z",
    "modifiedBy": "raselhossen052@gmail.com",
    "employeeCount": 0,
    "reportCount": 2,
    "admin": {
        "id": "e65f43aa-305f-4fb0-aa5e-918b5109508d",
        "email": "rinors@gmail.com",
        "userName": "rinors"
      }
   }
]

getCompaniesByAdminId:
[
   {
    "id": "ce5b2fe8-170d-4114-bc4a-4577635339fd",
    "companyName": "auto treatment",
    "address": "gg",
    "phone": "022929229",
    "email": "technologiesdevcore@gmail.com",
    "companyAdminId": "8785e1a0-feb9-4ff9-bd0a-8072508aa642",
    "dateJoined": "2025-05-06T10:42:22.304Z",
    "status": "active",
    "lastActivity": null,
    "modifiedBy": "momsad882@gmail.com",
    "employeeCount": 2,
    "reportCount": 1
   }
]

getCompanyByCompanyId:
[
   {
    "id": "4e6cd650-80e3-4677-9cb8-24452230d854",
    "companyName": "Reinger LLC",
    "address": "3799 Prospect Street Bridgeton, NJ 08302",
    "phone": "832-587-9481",
    "email": "reingerllc.info@mail.com",
    "companyAdminId": "66e638e4-0564-437c-818d-268464e1f554",
    "dateJoined": "2025-05-01T05:50:01.889Z",
    "status": "active",
    "lastActivity": null,
    "modifiedBy": "joyram2015@gmail.com"
   }
]

updateCompany:
 {
    id: string;
    companyName: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    companyAdminId: string;
    dateJoined: Date | null;
    status: "active" | "inactive" | "pending" | "suspended" | null;
    lastActivity: Date | null;
    modifiedBy: string | null;
 }
```
