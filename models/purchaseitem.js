'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Purchaseitem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Purchaseitem.belongsTo(models.Purchase, {
        foreignKey: 'invoice'
      })
      Purchaseitem.belongsTo(models.Good, {
        foreignKey: 'itemcode'
      })
    }
  }
  Purchaseitem.init({
    invoice: {
      allowNull: false,
      type: DataTypes.STRING,
      references: {
        model: 'Purchases',
        key: 'invoice'
      },
      onDelete: 'CASCADE'
    },
    itemcode: {
      allowNull: false,
      type: DataTypes.STRING,
      references: {
        model: 'Goods',
        key: 'barcode'
      }
    },
    quantity: {
      allowNull: false,
      type: DataTypes.INTEGER
    },
    purchaseprice: {
      allowNull: false,
      type: DataTypes.DECIMAL
    },
    totalprice: {
      allowNull: false,
      type: DataTypes.DECIMAL
    }
  }, {
    sequelize,
    modelName: 'Purchaseitem',
  });
  return Purchaseitem;
};