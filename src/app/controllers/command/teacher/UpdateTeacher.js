const Teacher = require("../../../model/Teacher");
const Account = require("../../../model/Account");
const Validator = require("../../../Extesions/validator");
const messages = require("../../../Extesions/messCost");
const { sendNotification } = require("../../../Extesions/notificationService");

class UpdateTeacher {
    /**
     * Kiểm tra tính hợp lệ của dữ liệu đầu vào
     * @param {Object} req - Request từ client
     * @returns {Object} errors - Danh sách lỗi nếu có
     */
    Validate(req) {
        const { fullName, birthDate, phone, email, department, subjects, qualification, hireDate, position } = req.body;

        let errors = {};

        if (fullName) {
            const nameError = Validator.notEmpty(fullName, "Tên giáo viên") ||
                Validator.maxLength(fullName, 100, "Tên giáo viên");
            if (nameError) errors.fullName = nameError;
        }
        if (email) {
            const emailError = Validator.isEmail(email);
            if (emailError) errors.email = emailError;
        }
        if (phone) {
            const phoneError = Validator.isPhoneNumber(phone);
            if (phoneError) errors.phone = phoneError;
        }
        if (department) {
            const departmentError = Validator.notEmpty(department, "Tổ/Phòng");
            if (departmentError) errors.department = departmentError;
        }
        if (subjects) {
            const subjectsError = Validator.notEmpty(subjects, "Môn dạy");
            if (subjectsError) errors.subjects = subjectsError;
        }
        if (qualification) {
            const qualificationError = Validator.notEmpty(qualification, "Trình độ chuyên môn");
            if (qualificationError) errors.qualification = qualificationError;
        }
        if (hireDate) { 
            const hireDateError = Validator.isDate(hireDate, "Năm bắt đầu công tác");
            if (hireDateError) errors.hireDate = hireDateError;
        }
        if (position) {
            const positionError = Validator.notEmpty(position, "Chức vụ");
            if (positionError) errors.position = positionError;
        }
        if (birthDate) {
            const birthDateError = Validator.isValidDate(birthDate, "Ngày sinh");
            if (birthDateError) errors.birthDate = birthDateError;
        }

        return errors;
    }

    /**
     * API cập nhật thông tin giảng viên
     */
    Handle = async (req, res) => {
        const { teacherId } = req.params;
        const errors = this.Validate(req);

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ success: false, errors });
        }

        try {
            let teacher = await Account.findById(teacherId);
            if (!teacher) {
                return res.status(404).json({
                    success: false,
                    message: messages.teacher.teacherNotFound
                });
            }

            const { fullName, birthDate, phone, email, department, subjects, qualification, hireDate, position } = req.body;

            // Kiểm tra nếu tên hoặc email giáo viên đã tồn tại trong CSDL (ngoài giáo viên hiện tại)
            const existingTeacherByName = await Account.findOne({ "profile.fullName": fullName, role: "teacher" });
            const existingTeacherByEmail = await Account.findOne({ "profile.email": email, role: "teacher" });

            if (existingTeacherByName && existingTeacherByName._id.toString() !== teacherId) {
                return res.status(400).json({
                    success: false,
                    errors: {
                        name: messages.teacher.teacherNameExists
                    }
                });
            }

            if (existingTeacherByEmail && existingTeacherByEmail._id.toString() !== teacherId) {
                return res.status(400).json({
                    success: false,
                    errors: {
                        email: messages.teacher.teacherEmailExists
                    }
                });
            }

            // Cập nhật thông tin, nếu có giá trị mới thì cập nhật, nếu không thì giữ nguyên
            teacher.profile.fullName = fullName || teacher.profile.fullName;
            teacher.profile.email = email || teacher.profile.email;
            teacher.profile.phone = phone || teacher.profile.phone;
            teacher.profile.department = department || teacher.profile.department;
            teacher.profile.subjects = subjects || teacher.profile.subjects;
            teacher.profile.qualification = qualification || teacher.profile.qualification;
            teacher.profile.hireDate = hireDate || teacher.profile.hireDate;
            teacher.profile.position = position || teacher.profile.position;
            teacher.profile.birthDate = birthDate || teacher.profile.birthDate;
            await teacher.save();

            // Gửi thông báo thành công
            await sendNotification({
                title: "Cập nhật thông tin giảng viên thành công",
                description: `Thông tin giảng viên "${teacher.name}" đã được cập nhật thành công.`,
                url: `/users/ListAllTeacher`,
                role: "system_admin",
                type: "success",
            });

            return res.status(200).json({
                success: true,
                message: messages.teacher.updateSuccess,
                teacher
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: messages.teacher.updateError,
                error: error.message
            });
        }
    };
}

module.exports = new UpdateTeacher();
