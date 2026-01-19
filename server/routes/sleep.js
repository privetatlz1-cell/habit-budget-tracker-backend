const express = require('express');
const router = express.Router();
const SleepEntry = require('../models/sleepEntry');
const { Op } = require('sequelize');

// GET /api/sleep — get all sleep entries (optional: filter by date range)
router.get('/', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const telegramUserId = req.user.telegramUserId;
    
    let where = {};
    if (from && to) {
      where.date = {
        [Op.gte]: from,
        [Op.lte]: to
      };
    }
    where.telegramUserId = telegramUserId;
    
    const entries = await SleepEntry.findAll({
      where,
      order: [['date', 'DESC']]
    });
    
    res.json(entries);
  } catch (e) {
    next(e);
  }
});

// GET /api/sleep/stats/summary — get sleep statistics
router.get('/stats/summary', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const telegramUserId = req.user.telegramUserId;
    
    let where = {};
    if (from && to) {
      where.date = {
        [Op.gte]: from,
        [Op.lte]: to
      };
    }
    
    where.telegramUserId = telegramUserId;
    const entries = await SleepEntry.findAll({ where });
    
    if (entries.length === 0) {
      return res.json({
        average: 0,
        total: 0,
        min: 0,
        max: 0,
        insufficientDays: 0
      });
    }
    
    const hours = entries.map(e => e.hours);
    const average = hours.reduce((a, b) => a + b, 0) / hours.length;
    const min = Math.min(...hours);
    const max = Math.max(...hours);
    const insufficientDays = hours.filter(h => h < 7).length;
    
    res.json({
      average: Math.round(average * 10) / 10,
      total: entries.length,
      min,
      max,
      insufficientDays
    });
  } catch (e) {
    next(e);
  }
});

// GET /api/sleep/:date — get sleep entry for specific date
router.get('/:date', async (req, res, next) => {
  try {
    const telegramUserId = req.user.telegramUserId;
    const entry = await SleepEntry.findOne({
      where: { date: req.params.date, telegramUserId }
    });
    
    if (!entry) {
      return res.status(404).json({ error: 'Sleep entry not found' });
    }
    
    res.json(entry);
  } catch (e) {
    next(e);
  }
});

// POST /api/sleep — create or update sleep entry
router.post('/', async (req, res, next) => {
  try {
    const { date, hours } = req.body;
    const telegramUserId = req.user.telegramUserId;
    
    // Validation
    if (!date || hours === undefined || hours === null) {
      return res.status(400).json({ error: 'Date and hours are required' });
    }
    
    const numHours = parseFloat(hours);
    if (isNaN(numHours) || numHours < 0 || numHours > 24) {
      return res.status(400).json({ error: 'Hours must be a number between 0 and 24' });
    }
    
    // Find or create entry
    const [entry, created] = await SleepEntry.findOrCreate({
      where: { date: date.slice(0, 10), telegramUserId },
      defaults: { hours: numHours, telegramUserId }
    });
    
    // Update if it already existed
    if (!created) {
      entry.hours = numHours;
      await entry.save();
    }
    
    res.status(created ? 201 : 200).json(entry);
  } catch (e) {
    next(e);
  }
});

// DELETE /api/sleep/:date — delete sleep entry
router.delete('/:date', async (req, res, next) => {
  try {
    const telegramUserId = req.user.telegramUserId;
    const entry = await SleepEntry.findOne({
      where: { date: req.params.date, telegramUserId }
    });
    
    if (!entry) {
      return res.status(404).json({ error: 'Sleep entry not found' });
    }
    
    await entry.destroy();
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});


module.exports = router;


