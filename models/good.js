'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Good extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Good.hasMany(models.Unit, {
        foreignKey: 'unit'
      })
    }
  }
  Good.init({
    barcode: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.STRING
    },
    name: {
      allowNull: false,
      type: DataTypes.STRING
    },
    stock: {
      allowNull: false,
      type: DataTypes.INTEGER
    },
    purchaseprice: {
      allowNull: false,
      type: DataTypes.NUMERIC
    },
    sellingprice: {
      allowNull: false,
      type: DataTypes.NUMERIC
    },
    unit: {
      allowNull: false,
      type: DataTypes.STRING,
      references: {
        model: 'Units',
        key: 'unit'
      }
    },
    picture: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Good',
    timestamps: false,
    createdAt: false,
    updatedAt: false,
  });
  return Good;
};