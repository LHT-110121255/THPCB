const Account = require("../../model/Account");
const Subject = require("../../model/Subject");
const Classrom = require("../../model/Classrom"); // tên trùng với model
const messages = require("../../Extesions/messCost");
class ModuleTKB {
  async xemTKB(req, res) {
      res.status(200).render("pages/moduleTKB/thoikhoabieu", { layout: "main" });
  }
  async ThemMonHoc(req, res) {
        const subjects = await Subject.find({}).sort({ createdAt: -1 }).lean();
        res.status(200).render("pages/moduleTKB/themMonHoc", { layout: "main", subjects: subjects });
  }
  async CaiDatLopHoc (req, res) {
    const subjects = await Subject.find({}).sort({ createdAt: -1 }).lean();
    res.status(200).render("pages/moduleTKB/caiDatLopHoc", { layout: "main" , subjects: subjects});
  }
  async PhanCongThuCong(req, res) {
    const subjects = await Subject.find({}).sort({ createdAt: -1 }).lean();
    const classrooms = await Classrom.find({}).sort({ createdAt: -1 }).lean();
    res.status(200).render("pages/moduleTKB/phanCongThuCong", { layout: "main", subjects: subjects, classrooms: classrooms});
  }
}

module.exports = new ModuleTKB();
