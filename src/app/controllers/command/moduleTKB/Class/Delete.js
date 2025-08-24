const Validator = require('../../../../Extesions/validator');
const messages = require('../../../../Extesions/messCost');
const Classrom = require('../../../../model/Classrom');
const dotenv = require('dotenv');
dotenv.config();

class Delete {
    Handle = async (req, res) => {
        const { id } = req.params;
        try {
            let classrom = await Classrom.findById(id);
            if (!classrom) {
                return res.status(400).json({
                    success: false,
                    errors: { nameError: "Lớp không tồn tại !!"},
                });
            }
            await Classrom.findByIdAndDelete(id);

            return res.status(201).json({
                success: true,
                message: "Xoá lớp thành công !!",
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Lỗi khi xoá lớp !!",
                error: error.message
            });
        }
    }
}

module.exports = new Delete;