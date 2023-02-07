'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('movies', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      story: {
        type: Sequelize.BLOB
      },
      title: {
        type: Sequelize.STRING
      },
      genre:{
        type: Sequelize.STRING
      },
      country:{
        type: Sequelize.STRING
      },
      link: {
        type: Sequelize.STRING
      },
      image: {
        type: Sequelize.STRING
      },
      sub_title: {
        type: Sequelize.STRING
      },
      pub_date: {
        type: Sequelize.DATE
      },
      running_time: {
        type: Sequelize.STRING
      },
      director: {
        type: Sequelize.STRING
      },
      actor: {
        type: Sequelize.STRING
      },
      user_rating: {
        type: Sequelize.STRING
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('movies');
  }
};