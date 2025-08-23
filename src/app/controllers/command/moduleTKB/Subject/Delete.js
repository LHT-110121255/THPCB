const Validator = require('../../../../Extesions/validator');
const messages = require('../../../../Extesions/messCost');
const Subject = require('../../../../model/Subject');
const dotenv = require('dotenv');
dotenv.config();

class Delete {
    Handle = async (req, res) => {
        const { id } = req.params;
        try {
            let subject = await Subject.findById(id);
            if (!subject) {
                return res.status(400).json({
                    success: false,
                    errors: { nameError: "Môn học không tồn tại !!"},
                });
            }
            await Subject.findByIdAndDelete(id);


            return res.status(201).json({
                success: true,
                message: "Xoá môn học thành công !!",
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Lỗi khi xoá môn học !!",
                error: error.message
            });
        }
    }
}

module.exports = new Delete;