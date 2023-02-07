'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Member extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Member.init({
    userName: DataTypes.STRING,
    password: DataTypes.STRING,
    emailAddress: DataTypes.STRING,
    phoneNumber: DataTypes.STRING,
    profileImage: DataTypes.STRING,
    allow: DataTypes.BOOLEAN,
    refreshToken: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'member',
    timestamps: false, /* true : 각각 레코드가 생성, 수정될 때의 시간이 자동으로 입력된다. */
    underscored: true, /* 카멜 표기법을 스네이크 표기법으로 바꾸는 옵션 */
    paranoid: false, /* true : deletedAt이라는 컬럼이 생기고 지운 시각이 기록된다. */
    charset: 'utf8' /* 인코딩 */
  });
  return Member;
};