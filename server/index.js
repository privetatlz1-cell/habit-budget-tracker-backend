const path = require('path');
const express = require('express');
const cors = require('cors');
const habitRoutes = require('./routes/habits');
const budgetRoutes = require('./routes/budget');
const budgetPlanRoutes = require('./routes/budgetPlans');
const dailyNoteRoutes = require('./routes/dailyNotes');
const sleepRoutes = require('./routes/sleep');
const eventRoutes = require('./routes/events');
const taskRoutes = require('./routes/tasks');
const telegramRoutes = require('./routes/telegram');
const { errorHandler } = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  credentials: true
}));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use(express.json());

app.use('/api/telegram', telegramRoutes);
app.use('/api/habits', authenticate, habitRoutes);
app.use('/api/budget', authenticate, budgetRoutes);
app.use('/api/budget-plans', authenticate, budgetPlanRoutes);
app.use('/api/daily-notes', authenticate, dailyNoteRoutes);
app.use('/api/sleep', authenticate, sleepRoutes);
app.use('/api/events', authenticate, eventRoutes);
app.use('/api/tasks', authenticate, taskRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// Serve client build in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '..', 'build');
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

app.use(errorHandler);

db.sync({ alter: true })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed', err);
    process.exit(1);
  });






