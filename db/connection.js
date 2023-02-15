const mysql = require('mysql2'),
    dotenv = require('dotenv');
dotenv.config({ path: './.env' });

//@ Pushpendra ( 25/02/23 ) Initialize database connectivity with mysql
const connection = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    database: process.env.DATABASE,
    password: process.env.DATABASE_PASSWORD
});

//@ Pushpendra ( 25/02/23 ) Will throw error if there is any problem in connecting to database
connection.connect(err => {
    if (err) console.log('Error in connecting to database', err);
    else console.log('Connected to database successfully');
});

module.exports = connection;