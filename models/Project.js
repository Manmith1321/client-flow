const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Project = sequelize.define('Project', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  status: { 
    type: DataTypes.ENUM('Pending', 'In Progress', 'Completed'), 
    defaultValue: 'Pending' 
  },
  paymentStatus: { 
    type: DataTypes.ENUM('Unpaid', 'Paid'), 
    defaultValue: 'Unpaid' 
  },
  dueDate: { type: DataTypes.DATEONLY, allowNull: true },
  isArchived: { type: DataTypes.BOOLEAN, defaultValue: false },
  notes: { type: DataTypes.TEXT, allowNull: true }
});

module.exports = Project;
