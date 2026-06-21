const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
});

pool.on('connect', () => {
  console.log('Подключено к PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Ошибка подключения к БД:', err);
});

module.exports = pool;