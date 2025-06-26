'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Unit extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Unit.belongsTo(models.Good, {
        foreignKey: 'unit'
      })
    }
  }
  Unit.init({
    unit: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.STRING
    },
    name: DataTypes.STRING,
    note: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Unit',
    timestamps: false,
    createdAt: false,
    updatedAt: false,
  });
  return Unit;
};

// npx sequelize-cli model:generate --name Good --attributes name:string,stock:integer,purchaseprice:numeric,sellingprice:numeric,unit:string,picture:text