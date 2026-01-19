const { DataTypes } = require('sequelize');
const db = require('../db');

const Event = db.define('Event', {
  telegramUserId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  title: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  description: { 
    type: DataTypes.TEXT, 
    allowNull: true 
  },
  startDate: { 
    type: DataTypes.DATEONLY, 
    allowNull: false 
  },
  startTime: { 
    type: DataTypes.TIME, 
    allowNull: true 
  },
  endDate: { 
    type: DataTypes.DATEONLY, 
    allowNull: true 
  },
  endTime: { 
    type: DataTypes.TIME, 
    allowNull: true 
  },
  category: { 
    type: DataTypes.STRING, 
    allowNull: false,
    defaultValue: 'Personal'
  },
  color: { 
    type: DataTypes.STRING, 
    allowNull: false,
    defaultValue: '#6C5DD3' // Primary purple
  },
  allDay: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

module.exports = Event;


