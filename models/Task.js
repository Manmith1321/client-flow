const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Task = sequelize.define('Task', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  isComplete: { type: DataTypes.BOOLEAN, defaultValue: false },
  dueDate: { type: DataTypes.DATEONLY, allowNull: true }
});

module.exports = Task;
