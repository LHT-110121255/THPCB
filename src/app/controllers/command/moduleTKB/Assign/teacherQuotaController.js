// controllers/teacherQuotaController.js
const TeacherQuota = require("../../../../model/TeacherQuota");
const Classrom = require("../../../../model/Classrom");

async function seed(req, res) {
  try {
    const classes = await Classrom.find({}).lean();

    const mapClass = name => {
      const cls = classes.find(c => c.name === name);
      if (!cls) {
        console.warn(`[mapClass] Lớp "${name}" không tồn tại`);
        return null;
      }
      return cls._id;
    };

    // GVCN: chủ nhiệm
    const gvcnList = [
      { teacher: 'Linh', className: '1/1', targetPeriodsPerWeek: 19 },
      { teacher: 'Nhanh', className: '2/1', targetPeriodsPerWeek: 19 },
      { teacher: 'Mây', className: '2/2', targetPeriodsPerWeek: 19 },
      { teacher: 'Loan', className: '3/1', targetPeriodsPerWeek: 19 },
      { teacher: 'Diệp', className: '3/2', targetPeriodsPerWeek: 19 },
      { teacher: 'Thu', className: '4/1', targetPeriodsPerWeek: 15 },
      { teacher: 'Tú Anh', className: '5/1', targetPeriodsPerWeek: 19 },
      { teacher: 'Thươne', className: '5/2', targetPeriodsPerWeek: 19 },
    ];

    // Giáo viên chuyên môn
    const specialTeachers = [
      { teacher: 'Đa', subject: 'GDTC' },
      { teacher: 'Đi', subject: 'MT' },
      { teacher: 'Thảo', subject: 'TA' },
      { teacher: 'A', subject: 'TIN HỌC' },
      { teacher: 'B', subject: 'Ngữ Văn Khmer' },
    ];

    // Hiệu trưởng / Phó hiệu trưởng / TPT
    const adminTeachers = [
      { teacher: 'Thống', extraFixedLoads: [
          { className: '3/1', subjectName: 'Misc', periods: 1 },
          { className: '5/1', subjectName: 'Misc', periods: 1 },
        ] },
      { teacher: 'Trí', extraFixedLoads: [
          { className: '1/1', subjectName: 'Misc', periods: 2 },
          { className: '5/2', subjectName: 'Misc', periods: 2 },
        ] },
      { teacher: 'Thành', extraFixedLoads: [
          { className: '1/1', subjectName: 'Misc', periods: 2 },
          { className: '2/1', subjectName: 'Misc', periods: 2 },
          { className: '2/2', subjectName: 'Misc', periods: 2 },
          { className: '3/1', subjectName: 'Misc', periods: 2 },
        ] },
    ];

    let data = [];

    // 1. Seed GVCN
    gvcnList.forEach(gv => {
      const clsId = mapClass(gv.className);
      data.push({
        teacher: gv.teacher,
        targetPeriodsPerWeek: gv.targetPeriodsPerWeek,
        extraFixedLoads: [
          { class: clsId, subjectName: 'Tiếng Việt', periods: 4 },
          { class: clsId, subjectName: 'Toán', periods: 4 },
          { class: clsId, subjectName: 'SHTT', periods: 1 },
        ].filter(l => l.class),
      });
    });

    // 2. Seed giáo viên chuyên môn
    specialTeachers.forEach(t => {
      const loads = [];
      classes.forEach(cls => {
        let periods = 1;
        if (t.subject === 'TA') periods = 4;
        else if (t.subject === 'GDTC') periods = 2;
        else if (t.subject === 'MT') periods = 1;
        else if (t.subject === 'TIN HỌC') periods = 1;
        else if (t.subject === 'Ngữ Văn Khmer') periods = 2;

        loads.push({ class: cls._id, subjectName: t.subject, periods });
      });
      data.push({
        teacher: t.teacher,
        targetPeriodsPerWeek: loads.reduce((sum, l) => sum + l.periods, 0),
        extraFixedLoads: loads,
      });
    });

    // 3. Seed adminTeachers
    adminTeachers.forEach(t => {
      data.push({
        teacher: t.teacher,
        targetPeriodsPerWeek: t.extraFixedLoads.reduce((sum, l) => sum + l.periods, 0),
        extraFixedLoads: t.extraFixedLoads.map(l => ({
          class: mapClass(l.className),
          subjectName: l.subjectName,
          periods: l.periods,
        })).filter(l => l.class),
      });
    });

    // Xoá dữ liệu cũ và insert mới
    await TeacherQuota.deleteMany({});
    await TeacherQuota.insertMany(data);

    return res.json({ success: true, message: 'Seed TeacherQuota theo rule đầy đủ thành công!' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { seed };
