const Acounts = require('../../../model/Account');
const Validator = require('../../../Extesions/validator');
const messages = require('../../../Extesions/messCost');
const CryptoService = require('../../../Extesions/cryptoService');
const { sendNotification } = require("../../../Extesions/notificationService");
const sendEmail = require("../../../Extesions/sendEmail");
const dotenv = require('dotenv');
const { randomInt } = require('crypto');
dotenv.config();

/**
 * Class CreateUser - Xử lý API tạo tài khoản mới
 */
class CreateUser {

    /**
     * Kiểm tra tính hợp lệ của dữ liệu đầu vào
     * @param {Object} req - Request từ client
     * @returns {Object} errors - Đối tượng chứa các lỗi nếu có
     */
    Validate(req) {
        const { userName, fullName, birthday, numberPhone, email, address, role } = req.body;

        let errors = {};

        const userNameError =
            Validator.notEmpty(userName, 'User name') ||
            Validator.notNull(userName, 'User name') ||
            Validator.maxLength(userName, 50, 'User name') ||
            Validator.containsVietnamese(userName);
        if (userNameError) errors.userName = userNameError;

        const roleError = Validator.notEmpty(role, 'Quyền hạn')
        Validator.isEnum(role, ['system_admin', 'device_manager', 'gift_manager'], 'Quyền hạn');
        if (roleError) errors.role = roleError;

        const fullNameError =
            Validator.notEmpty(fullName, 'Họ và tên') ||
            Validator.notNull(fullName, 'Họ và tên') ||
            Validator.maxLength(fullName, 50, 'Họ và tên');
        if (fullNameError) errors.fullName = fullNameError;

        const birthdayError = Validator.isDate(birthday, 'Ngày sinh');
        if (birthdayError) errors.birthday = birthdayError;

        const numberPhoneError =
            Validator.notEmpty(numberPhone, 'Số điện thoại') ||
            Validator.isPhoneNumber(numberPhone);
        if (numberPhoneError) errors.numberPhone = numberPhoneError;

        const emailError = Validator.isEmail(email, 'Email');
        if (emailError) errors.email = emailError;

        const addressError = Validator.notEmpty(address, 'Địa chỉ') ;
        if (addressError) errors.address = addressError;

        if (req.file) {
            const avatarError = 
            Validator.maxFileSize(req.file.size, 10, 'Ảnh đại diện')||
            Validator.isImageFile(req.file);
            if (avatarError) errors.avatar = avatarError;
        }

        return errors;
    }

    /**
     * Xử lý API tạo tài khoản người dùng mới
     * @param {Object} req - Request từ client
     * @param {Object} res - Response để trả JSON
     */
    Handle = async (req, res) => {
        const errors = this.Validate(req);
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ success: false, errors });
        }

        const { userName, fullName, birthday, numberPhone, email, address, role, department, subjects, qualification, startYear, position } = req.body;
        try {
            // Kiểm tra xem username đã tồn tại chưa
            const existingAccount = await Acounts.findOne({ username: userName });
            if (existingAccount) {
                return res.status(400).json({
                    success: false,
                    errors: { userName: messages.createUser.accountExist },
                });
            }

            // Mã hóa mật khẩu
            const password = "P@ssword123";
            const encryptedPassword = CryptoService.encrypt(password);
            const teacherCode = randomInt(100000, 999999).toString();
            const yearsOfExperience = startYear ? new Date().getFullYear() - new Date(startYear).getFullYear() : 0;

            // Tạo tài khoản mới
            const newAccount = new Acounts({
                username: userName,
                password: encryptedPassword,
                role: role,
                profile: {
                    fullName: fullName,
                    birthDate: birthday ? new Date(birthday) : null,
                    avatar: req.file ? '/avatars/' + req.file.filename : null,
                    address: address,
                    phone: numberPhone,
                    email: email,
                    teacherCode: role === 'teacher' ? teacherCode : null,
                    subjectSpecialization: role === 'teacher' ? subjects : null,
                    academicLevel: role === 'teacher' ? qualification : null,
                    yearsOfExperience: role === 'teacher' ? yearsOfExperience : null, 
                    hireDate: role === 'teacher' ? new Date(startYear) : null,
                    department: role === 'teacher' ? department : null,
                    position: role === 'teacher' ? position : null,
                }
            });

            await newAccount.save();

            const roleLabels = {
                system_admin: 'Quản trị viên hệ thống',
                school_admin: 'Quản trị viên trường',
                teacher: 'Giáo viên',
                student: 'Học sinh',
                parent: 'Phụ huynh',
                staff: 'Nhân viên'
            };
            
            const roleName = roleLabels[role] || 'Không xác định';
            
            // Gửi thông báo đến người dùng
            await sendNotification({
                title: `Tài khoản "${newAccount.username}" đã được tạo thành công.`,
                description: `Tài khoản "${newAccount.username}" đã được tạo.`,
                url: `/users/profile/${newAccount._id}`,
                role: `${newAccount.role}`,
                type: "info"
            });
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
                                <h2 style="color: #2E86C1; font-size: 20px; margin-top: 0;">Xin chào ${fullName},</h2>
                                <p style="font-size: 15px; line-height: 1.6; color: #333333; margin-bottom: 20px;">
                                    Bạn đã được cấp tài khoản <strong>${roleName}</strong> trên hệ thống quản lý của nhà trường. 
                                    Dưới đây là thông tin tài khoản của bạn:
                                </p>
            
                                <table width="100%" border="0" cellspacing="0" cellpadding="8" 
                                       style="background-color: #F9F9F9; border: 1px solid #E0E0E0; border-radius: 6px; margin-bottom: 20px;">
                                    <tr>
                                        <td style="font-size: 15px; color: #2E86C1; font-weight: bold;">Tài khoản:</td>
                                        <td style="font-size: 15px; color: #333333;">${userName}</td>
                                    </tr>
                                    <tr>
                                        <td style="font-size: 15px; color: #2E86C1; font-weight: bold;">Mật khẩu:</td>
                                        <td style="font-size: 15px; color: #333333;">${password}</td>
                                    </tr>
                                </table>
            
                                <p style="font-size: 15px; line-height: 1.6; color: #555555; margin-bottom: 20px;">
                                    Vui lòng đăng nhập và <strong>đổi mật khẩu</strong> ngay khi có thể để đảm bảo an toàn cho tài khoản.
                                </p>
            
                                <div style="text-align: center; margin-top: 30px;">
                                    <a href="${process.env.API_URL}" 
                                       style="background-color: #F1C40F; color: #2E86C1; text-decoration: none; 
                                       font-size: 16px; font-weight: bold; padding: 12px 28px; border-radius: 5px; 
                                       display: inline-block; transition: 0.3s;">
                                       Đăng nhập ngay
                                    </a>
                                </div>
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
            return res.status(201).json({
                success: true,
                message: messages.createUser.accountCreateSuccess,
                user: {
                    _id: newAccount._id,
                    username: newAccount.username,
                    role: newAccount.role,
                    profile: newAccount.profile
                }
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

module.exports = new CreateUser();