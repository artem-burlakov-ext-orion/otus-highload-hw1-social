//const getDbPool = require('./db');
require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  connectionLimit: Number(process.env.CONN_LIMIT),
  host: process.env.HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD
});

const app = express();

app.use(express.json());

app.get('/users', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const sql = 'select * from users';
    const users = await conn.query(sql);
    await conn.release();
    res.json(users[0]);
  } catch(e) {
    console.log(e);
  }
});

app.post('/users', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const { name, surname, age, hobbies, gender, city, login } = req.body;
    const user = { name, surname, age, hobbies, gender, city, login, password: hashedPassword };
    const conn = await pool.getConnection();
    const sql = 'insert into users(name, surname, age, hobbies, gender, city, login, password) values(?, ?, ?, ?, ?, ?, ?, ?)';
    await conn.query(sql, Object.values(user));
    res.status(201).send(); 
  } catch(e) {
    res.status(500).send();
  } finally {
    await conn.release();
  }
});

app.post('/users/login', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const sql = 'select * from users';
    const users = await conn.query(sql);
    const user = users[0].find(user => user.login === req.body.login);
    if (!user) {
      return res.status(400).send('cannnot find user');
    }
    if (await bcrypt.compare(req.body.password, user.password)) {
      res.send('Success');
    } else {
      res.send('Not allowed');
    }
    await conn.release();
  } catch(e) {
    console.log(e);
    res.sendStatus(500).send();
  } 
});



app.listen(3000);

// app.set('view engine', pug);
// app.use(require('./routes'));



