# Google OAuth Setup & Configuration Guide — StockUp AI

This document provides complete instructions for setting up **Sign in with Google** / **Continue with Google** for StockUp AI in development (`http://localhost:5173`) and production environments.

---

## Architecture Overview

```
Frontend (React/Vite)              Backend (Spring Boot)                  Google Cloud
────────────────────              ─────────────────────                  ────────────
[ Continue with Google ] 
       │
       ├───────────────────────────────────────────────────────────────► Google Identity Services
       │                                                                  (Authenticate User)
       │◄─────────────────────────────────────────────────────────────── (Return ID Token Credential)
       │
       │  POST /api/auth/google
       │  { "credential": "<ID_TOKEN>" }
       ├─────────────────────────► GoogleTokenVerifierService
       │                           (Verify Sig, Exp, Iss, Aud using GOOGLE_CLIENT_ID)
       │                                 │
       │                           Find/Create User & Business
       │                                 │
       │◄───────────────────────── Issue StockUp JWT (stockup_token)
       │
Save JWT to localStorage & redirect to /dashboard
```

---

## 1. Create a Google Cloud OAuth Client ID

1. Go to the **[Google Cloud Console](https://console.cloud.google.com/)**.
2. Select or create a project (e.g. `StockUp-AI`).
3. Navigate to **APIs & Services > OAuth consent screen**:
   - User Type: **External**.
   - App Name: `StockUp AI`.
   - Support email: `admin@stockup.ai` (or your administrator email).
   - Authorized domains: Add your production domain when deploying.
   - Save and continue (No sensitive Gmail scopes are required; standard `openid`, `email`, `profile` are sufficient).
4. Navigate to **APIs & Services > Credentials**:
   - Click **+ Create Credentials > OAuth client ID**.
   - Application type: **Web application**.
   - Name: `StockUp AI Web Client`.
   - **Authorized JavaScript origins**:
     - `http://localhost:5173`
     - `http://localhost:5174` (if running Vite on alternate ports)
     - `https://your-production-domain.com` (for production deployment)
   - Click **Create**.
5. Copy your **Client ID** (formatted like `1234567890-abc...apps.googleusercontent.com`).

---

## 2. Configure Environment Variables

### Frontend Environment File (`.env`)
In the project root directory (`/Users/anishkumarsah/Desktop/STOCKUP-AI/.env`):

```bash
VITE_GOOGLE_CLIENT_ID=1234567890-abc123def456.apps.googleusercontent.com
```

### Backend Environment Variable
Set `GOOGLE_CLIENT_ID` when starting the Spring Boot backend or in your backend configuration:

```bash
export GOOGLE_CLIENT_ID=1234567890-abc123def456.apps.googleusercontent.com
```

Or run via Maven:

```bash
GOOGLE_CLIENT_ID=1234567890-abc123def456.apps.googleusercontent.com mvn spring-boot:run
```

> 🔒 **Security Notice**: Never expose your `GOOGLE_CLIENT_SECRET` in frontend code. The Client ID (`VITE_GOOGLE_CLIENT_ID`) is safe for public inclusion in frontend bundles.

---

## 3. Supported Authentication Workflows

| Scenario | Flow | Result |
|---|---|---|
| **New Google User** | Click *Continue with Google* → Provide Pharmacy / Business Name | Creates `Business` + `ADMIN User` (`auth_provider = GOOGLE`), issues StockUp JWT, redirects to `/dashboard`. |
| **Existing Google User** | Click *Continue with Google* | Finds existing `google_subject`, issues StockUp JWT, accesses existing Business & inventory. |
| **Existing Email/Password User** | Click *Continue with Google* | Prompts for existing password to safely link accounts. Sets `auth_provider = BOTH`. |
| **Local Login** | Enter Email + Password | Functions as normal via BCrypt validation. |

---

## 4. Verification & Testing Commands

- **Frontend Build**: `npm run build`
- **Frontend Lint**: `npm run lint`
- **Backend Tests**: `mvn clean test`
