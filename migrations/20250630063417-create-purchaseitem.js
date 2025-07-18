'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Purchaseitems', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      invoice: {
        allowNull: false,
        type: Sequelize.STRING(20),
        references: {
          model: 'Purchases',
          key: 'invoice'
        },
        onDelete: 'CASCADE'
      },
      itemcode: {
        allowNull: false,
        type: Sequelize.STRING(20),
        references: {
          model: 'Goods',
          key: 'barcode'
        }
      },
      quantity: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      purchaseprice: {
        allowNull: false,
        type: Sequelize.DECIMAL(19, 2)
      },
      totalprice: {
        allowNull: false,
        type: Sequelize.DECIMAL(19, 2)
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Purchaseitems');
  }
};