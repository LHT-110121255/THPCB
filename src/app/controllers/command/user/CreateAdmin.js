const Acounts = require('../../../model/Account');
const CryptoService = require('../../../Extesions/cryptoService');
const messages = require('../../../Extesions/messCost');

/**
 * Class CreateAdmin
 * Chức năng: Tạo tài khoản quản trị viên hệ thống.
 * - Hàm `CreateAdmin`: Kiểm tra sự tồn tại của tài khoản admin và tạo mới nếu chưa tồn tại.
 */
class CreateAdmin {
    
    /**
     * Hàm CreateAdmin
     * Kiểm tra xem tài khoản quản trị viên hệ thống đã tồn tại chưa. Nếu chưa tồn tại, 
     * tạo tài khoản mới với thông tin cố định.
     */
    CreateAdmin = async () => {
        try {
            const existingAdmin = await Acounts.findOne({ username: 'LamHueTrung' });
            if (existingAdmin) {
                console.log(messages.createUser.accountAdminExist, existingAdmin);
                return; 
            }
            const password = 'Lht080103*';
            const encryptedPassword = CryptoService.encrypt(password); 
            const newAdmin = new Acounts({
                username: 'LamHueTrung',
                password: encryptedPassword, 
                role: 'system_admin',
                profile: {
                    fullName: 'Lâm Huệ Trung',
                    birthDate: new Date('2003-08-01'),
                    avatar: '/img/systemAdmin.jpg',
                    address: 'Ấp Sóc Tre, 29341',
                    phone: '0763849007',
                    email: 'lamhuetrung@gmail.com'
                }
            });
            const savedAdmin = await newAdmin.save();
            console.log(messages.createUser.accountCreateSuccess, savedAdmin);

        } catch (error) {
            console.error(messages.createUser.accountCreateError, error);
        }
    };
}

module.exports = new CreateAdmin();
