const { DataTypes } = require('sequelize');
const db = require('../db');

const BudgetItem = db.define('BudgetItem', {
  telegramUserId: { type: DataTypes.STRING, allowNull: true },
  type: { type: DataTypes.ENUM('income', 'expense'), allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  category: DataTypes.STRING,
  date: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  description: DataTypes.STRING,
});

module.exports = { BudgetItem };






