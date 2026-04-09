const { Client, Project } = require('../models');

const getDashboardStats = async (req, res) => {
  try {
    const clientsCount = await Client.count({ where: { userId: req.user.id } });
    
    const clients = await Client.findAll({ where: { userId: req.user.id }, attributes: ['id'] });
    const clientIds = clients.map(c => c.id);

    const activeProjectsCount = await Project.count({ 
      where: { clientId: clientIds, status: 'In Progress' } 
    });

    const completedProjectsCount = await Project.count({ 
      where: { clientId: clientIds, status: 'Completed' } 
    });

    const paidProjectsCount = await Project.count({
      where: { clientId: clientIds, paymentStatus: 'Paid' }
    });
    
    const totalRevenue = paidProjectsCount * 1250; 

    res.json({
      clientsCount,
      activeProjectsCount,
      completedProjectsCount,
      totalRevenue
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats };
