const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    description: {
        type: String,
        default: '',
        trim: true
    },
    role: {
        type: String,
        enum: ['system_admin', 'device_manager', 'gift_manager'],
        required: true
    },
    url: {
        type: String,
        default: '',
        trim: true
    },
    readBy: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Account'
        }
    ],
    type: {
        type: String,
        enum: ['info', 'warning', 'success'],
        default: 'info'
    },
    title: {
        type: String,
        trim: true,
        default: ''
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

NotificationSchema.index({ role: 1, created_at: -1 });
NotificationSchema.index({ readBy: 1 });

NotificationSchema.pre('save', function (next) {
    if (this.isModified('isRead')) {
        this.updated_at = new Date();
    }
    next();
});


const Notification = mongoose.model('Notification', NotificationSchema);

module.exports = Notification;
