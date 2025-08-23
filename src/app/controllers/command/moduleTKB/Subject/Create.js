const Validator = require('../../../../Extesions/validator');
const messages = require('../../../../Extesions/messCost');
const Subject = require('../../../../model/Subject');
const dotenv = require('dotenv');
dotenv.config();

class Create {
    Validate(req) {
        const { name, ChuyenMon} = req.body;

        let errors = {};

        const nameError =
            Validator.notEmpty(name, 'Tên môn học') ||
            Validator.notNull(name, 'Tên môn học') ||
            Validator.maxLength(name, 30, 'Tên môn học');
        if (nameError) errors.name = nameError;
        return errors;
    }

    Handle = async (req, res) => {
        const errors = this.Validate(req);
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ success: false, errors });
        }
        console.log("Create Subject Command Handle Called", req.body);
        const { name, ChuyenMon, teacherName } = req.body;
        try {
            // Kiểm tra xem module đã tồn tại chưa
            const existingSubject = await Subject.findOne({ name: name });
            if (existingSubject) {
                return res.status(400).json({
                    success: false,
                    errors: { nameError: "Môn học đã tồn tại !!"},
                });
            }
            
            // Tạo module mới
            const newSubject = new Subject({
                name: name,
                ChuyenMon: ChuyenMon || false, // Mặc định là false nếu không có giá trị
                teacher: teacherName || "", // Mặc định là chuỗi rỗng nếu không có giá trị
            });

            await newSubject.save();
            return res.status(201).json({
                success: true,
                message: "Tạo môn học thành công !!",
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Lỗi khi tạo môn học !!",
                error: error.message
            });
        }
    }
}

module.exports = new Create;