const express = require("express");
const router = express.Router();

const userRoute = require("./user");
const moduleTKRoute = require("./moduleTK");
const teacherRoute = require("./teacher");
const moduleTKBRoute = require("./moduleTKB");
const Login = require("../../app/controllers/command/user/Login");
const ThoiKhoaBieuQuery = require('../../app/controllers/query/ThoiKhoaBieu');

const authenticateToken = require("../../app/middleware/authenticateTokenAdmin");


router.use("/login", (req, res) => {
  Login.Handle(req, res);
});

router.post("/logout", (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Không thể đăng xuất, xin thử lại!",
        });
      }

      res.clearCookie("token");

      return res.status(200).json({
        success: true,
        message: "Đăng xuất thành công!",
      });
    });
  } catch (error) {
    console.error("Lỗi khi đăng xuất:", error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi đăng xuất. Vui lòng thử lại!",
    });
  }
});

// Protected routes

router.get("/tkb/xemthoikhoabieuClass/:classId", ThoiKhoaBieuQuery.getTimetableByClass)
router.get("/tkb/xemthoikhoabieuTeacher/:teacherName", ThoiKhoaBieuQuery.getTimetableByTeacher)
router.get("/tkb/classrooms", ThoiKhoaBieuQuery.getClassrooms);
router.get("/tkb/teachers", ThoiKhoaBieuQuery.getTeachers);
router.use("/user", authenticateToken, userRoute);
router.use("/teacher", authenticateToken, teacherRoute);
router.use("/thong-ke", authenticateToken, moduleTKRoute);
router.use("/tkb", authenticateToken, moduleTKBRoute);

module.exports = router;
