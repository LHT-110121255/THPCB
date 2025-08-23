const Accounts = require('../../../model/Account');
const Validator = require('../../../Extesions/validator');
const messages = require('../../../Extesions/messCost');
const CryptoService = require('../../../Extesions/cryptoService');
const jwt = require('jsonwebtoken');

class LoginAdmin {
    
    /**
     * Lấy thông tin người dùng hiện tại dựa trên JWT token
     * @param {Object} req - Request từ client
     * @param {Object} res - Response trả về JSON
     */
    getCurrentUser = async (req, res) => {
        try {
            // Lấy token từ header Authorization hoặc session
            const token = req.headers.authorization?.split(' ')[1] || req.session.token;
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Không tìm thấy token'
                });
            }

            // Giải mã token
            const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
            const userId = decoded.id;

            // Tìm người dùng trong DB
            const user = await Accounts.findById(userId).select('username role');
            if (!user || user.isDeleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Người dùng không tồn tại hoặc đã bị xóa'
                });
            }

            // Trả về thông tin người dùng
            return res.status(200).json({
                success: true,
                user: {
                    id: user._id,
                    username: user.username,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Error fetching current user:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi server'
            });
        }
    }

    /**
     * Kiểm tra tính hợp lệ của dữ liệu đầu vào
     * @param {Object} req - Request từ client
     * @returns {Object} errors - Danh sách lỗi nếu có
     */
    Validate(req) {
        const { username, password } = req.body;
        let errors = {};

        const usernameError = Validator.notEmpty(username, 'Tên đăng nhập');
        if (usernameError) errors.username = usernameError;

        const passwordError = Validator.notEmpty(password, 'Mật khẩu');
        if (passwordError) errors.password = passwordError;

        const passwordValidation = Validator.isPassword(password);
        if (passwordValidation) errors.password = passwordValidation;

        const vietnameseCheck = Validator.containsVietnamese(username);
        if (vietnameseCheck) errors.username = vietnameseCheck;

        return errors;
    }

    /**
     * Xử lý đăng nhập quản trị viên (trả về JSON)
     * @param {Object} req - Request từ client
     * @param {Object} res - Response trả về JSON
     */
    Handle = async (req, res) => {
        const errors = this.Validate(req);

        // Kiểm tra lỗi nhập liệu
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ success: false, errors });
        }

        const { username, password } = req.body;
        try {
            // Tìm kiếm tài khoản trong DB
            const admin = await Accounts.findOne({ username });
            if (!admin) {
                return res.status(404).json({
                    success: false,
                    errors: {
                        username: messages.login.usernameNotFound
                    } 
                });
            }

            // Kiểm tra tài khoản đã bị xóa chưa
            if (admin.isDeleted) {
                return res.status(403).json({
                    success: false,
                    errors: {
                        username: messages.login.usernamesoftDelete
                    } 
                });
            }

            // Giải mã mật khẩu
            const decryptedPassword = CryptoService.decrypt(admin.password);

            if (password !== decryptedPassword) {
                return res.status(401).json({
                    success: false,
                    errors: {
                        password: messages.login.passwordCompaseFailed
                    } 
                });
            }

            // Kiểm tra vai trò
            if (!['system_admin', 'school_admin', 'teacher'].includes(admin.role)) {
                return res.status(403).json({
                    success: false,
                    errors: {
                        username: messages.login.usernameNotRole
                    } 
                });
            }

            // Tạo JWT token
            const jwtSecretKey = process.env.JWT_SECRET_KEY;
            const token = jwt.sign(
                { id: admin._id, role: admin.role },
                jwtSecretKey,
                { expiresIn: '5h' }
            );
            req.session.token = token;
            req.headers.authorization = token;
            
            // Trả về JSON khi đăng nhập thành công
            return res.status(200).json({
                success: true,
                message: "Đăng nhập thành công",
                token,
                user: {
                    id: admin._id,
                    username: admin.username,
                    role: admin.role
                }
            });

        } catch (error) {
            console.error(messages.login.loginError, error);
            return res.status(500).json({
                success: false,
                message: messages.serverError
            });
        }
    }
}

module.exports = new LoginAdmin();
