# Habit & Budget Tracker

A modern full-stack React/Express/Postgres app for tracking habits and personal finances.

## Features

- Track daily habits, visualize progress (weekly/monthly/calendar)
- Add/edit/delete incomes and expenses, see monthly/yearly summaries & pie/bar charts
- Dashboard combines both: progress widgets, charts, checklist UI
- Responsive minimalist pastel UI (light blue, pink, green)
- One-command setup (with Docker option)

## Folder Structure

```
/
├── README.md
├── package.json
├── .env.example
├── Dockerfile
├── public/
│     └── index.html
├── src/
│     ├── App.jsx
│     ├── index.js
│     ├── main.css
│     ├── components/
│     │     ├── Dashboard.jsx
│     │     ├── HabitTracker/
│     │     │     ├── HabitList.jsx
│     │     │     ├── CalendarView.jsx
│     │     │     └── ProgressCircle.jsx
│     │     ├── BudgetTracker/
│     │     │     ├── BudgetList.jsx
│     │     │     ├── PieChart.jsx
│     │     │     └── BarChart.jsx
│     │     └── Shared/
│     │           ├── Navbar.jsx
│     │           └── Widget.jsx
│     ├── api/
│     │      ├── habits.js
│     │      └── budget.js
│     └── utils/
│            ├── constants.js
│            └── format.js
├── server/
│     ├── index.js
│     ├── db.js
│     ├── models/
│     │     ├── habit.js
│     │     └── budget.js
│     ├── routes/
│     │     ├── habits.js
│     │     └── budget.js
│     ├── seed/
│     │     └── sampleData.sql
│     └── middleware/
│           └── errorHandler.js
└── .gitignore
```

## Setup

1. Copy `.env.example` to `.env` and fill `DATABASE_URL`
2. `npm install`
3. (optional) Seed db: ensure Postgres is running, then `psql < server/seed/sampleData.sql`
4. `npm run dev` (concurrently starts server and client)

## Docker

```
docker build -t habit-budget .
docker run -p 3000:3000 -e DATABASE_URL=postgres://user:pass@host/db habit-budget
```

## Tech Stack

- React + Tailwind
- Node.js + Express
- PostgreSQL (via Sequelize)
- Chart.js

---

See source for full code details and customization. Well commented and modularized for extension.






