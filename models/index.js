const sequelize = require('../config/db');
const User = require('./User');
const Client = require('./Client');
const Project = require('./Project');
const Task = require('./Task');

// Relationships
User.hasMany(Client, { foreignKey: 'userId', onDelete: 'CASCADE' });
Client.belongsTo(User, { foreignKey: 'userId' });

Client.hasMany(Project, { foreignKey: 'clientId', onDelete: 'CASCADE' });
Project.belongsTo(Client, { foreignKey: 'clientId' });

Project.hasMany(Task, { foreignKey: 'projectId', onDelete: 'CASCADE' });
Task.belongsTo(Project, { foreignKey: 'projectId' });

module.exports = { sequelize, User, Client, Project, Task };
