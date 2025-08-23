const path = require('path');
const fs = require('fs');

exports.renderAddUser = (req, res) => {
    // Đọc file JSON
    const provinces = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../data/provinces.json'), 'utf8')
    );

    return res.status(201).json({
        success: true,
        provinces
    });
};
