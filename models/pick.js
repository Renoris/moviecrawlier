'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class pick extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  pick.init({
    bucketId: DataTypes.INTEGER,
    movieId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'pick',
    underscored: true, /* 카멜 표기법을 스네이크 표기법으로 바꾸는 옵션 */
    charset: 'utf8' /* 인코딩 */
  });
  return pick;
};