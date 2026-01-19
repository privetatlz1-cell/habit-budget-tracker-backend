const { DataTypes } = require('sequelize');
const db = require('../db');

const SleepEntry = db.define('SleepEntry', {
  telegramUserId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  date: { 
    type: DataTypes.DATEONLY, 
    allowNull: false
  },
  hours: { 
    type: DataTypes.FLOAT, 
    allowNull: false,
    validate: {
      min: 0,
      max: 24
    }
  }
}, {
  indexes: [
    { unique: true, fields: ['telegramUserId', 'date'] }
  ]
});

module.exports = SleepEntry;


