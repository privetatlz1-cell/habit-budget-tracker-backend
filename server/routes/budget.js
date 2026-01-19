const express = require('express');
const router = express.Router();
const { BudgetItem } = require('../models/budget');
const { Op } = require('sequelize');

// GET /api/budget — list items
router.get('/', async (req, res, next) => {
  try {
    const telegramUserId = req.user.telegramUserId;
    const items = await BudgetItem.findAll({
      where: { telegramUserId },
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json(items);
  } catch (e) {
    next(e);
  }
});

// POST /api/budget — create item (income/expense)
router.post('/', async (req, res, next) => {
  try {
    const { type, amount, category, description, date } = req.body;
    const telegramUserId = req.user.telegramUserId;

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "income" or "expense"' });
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Valid positive amount is required' });
    }
    if (!category || typeof category !== 'string') {
      return res.status(400).json({ error: 'Category is required' });
    }
    let isoDate = date && typeof date === 'string' ? date.slice(0,10) : new Date().toISOString().slice(0,10);

    const item = await BudgetItem.create({
      telegramUserId,
      type,
      amount: numAmount,
      category: category.trim(),
      description: description ? description.trim() : null,
      date: isoDate,
    });

    res.status(201).json(item);
  } catch (e) {
    next(e);
  }
});

// DELETE /api/budget/:id — delete item
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const telegramUserId = req.user.telegramUserId;
    const item = await BudgetItem.findOne({ where: { id, telegramUserId } });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    await item.destroy();
    res.json({ success: true });
  } catch (e) { next(e); }
});

module.exports = router;

// GET /api/budget/monthly-summary
router.get('/monthly-summary', async (req, res, next) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0,10);

    const telegramUserId = req.user.telegramUserId;
    const items = await BudgetItem.findAll({
      where: {
        telegramUserId,
        date: {
          [Op.gte]: monthStart,
          [Op.lt]: nextMonthStart
        }
      }
    }).catch(async () => {
      // Fallback: fetch all and filter in JS (for dialect compatibility)
      const all = await BudgetItem.findAll({ where: { telegramUserId } });
      return all.filter(i => {
        const d = (i.date || '').slice(0,10);
        return d >= monthStart && d < nextMonthStart;
      });
    });

    const income = items.filter(i => i.type === 'income').reduce((a,b)=>a + (b.amount || 0), 0);
    const expenses = items.filter(i => i.type === 'expense').reduce((a,b)=>a + (b.amount || 0), 0);
    res.json({ income, expenses, balance: income - expenses });
  } catch (e) { next(e); }
});




