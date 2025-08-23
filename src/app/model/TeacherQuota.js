// models/TeacherQuota.js
const mongoose = require('mongoose');

const ExplicitLoadSchema = new mongoose.Schema({
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Classrom', required: true },
  subjectName: { type: String, required: true, trim: true }, // ví dụ: 'GDTC', 'MT', 'TA', 'Ngữ Văn Khmer'
  periods: { type: Number, required: true, min: 1 },
}, { _id: false });

const TeacherQuotaSchema = new mongoose.Schema({
  teacher: { type: String, required: true, trim: true, unique: true },
  targetPeriodsPerWeek: { type: Number, required: true, min: 0 }, // ví dụ 19, 15...
  // nếu là GVCN thì thường đã nằm trong Classrom.GVCN và coreSubjects sẽ do controller tự hiểu
  extraFixedLoads: [ExplicitLoadSchema], // các phân bổ cứng (ví dụ Đa - GDTC 2 tiết mỗi lớp...)
  notes: { type: String, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('TeacherQuota', TeacherQuotaSchema);
