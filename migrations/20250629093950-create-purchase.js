'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Purchases', {
      invoice: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(20)
      },
      time: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      totalsum: {
        allowNull: false,
        type: Sequelize.NUMERIC(19, 2)
      },
      supplier: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'Suppliers',
          key: 'supplierId'
        },
        onDelete: 'RESTRICT'
      },
      operator: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'userId'
        },
        onDelete: 'RESTRICT'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Purchases');
  }
};