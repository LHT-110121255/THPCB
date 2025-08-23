const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema({
    accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account",
        required: true,
        unique: true 
    },
    grade: { type: String, trim: true }, 
    class_assigned: { type: String, trim: true },
    position: { type: String, trim: true }, 
    qualifications: { type: String, trim: true }, 
    yearsOfExperience: { type: Number, default: 0 },
    subjects: [{ type: String, trim: true }], 
    status: { 
        type: String, 
        enum: ["active", "retired", "on_leave"], 
        default: "active" 
    },
    borrowedAssets: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "BorrowRequest" 
    }],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

teacherSchema.pre("save", function (next) {
    this.updated_at = Date.now();
    next();
});

module.exports = mongoose.model("Teacher", teacherSchema);
