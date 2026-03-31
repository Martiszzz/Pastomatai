const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "pastomatai",
  password: "pass",
  port: 5432,
});

module.exports = pool;