# LeetCode Student Analytics Portal

Run all commands from this `leetcode/` directory.

A MERN-stack platform for instructors to track student LeetCode progress across classrooms and divisions. Public shareable dashboards show leaderboards, daily activity, topics, streaks, and individual student profiles.

## Features

- **Classrooms & Divisions** — organize students into batches and sections
- **Public dashboards** — share `/c/your-classroom-slug` with students
- **LeetCode sync** — automatic background sync every 6 hours + manual sync
- **Analytics** — leaderboards, daily submissions chart, topic coverage, division comparison
- **Student onboarding** — instructor add, bulk CSV import, or self-join with approval
- **Individual profiles** — heatmap, difficulty breakdown, progress history

## Tech Stack

- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT, leetcode-query
- **Frontend:** React 18, Vite, Tailwind CSS, Recharts

## Quick Start (Local)

### Prerequisites

- Node.js 18+
- MongoDB running locally (or use Docker Compose)

### 1. Install dependencies

```bash
npm run install-all
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` and set `JWT_SECRET` to a secure random string.

### 3. Start MongoDB (if not running)

```bash
docker compose up mongodb -d
```

### 4. Run development servers

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## Usage

### Instructor setup

1. Register at http://localhost:5173/admin/register
2. Create a classroom from the dashboard
3. Add divisions and students (or share the join link)
4. Click **Sync Now** to fetch LeetCode data
5. Copy the public link (`/c/your-slug`) and share with students

### Student self-join

1. Open `/c/your-classroom-slug/join`
2. Enter name, LeetCode username, and division
3. Wait for instructor approval

### Public dashboard

Visit `/c/your-classroom-slug` to see:

- Summary stats (students, avg solved, active today, streaks)
- Top students leaderboard (sortable)
- Daily submission activity (30 days)
- Topic coverage chart
- Division comparison
- Inactive student alerts
- Searchable student table

## Docker (Full Stack)

```bash
export JWT_SECRET=your-secure-secret
docker compose up --build
```

- App: http://localhost:5173
- API: http://localhost:5000/api

## API Overview

| Route | Auth | Description |
|-------|------|-------------|
| `POST /api/auth/register` | No | Create instructor account |
| `POST /api/auth/login` | No | Instructor login |
| `GET /api/public/classrooms/:slug` | No | Classroom metadata |
| `GET /api/public/classrooms/:slug/analytics` | No | Full analytics dashboard |
| `POST /api/public/classrooms/:slug/join` | No | Student self-registration |
| `POST /api/classrooms/:id/sync` | JWT | Manual LeetCode sync |

## Bulk Import Format

One student per line in the Bulk Import tab:

```
Alice Smith, alice_lc
Bob Kumar, bob_codes
```

## Environment Variables

**Backend (`backend/.env`):**

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for JWT signing |
| `PORT` | API port (default 5000) |
| `SYNC_INTERVAL_HOURS` | Auto-sync interval (default 6) |
| `FRONTEND_URL` | CORS origin |

**Frontend (`frontend/.env`):**

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL (default `/api` via Vite proxy) |

## Notes

- LeetCode data is fetched from their public GraphQL API (unofficial). Sync is rate-limited.
- Topic breakdown improves over time as problem cache and student solve history grow.
- Full submission history requires student LeetCode session cookies (not included in v1).
