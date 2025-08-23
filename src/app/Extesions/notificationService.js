const axios = require("axios");
const dotenv = require('dotenv');
dotenv.config();

const sendNotification = async ({ title, description, url = null, role, type }) => {
    try {
        await axios.post(`${process.env.API_URL}/api/notification/create`, {
            title,
            description,
            url,
            role,
            type
        });
    } catch (err) {
        console.error("Lỗi gửi thông báo:", err.message);
    }
};

module.exports = { sendNotification };
