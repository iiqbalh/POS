'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Purchase extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Purchase.belongsTo(models.Supplier, {
        foreignKey: 'supplier'
      })
      Purchase.hasOne(models.User, {
        foreignKey: 'userId'
      })
      Purchase.hasMany(models.Purchaseitem, {
        foreignKey: 'invoice'
      })
    }
  }
  Purchase.init({
    invoice: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.STRING
    },
    time: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    totalsum: {
      type: DataTypes.NUMERIC
    },
    supplier: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Suppliers',
        key: 'supplierId'
      },
      onDelete: 'RESTRICT'
    },
    operator: {
      allowNull: false,
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'userId'
      },
      onDelete: 'RESTRICT'
    }
  }, 
  {
    sequelize,
    modelName: 'Purchase',
    timestamps: false,
    updatedAt: false,
  });
  return Purchase;
};