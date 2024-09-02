const mysql = require('mysql2');
const env = require('dotenv');

env.config();

const connectionString = process.env.MYSQL_CONNECTION_STRING  ;

const url = require('url');
const connectionParams = url.parse(connectionString);
const [username, password] = connectionParams.auth.split(':');

const pool = mysql.createPool({
  host: connectionParams.hostname,
  port: connectionParams.port,
  user: username,
  password: password,
  database: connectionParams.pathname.split('/')[1]
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
  } else {
    console.log('Connected to the MySQL database');
    connection.release(); // Release the connection back to the pool
  }
});

module.exports = pool;