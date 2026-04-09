const { Client, Project } = require('../models');

const getClients = async (req, res) => {
  try {
    const clients = await Client.findAll({ where: { userId: req.user.id } });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createClient = async (req, res) => {
  try {
    const { name, email, company } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    
    const client = await Client.create({
      name,
      email,
      company,
      userId: req.user.id
    });
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateClient = async (req, res) => {
  try {
    const client = await Client.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!client) return res.status(404).json({ message: 'Client not found' });
    const { name, email, company } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    await client.update({ name, email, company });
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteClient = async (req, res) => {
  try {
    const client = await Client.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!client) return res.status(404).json({ message: 'Client not found' });
    if (client) await client.destroy();
    res.json({ message: 'Client removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getClients, createClient, updateClient, deleteClient };
