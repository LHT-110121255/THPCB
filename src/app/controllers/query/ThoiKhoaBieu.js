const Classrom = require('../../model/Classrom');
const Subject = require('../../model/Subject');
const TimetableSlot = require('../../model/Timetable');

// Lấy thời khóa biểu theo lớp, map thông tin môn học từ Subject
const getTimetableByClass = async (req, res) => {
  try {
    const classId = req.params.classId;
    const week = Number(req.query.week || 1);

    // Lấy thông tin lớp và subjects
    const classroom = await Classrom.findById(classId)
      .populate({
        path: 'subjects.subject',
        model: Subject,
        select: 'name ChuyenMon teacher'
      })
      .lean();

    if (!classroom) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp' });
    }

    // Lấy slot đã phân công
    const slots = await TimetableSlot.find({ class: classId, week })
      .sort({ day: 1, session: 1, period: 1 })
      .lean();

    // Map thêm thông tin môn học
    const mappedSlots = slots.map(slot => {
      const subj = classroom.subjects.find(s => String(s.subject._id) === String(slot.subject));
      return {
        ...slot,
        subjectName: slot.subjectName || subj?.subject?.name || '',
        className: classroom.name,
        classGVCN: classroom.GVCN
      };
    });

    res.status(200).json({
      success: true,
      class: {
        _id: classroom._id,
        name: classroom.name,
        GVCN: classroom.GVCN,
        Khoi: classroom.Khoi,
        subjects: classroom.subjects.map(s => ({
          _id: s.subject._id,
          name: s.subject.name,
          ChuyenMon: s.subject.ChuyenMon,
          teacher: s.teacher || s.subject.teacher,
          SoTiet: s.SoTiet
        }))
      },
      week, 
      slots: mappedSlots
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy thời khóa biểu theo lớp', error: err.message });
  }
};

// Lấy thời khóa biểu theo giáo viên
const getTimetableByTeacher = async (req, res) => {
  try {
    const teacher = req.params.teacherName;
    const week = Number(req.query.week || 1);

    // Lấy slot giáo viên được phân công
    const slots = await TimetableSlot.find({ teacher, week })
      .sort({ day: 1, session: 1, period: 1 })
      .lean();

    // Lấy thông tin lớp và môn học cho từng slot
    const classIds = [...new Set(slots.map(s => String(s.class)))];
    const classrooms = await Classrom.find({ _id: { $in: classIds } })
      .populate({
        path: 'subjects.subject',
        model: Subject,
        select: 'name ChuyenMon teacher'
      })
      .lean();

    const mappedSlots = slots.map(slot => {
      const cls = classrooms.find(c => String(c._id) === String(slot.class));
      const subj = cls?.subjects.find(s => String(s.subject._id) === String(slot.subject));
      return {
        ...slot,
        className: cls?.name || '',
        classGVCN: cls?.GVCN || '',
        subjectName: slot.subjectName || subj?.subject?.name || '',
        subjectChuyenMon: subj?.subject?.ChuyenMon || false
      };
    });

    res.status(200).json({
      success: true,
      teacher,
      week,
      slots: mappedSlots
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy thời khóa biểu theo giáo viên', error: err.message });
  }
};

// Controller 1: Lấy danh sách lớp, có thể lọc theo khối
const getClassrooms = async (req, res) => {
try {
      const grade = req.query.grade; // optional
      let query = {};
      if (grade) query.Khoi = grade;

      const classrooms = await Classrom.find(query)
      .select('_id name Khoi GVCN subjects')
      .lean();

      res.status(200).json({
      success: true,
      classes: classrooms
      });
} catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách lớp', error: err.message });
}
};
    
// Controller 2: Lấy danh sách giáo viên duy nhất từ Classrom + subjects
const getTeachers = async (req, res) => {
try {
      const classrooms = await Classrom.find({}).select('GVCN subjects').lean();

      const teacherSet = new Set();

      classrooms.forEach(c => {
      if (c.GVCN) teacherSet.add(c.GVCN); // thêm GVCN
      (c.subjects || []).forEach(s => {
      if (s.teacher && s.teacher.trim() !== '') {
            teacherSet.add(s.teacher.trim());
      }
      });
      });

      res.status(200).json({
      success: true,
      teachers: Array.from(teacherSet)
      });
} catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách giáo viên', error: err.message });
}
};
   
const getSubClassRom = async (req, res) => {
  try {
    // Lấy danh sách lớp và populate thông tin subject
    const subClassRom = await Classrom.find({})
      .select('name Khoi GVCN subjects')
      .populate({
        path: 'subjects.subject',
        select: 'name teacher SoTiet ChuyenMon'
      })
      .lean(); // dùng lean để trả về plain object

    // Chỉ giữ thông tin cần thiết cho frontend
    const classrooms = subClassRom.map(classroom => {
      classroom.subjects = classroom.subjects.map(subj => ({
        name: subj.subject.name,
        teacher: subj.teacher || subj.subject.teacher,
        SoTiet: subj.SoTiet,
        ChuyenMon: subj.subject.ChuyenMon
      }));
      return classroom;
    });

    res.status(200).json({
      success: true,
      classrooms
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy danh sách lớp phụ', 
      error: err.message 
    });
  }
};

module.exports = {
      getSubClassRom,
      getTeachers,
      getClassrooms,
      getTimetableByClass,
      getTimetableByTeacher
};
