// models/Timetable.js
const mongoose = require('mongoose');

const TimetableSlotSchema = new mongoose.Schema({
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Classrom', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: false, default: null },
  subjectName: { type: String, required: true, trim: true },
  teacher: { type: String, required: true, trim: true }, // tên giáo viên
  day: { type: Number, required: true, min: 2, max: 8 }, // 2=Thứ2 ... 8=CN
  session: { type: String, enum: ['Sáng', 'Chiều'], required: true },
  period: { type: Number, required: true, min: 1 }, // Tiết thứ mấy trong phiên
  week: { type: Number, default: 1 }, // mở rộng cho nhiều tuần về sau
}, { timestamps: true });

TimetableSlotSchema.index({ class: 1, day: 1, session: 1, period: 1, week: 1 }, { unique: true });
TimetableSlotSchema.index({ teacher: 1, day: 1, session: 1, period: 1, week: 1 });

module.exports = mongoose.model('TimetableSlot', TimetableSlotSchema);
