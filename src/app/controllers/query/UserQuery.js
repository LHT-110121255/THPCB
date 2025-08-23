// const CryptoService = require('../../../Extesions/cryptoService');
const Acounts = require('../../model/Account');
const jwt = require('jsonwebtoken');
const messages = require('../../Extesions/messCost');

class UserQuery {
    
    /**
     * Hàm AddUser: Xử lý trang thêm người dùng mới.
     * - Trả về trang thêm người dùng với năm hiện tại và trạng thái tạo mới (nếu có).
     * @param {Object} req - Request từ client
     * @param {Object} res - Response trả về cho client
     * @param {Function} next - Hàm tiếp theo trong chuỗi middleware
     */
    AddUser(req, res, next) {
        res.status(200).render('pages/addUser', { layout: 'main'});
    }

    /**
     * Hàm AddUser: Xử lý trang thêm người dùng mới.
     * - Trả về trang thêm người dùng với năm hiện tại và trạng thái tạo mới (nếu có).
     * @param {Object} req - Request từ client
     * @param {Object} res - Response trả về cho client
     * @param {Function} next - Hàm tiếp theo trong chuỗi middleware
     */
    UpdateUser(req, res, next) {
        res.status(200).render('pages/updateUser', { layout: 'main'});
    }
    
    /**
     * Hàm ListAllUser: Xử lý trang danh sách tất cả người dùng.
     * - Lấy tất cả các tài khoản ngoại trừ "system_admin".
     * - Nếu không có người dùng, trả về trang danh sách người dùng rỗng.
     * - Mã hóa mật khẩu người dùng trước khi gửi dữ liệu.
     * @param {Object} req - Request từ client
     * @param {Object} res - Response trả về cho client
     * @param {Function} next - Hàm tiếp theo trong chuỗi middleware
     */
    async ListAllUser(req, res, next) {
        try {
            const users = await Acounts.find({role: { $ne: 'system_admin' }})
                .sort({ updatedAt: -1 })
                .select("-password");

            const totalUsers = await Acounts.countDocuments();

            const accountData = users.map(account => ({
                ...account.toObject(),
            }));

            console.log(users);
            res.status(200).render('pages/listAllUser', { 
                layout: 'main',
                accounts: accountData,
                totalUsers,
            });
        } catch (error) {
            console.error(messages.getAllUser.getAllUserError, error);
            res.status(500).send('Internal Server Error');  // Trả về lỗi server nếu có lỗi
        }
    }
    
    /**
     * 🔹 Lấy danh sách tất cả người dùng (hỗ trợ phân trang)
     * @param {Object} req - Request từ client.
     * @param {Object} res - Response trả về JSON danh sách người dùng.
     */
    async getAllUsers(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query; // Hỗ trợ phân trang

            // Chuyển đổi sang số nguyên
            const pageNumber = parseInt(page, 10);
            const limitNumber = parseInt(limit, 10);

            const users = await Acounts.find({})
                .sort({ created_at: -1 })
                .select("-password") // Loại bỏ trường `password`
                .skip((pageNumber - 1) * limitNumber)
                .limit(limitNumber);

            const totalUsers = await Acounts.countDocuments();

            return res.status(200).json({
                success: true,
                totalUsers,
                page: pageNumber,
                limit: limitNumber,
                users
            });

        } catch (error) {
            console.error("Lỗi khi lấy danh sách người dùng:", error);
            return res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách người dùng.", error: error.message });
        }
    }

    /**
     * 🔹 Lấy thông tin chi tiết của một người dùng theo ID
     * @param {Object} req - Request từ client (chứa `id`).
     * @param {Object} res - Response trả về JSON chi tiết người dùng.
     */
    async getUserById(req, res) {
        let { id } = req.params;

        if(id === 'me') {
            
            id = req.user.id.toString();
        } 

        try {
            const user = await Acounts.findById(id).select("-password"); // Loại bỏ trường `password`

            if (!user) {
                return res.status(404).json({ success: false, message: messages.getByIdUser.getByIdUserNotfound || "Không tìm thấy người dùng." });
            }

            return res.status(200).json({ success: true, user });

        } catch (error) {
            console.error("Lỗi khi lấy thông tin người dùng:", error);
            return res.status(500).json({ success: false, message: "Lỗi khi lấy thông tin người dùng.", error: error.message });
        }
    }

    /**
     * Hàm Profile: Xử lý trang hồ sơ người dùng.
     * - Lấy thông tin người dùng từ token và trả về trang hồ sơ.
     * @param {Object} req - Request từ client
     * @param {Object} res - Response trả về cho client
     * @param {Function} next - Hàm tiếp theo trong chuỗi middleware
     */
    ProfileUser(req, res, next) {
        res.status(200).render('pages/profile', { layout: 'main'});
    }
}

module.exports = new UserQuery;
