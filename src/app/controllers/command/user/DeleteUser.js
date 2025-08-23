const messages = require('../../../Extesions/messCost');
const Acounts = require('../../../model/Account');
const { sendNotification } = require("../../../Extesions/notificationService");
const sendEmail = require("../../../Extesions/sendEmail");
const fs = require('fs');
const path = require('path');

class DeleteUser {
    
    /**
     * Vô hiệu hóa tài khoản người dùng bằng cách đặt thuộc tính `isDeleted` thành `true`.
     * Nếu không tìm thấy người dùng hoặc có lỗi xảy ra, trả về thông báo lỗi.
     * 
     * @param {Object} req - Yêu cầu chứa thông tin ID người dùng.
     * @param {Object} res - Phản hồi chứa thông báo kết quả.
     */
    async disable(req, res) {
        const { id } = req.params;  

        try {
            // Cập nhật trạng thái isDeleted của người dùng thành true
            const result = await Acounts.findByIdAndUpdate(id, { isDeleted: true }, { new: true });

            req.session.isSoftDelete = true; // Đánh dấu trạng thái đã vô hiệu hóa
            if (!result) {
                req.session.isSoftDelete = false;
                return res.status(404).json({ success: false, message: messages.deleteUser.softDeleteError });
            }
            
            // Gửi thông báo đến người dùng
            const user = await Acounts.findById(id);
            await sendNotification({
                title: "Tài khoản đã bị vô hiệu hóa",
                description: `Tài khoản "${user.profile.fullName}" đã được vô hiệu hóa.`,
                url: "users/listAllUser",
                role: user.role,
                type: "warning"
            });

            // Gửi email thông báo
            const roleName = user.role === 'system_admin' ? 'Quản trị viên hệ thống' : ('device_manager' ? 'Quản lý thiết bị' : (role === 'gift_manager' ? 'Quản lý quà tặng' : 'Người dùng'));
            await sendEmail({
                to: email,
                subject: 'TRƯỜNG TIỂU HỌC PHÚ CẦN B - Thông tin tài khoản',
                html: `
                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" 
                           style="max-width: 600px; background-color: #ffffff; margin: 40px auto; 
                           border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); font-family: Arial, sans-serif;">
                        
                        <!-- Header -->
                        <tr>
                            <td align="center" bgcolor="#2E86C1" style="padding: 25px 20px;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: bold;">
                                    Chào mừng đến với Hệ thống Quản lý của Trường Tiểu học Phú Cần B
                                </h1>
                            </td>
                        </tr>
            
                        <!-- Main Content -->
                        <tr>
                            <td style="padding: 25px;">
                                <h2 style="color: #2E86C1; font-size: 20px; margin-top: 0;">Xin chào ${user.profile.fullName},</h2>
                                <p style="font-size: 15px; line-height: 1.6; color: #333333; margin-bottom: 20px;">
                                    Tài khoản của bạn đã bị vô hiệu hóa. Dưới đây là thông tin tài khoản của bạn:
                                </p>
                                <tr>
                            </tr>
                                <table width="100%" border="0" cellspacing="0" cellpadding="8" 
                                       style="background-color: #F9F9F9; border: 1px solid #E0E0E0; border-radius: 6px; margin-bottom: 20px;">
                                    <tr>
                                        <td style="font-size: 15px; color: #2E86C1; font-weight: bold;">Mật khẩu cũ:</td>
                                        <td style="font-size: 15px; color: #333333;">${user.username}</td>
                                    </tr>
                                    
                                </table>
            
                                <p style="font-size: 15px; line-height: 1.6; color: #555555; margin-bottom: 20px;">
                                Lý do vô hiệu hóa: Tài khoản của bạn có thể đã vi phạm chính sách sử dụng hoặc không được sử dụng trong thời gian dài. Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ với chúng tôi để được hỗ trợ.
                                Để biết thêm chi tiết hoặc khôi phục tài khoản, vui lòng liên hệ qua thông tin bên dưới.
                                </p>
                            </td>
                        </tr>
            
                        <!-- Footer -->
                        <tr>
                            <td align="center" bgcolor="#F4F6F7" style="padding: 15px; font-size: 12px; color: #777777; border-top: 1px solid #E0E0E0;">
                                <p style="margin: 0;">© 2025 Trường Tiểu học Phú Cần B. Mọi quyền được bảo lưu.</p>
                                <p style="margin: 5px 0 0;">
                                    Liên hệ: 
                                    <a href="mailto:huetri1972@gmail.com" style="color: #2E86C1; text-decoration: none;">huetri1972@gmail.com</a> 
                                    | Tel: +84 076 384 9007
                                </p>
                            </td>
                        </tr>
                    </table>
                `
            });
            return res.status(200).json({ success: true, message: messages.deleteUser.softDeleteSuccess });
        } catch (error) {
            console.error(messages.deleteUser.softDeleteError, error);
            return res.status(500).json({ success: false, message: messages.deleteUser.softDeleteError });
        }
    }
    
    /**
     * 🔥 Xóa vĩnh viễn tài khoản người dùng và xóa ảnh đại diện (nếu có).
     * @param {Object} req - Yêu cầu chứa ID người dùng.
     * @param {Object} res - Phản hồi JSON kết quả.
     */
    async delete(req, res) {
        const { id } = req.params;

        try {
            // 🔹 Tìm và xóa người dùng
            const user = await Acounts.findByIdAndDelete(id);
            if (!user) {
                return res.status(404).json({ success: false, message: messages.deleteUser.deleteError });
            }

            // 🔹 Kiểm tra và xóa ảnh đại diện (nếu có)
            if (user.profile && user.profile.avatar && typeof user.profile.avatar === "string" && user.profile.avatar.trim() !== "") {
                const avatarPath = path.join(__dirname, '../../../../../public', user.profile.avatar);

                try {
                    if (fs.existsSync(avatarPath)) {
                        await fs.promises.unlink(avatarPath); // Xóa file bất đồng bộ
                        console.log("Ảnh đại diện đã được xóa:", user.profile.avatar);
                    } 
                } catch (err) {
                    console.error("Lỗi khi xóa ảnh đại diện:", err);
                }
            }

            // 🔹 Gửi thông báo đến người dùng
            await sendNotification({
                title: "Tài khoản đã bị xóa",
                description: `Tài khoản "${user.profile.fullName}" đã được xóa vĩnh viễn.`,
                url: "users/listAllUser", 
                role: user.role,
                type: "warning"
            });
            
            // Gửi email thông báo
            const roleName = user.role === 'system_admin' ? 'Quản trị viên hệ thống' : ('device_manager' ? 'Quản lý thiết bị' : (role === 'gift_manager' ? 'Quản lý quà tặng' : 'Người dùng'));
            await sendEmail({
                to: email,
                subject: 'TRƯỜNG TIỂU HỌC PHÚ CẦN B - Thông tin tài khoản',
                html: `
                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" 
                           style="max-width: 600px; background-color: #ffffff; margin: 40px auto; 
                           border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); font-family: Arial, sans-serif;">
                        
                        <!-- Header -->
                        <tr>
                            <td align="center" bgcolor="#2E86C1" style="padding: 25px 20px;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: bold;">
                                    Chào mừng đến với Hệ thống Quản lý của Trường Tiểu học Phú Cần B
                                </h1>
                            </td>
                        </tr>
            
                        <!-- Main Content -->
                        <tr>
                            <td style="padding: 25px;">
                                <h2 style="color: #2E86C1; font-size: 20px; margin-top: 0;">Xin chào ${user.profile.fullName},</h2>
                                <p style="font-size: 15px; line-height: 1.6; color: #333333; margin-bottom: 20px;">
                                Chúng tôi rất tiếc phải thông báo rằng tài khoản ${roleName} của bạn trên hệ thống đã bị xoá vĩnh viễn. Dưới đây là thông tin liên quan:
                                </p>
                                <tr>
                            </tr>
                                <table width="100%" border="0" cellspacing="0" cellpadding="8" 
                                       style="background-color: #F9F9F9; border: 1px solid #E0E0E0; border-radius: 6px; margin-bottom: 20px;">
                                    <tr>
                                        <td style="font-size: 15px; color: #2E86C1; font-weight: bold;">Mật khẩu cũ:</td>
                                        <td style="font-size: 15px; color: #333333;">${user.username}</td>
                                    </tr>
                                    
                                </table>
            
                                <p style="font-size: 15px; line-height: 1.6; color: #555555; margin-bottom: 20px;">
                                Lý do vô hiệu hóa: Tài khoản của bạn có thể đã vi phạm chính sách sử dụng hoặc không được sử dụng trong thời gian dài. Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ với chúng tôi để được hỗ trợ.
                                Để biết thêm chi tiết hoặc khôi phục tài khoản, vui lòng liên hệ qua thông tin bên dưới.
                                </p>
                            </td>
                        </tr>
            
                        <!-- Footer -->
                        <tr>
                            <td align="center" bgcolor="#F4F6F7" style="padding: 15px; font-size: 12px; color: #777777; border-top: 1px solid #E0E0E0;">
                                <p style="margin: 0;">© 2025 Trường Tiểu học Phú Cần B. Mọi quyền được bảo lưu.</p>
                                <p style="margin: 5px 0 0;">
                                    Liên hệ: 
                                    <a href="mailto:huetri1972@gmail.com" style="color: #2E86C1; text-decoration: none;">huetri1972@gmail.com</a> 
                                    | Tel: +84 076 384 9007
                                </p>
                            </td>
                        </tr>
                    </table>
                `
            });
            return res.status(200).json({ success: true, message: messages.deleteUser.deleteSuccess });

        } catch (error) {
            console.error(messages.deleteUser.deleteError, error);
            return res.status(500).json({ success: false, message: "Lỗi khi xóa tài khoản.", error: error.message });
        }
    }
}

module.exports = new DeleteUser();
