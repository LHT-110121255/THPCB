const fs = require("fs");
const csvParser = require("csv-parser");
const Teacher = require("../../../model/Teacher");
const Validator = require("../../../Extesions/validator");
const messages = require("../../../Extesions/messCost");
const upload = require("../../../Extesions/uploadFile");
const { sendNotification } = require("../../../Extesions/notificationService");

/**
 * Tự động phát hiện dấu phân cách CSV (`,` hoặc `;`).
 * @param {string} filePath - Đường dẫn file CSV.
 * @returns {Promise<string>} - Dấu phân cách CSV (`;` hoặc `,`).
 */
async function detectSeparator(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, "utf8", (err, data) => {
            if (err) return reject(err);
            const firstLine = data.split("\n")[0];
            resolve(firstLine.includes(";") ? ";" : ",");
        });
    });
}

class ImportTeachers {
    /**
     * Xử lý import danh sách giảng viên từ file CSV.
     */
    Handle = async (req, res) => {
        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ success: false, message: err.message });
            }

            if (!req.file) {
                return res.status(400).json({ success: false, message: messages.teacher.noFile });
            }

            const filePath = req.file.path;
            const teachersToInsert = [];
            const errors = new Set();
            const processedTeachers = new Set();

            try {
                // Xác định dấu phân cách CSV
                const separator = await detectSeparator(filePath);

                const rows = [];
                let headerChecked = false;

                // Đọc file CSV với dấu phân cách đã phát hiện
                await new Promise((resolve, reject) => {
                    fs.createReadStream(filePath)
                        .pipe(csvParser({ separator,mapHeaders: ({ header }) => {
                            const headerMap = {
                              "Họ tên": "name",
                              "Email": "email",
                              "Số điện thoại": "phone",
                              "Chuyên ngành": "department",
                              "Đơn vị": "unit"
                            };
                            const cleanHeader = header.trim().replace(/^﻿/, "");
                            return headerMap[cleanHeader] || cleanHeader; // fallback nếu không ánh xạ
                          }
                        }))
                        .on("data", (row) => {
                            if (!headerChecked) {
                                // Kiểm tra xem file có đủ các cột cần thiết
                                const requiredHeaders = ['name', 'email', 'phone', 'department', 'unit'];
                                const headers = Object.keys(row);
                                const extraHeaders = headers.filter(header => !requiredHeaders.includes(header));
                                
                                // Kiểm tra thiếu cột
                                if (requiredHeaders.some(header => !headers.includes(header))) {
                                    errors.add({
                                        row: row,
                                        error: "Định dạng file không đúng, thiếu cột bắt buộc."
                                    });
                                }

                                // Kiểm tra cột thừa
                                if (extraHeaders.length > 0) {
                                    errors.add({
                                        row: row,
                                        error: `Định dạng file không đúng, có cột thừa: ${extraHeaders.join(", ")}`
                                    });
                                }
                                headerChecked = true;
                            }
                            rows.push(row);
                        })
                        .on("end", resolve)
                        .on("error", reject);
                });

                // Kiểm tra file có dữ liệu hay không
                if (rows.length === 0) {
                    return res.status(400).json({ success: false, message: messages.teacher.emptyFile });
                }

                // Xử lý từng dòng trong CSV
                for (const row of rows) {
                    const name = row.name?.trim();
                    const email = row.email?.trim();
                    const phone = '0'+ row.phone?.trim();
                    const department = row.department?.trim();
                    const unit = row.unit?.trim();

                    // Kiểm tra dữ liệu hợp lệ bằng Validator
                    const errorsInRow = {
                        name: Validator.notEmpty(name, "Tên giảng viên") || Validator.maxLength(name, 100, "Tên giảng viên"),
                        email: Validator.notEmpty(email, "Email") || Validator.isEmail(email),
                        phone: Validator.notEmpty(phone, "Số điện thoại") || Validator.isPhoneNumber(phone),
                        department: Validator.notEmpty(department, "Bộ môn") || Validator.maxLength(department, 100, "Bộ môn"),
                        unit: Validator.notEmpty(unit, "Đơn vị") || Validator.maxLength(unit, 100, "Đơn vị")
                    };

                    // Nếu có lỗi, thêm vào danh sách lỗi
                    if (Object.values(errorsInRow).some(error => error)) {
                        errors.add({ row, error: errorsInRow });
                        continue;
                    }

                    try {
                        // Kiểm tra dòng trùng lặp trong CSV
                        if (processedTeachers.has(email)) {
                            continue;
                        }
                        processedTeachers.add(email);

                        // Kiểm tra giảng viên đã tồn tại trong DB
                        const existingTeacher = await Teacher.findOne({ email });
                        if (!existingTeacher) {
                            teachersToInsert.push({ name, email, phone, department, unit });
                        }
                    } catch (error) {
                        errors.add({ row, error: error.message });
                    }
                }

                // Thêm giảng viên hợp lệ vào database
                if (teachersToInsert.length > 0) {
                    await Teacher.insertMany(teachersToInsert);
                }

                // Xóa file CSV sau khi xử lý xong
                fs.unlinkSync(filePath);
                if (errors.size > 0) {
                    return res.status(400).json({
                        success: false,
                        errors: Array.from(errors) // Trả về các lỗi về định dạng file
                    });
                }

                // Gửi thông báo thành công
                await sendNotification({
                    title: "Import giảng viên thành công",
                    description: `Đã thêm ${teachersToInsert.length} giảng viên mới từ file CSV.`,
                    url: `/users/ListAllTeacher`,
                    role: "system_admin",
                    type: "info",
                });

                return res.status(200).json({
                    success: true,
                    message: messages.teacher.importSuccess,
                    inserted: teachersToInsert.length,
                    errors: Array.from(errors)
                });

            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: messages.teacher.importError,
                    error: error.message
                });
            }
        });
    };
}

module.exports = new ImportTeachers();
