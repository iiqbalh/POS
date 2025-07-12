'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Goods', {
      barcode: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(20)
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING(150)
      },
      stock: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      purchaseprice: {
        allowNull: false,
        type: Sequelize.NUMERIC(19, 2)
      },
      sellingprice: {
        allowNull: false,
        type: Sequelize.NUMERIC(19, 2)
      },
      unit: {
        allowNull: false,
        type: Sequelize.STRING(10),
        references: {
          model: 'Units',
          key: 'unit'
        }
      },
      picture: {
        type: Sequelize.TEXT
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Goods');
  }
};