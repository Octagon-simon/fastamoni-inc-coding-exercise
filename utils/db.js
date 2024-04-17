import mysql from 'mysql'
import util from 'util'
import dotenv from 'dotenv';

//configure env variables
dotenv.config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Convert connection.query to use promises
const dbQuery = util.promisify(connection.query).bind(connection);

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL as id ' + connection.threadId);
});

export default dbQuery;

// Close the connection when done
// connection.end();
