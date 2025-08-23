const Device = require("../../model/Device");
const DeviceItem = require("../../model/DeviceItem");
const Teacher = require("../../model/Teacher");
const Room = require("../../model/Room");
const messages = require("../../Extesions/messCost");
const BorrowRequest = require("../../model/BorrowRequest");
const Gift = require("../../model/Gift");
const Order = require("../../model/Order");
const mongoose = require("mongoose");

class StatisticQuery {

    async IndexBorrowReturn(req, res, next) {
        res.status(200).render('pages/statisticBorrowReturn', { layout: 'main'});
    }

    async IndexDevice(req, res, next) {
        res.status(200).render('pages/statisticDevice', { layout: 'main'});
    }

    async IndexReward(req, res, next) {
        res.status(200).render('pages/statisticReward', { layout: 'main'});
    }

    async StatisticBorrowReturn(req, res, next) {
        try {
            // 1. Tổng số lượt mượn
            const totalBorrowRequests = await BorrowRequest.countDocuments();

            // 2. Tổng số lượt mượn theo trạng thái
            const [countDangMuon, countDaTra, countQuaHan] = await Promise.all([
                BorrowRequest.countDocuments({ status: "Đang mượn" }),
                BorrowRequest.countDocuments({ status: "Đã trả" }),
                BorrowRequest.countDocuments({ status: "Quá hạn" }),
            ]);

            // 3. Tổng số giáo viên đã từng mượn
            const totalTeachersWithBorrow = await Teacher.countDocuments({
                borrowedDevices: { $exists: true, $not: { $size: 0 } }
            });

            res.status(200).json({
                success: true,
                data: {
                    totalBorrowRequests,
                    totalTeachersWithBorrow,
                    statusCounts: {
                        "Đang mượn": countDangMuon,
                        "Đã trả": countDaTra,
                        "Quá hạn": countQuaHan,
                    }
                }
            });
        } catch (error) {
            console.error("Lỗi thống kê mượn trả:", error);
            res.status(500).json({ success: false, message: "Lỗi server khi thống kê mượn trả" });
        }
    }

    // thống kê mượn trả
    async StatisticBorrowByDate(req, res, next) {
        try {
            // Thống kê theo ngày (có thể tuỳ chỉnh theo tháng/năm nếu cần)
            const data = await BorrowRequest.aggregate([
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y-%m-%d", date: "$borrow_date" }
                        },
                        total: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);
    
            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            console.error("Lỗi thống kê theo ngày:", error);
            res.status(500).json({ success: false, message: "Lỗi server khi thống kê theo ngày" });
        }
    }

    async StatisticBorrowByTeacher(req, res, next) {
        try {
            const topTeachers = await BorrowRequest.aggregate([
                {
                    $group: {
                        _id: "$teacher",
                        totalBorrowed: { $sum: 1 }
                    }
                },
                {
                    $sort: { totalBorrowed: -1 }
                },
                {
                    $limit: 10 // Top 10 giáo viên mượn nhiều nhất
                },
                {
                    $lookup: {
                        from: "teachers",
                        localField: "_id",
                        foreignField: "_id",
                        as: "teacher"
                    }
                },
                {
                    $unwind: "$teacher"
                },
                {
                    $project: {
                        _id: 0,
                        teacherId: "$teacher._id",
                        name: "$teacher.name",
                        email: "$teacher.email",
                        department: "$teacher.department",
                        totalBorrowed: 1
                    }
                }
            ]);
    
            res.status(200).json({
                success: true,
                data: topTeachers
            });
        } catch (error) {
            console.error("Lỗi thống kê theo giáo viên:", error);
            res.status(500).json({ success: false, message: "Lỗi server khi thống kê giáo viên mượn" });
        }
    }
    
    async StatisticBorrowByDevice(req, res, next) {
        try {
            const mostBorrowedDevices = await BorrowRequest.aggregate([
                { $unwind: "$devices" },
                {
                    $group: {
                        _id: "$devices.device",
                        totalBorrowed: { $sum: "$devices.quantity" }
                    }
                },
                { $sort: { totalBorrowed: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: "devices",
                        localField: "_id",
                        foreignField: "_id",
                        as: "device"
                    }
                },
                { $unwind: "$device" },
                {
                    $project: {
                        _id: 0,
                        deviceId: "$device._id",
                        name: "$device.name",
                        category: "$device.category",
                        totalBorrowed: 1
                    }
                }
            ]);
    
            res.status(200).json({
                success: true,
                data: mostBorrowedDevices
            });
        } catch (error) {
            console.error("Lỗi thống kê thiết bị:", error);
            res.status(500).json({ success: false, message: "Lỗi server khi thống kê thiết bị" });
        }
    }
    
    async StatisticActiveBorrowings(req, res, next) {
        try {
            const active = await BorrowRequest.find({ status: "Đang mượn" })
                .populate("teacher", "name email")
                .populate("deviceItems")
                .populate("devices.device", "name category");
    
            const formatted = active.map(req => ({
                teacher: req.teacher,
                borrow_date: req.borrow_date,
                devices: req.devices.map(d => ({
                    name: d.device?.name,
                    category: d.device?.category,
                    quantity: d.quantity
                })),
                deviceItems: req.deviceItems,
            }));
    
            res.status(200).json({
                success: true,
                data: formatted
            });
        } catch (error) {
            console.error("Lỗi thống kê thiết bị đang mượn:", error);
            res.status(500).json({ success: false, message: "Lỗi server khi thống kê đang mượn" });
        }
    }

    async StatisticBorrowByRoom(req, res, next) {
        try {
            const match = {};
    
            // Lọc theo tháng nếu có ?month=YYYY-MM
            if (req.query.month) {
                const [year, month] = req.query.month.split("-");
                const start = new Date(`${year}-${month}-01`);
                const end = new Date(start);
                end.setMonth(end.getMonth() + 1);
                match.borrow_date = { $gte: start, $lt: end };
            }
    
            const roomStats = await BorrowRequest.aggregate([
                { $match: { ...match, room: { $ne: null } } },
                {
                    $group: {
                        _id: "$room",
                        total: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: "rooms",
                        localField: "_id",
                        foreignField: "_id",
                        as: "room"
                    }
                },
                { $unwind: "$room" },
                {
                    $project: {
                        _id: 0,
                        roomId: "$room._id",
                        roomName: "$room.name",
                        total: 1
                    }
                },
                { $sort: { total: -1 } }
            ]);
    
            res.status(200).json({
                success: true,
                data: roomStats
            });
        } catch (error) {
            console.error("Lỗi thống kê theo phòng:", error);
            res.status(500).json({ success: false, message: "Lỗi server khi thống kê theo phòng" });
        }
    }
    
    // thống kê thiết bị
    async summaryByCategory(req, res) {
        try {
            const result = await Device.aggregate([
                {
                    $group: {
                        _id: "$category",
                        total: { $sum: "$total_quantity" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        category: "$_id",
                        total: 1
                    }
                }
            ]);
            res.json({ success: true, data: result });
        } catch (err) {
            res.status(500).json({ success: false, message: "Lỗi thống kê theo loại", error: err.message });
        }
    }

    async statusCounts(req, res) {
        try {
            const result = await DeviceItem.aggregate([
                {
                    $group: {
                        _id: "$status",
                        total: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        status: "$_id",
                        total: 1
                    }
                }
            ]);
            res.json({ success: true, data: result });
        } catch (err) {
            res.status(500).json({ success: false, message: "Lỗi thống kê trạng thái", error: err.message });
        }
    }

    async mostUsed(req, res) {
        try {
            const result = await BorrowRequest.aggregate([
                { $unwind: "$devices" },
                {
                    $group: {
                        _id: "$devices.device",
                        totalBorrowed: { $sum: "$devices.quantity" }
                    }
                },
                {
                    $lookup: {
                        from: "devices",
                        localField: "_id",
                        foreignField: "_id",
                        as: "device"
                    }
                },
                { $unwind: "$device" },
                {
                    $project: {
                        _id: 0,
                        name: "$device.name",
                        category: "$device.category",
                        totalBorrowed: 1
                    }
                },
                { $sort: { totalBorrowed: -1 } },
                { $limit: 10 }
            ]);
            res.json({ success: true, data: result });
        } catch (err) {
            res.status(500).json({ success: false, message: "Lỗi thống kê mượn nhiều", error: err.message });
        }
    }

    async byRoom(req, res) {
        try {
            const result = await DeviceItem.aggregate([
                { $match: { room: { $ne: null } } },
                {
                    $group: {
                        _id: "$room",
                        total: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: "rooms",
                        localField: "_id",
                        foreignField: "_id",
                        as: "room"
                    }
                },
                { $unwind: "$room" },
                {
                    $project: {
                        roomName: "$room.name",
                        total: 1
                    }
                },
                { $sort: { total: -1 } }
            ]);
            res.json({ success: true, data: result });
        } catch (err) {
            res.status(500).json({ success: false, message: "Lỗi thống kê theo phòng", error: err.message });
        }
    }

    async upcomingMaintenance(req, res) {
        try {
            const today = new Date();
            const next30Days = new Date();
            next30Days.setDate(today.getDate() + 30);

            const result = await DeviceItem.find({
                last_maintenance: { $ne: null },
                status: { $ne: "Hỏng" },
                $expr: {
                    $lt: [
                        {
                            $add: ["$last_maintenance", 1000 * 60 * 60 * 24 * 180] // ví dụ mỗi 6 tháng bảo trì
                        },
                        next30Days
                    ]
                }
            })
                .populate("device")
                .sort({ last_maintenance: -1 });

            res.json({ success: true, data: result });
        } catch (err) {
            res.status(500).json({ success: false, message: "Lỗi thống kê bảo trì", error: err.message });
        }
    }

    async inMainWarehouse(req, res) {
        try {
          const mainRoom = await Room.ensureMainWarehouse();
      
          const result = await DeviceItem.aggregate([
            {
              $match: {
                room: mainRoom._id
              }
            },
            {
              $lookup: {
                from: "devices",
                localField: "device",
                foreignField: "_id",
                as: "device"
              }
            },
            { $unwind: "$device" },
            {
              $group: {
                _id: "$device.name",
                category: { $first: "$device.category" },
                total: { $sum: 1 }
              }
            },
            {
              $project: {
                _id: 0,
                name: "$_id",
                category: 1,
                total: 1
              }
            },
            { $sort: { total: -1 } }
          ]);
      
          res.json({ success: true, data: result });
        } catch (err) {
          res.status(500).json({
            success: false,
            message: "Lỗi thống kê thiết bị trong Kho chính (room)",
            error: err.message
          });
        }
      }

    //Thống kê quà tặng
    async giftSummaryByCategory(req, res) {
        try {
            const result = await Gift.aggregate([
                {
                    $group: {
                        _id: "$category",
                        total: { $sum: "$quantity_in_stock" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        category: "$_id",
                        total: 1
                    }
                }
            ]);
            res.json({ success: true, data: result });
        } catch (err) {
            res.status(500).json({ success: false, message: "Lỗi thống kê theo loại quà tặng", error: err.message });
        }
    }
    
    async giftStock(req, res) {
        try {
            const result = await Gift.find({}, "name quantity_in_stock").sort({ quantity_in_stock: -1 });
            res.json({ success: true, data: result });
        } catch (err) {
            res.status(500).json({ success: false, message: "Lỗi thống kê tồn kho", error: err.message });
        }
    }
    
    async mostRequestedGifts(req, res) {
        try {
          const result = await Order.aggregate([
            { $unwind: "$orders" }, 
            {
              $group: {
                _id: "$orders.giftId", 
                totalRequested: { $sum: "$orders.quantity" }
              }
            },
            {
              $lookup: {
                from: "gifts",
                localField: "_id",
                foreignField: "_id",
                as: "gift"
              }
            },
            { $unwind: "$gift" },
            {
              $project: {
                _id: 0,
                name: "$gift.name",
                category: "$gift.category",
                totalRequested: 1
              }
            },
            { $sort: { totalRequested: -1 } },
            { $limit: 10 }
          ]);
      
          res.json({ success: true, data: result });
        } catch (err) {
          res.status(500).json({
            success: false,
            message: "Lỗi thống kê yêu cầu quà tặng",
            error: err.message
          });
        }
      }
    
    async rewardRequestByMonth(req, res) {
        try {
          const result = await Order.aggregate([
            { $unwind: "$orders" }, 
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m", date: "$created_at" }
                },
                total: { $sum: "$orders.quantity" }
              }
            },
            { $sort: { _id: 1 } }
          ]);
      
          res.json({ success: true, data: result });
        } catch (err) {
          res.status(500).json({
            success: false,
            message: "Lỗi thống kê theo tháng",
            error: err.message
          });
        }
      }
    
      async mostActiveTeachers(req, res) {
        try {
          const result = await Order.aggregate([
            { $unwind: "$orders" }, 
            {
              $group: {
                _id: "$teacher",
                totalRequested: { $sum: "$orders.quantity" }
              }
            },
            {
              $lookup: {
                from: "teachers",
                localField: "_id",
                foreignField: "_id",
                as: "teacher"
              }
            },
            { $unwind: "$teacher" },
            {
              $project: {
                _id: 0,
                name: "$teacher.name",
                email: "$teacher.email",
                totalRequested: 1
              }
            },
            { $sort: { totalRequested: -1 } },
            { $limit: 10 }
          ]);
      
          res.json({ success: true, data: result });
        } catch (err) {
          res.status(500).json({
            success: false,
            message: "Lỗi thống kê giáo viên yêu cầu",
            error: err.message
          });
        }
      }
    
};

module.exports = new StatisticQuery;