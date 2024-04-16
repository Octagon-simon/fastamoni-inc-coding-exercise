import mysql from 'mysql'

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'octagon',
    password: 'octagon',
    database: 'fastMoni'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL as id ' + connection.threadId);
});

export default connection;

// Close the connection when done
// connection.end();
