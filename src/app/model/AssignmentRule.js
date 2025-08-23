// models/AssignmentRule.js
const mongoose = require("mongoose");

const AssignmentRuleSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ["teacher", "class", "subject"], 
    required: true 
  },
  targetId: { type: mongoose.Schema.Types.ObjectId }, // teacherId / classId / subjectId
  condition: { type: String, required: true }, // mô tả điều kiện ("no_morning", "max_5_periods", "consecutive_required")
  value: { type: String } // giá trị bổ sung ("2", "only_4_5", ...)
}, { timestamps: true });

module.exports = mongoose.model("AssignmentRule", AssignmentRuleSchema);
