const fs = require('fs');
const multer = require('multer');
const path = require('path');

// Định nghĩa đường dẫn thư mục
const tempUploadPath = 'src/public/uploads/rewards/temp/';
const finalUploadPath = 'src/public/uploads/rewards/';

// Tạo thư mục nếu chưa tồn tại
if (!fs.existsSync(tempUploadPath)) {
    fs.mkdirSync(tempUploadPath, { recursive: true });
}
if (!fs.existsSync(finalUploadPath)) {
    fs.mkdirSync(finalUploadPath, { recursive: true });
}

// Cấu hình nơi lưu ảnh tạm thời
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempUploadPath); // Lưu ảnh vào thư mục tạm
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
    }
});

// Lọc chỉ cho phép ảnh PNG, JPG, JPEG, WEBP
const fileFilter = (req, file, cb) => {
    if (!file) {
        return cb(null, true); // Cho phép không có ảnh
    }
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ cho phép tải lên file ảnh (PNG, JPG, JPEG, WEBP).'), false);
    }
};

// Giới hạn kích thước file 10MB
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: fileFilter
}).array('images', 5); // Cho phép tối đa 5 ảnh, có thể không có ảnh

module.exports = upload;
