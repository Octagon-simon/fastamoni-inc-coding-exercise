import mysql from 'mysql'
import util from 'util'

const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'octagon',
    password: 'octagon',
    database: 'fastMoni'
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
