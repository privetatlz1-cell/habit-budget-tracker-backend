# Database Migrations

This directory contains database migration scripts for the Habit & Budget Tracker application.

## Running Migrations

### Option 1: Using npm script (Recommended)
```bash
npm run migrate
```

### Option 2: Direct execution
```bash
node server/migrations/001-add-frequency-schedule-to-habits.js
```

## Migration Files

### 001-add-frequency-schedule-to-habits.js
Adds the `frequency` and `schedule` columns to the `Habits` table:
- `frequency`: VARCHAR(255), default 'daily'
- `schedule`: JSONB, default NULL

This migration is idempotent - it can be run multiple times safely. It will check if columns exist before adding them.

## Prerequisites

- PostgreSQL database must be running
- `DATABASE_URL` environment variable must be set in `.env` file
- Database connection must be accessible

## Troubleshooting

If you encounter errors:
1. Ensure your database is running
2. Check that `DATABASE_URL` is correctly set in `.env`
3. Verify you have permissions to alter the database schema
4. If columns already exist, the migration will skip adding them (safe to re-run)


