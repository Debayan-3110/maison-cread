# 🚀 ShopCread E-Commerce Platform — Run & Build Guide (`RUN.md`)

Welcome to the **ShopCread** full-stack e-commerce platform. This document provides step-by-step instructions to install, build, configure, run, and troubleshoot the application across Windows, macOS, and Linux.

---

## 📋 Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Quick Start (Windows One-Click)](#3-quick-start-windows-one-click)
4. [Step-by-Step Manual Setup](#4-step-by-step-manual-setup)
   - [Backend Setup (FastAPI)](#step-41-backend-setup-fastapi)
   - [Frontend Setup (React + Vite)](#step-42-frontend-setup-react--vite)
5. [Running the Application](#5-running-the-application)
   - [Option A: Concurrent Runner (Single Command)](#option-a-concurrent-runner-single-terminal)
   - [Option B: Two Dedicated Terminals (Recommended for Dev)](#option-b-two-dedicated-terminals-recommended)
6. [Building for Production](#6-building-for-production)
7. [Default URLs & Service Ports](#7-default-urls--service-ports)
8. [Authentication, 2FA & Dev Mailbox Workflow](#8-authentication-2fa--dev-mailbox-workflow)
9. [Environment Variables Reference](#9-environment-variables-reference)
10. [Troubleshooting & FAQs](#10-troubleshooting--faqs)

---

## 1. Architecture Overview

- **Frontend (`/frontend`)**:
  - React 19 + TypeScript + Vite 8
  - Tailwind CSS v4 styling
  - Framer Motion animations & Lucide React icons
  - Canvas Confetti for order celebration
  - Automatic API reverse proxy (`/api` routed to backend on `http://127.0.0.1:8000`)
- **Backend (`/backend`)**:
  - FastAPI (Python 3.10+) with Uvicorn ASGI server
  - SQLite Database (`backend/ecommerce.db` with auto-migration on startup)
  - Enterprise Auth: JWT access & refresh tokens, HTTP-only cookies, CSRF protection
  - Two-Factor Authentication (TOTP via PyOTP & QR Code generation)
  - Dev Mailbox (in-memory & SQLite mock email system for instant token verification)
  - Embedded AI Shopping Assistant (`/api/chat` and `/chat`)

---

## 2. Prerequisites

Ensure your system meets the following requirements:

| Tool | Minimum Version | Recommended | Notes |
| :--- | :--- | :--- | :--- |
| **Python** | `3.10+` | `3.11` – `3.14` | Added to system `PATH` |
| **Node.js** | `v18.0.0+` | `v20+` or `v22+` | Includes `npm` |
| **npm** | `v9.0.0+` | `v10+` | On Windows PowerShell, use `npm.cmd` if `.ps1` is restricted |
| **Git** | `2.x+` | Latest | Optional, for version control |

Verify installations:
```bash
python --version
node -v
npm -v
```

---

## 3. Quick Start (Windows One-Click)

If you are on Windows, a helper script is included in the project root:

1. Double-click **`start_local.bat`** (or execute `.\start_local.bat` from PowerShell/Command Prompt).
2. The batch script automatically opens two terminal windows:
   - Window 1: FastAPI Backend (`http://127.0.0.1:8000`)
   - Window 2: Vite Frontend Dev Server (`http://127.0.0.1:5173`)
3. Open your browser and navigate to: **[http://localhost:5173](http://localhost:5173)**

---

## 4. Step-by-Step Manual Setup

### Step 4.1: Backend Setup (FastAPI)

1. **Open a terminal in the project root**:
   ```bash
   cd c:\Users\debay\Downloads\E-commerce
   ```

2. **(Recommended) Create and activate a Python Virtual Environment**:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
     *(If script execution is disabled, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first)*
   - **Windows (CMD)**:
     ```cmd
     python -m venv .venv
     .\.venv\Scripts\activate.bat
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Install Python dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```
   *Core packages installed: `fastapi`, `uvicorn`, `pydantic`, `bcrypt`, `pyjwt`, `pyotp`, `qrcode`, `python-dotenv`.*

4. **Verify / Configure Environment Variables**:
   A default `backend/.env` is provided. If missing or customizing:
   ```env
   PROJECT_NAME="ShopCread"
   JWT_SECRET_KEY="enterprise-super-secret-key-12345"
   DATABASE_URL="sqlite:///./ecommerce.db"
   OPENAI_API_KEY="your_openai_api_key_here"  # Optional: enables live OpenAI answers
   ```

---

### Step 4.2: Frontend Setup (React + Vite)

1. **Navigate into the `frontend` folder**:
   ```bash
   cd frontend
   ```

2. **Install Node dependencies**:
   - **Windows PowerShell**:
     ```powershell
     npm.cmd install
     ```
   - **CMD / Bash**:
     ```bash
     npm install
     ```

---

## 5. Running the Application

### Option A: Concurrent Runner (Single Terminal)

You can run both Backend and Frontend together from the `frontend/` directory using the built-in `concurrently` script:

```powershell
cd frontend
npm.cmd run dev
```
*(On macOS/Linux: `npm run dev`)*

This starts:
- `[BACKEND]` on port `8000`
- `[FRONTEND]` on port `5173`

---

### Option B: Two Dedicated Terminals (Recommended)

Running backend and frontend in separate terminals makes debugging and viewing logs much easier:

#### Terminal 1 — Backend (FastAPI):
```powershell
# From project root:
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Health Check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

#### Terminal 2 — Frontend (Vite):
```powershell
# In a second terminal:
cd frontend
npm.cmd run dev:frontend
```
- Storefront UI: [http://localhost:5173](http://localhost:5173)

---

## 6. Building for Production

### Frontend Production Build

To compile and bundle the React TypeScript frontend:

```powershell
cd frontend
npm.cmd run build
```

- Output directory: `frontend/dist/`
- Vite bundles optimized assets, CSS, and HTML.

To preview the built production bundle locally:
```powershell
npm.cmd run preview
```

---

## 7. Default URLs & Service Ports

| Service | Local URL | Description |
| :--- | :--- | :--- |
| **Storefront Web App** | [http://localhost:5173](http://localhost:5173) | Main React customer shopping UI |
| **FastAPI Swagger Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | Interactive OpenAPI testing console |
| **FastAPI ReDoc** | [http://localhost:8000/redoc](http://localhost:8000/redoc) | Clean API documentation reference |
| **API Health Check** | [http://localhost:8000/api/health](http://localhost:8000/api/health) | Backend status, DB connection, uptime |
| **Dev Mailbox Endpoint** | [http://localhost:8000/api/auth/dev-emails](http://localhost:8000/api/auth/dev-emails) | View mock verification / reset emails |
| **Standalone AI Chat** | [http://localhost:8000/chat](http://localhost:8000/chat) | Embedded shopping assistant page |

---

## 8. Authentication, 2FA & Dev Mailbox Workflow

The application implements zero-trust security without requiring external email SMTP servers:

### 1. User Registration & Verification:
1. Click **Sign In** in the top navigation bar, then select **Register**.
2. Enter an email, password, and full name.
3. Upon registration, an email is dispatched to the internal **Dev Mailbox**.
4. Open the **Dev Mailbox Modal** in the UI (or browse to `http://localhost:8000/api/auth/dev-emails`) to view the verification link or token.
5. Click the verification link or submit the token to activate the account.

### 2. Two-Factor Authentication (2FA / TOTP):
1. Navigate to **Account Security** in the user menu.
2. Click **Enable 2FA**. A TOTP QR code is rendered alongside backup recovery codes.
3. Scan the code using Google Authenticator, Microsoft Authenticator, 1Password, or Authy.
4. Enter the 6-digit TOTP code to complete activation. Subsequent logins will prompt for 2FA.

### 3. CSRF & Session Security:
- All modifying requests (`POST`, `PUT`, `DELETE`) require a CSRF token provided automatically via `/api/csrf-token` and stored in an HTTP-only secure cookie.
- The Vite development proxy seamlessly forwards CSRF cookies between port `5173` and `8000`.

---

## 9. Environment Variables Reference

Configuration values can be set in `.env` (root) or `backend/.env`:

| Key | Default Value | Description |
| :--- | :--- | :--- |
| `PROJECT_NAME` | `ShopCread` | Application display name |
| `JWT_SECRET_KEY` | `enterprise-super-secret-key-12345` | Cryptographic secret for signing tokens |
| `DATABASE_URL` | `sqlite:///./ecommerce.db` | SQLite database file location |
| `OPENAI_API_KEY` | `your_openai_api_key_here` | *(Optional)* OpenAI key for chatbot intelligence |

---

## 10. Troubleshooting & FAQs

### Q1: `npm : File ... npm.ps1 cannot be loaded because running scripts is disabled on this system`
- **Cause**: Windows PowerShell security policy blocks `.ps1` execution by default.
- **Solution**:
  1. Use `npm.cmd` instead of `npm` (e.g., `npm.cmd install`, `npm.cmd run dev`).
  2. Or allow script execution in your PowerShell session:
     ```powershell
     Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
     ```

### Q2: `Error: listen EADDRINUSE: address already in use 127.0.0.1:8000` or `5173`
- **Cause**: Another instance of Python or Node is already running on the port.
- **Solution**:
  - Check active processes on Windows PowerShell:
    ```powershell
    Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process -Force
    Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process -Force
    ```

### Q3: `no such table: products` or database errors
- **Cause**: The SQLite database hasn't been initialized.
- **Solution**: Restart the FastAPI backend (`python -m uvicorn backend.main:app`). The backend runs `init_db()` automatically on startup, verifying and creating all required tables and indexes in `backend/ecommerce.db`.

### Q4: Products not loading on the frontend
- **Cause**: Frontend cannot reach backend API.
- **Solution**: Ensure the FastAPI server is running on `http://127.0.0.1:8000` and visit `http://127.0.0.1:8000/api/health` to confirm it returns `{"status": "healthy"}`. Check that `frontend/vite.config.ts` has the proxy configured to target `http://127.0.0.1:8000`.

---

*Documentation prepared for ShopCread E-Commerce. Run `start_local.bat` or `npm.cmd run dev` to start.*

