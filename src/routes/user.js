const express = require('express');
const router  = express.Router();
const UserQuery = require('../app/controllers/query/UserQuery');
const TeacherQuery = require('../app/controllers/query/TeacherQuery');
const authenticateToken = require('../app/middleware/authenticateTokenAdmin');

router.use('/addUser', authenticateToken, UserQuery.AddUser);
router.use('/profile/:id', authenticateToken, UserQuery.ProfileUser);
router.use('/updateUser/:id', authenticateToken, UserQuery.UpdateUser);
router.use('/ListAllUser', authenticateToken, UserQuery.ListAllUser);

//router teacher
router.use('/ListAllTeacher', authenticateToken, TeacherQuery.ListAllTeacher);
router.use('/addTeacher', authenticateToken, TeacherQuery.AddTeacher);
router.use('/updateTeacher', authenticateToken, TeacherQuery.UpdateTeacher);



module.exports = router;