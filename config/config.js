module.exports = {
  development: {
    username: 'root',
    password: 'zkfp3445@',
    database: 'takealook',
    host: '127.0.0.1',
    dialect: "mysql",
    logging : false,
    timezone: "+09:00", // 타임존 설정안하면 1981년 1월 1일로 하면 1980년 12월 31일 15:00 가 된다.
  },
  test: {
    username: "root",
    password: null,
    database: "database_test",
    host: "127.0.0.1",
    dialect: "mysql"
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB,
    host: process.env.HOST,
    dialect: "mysql"
  }
}
