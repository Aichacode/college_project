const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the dentist dashboard
app.get('/dentist-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dentist-dashboard.html'));
});

// API endpoint to get appointments with filters
app.get('/api/appointments', (req, res) => {
    const { department, date, dateFilter } = req.query;
    
    let query = `
        SELECT 
            a.patient_id  ,      
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
        JOIN doctors doc ON a.doctor_id = doc.id
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
        SELECT id, name 
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
app.post('/submit-appointment', (req, res) => {
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

    // First, let's check what doctors we have in the database
    db.query('SELECT * FROM doctors', (err, allDoctors) => {
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

    db.query(patientQuery, [name, address, email, phone], (err, patientResult) => {
        if (err) {
            console.error('Error saving patient:', err);
            res.json({ success: false, error: 'Failed to save patient information' });
            return;
        }

        const patientId = patientResult.insertId;

        // Get the doctor's ID directly using the dentist value
        const getDoctorQuery = `
            SELECT id FROM doctors 
            WHERE id = ?
        `;

        console.log('Looking for doctor with ID:', dentist); // Log the doctor ID we're searching for

        db.query(getDoctorQuery, [dentist], (err, doctorResult) => {
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

            const doctorId = doctorResult[0].id;
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
                (err, appointmentResult) => {
                    if (err) {
                        console.error('Error saving appointment:', err);
                        res.json({ success: false, error: 'Failed to save appointment' });
                        return;
                    }
                    res.json({ success: true, appointmentId: appointmentResult.insertId });
                }
            );
        });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 
