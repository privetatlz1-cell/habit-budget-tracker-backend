const { DataTypes } = require('sequelize');
const db = require('../db');

const Task = db.define('Task', {
  telegramUserId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['personal', 'work']]
    }
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
    allowNull: true
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  priority: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Medium',
    validate: {
      isIn: [['Low', 'Medium', 'High', 'Urgent']]
    }
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Personal'
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'todo',
    validate: {
      isIn: [['todo', 'in_progress', 'done']]
    }
  }
}, {
  indexes: [
    { fields: ['type'] },
    { fields: ['category'] },
    { fields: ['status'] },
    { fields: ['priority'] }
  ]
});

const Subtask = db.define('Subtask', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

const TaskAttachment = db.define('TaskAttachment', {
  fileName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

const TaskNote = db.define('TaskNote', {
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  }
});

// Associations
Task.hasMany(Subtask, { onDelete: 'CASCADE', as: 'subtasks' });
Subtask.belongsTo(Task);

Task.hasMany(TaskAttachment, { onDelete: 'CASCADE', as: 'attachments' });
TaskAttachment.belongsTo(Task);

Task.hasMany(TaskNote, { onDelete: 'CASCADE', as: 'notes' });
TaskNote.belongsTo(Task);

module.exports = { Task, Subtask, TaskAttachment, TaskNote };


