const { Project, Client, Task } = require('../models');

const getProjects = async (req, res) => {
  try {
    const clients = await Client.findAll({ where: { userId: req.user.id }, attributes: ['id'] });
    const clientIds = clients.map(c => c.id);
    const projects = await Project.findAll({
      where: { clientId: clientIds },
      include: [
        { model: Client, attributes: ['name', 'company'] },
        { model: Task }
      ]
    });
    const projectsWithProgress = projects.map(p => {
      const plain = p.get({ plain: true });
      const total = plain.Tasks ? plain.Tasks.length : 0;
      const completed = plain.Tasks ? plain.Tasks.filter(t => t.isComplete).length : 0;
      plain.progress = total === 0 ? 0 : Math.round((completed / total) * 100);
      return plain;
    });
    res.json(projectsWithProgress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createProject = async (req, res) => {
  try {
    const { title, description, status, paymentStatus, clientId, dueDate, isArchived, notes } = req.body;
    if (!title || !clientId) return res.status(400).json({ message: 'Title and Client ID are required' });

    const client = await Client.findOne({ where: { id: clientId, userId: req.user.id } });
    if (!client) return res.status(404).json({ message: 'Client not found or unauthorized' });

    const project = await Project.create({ title, description, status, paymentStatus, clientId, dueDate, isArchived, notes });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const clients = await Client.findAll({ where: { userId: req.user.id }, attributes: ['id'] });
    const clientIds = clients.map(c => c.id);

    const project = await Project.findOne({ where: { id: req.params.id, clientId: clientIds } });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const { title, description, status, paymentStatus, dueDate, isArchived, notes } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    await project.update({ title, description, status, paymentStatus, dueDate, isArchived, notes });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const clients = await Client.findAll({ where: { userId: req.user.id }, attributes: ['id'] });
    const clientIds = clients.map(c => c.id);

    const project = await Project.findOne({ where: { id: req.params.id, clientId: clientIds } });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    await project.destroy();
    res.json({ message: 'Project removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProjects, createProject, updateProject, deleteProject };
