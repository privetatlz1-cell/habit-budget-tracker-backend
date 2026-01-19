const { Task, Subtask, TaskAttachment, TaskNote } = require('../models/task');
const db = require('../db');

async function migrate() {
  try {
    console.log('Creating tasks tables...');
    
    // Sync all models (creates tables if they don't exist)
    await Task.sync({ alter: true });
    await Subtask.sync({ alter: true });
    await TaskAttachment.sync({ alter: true });
    await TaskNote.sync({ alter: true });
    
    console.log('Tasks tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();


