const {  Report} = require('../../model/reportModels');
const Account = require('../../model/Account');
const messages = require('../../Extesions/messCost');
class ModuleTK {
        CreateInfo(req, res) {
                res.status(200).render('pages/moduleThongKe/createInfo', { layout: 'main'});
        }
        createInput(req, res) {
                res.status(200).render('pages/moduleThongKe/createInput', { layout: 'main'});
        }
        createOutput(req, res) {
                res.status(200).render('pages/moduleThongKe/createOutput', { layout: 'main'});
        }

        async homeInfo(req, res) {
                const modules = await Report.find({}).sort({ updated_at: -1 }).lean().populate('createdBy', 'profile.fullName profile.email role').exec();
                // Trả về danh sách module trong response
                if (!modules || modules.length === 0) {
                        return res.status(404).json({success: false, message: messages.createModule.moduleNotFound || "Không tìm thấy module nào."});
                }
                res.status(200).render('pages/moduleThongKe/home', { layout: 'main', modules});
        }
        async getAll(req, res) {
                // Lấy danh sách tất cả các module
                const modules = await Report.find({}).sort({ updated_at: -1 }).lean().populate('createdBy', 'profile.fullName profile.email role').exec();
                // Trả về danh sách module trong response
                if (!modules || modules.length === 0) {
                        return res.status(404).json({success: false, message: messages.createModule.moduleNotFound || "Không tìm thấy module nào."});
                }
                
                // Render trang với danh sách module
                return res.status(200).json({success: true, modules});
        }
        
}

module.exports = new ModuleTK;