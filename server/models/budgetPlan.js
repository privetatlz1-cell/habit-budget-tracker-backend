const { DataTypes } = require('sequelize');
const db = require('../db');

const BudgetPlan = db.define('BudgetPlan', {
  telegramUserId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  year: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  month: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    validate: {
      min: 1,
      max: 12
    }
  },
  category: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  type: { 
    type: DataTypes.ENUM('income', 'expense'), 
    allowNull: false 
  },
  plannedAmount: { 
    type: DataTypes.FLOAT, 
    allowNull: false,
    validate: {
      min: 0
    }
  }
}, {
  indexes: [
    { unique: true, fields: ['telegramUserId', 'year', 'month', 'category', 'type'] }
  ]
});

module.exports = BudgetPlan;


