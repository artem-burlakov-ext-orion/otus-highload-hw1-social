require('dotenv').config();
const mysql = require('mysql2/promise');

exports.default = (async () => {
  try {
    const pool = await mysql.createPool({
      connectionLimit: Number(process.env.CONN_LIMIT),
      host: process.env.HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
    });
    return pool;
  } catch (e) {
    return e;
  }
})();
