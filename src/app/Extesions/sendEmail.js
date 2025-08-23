const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const sendEmail = async ({to, subject, html}) => {
        const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com', 
                service: 'gmail',
                auth: {
                        user: process.env.USERNAME_GOOGLE,
                        pass: process.env.APP_PASSWORD_GOOGLE
                },
        });

        const mailOptions = {
                from: 'HỆ THỐNG QUẢN LÝ THIẾT BỊ & QUÀ TẶNG - VICTORY',
                to: to,
                subject: subject,
                html: html
        };

        try {
                const info = await transporter.sendMail(mailOptions);
                return info;
        } catch (error) {
                console.error('Error sending email:', error);
        }
};

module.exports = sendEmail;