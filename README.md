# DonateNow

A full-stack donation application with TDD (pytest + vitest).

## Tech Stack

| Layer    | Technology                                    |
| -------- | --------------------------------------------- |
| Backend  | Django REST Framework + SQLite                |
| Python   | `uv` for dependency management                |
| Frontend | React + TypeScript + Vite + TailwindCSS v4  |
| Tests    | pytest (backend) + vitest + RTL (frontend)  |
| Docker   | Dockerfile for backend + docker-compose     |

## Project Structure

```
donation-app/
├── backend/                  # Django REST Framework app
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── pyproject.toml        # uv-managed dependencies + pytest config
│   ├── manage.py
│   ├── conftest.py           # pytest fixtures
│   ├── donation_project/     # Django project (settings, urls, wsgi)
│   └── donations/
│       ├── models.py           # Donation model with payment fields
│       ├── serializers.py      # Validation + write-only card_number
│       ├── views.py            # ViewSet with payment processing + retry
│       ├── payment_gateway.py  # Mock M-Pesa STK Push + Card simulator
│       ├── admin.py            # Rich admin with filters
│       └── tests/
│           ├── test_models.py  # 5 model tests
│           ├── test_api.py     # 15 API tests (creation, validation, retry, summary)
│           └── test_payment_gateway.py  # 7 payment gateway tests
│
├── frontend/                 # Vite + React + TS + Tailwind
│   ├── vitest.config.ts       # Vitest config (jsdom, globals, setup)
│   ├── src/
│   │   ├── api.ts             # Axios client + typed interfaces
│   │   ├── api.test.ts        # 5 API client tests
│   │   ├── App.tsx
│   │   ├── test-setup.ts       # jest-dom matchers
│   │   └── components/
│   │       ├── DonationForm.tsx        # Form + payment flow + states
│   │       ├── DonationForm.test.tsx   # 11 form tests
│   │       ├── DonationsList.tsx       # Stats + table
│   │       └── DonationsList.test.tsx  # 6 list tests
│   └── vite.config.ts         # Proxy /api and /admin to backend
│
└── docker-compose.yml          # Orchestrates both services
```

## Quick Start (Local Dev)

### Backend

```bash
cd backend
uv sync
uv run python manage.py migrate
uv run python manage.py runserver 0.0.0.0:8000
```

Admin panel:  http://localhost:8000/admin/  
Credentials:  `admin` / `adminpass123`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend:  http://localhost:5173

### Docker

```bash
docker compose up --build
```

## Running Tests

### Backend (pytest)

```bash
cd backend
uv run pytest -v                    # all tests
uv run pytest donations/tests/ -v   # donation tests only
```

**27 backend tests** covering:
- Model creation, defaults, ordering, string representation
- API creation with M-Pesa and Card payment methods
- Validation (missing phone, invalid card, expired expiry, invalid format)
- Retry endpoint behavior
- Summary aggregation
- Payment gateway simulation (M-Pesa random outcomes, test card always succeeds)

### Frontend (vitest)

```bash
cd frontend
npm test             # run once
npm run test:watch   # watch mode
npm run test:ui      # browser UI
```

**22 frontend tests** covering:
- Security banner renders with correct text
- Form renders all required fields
- Payment method toggle (M-Pesa ↔ Card) shows correct conditional fields
- Custom validation errors display
- M-Pesa form submission with correct API call
- Card form submission with card details
- Success state shows transaction ID, email confirmation, payment method
- Failure state shows error message, retry button, helpful tip
- Retry API call on button click
- Loading spinner during processing
- DonationsList: loading, stats cards, empty state, refresh, status badges, payment methods

## API Endpoints

| Method | URL                            | Description                        |
| ------ | ------------------------------ | ---------------------------------- |
| POST   | `/api/donations/`              | Create + process payment           |
| GET    | `/api/donations/`              | List all (paginated)               |
| GET    | `/api/donations/{id}/`         | Retrieve one                       |
| POST   | `/api/donations/{id}/retry/`   | Retry failed payment               |
| GET    | `/api/donations/summary/`      | Aggregate stats by currency/method |

### Payment Flow

```
Donor enters details → selects M-Pesa or Card → submits
                                    ↓
Backend creates record (status=INITIATED)
                                    ↓
Mock Payment Gateway simulates response (1.5s delay)
                                    ↓
Backend updates status: SUCCESS or FAILED
                                    ↓
Frontend shows: success confirmation + tx ID, or failure + retry button
```

- **M-Pesa**: 80% success rate, simulates STK Push
- **Card**: Test card `4242 4242 4242 4242` always succeeds; other cards 75% success
- Full card numbers are **never stored** — only last 4 digits kept
- Retry endpoint requires card number again for card payments