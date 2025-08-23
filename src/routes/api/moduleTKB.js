const express = require('express');
const router = express.Router();
const CreateSubjectCommand = require('../../app/controllers/command/moduleTKB/Subject/Create');
const CreateClassCommand = require('../../app/controllers/command/moduleTKB/Class/Create');
const UpdateSubjectCommand = require('../../app/controllers/command/moduleTKB/Subject/Update');
const DeleteSubjectCommand = require('../../app/controllers/command/moduleTKB/Subject/Delete');
const SubjectQuery = require('../../app/controllers/query/ModuleTKB');
const AutoAssignCommand = require('../../app/controllers/command/moduleTKB/Assign/AutoAssign');
const teacherQuotaController = require("../../app/controllers/command/moduleTKB/Assign/teacherQuotaController");
const ExportAssignCommand = require('../../app/controllers/command/moduleTKB/Assign/ExportAssign');
const upload = require('../../app/Extesions/uploadAvatar');

router.post('/info/create', upload.none(), (req, res) => {
      CreateSubjectCommand.Handle(req, res);
});
router.put('/info/update/:id', upload.none(), (req, res) => {
      UpdateSubjectCommand.Handle(req, res);
});
router.delete('/info/delete/:id', upload.none(), (req, res) => {
      DeleteSubjectCommand.Handle(req, res);
});
router.get('/info/get-all', (req, res) => {
      SubjectQuery.GetAllSubjectt(req, res);
})

//Cài đặt lớp học
router.post('/caiDatLopHoc/create', upload.none(), (req, res) => {
      CreateClassCommand.Handle(req, res);
});

//Phân công
router.post('/auto-assign', (req, res) => {
      AutoAssignCommand.Handle(req, res);
})
router.get("/addteacherQuota", teacherQuotaController.seed);
router.get("/xuat-excel-hoc-sinh", ExportAssignCommand.Student);
router.get("/xuat-excel-day", ExportAssignCommand.Teacher);

module.exports = router;
