const { DataTypes } = require('sequelize');
const { prefixSequelize } = require('../database'); // We can reuse prefix database or define a new one, prefixSequelize is perfect and lightweight!

const DJSettings = prefixSequelize.define('DJSettings', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    roleId: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    tableName: 'dj_settings',
    timestamps: false,
});

module.exports = DJSettings;
