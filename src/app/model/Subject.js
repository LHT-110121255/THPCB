// Subject.js
const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  ChuyenMon: { type: Boolean, default: false },
  teacher: { type: String, trim: true },
  SoTiet: { type: Number, required: false, min: 0 },
}, { timestamps: true });

const Subject = mongoose.model('Subject', SubjectSchema);
module.exports = Subject;
