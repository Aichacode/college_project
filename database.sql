create database appointment_system;
use appointment_system;

-- patients table
create table if not exists patients (
Id int primary key auto_increment,
name varchar(100) not null,
address VARCHAR(200) NOT NULL,
email VARCHAR(100) NOT NULL,
phone VARCHAR(20) NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create departments table
CREATE TABLE if not exists departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- Insert sample departments
INSERT INTO departments (name) VALUES 
('Oral Medicine & Radiology'),
('Conservative Dentistry & Endodontics'),
('Periodondology'),
('Oral & Maxillofacial Surgery'),
('Prosthodontics and Crown & Bridge'),
('Pediatric and Preventive Dentistry'),
('Orthodontics & Dentofacial Orthopedics'),
('Public Health Dentistry');

-- Create doctors table
CREATE TABLE if not exists doctors (
    doctor_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- Insert sample doctors
INSERT INTO doctors (name,department_id) VALUES 
('Dr. Aiden',1),
('Dr. Sophia',1),
('Dr. Miguel',1),
('Dr. Zara',1),
('Dr. Davis',1),
('Dr. Miller',1),
('Dr. Wilson',1),

('Dr. Moore',2),
('Dr. Smith',2),
('Dr. Johnson',2),
('Dr. Williams',2),
('Dr. Brown',2),
('Dr. Kiran',2),
('Dr. Oliver',2),
('Dr. Priya',2),
('Dr. Ethan',2),
('Dr. Noor',2),
('Dr. Sasha',2),
('Dr. Rajeev',2),
('Dr. Aarav',2),
('Dr. Anjali',2),
('Dr. Aryan',2),
('Dr. Eva',2),
('Dr. Luca',2),

('Dr. Amara',3),
('Dr. Vikram',3),
('Dr. Jade',3),
('Dr. Elias',3),
('Dr. Nia',3),
('Dr. Oscar',3),
('Dr. Surya',3),
('Dr. Leo',3),
('Dr. Maria',3),
('Dr. Aria',3),
('Dr. Hassan',3),

('Dr. Naomi',4),
('Dr. Ronan',4),
('Dr. Maya',4),
('Dr. Caleb',4),
('Dr. Ishaan',4),
('Dr. Elena',4),
('Dr. Felix',4),
('Dr. Laila',4),

('Dr. Jonah',5),
('Dr. Aisha',5),
('Dr. Matteo',5),
('Dr. Sienna',5),
('Dr. Naveen',5),
('Dr. Isla',5),
('Dr. Damien',5),
('Dr. Kiara',5),
('Dr. Tariq',5),
('Dr. Amelia',5),
('Dr. Rohan',5),
('Dr. Zain',5),
('Dr. Kabir',5),
('Dr. Omar',5),

('Dr. Idris',6),
('Dr. Camille',6),
('Dr. Serena',6),
('Dr. Mira',6),
('Dr. Jace',6),

('Dr. Cyrus',7),
('Dr. Reema',7),
('Dr. Andre',7),
('Dr. Sana',7),
('Dr. Anika',7),
('Dr. Dev',7),

('Dr. Ruben',8),
('Dr. Selena',8),
('Dr. Manu',8),
('Dr. Tristan',8),
('Dr. Amir',8),
('Dr. Evaan',8),
('Dr. Yasmin',8),
('Dr. Elijah',8),
('Dr. Vanya',8),
('Dr. Indira',8);

-- Create appointments table
CREATE TABLE  appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT,
    department_id INT,
    doctor_id int,
    appointment_date DATE NOT NULL,
    time_slot VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    problem VARCHAR (100) not null,
    transaction_type VARCHAR(50),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);
