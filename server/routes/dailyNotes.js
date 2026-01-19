const express = require('express');
const router = express.Router();
const DailyNote = require('../models/dailyNote');
const { Op } = require('sequelize');

// GET /api/daily-notes — get all notes (optional: filter by date range)
router.get('/', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const telegramUserId = req.user.telegramUserId;
    
    let where = {};
    if (from && to) {
      where.date = {
        [Op.between]: [from, to]
      };
    }
    where.telegramUserId = telegramUserId;
    
    const notes = await DailyNote.findAll({
      where,
      order: [['date', 'DESC']]
    });
    
    res.json(notes);
  } catch (e) {
    next(e);
  }
});

// GET /api/daily-notes/:date — get note for a specific date
router.get('/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    const telegramUserId = req.user.telegramUserId;
    const note = await DailyNote.findOne({
      where: { date, telegramUserId }
    });
    
    if (!note) {
      return res.json({ date, title: null, content: null });
    }
    
    res.json(note);
  } catch (e) {
    next(e);
  }
});

// POST /api/daily-notes — create or update a note
router.post('/', async (req, res, next) => {
  try {
    const { date, title, content } = req.body;
    const telegramUserId = req.user.telegramUserId;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    // Find or create note for this date
    const [note, created] = await DailyNote.findOrCreate({
      where: { date, telegramUserId },
      defaults: { 
        telegramUserId,
        title: title ? title.trim() : null,
        content: content ? content.trim() : null 
      }
    });
    
    // Update if it already existed
    if (!created) {
      if (title !== undefined) note.title = title ? title.trim() : null;
      if (content !== undefined) note.content = content ? content.trim() : null;
      await note.save();
    }
    
    res.status(created ? 201 : 200).json(note);
  } catch (e) {
    next(e);
  }
});

// PUT /api/daily-notes/:date — update note for a specific date
router.put('/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    const { title, content } = req.body;
    const telegramUserId = req.user.telegramUserId;
    
    const [note, created] = await DailyNote.findOrCreate({
      where: { date, telegramUserId },
      defaults: { 
        telegramUserId,
        title: title ? title.trim() : null,
        content: content ? content.trim() : null 
      }
    });
    
    if (!created) {
      if (title !== undefined) note.title = title ? title.trim() : null;
      if (content !== undefined) note.content = content ? content.trim() : null;
      await note.save();
    }
    
    res.json(note);
  } catch (e) {
    next(e);
  }
});

// DELETE /api/daily-notes/:date — delete note for a specific date
router.delete('/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    const telegramUserId = req.user.telegramUserId;
    const note = await DailyNote.findOne({
      where: { date, telegramUserId }
    });
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    await note.destroy();
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;


