const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true },
    birthDate: Date,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    avatar: { type: String, default: null },
    address: String,
    phone: { type: String, match: [/^\d{10,15}$/, 'Số điện thoại không hợp lệ'] },
    email: { type: String, match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Email không hợp lệ'] },

    teacherCode: { type: String, unique: true, sparse: true },
    subjectSpecialization: String,
    academicLevel: { type: String },
    yearsOfExperience: Number,
    hireDate: Date,
    department: String,
    position: String,
    status: { type: String, enum: ['active', 'on_leave', 'inactive'], default: 'active' }
});

const accountSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['system_admin', 'school_admin', 'teacher', 'student', 'parent', 'staff'], required: true },
    profile: profileSchema,
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const Account = mongoose.model('Account', accountSchema);
module.exports = Account;
