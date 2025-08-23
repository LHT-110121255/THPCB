const Account = require("../../../model/Account");
const messages = require("../../../Extesions/messCost");
const { sendNotification } = require("../../../Extesions/notificationService");

class DeleteTeacher {
    /**
     * API xóa Giáo viên
     */
    Handle = async (req, res) => {
        const { teacherId } = req.params;

        try {
            const teacher = await Account.findById(teacherId);
            if (!teacher) {
                return res.status(404).json({
                    success: false,
                    message: messages.teacher.teacherNotFound
                });
            }
            // Xóa Giáo viên
            await Account.findByIdAndUpdate(teacherId, { isDeleted: true });

            // Gửi thông báo đến người dùng
            await sendNotification({
                title: "Thông báo xóa Giáo viên",
                description: `Giáo viên ${teacher.name} đã được xóa thành công.`,
                url: "/users/ListAllTeacher",
                role: "system_admin",
                type: "warning"
            });
            return res.status(200).json({
                success: true,
                message: messages.teacher.deleteSuccess
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: messages.teacher.deleteError,
                error: error.message
            });
        }
    };
}

module.exports = new DeleteTeacher();
