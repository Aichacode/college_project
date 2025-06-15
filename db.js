const mysql = require('mysql2');

// Create a connection to the database
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',     // Replace with your MySQL username
    password: 'Blink@1997',     // Replace with your MySQL password
    database: 'appointment_system',
    // Add these options for better error handling
    connectTimeout: 10000,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Connect to the database
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Successfully connected to MySQL database');
});

// Handle connection errors
connection.on('error', (err) => {
    console.error('Database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Attempting to reconnect to database...');
        connection.connect();
    } else {
        throw err;
    }
});

module.exports = connection; 
