const Notification = require('../../model/Notification');
const messages = require('../../Extesions/messCost');

class NotificationQuery {
    async Handle(req, res) {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Người dùng không xác định'
            });
        }

        try {
            const allNotifications = await Notification.find({})
                .sort({ updated_at: -1 })
                .lean(); 

            const unreadNotifications = allNotifications.filter(noti =>
                !(noti.readBy || []).some(id => id.toString() === userId.toString())
            );

            const readNotifications = allNotifications.filter(noti =>
                (noti.readBy || []).some(id => id.toString() === userId.toString())
            );

            return res.status(200).json({
                success: true,
                message: messages.notification.Found,
                data: {
                    unread: unreadNotifications,
                    read: readNotifications
                }
            });

        } catch (err) {
            console.error('Error fetching notifications:', err);
            return res.status(500).json({
                success: false,
                message: messages.notification.FetchError
            });
        }
    }
}

module.exports = new NotificationQuery();
