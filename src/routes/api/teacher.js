const express = require("express");
const router = express.Router();
const multer = require('multer');
const upload = multer();
const ImportTeachers = require("../../app/controllers/command/teacher/ImportTeachers");
const UpdateTeacher = require("../../app/controllers/command/teacher/UpdateTeacher");
const DeleteTeacher = require("../../app/controllers/command/teacher/DeleteTeacher");
const TeacherQuery = require("../../app/controllers/query/TeacherQuery");


router.put("/update/:teacherId", upload.none(), (req, res) => {
  UpdateTeacher.Handle(req, res);
});
router.delete("/delete/:teacherId", (req, res) => {
  DeleteTeacher.Handle(req, res);
});
router.get("/getAll", (req, res) => TeacherQuery.GetAllTeachers(req, res));
router.get("/getById/:teacherId", (req, res) => TeacherQuery.GetTeacherById(req, res));

module.exports = router;
