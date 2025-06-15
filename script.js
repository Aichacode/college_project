// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get the patient form if it exists on the page
    const patientForm = document.getElementById('patientForm');
    if (patientForm) {
        patientForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = {
                name: document.getElementById('name').value,
                address: document.getElementById('address').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                problem: document.getElementById('problem').value
            };

            // Store the data in localStorage
            localStorage.setItem('patientData', JSON.stringify(formData));

            // Redirect to appointment page
            window.location.href = 'appointment.html';
        });
    }

    // Get the appointment form if it exists on the page
    const appointmentForm = document.getElementById('appointmentForm');
    if (appointmentForm) {
        // Set minimum date to today
        const dateInput = document.getElementById('date');
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;

        // Add event listener for department change
        const departmentSelect = document.getElementById('department');
        const dentistSelect = document.getElementById('dentist');

        departmentSelect.addEventListener('change', function() {
            console.log(this.value);
            const departmentId = this.value;
            
            // Clear current dentist options
            dentistSelect.innerHTML = '<option value="">Choose a dentist</option>';
            
            if (departmentId) {
                // Fetch dentists for selected department
                fetch(`/api/dentists?department=${departmentId}`)
                    .then(response => response.json())
                    .then(dentists => {
                        dentists.forEach(dentist => {
                            const option = document.createElement('option');
                            option.value = dentist.doctor_id;
                            option.textContent = dentist.name;
                            dentistSelect.appendChild(option);
                        });
                    })
                    .catch(error => {
                        console.error('Error fetching dentists:', error);
                        alert('Error loading dentists. Please try again.');
                    });
            }
        });

        appointmentForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Get the stored patient data
            const patientData = JSON.parse(localStorage.getItem('patientData'));
            if (!patientData) {
                alert('Please fill out patient information first!');
                window.location.href = 'index.html';
                return;
            }

            // Get appointment data
            const appointmentData = {
                ...patientData,
                dentist: document.getElementById('dentist').value,
                department: document.getElementById('department').value,
                date: document.getElementById('date').value,
                time: document.getElementById('time').value
            };

            // Send data to server
            fetch('/submit-appointment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(appointmentData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Appointment booked successfully!');
                    // Clear stored data
                    localStorage.removeItem('patientData');
                    // Redirect to home page
                    window.location.href = 'index.html';
                } else {
                    alert('Error booking appointment. Please try again.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error booking appointment. Please try again.');
            });
        });
    }
}); 
