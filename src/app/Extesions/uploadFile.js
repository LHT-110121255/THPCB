const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Định nghĩa thư mục lưu trữ file CSV
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = "src/public/uploads/csv/";

        // Kiểm tra nếu thư mục chưa tồn tại thì tạo mới
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`);
    }
});

// Bộ lọc để chỉ cho phép file CSV
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === ".csv") {
        cb(null, true);
    } else {
        cb(new Error("Chỉ cho phép tải lên file CSV."), false);
    }
};

// Cấu hình Multer với giới hạn kích thước file 5MB
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: fileFilter
}).single("file"); // Chỉ cho phép tải lên một file tại một thời điểm

module.exports = upload;
