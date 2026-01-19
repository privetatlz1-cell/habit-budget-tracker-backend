const express = require('express');
const router = express.Router();
const { Habit, HabitCompletion } = require('../models/habit');
const { Op } = require('sequelize');

// GET /api/habits — list all habits with completions
router.get('/', async (req, res, next) => {
  try {
    const telegramUserId = req.user.telegramUserId;
    const habits = await Habit.findAll({
      where: { telegramUserId },
      include: HabitCompletion
    });
    res.json(habits);
  } catch (e) {
    next(e);
  }
});

// POST /api/habits — create a habit
router.post('/', async (req, res, next) => {
  try {
    const { name, description, category, frequency, schedule } = req.body;
    const telegramUserId = req.user.telegramUserId;

    // Validate name
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required and must be a non-empty string' });
    }

    // Validate frequency
    const validFrequencies = ['daily', 'weekly', 'monthly'];
    const habitFrequency = frequency && validFrequencies.includes(frequency) ? frequency : 'daily';
    
    // Validate schedule based on frequency
    let habitSchedule = null;
    if (habitFrequency === 'weekly') {
      // Schedule should be an array of day names: ["mon", "wed", "fri"]
      if (!Array.isArray(schedule) || schedule.length === 0) {
        return res.status(400).json({ error: 'Weekly habits require a schedule with at least one day selected' });
      }
      const validDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
      habitSchedule = schedule
        .map(day => typeof day === 'string' ? day.toLowerCase() : day)
        .filter(day => validDays.includes(day));
      
      if (habitSchedule.length === 0) {
        return res.status(400).json({ error: 'Schedule must contain valid day names (mon, tue, wed, thu, fri, sat, sun)' });
      }
    } else if (habitFrequency === 'monthly') {
      // Schedule should be an array of day numbers: [1, 15, 30]
      if (!Array.isArray(schedule) || schedule.length === 0) {
        return res.status(400).json({ error: 'Monthly habits require a schedule with at least one day selected' });
      }
      habitSchedule = schedule
        .map(day => parseInt(day, 10))
        .filter(day => !isNaN(day) && day >= 1 && day <= 31);
      
      if (habitSchedule.length === 0) {
        return res.status(400).json({ error: 'Schedule must contain valid day numbers (1-31)' });
      }
    }
    // For daily, schedule is null (which is valid)

    const habit = await Habit.create({
      telegramUserId,
      name: name.trim(),
      description: description ? description.trim() : null,
      category: category ? category.trim() : 'General',
      frequency: habitFrequency,
      schedule: habitSchedule
    });

    res.status(201).json(habit);
  } catch (e) {
    next(e);
  }
});

// POST /api/habits/:id/complete — mark completion for a date (default today)
router.post('/:id/complete', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { date, completed } = req.body || {};
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const telegramUserId = req.user.telegramUserId;
    const habit = await Habit.findOne({ where: { id, telegramUserId } });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    const isoDate = (date || new Date().toISOString().slice(0,10));
    const isCompleted = completed === false ? false : true;

    // upsert completion for that date - using HabitId to ensure unique per habit
    const [record] = await HabitCompletion.findOrCreate({
      where: { HabitId: id, date: isoDate },
      defaults: { completed: isCompleted }
    });
    if (record.completed !== isCompleted) {
      record.completed = isCompleted;
      await record.save();
    }
    res.status(201).json(record);
  } catch (e) {
    next(e);
  }
});

// PATCH /api/habits/:habitId/completions/:date — update completion status for a specific date
router.patch('/:habitId/completions/:date', async (req, res, next) => {
  try {
    const habitId = parseInt(req.params.habitId, 10);
    const { date } = req.params;
    const { completed } = req.body;

    if (Number.isNaN(habitId)) {
      return res.status(400).json({ error: 'Invalid habit ID' });
    }

    if (typeof completed !== 'boolean') {
      return res.status(400).json({ error: 'completed must be a boolean' });
    }

    const telegramUserId = req.user.telegramUserId;
    const habit = await Habit.findOne({ where: { id: habitId, telegramUserId } });
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    // Find or create completion record
    const [completion] = await HabitCompletion.findOrCreate({
      where: { HabitId: habitId, date: date },
      defaults: { completed: completed }
    });

    // Update if it already existed
    if (completion.completed !== completed) {
      completion.completed = completed;
      await completion.save();
    }

    res.json(completion);
  } catch (e) {
    next(e);
  }
});

// DELETE /api/habits/:id — delete a habit
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const telegramUserId = req.user.telegramUserId;
    const habit = await Habit.findOne({ where: { id, telegramUserId } });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });
    await habit.destroy();
    res.json({ success: true });
  } catch (e) { next(e); }
});

// GET /api/habits/today-summary
router.get('/today-summary', async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const todayDate = new Date(today);
    const dayOfWeek = todayDate.getDay();
    const dayOfMonth = todayDate.getDate();
    
    // Map day of week to schedule format
    const dayMap = { 0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat' };
    const todayDayName = dayMap[dayOfWeek];
    
    // Get all habits
    const telegramUserId = req.user.telegramUserId;
    const allHabits = await Habit.findAll({ where: { telegramUserId } });
    
    // Count expected habits for today (based on frequency)
    let expectedToday = 0;
    let completedToday = 0;
    
    for (const habit of allHabits) {
      let isScheduled = false;
      
      if (habit.frequency === 'daily') {
        isScheduled = true;
      } else if (habit.frequency === 'weekly') {
        const schedule = habit.schedule || [];
        // If schedule is empty, fallback to daily logic (count it)
        if (!Array.isArray(schedule) || schedule.length === 0) {
          isScheduled = true; // Fallback: treat as daily if no schedule
        } else {
          isScheduled = schedule.includes(todayDayName);
        }
      } else if (habit.frequency === 'monthly') {
        const schedule = habit.schedule || [];
        // If schedule is empty, fallback to daily logic (count it)
        if (!Array.isArray(schedule) || schedule.length === 0) {
          isScheduled = true; // Fallback: treat as daily if no schedule
        } else {
          isScheduled = schedule.includes(dayOfMonth);
        }
      }
      
      if (isScheduled) {
        expectedToday++;
        // Check if completed
        const completion = await HabitCompletion.findOne({
          where: { HabitId: habit.id, date: today, completed: true }
        });
        if (completion) {
          completedToday++;
        }
      }
    }
    
    res.json({ completedToday, expectedToday, totalHabits: allHabits.length });
  } catch (e) { next(e); }
});

// GET /api/habits/completions?from=2025-01-01&to=2025-01-07
router.get('/completions', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ error: 'from and to query parameters are required (YYYY-MM-DD)' });
    }
    const telegramUserId = req.user.telegramUserId;
    const completions = await HabitCompletion.findAll({
      where: {
        date: {
          [Op.between]: [from, to]
        }
      },
      include: [{ model: Habit, attributes: ['id', 'name', 'category'], where: { telegramUserId } }],
      order: [['date', 'ASC'], ['HabitId', 'ASC']]
    });
    res.json(completions);
  } catch (e) {
    next(e);
  }
});

// GET /api/habits/streak
router.get('/streak', async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);
    
    // Get all completions grouped by date
    const telegramUserId = req.user.telegramUserId;
    const allCompletions = await HabitCompletion.findAll({
      where: { completed: true },
      attributes: ['date', 'HabitId'],
      include: [{ model: Habit, required: true, attributes: ['id'], where: { telegramUserId } }],
      order: [['date', 'DESC']]
    });

    // Group by date - a day counts if at least one habit was completed
    const datesWithCompletions = new Set();
    allCompletions.forEach(c => {
      if (c.date) {
        datesWithCompletions.add(c.date);
      }
    });

    // Calculate streak backwards from today (excluding today if no completions)
    let streak = 0;
    const checkDate = new Date(today);
    
    // Start from yesterday if today has no completions
    if (!datesWithCompletions.has(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    while (true) {
      const dateStr = checkDate.toISOString().slice(0, 10);
      if (datesWithCompletions.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    res.json({ streak });
  } catch (e) {
    next(e);
  }
});

module.exports = router;

