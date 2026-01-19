const { DataTypes } = require('sequelize');
const db = require('../db');

/**
 * DailyNote Model
 * Stores daily notes linked by date only (no time required)
 */
const DailyNote = db.define('DailyNote', {
  telegramUserId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  date: { 
    type: DataTypes.DATEONLY, 
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  content: { 
    type: DataTypes.TEXT, 
    allowNull: true 
  }
}, {
  indexes: [
    { unique: true, fields: ['telegramUserId', 'date'] }
  ]
});

module.exports = DailyNote;


