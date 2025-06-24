'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Units', {
      unit: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(10)
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: false,
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Units');
  }
};