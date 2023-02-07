'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('picks', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      bucket_id: {
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: 'members'
          },
          key: 'id'
        },
      },
      movie_id: {
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: 'movie_buckets'
          },
          key: 'id'
        },
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('picks');
  }
};