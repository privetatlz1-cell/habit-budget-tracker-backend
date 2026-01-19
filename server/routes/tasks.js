const express = require('express');
const router = express.Router();
const { Task, Subtask, TaskAttachment, TaskNote } = require('../models/task');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow all file types
    cb(null, true);
  }
});

// GET /api/tasks?type=personal|work - Get all tasks with filters
router.get('/', async (req, res, next) => {
  try {
    const { type, category, status, priority, sortBy = 'dueDate', sortOrder = 'ASC' } = req.query;
    const telegramUserId = req.user.telegramUserId;
    
    const where = { telegramUserId };
    if (type) where.type = type;
    if (category) where.category = category;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const order = [];
    if (sortBy === 'dueDate') {
      order.push(['dueDate', sortOrder]);
    } else if (sortBy === 'priority') {
      const priorityOrder = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
      // We'll sort in memory for priority
    } else if (sortBy === 'createdAt') {
      order.push(['createdAt', sortOrder]);
    }

    const tasks = await Task.findAll({
      where,
      order: order.length > 0 ? order : [['createdAt', 'DESC']],
      include: [
        { model: Subtask, as: 'subtasks' },
        { model: TaskAttachment, as: 'attachments' },
        { model: TaskNote, as: 'notes' }
      ]
    });

    // Sort by priority if needed
    let sortedTasks = tasks;
    if (sortBy === 'priority') {
      const priorityOrder = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
      sortedTasks = tasks.sort((a, b) => {
        const aPriority = priorityOrder[a.priority] || 0;
        const bPriority = priorityOrder[b.priority] || 0;
        return sortOrder === 'ASC' ? aPriority - bPriority : bPriority - aPriority;
      });
    }

    res.json(sortedTasks);
  } catch (e) {
    next(e);
  }
});

// GET /api/tasks/:id - Get a single task
router.get('/:id', async (req, res, next) => {
  try {
    const telegramUserId = req.user.telegramUserId;
    const task = await Task.findOne({
      where: { id: req.params.id, telegramUserId },
      include: [
        { model: Subtask, as: 'subtasks' },
        { model: TaskAttachment, as: 'attachments' },
        { model: TaskNote, as: 'notes' }
      ]
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (e) {
    next(e);
  }
});

// POST /api/tasks - Create a new task
router.post('/', async (req, res, next) => {
  try {
    const { type, title, description, startDate, dueDate, priority, category, status, subtasks } = req.body;
    const telegramUserId = req.user.telegramUserId;

    if (!type || !['personal', 'work'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "personal" or "work"' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const task = await Task.create({
      telegramUserId,
      type,
      title: title.trim(),
      description: description ? description.trim() : null,
      startDate: startDate || null,
      dueDate: dueDate || null,
      priority: priority || 'Medium',
      category: category || (type === 'work' ? 'Work' : 'Personal'),
      status: status || 'todo'
    });

    // Create subtasks if provided
    if (subtasks && Array.isArray(subtasks)) {
      for (let i = 0; i < subtasks.length; i++) {
        const subtask = subtasks[i];
        if (subtask.title && subtask.title.trim()) {
          await Subtask.create({
            title: subtask.title.trim(),
            completed: subtask.completed || false,
            order: i,
            TaskId: task.id
          });
        }
      }
    }

    const taskWithIncludes = await Task.findOne({
      where: { id: task.id, telegramUserId },
      include: [
        { model: Subtask, as: 'subtasks' },
        { model: TaskAttachment, as: 'attachments' },
        { model: TaskNote, as: 'notes' }
      ]
    });

    res.status(201).json(taskWithIncludes);
  } catch (e) {
    next(e);
  }
});

// PUT /api/tasks/:id - Update a task
router.put('/:id', async (req, res, next) => {
  try {
    const telegramUserId = req.user.telegramUserId;
    const task = await Task.findOne({ where: { id: req.params.id, telegramUserId } });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { title, description, startDate, dueDate, priority, category, status, subtasks } = req.body;

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description ? description.trim() : null;
    if (startDate !== undefined) task.startDate = startDate || null;
    if (dueDate !== undefined) task.dueDate = dueDate || null;
    if (priority !== undefined) task.priority = priority;
    if (category !== undefined) task.category = category;
    if (status !== undefined) task.status = status;

    await task.save();

    // Update subtasks if provided
    if (subtasks && Array.isArray(subtasks)) {
      // Delete existing subtasks
      await Subtask.destroy({ where: { TaskId: task.id } });
      
      // Create new subtasks
      for (let i = 0; i < subtasks.length; i++) {
        const subtask = subtasks[i];
        if (subtask.title && subtask.title.trim()) {
          await Subtask.create({
            title: subtask.title.trim(),
            completed: subtask.completed || false,
            order: i,
            TaskId: task.id
          });
        }
      }
    }

    const taskWithIncludes = await Task.findOne({
      where: { id: task.id, telegramUserId },
      include: [
        { model: Subtask, as: 'subtasks' },
        { model: TaskAttachment, as: 'attachments' },
        { model: TaskNote, as: 'notes' }
      ]
    });

    res.json(taskWithIncludes);
  } catch (e) {
    next(e);
  }
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', async (req, res, next) => {
  try {
    const telegramUserId = req.user.telegramUserId;
    const task = await Task.findOne({
      where: { id: req.params.id, telegramUserId },
      include: [{ model: TaskAttachment, as: 'attachments' }]
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Delete associated files
    for (const attachment of task.attachments) {
      const filePath = path.join(uploadDir, attachment.filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await task.destroy();
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

// POST /api/tasks/:id/attachments - Upload attachment
router.post('/:id/attachments', upload.single('file'), async (req, res, next) => {
  try {
    const telegramUserId = req.user.telegramUserId;
    const task = await Task.findOne({ where: { id: req.params.id, telegramUserId } });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const attachment = await TaskAttachment.create({
      fileName: req.file.originalname,
      filePath: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      TaskId: task.id
    });

    res.status(201).json(attachment);
  } catch (e) {
    next(e);
  }
});

// DELETE /api/tasks/:id/attachments/:attachmentId - Delete attachment
router.delete('/:id/attachments/:attachmentId', async (req, res, next) => {
  try {
    const telegramUserId = req.user.telegramUserId;
    const attachment = await TaskAttachment.findByPk(req.params.attachmentId, {
      include: [{ model: Task, where: { telegramUserId } }]
    });
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    const filePath = path.join(uploadDir, attachment.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await attachment.destroy();
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

// POST /api/tasks/:id/notes - Add note to task
router.post('/:id/notes', async (req, res, next) => {
  try {
    const telegramUserId = req.user.telegramUserId;
    const task = await Task.findOne({ where: { id: req.params.id, telegramUserId } });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    const note = await TaskNote.create({
      content: content.trim(),
      TaskId: task.id
    });

    res.status(201).json(note);
  } catch (e) {
    next(e);
  }
});

// PUT /api/tasks/:id/notes/:noteId - Update note
router.put('/:id/notes/:noteId', async (req, res, next) => {
  try {
    const telegramUserId = req.user.telegramUserId;
    const note = await TaskNote.findByPk(req.params.noteId, {
      include: [{ model: Task, where: { telegramUserId } }]
    });
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    note.content = content.trim();
    await note.save();

    res.json(note);
  } catch (e) {
    next(e);
  }
});

// DELETE /api/tasks/:id/notes/:noteId - Delete note
router.delete('/:id/notes/:noteId', async (req, res, next) => {
  try {
    const telegramUserId = req.user.telegramUserId;
    const note = await TaskNote.findByPk(req.params.noteId, {
      include: [{ model: Task, where: { telegramUserId } }]
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

// Serve uploaded files
router.get('/attachments/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

module.exports = router;


