const express = require('express');
const router = express.Router();
const Event = require('../models/event');
const { Op } = require('sequelize');

// GET /api/events — get all events (optional: filter by date range)
router.get('/', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const telegramUserId = req.user.telegramUserId;
    
    let where = {};
    if (from && to) {
      // Include events that overlap with the date range
      // An event overlaps if: (startDate <= to) AND (endDate >= from OR endDate IS NULL)
      // For events without endDate, use startDate as endDate
      where = {
        [Op.or]: [
          {
            // Events with endDate that overlap
            startDate: { [Op.lte]: to },
            endDate: { [Op.gte]: from }
          },
          {
            // Single-day events (no endDate) within range
            startDate: {
              [Op.gte]: from,
              [Op.lte]: to
            },
            endDate: null
          },
          {
            // Events with endDate where startDate is in range
            startDate: {
              [Op.gte]: from,
              [Op.lte]: to
            }
          }
        ]
      };
    }
    where.telegramUserId = telegramUserId;
    
    const events = await Event.findAll({
      where,
      order: [['startDate', 'ASC'], ['startTime', 'ASC']]
    });
    
    res.json(events);
  } catch (e) {
    next(e);
  }
});

// GET /api/events/:id — get specific event
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const telegramUserId = req.user.telegramUserId;
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    
    const event = await Event.findOne({ where: { id, telegramUserId } });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(event);
  } catch (e) {
    next(e);
  }
});

// POST /api/events — create new event
router.post('/', async (req, res, next) => {
  try {
    const { title, description, startDate, startTime, endDate, endTime, category, color, allDay } = req.body;
    const telegramUserId = req.user.telegramUserId;
    
    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    if (!startDate) {
      return res.status(400).json({ error: 'Start date is required' });
    }
    
    const startDateStr = startDate.slice(0, 10);
    const event = await Event.create({
      telegramUserId,
      title: title.trim(),
      description: description ? description.trim() : null,
      startDate: startDateStr,
      startTime: startTime || null,
      endDate: endDate && endDate !== startDate ? endDate.slice(0, 10) : null,
      endTime: endTime || null,
      category: category || 'Personal',
      color: color || '#6C5DD3',
      allDay: allDay !== undefined ? allDay : true
    });
    
    res.status(201).json(event);
  } catch (e) {
    next(e);
  }
});

// PUT /api/events/:id — update event
router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const telegramUserId = req.user.telegramUserId;
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    
    const event = await Event.findOne({ where: { id, telegramUserId } });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const { title, description, startDate, startTime, endDate, endTime, category, color, allDay } = req.body;
    
    if (title !== undefined) event.title = title.trim();
    if (description !== undefined) event.description = description ? description.trim() : null;
    if (startDate) {
      event.startDate = startDate.slice(0, 10);
      // If endDate is not provided or same as startDate, set to null
      if (!endDate || endDate === startDate) {
        event.endDate = null;
      }
    }
    if (startTime !== undefined) event.startTime = startTime || null;
    if (endDate && endDate !== startDate) {
      event.endDate = endDate.slice(0, 10);
    } else if (endDate === null || endDate === '') {
      event.endDate = null;
    }
    if (endTime !== undefined) event.endTime = endTime || null;
    if (category) event.category = category;
    if (color) event.color = color;
    if (allDay !== undefined) event.allDay = allDay;
    
    await event.save();
    res.json(event);
  } catch (e) {
    next(e);
  }
});

// DELETE /api/events/:id — delete event
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const telegramUserId = req.user.telegramUserId;
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    
    const event = await Event.findOne({ where: { id, telegramUserId } });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    await event.destroy();
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;

