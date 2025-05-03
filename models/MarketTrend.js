const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Stock = require('./stock');

const MarketTrend = sequelize.define('MarketTrend', {
  Trend_ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  Stock_ID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Stock,
      key: 'StockID'
    }
  },
  Past_50_Days_Average: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  Relative_Strength_Index: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  Bollinger_Bands: {
    type: DataTypes.JSON,
    allowNull: false
  },
  Updated_Time_Stamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Market_Trend',
  timestamps: false
});

MarketTrend.belongsTo(Stock, { foreignKey: 'Stock_ID' });

module.exports = MarketTrend;