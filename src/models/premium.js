const { DataTypes } = require('sequelize');
const { premiumSequelize } = require('../database');

const Premium = premiumSequelize.define('Premium', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    type: {
        type: DataTypes.STRING, // 'user' or 'guild'
        allowNull: false,
        defaultValue: 'guild',
    },
    addedBy: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: true, // null for lifetime
    }
}, {
    tableName: 'premiums',
    timestamps: true,
});

module.exports = Premium;
