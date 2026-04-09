const { Task, Project, Client } = require('../models');

const getTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({ where: { projectId: req.params.projectId } });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, projectId, dueDate } = req.body;
    if (!title) return res.status(400).json({ message: 'Task title is required' });
    const task = await Task.create({ title, projectId, dueDate });
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const { isComplete, title, dueDate } = req.body;
    await task.update({ 
      isComplete: isComplete !== undefined ? isComplete : task.isComplete, 
      title: title !== undefined ? title : task.title, 
      dueDate: dueDate !== undefined ? dueDate : task.dueDate 
    });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    await task.destroy();
    res.json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask };
