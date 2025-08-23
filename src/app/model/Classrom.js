// Class.js
const mongoose = require('mongoose');
const ClassSubjectSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  SoTiet: { type: Number, min: 1, required: true },
  teacher: { type: String, trim: true },
});

const ClassromSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  GVCN: { type: String, required: true, trim: true },
  Khoi: { type: String, required: true, trim: true },
  SoLuongHocSinh: { type: Number, required: true, min: 0 },
  TongSoTiet: { type: Number, required: true, min: 0 },
  HocKy: { type: String, required: true, enum: ['1', '2'] },
  subjects: [ClassSubjectSchema]
}, { timestamps: true });

const Classrom = mongoose.model('Classrom', ClassromSchema);
module.exports = Classrom;
