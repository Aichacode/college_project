const nodemailer = require('nodemailer');

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ayeshadhan1@gmail.com', // Replace with your Gmail address
        pass: 'uzjf fifw frmb dodp'     // Replace with your Gmail app password
    }
});

// Function to send appointment confirmation email
const sendAppointmentConfirmation = async (appointmentDetails) => {
    const {
        patientName,
        patientEmail,
        appointmentDate,
        appointmentTime,
        doctorName,
        departmentName,
        problem
    } = appointmentDetails;

    // Format the date
    const formattedDate = new Date(appointmentDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Format the time
    const [hours, minutes] = appointmentTime.split(':');
    const formattedTime = new Date(2000, 0, 1, hours, minutes).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    // Email content
    const mailOptions = {
        from: 'your-email@gmail.com', // Replace with your Gmail address
        to: patientEmail,
        subject: 'Dental Appointment Confirmation',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <h2 style="color: #17679d; text-align: center;">Appointment Confirmation</h2>
                
                <p>Dear ${patientName},</p>
                
                <p>Your dental appointment has been successfully scheduled. Here are your appointment details:</p>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Date:</strong> ${formattedDate}</p>
                    <p><strong>Time:</strong> ${formattedTime}</p>
                    <p><strong>Doctor:</strong> ${doctorName}</p>
                    <p><strong>Department:</strong> ${departmentName}</p>
                    <p><strong>Problem Description:</strong> ${problem}</p>
                </div>
                
                <p><strong>Important Notes:</strong></p>
                <ul>
                    <li>Please arrive 10 minutes before your scheduled appointment time</li>
                    <li>Bring any relevant medical records or X-rays if available</li>
                    <li>If you need to reschedule, please call us at least 24 hours in advance</li>
                </ul>
                
                <p style="color: #666; font-size: 14px;">If you have any questions, please don't hesitate to contact us.</p>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                    <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply to this email.</p>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.response);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

module.exports = {
    sendAppointmentConfirmation
}; 