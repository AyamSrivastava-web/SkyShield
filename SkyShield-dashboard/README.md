# SkyShield Aviation Safety Dashboard

Interactive React/Vite aviation safety dashboard with landing-page video, CSS 3D aircraft cards, incident reporting, root-cause analysis, compliance controls, and managed Google/email account login.

## Run locally

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000

## Validate and build

```bash
pnpm check
pnpm build
```

## Authentication

The app uses the managed Manus account authentication flow. The development/published environment must provide the platform variables used by `server/auth-plugin.ts`, including `MANUS_PROJECT_ID`, `MANUS_JWT_SECRET`, `MANUS_OAUTH_API_URL`, and `MANUS_OAUTH_PORTAL_URL`.


## SkyShield Django authentication

The project now includes a Django REST authentication backend in `../skyshield-backend`.

### 1. Start Django

```powershell
cd ..\skyshield-backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py runserver 8000
```

### 2. Configure Google sign-in

Create a Google OAuth Web Client ID in Google Cloud Console and add the same value to:

- `skyshield-backend/.env` → `GOOGLE_CLIENT_ID`
- `SkyShield-dashboard/.env` → `VITE_GOOGLE_CLIENT_ID`

For local development, add `http://localhost:3000` and `http://127.0.0.1:3000` as authorized JavaScript origins.

### 3. Start React

```powershell
cd ..\SkyShield-dashboard
pnpm install
pnpm dev
```

Email/password accounts and Google accounts are handled by Django. The dashboard is only entered after authentication.
