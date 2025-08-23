const Validator = require('../../../Extesions/validator');
const messages = require('../../../Extesions/messCost');
const { sendNotification } = require("../../../Extesions/notificationService");
const sendEmail = require("../../../Extesions/sendEmail");
const {  Report } = require('../../../model/reportModels');
const dotenv = require('dotenv');
dotenv.config();

class CreateInfo {

    
    Validate(req) {
        const { name, description, status} = req.body;

        let errors = {};

        const nameError =
            Validator.notEmpty(name, 'Tên module') ||
            Validator.notNull(name, 'Tên module') ||
            Validator.maxLength(name, 30, 'Tên module');
        if (nameError) errors.name = nameError;
        const descriptionError =
            Validator.maxLength(description, 200, 'Mô tả');
        if (descriptionError) errors.description = descriptionError;
        const statusError = 
            Validator.isEnum(status, ['draft', 'active', 'archived'], 'Trạng thái');
        if (statusError) errors.status = statusError;
        return errors;
    }

    Handle = async (req, res) => {
        const errors = this.Validate(req);
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ success: false, errors });
        }
        const { name, description, status } = req.body;
        const Author = req.user;
        try {
            // Kiểm tra xem người dùng có quyền tạo module không
            if (!Author || !isNaN(Author.role) || !Author.role === 'system_admin' || !Author.role === 'school_admin') {
                return res.status(403).json({
                    success: false,
                    message: messages.login.usernameNotRole,
                });
            }

            // Kiểm tra xem module đã tồn tại chưa
            const existingModule = await Report.findOne({ name: name });
            if (existingModule) {
                return res.status(400).json({
                    success: false,
                    errors: { userName: messages.createModule.moduleNameExist },
                });
            }
            
            // Tạo module mới
            const newModule = new Report({
                name: name,
                description: description,
                status: status,
                createdBy: Author.id,
            });

            await newModule.save();

            // const roleLabels = {
            //     system_admin: 'Quản trị viên hệ thống',
            //     school_admin: 'Quản trị viên trường',
            //     teacher: 'Giáo viên',
            //     student: 'Học sinh',
            //     parent: 'Phụ huynh',
            //     staff: 'Nhân viên'
            // };
            
            // const roleName = roleLabels[role] || 'Không xác định';
            
            // // Gửi thông báo đến người dùng
            // await sendNotification({
            //     title: `Tài khoản "${newAccount.username}" đã được tạo thành công.`,
            //     description: `Tài khoản "${newAccount.username}" đã được tạo.`,
            //     url: `/users/profile/${newAccount._id}`,
            //     role: `${newAccount.role}`,
            //     type: "info"
            // });
            // await sendEmail({
            //     to: email,
            //     subject: 'TRƯỜNG TIỂU HỌC PHÚ CẦN B - Thông tin tài khoản',
            //     html: `
            //         <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" 
            //                style="max-width: 600px; background-color: #ffffff; margin: 40px auto; 
            //                border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); font-family: Arial, sans-serif;">
                        
            //             <!-- Header -->
            //             <tr>
            //                 <td align="center" bgcolor="#2E86C1" style="padding: 25px 20px;">
            //                     <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: bold;">
            //                         Chào mừng đến với Hệ thống Quản lý của Trường Tiểu học Phú Cần B
            //                     </h1>
            //                 </td>
            //             </tr>
            
            //             <!-- Main Content -->
            //             <tr>
            //                 <td style="padding: 25px;">
            //                     <h2 style="color: #2E86C1; font-size: 20px; margin-top: 0;">Xin chào ${fullName},</h2>
            //                     <p style="font-size: 15px; line-height: 1.6; color: #333333; margin-bottom: 20px;">
            //                         Bạn đã được cấp tài khoản <strong>${roleName}</strong> trên hệ thống quản lý của nhà trường. 
            //                         Dưới đây là thông tin tài khoản của bạn:
            //                     </p>
            
            //                     <table width="100%" border="0" cellspacing="0" cellpadding="8" 
            //                            style="background-color: #F9F9F9; border: 1px solid #E0E0E0; border-radius: 6px; margin-bottom: 20px;">
            //                         <tr>
            //                             <td style="font-size: 15px; color: #2E86C1; font-weight: bold;">Tài khoản:</td>
            //                             <td style="font-size: 15px; color: #333333;">${userName}</td>
            //                         </tr>
            //                         <tr>
            //                             <td style="font-size: 15px; color: #2E86C1; font-weight: bold;">Mật khẩu:</td>
            //                             <td style="font-size: 15px; color: #333333;">${password}</td>
            //                         </tr>
            //                     </table>
            
            //                     <p style="font-size: 15px; line-height: 1.6; color: #555555; margin-bottom: 20px;">
            //                         Vui lòng đăng nhập và <strong>đổi mật khẩu</strong> ngay khi có thể để đảm bảo an toàn cho tài khoản.
            //                     </p>
            
            //                     <div style="text-align: center; margin-top: 30px;">
            //                         <a href="${process.env.API_URL}" 
            //                            style="background-color: #F1C40F; color: #2E86C1; text-decoration: none; 
            //                            font-size: 16px; font-weight: bold; padding: 12px 28px; border-radius: 5px; 
            //                            display: inline-block; transition: 0.3s;">
            //                            Đăng nhập ngay
            //                         </a>
            //                     </div>
            //                 </td>
            //             </tr>
            
            //             <!-- Footer -->
            //             <tr>
            //                 <td align="center" bgcolor="#F4F6F7" style="padding: 15px; font-size: 12px; color: #777777; border-top: 1px solid #E0E0E0;">
            //                     <p style="margin: 0;">© 2025 Trường Tiểu học Phú Cần B. Mọi quyền được bảo lưu.</p>
            //                     <p style="margin: 5px 0 0;">
            //                         Liên hệ: 
            //                         <a href="mailto:huetri1972@gmail.com" style="color: #2E86C1; text-decoration: none;">huetri1972@gmail.com</a> 
            //                         | Tel: +84 076 384 9007
            //                     </p>
            //                 </td>
            //             </tr>
            //         </table>
            //     `
            // });
            return res.status(201).json({
                success: true,
                message: messages.createModule.moduleCreateSuccess,
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: messages.createUser.RegisterErorr,
                error: error.message
            });
        }
    }
}

module.exports = new CreateInfo;