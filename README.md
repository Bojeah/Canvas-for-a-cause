# Canvas for a Cause

Canvas for a Cause is a charity art-auction platform created for the Pan-Atlantic University Student Council. It gives registered bidders a focused, authenticated experience for browsing artwork, following an auction window, and placing bids, while providing administrators with tools to manage artwork, auction timing, bids, and audit history.

The project is organized as a React frontend and a FastAPI backend:

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Axios, and React Router
- **Backend:** FastAPI, SQLAlchemy, Alembic, JWT authentication, and rate limiting
- **Database:** SQLite by default for local development; PostgreSQL is supported for production
- **Media and email integrations:** Cloudinary uploads from the frontend and Resend/Hunter integrations in the backend

## Features

### Bidder experience

- Register with a full name, email address, and password
- Log in and log out using JWT access tokens and HTTP-only cookies
- Browse the artwork catalogue and view individual artwork details
- See current auction-window information and artwork bid status
- Place bids with server-side validation and rate limiting
- Receive transactional email notifications where email services are configured
- Use the responsive light/dark interface with network-status feedback

### Administrator experience

- Sign in through the dedicated admin login
- Create, edit, and delete artwork listings
- Upload and manage artwork images through Cloudinary
- Set or close the global auction window
- Review all bids and close individual auctions
- Record administrative and authentication activity in audit logs
- Enforce a configurable maximum number of artworks

## Repository structure

```text
.
├── backend/
│   ├── app/
│   │   ├── core/          # Configuration, database, security, and rate limiting
│   │   ├── models/        # SQLAlchemy models
│   │   ├── routes/        # Public, bidder, and admin API routes
│   │   ├── schemas/       # Pydantic request and response schemas
│   │   └── services/      # Auction, bidding, email, signup, and audit logic
│   ├── alembic/           # Database migrations
│   ├── Dockerfile
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/    # Shared UI and route guards
    │   ├── context/       # Authentication state
    │   ├── pages/         # Bidder and admin pages
    │   ├── services/      # API client and error handling
    │   └── utils/         # Cloudinary, currency, date, and storage helpers
    └── package.json
```

## Prerequisites

- Python 3.14 or a compatible Python version supported by the deployment image
- Node.js and npm
- A database; SQLite is sufficient for local development
- Optional for full functionality: Cloudinary, Resend, and Hunter credentials

## Local development

### 1. Start the backend

From the repository root:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment:

```powershell
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
```

```bash
# macOS/Linux
source .venv/bin/activate
```

Install dependencies and configure environment variables:

```bash
pip install -r requirements.txt
copy .env.example .env
```

On macOS/Linux, use `cp .env.example .env` instead of `copy`.

For a local SQLite database, the default `DATABASE_URL` can be used. Before starting the API, apply the migrations:

```bash
alembic upgrade head
uvicorn app.main:app --reload
```

The API is available at `http://localhost:8000`. Interactive OpenAPI documentation is available at `http://localhost:8000/docs`.

### 2. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

On macOS/Linux, use `cp .env.example .env`.

The Vite development server normally runs at `http://localhost:5173`. Set `VITE_API_URL` in `frontend/.env` to the backend URL if it differs from the default `http://localhost:8000`.

## Environment variables

### Backend

Copy [`backend/.env.example`](backend/.env.example) for a complete starting point. Important settings include:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLAlchemy database connection string |
| `SECRET_KEY` | Secret used to sign access tokens |
| `ALGORITHM` | JWT signing algorithm, normally `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access-token lifetime |
| `MIN_BID_INCREMENT` | Minimum bid increment for the default currency |
| `MIN_BID_INCREMENT_USD` | Minimum bid increment for USD artwork |
| `MAX_ARTWORKS` | Maximum number of artwork listings |
| `DEFAULT_ARTWORK_CURRENCY` | Currency assigned to new artwork, defaulting to `NGN` |
| `FRONTEND_URL` | Canonical frontend URL |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowlist |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credentials for the admin login |
| `RESEND_API_KEY` / `EMAIL_FROM` | Welcome and bidding email configuration |
| `HUNTER_API_KEY` / `HUNTER_EMAIL_VERIFY_URL` | Optional email validation service |
| `ENV` | Set to `production` to enable production security checks |

Never commit real credentials. In production, use a unique `SECRET_KEY` of at least 32 characters and a strong admin password.

### Frontend

Copy [`frontend/.env.example`](frontend/.env.example). The frontend uses:

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Base URL of the FastAPI backend |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Cloudinary unsigned upload preset |

## API overview

The backend exposes these main route groups:

| Area | Routes |
| --- | --- |
| Authentication | `POST /register`, `POST /login`, `POST /logout` |
| Auction and artwork browsing | `GET /auction-window`, `GET /artworks`, `GET /artworks/{id}` |
| Bidding | `POST /artworks/{id}/bid` |
| Administration | `POST /admin/login`, admin auction-window management, artwork CRUD, bid review, and auction closing |

Use the generated documentation at `/docs` for request schemas, response formats, and the complete endpoint list.

## Database migrations

Alembic owns the database schema lifecycle. From `backend/`:

```bash
alembic upgrade head
```

To inspect the current migration:

```bash
alembic current
```

When changing models, create and review a migration before deploying it:

```bash
alembic revision --autogenerate -m "describe the schema change"
alembic upgrade head
```

## Quality checks

Frontend commands are run from `frontend/`:

```bash
npm run lint
npm run build
npm test
```

`npm test` runs Vitest in watch mode. Use `npm test -- --run` for a single non-watch test run.

## Deployment

- **Frontend:** The `frontend/` directory is configured for Vercel. Set the frontend environment variables in the Vercel project.
- **Backend:** The backend includes Docker and deployment configuration for Railway and Render. Both deployment paths apply Alembic migrations before starting Uvicorn.
- **Production database:** Use PostgreSQL and set `DATABASE_URL` to the managed database connection string.
- **CORS:** Set `ALLOWED_ORIGINS` to the deployed frontend origin rather than leaving only localhost origins.

The backend container starts with:

```bash
alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Security notes

- Authentication is protected by rate limits on registration, login, admin login, and bidding.
- Access tokens are returned to the frontend and also stored in HTTP-only cookies.
- Production configuration rejects weak or short JWT secrets.
- Admin actions and authentication events are written to audit logs.
- Keep `.env` files and all third-party API keys outside version control.

## Project context

Canvas for a Cause is presented as an exclusive charity art auction hosted by the Pan-Atlantic University Student Council. The platform is intended to connect collectors, artists, students, and guests while directing auction proceeds toward charity initiatives.
