const Validator = require('../../../../Extesions/validator');
const messages = require('../../../../Extesions/messCost');
const Classrom = require('../../../../model/Classrom');
const dotenv = require('dotenv');
dotenv.config();

class Update {

    
    // Validate(req) {
    //     const { name, ChuyenMon} = req.body;

    //     let errors = {};

    //     const nameError =
    //         Validator.notEmpty(name, 'Tên môn học') ||
    //         Validator.notNull(name, 'Tên môn học') ||
    //         Validator.maxLength(name, 30, 'Tên môn học');
    //     if (nameError) errors.name = nameError;
    //     return errors;
    // }

    Handle = async (req, res) => {
        const { id } = req.params;
        
        // const errors = this.Validate(req);
        // if (Object.keys(errors).length > 0) {
        //     return res.status(400).json({ success: false, errors });
        // }
        // const { name, ChuyenMon, teacherName } = req.body;
        // try {
        //     let subject = await Subject.findById(id);
        //     if(subject.name == name && subject.ChuyenMon == ChuyenMon && subject.teacher == teacherName) {
        //         return res.status(400).json({
        //             success: false,
        //             message: "Không có gì thay đổi !!",
        //         });
        //     }
        //     subject.name = name || subject.name;
        //     subject.ChuyenMon = ChuyenMon || subject.ChuyenMon; 
        //     subject.teacher = teacherName || subject.teacher; // Mặc định là chuỗi rỗng nếu không có giá trị
        //     await subject.save();

        //     return res.status(201).json({
        //         success: true,
        //         message: "Cập nhật môn học thành công !!",
        //     });

        // } catch (error) {
        //     return res.status(500).json({
        //         success: false,
        //         message: "Lỗi khi cập nhật môn học !!",
        //         error: error.message
        //     });
        // }
    }
}

module.exports = new Update;