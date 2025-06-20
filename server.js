const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const { sendAppointmentConfirmation } = require('./emailconfig');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;

// Secret key for JWT - in production, use environment variable
const JWT_SECRET = 'your-secret-key-here';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the dentist dashboard (HTML file itself does not require token for initial load)
app.get('/dentist-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dentist-dashboard.html'));
});

// Serve the login page
app.get('/dentist-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'dentist-login.html'));
});

// Login endpoint
app.post('/api/dentist-login', async (req, res) => {
    const { username, password } = req.body;

    console.log('Login attempt for username:', username, 'with password:', password);

    if (!username || !password) {
        console.log('Missing username or password');
        return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    // Query the database for the dentist with case-insensitive username
    const query = `
        SELECT dl.*, d.name as doctor_name, d.doctor_id
        FROM dentist_login dl
        JOIN doctors d ON dl.doctor_id = d.doctor_id
        WHERE LOWER(dl.username) = LOWER(?)
    `;

    db.query(query, [username], async (err, results) => {
        if (err) {
            console.error('Database error during login query:', err);
            return res.status(500).json({ success: false, error: 'Database error' });
        }

        if (results.length === 0) {
            console.log('Login attempt failed: username not found in DB for:', username);
            return res.status(401).json({ success: false, error: 'Invalid username or password' });
        }

        const dentist = results[0];
        console.log('Found dentist in DB:', dentist.username, 'DB password:', dentist.password);

        // For now, we're using plain text comparison since passwords are stored as plain text
        // In production, you should use bcrypt.compare() with hashed passwords
        if (password === dentist.password) {
            console.log('Password matched for:', dentist.username);
            // Create JWT token
            const token = jwt.sign(
                { 
                    id: dentist.doctor_id,
                    username: dentist.username,
                    name: dentist.doctor_name
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                token,
                user: {
                    id: dentist.doctor_id,
                    username: dentist.username,
                    name: dentist.doctor_name
                }
            });
        } else {
            console.log('Login attempt failed: incorrect password for:', username);
            res.status(401).json({ success: false, error: 'Invalid username or password' });
        }
    });
});

// API endpoint to get appointments with filters
app.get('/api/appointments', authenticateToken, (req, res) => {
    const { department, date, dateFilter } = req.query;
    
    let query = `
        SELECT 
            a.id,
            a.patient_id,      
            a.appointment_date,
            a.time_slot,
            p.name as patient_name,
            d.name as department_name,
            doc.name as doctor_name,
            p.phone,
            p.email,
            a.problem
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN departments d ON a.department_id = d.id
        JOIN doctors doc ON a.doctor_id = doc.doctor_id
        WHERE 1=1
    `;
    
    const params = [];

    // Add department filter
    if (department) {
        query += ' AND a.department_id = ?';
        params.push(department);
    }

    // Add date filters
    if (date) {
        query += ' AND a.appointment_date = ?';
        params.push(date);
    } else if (dateFilter) {
        switch (dateFilter) {
            case 'today':
                query += ' AND a.appointment_date = CURDATE()';
                break;
            case 'tomorrow':
                query += ' AND a.appointment_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)';
                break;
            case 'week':
                query += ' AND a.appointment_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)';
                break;
        }
    }

    // Order by date and time
    query += ' ORDER BY a.appointment_date ASC, a.time_slot ASC';

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error fetching appointments:', err);
            res.status(500).json({ error: 'Failed to fetch appointments' });
            return;
        }
        res.json(results);
    });
});

// API endpoint to get dentists by department
app.get('/api/dentists', (req, res) => {
    const { department } = req.query;
    
    if (!department) {
        res.status(400).json({ error: 'Department ID is required' });
        return;
    }

    const query = `
        SELECT doctor_id, name 
        FROM doctors 
        WHERE department_id = ?
        ORDER BY name ASC
    `;

    db.query(query, [department], (err, results) => {
        if (err) {
            console.error('Error fetching dentists:', err);
            res.status(500).json({ error: 'Failed to fetch dentists' });
            return;
        }
        res.json(results);
    });
});

// Handle appointment submission
app.post('/submit-appointment', async (req, res) => {
    const {
        name,
        address,
        email,
        phone,
        problem,
        dentist,
        department,
        date,
        time
    } = req.body;

    // Debug logging
    console.log('Full request body:', req.body);
    console.log('Dentist value received:', dentist);
    console.log('Department value received:', department);

    // Validate dentist ID
    if (!dentist) {
        console.error('Dentist ID is missing or invalid:', dentist);
        res.json({ success: false, error: 'Dentist selection is required.' });
        return;
    }

    // First, let's check what doctors we have in the database
    db.query('SELECT * FROM doctors WHERE d.doctor_id = ?', [dentist], (err, allDoctors) => {
        if (err) {
            console.error('Error fetching doctors:', err);
        } else {
            console.log('Current doctors in database:', allDoctors);
        }
    });

    // First, insert the patient
    const patientQuery = `
        INSERT INTO patients (name, address, email, phone)
        VALUES (?, ?, ?, ?)
    `;

    db.query(patientQuery, [name, address, email, phone], async (err, patientResult) => {
        if (err) {
            console.error('Error saving patient:', err);
            res.json({ success: false, error: 'Failed to save patient information' });
            return;
        }

        const patientId = patientResult.insertId;

        // Get the doctor's ID and name
        const getDoctorQuery = `
            SELECT d.doctor_id, d.name, dep.name as department_name
            FROM doctors d
            JOIN departments dep ON d.department_id = dep.id
            WHERE d.doctor_id = ?
        `;

        console.log('Looking for doctor with ID:', dentist);

        db.query(getDoctorQuery, [dentist], async (err, doctorResult) => {
            if (err) {
                console.error('Error finding doctor:', err);
                res.json({ success: false, error: 'Failed to find doctor' });
                return;
            }
            
            if (!doctorResult || doctorResult.length === 0) {
                console.error('No doctor found with ID:', dentist);
                res.json({ success: false, error: `Doctor with ID ${dentist} not found in database` });
                return;
            }

            const doctorId = doctorResult[0].doctor_id;
            const doctorName = doctorResult[0].name;
            const departmentName = doctorResult[0].department_name;
            console.log('Found doctor ID:', doctorId);

            // Then, insert the appointment
            const appointmentQuery = `
                INSERT INTO appointments 
                (patient_id, department_id, doctor_id, appointment_date, time_slot, problem)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            db.query(
                appointmentQuery,
                [patientId, department, doctorId, date, time, problem],
                async (err, appointmentResult) => {
                    if (err) {
                        console.error('Error saving appointment:', err);
                        res.json({ success: false, error: 'Failed to save appointment' });
                        return;
                    }

                    // Prepare appointment details for email
                    const appointmentDetails = {
                        patientName: name,
                        patientEmail: email,
                        appointmentDate: date,
                        appointmentTime: time,
                        doctorName: doctorName,
                        departmentName: departmentName,
                        problem: problem
                    };

                    // Send confirmation email
                    try {
                        const emailSent = await sendAppointmentConfirmation(appointmentDetails);
                        if (!emailSent) {
                            console.warn('Failed to send confirmation email, but appointment was saved');
                        }
                    } catch (emailError) {
                        console.error('Error sending confirmation email:', emailError);
                        // Don't fail the appointment booking if email fails
                    }

                    res.json({ 
                        success: true, 
                        appointmentId: appointmentResult.insertId,
                        emailSent: true
                    });
                }
            );
        });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 
