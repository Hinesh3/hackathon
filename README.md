# AtomQuest Goal Setting & Tracking Portal

A full-featured web-based Goal Setting & Tracking Portal built for **Atomberg AtomQuest Hackathon 1.0**.

## 🚀 Live Demo
> [Deployment URL will be added after Vercel deploy]

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Employee 1 | employee@performedge.com | Employee@123 |
| Employee 2 | employee2@performedge.com | Employee@123 |
| Manager | manager@performedge.com | Manager@123 |
| Admin | admin@performedge.com | Admin@123 |

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Hosting | Vercel  |
| Export | SheetJS (xlsx) |

## ✅ Features Implemented

### Phase 1 — Goal Creation & Approval
- Goal creation with Thrust Area, UoM (4 types), Target, Weightage
- Live validation: 100% total, min 10%, max 8 goals
- Manager inline edit + approve/return workflow
- Goal locking on approval, audit-logged
- Shared Goals — Admin pushes read-only KPIs to employees

### Phase 2 — Achievement Tracking
- Quarterly achievement input (Q1–Q4 + Annual)
- Status: Not Started / On Track / Completed
- Auto-computed scores for all 4 UoM types
- Manager check-in with structured comments

### Admin & Reporting
- CSV + Excel export of achievement reports
- Completion dashboard with real-time check-in rates
- Audit trail (who changed what and when)
- Cycle management with quarterly window configuration
- User management with role assignment

## 🏃 Running Locally

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/atomquest-goal-portal.git
cd atomquest-goal-portal

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in your Firebase credentials in .env

# 4. Run dev server
npm run dev

# 5. First time: Click "Setup Demo Data" on the login page
```

## 🏗 Architecture

```
React + Vite  ──→  Firebase Auth (login/roles)
     │
     └──→  Firestore DB
              ├── users
              ├── goals
              ├── achievements
              ├── cycles
              └── auditLogs
```

**Hosted on Vercel** — free tier, auto-deploys from GitHub, global CDN.
**Cost: $0/month** — Firebase Spark plan (free) + Vercel Hobby (free).

## 📁 Project Structure

```
src/
├── firebase/      # Firestore modules (goals, users, achievements, audit)
├── context/       # Auth context
├── components/    # Reusable UI (Sidebar, Modal, UI components)
├── pages/
│   ├── employee/  # Dashboard, GoalsList, NewGoal, GoalDetail
│   ├── manager/   # Dashboard, TeamView, Approvals
│   └── admin/     # Dashboard, Users, Cycles, Reports, AuditLog, SharedGoals
└── utils/         # Scoring calculations, export utilities
```
