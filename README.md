#  Invest Tracker Portfolio- Backend

A robust RESTful API designed to manage mutual fund investments, offering user authentication, portfolio tracking, real-time NAV updates, and historical performance analysis. Built with Node.js, Express, and MongoDB, it integrates with external MFAPI for fund data, ensuring secure and efficient investment management.

**Why This Project Matters?**

-Investors often hold multiple mutual fund schemes and need a single place to track them.

-NAV (Net Asset Value) changes daily, directly affecting portfolio value.

-Historical tracking provides insights into long-term performance trends.

-Real-time data integration ensures accurate and up-to-date calculations.


A **Node.js + Express backend API** for managing mutual fund portfolios.  
It integrates with the [MFAPI](https://www.mfapi.in/) to fetch **real-time** and **historical NAV (Net Asset Value)** data, while offering **user authentication, portfolio management, rate limiting, logging, and scheduled NAV updates**.  

This backend is designed for **robustness, security, and scalability** — following industry best practices.

---

##  Key Functionalities (Detailed)

###  Authentication & User Management
- **Signup (Register)**
  - Validates name, email, and strong password.
  - Passwords are hashed with `bcrypt` before saving.
  - On success → User is stored in MongoDB, JWT issued, and secure cookie set.

- **Login**
  - Validates email and password.
  - Uses bcrypt to compare hashed passwords.
  - JWT issued on success → stored in **HttpOnly cookie** (prevents XSS token theft).
  - Login attempts are **rate limited** (max 5/min per user/IP).

- **Auth Middleware**
  - Every protected API reads the token from cookies.
  - Verifies with `jwt.verify()` and attaches `req.user`.
  - Expired or tampered tokens are blocked.

---

###  Portfolio Management
- **Add Fund (`POST /portfolio/add`)**
  - Validates schemeCode against master fund list.
  - Validates units (> 0).
  - Adds fund entry to user’s portfolio (or prevents duplicates).

- **Remove Fund (`DELETE /portfolio/remove/:schemeCode`)**
  - Validates schemeCode.
  - Removes it from portfolio.

- **Get Portfolio List (`GET /portfolio/list`)**
  - Returns all funds in user’s portfolio with units and purchase date.

- **Get Portfolio Value (`GET /portfolio/value`)**
  - Fetches the latest NAV for each fund.
  - Calculates:
    - `totalValue = NAV * units`
    - `investedValue = Purchase NAV * units`
    - `profitLoss = totalValue - investedValue`
  - Can accept optional `asOn` date for historical calculation.

- **Get Portfolio History (`GET /portfolio/history`)**
  - Accepts `startDate` and `endDate`.
  - Fetches NAV history for all portfolio funds in that range.
  - Computes value and profit/loss per date.
  - Returns a **time series portfolio performance dataset**.

---

###  Fund APIs
- **Fund List (`GET /funds`)**
  - Returns list of all funds (from MFAPI).
  - Supports search, pagination (`page`, `limit`).
  - Fund master data cached in MongoDB.

- **Fund NAV History (`GET /funds/:schemeCode/nav`)**
  - Validates schemeCode.
  - Fetches NAV history from MFAPI (or cached DB).
  - Supports `startDate`, `endDate` filtering.

---

### Cron Jobs (Scheduled Tasks)
- A daily job (via `node-cron`) runs to:
  - Fetch **latest NAVs** for all tracked funds.
  - Update `LatestFundNAV` and `HistoryFundNAV` collections.
- Built-in **retry with exponential backoff**:
  - Retries failed API calls (1s, 2s, 4s, … up to 30s max).

---

###  Security Features
- **Password Hashing** → bcrypt (10 salt rounds).
- **JWT Auth** → stored in **HttpOnly + Secure cookies**.
- **Rate Limiting**
  - General API: 100 requests/min/user
  - Login: 5 attempts/min
  - Portfolio Updates: 10 actions/min/user
  - Fund APIs: 50 requests/min/user
- **Validation** → `express-validator` for all inputs (body, params, query).
- **CORS** → enabled for frontend integration.
- **Centralized Error Handler** → returns consistent JSON with HTTP codes.
- **Environment Variables** → secrets managed via `.env` file.

---

##  Tech Stack

- **Runtime:** Node.js  
- **Framework:** Express.js  
- **Database:** MongoDB (via Mongoose)  
- **Auth:** JWT + bcrypt  
- **External API:** [MFAPI](https://www.mfapi.in/)  
- **Scheduler:** node-cron  
- **Validation:** express-validator  
- **Security:** express-rate-limit, cookie-parser, dotenv  
- **Logging:** Morgan  

---

##  Folder Structure

```
backend/
├── app.js                 # Express app setup
├── server.js              # Server bootstrap
├── src/
│   ├── config/            # Database connection
│   ├── controllers/       # Request handlers (auth, portfolio, funds)
│   ├── cron/              # Cron jobs for NAV updates
│   ├── helpers/           # Validation, JWT token, status codes, retry
│   ├── middlewares/       # Error handler, auth check, logging
│   ├── models/            # MongoDB models
│   ├── routes/            # API route definitions
│   ├── services/          # Business logic (funds + portfolio)
│   └── utils/             # Rate limiter, logger
└── README.md
```

---

##  Setup & Installation

### Clone the repo
```bash
git clone https://github.com/Niranjan-PS/invest-tracker-backend.git
cd invest-tracker-backend
```

### Install dependencies
```bash
npm install
```

### Setup environment variables  
Create a `.env` file:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/invest-tracker
JWT_SECRET=your_secret_key
NODE_ENV=development

# External APIs
MF_API_FUND_LIST=https://api.mfapi.in/mf
MF_API_NAV_HISTORY=https://api.mfapi.in/mf/{schemeCode}
MF_API_LATEST_NAV=https://api.mfapi.in/mf/{schemeCode}/latest
```

###  Run the server
```bash
npm run dev   # development
npm start     # production
```

---

##  Data Models (Schemas)

###  User
- `name`, `email` (unique), `password` (hashed)
- `role` (user | admin)
- `isActive`, `lastLoginAt`
- Auto timestamps (`registeredAt`, `lastUpdatedAt`)

### Fund
- `schemeCode`, `schemeName`
- `isinGrowth`, `isinDivReinvestment`

###  Portfolio
- `userId` (ref User), `schemeCode`, `units`, `purchaseDate`
- Compound index `{ userId, schemeCode }` → avoids duplicates

###  LatestFundNAV
- `schemeCode`, `nav`, `date`, `updatedAt`

###  HistoryFundNAV
- `schemeCode`, `nav`, `date`, `createdAt`

---

##  API Endpoints

### Auth
| Method | Endpoint         | Description |
|--------|------------------|-------------|
| POST   | `/api/auth/signup` | Register new user |
| POST   | `/api/auth/login`  | Login and get JWT cookie |

### Portfolio
| Method | Endpoint                  | Description |
|--------|---------------------------|-------------|
| POST   | `/api/portfolio/add`      | Add fund to portfolio |
| DELETE | `/api/portfolio/remove/:schemeCode` | Remove fund |
| GET    | `/api/portfolio/list`     | List all funds in portfolio |
| GET    | `/api/portfolio/value`    | Get portfolio value & P/L |
| GET    | `/api/portfolio/history`  | Portfolio NAV history |

### Funds
| Method | Endpoint                  | Description |
|--------|---------------------------|-------------|
| GET    | `/api/funds`              | Fetch fund list (search + pagination) |
| GET    | `/api/funds/:schemeCode/nav` | Get NAV history of fund |

---

##  Cron Jobs

- **Runs daily** (configurable in `cronJob.js`)  
- Fetches and updates NAVs for:
  - `LatestFundNAV`
  - `HistoryFundNAV`  
- Uses **retry with exponential backoff** for failed API calls.  


Licensed under the **MIT License**.


## Conclusion 

This project provides a production-ready backend system for managing mutual fund portfolios with real-time NAV integration.  
It follows **industry best practices** in terms of code structure, modular design, error handling, rate limiting, and security.


