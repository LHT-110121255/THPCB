const Validator = require('../../../../Extesions/validator');
const messages = require('../../../../Extesions/messCost');
const Class = require('../../../../model/Classrom'); 
const Subject = require('../../../../model/Subject');
const dotenv = require('dotenv');
dotenv.config();

class CreateClass {
    Validate(req) {
        const { TenLop, TenGiaoVien, Khoi, SoLuongHocSinh, TongSoTiet, HocKy } = req.body;
        let errors = {};

        // Validate tên lớp
        const TenLopError =
            Validator.notNull(TenLop, 'Tên lớp học') ||
            Validator.notEmpty(TenLop, 'Tên lớp học') ||
            Validator.maxLength(TenLop, 30, 'Tên lớp học');
        if (TenLopError) errors.TenLop = TenLopError;

        // Validate TenGiaoVien
        const TenGiaoVienError =
            Validator.notEmpty(TenGiaoVien, 'Giáo viên chủ nhiệm') ||
            Validator.notNull(TenGiaoVien, 'Giáo viên chủ nhiệm') ||
            Validator.maxLength(TenGiaoVien, 50, 'Giáo viên chủ nhiệm');
        if (TenGiaoVienError) errors.TenGiaoVien = TenGiaoVienError;

        // Validate Khối
        const khoiError =
            Validator.notEmpty(Khoi, 'Khối lớp') ||
            Validator.isEnum(Khoi, ['1', '2', '3', '4', '5'], 'Khối lớp') ||
            Validator.notNull(Khoi, 'Khối lớp');
        if (khoiError) errors.Khoi = khoiError;

        // // Validate số lượng học sinh
        // const soLuongError = Validator.isPositiveNumber(SoLuongHocSinh, 'Số lượng học sinh');
        // if (soLuongError) errors.SoLuongHocSinh = soLuongError;

        // // Validate tổng số tiết
        // const tongSoTietError = Validator.greaterThan(TongSoTiet, -1, 'Tổng số tiết');
        // if (tongSoTietError) errors.TongSoTiet = tongSoTietError;

        // // Validate học kỳ
        // const hocKyError = Validator.isEnum(HocKy, ['1', '2'], 'Học kỳ');
        // if (hocKyError) errors.HocKy = hocKyError;

        return errors;
    }

    Handle = async (req, res) => {
        console.log("Create Class Command Handle Called", req.body);

        // Gọi hàm validate
        const errors = this.Validate(req);
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ success: false, errors });
        }

        const { TenLop, TenGiaoVien, Khoi, SoLuongHocSinh, HocKy, subjects } = req.body;

        try {
            // Kiểm tra lớp đã tồn tại chưa
            const existingClass = await Class.findOne({ TenLop });
            if (existingClass) {
                return res.status(400).json({
                    success: false,
                    errors: { TenLop: "Lớp học đã tồn tại !!" },
                });
            }

            const subjectArr = [];
            for (let s of subjects) {
                const subj = await Subject.findById(s.subjectId);
                if (!subj) {
                    return res.status(400).json({ success: false, message: `Môn học với id ${s.subjectId} không tồn tại` });
                }

                // Nếu môn yêu cầu chuyên môn nhưng không có teacher
                if (subj.ChuyenMon && (!s.teacher || s.teacher.trim() === "")) {
                    return res.status(400).json({ success: false, message: `Môn ${subj.name} cần giáo viên chuyên môn` });
                }

                subjectArr.push({
                    subject: subj._id,
                    SoTiet: s.SoTiet,
                    teacher: s.teacher || "" // lưu tên giáo viên dạng string
                });
            }

            //Tính tổng số tiết
            let calculatedTongSoTiet = 0;
            if (subjects && subjects.length > 0) {
                calculatedTongSoTiet = subjects.reduce((total, subject) => total + (subject.SoTiet || 0), 0);
            }
            
            // Tạo lớp học mới
            const newClass = new Class({
                name: TenLop || 'Lớp học mới',
                GVCN: TenGiaoVien || 'Chưa có giáo viên chủ nhiệm',
                Khoi,
                SoLuongHocSinh: SoLuongHocSinh || 0, 
                TongSoTiet: calculatedTongSoTiet || 0,
                HocKy: HocKy || '1',
                subjects: subjectArr || [], 
            });

            await newClass.save();

            return res.status(201).json({
                success: true,
                message: "Tạo lớp học thành công !!",
                data: newClass,
            });

        } catch (error) {
            console.error("Error creating class:", error);
            return res.status(500).json({
                success: false,
                message: "Lỗi khi tạo lớp học !!",
                error: error.message
            });
        }
    }
}

module.exports = new CreateClass();
