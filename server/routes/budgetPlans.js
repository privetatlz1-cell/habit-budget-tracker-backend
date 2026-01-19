const express = require('express');
const router = express.Router();
const BudgetPlan = require('../models/budgetPlan');
const { Op } = require('sequelize');

// GET /api/budget-plans — get all plans (optional: filter by year/month)
router.get('/', async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const telegramUserId = req.user.telegramUserId;
    
    let where = {};
    if (year) {
      where.year = parseInt(year, 10);
    }
    if (month) {
      where.month = parseInt(month, 10);
    }
    where.telegramUserId = telegramUserId;
    
    const plans = await BudgetPlan.findAll({
      where,
      order: [['year', 'DESC'], ['month', 'DESC'], ['type', 'ASC'], ['category', 'ASC']]
    });
    
    res.json(plans);
  } catch (e) {
    next(e);
  }
});

// GET /api/budget-plans/summary — get summary for a specific month/year
router.get('/summary', async (req, res, next) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;
    const telegramUserId = req.user.telegramUserId;
    
    const plans = await BudgetPlan.findAll({
      where: { year, month, telegramUserId }
    });
    
    const plannedIncome = plans
      .filter(p => p.type === 'income')
      .reduce((sum, p) => sum + (p.plannedAmount || 0), 0);
    
    const plannedExpenses = plans
      .filter(p => p.type === 'expense')
      .reduce((sum, p) => sum + (p.plannedAmount || 0), 0);
    
    res.json({
      year,
      month,
      plannedIncome,
      plannedExpenses,
      plannedBalance: plannedIncome - plannedExpenses,
      plans
    });
  } catch (e) {
    next(e);
  }
});

// POST /api/budget-plans — create or update a plan
router.post('/', async (req, res, next) => {
  try {
    const { year, month, category, type, plannedAmount } = req.body;
    const telegramUserId = req.user.telegramUserId;
    
    // Validation
    if (!year || !month || !category || !type || plannedAmount === undefined) {
      return res.status(400).json({ error: 'Year, month, category, type, and plannedAmount are required' });
    }
    
    const numYear = parseInt(year, 10);
    const numMonth = parseInt(month, 10);
    const numAmount = parseFloat(plannedAmount);
    
    if (isNaN(numYear) || numYear < 2000 || numYear > 2100) {
      return res.status(400).json({ error: 'Invalid year' });
    }
    
    if (isNaN(numMonth) || numMonth < 1 || numMonth > 12) {
      return res.status(400).json({ error: 'Invalid month (1-12)' });
    }
    
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "income" or "expense"' });
    }
    
    if (isNaN(numAmount) || numAmount < 0) {
      return res.status(400).json({ error: 'Planned amount must be a positive number' });
    }
    
    if (!category || typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({ error: 'Category is required' });
    }
    
    // Find or create plan
    const [plan, created] = await BudgetPlan.findOrCreate({
      where: {
        telegramUserId,
        year: numYear,
        month: numMonth,
        category: category.trim(),
        type
      },
      defaults: {
        telegramUserId,
        plannedAmount: numAmount
      }
    });
    
    // Update if it already existed
    if (!created) {
      plan.plannedAmount = numAmount;
      await plan.save();
    }
    
    res.status(created ? 201 : 200).json(plan);
  } catch (e) {
    next(e);
  }
});

// DELETE /api/budget-plans/:id — delete a plan
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    
    const telegramUserId = req.user.telegramUserId;
    const plan = await BudgetPlan.findOne({ where: { id, telegramUserId } });
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    await plan.destroy();
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

// DELETE /api/budget-plans — delete plans by year/month
router.delete('/', async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const telegramUserId = req.user.telegramUserId;
    
    if (!year || !month) {
      return res.status(400).json({ error: 'Year and month are required' });
    }
    
    const numYear = parseInt(year, 10);
    const numMonth = parseInt(month, 10);
    
    if (isNaN(numYear) || isNaN(numMonth)) {
      return res.status(400).json({ error: 'Invalid year or month' });
    }
    
    const deleted = await BudgetPlan.destroy({
      where: { year: numYear, month: numMonth, telegramUserId }
    });
    
    res.json({ success: true, deleted });
  } catch (e) {
    next(e);
  }
});

module.exports = router;


