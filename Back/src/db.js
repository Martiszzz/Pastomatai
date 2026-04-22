const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",          // phpMyAdmin/MySQL username
  password: "",          // your MySQL password
  database: "pastomatai",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;